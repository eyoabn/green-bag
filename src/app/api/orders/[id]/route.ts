import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";
import { logAuditEvent } from "@/utils/audit";
import { notifyAdmins, notifyUser } from "@/utils/notifications";
import { isValidUUID, isValidStoragePathForUser } from "@/utils/validation";

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

async function isProofReusedByOtherUser(path: string, userId: string): Promise<boolean> {
  const res = await pool.query(
    `
    SELECT 1 FROM public.orders WHERE payment_proof_path = $1 AND buyer_id <> $2
    UNION ALL
    SELECT 1 FROM public.enrollments WHERE payment_proof_path = $1 AND student_id <> $2
    LIMIT 1
    `,
    [path, userId]
  );
  return res.rows.length > 0;
}

async function cancelOrderAtomically(params: {
  orderId: string;
  fromStatus: string;
  changedBy: string;
  note: string;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const lockRes = await client.query(
      "SELECT status::text AS current_status FROM public.orders WHERE id = $1 FOR UPDATE",
      [params.orderId]
    );
    const currentStatus = lockRes.rows[0]?.current_status;
    if (!currentStatus || currentStatus !== params.fromStatus) {
      await client.query("ROLLBACK");
      return null;
    }

    const updateRes = await client.query(
      `
      UPDATE public.orders
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [params.orderId]
    );

    await client.query(
      `
      UPDATE public.products p
      SET stock_quantity = p.stock_quantity + oi.agg_qty,
          updated_at = NOW()
      FROM (
        SELECT product_id, SUM(quantity)::int AS agg_qty
        FROM public.order_items
        WHERE order_id = $1 AND product_id IS NOT NULL
        GROUP BY product_id
      ) oi
      WHERE p.id = oi.product_id
      `,
      [params.orderId]
    );

    await client.query(
      `
      INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
      VALUES ($1, $2, 'cancelled', $3, $4)
      `,
      [params.orderId, params.fromStatus, params.changedBy, params.note]
    );

    await client.query("COMMIT");
    return updateRes.rows[0];
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: orderId } = await params;

    if (!isValidUUID(orderId)) {
      return NextResponse.json({ error: "Invalid order ID format." }, { status: 400 });
    }

    if (user.role === "teacher") {
      return NextResponse.json(
        { error: "Forbidden: Teachers do not manage customer orders." },
        { status: 403 }
      );
    }

    const orderOwnerRes = await pool.query(
      "SELECT id, buyer_id FROM public.orders WHERE id = $1 LIMIT 1",
      [orderId]
    );
    if (orderOwnerRes.rows.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (user.role === "customer" && orderOwnerRes.rows[0].buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this order." }, { status: 403 });
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
        order_items(id, product_id, custom_design_id, quantity, unit_price_snapshot, products(id, name, images, category), designs:custom_design_id(id, title, file_path)),
        order_status_history(id, from_status, to_status, changed_by, note, created_at)
      `)
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

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
    console.error("Retrieve order error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to retrieve order" },
      { status }
    );
  }
}

// PATCH /api/orders/[id] - Update order status (Approve, Reject, Advance, Cancel, Upload Proof)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: orderId } = await params;

    if (!isValidUUID(orderId)) {
      return NextResponse.json({ error: "Invalid order ID format." }, { status: 400 });
    }

    const orderRes = await pool.query(
      "SELECT * FROM public.orders WHERE id = $1 LIMIT 1",
      [orderId]
    );
    const order = orderRes.rows[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (user.role === "customer" && order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this order." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, status, rejectionReason, paymentProofPath, note } = body;
    const oldStatus = order.status as string;
    const cleanNote = typeof note === "string" ? note.trim().slice(0, 500) : "";

    // Customer actions
    if (user.role === "customer") {
      if (
        action === "approve" ||
        status === "approved" ||
        status === "in_production" ||
        status === "ready" ||
        status === "completed"
      ) {
        return NextResponse.json(
          { error: "Forbidden: Customers cannot approve payments or modify manufacturing status." },
          { status: 403 }
        );
      }

      if (action === "cancel") {
        if (!["pending_payment", "pending_verification"].includes(oldStatus)) {
          return NextResponse.json(
            { error: "Orders already processed cannot be cancelled." },
            { status: 400 }
          );
        }

        const updated = await cancelOrderAtomically({
          orderId,
          fromStatus: oldStatus,
          changedBy: user.id,
          note: cleanNote || "Cancelled by customer.",
        });
        if (!updated) {
          return NextResponse.json({ error: "Order status changed concurrently." }, { status: 409 });
        }

        return NextResponse.json({ success: true, order: updated });
      }

      if (action === "upload_proof") {
        const cleanProofPath = typeof paymentProofPath === "string" ? paymentProofPath.trim() : "";
        if (!cleanProofPath || !isValidStoragePathForUser(cleanProofPath, user.id, user.role)) {
          return NextResponse.json({ error: "A valid payment proof path is required." }, { status: 400 });
        }
        if (await isProofReusedByOtherUser(cleanProofPath, user.id)) {
          return NextResponse.json({ error: "Invalid or already-claimed payment proof path." }, { status: 400 });
        }

        if (!["pending_payment", "pending_verification", "rejected"].includes(oldStatus)) {
          return NextResponse.json(
            { error: "Receipt cannot be uploaded for an already approved or cancelled order." },
            { status: 400 }
          );
        }

        const updateRes = await pool.query(
          `
          UPDATE public.orders
          SET payment_proof_path = $2,
              status = 'pending_verification',
              rejection_reason = NULL,
              updated_at = NOW()
          WHERE id = $1 AND status IN ('pending_payment', 'pending_verification', 'rejected')
          RETURNING *
          `,
          [orderId, cleanProofPath]
        );
        if (updateRes.rowCount === 0) {
          return NextResponse.json({ error: "Order could not be updated." }, { status: 409 });
        }

        await pool.query(
          `
          INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
          VALUES ($1, $2, 'pending_verification', $3, $4)
          `,
          [
            orderId,
            oldStatus,
            user.id,
            oldStatus === "rejected"
              ? "Customer re-uploaded payment verification receipt after rejection."
              : "Customer uploaded payment verification receipt.",
          ]
        );

        await notifyAdmins({
          title: `Payment Receipt Uploaded: ${order.order_number}`,
          body: `${user.full_name} submitted payment receipt for verification.`,
          link: `/admin/payments?order=${order.id}`,
        });

        return NextResponse.json({ success: true, order: updateRes.rows[0] });
      }

      return NextResponse.json({ error: "Invalid customer action on order." }, { status: 400 });
    }

    // Admin actions
    if (user.role === "admin") {
      let targetStatus: string | null = status || null;
      let cleanRejectionReason: string | null = null;

      if (action === "approve") {
        targetStatus = "approved";
      } else if (action === "reject") {
        targetStatus = "rejected";
        if (!rejectionReason || !String(rejectionReason).trim()) {
          return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
        }
        cleanRejectionReason = String(rejectionReason).trim().slice(0, 500);
      }

      if (!targetStatus) {
        return NextResponse.json({ error: "Target status or action is required." }, { status: 400 });
      }

      const allowedNext = VALID_TRANSITIONS[oldStatus] || [];
      if (!allowedNext.includes(targetStatus)) {
        return NextResponse.json(
          {
            error: `Invalid status transition: cannot change order from '${oldStatus}' to '${targetStatus}'.`,
          },
          { status: 400 }
        );
      }

      let updated: any;
      if (targetStatus === "cancelled") {
        updated = await cancelOrderAtomically({
          orderId,
          fromStatus: oldStatus,
          changedBy: user.id,
          note: cleanNote || `Status updated to cancelled`,
        });
        if (!updated) {
          return NextResponse.json({ error: "Order status changed concurrently." }, { status: 409 });
        }
      } else {
        const setClauses = [`status = $2`, `updated_at = NOW()`];
        const values: any[] = [orderId, targetStatus];
        let paramIdx = 3;

        if (action === "approve") {
          setClauses.push(`verified_by = $${paramIdx++}`);
          values.push(user.id);
          setClauses.push(`verified_at = NOW()`);
          setClauses.push(`rejection_reason = NULL`);
        } else if (action === "reject") {
          setClauses.push(`rejection_reason = $${paramIdx++}`);
          values.push(cleanRejectionReason);
          setClauses.push(`verified_by = $${paramIdx++}`);
          values.push(user.id);
          setClauses.push(`verified_at = NOW()`);
        }

        const updateRes = await pool.query(
          `
          UPDATE public.orders
          SET ${setClauses.join(", ")}
          WHERE id = $1 AND status::text = $${paramIdx}
          RETURNING *
          `,
          [...values, oldStatus]
        );
        if (updateRes.rowCount === 0) {
          return NextResponse.json({ error: "Order status changed concurrently." }, { status: 409 });
        }
        updated = updateRes.rows[0];

        await pool.query(
          `
          INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
          VALUES ($1, $2, $3, $4, $5)
          `,
          [
            orderId,
            oldStatus,
            targetStatus,
            user.id,
            cleanNote || (action === "reject" ? `Rejected: ${cleanRejectionReason}` : `Status updated to ${targetStatus}`),
          ]
        );
      }

      await notifyUser({
        userId: order.buyer_id,
        title: `Order ${order.order_number} Update: ${targetStatus.toUpperCase()}`,
        body:
          action === "reject"
            ? `Your payment proof was rejected. Reason: "${cleanRejectionReason}". Please re-upload your valid receipt.`
            : action === "approve"
            ? `Your payment of ${Number(order.total_price).toLocaleString()} ETB has been verified. Production will begin shortly!`
            : `Order status has progressed to ${targetStatus.replace("_", " ")}.`,
        link: `/dashboard/orders/${order.id}`,
      });

      await logAuditEvent({
        actorId: user.id,
        action: `ORDER_${targetStatus.toUpperCase()}`,
        entity: "orders",
        entityId: orderId,
        metadata: { from: oldStatus, to: targetStatus, rejectionReason: cleanRejectionReason },
      });

      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json({ error: "Unauthorized role for order updates." }, { status: 403 });
  } catch (err: any) {
    console.error("Update order detail error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to update order" },
      { status }
    );
  }
}
