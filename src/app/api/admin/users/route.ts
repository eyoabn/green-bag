import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/utils/roles";
import { pool } from "@/utils/db";
import { logAuditEvent } from "@/utils/audit";

// GET /api/admin/users - List all platform users with filtering & pagination
export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin"]);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const roleFilter = searchParams.get("role") || "";
    const activeFilter = searchParams.get("active") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (roleFilter && ["admin", "teacher", "customer"].includes(roleFilter)) {
      conditions.push(`role = $${paramIdx++}::user_role`);
      params.push(roleFilter);
    }

    if (activeFilter === "true" || activeFilter === "active") {
      conditions.push(`is_active = true`);
    } else if (activeFilter === "false" || activeFilter === "inactive") {
      conditions.push(`is_active = false`);
    }

    if (search) {
      conditions.push(`(full_name ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR phone ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countRes = await pool.query(`SELECT COUNT(*) as total FROM public.profiles ${whereClause}`, params);
    const totalCount = parseInt(countRes.rows[0]?.total || "0", 10);

    // Data query
    const dataParams = [...params, pageSize, offset];
    const dataQuery = `
      SELECT id, full_name, email, phone, role, is_active, avatar_url, created_at
      FROM public.profiles
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    const usersRes = await pool.query(dataQuery, dataParams);

    return NextResponse.json({
      success: true,
      users: usersRes.rows || [],
      totalCount,
      page,
      pageSize,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to load users" }, { status });
  }
}

// PATCH /api/admin/users - Update user role or active status
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const body = await request.json().catch(() => ({}));
    const { userId, role, is_active, full_name, phone } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    // Guard: An admin cannot demote or deactivate their own account
    if (userId === admin.id) {
      if (role !== undefined && role !== "admin") {
        return NextResponse.json(
          { error: "Administrators cannot demote their own account." },
          { status: 403 }
        );
      }
      if (is_active !== undefined && !is_active) {
        return NextResponse.json(
          { error: "Administrators cannot deactivate their own account." },
          { status: 403 }
        );
      }
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (role !== undefined) {
      if (!["customer", "teacher", "admin"].includes(role)) {
        return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
      }
      updates.role = role;
    }

    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active);
    }

    if (full_name !== undefined) updates.full_name = String(full_name).trim();
    if (phone !== undefined) updates.phone = String(phone).trim();

    const setClauses: string[] = [];
    const values: any[] = [userId];
    let paramIdx = 2;

    for (const [key, val] of Object.entries(updates)) {
      if (key === "role") {
        setClauses.push(`role = $${paramIdx}::user_role`);
      } else {
        setClauses.push(`${key} = $${paramIdx}`);
      }
      values.push(val);
      paramIdx++;
    }

    const updateQuery = `
      UPDATE public.profiles
      SET ${setClauses.join(", ")}
      WHERE id = $1
      RETURNING id, full_name, email, phone, role, is_active, created_at;
    `;

    const res = await pool.query(updateQuery, values);

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updatedUser = res.rows[0];

    // Central audit log event
    await logAuditEvent({
      actorId: admin.id,
      action: "UPDATE_USER",
      entity: "profiles",
      entityId: userId,
      metadata: {
        updates,
        target_email: updatedUser.email,
        target_name: updatedUser.full_name,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update user" }, { status });
  }
}

// POST /api/admin/users - Provision a new teacher or staff account
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const body = await request.json().catch(() => ({}));
    const { email, password, fullName, phone, role = "teacher" } = body;

    if (!email || !fullName) {
      return NextResponse.json({ error: "Email and Full Name are required." }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const assignedRole = ["customer", "teacher", "admin"].includes(role) ? role : "teacher";
    const userPassword = password || "Password123!";

    // 1. Create or update in auth.users
    const existingUser = await pool.query("SELECT id FROM auth.users WHERE email = $1", [trimmedEmail]);
    let userId: string;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      await pool.query(
        `
        UPDATE auth.users
        SET encrypted_password = crypt($2, gen_salt('bf')),
            email_confirmed_at = NOW(),
            raw_user_meta_data = json_build_object('full_name', $3::text, 'phone', $4::text, 'role', $5::text),
            updated_at = NOW()
        WHERE id = $1;
      `,
        [userId, userPassword, fullName.trim(), phone?.trim() || "", assignedRole]
      );
    } else {
      const insertAuth = await pool.query(
        `
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          $1, crypt($2, gen_salt('bf')), NOW(),
          '{"provider": "email", "providers": ["email"]}',
          json_build_object('full_name', $3::text, 'phone', $4::text, 'role', $5::text),
          NOW(), NOW()
        ) RETURNING id;
      `,
        [trimmedEmail, userPassword, fullName.trim(), phone?.trim() || "", assignedRole]
      );
      userId = insertAuth.rows[0].id;
    }

    // 2. Upsert profile with email and role
    const profileRes = await pool.query(
      `
      INSERT INTO public.profiles (id, full_name, phone, role, email, is_active, updated_at)
      VALUES ($1, $2, $3, $4::user_role, $5, true, NOW())
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        email = EXCLUDED.email,
        is_active = true,
        updated_at = NOW()
      RETURNING id, full_name, email, phone, role, is_active, created_at;
    `,
      [userId, fullName.trim(), phone?.trim() || "", assignedRole, trimmedEmail]
    );

    // 3. Central audit log event
    await logAuditEvent({
      actorId: admin.id,
      action: "PROVISION_USER",
      entity: "profiles",
      entityId: userId,
      metadata: {
        email: trimmedEmail,
        role: assignedRole,
        fullName: fullName.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      user: profileRes.rows[0],
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to provision user" }, { status });
  }
}

// DELETE /api/admin/users - Permanently delete / remove a user from the platform
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json(
        { error: "Administrators cannot delete their own account." },
        { status: 403 }
      );
    }

    // 1. Check if user exists
    const userRes = await pool.query("SELECT id, email, full_name, role FROM public.profiles WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found in system." }, { status: 404 });
    }
    const targetUser = userRes.rows[0];

    // 2. Unassign from any class sessions where they are the instructor
    await pool.query("UPDATE public.class_sessions SET teacher_id = NULL WHERE teacher_id = $1", [userId]);

    // 3. Clean up notifications for this user
    await pool.query("DELETE FROM public.notifications WHERE user_id = $1", [userId]);

    // 4. Delete profile
    await pool.query("DELETE FROM public.profiles WHERE id = $1", [userId]);

    // 5. Delete from auth.users (if present)
    await pool.query("DELETE FROM auth.users WHERE id = $1", [userId]);

    // 6. Log audit event
    await logAuditEvent({
      actorId: admin.id,
      action: "DELETE_USER",
      entity: "profiles",
      entityId: userId,
      metadata: {
        email: targetUser.email,
        fullName: targetUser.full_name,
        role: targetUser.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.full_name} (${targetUser.email}) removed successfully.`,
    });
  } catch (err: any) {
    console.error("Delete user error:", err);
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to delete user." }, { status });
  }
}
