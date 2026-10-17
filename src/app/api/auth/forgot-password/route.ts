import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
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
    const supabase = await createClient();

    const origin = request.headers.get("origin") || request.nextUrl.origin;
    const redirectTo = `${origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });

    if (error) {
      console.warn("Supabase resetPasswordForEmail warning:", error.message);
      // For security and UX, don't expose account existence leaks; if rate limited or config error, return readable message
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
