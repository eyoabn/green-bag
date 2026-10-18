import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireRole } from "@/utils/roles";

import { pool } from "@/utils/db";

// Helper to notify all enrolled students when a class is cancelled
async function notifyEnrolledStudentsOfCancellation(sessionId: string, classTitle: string, startsAt?: string) {
  try {
    const res = await pool.query(
      `SELECT student_id FROM public.enrollments WHERE session_id = $1 AND status != 'cancelled'`,
      [sessionId]
    );

    if (res.rows && res.rows.length > 0) {
      const formattedDate = startsAt ? new Date(startsAt).toLocaleString("en-US", { timeZone: "Africa/Addis_Ababa" }) : "the scheduled time";
      for (const row of res.rows) {
        await pool.query(
          `INSERT INTO public.notifications (user_id, title, body, link)
           VALUES ($1, $2, $3, $4)`,
          [
            row.student_id,
            `Class Cancelled: ${classTitle}`,
            `The class session "${classTitle}" scheduled for ${formattedDate} (Addis Ababa Time) has been cancelled by the administration.`,
            "/dashboard/classes"
          ]
        );
      }
    }
  } catch (err) {
    console.error("Failed to notify enrolled students of cancellation:", err);
  }
}

// GET /api/classes/[id] - Fetch class details and enrollment roster with role-based isolation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check optional authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    let userRole = "guest";
    let userId = null;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      userRole = profile?.role || "customer";
      userId = user.id;
    }

    const { data: session, error } = await supabase
      .from("class_sessions")
      .select(`
        id, type, title, description, teacher_id, location, starts_at, ends_at,
        capacity, price, status, livekit_room_name, recording_notes, created_at, updated_at,
        teacher:teacher_id(id, full_name, email, avatar_url),
        enrollments(
          id, student_id, status, payment_proof_path, attended, created_at,
          profiles:student_id(id, full_name, email, phone)
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!session) {
      return NextResponse.json({ error: "Class session not found" }, { status: 404 });
    }

    // Role-based roster isolation:
    // - Admin: sees full roster
    // - Teacher: can only see roster if they are the assigned teacher of THIS session
    // - Customer / Guest: CANNOT see other students' roster
    let sanitizedEnrollments: any[] = [];
    if (userRole === "admin") {
      sanitizedEnrollments = session.enrollments || [];
    } else if (userRole === "teacher") {
      if (session.teacher_id === userId) {
        sanitizedEnrollments = session.enrollments || [];
      } else {
        // Teacher A cannot inspect Teacher B's roster
        sanitizedEnrollments = [];
      }
    } else if (userId) {
      // Customer only sees their own enrollment
      sanitizedEnrollments = (session.enrollments || []).filter((e: any) => e.student_id === userId);
    }

    const activeEnrollments = (session.enrollments || []).filter(
      (e: any) =>
        e.status === "approved" ||
        e.status === "pending_verification" ||
        e.status === "attended" ||
        e.status === "confirmed"
    );

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        enrollments: sanitizedEnrollments,
        enrolledCount: activeEnrollments.length,
        isFull: activeEnrollments.length >= session.capacity,
        spotsLeft: Math.max(0, session.capacity - activeEnrollments.length),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load class session" }, { status: 500 });
  }
}

// PATCH /api/classes/[id] - Update session details or status (Admin or assigned Teacher)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireRole(["admin", "teacher"]);
    const body = await request.json().catch(() => ({}));
    const supabase = await createClient();

    // Check ownership if teacher
    if (user.role === "teacher") {
      const { data: existing } = await supabase
        .from("class_sessions")
        .select("teacher_id")
        .eq("id", id)
        .maybeSingle();

      if (!existing || existing.teacher_id !== user.id) {
        return NextResponse.json({ error: "Access denied. You can only modify your own class sessions." }, { status: 403 });
      }
    }

    // If teacher_id is being changed by admin, verify new teacher has role 'teacher'
    if (body.teacher_id !== undefined && user.role === "admin") {
      const { data: newTeacher } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", body.teacher_id)
        .single();
      if (!newTeacher || newTeacher.role !== "teacher") {
        return NextResponse.json({ error: "Assigned teacher must have the role 'teacher'." }, { status: 400 });
      }
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.location !== undefined) updates.location = String(body.location).trim();
    if (body.starts_at !== undefined) updates.starts_at = body.starts_at;
    if (body.ends_at !== undefined) updates.ends_at = body.ends_at;
    if (body.capacity !== undefined) updates.capacity = Number(body.capacity);
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.status !== undefined) updates.status = body.status;
    if (body.action === "cancel") updates.status = "cancelled";
    if (body.recording_notes !== undefined) updates.recording_notes = String(body.recording_notes).trim();
    if (body.teacher_id !== undefined && user.role === "admin") updates.teacher_id = body.teacher_id;

    const { data: updated, error } = await supabase
      .from("class_sessions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // If cancelled, notify all enrolled students
    if (updates.status === "cancelled") {
      await notifyEnrolledStudentsOfCancellation(id, updated.title, updated.starts_at);
    }

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: updates.status === "cancelled" ? "CANCEL_CLASS_SESSION" : "UPDATE_CLASS_SESSION",
      entity: "class_sessions",
      entity_id: id,
      metadata: updates,
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update class session" }, { status });
  }
}

// DELETE /api/classes/[id] - Delete or cancel session (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await requireRole(["admin"]);
    const supabase = await createClient();

    const { data: session } = await supabase
      .from("class_sessions")
      .select("id, title, starts_at")
      .eq("id", id)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }

    // Check if any enrollments exist
    const { count } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("session_id", id);

    if (count && count > 0) {
      await supabase
        .from("class_sessions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id);

      // Notify all enrolled students
      await notifyEnrolledStudentsOfCancellation(id, session.title, session.starts_at);

      await supabase.from("audit_log").insert({
        actor_id: admin.id,
        action: "CANCEL_CLASS_SESSION_WITH_ENROLLMENTS",
        entity: "class_sessions",
        entity_id: id,
        metadata: { enrollmentsCount: count },
      });

      return NextResponse.json({
        success: true,
        cancelled: true,
        message: "Class session cancelled and enrolled students notified.",
      });
    }

    const { error } = await supabase.from("class_sessions").delete().eq("id", id);
    if (error) throw error;

    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "DELETE_CLASS_SESSION",
      entity: "class_sessions",
      entity_id: id,
      metadata: { deleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to delete class session" }, { status });
  }
}
