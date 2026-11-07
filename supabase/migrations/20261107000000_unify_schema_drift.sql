-- ==============================================================================
-- UNIFIED SCHEMA DRIFT, ACID TRANSACTIONS & PERFORMANCE MIGRATION
-- Migration: 20261107000000_unify_schema_drift.sql
-- ==============================================================================

-- 1. Ensure Enum Values exist
DO $$ BEGIN
  ALTER TYPE enrollment_status ADD VALUE IF NOT EXISTS 'confirmed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'verified';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'delivered';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Class Sessions: add ended_at
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- 3. Profiles: add email column and update trigger
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, is_active, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'customer',
    true,
    new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    phone = CASE WHEN profiles.phone = '' THEN EXCLUDED.phone ELSE profiles.phone END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Products: add featured, soft delete columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_client_work BOOLEAN DEFAULT false;

-- 5. Settings: add social_links column
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"facebook":"","instagram":"","telegram":"","linkedin":""}'::jsonb;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tax_id TEXT DEFAULT 'TIN-009823412';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS settlement_days INTEGER DEFAULT 3;

-- 6. Order Items: Fix Custom Design Order Conversion
-- Allow product_id to be NULL when an item is a custom packaging design commission
ALTER TABLE public.order_items ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS custom_design_id UUID REFERENCES public.designs(id) ON DELETE SET NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_order_items_product_or_design'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT chk_order_items_product_or_design
      CHECK (product_id IS NOT NULL OR custom_design_id IS NOT NULL);
  END IF;
END $$;

-- 7. Distributed Rate Limiting Table & Atomic Token-Bucket RPC
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON public.rate_limits(reset_at);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_limit INT,
  p_window_seconds INT
)
RETURNS JSONB AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_reset_at TIMESTAMPTZ;
  v_count INT;
BEGIN
  -- Cleanup expired row for this key if past reset
  DELETE FROM public.rate_limits WHERE key = p_key AND reset_at <= v_now;

  -- Upsert token bucket counter
  INSERT INTO public.rate_limits (key, count, reset_at)
  VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::interval)
  ON CONFLICT (key) DO UPDATE
    SET count = public.rate_limits.count + 1
  RETURNING count, reset_at INTO v_count, v_reset_at;

  IF v_count > p_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_seconds', GREATEST(1, EXTRACT(EPOCH FROM (v_reset_at - v_now))::int)
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', GREATEST(0, p_limit - v_count),
      'reset_seconds', GREATEST(1, EXTRACT(EPOCH FROM (v_reset_at - v_now))::int)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Atomic Order Placement RPC with Inventory Check & Decrement
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_buyer_id UUID,
  p_bank_account_id UUID,
  p_delivery_address TEXT,
  p_phone TEXT,
  p_notes TEXT,
  p_payment_proof_path TEXT,
  p_items JSONB,
  p_created_by UUID,
  p_audit_note TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
  v_buyer RECORD;
  v_bank RECORD;
  v_order_number TEXT;
  v_order_id UUID;
  v_initial_status order_status;
  v_calculated_total NUMERIC(10,2) := 0.00;
  v_item JSONB;
  v_prod_id UUID;
  v_qty INT;
  v_prod RECORD;
BEGIN
  -- 1. Validate Buyer
  SELECT id, is_active INTO v_buyer FROM public.profiles WHERE id = p_buyer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer account does not exist.';
  END IF;
  IF NOT v_buyer.is_active THEN
    RAISE EXCEPTION 'Customer account is deactivated.';
  END IF;

  -- 2. Validate Bank Account
  SELECT id, is_active, bank_name INTO v_bank FROM public.bank_accounts WHERE id = p_bank_account_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected settlement bank account is invalid.';
  END IF;
  IF NOT v_bank.is_active THEN
    RAISE EXCEPTION 'Selected settlement bank account is currently not active.';
  END IF;

  -- 3. Validate items array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item.';
  END IF;

  -- 4. Generate order number
  v_order_number := 'ARN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');
  v_initial_status := CASE WHEN p_payment_proof_path IS NOT NULL AND p_payment_proof_path <> ''
                           THEN 'pending_verification'::order_status
                           ELSE 'pending_payment'::order_status END;

  -- 5. Lock and validate each product, check stock, and calculate total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := (v_item->>'productId')::uuid;
    v_qty := (v_item->>'quantity')::int;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than zero.';
    END IF;

    -- Row-level lock to prevent concurrent stock race conditions
    SELECT id, name, price, is_available, is_client_work, stock_quantity
    INTO v_prod
    FROM public.products
    WHERE id = v_prod_id AND (is_deleted IS NOT TRUE)
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % does not exist.', v_prod_id;
    END IF;

    IF v_prod.is_client_work THEN
      RAISE EXCEPTION 'Product "%" is an exclusive showcase and cannot be ordered directly.', v_prod.name;
    END IF;

    IF NOT v_prod.is_available THEN
      RAISE EXCEPTION 'Product "%" is currently unavailable.', v_prod.name;
    END IF;

    IF v_prod.stock_quantity IS NOT NULL AND v_prod.stock_quantity < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for product "%" (Available: %, Requested: %).',
        v_prod.name, v_prod.stock_quantity, v_qty;
    END IF;

    -- Decrement stock atomically
    IF v_prod.stock_quantity IS NOT NULL THEN
      UPDATE public.products
      SET stock_quantity = stock_quantity - v_qty,
          updated_at = timezone('utc'::text, now())
      WHERE id = v_prod_id;
    END IF;

    v_calculated_total := v_calculated_total + (v_prod.price * v_qty);
  END LOOP;

  -- 6. Insert Order
  INSERT INTO public.orders (
    order_number,
    buyer_id,
    status,
    total_price,
    delivery_address,
    phone,
    notes,
    bank_account_id,
    payment_proof_path
  ) VALUES (
    v_order_number,
    p_buyer_id,
    v_initial_status,
    v_calculated_total,
    COALESCE(p_delivery_address, ''),
    COALESCE(p_phone, ''),
    COALESCE(p_notes, ''),
    p_bank_account_id,
    COALESCE(p_payment_proof_path, '')
  )
  RETURNING id INTO v_order_id;

  -- 7. Insert Order Items with price snapshot
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := (v_item->>'productId')::uuid;
    v_qty := (v_item->>'quantity')::int;

    SELECT price INTO v_prod FROM public.products WHERE id = v_prod_id;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      quantity,
      unit_price_snapshot
    ) VALUES (
      v_order_id,
      v_prod_id,
      v_qty,
      v_prod.price
    );
  END LOOP;

  -- 8. Insert Order Status History
  INSERT INTO public.order_status_history (
    order_id,
    from_status,
    to_status,
    changed_by,
    note
  ) VALUES (
    v_order_id,
    null,
    v_initial_status::text,
    p_created_by,
    COALESCE(p_audit_note, 'Order created via atomic transaction.')
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_price', v_calculated_total,
    'status', v_initial_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
