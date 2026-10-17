import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { Client } from "pg";

const directUrl = process.env.DIRECT_URL || 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

// GET /api/admin/users - List all platform users directly from Supabase profiles
export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin"]);
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";

    let query = supabase
      .from("profiles")
      .select("id, full_name, phone, email, role, is_active, avatar_url, created_at")
      .order("created_at", { ascending: false });

    if (roleFilter && ["admin", "teacher", "customer"].includes(roleFilter)) {
      query = query.eq("role", roleFilter);
    }

    if (search.trim()) {
      const s = search.trim();
      query = query.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      users: users || [],
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to load users" }, { status });
  }
}

// PATCH /api/admin/users - Update user role, active status, or profile info
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const body = await request.json().catch(() => ({}));
    const { userId, role, is_active, full_name, phone } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
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

    const pgClient = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
    await pgClient.connect();

    try {
      // Build dynamic update query to bypass RLS safely as admin
      const setClauses: string[] = [];
      const values: any[] = [userId];
      let paramIdx = 2;

      for (const [key, val] of Object.entries(updates)) {
        if (key === 'role') {
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

      const res = await pgClient.query(updateQuery, values);

      if (res.rowCount === 0) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      const updatedUser = res.rows[0];

      // Audit log entry
      await pgClient.query(`
        INSERT INTO public.audit_log (actor_id, action, entity, entity_id, metadata)
        VALUES ($1, 'UPDATE_USER', 'profiles', $2, $3::jsonb);
      `, [admin.id, userId, JSON.stringify({ updates, target_user: updatedUser.email })]);

      return NextResponse.json({
        success: true,
        user: updatedUser,
      });
    } finally {
      await pgClient.end();
    }
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

    const pgClient = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
    await pgClient.connect();

    try {
      // 1. Create or update auth.users
      const existingUser = await pgClient.query('SELECT id FROM auth.users WHERE email = $1', [trimmedEmail]);
      let userId: string;

      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
        await pgClient.query(`
          UPDATE auth.users
          SET encrypted_password = crypt($2, gen_salt('bf')),
              email_confirmed_at = NOW(),
              raw_user_meta_data = json_build_object('full_name', $3::text, 'phone', $4::text, 'role', $5::text),
              updated_at = NOW()
          WHERE id = $1;
        `, [userId, userPassword, fullName.trim(), phone?.trim() || "", assignedRole]);
      } else {
        const insertAuth = await pgClient.query(`
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
        `, [trimmedEmail, userPassword, fullName.trim(), phone?.trim() || "", assignedRole]);
        userId = insertAuth.rows[0].id;
      }

      // 2. Upsert profile with email
      const profileRes = await pgClient.query(`
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
      `, [userId, fullName.trim(), phone?.trim() || "", assignedRole, trimmedEmail]);

      // 3. Write to audit_log
      await pgClient.query(`
        INSERT INTO public.audit_log (actor_id, action, entity, entity_id, metadata)
        VALUES ($1, 'PROVISION_USER', 'profiles', $2, $3::jsonb);
      `, [admin.id, userId, JSON.stringify({ email: trimmedEmail, role: assignedRole, fullName })]);

      return NextResponse.json({
        success: true,
        user: profileRes.rows[0],
      });
    } finally {
      await pgClient.end();
    }
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to provision user" }, { status });
  }
}
