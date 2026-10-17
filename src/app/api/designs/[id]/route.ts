import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";

// GET /api/designs/[id] - Fetch single design
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const supabase = await createClient();

    let query = supabase
      .from("designs")
      .select(`
        id, submitted_by, file_path, description, quoted_price, status, created_at, updated_at,
        profiles:submitted_by(id, full_name, email, phone)
      `)
      .eq("id", id);

    if (user.role !== "admin") {
      query = query.eq("submitted_by", user.id);
    }

    const { data: design, error } = await query.maybeSingle();
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
    const supabase = await createClient();

    // Fetch existing design
    const { data: existing, error: exErr } = await supabase
      .from("designs")
      .select("id, submitted_by, status, quoted_price, description, file_path")
      .eq("id", id)
      .maybeSingle();

    if (exErr || !existing) {
      return NextResponse.json({ error: "Design request not found." }, { status: 404 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (user.role === "admin") {
      if (body.status !== undefined) updates.status = body.status;
      if (body.quoted_price !== undefined) updates.quoted_price = Number(body.quoted_price);
      if (body.description !== undefined) updates.description = String(body.description);

      // One-click convert to order
      if (body.action === "convert") {
        if (!existing.quoted_price || Number(existing.quoted_price) <= 0) {
          return NextResponse.json({ error: "Cannot convert to order without a valid quoted price." }, { status: 400 });
        }

        // Fetch an active bank account for order assignment
        const { data: bank } = await supabase
          .from("bank_accounts")
          .select("id")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        // Create order
        const { data: newOrder, error: orderErr } = await supabase
          .from("orders")
          .insert({
            buyer_id: existing.submitted_by,
            total_price: Number(existing.quoted_price),
            bank_account_id: bank?.id || null,
            delivery_address: "Addis Ababa Plant Dispatch",
            phone: "0911000000",
            notes: `Converted from Custom Design #${existing.id.substring(0, 8)}. Spec: ${existing.description}`,
            status: "pending",
          })
          .select()
          .single();

        if (orderErr) throw orderErr;

        updates.status = "accepted";

        await supabase.from("notifications").insert({
          user_id: existing.submitted_by,
          title: "Design Converted to Order!",
          message: `Your custom design has been converted into Order #${newOrder.order_number || newOrder.id}. Please upload your payment receipt to begin manufacturing.`,
          link: `/dashboard/orders/${newOrder.id}`,
        });

        const { data: updatedDesign } = await supabase
          .from("designs")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        return NextResponse.json({
          success: true,
          converted: true,
          order: newOrder,
          design: updatedDesign,
        });
      }

      // If status changed to 'quoted', notify customer
      if (body.status === "quoted" && body.quoted_price) {
        await supabase.from("notifications").insert({
          user_id: existing.submitted_by,
          title: "Custom Bag Quote Ready!",
          message: `Our plant has quoted your custom packaging design at ${body.quoted_price} ETB. Tap to review and accept the quotation.`,
          link: `/dashboard?tab=designs`,
        });
      }
    } else {
      // Customer can accept or decline quote
      if (existing.submitted_by !== user.id) {
        return NextResponse.json({ error: "Access denied." }, { status: 403 });
      }

      if (body.action === "accept" || body.status === "accepted") {
        updates.status = "accepted";
      } else if (body.action === "decline" || body.status === "declined") {
        updates.status = "declined";
      } else {
        return NextResponse.json({ error: "Customers can only accept or decline quotes." }, { status: 403 });
      }
    }

    const { data: updated, error: updErr } = await supabase
      .from("designs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updErr) throw updErr;

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "UPDATE_DESIGN",
      entity: "designs",
      entity_id: id,
      metadata: updates,
    });

    return NextResponse.json({ success: true, design: updated });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update design" }, { status });
  }
}
