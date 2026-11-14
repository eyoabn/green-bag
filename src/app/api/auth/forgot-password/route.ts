import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/utils/rateLimit";

function getTrustedSiteOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return parsed.origin;
      }
    } catch {}
  }
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, { limit: 5, windowMs: 60000, prefix: "auth:forgot" });
  if (!rl.allowed && rl.response) {
    return rl.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const acctRl = await checkRateLimit(request, {
      limit: 3,
      windowMs: 60000,
      prefix: "auth:forgot:acct",
      identifier: trimmedEmail,
    });
    if (!acctRl.allowed && acctRl.response) {
      return acctRl.response;
    }

    const supabase = await createClient();

    // Never trust client-supplied Origin header to prevent password-reset link poisoning
    const origin = getTrustedSiteOrigin(request);
    const redirectTo = `${origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });

    if (error) {
      console.warn("Supabase resetPasswordForEmail warning:", error.message);
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Too many reset attempts. Please wait a few minutes before trying again." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists for this email, password reset instructions have been dispatched.",
    });
  } catch (err: any) {
    console.error("Forgot password API error:", err);
    return NextResponse.json(
      { error: "Password recovery service is temporarily unavailable. Please try again." },
      { status: 500 }
    );
  }
}
