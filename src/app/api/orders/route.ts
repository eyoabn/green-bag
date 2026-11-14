import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";
import { logAuditEvent } from "@/utils/audit";
import { notifyAdmins, notifyUser } from "@/utils/notifications";
import { isValidUUID, isValidStoragePathForUser } from "@/utils/validation";
import { z } from "zod";

const createOrderSchema = z.object({
  buyerId: z.string().uuid("Invalid customer ID format").optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid("Invalid product ID format"),
        quantity: z
          .number()
          .int()
          .min(1, "Quantity must be at least 1")
          .max(10000, "Quantity exceeds limit"),
      })
    )
    .min(1, "Order must contain at least one item"),
  bankAccountId: z.string().uuid("Invalid bank account ID"),
  deliveryAddress: z.string().min(5, "Delivery address must be provided").max(500),
  phone: z.string().min(6, "Valid phone number required").max(30),
  notes: z.string().max(1000).optional(),
  paymentProofPath: z.string().max(512).optional(),
});

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
  allowedFromStatuses: string[];
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
    const previousStatus = lockRes.rows[0]?.current_status;
    if (!previousStatus || !params.allowedFromStatuses.includes(previousStatus)) {
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

    const updatedOrder = updateRes.rows[0];

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
      [params.orderId, previousStatus, params.changedBy, params.note]
    );

    await client.query("COMMIT");
    return updatedOrder;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// GET /api/orders - Fetch orders (all for admin, own only for customer)
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let query = supabase
      .from("orders")
      .select(`
        id, order_number, buyer_id, status, total_price, delivery_address, phone, notes,
        bank_account_id, payment_proof_path, rejection_reason, verified_by, verified_at,
        created_at, updated_at,
        bank_accounts(id, bank_name, account_name, account_number, instructions),
        profiles:buyer_id(id, full_name, email, phone),
        order_items(id, product_id, custom_design_id, quantity, unit_price_snapshot, products(id, name, images, category), designs:custom_design_id(id, title, file_path))
      `)
      .order("created_at", { ascending: false });

    const mappedStatus = statusFilter === "pending" ? "pending_verification" : statusFilter;

    if (user.role === "admin") {
      if (mappedStatus && mappedStatus !== "all") {
        query = query.eq("status", mappedStatus);
      }
    } else if (user.role === "customer") {
      query = query.eq("buyer_id", user.id);
      if (mappedStatus && mappedStatus !== "all") {
        query = query.eq("status", mappedStatus);
      }
    } else {
      return NextResponse.json({ success: true, orders: [] });
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });
  } catch (err: any) {
    console.error("Load orders error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to load orders" },
      { status }
    );
  }
}

// POST /api/orders - Place a new order with server-computed pricing & snapshots
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));

    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const errMsgs = parsed.error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errMsgs }, { status: 400 });
    }

    const { items, bankAccountId, deliveryAddress, phone, notes, paymentProofPath, buyerId } = parsed.data;
    const supabase = await createClient();

    let targetBuyerId = user.id;
    if (user.role === "admin" && buyerId) {
      const profRes = await pool.query(
        "SELECT id, full_name FROM public.profiles WHERE id = $1 LIMIT 1",
        [buyerId]
      );
      if (profRes.rows.length === 0) {
        return NextResponse.json({ error: "Specified customer account does not exist." }, { status: 400 });
      }
      targetBuyerId = buyerId;
    }

    const cleanProofPath = typeof paymentProofPath === "string" ? paymentProofPath.trim() : "";
    if (cleanProofPath) {
      if (!isValidStoragePathForUser(cleanProofPath, user.id, user.role)) {
        return NextResponse.json({ error: "Invalid payment proof file path." }, { status: 400 });
      }
      if (await isProofReusedByOtherUser(cleanProofPath, targetBuyerId)) {
        return NextResponse.json({ error: "Invalid or already-claimed payment proof path." }, { status: 400 });
      }
    }

    const auditNote = cleanProofPath
      ? "Order created with payment proof uploaded."
      : user.role === "admin" && targetBuyerId !== user.id
      ? `Order created on behalf of customer by Administrator (${user.full_name}).`
      : "Order initialized awaiting bank transfer payment.";

    let atomicResult: any;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("create_order_atomic", {
        p_buyer_id: targetBuyerId,
        p_bank_account_id: bankAccountId,
        p_delivery_address: deliveryAddress.trim(),
        p_phone: phone.trim(),
        p_notes: (notes || "").trim(),
        p_payment_proof_path: cleanProofPath,
        p_items: items,
        p_created_by: user.id,
        p_audit_note: auditNote,
      });

      if (!rpcError && rpcData) {
        atomicResult = rpcData;
      } else if (rpcError) {
        return NextResponse.json({ error: rpcError.message || "Order placement failed." }, { status: 400 });
      } else {
        const { rows: rpcRows } = await pool.query(
          `SELECT public.create_order_atomic(
            $1::uuid, $2::uuid, $3::text, $4::text, $5::text,
            $6::text, $7::jsonb, $8::uuid, $9::text
          ) as result`,
          [
            targetBuyerId,
            bankAccountId,
            deliveryAddress.trim(),
            phone.trim(),
            (notes || "").trim(),
            cleanProofPath,
            JSON.stringify(items),
            user.id,
            auditNote,
          ]
        );
        atomicResult = rpcRows[0]?.result;
      }
    } catch (dbErr: any) {
      const msg = dbErr?.message || "Order placement failed.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (!atomicResult || !atomicResult.success) {
      return NextResponse.json({ error: "Failed to place order." }, { status: 500 });
    }

    const { order_id: orderId, order_number: orderNumber, total_price: calculatedTotal } = atomicResult;

    const { data: newOrder } = await supabase
      .from("orders")
      .select("*, order_items(*, products(*))")
      .eq("id", orderId)
      .single();

    if (user.role === "admin" && targetBuyerId !== user.id) {
      await logAuditEvent({
        actorId: user.id,
        action: "ORDER_CREATED_ON_BEHALF",
        entity: "orders",
        entityId: orderId,
        metadata: {
          buyer_id: targetBuyerId,
          order_number: orderNumber,
          total_price: calculatedTotal,
        },
      });

      await notifyUser({
        userId: targetBuyerId,
        title: `New Order Placed: ${orderNumber}`,
        body: `An order for ${Number(calculatedTotal).toLocaleString()} ETB was placed on your behalf by Ethiopia Arenguade administrators.`,
        link: `/dashboard/orders/${orderId}`,
      });
    }

    if (cleanProofPath) {
      await notifyAdmins({
        title: `New Payment to Verify: ${orderNumber}`,
        body: `Payment receipt submitted for order ${orderNumber} (${Number(calculatedTotal).toLocaleString()} ETB).`,
        link: `/admin/payments?order=${orderId}`,
      });
    }

    return NextResponse.json({
      success: true,
      order: newOrder || { id: orderId, order_number: orderNumber, total_price: calculatedTotal },
      orderNumber,
      totalPrice: Number(calculatedTotal),
    });
  } catch (err: any) {
    console.error("Create order error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to place order" },
      { status }
    );
  }
}

// PATCH /api/orders - Status transitions, proof uploads, cancellations
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const { orderId, action, status, rejectionReason, paymentProofPath, note } = body;

    if (!orderId || !isValidUUID(orderId)) {
      return NextResponse.json({ error: "A valid Order ID is required." }, { status: 400 });
    }

    const orderRes = await pool.query(
      `
      SELECT o.*, p.id AS buyer_profile_id, p.full_name AS buyer_full_name, p.email AS buyer_email
      FROM public.orders o
      LEFT JOIN public.profiles p ON p.id = o.buyer_id
      WHERE o.id = $1
      LIMIT 1
      `,
      [orderId]
    );
    const order = orderRes.rows[0];
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (user.role === "customer" && order.buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this order." }, { status: 403 });
    }

    const oldStatus = order.status as string;
    const cleanNote = typeof note === "string" ? note.trim().slice(0, 500) : "";

    // A. CUSTOMER ACTIONS
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
            { error: "Orders that are already approved or in production cannot be cancelled." },
            { status: 400 }
          );
        }

        const updated = await cancelOrderAtomically({
          orderId,
          allowedFromStatuses: [oldStatus],
          changedBy: user.id,
          note: cleanNote || "Cancelled by customer.",
        });
        if (!updated) {
          return NextResponse.json(
            { error: "Order status changed concurrently and could not be cancelled." },
            { status: 409 }
          );
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

    // B. ADMIN ACTIONS
    if (user.role === "admin") {
      let targetStatus: string | null = status || null;
      let cleanRejectionReason: string | null = null;
      let cleanProofPath: string | null = null;

      if (action === "approve") {
        targetStatus = "approved";
      } else if (action === "reject") {
        targetStatus = "rejected";
        if (!rejectionReason || !String(rejectionReason).trim()) {
          return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
        }
        cleanRejectionReason = String(rejectionReason).trim().slice(0, 500);
      } else if (action === "upload_proof") {
        targetStatus = "pending_verification";
        cleanProofPath = typeof paymentProofPath === "string" ? paymentProofPath.trim() : "";
        if (!cleanProofPath || !isValidStoragePathForUser(cleanProofPath, user.id, user.role)) {
          return NextResponse.json({ error: "A valid payment proof path is required." }, { status: 400 });
        }
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
          allowedFromStatuses: [oldStatus],
          changedBy: user.id,
          note: cleanNote || "Status transitioned to cancelled by Administrator.",
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
        } else if (action === "upload_proof") {
          setClauses.push(`payment_proof_path = $${paramIdx++}`);
          values.push(cleanProofPath);
          setClauses.push(`rejection_reason = NULL`);
        }

        const updateRes = await pool.query(
          `
          UPDATE public.orders
          SET ${setClauses.join(", ")}
          WHERE id = $1 AND status = $3::order_status
          RETURNING *
          `.replace("$3::order_status", `$${paramIdx}::order_status`),
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
            cleanNote ||
              (action === "reject"
                ? `Rejected: ${cleanRejectionReason}`
                : `Status transitioned to ${targetStatus} by Administrator.`),
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
    console.error("Update order error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to update order" },
      { status }
    );
  }
}
