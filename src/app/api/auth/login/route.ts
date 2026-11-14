import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/utils/rateLimit";
import { LoginSchema } from "@/utils/validation";
import { logAuditEvent } from "@/utils/audit";

export async function POST(request: NextRequest) {
  // Per-IP rate limit protection
  const rl = await checkRateLimit(request, { limit: 20, windowMs: 60000, prefix: "auth:login" });
  if (!rl.allowed && rl.response) {
    return rl.response;
  }

  try {
    const rawBody = await request.json().catch(() => ({}));
    const parseRes = LoginSchema.safeParse(rawBody);
    if (!parseRes.success) {
      return NextResponse.json({ error: parseRes.error.issues[0]?.message || "Invalid credentials." }, { status: 400 });
    }
    const { email, password } = parseRes.data;
    const trimmedEmail = email.trim().toLowerCase();

    // Per-account rate limit to block distributed brute-force attacks
    const acctRl = await checkRateLimit(request, {
      limit: 15,
      windowMs: 60000,
      prefix: "auth:login:acct",
      identifier: trimmedEmail,
    });
    if (!acctRl.allowed && acctRl.response) {
      return acctRl.response;
    }

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: String(password),
    });

    if (authError || !authData.user) {
      await logAuditEvent({
        actorId: null,
        action: "AUTH_LOGIN_FAILED",
        entity: "auth",
        metadata: {
          email: trimmedEmail,
          error: authError?.message || "Unknown credentials failure",
        },
      });

      const isFetchFailed = authError?.message?.toLowerCase().includes("fetch failed");
      const errorMessage = isFetchFailed
        ? "Unable to reach authentication service. Please try again shortly."
        : (authError?.message || "Invalid credentials. Please verify your email and password.");

      return NextResponse.json(
        { error: errorMessage },
        { status: isFetchFailed ? 503 : 401 }
      );
    }

    const { data: profile } = await supabase
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
