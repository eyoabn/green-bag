import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/bank-accounts - Fetch bank settlement accounts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    let query = supabase
      .from("bank_accounts")
      .select("id, bank_name, account_name, account_number, instructions, is_active, created_at")
      .order("created_at", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data: accounts, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      accounts: accounts || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load bank accounts" }, { status: 500 });
  }
}

// POST /api/admin/bank-accounts - Create new settlement bank account
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const body = await request.json().catch(() => ({}));
    const { bank_name, account_name, account_number, instructions, is_active = true } = body;

    if (!bank_name || !account_number) {
      return NextResponse.json({ error: "Bank name and account number are required." }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bank_accounts")
      .insert({
        bank_name: String(bank_name).trim(),
        account_name: account_name ? String(account_name).trim() : "Arenguade Paper Products PLC",
        account_number: String(account_number).trim(),
        instructions: instructions ? String(instructions).trim() : "Reference your Order Number in the deposit/transfer remark.",
        is_active: Boolean(is_active),
      })
      .select()
      .single();

    if (error) throw error;

    // Write to audit log
    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "CREATE_BANK_ACCOUNT",
      entity: "bank_accounts",
      entity_id: data.id,
      metadata: { bank_name: data.bank_name, account_number: data.account_number },
    });

    return NextResponse.json({ success: true, account: data });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to create bank account" }, { status });
  }
}

// PATCH /api/admin/bank-accounts - Update bank account details or active status
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const body = await request.json().catch(() => ({}));
    const { id, is_active, bank_name, account_name, account_number, instructions } = body;

    if (!id) {
      return NextResponse.json({ error: "Account ID is required." }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (bank_name !== undefined) updates.bank_name = String(bank_name).trim();
    if (account_name !== undefined) updates.account_name = String(account_name).trim();
    if (account_number !== undefined) updates.account_number = String(account_number).trim();
    if (instructions !== undefined) updates.instructions = String(instructions).trim();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bank_accounts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Write to audit log
    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "UPDATE_BANK_ACCOUNT",
      entity: "bank_accounts",
      entity_id: id,
      metadata: updates,
    });

    return NextResponse.json({ success: true, account: data });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update bank account" }, { status });
  }
}

// DELETE /api/admin/bank-accounts - Remove bank account
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Account ID is required." }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if account has linked orders
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("bank_account_id", id);

    if (count && count > 0) {
      // Instead of hard deleting, deactivate to preserve order history integrity
      const { error: deactErr } = await supabase
        .from("bank_accounts")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (deactErr) throw deactErr;

      await supabase.from("audit_log").insert({
        actor_id: admin.id,
        action: "DEACTIVATE_BANK_ACCOUNT_HISTORICAL",
        entity: "bank_accounts",
        entity_id: id,
        metadata: { reason: "Has linked historical orders", linked_orders: count },
      });

      return NextResponse.json({ 
        success: true, 
        deactivated: true,
        message: "Account has linked order history; it has been deactivated rather than purged." 
      });
    }

    const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
    if (error) throw error;

    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "DELETE_BANK_ACCOUNT",
      entity: "bank_accounts",
      entity_id: id,
      metadata: { deleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to delete bank account" }, { status });
  }
}
