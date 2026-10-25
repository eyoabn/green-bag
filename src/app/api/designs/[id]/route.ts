import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";

// GET /api/designs/[id] - Fetch single design with full specifications & manufacturing telemetry
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

    // Fetch design with complete technical specs & creator profile
    const { data: design, error } = await supabase
      .from("designs")
      .select(`
        id, submitted_by, title, file_path, description, quantity, dimensions, gsm, handle_type, print_finish, urgency, specs_json, admin_reply, quoted_price, status, linked_order_id, created_at, updated_at,
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

// PATCH /api/designs/[id] - Update status, quote price, accept quote, submit payment, or advance manufacturing
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
      `SELECT id, submitted_by, title, status, quoted_price, admin_reply, description, file_path, linked_order_id, specs_json
       FROM public.designs WHERE id = $1`,
      [id]
    );

    if (existingRows.length === 0) {
      return NextResponse.json({ error: "Design request not found." }, { status: 404 });
    }
    const existing = existingRows[0];
    let currentSpecs: Record<string, any> = {};
    if (existing.specs_json) {
      currentSpecs = typeof existing.specs_json === "string" ? JSON.parse(existing.specs_json) : existing.specs_json;
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (user.role === "admin") {
      // 1. Advance Manufacturing Production Stage
      if (body.action === "advance_stage") {
        const validStages = [
          "quote_accepted",
          "payment_submitted",
          "payment_verified",
          "plate_engraving",
          "printing_and_cutting",
          "assembly_and_qc",
          "ready_for_delivery",
          "delivered",
        ];
        const newStage = String(body.stage);
        if (!validStages.includes(newStage)) {
          return NextResponse.json({ error: `Invalid production stage: ${newStage}` }, { status: 400 });
        }

        const stageNotes: Record<string, string> = {
          payment_verified: "Deposit verified. Pre-press files sent to flexographic platemaker.",
          plate_engraving: "Laser plate engraving in progress. Ink pigments calibrated to brand standard.",
          printing_and_cutting: "High-speed flexographic printing and rotary die-cutting underway at Addis Ababa plant.",
          assembly_and_qc: "Handle stringing, gusset gluing, and optical tensile testing complete.",
          ready_for_delivery: "Packaging bundled, palletized, and prepared for dispatch.",
          delivered: "Consignment successfully delivered to client destination.",
        };

        const updatedSpecs = {
          ...currentSpecs,
          production_stage: newStage,
          last_stage_update: new Date().toISOString(),
          stage_history: [
            ...(currentSpecs.stage_history || []),
            { stage: newStage, updated_at: new Date().toISOString(), note: stageNotes[newStage] || "Stage advanced" },
          ],
        };
        updates.specs_json = JSON.stringify(updatedSpecs);

        // Synchronize linked order status if exists
        if (existing.linked_order_id) {
          let orderTargetStatus: string | null = null;
          if (newStage === "payment_verified") orderTargetStatus = "approved";
          else if (newStage === "plate_engraving" || newStage === "printing_and_cutting") orderTargetStatus = "in_production";
          else if (newStage === "assembly_and_qc" || newStage === "ready_for_delivery") orderTargetStatus = "ready";
          else if (newStage === "delivered") orderTargetStatus = "completed";

          if (orderTargetStatus) {
            await pool.query(
              "UPDATE public.orders SET status = $1, updated_at = NOW() WHERE id = $2",
              [orderTargetStatus, existing.linked_order_id]
            );
          }
        }

        // Notify customer
        const clientMsg = stageNotes[newStage] || `Manufacturing stage updated to ${newStage}.`;
        await pool.query(
          `INSERT INTO public.notifications (user_id, title, body, link)
           VALUES ($1, $2, $3, $4)`,
          [
            existing.submitted_by,
            `Packaging Production Update: ${existing.title || "Custom Run"}`,
            clientMsg,
            "/dashboard/designs",
          ]
        );
      }
      // 2. Verify Bank Deposit Payment Directly
      else if (body.action === "verify_payment") {
        const updatedSpecs = {
          ...currentSpecs,
          payment_verified: true,
          payment_verified_at: new Date().toISOString(),
          production_stage: "payment_verified",
        };
        updates.specs_json = JSON.stringify(updatedSpecs);

        if (existing.linked_order_id) {
          await pool.query(
            "UPDATE public.orders SET status = 'approved', updated_at = NOW() WHERE id = $1",
            [existing.linked_order_id]
          );
        }

        await pool.query(
          `INSERT INTO public.notifications (user_id, title, body, link)
           VALUES ($1, $2, $3, $4)`,
          [
            existing.submitted_by,
            "Bank Transfer Verified — Manufacturing Initiated!",
            `Your payment for "${existing.title}" has been confirmed by our finance desk. Tooling & printing are now scheduled.`,
            "/dashboard/designs",
          ]
        );
      }
      // 3. Convert to Order / Manual Order Creation
      else if (body.action === "convert" || body.action === "create_order") {
        if (!existing.quoted_price || Number(existing.quoted_price) <= 0) {
          return NextResponse.json({ error: "Cannot create order without a valid quoted price." }, { status: 400 });
        }

        const { rows: bankRows } = await pool.query(
          "SELECT id FROM public.bank_accounts WHERE is_active = true LIMIT 1"
        );
        const bankId = bankRows.length > 0 ? bankRows[0].id : null;
        const orderNumber = `ARN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

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

        const { rows: prodRows } = await pool.query(
          "SELECT id FROM public.products WHERE is_available = true LIMIT 1"
        );
        if (prodRows.length > 0) {
          await pool.query(
            `INSERT INTO public.order_items (order_id, product_id, quantity, unit_price_snapshot)
             VALUES ($1, $2, 1, $3)`,
            [newOrder.id, prodRows[0].id, Number(existing.quoted_price)]
          );
        }

        await pool.query(
          `INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
           VALUES ($1, null, 'pending_payment', $2, 'Order created from approved custom packaging design.')`,
          [newOrder.id, user.id]
        );

        updates.status = "accepted";
        updates.linked_order_id = newOrder.id;

        await pool.query(
          `INSERT INTO public.notifications (user_id, title, body, link)
           VALUES ($1, $2, $3, $4)`,
          [
            existing.submitted_by,
            "Order Created from Your Custom Design!",
            `Your custom packaging design "${existing.title}" has been converted to Order #${newOrder.order_number}. Please upload your payment receipt to begin manufacturing.`,
            "/dashboard/designs",
          ]
        );
      }
      // 4. Admin standard update (status, quoted_price, admin_reply)
      else {
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

        // Notify customer on status or quote change
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
      }
    } else {
      // Customer Role Actions
      if (existing.submitted_by !== user.id) {
        return NextResponse.json({ error: "Access denied." }, { status: 403 });
      }

      // Customer submitting bank transfer proof screenshot
      if (body.action === "submit_payment") {
        if (!body.payment_proof_url) {
          return NextResponse.json({ error: "Payment transfer proof screenshot is required." }, { status: 400 });
        }

        const updatedSpecs = {
          ...currentSpecs,
          payment_submitted: true,
          payment_proof_url: body.payment_proof_url,
          payment_ref: body.payment_ref || "",
          bank_account_id: body.bank_account_id || null,
          payment_submitted_at: new Date().toISOString(),
          production_stage: "payment_submitted",
        };
        updates.specs_json = JSON.stringify(updatedSpecs);

        // Update linked order to pending_verification
        if (existing.linked_order_id) {
          await pool.query(
            `UPDATE public.orders 
             SET status = 'pending_verification', 
                 payment_proof_path = $1, 
                 bank_account_id = COALESCE($2, bank_account_id),
                 updated_at = NOW() 
             WHERE id = $3`,
            [body.payment_proof_url, body.bank_account_id || null, existing.linked_order_id]
          );

          await pool.query(
            `INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
             VALUES ($1, 'pending_payment', 'pending_verification', $2, $3)`,
            [
              existing.linked_order_id,
              user.id,
              `Customer uploaded payment screenshot (Ref: ${body.payment_ref || "N/A"}). Awaiting finance desk verification.`,
            ]
          );
        }

        // Notify admins that customer uploaded payment
        const { rows: admins } = await pool.query(
          "SELECT id FROM public.profiles WHERE role = 'admin'"
        );
        for (const adm of admins) {
          await pool.query(
            `INSERT INTO public.notifications (user_id, title, body, link)
             VALUES ($1, $2, $3, $4)`,
            [
              adm.id,
              "Payment Proof Uploaded for Custom Packaging!",
              `Customer ${user.full_name || user.email} submitted bank slip for design "${existing.title}" (${existing.quoted_price} ETB). Please verify deposit.`,
              `/admin/designs`,
            ]
          );
        }
      }
      // Customer accepting quotation
      else if (body.action === "accept" || body.status === "accepted") {
        if (existing.status !== "quoted") {
          return NextResponse.json(
            { error: `Cannot accept quote when status is "${existing.status}". A quote must be provided first.` },
            { status: 400 }
          );
        }

        updates.status = "accepted";
        const updatedSpecs = {
          ...currentSpecs,
          quote_accepted_at: new Date().toISOString(),
          production_stage: currentSpecs.production_stage || "quote_accepted",
        };
        updates.specs_json = JSON.stringify(updatedSpecs);

        // Auto-create linked order so customer has a concrete order and can pay
        if (!existing.linked_order_id && existing.quoted_price && Number(existing.quoted_price) > 0) {
          const { rows: bankRows } = await pool.query(
            "SELECT id FROM public.bank_accounts WHERE is_active = true LIMIT 1"
          );
          const bankId = bankRows.length > 0 ? bankRows[0].id : null;
          const orderNumber = `ARN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

          const { rows: orderRows } = await pool.query(
            `INSERT INTO public.orders (order_number, buyer_id, total_price, bank_account_id, delivery_address, phone, notes, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_payment')
             RETURNING *`,
            [
              orderNumber,
              user.id,
              Number(existing.quoted_price),
              bankId,
              "Addis Ababa Plant Dispatch",
              user.phone || "0911000000",
              `Custom Design Order: ${existing.title || "Custom Bag"} (Ref: #${existing.id.substring(0, 8)})`,
            ]
          );
          const newOrder = orderRows[0];
          updates.linked_order_id = newOrder.id;

          const { rows: prodRows } = await pool.query(
            "SELECT id FROM public.products WHERE is_available = true LIMIT 1"
          );
          if (prodRows.length > 0) {
            await pool.query(
              `INSERT INTO public.order_items (order_id, product_id, quantity, unit_price_snapshot)
               VALUES ($1, $2, 1, $3)`,
              [newOrder.id, prodRows[0].id, Number(existing.quoted_price)]
            );
          }

          await pool.query(
            `INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
             VALUES ($1, null, 'pending_payment', $2, 'Order auto-created upon client quote acceptance.')`,
            [newOrder.id, user.id]
          );
        }

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
              `Customer ${user.full_name || user.email} accepted the quotation of ${existing.quoted_price} ETB for design "${existing.title}".`,
              `/admin/designs`,
            ]
          );
        }
      }
      // Customer declining quote
      else if (body.action === "decline" || body.status === "declined") {
        if (existing.status !== "quoted") {
          return NextResponse.json(
            { error: `Cannot decline quote when status is "${existing.status}".` },
            { status: 400 }
          );
        }
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
              `/admin/designs`,
            ]
          );
        }
      } else {
        return NextResponse.json({ error: "Customers can accept, decline quotes, or submit payment proofs." }, { status: 403 });
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
