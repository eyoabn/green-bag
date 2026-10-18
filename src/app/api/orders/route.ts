import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";
import { z } from "zod";

const createOrderSchema = z.object({
  buyerId: z.string().uuid("Invalid customer ID format").optional(),
  items: z.array(z.object({
    productId: z.string().uuid("Invalid product ID format"),
    quantity: z.number().int().min(1, "Quantity must be at least 1").max(10000, "Quantity exceeds limit"),
  })).min(1, "Order must contain at least one item"),
  bankAccountId: z.string().uuid("Invalid bank account ID"),
  deliveryAddress: z.string().min(5, "Delivery address must be provided"),
  phone: z.string().min(6, "Valid phone number required"),
  notes: z.string().optional(),
  paymentProofPath: z.string().optional(),
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
        order_items(id, product_id, quantity, unit_price_snapshot, products(id, name, images, category))
      `)
      .order("created_at", { ascending: false });

    const mappedStatus = statusFilter === "pending" ? "pending_verification" : statusFilter;

    // Enforce role-based isolation
    if (user.role === "admin") {
      if (mappedStatus && mappedStatus !== "all") {
        query = query.eq("status", mappedStatus);
      }
    } else if (user.role === "customer") {
      // Customer can view ONLY their own orders
      query = query.eq("buyer_id", user.id);
      if (mappedStatus && mappedStatus !== "all") {
        query = query.eq("status", mappedStatus);
      }
    } else {
      // Teachers do not manage customer orders
      return NextResponse.json({ success: true, orders: [] });
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to load orders" }, { status });
  }
}

// POST /api/orders - Place a new order with server-computed pricing & snapshots
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));

    // Server-side Zod validation
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const errMsgs = parsed.error.issues.map(e => e.message).join(", ");
      return NextResponse.json({ error: errMsgs }, { status: 400 });
    }

    const { items, bankAccountId, deliveryAddress, phone, notes, paymentProofPath, buyerId } = parsed.data;
    const supabase = await createClient();

    // Determine target buyer (admin can order on behalf of customer)
    let targetBuyerId = user.id;
    if (user.role === "admin" && buyerId) {
      const { data: customerProfile, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", buyerId)
        .maybeSingle();

      if (profErr || !customerProfile) {
        return NextResponse.json({ error: "Specified customer account does not exist." }, { status: 400 });
      }
      targetBuyerId = buyerId;
    }

    // 1. Fetch real products from DB to strictly compute prices on the server
    const productIds = items.map(i => i.productId);
    const { rows: dbProducts } = await pool.query(
      "SELECT id, name, price, is_available FROM public.products WHERE id = ANY($1::uuid[])",
      [productIds]
    );

    if (!dbProducts || dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: "One or more selected products are invalid or no longer exist." }, { status: 400 });
    }

    const productMap = new Map(dbProducts.map((p: any) => [p.id, p]));

    let calculatedTotal = 0;
    const itemSnapshots: Array<{ productId: string; quantity: number; unitPrice: number }> = [];

    for (const item of items) {
      const dbProd: any = productMap.get(item.productId);
      if (!dbProd) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      if (!dbProd.is_available) {
        return NextResponse.json({ error: `Product "${dbProd.name}" is currently unavailable.` }, { status: 400 });
      }

      const unitPrice = Number(dbProd.price);
      calculatedTotal += unitPrice * item.quantity;
      itemSnapshots.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
      });
    }

    // 2. Validate Bank Account exists and is active
    const { rows: bankRows } = await pool.query(
      "SELECT id, bank_name, is_active FROM public.bank_accounts WHERE id = $1",
      [bankAccountId]
    );
    const bank = bankRows[0];

    if (!bank) {
      return NextResponse.json({ error: "Selected settlement bank account is invalid." }, { status: 400 });
    }
    if (!bank.is_active) {
      return NextResponse.json({ error: "Selected settlement bank account is currently not active." }, { status: 400 });
    }

    // 3. Generate human-friendly order number (e.g. ARN-2026-XXXX)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ARN-2026-${randomSuffix}`;

    const initialStatus = paymentProofPath ? "pending_verification" : "pending_payment";

    // 4. Insert Order
    const { data: newOrder, error: orderInsertErr } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        buyer_id: targetBuyerId,
        status: initialStatus,
        total_price: calculatedTotal,
        delivery_address: deliveryAddress,
        phone,
        notes: notes || "",
        bank_account_id: bankAccountId,
        payment_proof_path: paymentProofPath || null,
      })
      .select()
      .single();

    if (orderInsertErr || !newOrder) {
      throw orderInsertErr || new Error("Failed to insert order");
    }

    // 5. Insert Order Items with unit_price_snapshot
    const orderItemsRows = itemSnapshots.map(item => ({
      order_id: newOrder.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price_snapshot: item.unitPrice,
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItemsRows);
    if (itemsErr) {
      console.error("Order items error:", itemsErr);
    }

    // 6. Write to order_status_history
    await supabase.from("order_status_history").insert({
      order_id: newOrder.id,
      from_status: null,
      to_status: initialStatus,
      changed_by: user.id,
      note: paymentProofPath
        ? "Order created with payment proof uploaded."
        : user.role === "admin" && targetBuyerId !== user.id
        ? `Order created on behalf of customer by Administrator (${user.full_name}).`
        : "Order initialized awaiting bank transfer payment.",
    });

    // 7. If admin created on behalf, log to audit_log
    if (user.role === "admin" && targetBuyerId !== user.id) {
      await supabase.from("audit_log").insert({
        actor_id: user.id,
        action: "ORDER_CREATED_ON_BEHALF",
        entity: "orders",
        entity_id: newOrder.id,
        metadata: {
          buyer_id: targetBuyerId,
          order_number: orderNumber,
          total_price: calculatedTotal,
        },
      });

      // Notify customer that order was placed on their behalf
      await supabase.from("notifications").insert({
        user_id: targetBuyerId,
        title: `New Order Placed: ${orderNumber}`,
        body: `An order for ${calculatedTotal.toLocaleString()} ETB was placed on your behalf by Ethiopia Arenguade administrators.`,
        link: `/dashboard/orders/${newOrder.id}`,
      });
    }

    // 8. If payment proof provided, notify plant administrators
    if (paymentProofPath) {
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (adminProfiles && adminProfiles.length > 0) {
        const notifications = adminProfiles.map(adm => ({
          user_id: adm.id,
          title: `New Payment to Verify: ${orderNumber}`,
          body: `Payment receipt submitted for order ${orderNumber} (${calculatedTotal.toLocaleString()} ETB).`,
          link: `/admin/payments?order=${newOrder.id}`,
        }));
        await supabase.from("notifications").insert(notifications);
      }
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
      orderNumber,
      totalPrice: calculatedTotal,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to place order" }, { status });
  }
}

// PATCH /api/orders - Status transitions, proof uploads, cancellations
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const { orderId, action, status, rejectionReason, paymentProofPath, note } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    // Check existence and ownership in DB first to distinguish 404 vs 403 under RLS
    const { rows: patchOrderRows } = await pool.query("SELECT id, buyer_id FROM public.orders WHERE id = $1", [orderId]);
    if (patchOrderRows.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (user.role === "customer" && patchOrderRows[0].buyer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this order." }, { status: 403 });
    }

    const supabase = await createClient();

    // Fetch existing order
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("*, profiles:buyer_id(id, full_name, email)")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const oldStatus = order.status;

    // A. CUSTOMER ACTIONS
    if (user.role === "customer") {
      // Must own the order
      if (order.buyer_id !== user.id) {
        return NextResponse.json({ error: "Forbidden: You do not own this order." }, { status: 403 });
      }

      // Customer CANNOT approve payment or jump statuses
      if (action === "approve" || status === "approved" || status === "in_production" || status === "ready" || status === "completed") {
        return NextResponse.json({ error: "Forbidden: Customers cannot approve payments or modify manufacturing status." }, { status: 403 });
      }

      if (action === "cancel") {
        // Can only cancel if pending_payment or pending_verification
        if (!["pending_payment", "pending_verification"].includes(oldStatus)) {
          return NextResponse.json({ error: "Orders that are already approved or in production cannot be cancelled." }, { status: 400 });
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

        // Customer can upload proof if pending_payment or rejected (or re-upload while pending_verification)
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

    // B. ADMIN ACTIONS
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
      } else if (action === "upload_proof") {
        targetStatus = "pending_verification";
        updates.payment_proof_path = paymentProofPath;
        updates.rejection_reason = null;
      }

      if (!targetStatus) {
        return NextResponse.json({ error: "Target status or action is required." }, { status: 400 });
      }

      // Validate allowed transitions in state machine
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

      // Status history
      await supabase.from("order_status_history").insert({
        order_id: orderId,
        from_status: oldStatus,
        to_status: targetStatus,
        changed_by: user.id,
        note: note || (action === "reject" ? `Rejected: ${rejectionReason}` : `Status transitioned to ${targetStatus} by Administrator.`),
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
