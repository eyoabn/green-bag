import { NextRequest, NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { getLiveKitConfig } from "@/utils/livekit";
import { pool } from "@/utils/db";

// POST /api/livekit/webhook - Verify webhook signature and sync room status
export async function POST(request: NextRequest) {
  try {
    const { apiKey, apiSecret } = getLiveKitConfig();
    const receiver = new WebhookReceiver(apiKey, apiSecret);

    const authHeader = request.headers.get("Authorization") || "";
    const rawBody = await request.text();

    if (!authHeader) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    // verify the signature using livekit-server-sdk
    let event: any;
    try {
      event = await receiver.receive(rawBody, authHeader);
    } catch (err: any) {
      return NextResponse.json({ error: "Invalid webhook signature: " + (err?.message || err) }, { status: 401 });
    }

    const roomName = event.room?.name;
    const eventType = event.event;

    if (roomName) {
      if (eventType === "room_started") {
        await pool.query(
          "UPDATE public.class_sessions SET status = 'live', updated_at = NOW() WHERE livekit_room_name = $1",
          [roomName]
        );
      } else if (eventType === "room_finished") {
        await pool.query(
          "UPDATE public.class_sessions SET status = 'ended', ended_at = NOW(), updated_at = NOW() WHERE livekit_room_name = $1",
          [roomName]
        );
      }
    }

    return NextResponse.json({ success: true, event: eventType, room: roomName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Webhook processing failed" }, { status: 500 });
  }
}
