-- ==============================================================================
-- SECURITY HARDENING MIGRATION: Ethiopia Arenguade Paper Product
-- Date: 2026-11-10
-- Fixes:
--   1. Enable RLS & revoke anon/authenticated access on public.rate_limits and session_registrations
--   2. Add SET search_path to all SECURITY DEFINER functions
--   3. Enforce caller identity (auth.uid()) & revoke anon EXECUTE on create_order_atomic,
--      create_enrollment, register_for_session*, and check_rate_limit
--   4. Fix create_enrollment capacity bypass when reactivating cancelled/rejected rows
--   5. Drop legacy permissive RLS policies (enrollments, storage.objects, etc.)
--   6. Tighten SELECT RLS on profiles, products, bank_accounts, class_sessions
--   7. Restrict INSERT/UPDATE RLS on orders, order_items, order_status_history, designs,
--      enrollments, notifications, audit_log + add BEFORE UPDATE integrity triggers
--   8. Lock down legacy public storage buckets (dielines, payment-screenshots, submitted-designs)
--   9. Revoke SELECT on class_sessions.livekit_room_name from anon and authenticated
-- ==============================================================================

-- 1. Enable RLS and lock down rate_limits & legacy session_registrations
ALTER TABLE IF EXISTS public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rate_limits FROM PUBLIC, anon, authenticated;

ALTER TABLE IF EXISTS public.session_registrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.session_registrations FROM PUBLIC, anon, authenticated;

-- 2. Harden SECURITY DEFINER helper functions with explicit search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_temp
AS $fn$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_temp
AS $fn$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('teacher', 'admin') AND is_active = true
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_temp
AS $fn$
DECLARE v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role
  FROM public.profiles
  WHERE id = auth.uid() AND is_active = true;
  RETURN COALESCE(v_role, 'visitor');
END;
$fn$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
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
    full_name = CASE WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    phone = CASE WHEN public.profiles.phone = '' THEN EXCLUDED.phone ELSE public.profiles.phone END;
  RETURN new;
END;
$fn$;

-- Prevent non-admins from escalating role OR reactivating deactivated accounts
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
DECLARE
  jwt_role text;
BEGIN
  jwt_role := coalesce(current_setting('request.jwt.claim.role', true), auth.role());
  IF jwt_role = 'service_role' OR session_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access denied: only administrators can change user roles.';
    END IF;
  END IF;

  IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access denied: only administrators can change account active status.';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_self_escalation();

-- 3. Harden check_rate_limit with search_path and revoke from public/anon/authenticated
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_limit INT,
  p_window_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $fn$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_reset_at TIMESTAMPTZ;
  v_count INT;
BEGIN
  DELETE FROM public.rate_limits WHERE key = p_key AND reset_at <= v_now;

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
$fn$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int, int) TO service_role;

-- 4. Harden create_order_atomic (auth.uid() check, quantity bounds, search_path, grants)
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
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
DECLARE
  v_jwt_role text;
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
  v_jwt_role := current_setting('request.jwt.claim.role', true);
  IF v_jwt_role IS NOT NULL
     AND v_jwt_role <> 'service_role'
     AND session_user NOT IN ('postgres', 'supabase_admin') THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required.';
    END IF;
    IF p_buyer_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access denied: cannot place orders on behalf of another user.';
    END IF;
    IF p_created_by IS NOT NULL AND p_created_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Access denied: invalid actor ID.';
    END IF;
  END IF;

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

    IF v_qty IS NULL OR v_qty <= 0 OR v_qty > 10000 THEN
      RAISE EXCEPTION 'Item quantity must be between 1 and 10,000.';
    END IF;

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
$fn$;

REVOKE ALL ON FUNCTION public.create_order_atomic(uuid, uuid, text, text, text, text, jsonb, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(uuid, uuid, text, text, text, text, jsonb, uuid, text) TO authenticated, service_role;

-- 5. Harden create_enrollment + aliases (auth.uid() check, capacity check on re-submit, search_path, grants)
CREATE OR REPLACE FUNCTION public.create_enrollment(
  p_session_id         UUID,
  p_student_id         UUID,
  p_payment_proof_path TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
DECLARE
  v_jwt_role     text;
  v_session      RECORD;
  v_active_count INTEGER;
  v_existing     RECORD;
  v_enroll_id    UUID;
BEGIN
  v_jwt_role := current_setting('request.jwt.claim.role', true);
  IF v_jwt_role IS NOT NULL
     AND v_jwt_role <> 'service_role'
     AND session_user NOT IN ('postgres', 'supabase_admin') THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required.';
    END IF;
    IF p_student_id IS DISTINCT FROM auth.uid() AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access denied: cannot enroll another user.';
    END IF;
  END IF;

  -- Lock the session row to prevent concurrent over-capacity inserts
  SELECT id, capacity, status, starts_at
  INTO   v_session
  FROM   public.class_sessions
  WHERE  id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_found: session % not found', p_session_id;
  END IF;

  IF v_session.status <> 'scheduled' THEN
    RAISE EXCEPTION 'session_not_open: status is %, not scheduled', v_session.status;
  END IF;

  IF v_session.starts_at IS NOT NULL AND v_session.starts_at <= timezone('utc', now()) THEN
    RAISE EXCEPTION 'session_in_past: this session has already started or ended';
  END IF;

  -- Duplicate check
  SELECT id, status INTO v_existing
  FROM   public.enrollments
  WHERE  session_id = p_session_id AND student_id = p_student_id;

  IF v_existing.id IS NOT NULL AND v_existing.status IN ('approved','confirmed','pending_verification') THEN
    RAISE EXCEPTION 'already_enrolled: active enrollment already exists';
  END IF;

  -- Count active seats BEFORE inserting or reactivating a cancelled/rejected row
  SELECT COUNT(*) INTO v_active_count
  FROM   public.enrollments
  WHERE  session_id = p_session_id
    AND  status IN ('approved','confirmed','pending_verification');

  IF v_active_count >= v_session.capacity THEN
    RAISE EXCEPTION 'session_full: capacity=%, filled=%', v_session.capacity, v_active_count;
  END IF;

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.enrollments
       SET status             = 'pending_verification',
           payment_proof_path = p_payment_proof_path,
           rejection_reason   = '',
           updated_at         = timezone('utc', now())
     WHERE id = v_existing.id
    RETURNING id INTO v_enroll_id;
    RETURN jsonb_build_object(
      'success', true,
      'enrollment_id', v_enroll_id,
      'seats_remaining', (v_session.capacity - v_active_count - 1),
      'message', 'Re-submitted'
    );
  END IF;

  INSERT INTO public.enrollments (session_id, student_id, status, payment_proof_path)
  VALUES (p_session_id, p_student_id, 'pending_verification', p_payment_proof_path)
  RETURNING id INTO v_enroll_id;

  RETURN jsonb_build_object(
    'success',         true,
    'enrollment_id',   v_enroll_id,
    'seats_remaining', (v_session.capacity - v_active_count - 1),
    'message',         'Registration submitted successfully'
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.register_for_session_atomic(
  p_session_id UUID, p_student_id UUID, p_payment_proof_path TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
BEGIN
  RETURN public.create_enrollment(p_session_id, p_student_id, p_payment_proof_path);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.register_for_session(
  p_session_id UUID, p_student_id UUID, p_payment_proof_path TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
BEGIN
  RETURN public.create_enrollment(p_session_id, p_student_id, p_payment_proof_path);
END;
$fn$;

REVOKE ALL ON FUNCTION public.create_enrollment(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_enrollment(uuid, uuid, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.register_for_session(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_for_session(uuid, uuid, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.register_for_session_atomic(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_for_session_atomic(uuid, uuid, text) TO authenticated, service_role;

-- 6. Column-integrity BEFORE UPDATE triggers on orders, designs, enrollments, class_sessions, notifications
CREATE OR REPLACE FUNCTION public.protect_orders_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
DECLARE
  jwt_role text;
BEGIN
  jwt_role := coalesce(current_setting('request.jwt.claim.role', true), auth.role());
  IF jwt_role = 'service_role' OR session_user IN ('postgres', 'supabase_admin') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.order_number IS DISTINCT FROM OLD.order_number
     OR NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
     OR NEW.total_price IS DISTINCT FROM OLD.total_price
     OR NEW.bank_account_id IS DISTINCT FROM OLD.bank_account_id
     OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Access denied: customers cannot modify immutable order fields.';
  END IF;

  IF OLD.status NOT IN ('pending_payment', 'pending_verification', 'rejected') THEN
    RAISE EXCEPTION 'Access denied: order can no longer be modified by customer.';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('pending_verification', 'cancelled') THEN
    RAISE EXCEPTION 'Access denied: invalid customer order status transition.';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_protect_orders_integrity ON public.orders;
CREATE TRIGGER trg_protect_orders_integrity
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.protect_orders_integrity();

CREATE OR REPLACE FUNCTION public.protect_designs_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
DECLARE
  jwt_role text;
BEGIN
  jwt_role := coalesce(current_setting('request.jwt.claim.role', true), auth.role());
  IF jwt_role = 'service_role' OR session_user IN ('postgres', 'supabase_admin') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.submitted_by IS DISTINCT FROM OLD.submitted_by
     OR NEW.quoted_price IS DISTINCT FROM OLD.quoted_price
     OR NEW.admin_reply IS DISTINCT FROM OLD.admin_reply
     OR NEW.linked_order_id IS DISTINCT FROM OLD.linked_order_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Access denied: customers cannot modify design quote or administrative fields.';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (OLD.status = 'quoted' AND NEW.status IN ('accepted', 'declined')) THEN
      RAISE EXCEPTION 'Access denied: invalid design status transition.';
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_protect_designs_integrity ON public.designs;
CREATE TRIGGER trg_protect_designs_integrity
  BEFORE UPDATE ON public.designs
  FOR EACH ROW EXECUTE PROCEDURE public.protect_designs_integrity();

CREATE OR REPLACE FUNCTION public.protect_enrollments_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
DECLARE
  jwt_role text;
  v_is_session_teacher boolean;
BEGIN
  jwt_role := coalesce(current_setting('request.jwt.claim.role', true), auth.role());
  IF jwt_role = 'service_role' OR session_user IN ('postgres', 'supabase_admin') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.class_sessions cs
    WHERE cs.id = OLD.session_id AND cs.teacher_id = auth.uid()
  ) INTO v_is_session_teacher;

  IF v_is_session_teacher AND public.is_teacher() THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.session_id IS DISTINCT FROM OLD.session_id
       OR NEW.student_id IS DISTINCT FROM OLD.student_id
       OR NEW.payment_proof_path IS DISTINCT FROM OLD.payment_proof_path
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Access denied: teachers cannot reassign enrollment identity or proof.';
    END IF;
    RETURN NEW;
  END IF;

  -- Student caller
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.session_id IS DISTINCT FROM OLD.session_id
     OR NEW.student_id IS DISTINCT FROM OLD.student_id
     OR NEW.attended IS DISTINCT FROM OLD.attended
     OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Access denied: students cannot modify verification or attendance fields.';
  END IF;

  IF OLD.status NOT IN ('pending_verification', 'rejected') THEN
    RAISE EXCEPTION 'Access denied: enrollment can no longer be modified by student.';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('pending_verification', 'cancelled') THEN
    RAISE EXCEPTION 'Access denied: students cannot approve enrollments.';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_protect_enrollments_integrity ON public.enrollments;
CREATE TRIGGER trg_protect_enrollments_integrity
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE PROCEDURE public.protect_enrollments_integrity();

CREATE OR REPLACE FUNCTION public.protect_class_sessions_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
DECLARE
  jwt_role text;
BEGIN
  jwt_role := coalesce(current_setting('request.jwt.claim.role', true), auth.role());
  IF jwt_role = 'service_role' OR session_user IN ('postgres', 'supabase_admin') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.price IS DISTINCT FROM OLD.price OR NEW.teacher_id IS DISTINCT FROM OLD.teacher_id THEN
    RAISE EXCEPTION 'Access denied: only administrators can alter session price or assigned instructor.';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_protect_class_sessions_integrity ON public.class_sessions;
CREATE TRIGGER trg_protect_class_sessions_integrity
  BEFORE UPDATE ON public.class_sessions
  FOR EACH ROW EXECUTE PROCEDURE public.protect_class_sessions_integrity();

CREATE OR REPLACE FUNCTION public.protect_notifications_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $fn$
DECLARE
  jwt_role text;
BEGIN
  jwt_role := coalesce(current_setting('request.jwt.claim.role', true), auth.role());
  IF jwt_role = 'service_role' OR session_user IN ('postgres', 'supabase_admin') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.link IS DISTINCT FROM OLD.link
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Access denied: users can only update notification read status.';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_protect_notifications_integrity ON public.notifications;
CREATE TRIGGER trg_protect_notifications_integrity
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE PROCEDURE public.protect_notifications_integrity();

-- 7. Drop ALL existing RLS policies on public tables and recreate hardened authoritative set
DO $drop$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename <> 'portfolio_projects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $drop$;

-- PROFILES: strict self-or-admin read, customer-only self-insert, self-or-admin update (trigger guards role & is_active)
CREATE POLICY "profiles_select_self_or_admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin() OR (auth.uid() = id AND role = 'customer' AND is_active = true));
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- PRODUCTS: public reads only available non-deleted products
CREATE POLICY "products_select" ON public.products
  FOR SELECT USING ((is_available = true AND is_deleted IS NOT TRUE) OR public.is_admin());
CREATE POLICY "products_all_admin" ON public.products
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- BANK ACCOUNTS: only active accounts visible
CREATE POLICY "bank_accounts_select_active" ON public.bank_accounts
  FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "bank_accounts_all_admin" ON public.bank_accounts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ORDERS: buyers read own; inserts only via create_order_atomic RPC or admin; updates guarded by trigger + policy
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT USING (buyer_id = auth.uid() OR public.is_admin());
CREATE POLICY "orders_insert_admin" ON public.orders
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE USING (
    public.is_admin() OR
    (buyer_id = auth.uid() AND status IN ('pending_payment', 'pending_verification', 'rejected'))
  )
  WITH CHECK (
    public.is_admin() OR
    (buyer_id = auth.uid() AND status IN ('pending_payment', 'pending_verification', 'cancelled'))
  );

-- ORDER ITEMS: buyers read own; inserts only via create_order_atomic RPC or admin
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR public.is_admin())
    )
  );
CREATE POLICY "order_items_insert_admin" ON public.order_items
  FOR INSERT WITH CHECK (public.is_admin());

-- ORDER STATUS HISTORY: buyers read own; inserts only via server pool or admin
CREATE POLICY "osh_select" ON public.order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR public.is_admin())
    )
  );
CREATE POLICY "osh_insert_admin" ON public.order_status_history
  FOR INSERT WITH CHECK (public.is_admin());

-- DESIGNS: submitter reads/inserts own in 'new' state; updates guarded by trigger + policy
CREATE POLICY "designs_select" ON public.designs
  FOR SELECT USING (submitted_by = auth.uid() OR public.is_admin());
CREATE POLICY "designs_insert" ON public.designs
  FOR INSERT WITH CHECK (
    public.is_admin() OR
    (submitted_by = auth.uid() AND status = 'new' AND quoted_price IS NULL AND linked_order_id IS NULL)
  );
CREATE POLICY "designs_update" ON public.designs
  FOR UPDATE USING (
    public.is_admin() OR
    (submitted_by = auth.uid() AND status IN ('quoted', 'accepted'))
  )
  WITH CHECK (
    public.is_admin() OR
    (submitted_by = auth.uid() AND status IN ('quoted', 'accepted', 'declined'))
  );

-- CLASS SESSIONS: hide cancelled drafts from public; teachers can update own (not price/teacher_id); only admins insert/delete
CREATE POLICY "cs_select_public" ON public.class_sessions
  FOR SELECT USING (
    status IN ('scheduled', 'live', 'ended') OR public.is_admin() OR (teacher_id = auth.uid() AND public.is_teacher())
  );
CREATE POLICY "cs_insert_admin" ON public.class_sessions
  FOR INSERT WITH CHECK (public.is_admin() OR (teacher_id = auth.uid() AND public.is_teacher()));
CREATE POLICY "cs_update_admin_teacher" ON public.class_sessions
  FOR UPDATE
  USING (public.is_admin() OR (teacher_id = auth.uid() AND public.is_teacher()))
  WITH CHECK (public.is_admin() OR (teacher_id = auth.uid() AND public.is_teacher()));
CREATE POLICY "cs_delete_admin" ON public.class_sessions
  FOR DELETE USING (public.is_admin());

-- Column-level restriction: never expose livekit_room_name via PostgREST to anon or authenticated
REVOKE SELECT ON public.class_sessions FROM anon, authenticated;
GRANT SELECT (
  id, type, title, description, teacher_id, location, starts_at, ends_at,
  capacity, price, status, recording_notes, created_at, updated_at, ended_at
) ON public.class_sessions TO anon, authenticated;

-- ENROLLMENTS: single strict update policy + trigger; inserts only via create_enrollment RPC or admin
CREATE POLICY "enrollments_select" ON public.enrollments
  FOR SELECT USING (
    student_id = auth.uid() OR public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.class_sessions cs
      WHERE cs.id = session_id AND cs.teacher_id = auth.uid()
    )
  );
CREATE POLICY "enrollments_insert_admin" ON public.enrollments
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "enrollments_update" ON public.enrollments
  FOR UPDATE
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.class_sessions cs
      WHERE cs.id = session_id AND cs.teacher_id = auth.uid()
    ) OR
    (student_id = auth.uid() AND status IN ('pending_verification', 'rejected'))
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.class_sessions cs
      WHERE cs.id = session_id AND cs.teacher_id = auth.uid()
    ) OR
    (student_id = auth.uid() AND status IN ('pending_verification', 'rejected', 'cancelled'))
  );

-- NOTIFICATIONS: users read & mark-read own only; inserts only via server pool or admin
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "notifications_insert_admin" ON public.notifications
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- AUDIT LOG: admins read; inserts only via server pool or admin
CREATE POLICY "audit_log_select_admin" ON public.audit_log
  FOR SELECT USING (public.is_admin());
CREATE POLICY "audit_log_insert_admin" ON public.audit_log
  FOR INSERT WITH CHECK (public.is_admin());

-- SETTINGS: public read; admin write
CREATE POLICY "settings_select_public" ON public.settings
  FOR SELECT USING (true);
CREATE POLICY "settings_all_admin" ON public.settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PORTFOLIO PROJECTS: keep public read, restrict admin check with is_admin()
DROP POLICY IF EXISTS "Admins can manage portfolio projects" ON public.portfolio_projects;
CREATE POLICY "Admins can manage portfolio projects" ON public.portfolio_projects
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8. Storage security: drop ALL legacy storage.objects policies & recreate strict folder-scoped ones
DO $drop_storage$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $drop_storage$;

-- Ensure legacy unused buckets are not public
UPDATE storage.buckets
SET public = false
WHERE id IN ('dielines', 'payment-screenshots', 'submitted-designs');

-- product-images: public read, admin write
CREATE POLICY "Public product images access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admin manage product images" ON storage.objects
  FOR ALL USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- payment-proofs: strictly folder-scoped {user_id}/... for both SELECT and INSERT
CREATE POLICY "Private payment proofs read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs' AND (
      public.is_admin() OR
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
    )
  );
CREATE POLICY "Private payment proofs insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- designs: strictly folder-scoped {user_id}/... for both SELECT and INSERT
CREATE POLICY "Private designs read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'designs' AND (
      public.is_admin() OR
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
    )
  );
CREATE POLICY "Private designs insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'designs' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- avatars: public read, folder-scoped upload and delete
CREATE POLICY "Avatars public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
