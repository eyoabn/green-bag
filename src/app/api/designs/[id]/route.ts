import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";
import { logAuditEvent } from "@/utils/audit";
import { notifyAdmins, notifyUser } from "@/utils/notifications";
import { isValidUUID, isValidStoragePathForUser } from "@/utils/validation";

// GET /api/designs/[id] - Fetch single design with full specifications & manufacturing telemetry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid design ID format." }, { status: 400 });
    }

    const user = await requireUser();

    const { rows: designRows } = await pool.query(
      "SELECT id, submitted_by FROM public.designs WHERE id = $1",
      [id]
    );
    if (designRows.length === 0) {
      return NextResponse.json({ error: "Design request not found." }, { status: 404 });
    }

    if (user.role !== "admin" && designRows[0].submitted_by !== user.id) {
      return NextResponse.json(
        { error: "Access denied: You cannot view another customer's design." },
        { status: 403 }
      );
    }

    const supabase = await createClient();

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
    console.error("GET /api/designs/[id] error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to load design" },
      { status }
    );
  }
}

// PATCH /api/designs/[id] - Update status, quote price, accept quote, submit payment, or advance manufacturing
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid design ID format." }, { status: 400 });
    }

    const user = await requireUser();
    const body = await request.json().catch(() => ({}));

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
      currentSpecs =
        typeof existing.specs_json === "string"
          ? JSON.parse(existing.specs_json)
          : existing.specs_json;
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    let createdOrder: any = null;

    if (user.role === "admin") {
      // 1. Accept Design & Send Quotation ("We Can Do It!")
      if (body.action === "accept_and_quote") {
        const p = Number(body.quoted_price);
        if (!Number.isFinite(p) || p <= 0 || p > 100000000) {
          return NextResponse.json(
            { error: "Quoted price must be a positive number in ETB." },
            { status: 400 }
          );
        }
        updates.status = "quoted";
        updates.quoted_price = p;
        if (body.admin_reply !== undefined) {
          updates.admin_reply = String(body.admin_reply).trim().slice(0, 2000);
        }

        let designatedBank: any = null;
        if (body.bank_account_id) {
          if (!isValidUUID(body.bank_account_id)) {
            return NextResponse.json({ error: "Invalid bank_account_id." }, { status: 400 });
          }
          const { rows: bRows } = await pool.query(
            "SELECT id, bank_name, account_name, account_number, instructions FROM public.bank_accounts WHERE id = $1 LIMIT 1",
            [body.bank_account_id]
          );
          if (bRows.length > 0) designatedBank = bRows[0];
        }

        const updatedSpecs = {
          ...currentSpecs,
          workflow_stage: "quoted",
          accepted_by_admin: true,
          accepted_by_admin_at: new Date().toISOString(),
          designated_bank: designatedBank,
          designated_bank_account_id: designatedBank?.id || null,
        };
        updates.specs_json = JSON.stringify(updatedSpecs);

        const bankDirective = designatedBank
          ? ` Please transfer your deposit to our official ${designatedBank.bank_name} (Acc: ${designatedBank.account_number}) and enter your transaction reference.`
          : ` Please accept the quote and send your deposit via CBE or Telebirr to initiate manufacturing.`;

        await notifyUser({
          userId: existing.submitted_by,
          title: "We Can Do It! Custom Design Accepted",
          body: `We can do it! Our plant engineers have analyzed and accepted your custom packaging design "${existing.title}". Quoted Total: ${p.toLocaleString()} ETB.${bankDirective}`,
          link: "/dashboard/designs",
        });
      }
      // 2. Advance Manufacturing Production Stage
      else if (body.action === "advance_stage") {
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
          return NextResponse.json(
            { error: `Invalid production stage: ${newStage}` },
            { status: 400 }
          );
        }

        const stageNotes: Record<string, string> = {
          payment_verified: "Deposit & QR verified. Pre-press files sent to flexographic platemaker.",
          plate_engraving: "Laser plate engraving in progress. Ink pigments calibrated to brand standard.",
          printing_and_cutting:
            "It is on doing: High-speed flexographic printing and rotary die-cutting underway.",
          assembly_and_qc: "Handle stringing, gusset gluing, and optical tensile testing complete.",
          ready_for_delivery:
            "Packaging bundled, palletized, and prepared for dispatch. Select delivery option.",
          delivered: "Consignment successfully delivered to client destination.",
        };

        const updatedSpecs = {
          ...currentSpecs,
          production_stage: newStage,
          workflow_stage:
            newStage === "ready_for_delivery"
              ? "finished"
              : newStage === "delivered"
              ? "delivered"
              : "in_production",
          last_stage_update: new Date().toISOString(),
          stage_history: [
            ...(currentSpecs.stage_history || []),
            {
              stage: newStage,
              updated_at: new Date().toISOString(),
              note: stageNotes[newStage] || "Stage advanced",
            },
          ],
        };
        updates.specs_json = JSON.stringify(updatedSpecs);

        if (existing.linked_order_id) {
          let orderTargetStatus: string | null = null;
          if (newStage === "payment_verified") orderTargetStatus = "approved";
          else if (newStage === "plate_engraving" || newStage === "printing_and_cutting")
            orderTargetStatus = "in_production";
          else if (newStage === "assembly_and_qc" || newStage === "ready_for_delivery")
            orderTargetStatus = "ready";
          else if (newStage === "delivered") orderTargetStatus = "completed";

          if (orderTargetStatus) {
            await pool.query(
              "UPDATE public.orders SET status = $1, updated_at = NOW() WHERE id = $2",
              [orderTargetStatus, existing.linked_order_id]
            );
          }
        }

        const clientMsg = stageNotes[newStage] || `Manufacturing stage updated to ${newStage}.`;
        await notifyUser({
          userId: existing.submitted_by,
          title:
            newStage === "ready_for_delivery"
              ? "Packaging Finished & Inspected! Choose Delivery Option"
              : `Packaging Production: ${existing.title || "Custom Run"}`,
          body: clientMsg,
          link: "/dashboard/designs",
        });
      }
      // 3. Verify Bank Deposit Payment Directly -> Confirm "It Is On Doing"
      else if (body.action === "verify_payment") {
        const updatedSpecs = {
          ...currentSpecs,
          payment_verified: true,
          payment_verified_at: new Date().toISOString(),
          production_stage: "printing_and_cutting",
          workflow_stage: "in_production",
        };
        updates.specs_json = JSON.stringify(updatedSpecs);

        if (existing.linked_order_id) {
          await pool.query(
            "UPDATE public.orders SET status = 'in_production', updated_at = NOW() WHERE id = $1",
            [existing.linked_order_id]
          );
        }

        await notifyUser({
          userId: existing.submitted_by,
          title: "Payment Confirmed — It Is On Doing!",
          body: `Your payment and QR code proof for "${existing.title}" have been verified by our plant desk! It is on doing — your custom packaging is now in active production at our Addis Ababa facility!`,
          link: "/dashboard/designs",
        });
      }
      // 4. Mark Finished & Request Delivery Option
      else if (body.action === "mark_finished") {
        const updatedSpecs = {
          ...currentSpecs,
          production_stage: "ready_for_delivery",
          workflow_stage: "finished",
          finished_at: new Date().toISOString(),
        };
        updates.specs_json = JSON.stringify(updatedSpecs);

        if (existing.linked_order_id) {
          await pool.query(
            "UPDATE public.orders SET status = 'ready', updated_at = NOW() WHERE id = $1",
            [existing.linked_order_id]
          );
        }

        await notifyUser({
          userId: existing.submitted_by,
          title: "Packaging Finished & Quality Inspected!",
          body: `Your custom packaging order for "${existing.title}" is finished and passed optical tensile & quality control. Please select your delivery option (Plant Pickup in Bole or Direct Van Delivery).`,
          link: "/dashboard/designs",
        });
      }
      // 5. Convert to Order / Manual Order Creation
      else if (body.action === "convert" || body.action === "create_order") {
        if (!existing.quoted_price || Number(existing.quoted_price) <= 0) {
          return NextResponse.json(
            { error: "Cannot create order without a valid quoted price." },
            { status: 400 }
          );
        }
        if (existing.linked_order_id) {
          return NextResponse.json(
            { error: "An order has already been created for this design." },
            { status: 409 }
          );
        }

        const { rows: bankRows } = await pool.query(
          "SELECT id FROM public.bank_accounts WHERE is_active = true LIMIT 1"
        );
        const bankId = bankRows.length > 0 ? bankRows[0].id : null;
        let orderNumber: string;
        try {
          const { rows: seqRows } = await pool.query("SELECT nextval('order_number_seq') as seq");
          orderNumber = `ARN-${new Date().getFullYear()}-${String(seqRows[0]?.seq).padStart(4, "0")}`;
        } catch {
          orderNumber = `ARN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
        }

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
            `Custom Design Commission: ${existing.title || "Custom Bag"} (Ref: #${existing.id.substring(0, 8)})`,
          ]
        );
        const newOrder = orderRows[0];
        createdOrder = newOrder;

        await pool.query(
          `INSERT INTO public.order_items (order_id, custom_design_id, product_id, quantity, unit_price_snapshot)
           VALUES ($1, $2, null, 1, $3)`,
          [newOrder.id, existing.id, Number(existing.quoted_price)]
        );

        await pool.query(
          `INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
           VALUES ($1, null, 'pending_payment', $2, 'Order created from approved custom packaging design.')`,
          [newOrder.id, user.id]
        );

        updates.status = "accepted";
        updates.linked_order_id = newOrder.id;

        await notifyUser({
          userId: existing.submitted_by,
          title: "Order Created from Your Custom Design!",
          body: `Your custom packaging design "${existing.title}" has been converted to Order #${newOrder.order_number}. Please upload your payment receipt to begin manufacturing.`,
          link: "/dashboard/designs",
        });
      }
      // 6. Admin standard update
      else {
        if (body.status !== undefined) {
          const validStatuses = ["new", "reviewing", "quoted", "accepted", "declined"];
          if (!validStatuses.includes(body.status)) {
            return NextResponse.json(
              { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
              { status: 400 }
            );
          }
          updates.status = body.status;
        }

        if (body.quoted_price !== undefined) {
          const p = Number(body.quoted_price);
          if (!Number.isFinite(p) || p < 0 || p > 100000000) {
            return NextResponse.json(
              { error: "Quoted price must be a positive number." },
              { status: 400 }
            );
          }
          updates.quoted_price = p;
        }

        if (body.admin_reply !== undefined) {
          updates.admin_reply = String(body.admin_reply).trim().slice(0, 2000);
        }

        if (body.description !== undefined) {
          updates.description = String(body.description).slice(0, 4000);
        }

        let notifMsg = `Your custom packaging design "${existing.title}" status is now ${updates.status || existing.status}.`;
        if (updates.status === "quoted" || updates.quoted_price !== undefined) {
          notifMsg = `Our plant quoted your custom design "${existing.title}" at ${updates.quoted_price ?? existing.quoted_price} ETB. ${updates.admin_reply ? `Note: "${updates.admin_reply}"` : ""}`;
        } else if (updates.admin_reply) {
          notifMsg = `Plant Engineer message on "${existing.title}": "${updates.admin_reply}".`;
        }

        await notifyUser({
          userId: existing.submitted_by,
          title: "Design Request Update",
          body: notifMsg,
          link: "/dashboard/designs",
        });
      }
    } else {
      // Customer Role Actions
      if (existing.submitted_by !== user.id) {
        return NextResponse.json({ error: "Access denied." }, { status: 403 });
      }

      if (body.quoted_price !== undefined || body.status === "quoted") {
        return NextResponse.json(
          {
            error:
              "Customers cannot set or modify quoted prices. Only administrators can quote prices.",
          },
          { status: 403 }
        );
      }

      // Customer submitting bank transfer proof screenshot
      if (body.action === "submit_payment") {
        if (existing.status !== "accepted") {
          return NextResponse.json(
            { error: "You must accept a quotation before submitting payment proof." },
            { status: 400 }
          );
        }

        const proofPath =
          typeof body.payment_proof_url === "string" ? body.payment_proof_url.trim() : "";
        if (
          !proofPath ||
          !isValidStoragePathForUser(proofPath, user.id, user.role, { allowQrRef: true })
        ) {
          return NextResponse.json(
            { error: "A valid payment transfer proof path or QR reference is required." },
            { status: 400 }
          );
        }

        let bankAccountId: string | null = null;
        if (body.bank_account_id) {
          if (!isValidUUID(body.bank_account_id)) {
            return NextResponse.json({ error: "Invalid bank_account_id format." }, { status: 400 });
          }
          bankAccountId = body.bank_account_id;
        }

        if (existing.linked_order_id) {
          const orderCheck = await pool.query(
            "SELECT status::text AS current_status FROM public.orders WHERE id = $1 LIMIT 1",
            [existing.linked_order_id]
          );
          const currentOrderStatus = orderCheck.rows[0]?.current_status;
          if (
            !currentOrderStatus ||
            !["pending_payment", "pending_verification", "rejected"].includes(currentOrderStatus)
          ) {
            return NextResponse.json(
              { error: "Payment proof can no longer be submitted for this order's current status." },
              { status: 400 }
            );
          }

          await pool.query(
            `UPDATE public.orders
             SET status = 'pending_verification',
                 payment_proof_path = $1,
                 bank_account_id = COALESCE($2, bank_account_id),
                 rejection_reason = NULL,
                 updated_at = NOW()
             WHERE id = $3 AND status::text IN ('pending_payment', 'pending_verification', 'rejected')`,
            [proofPath, bankAccountId, existing.linked_order_id]
          );

          await pool.query(
            `INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
             VALUES ($1, $2, 'pending_verification', $3, $4)`,
            [
              existing.linked_order_id,
              currentOrderStatus,
              user.id,
              `Customer uploaded payment screenshot (Ref: ${String(body.payment_ref || "N/A").slice(0, 120)}). Awaiting finance desk verification.`,
            ]
          );
        }

        const updatedSpecs = {
          ...currentSpecs,
          payment_submitted: true,
          payment_proof_url: proofPath,
          payment_ref: body.payment_ref ? String(body.payment_ref).slice(0, 120) : "",
          qr_code_ref: body.qr_code_ref
            ? String(body.qr_code_ref).slice(0, 120)
            : body.payment_ref
            ? String(body.payment_ref).slice(0, 120)
            : "",
          bank_account_id: bankAccountId,
          payment_submitted_at: new Date().toISOString(),
          production_stage: "payment_submitted",
          workflow_stage: "payment_submitted",
        };
        updates.specs_json = JSON.stringify(updatedSpecs);

        await notifyAdmins({
          title: "Payment Proof Uploaded for Custom Packaging!",
          body: `Customer ${user.full_name || user.email} submitted bank slip for design "${existing.title}" (${existing.quoted_price} ETB). Please verify deposit.`,
          link: "/admin/designs",
        });
      }
      // Customer accepting quotation (transactional FOR UPDATE lock to prevent duplicate orders)
      else if (body.action === "accept" || body.status === "accepted") {
        const client = await pool.connect();
        let updated: any;
        try {
          await client.query("BEGIN");
          const lockRes = await client.query(
            `SELECT id, submitted_by, title, status, quoted_price, linked_order_id, specs_json
             FROM public.designs WHERE id = $1 FOR UPDATE`,
            [id]
          );
          const locked = lockRes.rows[0];
          if (!locked || locked.status !== "quoted") {
            await client.query("ROLLBACK");
            return NextResponse.json(
              {
                error: `Cannot accept quote when status is "${locked?.status ?? existing.status}". A quote must be provided first.`,
              },
              { status: 400 }
            );
          }

          const lockedSpecs =
            locked.specs_json && typeof locked.specs_json === "string"
              ? JSON.parse(locked.specs_json)
              : locked.specs_json || {};

          const updatedSpecs = {
            ...lockedSpecs,
            quote_accepted_at: new Date().toISOString(),
            production_stage: lockedSpecs.production_stage || "quote_accepted",
          };

          let linkedOrderId = locked.linked_order_id;
          if (!linkedOrderId && locked.quoted_price && Number(locked.quoted_price) > 0) {
            const { rows: bankRows } = await client.query(
              "SELECT id FROM public.bank_accounts WHERE is_active = true LIMIT 1"
            );
            const bankId = bankRows.length > 0 ? bankRows[0].id : null;
            let orderNumber: string;
            try {
              const { rows: seqRows } = await client.query("SELECT nextval('order_number_seq') as seq");
              orderNumber = `ARN-${new Date().getFullYear()}-${String(seqRows[0]?.seq).padStart(4, "0")}`;
            } catch {
              orderNumber = `ARN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
            }

            const { rows: orderRows } = await client.query(
              `INSERT INTO public.orders (order_number, buyer_id, total_price, bank_account_id, delivery_address, phone, notes, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_payment')
               RETURNING *`,
              [
                orderNumber,
                user.id,
                Number(locked.quoted_price),
                bankId,
                "Addis Ababa Plant Dispatch",
                user.phone || "0911000000",
                `Custom Design Commission: ${locked.title || "Custom Bag"} (Ref: #${locked.id.substring(0, 8)})`,
              ]
            );
            createdOrder = orderRows[0];
            linkedOrderId = createdOrder.id;

            await client.query(
              `INSERT INTO public.order_items (order_id, custom_design_id, product_id, quantity, unit_price_snapshot)
               VALUES ($1, $2, null, 1, $3)`,
              [createdOrder.id, locked.id, Number(locked.quoted_price)]
            );

            await client.query(
              `INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
               VALUES ($1, null, 'pending_payment', $2, 'Order auto-created upon client quote acceptance.')`,
              [createdOrder.id, user.id]
            );
          }

          const { rows: updatedRows } = await client.query(
            `UPDATE public.designs
             SET status = 'accepted',
                 linked_order_id = COALESCE(linked_order_id, $2),
                 specs_json = $3,
                 updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [id, linkedOrderId, JSON.stringify(updatedSpecs)]
          );
          updated = updatedRows[0];
          await client.query("COMMIT");
        } catch (txErr) {
          await client.query("ROLLBACK").catch(() => {});
          throw txErr;
        } finally {
          client.release();
        }

        await notifyAdmins({
          title: "Custom Design Quote Accepted!",
          body: `Customer ${user.full_name || user.email} accepted the quotation of ${existing.quoted_price} ETB for design "${existing.title}".`,
          link: "/admin/designs",
        });

        await logAuditEvent({
          actorId: user.id,
          action: "UPDATE_DESIGN",
          entity: "designs",
          entityId: id,
          metadata: { status: "accepted", linked_order_id: updated.linked_order_id },
        });

        return NextResponse.json({
          success: true,
          design: updated,
          ...(createdOrder ? { order: createdOrder } : {}),
        });
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

        await notifyAdmins({
          title: "Custom Design Quote Declined",
          body: `Customer ${user.full_name || user.email} declined the quote for design "${existing.title}".`,
          link: "/admin/designs",
        });
      }
      // Customer confirming delivery option (Plant Pickup or Direct Delivery)
      else if (body.action === "confirm_delivery") {
        if (
          existing.status !== "accepted" ||
          (currentSpecs.workflow_stage !== "finished" &&
            currentSpecs.production_stage !== "ready_for_delivery")
        ) {
          return NextResponse.json(
            { error: "Delivery option can only be selected once production is finished." },
            { status: 400 }
          );
        }

        const { delivery_option, delivery_address, delivery_phone, delivery_notes } = body;
        if (!delivery_option || !["pickup", "direct_delivery"].includes(delivery_option)) {
          return NextResponse.json(
            { error: "Delivery option is required ('pickup' or 'direct_delivery')." },
            { status: 400 }
          );
        }

        const updatedSpecs = {
          ...currentSpecs,
          delivery_preference: {
            option: delivery_option,
            address: String(delivery_address || currentSpecs.deliveryAddress || "Addis Ababa Plant Dispatch").slice(0, 500),
            phone: String(delivery_phone || currentSpecs.contactPhone || "").slice(0, 30),
            notes: String(delivery_notes || "").slice(0, 1000),
            confirmed_at: new Date().toISOString(),
          },
          workflow_stage: "delivery_confirmed",
        };
        updates.specs_json = JSON.stringify(updatedSpecs);

        await notifyAdmins({
          title: "Client Selected Delivery Option",
          body: `Client for "${existing.title}" confirmed: ${
            delivery_option === "pickup"
              ? "Factory Pickup at Bole Showroom"
              : `Direct Van Delivery to ${String(delivery_address || currentSpecs.deliveryAddress || "").slice(0, 200)}`
          }.`,
          link: "/admin/designs",
        });
      } else {
        return NextResponse.json(
          {
            error:
              "Customers can accept, decline quotes, submit payment proofs, or choose delivery options.",
          },
          { status: 403 }
        );
      }
    }

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

    await logAuditEvent({
      actorId: user.id,
      action: "UPDATE_DESIGN",
      entity: "designs",
      entityId: id,
      metadata: updates,
    });

    return NextResponse.json({
      success: true,
      design: updated,
      ...(createdOrder ? { order: createdOrder } : {}),
    });
  } catch (err: any) {
    console.error("PATCH /api/designs/[id] error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to update design" },
      { status }
    );
  }
}
