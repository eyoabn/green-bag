import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";

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

    // 1. Check if account already exists
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

    // 2. Insert into auth.users directly with confirmed email & clean non-null tokens
    // Trigger on_auth_user_created automatically populates public.profiles with role = 'customer'
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

    // 3. Authenticate with Supabase server client to establish session cookies
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
      { error: err?.message || "Unable to complete registration. Please try again." },
      { status: 500 }
    );
  }
}
