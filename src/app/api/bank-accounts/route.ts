import { NextResponse } from "next/server";
import { pool } from "@/utils/db";

// GET /api/bank-accounts - Public / customer checkout endpoint
// Always filters for is_active = true so disabled accounts are never shown to buyers
export async function GET() {
  try {
    const res = await pool.query(`
      SELECT id, bank_name, account_name, account_number, instructions
      FROM public.bank_accounts
      WHERE is_active = true
      ORDER BY bank_name ASC
    `);

    return NextResponse.json({
      success: true,
      accounts: res.rows || [],
      bankAccounts: res.rows || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load settlement accounts" }, { status: 500 });
  }
}
