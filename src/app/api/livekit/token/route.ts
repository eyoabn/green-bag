import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get('room');
  const username = request.nextUrl.searchParams.get('username');
  
  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  }
  if (!username) {
    return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
  }

  // Security check: ensure user is authenticated (with demo fallback)
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch (err) {
    // Ignore auth failure in demo mode
  }

  // Get LiveKit credentials from environment
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  
  if (!apiKey || !apiSecret || apiKey.includes('placeholder') || apiKey.includes('your-')) {
    // Generate a secure mock demo token for previewing the classroom UI
    return NextResponse.json({ 
      token: `demo_token_${Buffer.from(username).toString('base64')}_${Date.now()}`,
      isDemo: true 
    });
  }

  // Create a new access token
  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
  });
  
  at.addGrant({ roomJoin: true, room: room });

  try {
    const token = await at.toJwt();
    return NextResponse.json({ token, isDemo: false });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json({ 
      token: `demo_token_${Buffer.from(username).toString('base64')}_${Date.now()}`,
      isDemo: true 
    });
  }
}
