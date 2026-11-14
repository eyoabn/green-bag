import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { pool } from "@/utils/db";
import { isValidUUID } from "@/utils/validation";
import { createLiveKitToken, getLiveKitConfig } from "@/utils/livekit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    if (!isValidUUID(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID." }, { status: 400 });
    }

    const user = await requireUser();

    const { rows: sessRows } = await pool.query(
      `SELECT id, title, teacher_id, status, livekit_room_name, type, starts_at
       FROM public.class_sessions
       WHERE id = $1
       LIMIT 1`,
      [sessionId]
    );

    if (sessRows.length === 0) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }
    const session = sessRows[0];

    const roomName = session.livekit_room_name || `arenguade-live-${session.id.substring(0, 8)}`;
    const isHost = user.role === "admin" || session.teacher_id === user.id;

    let canPublish = false;
    let roomAdmin = false;

    if (isHost) {
      canPublish = true;
      roomAdmin = true;
    } else {
      const { rows: enrRows } = await pool.query(
        `SELECT id, status FROM public.enrollments WHERE session_id = $1 AND student_id = $2 LIMIT 1`,
        [sessionId, user.id]
      );

      if (enrRows.length === 0) {
        return NextResponse.json({ error: "Access denied. You are not enrolled in this session." }, { status: 403 });
      }
      const enrollment = enrRows[0];

      if (enrollment.status !== "confirmed" && enrollment.status !== "approved" && enrollment.status !== "attended") {
        return NextResponse.json({
          error: `Your enrollment is currently "${enrollment.status}". Access is only granted once payment is verified and confirmed.`,
        }, { status: 403 });
      }

      if (session.status === "ended" || session.status === "cancelled") {
        return NextResponse.json({
          error: "This live session has ended or been cancelled.",
        }, { status: 403 });
      }

      const now = new Date();
      const startTime = session.starts_at ? new Date(session.starts_at) : null;
      const isWithinTenMinutes = startTime ? (startTime.getTime() - now.getTime() <= 10 * 60 * 1000) : false;

      if (session.status !== "live" && !isWithinTenMinutes) {
        return NextResponse.json({
          error: "Session is not live yet. Students may join up to 10 minutes before the scheduled start time.",
          isWaitingForHost: true,
          isLive: false,
          sessionStatus: session.status,
          startsAt: session.starts_at,
          sessionTitle: session.title,
        }, { status: 403 });
      }

      canPublish = false;
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
    return NextResponse.json({ error: status >= 500 ? "Failed to generate live session token" : err.message }, { status });
  }
}
