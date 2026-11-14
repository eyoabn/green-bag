import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/utils/rateLimit";

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, { limit: 10, windowMs: 60000, prefix: "auth:reset" });
  if (!rl.allowed && rl.response) {
    return rl.response;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "New password must be between 8 and 128 characters long." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: { user }, error: userErr } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { error: "Password recovery session has expired or is invalid. Please request a new reset link." },
        { status: 401 }
      );
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      password: String(password),
    });

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message || "Failed to update password. Please try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully updated. You may now sign in.",
    });
  } catch (err: any) {
    console.error("Reset password API error:", err);
    return NextResponse.json(
      { error: "Unable to complete password reset at this time." },
      { status: 500 }
    );
  }
}
