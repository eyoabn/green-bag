import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ["pending_verification", "cancelled"],
  pending_verification: ["approved", "rejected", "cancelled"],
  rejected: ["pending_verification", "cancelled"],
  approved: ["in_production", "cancelled"],
  in_production: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    // Check existence and ownership in DB first to distinguish 404 vs 403 under RLS
    const { rows: orderRows } = await pool.query("SELECT id, buyer_id FROM public.orders WHERE id = $1", [orderId]);
    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (user.role === "customer" && orderRows[0].buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this order." }, { status: 403 });
    }

    if (user.role === "teacher") {
      return NextResponse.json({ error: "Forbidden: Teachers do not manage customer orders." }, { status: 403 });
    }

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

    // Check existence and ownership in DB first to distinguish 404 vs 403 under RLS
    const { rows: patchOrderRows } = await pool.query("SELECT id, buyer_id FROM public.orders WHERE id = $1", [orderId]);
    if (patchOrderRows.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (user.role === "customer" && patchOrderRows[0].buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this order." }, { status: 403 });
    }

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

      // Customer cannot approve payments or change fulfillment status
      if (action === "approve" || status === "approved" || status === "in_production" || status === "ready" || status === "completed") {
        return NextResponse.json({ error: "Forbidden: Customers cannot approve payments or modify manufacturing status." }, { status: 403 });
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

        // Only allowed if pending_payment, pending_verification or rejected
        if (!["pending_payment", "pending_verification", "rejected"].includes(oldStatus)) {
          return NextResponse.json({ error: "Receipt cannot be uploaded for an already approved or cancelled order." }, { status: 400 });
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
          note: oldStatus === "rejected"
            ? "Customer re-uploaded payment verification receipt after rejection."
            : "Customer uploaded payment verification receipt.",
        });

        // Notify admins
        const { data: adminProfiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        if (adminProfiles && adminProfiles.length > 0) {
          const notifications = adminProfiles.map(adm => ({
            user_id: adm.id,
            title: `Payment Receipt Uploaded: ${order.order_number}`,
            body: `${user.full_name} submitted payment receipt for verification.`,
            link: `/admin/payments?order=${order.id}`,
          }));
          await supabase.from("notifications").insert(notifications);
        }

        return NextResponse.json({ success: true, order: updated });
      }

      return NextResponse.json({ error: "Invalid customer action on order." }, { status: 400 });
    }

    // Admin actions
    if (user.role === "admin") {
      let targetStatus: string | null = status || null;
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };

      if (action === "approve") {
        targetStatus = "approved";
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

      // Check transition against state machine
      const allowedNext = VALID_TRANSITIONS[oldStatus] || [];
      if (!allowedNext.includes(targetStatus)) {
        return NextResponse.json({
          error: `Invalid status transition: cannot change order from '${oldStatus}' to '${targetStatus}'.`,
        }, { status: 400 });
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

      // Audit log
      await supabase.from("audit_log").insert({
        actor_id: user.id,
        action: `ORDER_${targetStatus.toUpperCase()}`,
        entity: "orders",
        entity_id: orderId,
        metadata: { from: oldStatus, to: targetStatus, rejectionReason: updates.rejection_reason || null },
      });

      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json({ error: "Unauthorized role for order updates." }, { status: 403 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update order" }, { status });
  }
}
