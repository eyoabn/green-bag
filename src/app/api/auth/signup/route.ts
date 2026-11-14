import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";
import { checkRateLimit } from "@/utils/rateLimit";
import { SignupSchema } from "@/utils/validation";

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, { limit: 10, windowMs: 60000, prefix: "auth:signup" });
  if (!rl.allowed && rl.response) {
    return rl.response;
  }

  try {
    const rawBody = await request.json().catch(() => ({}));
    const parseRes = SignupSchema.safeParse(rawBody);
    if (!parseRes.success) {
      return NextResponse.json({ error: parseRes.error.issues[0]?.message || "Invalid registration details." }, { status: 400 });
    }
    const { email, password, fullName, phone } = parseRes.data;

    const trimmedEmail = email.trim().toLowerCase();
    const displayName = (fullName && fullName.trim()) || trimmedEmail.split("@")[0];
    const phoneNum = (phone && phone.trim()) || "";

    const existingCheck = await pool.query(
      "SELECT id FROM auth.users WHERE email = $1 LIMIT 1",
      [trimmedEmail]
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in." },
        { status: 400 }
      );
    }

    const insertRes = await pool.query(
      `
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        phone_change,
        phone_change_token,
        email_change_token_current,
        reauthentication_token,
        is_super_admin,
        created_at,
        updated_at
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        $1,
        crypt($2, gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        json_build_object('full_name', $3::text, 'phone', $4::text, 'role', 'customer'),
        '', '', '', '', '', '', '', '', false,
        NOW(), NOW()
      )
      RETURNING id;
      `,
      [trimmedEmail, String(password), displayName, phoneNum]
    );

    const userId = insertRes.rows[0].id;

    const supabase = await createClient();
    await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: String(password),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: trimmedEmail,
        full_name: displayName,
        phone: phoneNum,
        role: "customer",
      },
    });
  } catch (err: any) {
    console.error("Signup API error:", err);
    return NextResponse.json(
      { error: "Unable to complete registration. Please try again." },
      { status: 500 }
    );
  }
}
