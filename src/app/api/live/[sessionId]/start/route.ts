import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { ensureLiveKitRoom } from "@/utils/livekit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await requireUser();
    const supabase = await createClient();

    // 1. Fetch class session
    const { data: session, error: sessErr } = await supabase
      .from("class_sessions")
      .select("id, title, teacher_id, status, livekit_room_name, type")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessErr || !session) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }

    // 2. Auth guard: Must be admin or assigned teacher
    if (user.role !== "admin" && session.teacher_id !== user.id) {
      return NextResponse.json({ error: "Access denied. Only the assigned teacher or an admin can start this session." }, { status: 403 });
    }

    // 3. Confirm or generate room name
    const roomName = session.livekit_room_name || `arenguade-live-${session.id.substring(0, 8)}`;

    // 4. Create room on LiveKit Cloud
    await ensureLiveKitRoom(roomName);

    // 5. Update session status to 'live'
    const { error: updateErr } = await supabase
      .from("class_sessions")
      .update({
        status: "live",
        livekit_room_name: roomName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateErr) throw updateErr;

    // 6. Notify confirmed students
    const { data: confirmedEnrollments } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("session_id", sessionId)
      .in("status", ["confirmed", "approved"]);

    if (confirmedEnrollments && confirmedEnrollments.length > 0) {
      const notifications = confirmedEnrollments.map((enr) => ({
        user_id: enr.student_id,
        title: "Class is Now Live!",
        message: `Class "${session.title}" has started. Tap to join the live studio room now.`,
        link: `/dashboard/live/${session.id}`,
      }));
      await supabase.from("notifications").insert(notifications);
    }

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "START_LIVE_SESSION",
      entity: "class_sessions",
      entity_id: sessionId,
      metadata: { roomName, title: session.title },
    });

    return NextResponse.json({
      success: true,
      status: "live",
      roomName,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to start live session" }, { status });
  }
}
