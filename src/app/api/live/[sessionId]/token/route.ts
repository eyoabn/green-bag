import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { createLiveKitToken, getLiveKitConfig } from "@/utils/livekit";

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
      .select("id, title, teacher_id, status, livekit_room_name, type, starts_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessErr || !session) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }

    const roomName = session.livekit_room_name || `arenguade-live-${session.id.substring(0, 8)}`;
    const isHost = user.role === "admin" || session.teacher_id === user.id;

    let canPublish = false;
    let roomAdmin = false;

    if (isHost) {
      canPublish = true;
      roomAdmin = true;
    } else {
      // 2. Student check: must have confirmed/approved enrollment
      const { data: enrollment, error: enrErr } = await supabase
        .from("enrollments")
        .select("id, status")
        .eq("session_id", sessionId)
        .eq("student_id", user.id)
        .maybeSingle();

      if (enrErr || !enrollment) {
        return NextResponse.json({ error: "Access denied. You are not enrolled in this session." }, { status: 403 });
      }

      if (enrollment.status !== "confirmed" && enrollment.status !== "approved" && enrollment.status !== "attended") {
        return NextResponse.json({
          error: `Your enrollment is currently "${enrollment.status}". Access is only granted once payment is verified and confirmed.`,
        }, { status: 403 });
      }

      // 3. Status check: Only teacher/host can open studio; students only admitted once teacher goes live
      if (session.status === "ended" || session.status === "cancelled") {
        return NextResponse.json({
          error: "This live session has ended or been cancelled.",
        }, { status: 403 });
      }

      if (session.status !== "live") {
        return NextResponse.json({
          error: "The instructor has not opened the live studio yet. Please wait in the waiting room — you will be connected automatically once the teacher starts broadcasting.",
          isWaitingForHost: true,
          isLive: false,
          sessionStatus: session.status,
          startsAt: session.starts_at,
          sessionTitle: session.title,
        }, { status: 403 });
      }

      canPublish = false; // Viewers cannot speak by default
      roomAdmin = false;
    }

    const { wsUrl } = getLiveKitConfig();

    const token = await createLiveKitToken({
      roomName,
      identity: user.id,
      name: user.full_name || (isHost ? "Class Instructor" : "Student Participant"),
      canPublish,
      canSubscribe: true,
      roomAdmin,
      ttlSeconds: 7200,
    });

    return NextResponse.json({
      success: true,
      token,
      roomName,
      isHost,
      canPublish,
      livekitUrl: wsUrl,
      sessionTitle: session.title,
      sessionStatus: session.status,
      startsAt: session.starts_at,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to generate live session token" }, { status });
  }
}
