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

// GET /api/classes - Publicly list scheduled and live classes with enrollment counts
export async function GET(request: NextRequest) {
  try {
    const viewer = await getOptionalViewer();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const upcomingOnly = searchParams.get("upcoming") === "true";

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (type && type !== "all") {
      if (!["in_person", "live"].includes(type)) {
        return NextResponse.json({ error: "Invalid class type filter." }, { status: 400 });
      }
      conditions.push(`cs.type = $${idx++}`);
      params.push(type);
    }

    if (status && status !== "all") {
      if (!["scheduled", "live", "ended", "cancelled"].includes(status)) {
        return NextResponse.json({ error: "Invalid class status filter." }, { status: 400 });
      }
      conditions.push(`cs.status = $${idx++}`);
      params.push(status);
    } else if (!status) {
      conditions.push(`cs.status IN ('scheduled', 'live', 'ended')`);
    }

    if (upcomingOnly) {
      conditions.push(`cs.starts_at >= NOW()`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const res = await pool.query(
      `
      SELECT
        cs.id, cs.type, cs.title, cs.description, cs.teacher_id, cs.location,
        cs.starts_at, cs.ends_at, cs.capacity, cs.price, cs.status,
        cs.livekit_room_name, cs.recording_notes, cs.created_at, cs.updated_at,
        t.id AS teacher_profile_id, t.full_name AS teacher_full_name, t.email AS teacher_email,
        COALESCE(
          json_agg(json_build_object('id', e.id, 'status', e.status))
          FILTER (WHERE e.id IS NOT NULL),
          '[]'::json
        ) AS enrollments
      FROM public.class_sessions cs
      LEFT JOIN public.profiles t ON t.id = cs.teacher_id
      LEFT JOIN public.enrollments e ON e.session_id = cs.id
      ${whereClause}
      GROUP BY cs.id, t.id, t.full_name, t.email
      ORDER BY cs.starts_at ASC
      `,
      params
    );

    const mapped = res.rows.map((row: any) => {
      const canSeePrivateHostFields =
        viewer && (viewer.role === "admin" || (viewer.role === "teacher" && viewer.id === row.teacher_id));

      const enrollments = Array.isArray(row.enrollments) ? row.enrollments : [];
      const activeEnrollments = enrollments.filter(
        (e: any) =>
          e.status === "approved" ||
          e.status === "pending_verification" ||
          e.status === "attended" ||
          e.status === "confirmed"
      );

      const sessionObj: any = {
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
              ...(canSeePrivateHostFields ? { email: row.teacher_email } : {}),
            }
          : null,
        enrollments,
        enrolledCount: activeEnrollments.length,
        isFull: activeEnrollments.length >= row.capacity,
        spotsLeft: Math.max(0, row.capacity - activeEnrollments.length),
      };

      if (canSeePrivateHostFields) {
        sessionObj.livekit_room_name = row.livekit_room_name;
      }

      return sessionObj;
    });

    return NextResponse.json({
      success: true,
      classes: mapped,
    });
  } catch (err: any) {
    console.error("Load classes error:", err);
    return NextResponse.json({ error: "Failed to load classes" }, { status: 500 });
  }
}

// POST /api/classes - Create new class session (Admin or Teacher)
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["admin", "teacher"]);
    const body = await request.json().catch(() => ({}));
    const {
      type = "live",
      title,
      description = "",
      location = "",
      starts_at,
      ends_at,
      capacity = 20,
      price = 0,
      teacher_id,
    } = body;

    if (!["in_person", "live"].includes(type)) {
      return NextResponse.json({ error: "Invalid session type." }, { status: 400 });
    }

    const cleanTitle = typeof title === "string" ? title.trim() : "";
    if (cleanTitle.length < 3 || cleanTitle.length > 200) {
      return NextResponse.json(
        { error: "Workshop title must be between 3 and 200 characters." },
        { status: 400 }
      );
    }

    const startMs = starts_at ? Date.parse(starts_at) : NaN;
    if (!Number.isFinite(startMs)) {
      return NextResponse.json({ error: "Valid starts_at timestamp is required." }, { status: 400 });
    }
    const startIso = new Date(startMs).toISOString();

    const endMs = ends_at ? Date.parse(ends_at) : startMs + 1000 * 60 * 120;
    if (!Number.isFinite(endMs) || endMs <= startMs) {
      return NextResponse.json({ error: "ends_at must be a valid timestamp after starts_at." }, { status: 400 });
    }
    const endIso = new Date(endMs).toISOString();

    const parsedCapacity = Number(capacity);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1 || parsedCapacity > 500) {
      return NextResponse.json({ error: "Capacity must be an integer between 1 and 500." }, { status: 400 });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0 || parsedPrice > 1000000) {
      return NextResponse.json({ error: "Price must be between 0 and 1,000,000." }, { status: 400 });
    }

    let assignedTeacherId = user.id;
    if (user.role === "admin" && teacher_id) {
      if (!isValidUUID(teacher_id)) {
        return NextResponse.json({ error: "Teacher ID must be a valid UUID." }, { status: 400 });
      }
      const teacherRes = await pool.query(
        "SELECT id, role FROM public.profiles WHERE id = $1 LIMIT 1",
        [teacher_id]
      );
      const teacherProfile = teacherRes.rows[0];
      if (!teacherProfile || (teacherProfile.role !== "teacher" && teacherProfile.role !== "admin")) {
        return NextResponse.json(
          { error: "Assigned teacher must have the role 'teacher'." },
          { status: 400 }
        );
      }
      assignedTeacherId = teacher_id;
    }

    const roomName =
      type === "live"
        ? `arenguade-live-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
        : null;

    const cleanLocation =
      type === "in_person"
        ? (typeof location === "string" && location.trim() ? location.trim().slice(0, 300) : "Addis Ababa Studio (Bole Subcity)")
        : "LiveKit Interactive Video Room";

    const cleanDescription = typeof description === "string" ? description.trim().slice(0, 2000) : "";

    const insertRes = await pool.query(
      `
      INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, ends_at,
        capacity, price, status, teacher_id, livekit_room_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled', $9, $10)
      RETURNING
        id, type, title, description, teacher_id, location, starts_at, ends_at,
        capacity, price, status, livekit_room_name, created_at
      `,
      [
        type,
        cleanTitle,
        cleanDescription,
        cleanLocation,
        startIso,
        endIso,
        parsedCapacity,
        parsedPrice,
        assignedTeacherId,
        roomName,
      ]
    );

    const session = insertRes.rows[0];

    await logAuditEvent({
      actorId: user.id,
      action: "CREATE_CLASS_SESSION",
      entity: "class_sessions",
      entityId: session.id,
      metadata: { title: cleanTitle, type, capacity: parsedCapacity, price: parsedPrice, assignedTeacherId },
    });

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    console.error("Create class session error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to create class session" },
      { status }
    );
  }
}
