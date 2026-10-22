import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@/utils/supabase/server';
import { getLiveKitConfig } from '@/utils/livekit';

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get('room');
  const username = request.nextUrl.searchParams.get('username');
  
  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  }
  if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
  }

  // Security check: ensure user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { apiKey, apiSecret } = getLiveKitConfig();
    
    // Create a real signed LiveKit access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
      name: user.user_metadata?.full_name || username,
    });
    
    at.addGrant({ roomJoin: true, room: room });
    const token = await at.toJwt();
    return NextResponse.json({ token, isDemo: false });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error generating LiveKit token' }, { status: 500 });
  }
}
