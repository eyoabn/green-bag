import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { pool } from "@/utils/db";
import { isValidUUID } from "@/utils/validation";
import { deleteLiveKitRoom } from "@/utils/livekit";
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
      `SELECT id, title, teacher_id, livekit_room_name
       FROM public.class_sessions
       WHERE id = $1
       LIMIT 1`,
      [sessionId]
    );

    if (sessRows.length === 0) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }
    const session = sessRows[0];

    if (user.role !== "admin" && session.teacher_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied. Only the assigned teacher or an admin can end this session." },
        { status: 403 }
      );
    }

    const roomName = session.livekit_room_name || `arenguade-live-${session.id.substring(0, 8)}`;
    await deleteLiveKitRoom(roomName);

    await pool.query(
      `UPDATE public.class_sessions
       SET status = 'ended', ended_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );

    await logAuditEvent({
      actorId: user.id,
      action: "END_LIVE_SESSION",
      entity: "class_sessions",
      entityId: sessionId,
      metadata: { roomName, title: session.title },
    });

    return NextResponse.json({
      success: true,
      status: "ended",
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: status >= 500 ? "Failed to end live session" : err.message }, { status });
  }
}
