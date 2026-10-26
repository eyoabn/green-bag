import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/utils/roles";
import { pool } from "@/utils/db";

// GET /api/admin/audit - Searchable, filterable audit log
export async function GET(request: NextRequest) {
  try {
    await requireRole(["admin"]);
    const db = pool;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const actor = searchParams.get("actor")?.trim() || "";
    const action = searchParams.get("action")?.trim() || "";
    const entity = searchParams.get("entity")?.trim() || "";
    const startDate = searchParams.get("startDate")?.trim() || "";
    const endDate = searchParams.get("endDate")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(`(
        a.action ILIKE $${paramIndex} OR
        a.entity ILIKE $${paramIndex} OR
        a.entity_id ILIKE $${paramIndex} OR
        p.full_name ILIKE $${paramIndex} OR
        p.email ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (actor) {
      whereClauses.push(`a.actor_id = $${paramIndex}`);
      values.push(actor);
      paramIndex++;
    }

    if (action) {
      whereClauses.push(`a.action = $${paramIndex}`);
      values.push(action);
      paramIndex++;
    }

    if (entity) {
      whereClauses.push(`a.entity = $${paramIndex}`);
      values.push(entity);
      paramIndex++;
    }

    if (startDate) {
      whereClauses.push(`a.created_at >= $${paramIndex}`);
      values.push(new Date(startDate).toISOString());
      paramIndex++;
    }

    if (endDate) {
      // Include full day if date only string
      const endD = new Date(endDate);
      if (endDate.length === 10) {
        endD.setHours(23, 59, 59, 999);
      }
      whereClauses.push(`a.created_at <= $${paramIndex}`);
      values.push(endD.toISOString());
      paramIndex++;
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // Total Count
    const countQuery = `
      SELECT count(*)::int as total
      FROM public.audit_log a
      LEFT JOIN public.profiles p ON a.actor_id = p.id
      ${whereSQL}
    `;
    const countRes = await db.query(countQuery, values);
    const totalCount = countRes.rows[0]?.total || 0;

    // Paginated Rows
    const dataQuery = `
      SELECT 
        a.id,
        a.actor_id,
        a.action,
        a.entity,
        a.entity_id,
        a.metadata,
        a.created_at,
        p.full_name as actor_name,
        p.email as actor_email,
        p.role as actor_role
      FROM public.audit_log a
      LEFT JOIN public.profiles p ON a.actor_id = p.id
      ${whereSQL}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataRes = await db.query(dataQuery, [...values, limit, offset]);

    // Available Distinct Filter Options
    const actionsRes = await db.query("SELECT DISTINCT action FROM public.audit_log ORDER BY action ASC");
    const entitiesRes = await db.query("SELECT DISTINCT entity FROM public.audit_log ORDER BY entity ASC");

    return NextResponse.json({
      success: true,
      logs: dataRes.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
      filters: {
        actions: actionsRes.rows.map((r) => r.action),
        entities: entitiesRes.rows.map((r) => r.entity),
      },
    });
  } catch (err: any) {
    console.error("Audit log API error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: err.message || "Failed to load audit logs" },
      { status }
    );
  }
}
