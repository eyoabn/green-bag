import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { deleteLiveKitRoom } from "@/utils/livekit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const user = await requireUser();
    const supabase = await createClient();

    const { data: session, error: sessErr } = await supabase
      .from("class_sessions")
      .select("id, title, teacher_id, livekit_room_name")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessErr || !session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    if (user.role !== "admin" && session.teacher_id !== user.id) {
      return NextResponse.json({ error: "Access denied. Only the assigned teacher or an admin can end this session." }, { status: 403 });
    }

    const roomName = session.livekit_room_name || `arenguade-live-${session.id.substring(0, 8)}`;
    await deleteLiveKitRoom(roomName);

    const { error: updateErr } = await supabase
      .from("class_sessions")
      .update({
        status: "ended",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateErr) throw updateErr;

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "END_LIVE_SESSION",
      entity: "class_sessions",
      entity_id: sessionId,
      metadata: { roomName, title: session.title },
    });

    return NextResponse.json({
      success: true,
      status: "ended",
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to end live session" }, { status });
  }
}
