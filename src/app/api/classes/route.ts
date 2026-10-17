import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireRole } from "@/utils/roles";

// GET /api/classes - Publicly list scheduled and live classes with enrollment counts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    let query = supabase
      .from("class_sessions")
      .select(`
        id, type, title, description, teacher_id, location, starts_at, ends_at,
        capacity, price, status, livekit_room_name, recording_notes, created_at, updated_at,
        teacher:teacher_id(id, full_name, email),
        enrollments(id, status)
      `)
      .order("starts_at", { ascending: true });

    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    } else if (!status) {
      // By default show scheduled, live, and recently ended
      query = query.in("status", ["scheduled", "live", "ended"]);
    }

    const { data: sessions, error } = await query;
    if (error) throw error;

    // Calculate active enrolled count per session
    const mapped = (sessions || []).map((s) => {
      const activeEnrollments = (s.enrollments || []).filter(
        (e: any) => e.status === "confirmed" || e.status === "pending" || e.status === "attended"
      );
      return {
        ...s,
        enrolledCount: activeEnrollments.length,
        isFull: activeEnrollments.length >= s.capacity,
        spotsLeft: Math.max(0, s.capacity - activeEnrollments.length),
      };
    });

    return NextResponse.json({
      success: true,
      classes: mapped,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load classes" }, { status: 500 });
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

    if (!title || !starts_at) {
      return NextResponse.json({ error: "Title and starts_at timestamp are required." }, { status: 400 });
    }

    const assignedTeacherId = user.role === "admin" ? (teacher_id || user.id) : user.id;
    const roomName = type === "live" ? `arenguade-live-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}` : null;

    const supabase = await createClient();
    const { data: session, error } = await supabase
      .from("class_sessions")
      .insert({
        type,
        title,
        description,
        location: type === "in_person" ? (location || "Addis Ababa Studio (Bole Subcity)") : "LiveKit Interactive Video Room",
        starts_at,
        ends_at: ends_at || new Date(new Date(starts_at).getTime() + 1000 * 60 * 120).toISOString(),
        capacity: Number(capacity),
        price: Number(price),
        status: "scheduled",
        teacher_id: assignedTeacherId,
        livekit_room_name: roomName,
      })
      .select(`
        id, type, title, description, teacher_id, location, starts_at, ends_at,
        capacity, price, status, livekit_room_name, created_at
      `)
      .single();

    if (error) throw error;

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "CREATE_CLASS_SESSION",
      entity: "class_sessions",
      entity_id: session.id,
      metadata: { title, type, capacity, price },
    });

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to create class session" }, { status });
  }
}
