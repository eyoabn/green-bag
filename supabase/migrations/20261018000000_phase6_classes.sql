-- Phase 6: Classes and Enrollment Improvements
-- 1. Update create_enrollment to prevent registering for past sessions
-- 2. Update enrollments update RLS policy to allow re-uploading proof when status is 'rejected' and cancelling

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

  -- Block registration for past sessions
  IF v_session.starts_at IS NOT NULL AND v_session.starts_at <= timezone('utc', now()) THEN
    RAISE EXCEPTION 'session_in_past: this session has already started or ended';
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

  -- Count active seats (both approved and pending_verification hold a seat)
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

-- Ensure aliases are identical
CREATE OR REPLACE FUNCTION public.register_for_session_atomic(
  p_session_id UUID, p_student_id UUID, p_payment_proof_path TEXT DEFAULT ''
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $fn$
BEGIN
  RETURN public.create_enrollment(p_session_id, p_student_id, p_payment_proof_path);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.register_for_session(
  p_session_id UUID, p_student_id UUID, p_payment_proof_path TEXT DEFAULT ''
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $fn$
BEGIN
  RETURN public.create_enrollment(p_session_id, p_student_id, p_payment_proof_path);
END;
$fn$;

-- Update RLS for student re-uploading receipts and cancelling
DROP POLICY IF EXISTS "enrollments_update" ON public.enrollments;
CREATE POLICY "enrollments_update" ON public.enrollments
  FOR UPDATE 
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = session_id AND cs.teacher_id = auth.uid()) OR
    (student_id = auth.uid() AND status IN ('pending_verification', 'rejected'))
  )
  WITH CHECK (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = session_id AND cs.teacher_id = auth.uid()) OR
    (student_id = auth.uid() AND status IN ('pending_verification', 'rejected', 'cancelled'))
  );
