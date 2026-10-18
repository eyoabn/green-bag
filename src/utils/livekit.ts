import { RoomServiceClient, AccessToken } from "livekit-server-sdk";

export function getLiveKitConfig() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const rawUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL || "";

  if (!apiKey || !apiSecret || !rawUrl) {
    throw new Error("Missing LiveKit credentials. Set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL in .env.local.");
  }

  // RoomServiceClient requires http/https URL scheme
  const httpUrl = rawUrl.replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://");

  return { apiKey, apiSecret, wsUrl: rawUrl, httpUrl };
}

let roomServiceClientInstance: RoomServiceClient | null = null;

export function getRoomServiceClient(): RoomServiceClient {
  if (!roomServiceClientInstance) {
    const { httpUrl, apiKey, apiSecret } = getLiveKitConfig();
    roomServiceClientInstance = new RoomServiceClient(httpUrl, apiKey, apiSecret);
  }
  return roomServiceClientInstance;
}

export async function createLiveKitToken({
  roomName,
  identity,
  name,
  canPublish = false,
  canSubscribe = true,
  roomAdmin = false,
  ttlSeconds = 7200, // 2 hours
}: {
  roomName: string;
  identity: string;
  name: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
  roomAdmin?: boolean;
  ttlSeconds?: number;
}): Promise<string> {
  const { apiKey, apiSecret } = getLiveKitConfig();

  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: `${ttlSeconds}s`,
  });

  const videoGrant: any = {
    room: roomName,
    roomJoin: true,
    canPublish,
    canSubscribe,
    canPublishData: true,
  };

  if (roomAdmin) {
    videoGrant.roomAdmin = true;
  }

  at.addGrant(videoGrant);

  return await at.toJwt();
}

export async function ensureLiveKitRoom(roomName: string, emptyTimeout = 3600): Promise<any> {
  const client = getRoomServiceClient();
  try {
    const room = await client.createRoom({
      name: roomName,
      emptyTimeout,
      maxParticipants: 100,
    });
    return room;
  } catch (err: any) {
    // If room already exists, ignore error
    if (err.message && err.message.includes("already exists")) {
      return { name: roomName };
    }
    throw err;
  }
}

export async function deleteLiveKitRoom(roomName: string): Promise<void> {
  const client = getRoomServiceClient();
  try {
    await client.deleteRoom(roomName);
  } catch (err: any) {
    console.warn("Delete room warning:", err?.message || err);
  }
}

export async function updateParticipantPermissions(
  roomName: string,
  identity: string,
  permissions: {
    canPublish?: boolean;
    canSubscribe?: boolean;
    canPublishData?: boolean;
  }
): Promise<any> {
  const client = getRoomServiceClient();
  return await client.updateParticipant(
    roomName,
    identity,
    undefined, // metadata
    {
      canPublish: permissions.canPublish ?? false,
      canSubscribe: permissions.canSubscribe ?? true,
      canPublishData: permissions.canPublishData ?? true,
      hidden: false,
      recorder: false,
    }
  );
}

export async function muteParticipantTrack(
  roomName: string,
  identity: string,
  trackSid: string,
  muted = true
): Promise<any> {
  const client = getRoomServiceClient();
  return await client.mutePublishedTrack(roomName, identity, trackSid, muted);
}

export async function removeLiveKitParticipant(roomName: string, identity: string): Promise<void> {
  const client = getRoomServiceClient();
  await client.removeParticipant(roomName, identity);
}
