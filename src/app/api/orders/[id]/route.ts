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

// PATCH /api/orders/[id] - Update order status (Approve, Reject, Advance, Cancel, Upload Proof)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    const body = await request.json().catch(() => ({}));
    const { action, status, rejectionReason, paymentProofPath, note } = body;

    const supabase = await createClient();

    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("*, profiles:buyer_id(id, full_name, email)")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const oldStatus = order.status;

    // Customer actions
    if (user.role === "customer") {
      if (order.buyer_id !== user.id) {
        return NextResponse.json({ error: "Forbidden: You do not own this order." }, { status: 403 });
      }

      if (action === "cancel") {
        if (!["pending_payment", "pending_verification"].includes(oldStatus)) {
          return NextResponse.json({ error: "Orders already processed cannot be cancelled." }, { status: 400 });
        }

        const { data: updated, error } = await supabase
          .from("orders")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .select()
          .single();

        if (error) throw error;

        await supabase.from("order_status_history").insert({
          order_id: orderId,
          from_status: oldStatus,
          to_status: "cancelled",
          changed_by: user.id,
          note: note || "Cancelled by customer.",
        });

        return NextResponse.json({ success: true, order: updated });
      }

      if (action === "upload_proof") {
        if (!paymentProofPath) {
          return NextResponse.json({ error: "Payment proof path is required." }, { status: 400 });
        }

        const { data: updated, error } = await supabase
          .from("orders")
          .update({
            payment_proof_path: paymentProofPath,
            status: "pending_verification",
            rejection_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .select()
          .single();

        if (error) throw error;

        await supabase.from("order_status_history").insert({
          order_id: orderId,
          from_status: oldStatus,
          to_status: "pending_verification",
          changed_by: user.id,
          note: "Customer uploaded payment verification receipt.",
        });

        return NextResponse.json({ success: true, order: updated });
      }

      return NextResponse.json({ error: "Invalid customer action on order." }, { status: 400 });
    }

    // Admin actions
    if (user.role === "admin") {
      let targetStatus = status;
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };

      if (action === "approve") {
        targetStatus = "verified";
        updates.verified_by = user.id;
        updates.verified_at = new Date().toISOString();
        updates.rejection_reason = null;
      } else if (action === "reject") {
        targetStatus = "rejected";
        if (!rejectionReason || !rejectionReason.trim()) {
          return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
        }
        updates.rejection_reason = rejectionReason.trim();
        updates.verified_by = user.id;
        updates.verified_at = new Date().toISOString();
      }

      if (!targetStatus) {
        return NextResponse.json({ error: "Target status or action is required." }, { status: 400 });
      }

      updates.status = targetStatus;

      const { data: updated, error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("order_status_history").insert({
        order_id: orderId,
        from_status: oldStatus,
        to_status: targetStatus,
        changed_by: user.id,
        note: note || (action === "reject" ? `Rejected: ${rejectionReason}` : `Status updated to ${targetStatus}`),
      });

      // Customer notification
      await supabase.from("notifications").insert({
        user_id: order.buyer_id,
        title: `Order ${order.order_number} Update: ${targetStatus.toUpperCase()}`,
        body: action === "reject"
          ? `Your payment proof was rejected. Reason: "${rejectionReason}". Please re-upload your valid receipt.`
          : action === "approve"
          ? `Your payment of ${Number(order.total_price).toLocaleString()} ETB has been verified. Production will begin shortly!`
          : `Order status has progressed to ${targetStatus.replace("_", " ")}.`,
        link: `/dashboard/orders/${order.id}`,
      });

      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json({ error: "Unauthorized role for order updates." }, { status: 403 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update order" }, { status });
  }
}
