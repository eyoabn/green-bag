import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/utils/roles";
import { pool } from "@/utils/db";
import { logAuditEvent } from "@/utils/audit";

const createBankAccountSchema = z.object({
  bank_name: z.string().min(2, "Bank name must be at least 2 characters"),
  account_name: z.string().min(2, "Account holder name is required"),
  account_number: z.string().min(3, "Account number must be at least 3 digits"),
  instructions: z.string().optional().default("Use your Order Number as payment reference."),
  is_active: z.boolean().optional().default(true),
});

const updateBankAccountSchema = z.object({
  id: z.string().uuid("Invalid bank account ID"),
  bank_name: z.string().min(2).optional(),
  account_name: z.string().min(2).optional(),
  account_number: z.string().min(3).optional(),
  instructions: z.string().optional(),
  is_active: z.boolean().optional(),
});

// GET /api/admin/bank-accounts - List all settlement accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    let query = `
      SELECT id, bank_name, account_name, account_number, instructions, is_active, created_at, updated_at
      FROM public.bank_accounts
    `;
    const params: any[] = [];

    if (activeOnly) {
      query += ` WHERE is_active = true`;
    }

    query += ` ORDER BY created_at ASC`;

    const res = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      accounts: res.rows || [],
      bankAccounts: res.rows || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load bank accounts" }, { status: 500 });
  }
}

// POST /api/admin/bank-accounts - Create new bank account
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const body = await request.json().catch(() => ({}));
    
    const parsed = createBankAccountSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { bank_name, account_name, account_number, instructions, is_active } = parsed.data;

    const res = await pool.query(
      `
      INSERT INTO public.bank_accounts (bank_name, account_name, account_number, instructions, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, bank_name, account_name, account_number, instructions, is_active, created_at, updated_at;
    `,
      [bank_name.trim(), account_name.trim(), account_number.trim(), instructions?.trim() || "", is_active]
    );

    const account = res.rows[0];

    await logAuditEvent({
      actorId: admin.id,
      action: "CREATE_BANK_ACCOUNT",
      entity: "bank_accounts",
      entityId: account.id,
      metadata: { bank_name, account_number, is_active },
    });

    return NextResponse.json({ success: true, account });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to create bank account" }, { status });
  }
}

// PATCH /api/admin/bank-accounts - Update bank account
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const body = await request.json().catch(() => ({}));

    const parsed = updateBankAccountSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { id, ...fields } = parsed.data;

    const setClauses: string[] = ["updated_at = NOW()"];
    const values: any[] = [id];
    let paramIdx = 2;

    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) {
        setClauses.push(`${k} = $${paramIdx++}`);
        values.push(v);
      }
    }

    const updateQuery = `
      UPDATE public.bank_accounts
      SET ${setClauses.join(", ")}
      WHERE id = $1
      RETURNING id, bank_name, account_name, account_number, instructions, is_active, created_at, updated_at;
    `;

    const res = await pool.query(updateQuery, values);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Bank account not found." }, { status: 404 });
    }

    const account = res.rows[0];

    await logAuditEvent({
      actorId: admin.id,
      action: "UPDATE_BANK_ACCOUNT",
      entity: "bank_accounts",
      entityId: id,
      metadata: fields,
    });

    return NextResponse.json({ success: true, account });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update bank account" }, { status });
  }
}

// DELETE /api/admin/bank-accounts - Remove or deactivate bank account
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Bank account ID is required." }, { status: 400 });
    }

    // Check if account is referenced by existing orders
    const ordersCheck = await pool.query("SELECT COUNT(*) as count FROM public.orders WHERE bank_account_id = $1", [id]);
    const linkedCount = parseInt(ordersCheck.rows[0]?.count || "0", 10);

    if (linkedCount > 0) {
      // Deactivate rather than hard delete to preserve financial audit trail
      await pool.query("UPDATE public.bank_accounts SET is_active = false, updated_at = NOW() WHERE id = $1", [id]);

      await logAuditEvent({
        actorId: admin.id,
        action: "DEACTIVATE_BANK_ACCOUNT_HISTORICAL",
        entity: "bank_accounts",
        entityId: id,
        metadata: { linked_orders: linkedCount, reason: "Preserve order history" },
      });

      return NextResponse.json({
        success: true,
        deactivated: true,
        message: "Account has linked orders; it has been deactivated to preserve order audit history.",
      });
    }

    await pool.query("DELETE FROM public.bank_accounts WHERE id = $1", [id]);

    await logAuditEvent({
      actorId: admin.id,
      action: "DELETE_BANK_ACCOUNT",
      entity: "bank_accounts",
      entityId: id,
      metadata: { deleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to delete bank account" }, { status });
  }
}
