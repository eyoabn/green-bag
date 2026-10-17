import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireRole, requireUser } from "@/utils/roles";

// GET /api/classes/[id] - Fetch class details and enrollment roster
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

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

    const activeEnrollments = (session.enrollments || []).filter(
      (e: any) => e.status === "confirmed" || e.status === "pending" || e.status === "attended"
    );

    return NextResponse.json({
      success: true,
      session: {
        ...session,
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

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.location !== undefined) updates.location = String(body.location).trim();
    if (body.starts_at !== undefined) updates.starts_at = body.starts_at;
    if (body.ends_at !== undefined) updates.ends_at = body.ends_at;
    if (body.capacity !== undefined) updates.capacity = Number(body.capacity);
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.status !== undefined) updates.status = body.status;
    if (body.recording_notes !== undefined) updates.recording_notes = String(body.recording_notes).trim();
    if (body.teacher_id !== undefined && user.role === "admin") updates.teacher_id = body.teacher_id;

    const { data: updated, error } = await supabase
      .from("class_sessions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "UPDATE_CLASS_SESSION",
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

    // Soft cancel if enrollments exist
    const { count } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("session_id", id);

    if (count && count > 0) {
      await supabase
        .from("class_sessions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", id);

      await supabase.from("audit_log").insert({
        actor_id: admin.id,
        action: "CANCEL_CLASS_SESSION_WITH_ENROLLMENTS",
        entity: "class_sessions",
        entity_id: id,
        metadata: { enrollmentsCount: count },
      });

      return NextResponse.json({ success: true, cancelled: true, message: "Class session cancelled because active enrollments exist." });
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
