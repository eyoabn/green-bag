import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireRole } from "@/utils/roles";
import { pool } from "@/utils/db";
import { logAuditEvent } from "@/utils/audit";
import { isValidUUID } from "@/utils/validation";

async function getOptionalViewer() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const profRes = await pool.query(
      "SELECT role, is_active FROM public.profiles WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const profile = profRes.rows[0];
    if (!profile || profile.is_active === false) return null;
    return { id: user.id, role: profile.role as string };
  } catch {
    return null;
  }
}

// Helper to notify all enrolled students when a class is cancelled
async function notifyEnrolledStudentsOfCancellation(sessionId: string, classTitle: string, startsAt?: string) {
  try {
    const res = await pool.query(
      `SELECT student_id FROM public.enrollments WHERE session_id = $1 AND status != 'cancelled'`,
      [sessionId]
    );

    if (res.rows && res.rows.length > 0) {
      const formattedDate = startsAt
        ? new Date(startsAt).toLocaleString("en-US", { timeZone: "Africa/Addis_Ababa" })
        : "the scheduled time";
      for (const row of res.rows) {
        await pool.query(
          `INSERT INTO public.notifications (user_id, title, body, link)
           VALUES ($1, $2, $3, $4)`,
          [
            row.student_id,
            `Class Cancelled: ${classTitle}`,
            `The class session "${classTitle}" scheduled for ${formattedDate} (Addis Ababa Time) has been cancelled by the administration.`,
            "/dashboard/classes",
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
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid class session ID" }, { status: 400 });
    }

    const viewer = await getOptionalViewer();
    const userRole = viewer?.role || "guest";
    const userId = viewer?.id || null;

    const sessionRes = await pool.query(
      `
      SELECT
        cs.id, cs.type, cs.title, cs.description, cs.teacher_id, cs.location,
        cs.starts_at, cs.ends_at, cs.capacity, cs.price, cs.status,
        cs.livekit_room_name, cs.recording_notes, cs.created_at, cs.updated_at,
        t.id AS teacher_profile_id, t.full_name AS teacher_full_name,
        t.email AS teacher_email, t.avatar_url AS teacher_avatar_url
      FROM public.class_sessions cs
      LEFT JOIN public.profiles t ON t.id = cs.teacher_id
      WHERE cs.id = $1
      LIMIT 1
      `,
      [id]
    );

    const row = sessionRes.rows[0];
    if (!row) {
      return NextResponse.json({ error: "Class session not found" }, { status: 404 });
    }

    const enrollmentsRes = await pool.query(
      `
      SELECT
        e.id, e.student_id, e.status, e.payment_proof_path, e.attended, e.created_at,
        p.id AS student_profile_id, p.full_name AS student_full_name,
        p.email AS student_email, p.phone AS student_phone
      FROM public.enrollments e
      LEFT JOIN public.profiles p ON p.id = e.student_id
      WHERE e.session_id = $1
      ORDER BY e.created_at ASC
      `,
      [id]
    );

    const allEnrollments = enrollmentsRes.rows.map((e: any) => ({
      id: e.id,
      student_id: e.student_id,
      status: e.status,
      payment_proof_path: e.payment_proof_path,
      attended: e.attended,
      created_at: e.created_at,
      profiles: e.student_profile_id
        ? {
            id: e.student_profile_id,
            full_name: e.student_full_name,
            email: e.student_email,
            phone: e.student_phone,
          }
        : null,
    }));

    const isHostOrAdmin =
      userRole === "admin" || (userRole === "teacher" && row.teacher_id === userId);

    // Role-based roster isolation:
    // - Admin / assigned Teacher: sees full roster
    // - Other Customer / Teacher: only sees their own enrollment (or none)
    // - Guest: []
    let sanitizedEnrollments: any[] = [];
    if (isHostOrAdmin) {
      sanitizedEnrollments = allEnrollments;
    } else if (userId) {
      sanitizedEnrollments = allEnrollments.filter((e: any) => e.student_id === userId);
    }

    const activeEnrollments = allEnrollments.filter(
      (e: any) =>
        e.status === "approved" ||
        e.status === "pending_verification" ||
        e.status === "attended" ||
        e.status === "confirmed"
    );

    const sessionPayload: any = {
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      teacher_id: row.teacher_id,
      location: row.location,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      capacity: row.capacity,
      price: row.price,
      status: row.status,
      recording_notes: row.recording_notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      teacher: row.teacher_profile_id
        ? {
            id: row.teacher_profile_id,
            full_name: row.teacher_full_name,
            avatar_url: row.teacher_avatar_url,
            ...(isHostOrAdmin ? { email: row.teacher_email } : {}),
          }
        : null,
      enrollments: sanitizedEnrollments,
      enrolledCount: activeEnrollments.length,
      isFull: activeEnrollments.length >= row.capacity,
      spotsLeft: Math.max(0, row.capacity - activeEnrollments.length),
    };

    if (isHostOrAdmin) {
      sessionPayload.livekit_room_name = row.livekit_room_name;
    }

    return NextResponse.json({
      success: true,
      session: sessionPayload,
    });
  } catch (err: any) {
    console.error("Load class session detail error:", err);
    return NextResponse.json({ error: "Failed to load class session" }, { status: 500 });
  }
}

// PATCH /api/classes/[id] - Update session details or status (Admin or assigned Teacher)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid class session ID" }, { status: 400 });
    }

    const user = await requireRole(["admin", "teacher"]);
    const body = await request.json().catch(() => ({}));

    const existingRes = await pool.query(
      "SELECT id, teacher_id, price, starts_at FROM public.class_sessions WHERE id = $1 LIMIT 1",
      [id]
    );
    const existing = existingRes.rows[0];
    if (!existing) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }

    if (user.role === "teacher" && existing.teacher_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied. You can only modify your own class sessions." },
        { status: 403 }
      );
    }

    if (user.role !== "admin") {
      if (body.price !== undefined && Number(body.price) !== Number(existing.price)) {
        return NextResponse.json(
          { error: "Only administrators may modify workshop pricing." },
          { status: 403 }
        );
      }
      if (body.teacher_id !== undefined && body.teacher_id !== existing.teacher_id) {
        return NextResponse.json(
          { error: "Only administrators may reassign workshop instructors." },
          { status: 403 }
        );
      }
    }

    if (body.teacher_id !== undefined && user.role === "admin") {
      if (!isValidUUID(body.teacher_id)) {
        return NextResponse.json({ error: "Assigned teacher ID must be a valid UUID." }, { status: 400 });
      }
      const newTeacherRes = await pool.query(
        "SELECT role FROM public.profiles WHERE id = $1 LIMIT 1",
        [body.teacher_id]
      );
      const newTeacher = newTeacherRes.rows[0];
      if (!newTeacher || (newTeacher.role !== "teacher" && newTeacher.role !== "admin")) {
        return NextResponse.json(
          { error: "Assigned teacher must have the role 'teacher' or 'admin'." },
          { status: 400 }
        );
      }
    }

    const setClauses: string[] = ["updated_at = NOW()"];
    const values: any[] = [id];
    const auditMetadata: Record<string, any> = {};
    let paramIdx = 2;

    if (body.title !== undefined) {
      const cleanTitle = String(body.title).trim();
      if (cleanTitle.length < 3 || cleanTitle.length > 200) {
        return NextResponse.json({ error: "Title must be between 3 and 200 characters." }, { status: 400 });
      }
      setClauses.push(`title = $${paramIdx++}`);
      values.push(cleanTitle);
      auditMetadata.title = cleanTitle;
    }

    if (body.description !== undefined) {
      const desc = String(body.description).trim().slice(0, 2000);
      setClauses.push(`description = $${paramIdx++}`);
      values.push(desc);
      auditMetadata.description = desc;
    }

    if (body.location !== undefined) {
      const loc = String(body.location).trim().slice(0, 300);
      setClauses.push(`location = $${paramIdx++}`);
      values.push(loc);
      auditMetadata.location = loc;
    }

    if (body.starts_at !== undefined) {
      const startMs = Date.parse(body.starts_at);
      if (!Number.isFinite(startMs)) {
        return NextResponse.json({ error: "Invalid starts_at timestamp." }, { status: 400 });
      }
      const startIso = new Date(startMs).toISOString();
      setClauses.push(`starts_at = $${paramIdx++}`);
      values.push(startIso);
      auditMetadata.starts_at = startIso;
    }

    if (body.ends_at !== undefined) {
      const endMs = Date.parse(body.ends_at);
      const baseStartMs =
        auditMetadata.starts_at !== undefined
          ? Date.parse(auditMetadata.starts_at)
          : new Date(existing.starts_at).getTime();
      if (!Number.isFinite(endMs) || endMs <= baseStartMs) {
        return NextResponse.json({ error: "ends_at must be after starts_at." }, { status: 400 });
      }
      const endIso = new Date(endMs).toISOString();
      setClauses.push(`ends_at = $${paramIdx++}`);
      values.push(endIso);
      auditMetadata.ends_at = endIso;
    }

    if (body.capacity !== undefined) {
      const cap = Number(body.capacity);
      if (!Number.isInteger(cap) || cap < 1 || cap > 500) {
        return NextResponse.json({ error: "Capacity must be an integer between 1 and 500." }, { status: 400 });
      }
      setClauses.push(`capacity = $${paramIdx++}`);
      values.push(cap);
      auditMetadata.capacity = cap;
    }

    if (body.price !== undefined && user.role === "admin") {
      const pr = Number(body.price);
      if (!Number.isFinite(pr) || pr < 0 || pr > 1000000) {
        return NextResponse.json({ error: "Price must be between 0 and 1,000,000." }, { status: 400 });
      }
      setClauses.push(`price = $${paramIdx++}`);
      values.push(pr);
      auditMetadata.price = pr;
    }

    let nextStatus: string | undefined;
    if (body.status !== undefined) {
      if (!["scheduled", "live", "ended", "cancelled"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid session status." }, { status: 400 });
      }
      nextStatus = body.status;
    }
    if (body.action === "cancel") {
      nextStatus = "cancelled";
    }
    if (nextStatus !== undefined) {
      setClauses.push(`status = $${paramIdx++}`);
      values.push(nextStatus);
      auditMetadata.status = nextStatus;
    }

    if (body.recording_notes !== undefined) {
      const notes = String(body.recording_notes).trim().slice(0, 4000);
      setClauses.push(`recording_notes = $${paramIdx++}`);
      values.push(notes);
      auditMetadata.recording_notes = notes;
    }

    if (body.teacher_id !== undefined && user.role === "admin") {
      setClauses.push(`teacher_id = $${paramIdx++}`);
      values.push(body.teacher_id);
      auditMetadata.teacher_id = body.teacher_id;
    }

    const updateRes = await pool.query(
      `
      UPDATE public.class_sessions
      SET ${setClauses.join(", ")}
      WHERE id = $1
      RETURNING *
      `,
      values
    );

    const updated = updateRes.rows[0];

    if (nextStatus === "cancelled") {
      await notifyEnrolledStudentsOfCancellation(id, updated.title, updated.starts_at);
    }

    await logAuditEvent({
      actorId: user.id,
      action: nextStatus === "cancelled" ? "CANCEL_CLASS_SESSION" : "UPDATE_CLASS_SESSION",
      entity: "class_sessions",
      entityId: id,
      metadata: auditMetadata,
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (err: any) {
    console.error("Update class session error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to update class session" },
      { status }
    );
  }
}

// DELETE /api/classes/[id] - Delete or cancel session (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid class session ID" }, { status: 400 });
    }

    const admin = await requireRole(["admin"]);

    const sessionRes = await pool.query(
      "SELECT id, title, starts_at FROM public.class_sessions WHERE id = $1 LIMIT 1",
      [id]
    );
    const session = sessionRes.rows[0];
    if (!session) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }

    const countRes = await pool.query(
      "SELECT COUNT(*)::int AS cnt FROM public.enrollments WHERE session_id = $1",
      [id]
    );
    const count = countRes.rows[0]?.cnt || 0;

    if (count > 0) {
      await pool.query(
        "UPDATE public.class_sessions SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
        [id]
      );

      await notifyEnrolledStudentsOfCancellation(id, session.title, session.starts_at);

      await logAuditEvent({
        actorId: admin.id,
        action: "CANCEL_CLASS_SESSION_WITH_ENROLLMENTS",
        entity: "class_sessions",
        entityId: id,
        metadata: { enrollmentsCount: count },
      });

      return NextResponse.json({
        success: true,
        cancelled: true,
        message: "Class session cancelled and enrolled students notified.",
      });
    }

    await pool.query("DELETE FROM public.class_sessions WHERE id = $1", [id]);

    await logAuditEvent({
      actorId: admin.id,
      action: "DELETE_CLASS_SESSION",
      entity: "class_sessions",
      entityId: id,
      metadata: { deleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete class session error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to delete class session" },
      { status }
    );
  }
}
