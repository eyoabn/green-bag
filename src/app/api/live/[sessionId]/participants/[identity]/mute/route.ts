import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { muteParticipantTrack } from "@/utils/livekit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; identity: string }> }
) {
  try {
    const { sessionId, identity } = await params;
    const user = await requireUser();
    const supabase = await createClient();

    const { data: session } = await supabase
      .from("class_sessions")
      .select("id, teacher_id, livekit_room_name")
      .eq("id", sessionId)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    if (user.role !== "admin" && session.teacher_id !== user.id) {
      return NextResponse.json({ error: "Access denied. Only host or admin can mute participants." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const trackSid = body.trackSid;
    const muted = body.muted !== undefined ? Boolean(body.muted) : true;
    const roomName = session.livekit_room_name || `arenguade-live-${session.id.substring(0, 8)}`;

    if (!trackSid) {
      return NextResponse.json({ error: "trackSid is required." }, { status: 400 });
    }

    await muteParticipantTrack(roomName, identity, trackSid, muted);

    return NextResponse.json({ success: true, identity, trackSid, muted });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to mute participant" }, { status });
  }
}
