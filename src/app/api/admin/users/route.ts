import { NextRequest, NextResponse } from "next/server";
import { UserStore } from "@/utils/userStore";

// GET /api/admin/users - List all registered platform users with their real roles
export async function GET() {
  try {
    const users = UserStore.getAllUsers();
    // Return sanitized users (without password hashes or salts)
    const sanitized = users.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      phone: u.phone,
      role: u.role,
      created_at: u.created_at,
      status: u.status,
    }));

    return NextResponse.json({
      success: true,
      users: sanitized,
    });
  } catch (err: any) {
    console.error("Fetch admin users error:", err);
    return NextResponse.json({ error: err?.message || "Failed to load users" }, { status: 500 });
  }
}

// PATCH /api/admin/users - Update user role or profile details
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and new role are required." }, { status: 400 });
    }

    if (!["admin", "customer", "student"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    const updated = await UserStore.updateUserRole(userId, role);
    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        full_name: updated.full_name,
        phone: updated.phone,
        role: updated.role,
      },
    });
  } catch (err: any) {
    console.error("Update admin user error:", err);
    return NextResponse.json({ error: err?.message || "Failed to update user role" }, { status: 500 });
  }
}

// POST /api/admin/users - Provision a new user directly by an administrator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, fullName, phone, role = "customer" } = body;

    if (!email || !fullName) {
      return NextResponse.json({ error: "Email and Full Name are required." }, { status: 400 });
    }

    const assignedRole = ["admin", "customer", "student"].includes(role) ? role : "customer";
    const user = await UserStore.registerUser({
      email,
      password: password || "arenguade2026",
      fullName,
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
    console.error("Provision admin user error:", err);
    return NextResponse.json({ error: err?.message || "Failed to provision user" }, { status: 500 });
  }
}

// DELETE /api/admin/users - Remove/deactivate a user profile
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const success = await UserStore.deleteUser(userId);
    if (!success) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User profile removed." });
  } catch (err: any) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: err?.message || "Failed to delete user" }, { status: 500 });
  }
}
