import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { pool } from "@/utils/db";
import { isValidUUID } from "@/utils/validation";
import { ensureLiveKitRoom } from "@/utils/livekit";
import { logAuditEvent } from "@/utils/audit";

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
      `SELECT id, title, teacher_id, status, livekit_room_name, type
       FROM public.class_sessions
       WHERE id = $1
       LIMIT 1`,
      [sessionId]
    );

    if (sessRows.length === 0) {
      return NextResponse.json({ error: "Class session not found." }, { status: 404 });
    }
    const session = sessRows[0];

    if (user.role !== "admin" && session.teacher_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied. Only the assigned teacher or an admin can start this session." },
        { status: 403 }
      );
    }

    const roomName = session.livekit_room_name || `arenguade-live-${session.id.substring(0, 8)}`;

    await ensureLiveKitRoom(roomName);

    await pool.query(
      `UPDATE public.class_sessions
       SET status = 'live', livekit_room_name = $1, updated_at = NOW()
       WHERE id = $2`,
      [roomName, sessionId]
    );

    await pool.query(
      `INSERT INTO public.notifications (user_id, title, body, link)
       SELECT student_id, 'Class is Now Live!', $1, $2
       FROM public.enrollments
       WHERE session_id = $3 AND status IN ('confirmed', 'approved')`,
      [
        `Class "${session.title}" has started. Tap to join the live studio room now.`,
        `/dashboard/live/${session.id}`,
        sessionId,
      ]
    );

    await logAuditEvent({
      actorId: user.id,
      action: "START_LIVE_SESSION",
      entity: "class_sessions",
      entityId: sessionId,
      metadata: { roomName, title: session.title },
    });

    return NextResponse.json({
      success: true,
      status: "live",
      roomName,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: status >= 500 ? "Failed to start live session" : err.message }, { status });
  }
}
