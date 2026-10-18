import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";

// GET /api/designs/[id] - Fetch single design
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser();

    // Check existence and ownership in DB first to distinguish 404 vs 403 under RLS
    const { rows: designRows } = await pool.query(
      "SELECT id, submitted_by FROM public.designs WHERE id = $1",
      [id]
    );
    if (designRows.length === 0) {
      return NextResponse.json({ error: "Design request not found." }, { status: 404 });
    }

    // Customer can view ONLY their own designs
    if (user.role !== "admin" && designRows[0].submitted_by !== user.id) {
      return NextResponse.json(
        { error: "Access denied: You cannot view another customer's design." },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Fetch design to verify existence
    const { data: design, error } = await supabase
      .from("designs")
      .select(`
        id, submitted_by, title, file_path, description, admin_reply, quoted_price, status, linked_order_id, created_at, updated_at,
        profiles:submitted_by(id, full_name, email, phone)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!design) {
      return NextResponse.json({ error: "Design request not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, design });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to load design" }, { status });
  }
}

// PATCH /api/designs/[id] - Update status, quote price, accept/decline quote, or convert to order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));

    // Fetch existing design via pool to bypass RLS isolation for ownership verification
    const { rows: existingRows } = await pool.query(
      "SELECT id, submitted_by, title, status, quoted_price, admin_reply, description, file_path, linked_order_id FROM public.designs WHERE id = $1",
      [id]
    );

    if (existingRows.length === 0) {
      return NextResponse.json({ error: "Design request not found." }, { status: 404 });
    }
    const existing = existingRows[0];

    const supabase = await createClient();

    // Role-based authorization & mutation rules
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (user.role === "admin") {
      // 1. Convert to order action
      if (body.action === "convert" || body.action === "create_order") {
        if (!existing.quoted_price || Number(existing.quoted_price) <= 0) {
          return NextResponse.json({ error: "Cannot create order without a valid quoted price." }, { status: 400 });
        }

        // Fetch active bank account
        const { rows: bankRows } = await pool.query(
          "SELECT id FROM public.bank_accounts WHERE is_active = true LIMIT 1"
        );
        const bankId = bankRows.length > 0 ? bankRows[0].id : null;

        const orderNumber = `ARN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        // Create order in pending_payment status (Phase 5 payment flow)
        const { rows: orderRows } = await pool.query(
          `INSERT INTO public.orders (order_number, buyer_id, total_price, bank_account_id, delivery_address, phone, notes, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_payment')
           RETURNING *`,
          [
            orderNumber,
            existing.submitted_by,
            Number(existing.quoted_price),
            bankId,
            "Addis Ababa Plant Dispatch",
            "0911000000",
            `Custom Design Order: ${existing.title || "Custom Bag"} (Ref: #${existing.id.substring(0, 8)})`,
          ]
        );
        const newOrder = orderRows[0];

        // Add order items (requires valid product_id foreign key)
        const { rows: prodRows } = await pool.query(
          "SELECT id FROM public.products WHERE is_available = true LIMIT 1"
        );
        const productId = prodRows.length > 0 ? prodRows[0].id : null;

        if (productId) {
          await pool.query(
            `INSERT INTO public.order_items (order_id, product_id, quantity, unit_price_snapshot)
             VALUES ($1, $2, 1, $3)`,
            [newOrder.id, productId, Number(existing.quoted_price)]
          );
        }

        // Record initial status history
        await pool.query(
          `INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
           VALUES ($1, null, 'pending_payment', $2, 'Order created from approved custom packaging design.')`,
          [newOrder.id, user.id]
        );

        // Update design
        await pool.query(
          `UPDATE public.designs SET status = 'accepted', linked_order_id = $1, updated_at = NOW() WHERE id = $2`,
          [newOrder.id, id]
        );

        // Notify customer
        await pool.query(
          `INSERT INTO public.notifications (user_id, title, body, link)
           VALUES ($1, $2, $3, $4)`,
          [
            existing.submitted_by,
            "Order Created from Your Custom Design!",
            `Your custom packaging design "${existing.title}" has been converted to Order #${newOrder.order_number}. Please upload your payment receipt to begin manufacturing.`,
            `/dashboard/orders/${newOrder.id}`,
          ]
        );

        const { rows: updatedDesignRows } = await pool.query("SELECT * FROM public.designs WHERE id = $1", [id]);

        return NextResponse.json({
          success: true,
          converted: true,
          order: newOrder,
          design: updatedDesignRows[0],
        });
      }

      // 2. Admin normal update
      if (body.status !== undefined) {
        const validStatuses = ["new", "reviewing", "quoted", "accepted", "declined"];
        if (!validStatuses.includes(body.status)) {
          return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
        }
        updates.status = body.status;
      }

      if (body.quoted_price !== undefined) {
        const p = Number(body.quoted_price);
        if (isNaN(p) || p < 0) {
          return NextResponse.json({ error: "Quoted price must be a positive number." }, { status: 400 });
        }
        updates.quoted_price = p;
      }

      if (body.admin_reply !== undefined) {
        updates.admin_reply = String(body.admin_reply).trim();
      }

      if (body.description !== undefined) {
        updates.description = String(body.description);
      }

      // Customer is notified on every change
      let notifMsg = `Your custom packaging design "${existing.title}" status is now ${updates.status || existing.status}.`;
      if (updates.status === "quoted" || updates.quoted_price !== undefined) {
        notifMsg = `Our plant quoted your custom design "${existing.title}" at ${updates.quoted_price ?? existing.quoted_price} ETB. ${updates.admin_reply ? `Note: "${updates.admin_reply}"` : ""}`;
      } else if (updates.admin_reply) {
        notifMsg = `Plant Engineer message on "${existing.title}": "${updates.admin_reply}".`;
      }

      await pool.query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1, $2, $3, $4)`,
        [
          existing.submitted_by,
          "Design Request Update",
          notifMsg,
          "/dashboard/designs",
        ]
      );

    } else {
      // Customer role checks
      if (existing.submitted_by !== user.id) {
        return NextResponse.json({ error: "Access denied." }, { status: 403 });
      }

      // Customer cannot set quoted price or arbitrary status
      if (body.quoted_price !== undefined) {
        return NextResponse.json({ error: "Customers cannot set or modify quoted prices." }, { status: 403 });
      }

      if (body.status === "quoted") {
        return NextResponse.json({ error: "Customers cannot set status to quoted." }, { status: 403 });
      }

      if (existing.status !== "quoted") {
        return NextResponse.json({ error: `Cannot accept or decline quote when status is "${existing.status}". A quote must be provided first.` }, { status: 400 });
      }

      if (body.action === "accept" || body.status === "accepted") {
        updates.status = "accepted";

        // Notify admins that customer accepted quote
        const { rows: admins } = await pool.query(
          "SELECT id FROM public.profiles WHERE role = 'admin'"
        );
        for (const adm of admins) {
          await pool.query(
            `INSERT INTO public.notifications (user_id, title, body, link)
             VALUES ($1, $2, $3, $4)`,
            [
              adm.id,
              "Custom Design Quote Accepted!",
              `Customer ${user.full_name || user.email} accepted the quotation of ${existing.quoted_price} ETB for design "${existing.title}". You can now convert it to an order.`,
              `/admin/designs?id=${existing.id}`,
            ]
          );
        }
      } else if (body.action === "decline" || body.status === "declined") {
        updates.status = "declined";

        const { rows: admins } = await pool.query(
          "SELECT id FROM public.profiles WHERE role = 'admin'"
        );
        for (const adm of admins) {
          await pool.query(
            `INSERT INTO public.notifications (user_id, title, body, link)
             VALUES ($1, $2, $3, $4)`,
            [
              adm.id,
              "Custom Design Quote Declined",
              `Customer ${user.full_name || user.email} declined the quote for design "${existing.title}".`,
              `/admin/designs?id=${existing.id}`,
            ]
          );
        }
      } else {
        return NextResponse.json({ error: "Customers can only accept or decline quotes." }, { status: 403 });
      }
    }

    // Apply updates to designs table via pool
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    for (const [key, val] of Object.entries(updates)) {
      setClauses.push(`${key} = $${paramIdx++}`);
      values.push(val);
    }
    values.push(id);

    const { rows: updatedRows } = await pool.query(
      `UPDATE public.designs SET ${setClauses.join(", ")} WHERE id = $${paramIdx} RETURNING *`,
      values
    );
    const updated = updatedRows[0];

    await pool.query(
      `INSERT INTO public.audit_log (actor_id, action, entity, entity_id, metadata)
       VALUES ($1, 'UPDATE_DESIGN', 'designs', $2, $3)`,
      [user.id, id, JSON.stringify(updates)]
    );

    return NextResponse.json({ success: true, design: updated });
  } catch (err: any) {
    console.error("PATCH /api/designs/[id] error:", err);
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update design" }, { status });
  }
}
