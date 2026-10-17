import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        id, order_number, buyer_id, status, total_price, delivery_address, phone, notes,
        bank_account_id, payment_proof_path, rejection_reason, verified_by, verified_at,
        created_at, updated_at,
        bank_accounts(id, bank_name, account_name, account_number, instructions),
        profiles:buyer_id(id, full_name, email, phone),
        order_items(id, product_id, quantity, unit_price_snapshot, products(id, name, images, category)),
        order_status_history(id, from_status, to_status, changed_by, note, created_at)
      `)
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Role check: customer can only view own order
    if (user.role === "customer" && order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this order." }, { status: 403 });
    }

    if (user.role === "teacher") {
      return NextResponse.json({ error: "Forbidden: Teachers do not manage customer orders." }, { status: 403 });
    }

    // Sort status history chronologically
    const history = (order.order_status_history || []).sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        order_status_history: history,
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to retrieve order" }, { status });
  }
}
