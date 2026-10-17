import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: String(password),
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    // Query real profile from PostgreSQL
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, is_active, avatar_url")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    const userPayload = {
      id: authData.user.id,
      email: authData.user.email,
      full_name: profile?.full_name || authData.user.user_metadata?.full_name || "Valued User",
      phone: profile?.phone || authData.user.user_metadata?.phone || "",
      role: profile?.role || "customer",
      is_active: profile?.is_active ?? true,
      avatar_url: profile?.avatar_url || "",
    };

    return NextResponse.json({
      success: true,
      user: userPayload,
    });
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json({ error: "Authentication service temporarily unavailable." }, { status: 500 });
  }
}
