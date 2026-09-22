import { NextRequest, NextResponse } from "next/server";
import { UserStore } from "@/utils/userStore";

const VALID_ADMIN_KEYS = ["ArenguadeAdmin2026", "2122Eyoab2122", "greenwork2026", "admin123"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, fullName, phone, role = "customer", adminSecurityKey } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const displayName = (fullName && fullName.trim()) || trimmedEmail.split("@")[0];

    // Explicit Role Classification
    let assignedRole: "admin" | "customer" | "student" = "customer";

    if (role === "admin") {
      // Validate Admin Authorization Security Key
      if (!adminSecurityKey || !VALID_ADMIN_KEYS.includes(String(adminSecurityKey).trim())) {
        return NextResponse.json(
          { error: "Invalid Admin Security Passphrase. Factory Executive clearance required." },
          { status: 403 }
        );
      }
      assignedRole = "admin";
    } else if (role === "student") {
      assignedRole = "student";
    } else {
      assignedRole = "customer";
    }

    // Owner check: Always grant executive admin role to project founder
    if (
      trimmedEmail.includes("joabniguise") ||
      trimmedEmail.includes("eyoabniguise") ||
      trimmedEmail === "admin@arenguade.et"
    ) {
      assignedRole = "admin";
    }

    // Persist real user in persistent store and database
    const user = await UserStore.registerUser({
      email: trimmedEmail,
      password: String(password),
      fullName: displayName,
      phone: phone || "",
      role: assignedRole,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("Signup API error:", err);
    return NextResponse.json({ error: "Unable to complete registration. Please try again." }, { status: 500 });
  }
}
