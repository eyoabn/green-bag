-- ==============================================================================
-- MASTER SCHEMA MIGRATION: Ethiopia Arenguade Paper Product
-- Date: 2026-10-17
-- Conforms strictly to Master Prompt Section 4 & Section 2
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('customer', 'teacher', 'admin');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'pending_payment',
      'pending_verification',
      'approved',
      'in_production',
      'ready',
      'completed',
      'rejected',
      'cancelled'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
    CREATE TYPE enrollment_status AS ENUM (
      'pending_verification',
      'approved',
      'rejected',
      'cancelled'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'design_status') THEN
    CREATE TYPE design_status AS ENUM (
      'new',
      'reviewing',
      'quoted',
      'accepted',
      'declined'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
    CREATE TYPE session_status AS ENUM (
      'scheduled',
      'live',
      'ended',
      'cancelled'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_type') THEN
    CREATE TYPE session_type AS ENUM (
      'in_person',
      'live'
    );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. DROP EXISTING POLICIES TO AVOID TYPE CONVERSION DEPENDENCY LOCKS
-- ------------------------------------------------------------------------------
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 3. SEQUENCES & TRIGGER HELPERS
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 4. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role user_role NOT NULL DEFAULT 'customer',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Convert existing TEXT role column to user_role enum if needed
DO $$ 
DECLARE
  cons RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role' AND udt_name = 'text'
  ) THEN
    FOR cons IN 
      SELECT constraint_name 
      FROM information_schema.constraint_column_usage 
      WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    LOOP
      EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', cons.constraint_name);
    END LOOP;

    ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
    UPDATE public.profiles SET role = 'customer' WHERE role NOT IN ('customer', 'teacher', 'admin');
    ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;
    ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'customer'::user_role;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ------------------------------------------------------------------------------
-- 4. SECURITY HELPERS & ROLE INTEGRITY
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('teacher', 'admin') AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role <> OLD.role THEN
    IF current_user <> 'postgres' AND current_user <> 'service_role' AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access denied: only administrators can change user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_self_escalation();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'customer',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    phone = CASE WHEN profiles.phone = '' THEN EXCLUDED.phone ELSE profiles.phone END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 5. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'Packaging',
  stock_quantity INTEGER,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Packaging';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_urls'
  ) THEN
    UPDATE public.products SET images = image_urls WHERE (images = '{}' OR images IS NULL) AND image_urls IS NOT NULL;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ------------------------------------------------------------------------------
-- 6. BANK ACCOUNTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  instructions TEXT DEFAULT 'Include your Order Number or Session ID as the transfer reference note.',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS instructions TEXT DEFAULT 'Include your Order Number or Session ID as the transfer reference note.';
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

DROP TRIGGER IF EXISTS trg_bank_accounts_updated_at ON public.bank_accounts;
CREATE TRIGGER trg_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ------------------------------------------------------------------------------
-- 7. ORDERS & ORDER ITEMS TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  status order_status NOT NULL DEFAULT 'pending_payment',
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  delivery_address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  payment_proof_path TEXT DEFAULT '',
  rejection_reason TEXT DEFAULT '',
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_proof_path TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Convert existing status column to order_status enum if needed
DO $$ 
DECLARE
  cons RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status' AND udt_name = 'text'
  ) THEN
    -- Drop old check constraints on status
    FOR cons IN 
      SELECT constraint_name 
      FROM information_schema.constraint_column_usage 
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status'
    LOOP
      EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS %I', cons.constraint_name);
    END LOOP;

    ALTER TABLE public.orders ALTER COLUMN status DROP DEFAULT;
    UPDATE public.orders SET status = 'pending_payment' WHERE status NOT IN ('pending_payment', 'pending_verification', 'approved', 'in_production', 'ready', 'completed', 'rejected', 'cancelled');
    ALTER TABLE public.orders ALTER COLUMN status TYPE order_status USING status::order_status;
    ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending_payment'::order_status;
  END IF;
END $$;

-- Migrate payment_screenshot_url to payment_proof_path if exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_screenshot_url'
  ) THEN
    UPDATE public.orders SET payment_proof_path = payment_screenshot_url WHERE payment_proof_path = '' OR payment_proof_path IS NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'ARN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_generate_number ON public.orders;
CREATE TRIGGER trg_orders_generate_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.generate_order_number();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_snapshot DECIMAL(10,2) NOT NULL CHECK (unit_price_snapshot >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order Status History
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 8. CUSTOM DESIGNS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.designs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Custom Packaging Request',
  description TEXT DEFAULT '',
  file_path TEXT NOT NULL DEFAULT '',
  status design_status NOT NULL DEFAULT 'new',
  admin_reply TEXT DEFAULT '',
  quoted_price DECIMAL(10,2),
  linked_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.designs ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Custom Packaging Request';
ALTER TABLE public.designs ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.designs ADD COLUMN IF NOT EXISTS file_path TEXT NOT NULL DEFAULT '';
ALTER TABLE public.designs ADD COLUMN IF NOT EXISTS admin_reply TEXT DEFAULT '';
ALTER TABLE public.designs ADD COLUMN IF NOT EXISTS quoted_price DECIMAL(10,2);
ALTER TABLE public.designs ADD COLUMN IF NOT EXISTS linked_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.designs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

DO $$ 
DECLARE
  cons RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'designs' AND column_name = 'status' AND udt_name = 'text'
  ) THEN
    FOR cons IN 
      SELECT constraint_name 
      FROM information_schema.constraint_column_usage 
      WHERE table_schema = 'public' AND table_name = 'designs' AND column_name = 'status'
    LOOP
      EXECUTE format('ALTER TABLE public.designs DROP CONSTRAINT IF EXISTS %I', cons.constraint_name);
    END LOOP;

    ALTER TABLE public.designs ALTER COLUMN status DROP DEFAULT;
    UPDATE public.designs SET status = 'new' WHERE status NOT IN ('new', 'reviewing', 'quoted', 'accepted', 'declined');
    ALTER TABLE public.designs ALTER COLUMN status TYPE design_status USING status::design_status;
    ALTER TABLE public.designs ALTER COLUMN status SET DEFAULT 'new'::design_status;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'designs' AND column_name = 'file_url'
  ) THEN
    UPDATE public.designs SET file_path = file_url WHERE file_path = '' OR file_path IS NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'designs' AND column_name = 'note'
  ) THEN
    UPDATE public.designs SET description = note WHERE description = '' OR description IS NULL;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_designs_updated_at ON public.designs;
CREATE TRIGGER trg_designs_updated_at
  BEFORE UPDATE ON public.designs
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ------------------------------------------------------------------------------
-- 9. CLASS SESSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type session_type NOT NULL DEFAULT 'in_person',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  location TEXT DEFAULT '',
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status session_status NOT NULL DEFAULT 'scheduled',
  livekit_room_name TEXT UNIQUE,
  recording_notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS status session_status NOT NULL DEFAULT 'scheduled';
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS recording_notes TEXT DEFAULT '';
ALTER TABLE public.class_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

DO $$ 
DECLARE
  cons RECORD;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'class_sessions' AND column_name = 'type' AND udt_name = 'text'
  ) THEN
    FOR cons IN 
      SELECT constraint_name 
      FROM information_schema.constraint_column_usage 
      WHERE table_schema = 'public' AND table_name = 'class_sessions' AND column_name = 'type'
    LOOP
      EXECUTE format('ALTER TABLE public.class_sessions DROP CONSTRAINT IF EXISTS %I', cons.constraint_name);
    END LOOP;

    ALTER TABLE public.class_sessions ALTER COLUMN type DROP DEFAULT;
    UPDATE public.class_sessions SET type = 'in_person' WHERE type NOT IN ('in_person', 'live');
    ALTER TABLE public.class_sessions ALTER COLUMN type TYPE session_type USING type::session_type;
    ALTER TABLE public.class_sessions ALTER COLUMN type SET DEFAULT 'in_person'::session_type;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'class_sessions' AND column_name = 'start_time'
  ) THEN
    UPDATE public.class_sessions SET starts_at = start_time WHERE starts_at IS NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'class_sessions' AND column_name = 'end_time'
  ) THEN
    UPDATE public.class_sessions SET ends_at = end_time WHERE ends_at IS NULL;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_class_sessions_updated_at ON public.class_sessions;
CREATE TRIGGER trg_class_sessions_updated_at
  BEFORE UPDATE ON public.class_sessions
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ------------------------------------------------------------------------------
-- 10. ENROLLMENTS TABLE (Replacing session_registrations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.class_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status enrollment_status NOT NULL DEFAULT 'pending_verification',
  payment_proof_path TEXT DEFAULT '',
  rejection_reason TEXT DEFAULT '',
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  attended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_id, student_id)
);

DROP TRIGGER IF EXISTS trg_enrollments_updated_at ON public.enrollments;
CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ------------------------------------------------------------------------------
-- 11. ATOMIC CAPACITY REGISTRATION RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_for_session_atomic(
  p_session_id UUID,
  p_student_id UUID,
  p_payment_proof_path TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
  v_current_count INTEGER;
  v_existing RECORD;
  v_enrollment_id UUID;
BEGIN
  -- 1. Check & Lock session row
  SELECT id, capacity, status, starts_at INTO v_session
  FROM public.class_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class session not found';
  END IF;

  IF v_session.status <> 'scheduled' THEN
    RAISE EXCEPTION 'Class session is not open for registration (status: %)', v_session.status;
  END IF;

  -- 2. Check if student already enrolled
  SELECT id, status INTO v_existing
  FROM public.enrollments
  WHERE session_id = p_session_id AND student_id = p_student_id;

  IF FOUND THEN
    IF v_existing.status IN ('approved', 'pending_verification') THEN
      RAISE EXCEPTION 'You already have an active registration for this class';
    ELSE
      UPDATE public.enrollments
      SET status = 'pending_verification',
          payment_proof_path = p_payment_proof_path,
          rejection_reason = '',
          updated_at = timezone('utc'::text, now())
      WHERE id = v_existing.id
      RETURNING id INTO v_enrollment_id;

      RETURN jsonb_build_object(
        'success', true,
        'enrollment_id', v_enrollment_id,
        'message', 'Registration re-submitted successfully'
      );
    END IF;
  END IF;

  -- 3. Calculate current count (both approved and pending_verification hold a seat)
  SELECT COUNT(*) INTO v_current_count
  FROM public.enrollments
  WHERE session_id = p_session_id 
    AND status IN ('approved', 'pending_verification');

  IF v_current_count >= v_session.capacity THEN
    RAISE EXCEPTION 'Sorry, this session is full (capacity: %, filled: %)', v_session.capacity, v_current_count;
  END IF;

  -- 4. Insert new enrollment
  INSERT INTO public.enrollments (
    session_id,
    student_id,
    status,
    payment_proof_path
  ) VALUES (
    p_session_id,
    p_student_id,
    'pending_verification',
    p_payment_proof_path
  )
  RETURNING id INTO v_enrollment_id;

  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', v_enrollment_id,
    'seats_remaining', (v_session.capacity - v_current_count - 1),
    'message', 'Registration submitted successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 12. NOTIFICATIONS & AUDIT LOG TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 13. SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'company',
  company_name TEXT NOT NULL DEFAULT 'Ethiopia Arenguade Paper Product',
  contact_phone TEXT NOT NULL DEFAULT '+251 911 223 344',
  contact_email TEXT NOT NULL DEFAULT 'hello@arenguade.et',
  address TEXT NOT NULL DEFAULT 'Bole Subcity, Industry Zone, Addis Ababa, Ethiopia',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.settings (id, company_name, contact_phone, contact_email, address)
VALUES ('company', 'Ethiopia Arenguade Paper Product', '+251 911 223 344', 'hello@arenguade.et', 'Bole Subcity, Industry Zone, Addis Ababa, Ethiopia')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- PROFILES
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile, admins can update any" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- PRODUCTS
CREATE POLICY "Products viewable by all" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Products managed by admins" ON public.products
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- BANK ACCOUNTS
CREATE POLICY "Bank accounts viewable by all" ON public.bank_accounts
  FOR SELECT USING (true);

CREATE POLICY "Bank accounts managed by admins" ON public.bank_accounts
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ORDERS
CREATE POLICY "Users see own orders, admins see all" ON public.orders
  FOR SELECT USING (buyer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users insert own orders, admins insert on behalf" ON public.orders
  FOR INSERT WITH CHECK (buyer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins update orders, users cancel pending" ON public.orders
  FOR UPDATE USING (
    public.is_admin() OR 
    (buyer_id = auth.uid() AND status IN ('pending_payment', 'pending_verification'))
  );

-- ORDER ITEMS
CREATE POLICY "Users see own order items, admins see all" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
        AND (orders.buyer_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Order items insert allowed for buyer or admin" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
        AND (orders.buyer_id = auth.uid() OR public.is_admin())
    )
  );

-- ORDER STATUS HISTORY
CREATE POLICY "Users see status history of own orders, admins see all" ON public.order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_status_history.order_id 
        AND (orders.buyer_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Status history inserted by authenticated users" ON public.order_status_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- DESIGNS
CREATE POLICY "Users see own designs, admins see all" ON public.designs
  FOR SELECT USING (submitted_by = auth.uid() OR public.is_admin());

CREATE POLICY "Users insert own designs, admins insert on behalf" ON public.designs
  FOR INSERT WITH CHECK (submitted_by = auth.uid() OR public.is_admin());

CREATE POLICY "Admins update designs, users can accept/decline quote" ON public.designs
  FOR UPDATE USING (
    public.is_admin() OR 
    (submitted_by = auth.uid() AND status = 'quoted')
  );

-- CLASS SESSIONS
CREATE POLICY "Sessions viewable by everyone" ON public.class_sessions
  FOR SELECT USING (true);

CREATE POLICY "Admins manage all sessions, teachers update own" ON public.class_sessions
  FOR ALL USING (
    public.is_admin() OR 
    (teacher_id = auth.uid() AND public.is_teacher())
  );

-- ENROLLMENTS
CREATE POLICY "Students see own, teachers see class roster, admins see all" ON public.enrollments
  FOR SELECT USING (
    student_id = auth.uid() OR 
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.class_sessions 
      WHERE class_sessions.id = enrollments.session_id 
        AND class_sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students register for own, admins register on behalf" ON public.enrollments
  FOR INSERT WITH CHECK (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins approve/reject, teachers mark attendance, students cancel" ON public.enrollments
  FOR UPDATE USING (
    public.is_admin() OR 
    EXISTS (
      SELECT 1 FROM public.class_sessions 
      WHERE class_sessions.id = enrollments.session_id 
        AND class_sessions.teacher_id = auth.uid()
    ) OR 
    (student_id = auth.uid() AND status = 'pending_verification')
  );

-- NOTIFICATIONS
CREATE POLICY "Users see own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can mark own notifications as read" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- AUDIT LOG
CREATE POLICY "Admins see audit log" ON public.audit_log
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Authenticated users can append to audit log" ON public.audit_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- SETTINGS
CREATE POLICY "Settings viewable by everyone" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Settings managed by admin" ON public.settings
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 15. STORAGE BUCKETS CONFIGURATION
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('designs', 'designs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/octet-stream'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public product images access" ON storage.objects;
CREATE POLICY "Public product images access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
CREATE POLICY "Admin upload product images" ON storage.objects
  FOR ALL USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Private payment proofs read" ON storage.objects;
CREATE POLICY "Private payment proofs read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-proofs' AND (
      public.is_admin() OR 
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
    )
  );

DROP POLICY IF EXISTS "Private payment proofs insert" ON storage.objects;
CREATE POLICY "Private payment proofs insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Private designs read" ON storage.objects;
CREATE POLICY "Private designs read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'designs' AND (
      public.is_admin() OR 
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
    )
  );

DROP POLICY IF EXISTS "Private designs insert" ON storage.objects;
CREATE POLICY "Private designs insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'designs' AND auth.role() = 'authenticated'
  );

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
