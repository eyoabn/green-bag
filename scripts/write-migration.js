#!/usr/bin/env node
// write-migration.js
// Writes supabase/migrations/20261017100000_phase1_additive.sql
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT  = path.join(ROOT, 'supabase', 'migrations', '20261017100000_phase1_additive.sql');

const sql = `-- ==============================================================================
-- PHASE 1 ADDITIVE MIGRATION: Ethiopia Arenguade Paper Product
-- Date: 2026-10-17
-- Purpose: Fills gaps left by the original master_schema migration.
--   Adds: avatars bucket, create_enrollment RPC, current_user_role helper,
--         settings columns (tax_id, settlement_days), all missing indexes,
--         refined RLS policies per SPEC sections 2-6.
-- Idempotent: safe to re-run.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- A. ENUM GAPS: add every value that may be missing
-- ============================================================

DO $p$ BEGIN ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'customer'; EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'teacher';  EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';    EXCEPTION WHEN duplicate_object THEN NULL; END $p$;

DO $p$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_payment';    EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_verification'; EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'verified';            EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'approved';            EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'in_production';       EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'ready';               EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'delivered';           EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'completed';           EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'rejected';            EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'cancelled';           EXCEPTION WHEN duplicate_object THEN NULL; END $p$;

DO $p$ BEGIN ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'pending_verification'; EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'confirmed';            EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'approved';             EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'rejected';             EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'cancelled';            EXCEPTION WHEN duplicate_object THEN NULL; END $p$;

DO $p$ BEGIN ALTER TYPE public.design_status ADD VALUE IF NOT EXISTS 'new';       EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.design_status ADD VALUE IF NOT EXISTS 'reviewing';  EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.design_status ADD VALUE IF NOT EXISTS 'quoted';    EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.design_status ADD VALUE IF NOT EXISTS 'accepted';  EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.design_status ADD VALUE IF NOT EXISTS 'declined';  EXCEPTION WHEN duplicate_object THEN NULL; END $p$;

DO $p$ BEGIN ALTER TYPE public.session_type ADD VALUE IF NOT EXISTS 'in_person'; EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.session_type ADD VALUE IF NOT EXISTS 'live';      EXCEPTION WHEN duplicate_object THEN NULL; END $p$;

DO $p$ BEGIN ALTER TYPE public.session_status ADD VALUE IF NOT EXISTS 'scheduled'; EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.session_status ADD VALUE IF NOT EXISTS 'live';      EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.session_status ADD VALUE IF NOT EXISTS 'ended';     EXCEPTION WHEN duplicate_object THEN NULL; END $p$;
DO $p$ BEGIN ALTER TYPE public.session_status ADD VALUE IF NOT EXISTS 'cancelled'; EXCEPTION WHEN duplicate_object THEN NULL; END $p$;

-- ============================================================
-- B. HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $fn$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE AS $fn$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('teacher','admin') AND is_active = true
  );
END;
$fn$;

-- current_user_role(): returns the authenticated user's role or 'visitor'
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER STABLE AS $fn$
DECLARE v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role
  FROM public.profiles
  WHERE id = auth.uid() AND is_active = true;
  RETURN COALESCE(v_role, 'visitor');
END;
$fn$;

-- ============================================================
-- C. SETTINGS: add missing columns
-- ============================================================

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tax_id          TEXT    DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS settlement_days INTEGER DEFAULT 3;

-- ============================================================
-- D. create_enrollment RPC (the canonical name per SPEC)
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_enrollment(
  p_session_id         UUID,
  p_student_id         UUID,
  p_payment_proof_path TEXT DEFAULT ''
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE
  v_session      RECORD;
  v_active_count INTEGER;
  v_existing     RECORD;
  v_enroll_id    UUID;
BEGIN
  -- Lock the session row to prevent concurrent over-capacity inserts
  SELECT id, capacity, status
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

  -- Duplicate check
  SELECT id, status INTO v_existing
  FROM   public.enrollments
  WHERE  session_id = p_session_id AND student_id = p_student_id;

  IF FOUND THEN
    IF v_existing.status IN ('approved','confirmed','pending_verification') THEN
      RAISE EXCEPTION 'already_enrolled: active enrollment already exists';
    ELSE
      UPDATE public.enrollments
         SET status             = 'pending_verification',
             payment_proof_path = p_payment_proof_path,
             rejection_reason   = '',
             updated_at         = timezone('utc', now())
       WHERE id = v_existing.id
      RETURNING id INTO v_enroll_id;
      RETURN jsonb_build_object('success', true, 'enrollment_id', v_enroll_id, 'message', 'Re-submitted');
    END IF;
  END IF;

  -- Count active seats
  SELECT COUNT(*) INTO v_active_count
  FROM   public.enrollments
  WHERE  session_id = p_session_id
    AND  status IN ('approved','confirmed','pending_verification');

  IF v_active_count >= v_session.capacity THEN
    RAISE EXCEPTION 'session_full: capacity=%, filled=%', v_session.capacity, v_active_count;
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

-- Backward-compatible alias kept for existing API code
CREATE OR REPLACE FUNCTION public.register_for_session_atomic(
  p_session_id UUID, p_student_id UUID, p_payment_proof_path TEXT DEFAULT ''
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $fn$
BEGIN
  RETURN public.create_enrollment(p_session_id, p_student_id, p_payment_proof_path);
END;
$fn$;

-- ============================================================
-- E. INDEXES (all foreign keys + status columns)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role        ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active   ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id      ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_bank_account  ON public.orders(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_orders_verified_by   ON public.orders(verified_by);
CREATE INDEX IF NOT EXISTS idx_orders_created_at    ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product  ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_osh_order_id         ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_osh_created          ON public.order_status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_designs_submitted    ON public.designs(submitted_by);
CREATE INDEX IF NOT EXISTS idx_designs_status       ON public.designs(status);
CREATE INDEX IF NOT EXISTS idx_cs_teacher           ON public.class_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_cs_status            ON public.class_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cs_starts_at         ON public.class_sessions(starts_at);
CREATE INDEX IF NOT EXISTS idx_cs_type              ON public.class_sessions(type);
CREATE INDEX IF NOT EXISTS idx_enrollments_session  ON public.enrollments(session_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student  ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status   ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_verified ON public.enrollments(verified_by);
CREATE INDEX IF NOT EXISTS idx_notif_user           ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_is_read        ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notif_created        ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor          ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity         ON public.audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created        ON public.audit_log(created_at DESC);

-- ============================================================
-- F. DROP ALL RLS POLICIES AND RECREATE (authoritative set)
-- ============================================================

DO $drop$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $drop$;

-- Drop any old storage policies we'll recreate
DROP POLICY IF EXISTS "Public product images access"       ON storage.objects;
DROP POLICY IF EXISTS "Admin upload product images"        ON storage.objects;
DROP POLICY IF EXISTS "Admin manage product images"        ON storage.objects;
DROP POLICY IF EXISTS "Private payment proofs read"        ON storage.objects;
DROP POLICY IF EXISTS "Private payment proofs insert"      ON storage.objects;
DROP POLICY IF EXISTS "Private designs read"               ON storage.objects;
DROP POLICY IF EXISTS "Private designs insert"             ON storage.objects;
DROP POLICY IF EXISTS "Avatars public read"                ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar"            ON storage.objects;

-- Enable RLS on every table
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings             ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK   (auth.uid() = id OR public.is_admin());

-- PRODUCTS (active products visible to everyone; admin manages all)
CREATE POLICY "products_select" ON public.products
  FOR SELECT USING (is_available = true OR public.is_admin());
CREATE POLICY "products_all_admin" ON public.products
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- BANK ACCOUNTS (NOT public per SPEC; only authenticated users at checkout)
CREATE POLICY "bank_accounts_select_auth" ON public.bank_accounts
  FOR SELECT USING ((auth.role() = 'authenticated' AND is_active = true) OR public.is_admin());
CREATE POLICY "bank_accounts_all_admin" ON public.bank_accounts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ORDERS
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT USING (buyer_id = auth.uid() OR public.is_admin());
CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT WITH CHECK (buyer_id = auth.uid() OR public.is_admin());
CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE USING (
    public.is_admin() OR
    (buyer_id = auth.uid() AND status IN ('pending_payment','pending_verification'))
  );

-- ORDER ITEMS
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
            AND (o.buyer_id = auth.uid() OR public.is_admin()))
  );
CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
            AND (o.buyer_id = auth.uid() OR public.is_admin()))
  );

-- ORDER STATUS HISTORY
CREATE POLICY "osh_select" ON public.order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
            AND (o.buyer_id = auth.uid() OR public.is_admin()))
  );
CREATE POLICY "osh_insert" ON public.order_status_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- DESIGNS
CREATE POLICY "designs_select" ON public.designs
  FOR SELECT USING (submitted_by = auth.uid() OR public.is_admin());
CREATE POLICY "designs_insert" ON public.designs
  FOR INSERT WITH CHECK (submitted_by = auth.uid() OR public.is_admin());
CREATE POLICY "designs_update" ON public.designs
  FOR UPDATE USING (
    public.is_admin() OR (submitted_by = auth.uid() AND status = 'quoted')
  );

-- CLASS SESSIONS (public reads scheduled+live; admin/teacher manage)
CREATE POLICY "cs_select_public" ON public.class_sessions
  FOR SELECT USING (
    status IN ('scheduled','live') OR public.is_admin() OR teacher_id = auth.uid()
  );
CREATE POLICY "cs_all_admin_teacher" ON public.class_sessions
  FOR ALL
  USING (public.is_admin() OR (teacher_id = auth.uid() AND public.is_teacher()))
  WITH CHECK (public.is_admin() OR (teacher_id = auth.uid() AND public.is_teacher()));

-- ENROLLMENTS
CREATE POLICY "enrollments_select" ON public.enrollments
  FOR SELECT USING (
    student_id = auth.uid() OR public.is_admin() OR
    EXISTS (SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = session_id AND cs.teacher_id = auth.uid())
  );
CREATE POLICY "enrollments_insert" ON public.enrollments
  FOR INSERT WITH CHECK (student_id = auth.uid() OR public.is_admin());
CREATE POLICY "enrollments_update" ON public.enrollments
  FOR UPDATE USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = session_id AND cs.teacher_id = auth.uid()) OR
    (student_id = auth.uid() AND status = 'pending_verification')
  );

-- NOTIFICATIONS
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- AUDIT LOG
CREATE POLICY "audit_log_select_admin" ON public.audit_log
  FOR SELECT USING (public.is_admin());
CREATE POLICY "audit_log_insert_auth" ON public.audit_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- SETTINGS (public read; admin write)
CREATE POLICY "settings_select_public" ON public.settings
  FOR SELECT USING (true);
CREATE POLICY "settings_all_admin" ON public.settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- G. STORAGE BUCKETS (upsert all 4)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images','product-images',true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('payment-proofs','payment-proofs',false,5242880, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('designs',       'designs',       false,10485760,ARRAY['image/jpeg','image/png','image/webp','application/pdf','application/octet-stream']),
  ('avatars',       'avatars',       true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- H. STORAGE POLICIES (path: {user_id}/{uuid}.{ext})
-- ============================================================

-- product-images: public read, admin all
CREATE POLICY "Public product images access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admin manage product images" ON storage.objects
  FOR ALL USING (bucket_id = 'product-images' AND public.is_admin());

-- payment-proofs: owner reads own folder, admin reads all; owner uploads own folder
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

-- designs: owner reads own folder, admin reads all; owner uploads own folder
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

-- avatars: public read; authenticated upload+delete own folder
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

-- ============================================================
-- I. REALTIME
-- ============================================================

DO $rt$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN OTHERS THEN NULL; END $rt$;
DO $rt$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;        EXCEPTION WHEN OTHERS THEN NULL; END $rt$;
DO $rt$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollments;   EXCEPTION WHEN OTHERS THEN NULL; END $rt$;
`;

fs.writeFileSync(OUT, sql, 'utf8');
console.log('Migration written:', OUT, '(' + sql.length + ' bytes)');
