import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { pool } from "@/utils/db";
import { createLiveKitToken } from "@/utils/livekit";

// Hardened LiveKit token endpoint: enforces active account, session membership,
// verified payment enrollment, timing window, and binds identity strictly to user.id.
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const room = request.nextUrl.searchParams.get("room")?.trim();

    if (!room) {
      return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
    }

    // Look up session matching this room name via server pool
    const { rows: sessRows } = await pool.query(
      `SELECT id, title, teacher_id, status, livekit_room_name, starts_at
       FROM public.class_sessions
       WHERE livekit_room_name = $1
       LIMIT 1`,
      [room]
    );

    if (sessRows.length === 0) {
      return NextResponse.json({ error: "Access denied. Unknown live classroom." }, { status: 403 });
    }

    const session = sessRows[0];
    const isHost = user.role === "admin" || session.teacher_id === user.id;

    let canPublish = false;
    let roomAdmin = false;

    if (isHost) {
      canPublish = true;
      roomAdmin = true;
    } else {
      const { rows: enrRows } = await pool.query(
        `SELECT id, status FROM public.enrollments WHERE session_id = $1 AND student_id = $2 LIMIT 1`,
        [session.id, user.id]
      );

      if (enrRows.length === 0) {
        return NextResponse.json({ error: "Access denied. You are not enrolled in this session." }, { status: 403 });
      }

      const enrollment = enrRows[0];
      if (!["confirmed", "approved", "attended"].includes(enrollment.status)) {
        return NextResponse.json(
          { error: `Your enrollment is currently "${enrollment.status}". Access is only granted once payment is verified.` },
          { status: 403 }
        );
      }

      if (session.status === "ended" || session.status === "cancelled") {
        return NextResponse.json({ error: "This live session has ended or been cancelled." }, { status: 403 });
      }

      const startTime = session.starts_at ? new Date(session.starts_at) : null;
      const isWithinTenMinutes = startTime ? startTime.getTime() - Date.now() <= 10 * 60 * 1000 : false;
      if (session.status !== "live" && !isWithinTenMinutes) {
        return NextResponse.json(
          { error: "Session is not live yet. Students may join up to 10 minutes before the scheduled start time." },
          { status: 403 }
        );
      }
    }

    // Always bind identity to authenticated user.id — never trust client username query param
    const token = await createLiveKitToken({
      roomName: session.livekit_room_name,
      identity: user.id,
      name: user.full_name || (isHost ? "Class Instructor" : "Student Participant"),
      canPublish,
      canSubscribe: true,
      roomAdmin,
      ttlSeconds: 7200,
    });

    return NextResponse.json({ token, isDemo: false });
  } catch (err: any) {
    const status = err?.status || 500;
    return NextResponse.json({ error: status >= 500 ? "Error generating LiveKit token" : err.message }, { status });
  }
}
