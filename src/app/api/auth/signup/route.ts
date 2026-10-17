import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, fullName, phone } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const displayName = (fullName && fullName.trim()) || trimmedEmail.split("@")[0];
    const phoneNum = (phone && phone.trim()) || "";

    const supabase = await createClient();

    // In accordance with Section 2, all public signups are strictly granted role 'customer'
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: String(password),
      options: {
        data: {
          full_name: displayName,
          phone: phoneNum,
          role: "customer",
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Registration could not be completed." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: displayName,
        phone: phoneNum,
        role: "customer",
      },
    });
  } catch (err: any) {
    console.error("Signup API error:", err);
    return NextResponse.json({ error: "Unable to complete registration. Please try again." }, { status: 500 });
  }
}
