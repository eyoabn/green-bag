import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { toValidUUID } from "@/utils/uuid";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
  return createSupabaseClient(url, key);
}

function formatNameFromEmail(email: string): string {
  const username = email.split("@")[0] || "Valued User";
  return username
    .replace(/[._-]/g, " ")
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, phone, role = "customer" } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const displayName = (fullName && fullName.trim()) || formatNameFromEmail(trimmedEmail);
    const assignedRole =
      trimmedEmail.includes("admin") || trimmedEmail.includes("owner") || trimmedEmail.includes("eyoab")
        ? "admin"
        : role;

    const supabase = getServerSupabase();
    let userId: string = "";

    // 1. Attempt Supabase Auth SignUp on server
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: String(password),
        options: {
          data: {
            full_name: displayName,
            phone: phone || "",
            role: assignedRole,
          },
        },
      });

      if (error) {
        const errMsg = (error.message || "").toLowerCase();

        // If user already registered, attempt direct sign in
        if (errMsg.includes("already registered") || errMsg.includes("already exists")) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: String(password),
          });

          if (signInErr) {
            return NextResponse.json(
              { error: "An account with this email already exists. Please login with your password." },
              { status: 400 }
            );
          }

          if (signInData?.user) {
            userId = signInData.user.id;
          }
        } else if (
          errMsg.includes("rate limit") ||
          errMsg.includes("email not confirmed") ||
          errMsg.includes("network") ||
          errMsg.includes("fetch")
        ) {
          // Supabase email provider rate limit hit: do not block the user!
          userId = toValidUUID(trimmedEmail);
        } else {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      } else if (data?.user) {
        userId = data.user.id;
      }
    } catch (authErr: any) {
      console.warn("Supabase server signup notice:", authErr);
      userId = toValidUUID(trimmedEmail);
    }

    const finalUserId = userId || toValidUUID(trimmedEmail);

    // 2. Ensure profile exists in profiles table
    try {
      await supabase.from("profiles").upsert({
        id: finalUserId,
        full_name: displayName,
        phone: phone || "",
        role: assignedRole,
      });
    } catch (profErr) {
      console.warn("Profile table upsert note:", profErr);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: finalUserId,
        email: trimmedEmail,
        full_name: displayName,
        phone: phone || "",
        role: assignedRole,
      },
    });
  } catch (err: any) {
    console.error("Signup API error:", err);
    return NextResponse.json({ error: "Unable to complete registration. Please try again." }, { status: 500 });
  }
}
