import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { pool } from "@/utils/db";
import { isValidUUID } from "@/utils/validation";
import { muteParticipantTrack } from "@/utils/livekit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; identity: string }> }
) {
  try {
    const { sessionId, identity } = await params;
    if (!isValidUUID(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID." }, { status: 400 });
    }

    const user = await requireUser();

    const { rows: sessRows } = await pool.query(
      `SELECT id, teacher_id, livekit_room_name
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
      return NextResponse.json({ error: "Access denied. Only host or admin can mute participants." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const trackSid = body.trackSid;
    const muted = body.muted !== undefined ? Boolean(body.muted) : true;
    const roomName = session.livekit_room_name || `arenguade-live-${session.id.substring(0, 8)}`;

    if (!trackSid || typeof trackSid !== "string") {
      return NextResponse.json({ error: "trackSid is required." }, { status: 400 });
    }

    await muteParticipantTrack(roomName, identity, trackSid, muted);

    return NextResponse.json({ success: true, identity, trackSid, muted });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: status >= 500 ? "Failed to mute participant" : err.message }, { status });
  }
}
