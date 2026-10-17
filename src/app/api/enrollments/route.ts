import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";

// GET /api/enrollments - List enrollments by role
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const statusFilter = searchParams.get("status");

    let query = supabase
      .from("enrollments")
      .select(`
        id, session_id, student_id, status, payment_proof_path, rejection_reason,
        verified_by, verified_at, attended, created_at, updated_at,
        class_sessions(id, title, type, price, starts_at, ends_at, capacity, teacher_id, location, status, livekit_room_name),
        profiles:student_id(id, full_name, email, phone)
      `)
      .order("created_at", { ascending: false });

    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (user.role === "admin") {
      // Admin sees all enrollments
    } else if (user.role === "teacher") {
      // Teachers see enrollments for their classes
      const { data: teacherSessions } = await supabase
        .from("class_sessions")
        .select("id")
        .eq("teacher_id", user.id);

      const sessionIds = (teacherSessions || []).map(s => s.id);
      if (sessionIds.length === 0) {
        return NextResponse.json({ success: true, enrollments: [] });
      }
      query = query.in("session_id", sessionIds);
    } else {
      // Customers see only their own enrollments
      query = query.eq("student_id", user.id);
    }

    const { data: enrollments, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      enrollments: enrollments || [],
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to load enrollments" }, { status });
  }
}

// POST /api/enrollments - Atomic class registration using PostgreSQL RPC
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const { sessionId, paymentProofPath } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Class session ID is required." }, { status: 400 });
    }

    const supabase = await createClient();

    // Call atomic capacity RPC function in PostgreSQL
    const { data: rpcResult, error: rpcErr } = await supabase.rpc("register_for_session", {
      p_session_id: sessionId,
      p_student_id: user.id,
      p_payment_proof_path: paymentProofPath || "",
    });

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 400 });
    }

    // Fetch the created/updated enrollment
    const enrollmentId = rpcResult?.enrollment_id;
    let enrollment = null;
    if (enrollmentId) {
      const { data } = await supabase
        .from("enrollments")
        .select(`
          id, session_id, student_id, status, payment_proof_path,
          class_sessions(id, title, price, starts_at, ends_at)
        `)
        .eq("id", enrollmentId)
        .single();
      enrollment = data;
    }

    // Notify administrators if payment proof was uploaded
    if (paymentProofPath) {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const title = enrollment?.class_sessions?.title || "Workshop";
        const notices = admins.map(a => ({
          user_id: a.id,
          title: `Class Enrollment Payment to Verify`,
          body: `${user.full_name} submitted payment receipt for "${title}".`,
          link: `/admin/payments?tab=enrollments`,
        }));
        await supabase.from("notifications").insert(notices);
      }
    }

    return NextResponse.json({
      success: true,
      result: rpcResult,
      enrollment,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Registration failed" }, { status });
  }
}

// PATCH /api/enrollments - Verify payment, cancel enrollment, or mark attendance
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const { enrollmentId, action, status, rejectionReason, attended, paymentProofPath } = body;

    if (!enrollmentId) {
      return NextResponse.json({ error: "Enrollment ID is required." }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: enrollment, error: fetchErr } = await supabase
      .from("enrollments")
      .select("*, class_sessions(id, title, teacher_id)")
      .eq("id", enrollmentId)
      .single();

    if (fetchErr || !enrollment) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
    }

    // 1. CUSTOMER ACTIONS
    if (user.role === "customer") {
      if (enrollment.student_id !== user.id) {
        return NextResponse.json({ error: "Forbidden: Not your enrollment." }, { status: 403 });
      }

      if (action === "cancel") {
        if (enrollment.status === "approved") {
          return NextResponse.json({ error: "Approved registrations cannot be cancelled online. Please contact admin." }, { status: 400 });
        }

        const { data, error } = await supabase
          .from("enrollments")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", enrollmentId)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, enrollment: data });
      }

      if (action === "upload_proof") {
        if (!paymentProofPath) {
          return NextResponse.json({ error: "Receipt file is required." }, { status: 400 });
        }

        const { data, error } = await supabase
          .from("enrollments")
          .update({
            payment_proof_path: paymentProofPath,
            status: "pending_verification",
            rejection_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", enrollmentId)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, enrollment: data });
      }

      return NextResponse.json({ error: "Invalid action for student." }, { status: 400 });
    }

    // 2. TEACHER ACTIONS (Mark Attendance)
    if (user.role === "teacher") {
      // Must be teacher of this class session
      if (enrollment.class_sessions?.teacher_id !== user.id) {
        return NextResponse.json({ error: "Forbidden: You are not the assigned instructor for this class." }, { status: 403 });
      }

      if (action === "attendance") {
        const { data, error } = await supabase
          .from("enrollments")
          .update({ attended: Boolean(attended), updated_at: new Date().toISOString() })
          .eq("id", enrollmentId)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, enrollment: data });
      }

      return NextResponse.json({ error: "Teachers can only mark attendance." }, { status: 400 });
    }

    // 3. ADMIN ACTIONS (Approve, Reject, Attendance)
    if (user.role === "admin") {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };

      if (action === "approve") {
        updates.status = "approved";
        updates.verified_by = user.id;
        updates.verified_at = new Date().toISOString();
        updates.rejection_reason = null;
      } else if (action === "reject") {
        updates.status = "rejected";
        if (!rejectionReason || !rejectionReason.trim()) {
          return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
        }
        updates.rejection_reason = rejectionReason.trim();
        updates.verified_by = user.id;
        updates.verified_at = new Date().toISOString();
      } else if (action === "attendance") {
        updates.attended = Boolean(attended);
      } else if (status) {
        updates.status = status;
      }

      const { data, error } = await supabase
        .from("enrollments")
        .update(updates)
        .eq("id", enrollmentId)
        .select()
        .single();

      if (error) throw error;

      // Notify student
      if (action === "approve" || action === "reject") {
        await supabase.from("notifications").insert({
          user_id: enrollment.student_id,
          title: `Class Registration ${action === "approve" ? "Approved" : "Rejected"}`,
          body: action === "approve"
            ? `Your seat for "${enrollment.class_sessions?.title}" is confirmed! You can now join this session.`
            : `Your registration payment was rejected: "${rejectionReason}". Please re-upload receipt.`,
          link: `/dashboard?tab=classes`,
        });
      }

      // Audit log
      await supabase.from("audit_log").insert({
        actor_id: user.id,
        action: `ENROLLMENT_${(action || status || "UPDATE").toUpperCase()}`,
        entity: "enrollments",
        entity_id: enrollmentId,
        metadata: updates,
      });

      return NextResponse.json({ success: true, enrollment: data });
    }

    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update enrollment" }, { status });
  }
}
