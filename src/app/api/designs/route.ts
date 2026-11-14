import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { logAuditEvent } from "@/utils/audit";
import { notifyAdmins } from "@/utils/notifications";
import { isValidStoragePathForUser } from "@/utils/validation";

// GET /api/designs - List designs by role (Admin sees all, Customer sees own)
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let query = supabase
      .from("designs")
      .select(`
        id, submitted_by, title, file_path, description, quantity, dimensions, gsm, handle_type, print_finish, urgency, specs_json, admin_reply, quoted_price, status, linked_order_id, created_at, updated_at,
        profiles:submitted_by(id, full_name, email, phone)
      `)
      .order("created_at", { ascending: false });

    if (user.role === "admin") {
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
    } else {
      // Customer sees only own designs
      query = query.eq("submitted_by", user.id);
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
    }

    const { data: designs, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      designs: designs || [],
    });
  } catch (err: any) {
    console.error("Load designs error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to load designs" },
      { status }
    );
  }
}

// POST /api/designs - Submit a new custom design request
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const { 
      title, 
      filePath, 
      description,
      quantity,
      dimensions,
      gsm,
      handleType,
      printFinish,
      urgency,
      specsJson
    } = body;

    const effectiveFilePath =
      typeof filePath === "string" && filePath.trim()
        ? filePath.trim()
        : "spec-draft-pending-artwork";

    if (
      !isValidStoragePathForUser(effectiveFilePath, user.id, user.role, {
        allowDraftSentinel: true,
      })
    ) {
      return NextResponse.json({ error: "Invalid design file path." }, { status: 400 });
    }

    const designTitle = (title && String(title).trim().slice(0, 200)) || "Custom Paper Packaging Design";
    const parsedGsm = gsm !== undefined ? Number(gsm) : 200;
    if (!Number.isFinite(parsedGsm) || parsedGsm < 30 || parsedGsm > 1500) {
      return NextResponse.json({ error: "Invalid GSM paper weight value." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: design, error } = await supabase
      .from("designs")
      .insert({
        submitted_by: user.id,
        title: designTitle,
        file_path: effectiveFilePath,
        description: description ? String(description).slice(0, 4000) : "Custom kraft packaging specification",
        quantity: quantity ? String(quantity).slice(0, 100) : "1,000 pcs",
        dimensions: dimensions ? String(dimensions).slice(0, 200) : "Medium (26cm × 32cm + 10cm)",
        gsm: parsedGsm,
        handle_type: handleType ? String(handleType).slice(0, 100) : "Twisted Kraft Cord",
        print_finish: printFinish ? String(printFinish).slice(0, 100) : "1-Color Screenprint",
        urgency: urgency ? String(urgency).slice(0, 100) : "Standard (7-10 Days)",
        specs_json: specsJson || {},
        status: "new",
      })
      .select(`
        id, submitted_by, title, file_path, description, quantity, dimensions, gsm, handle_type, print_finish, urgency, specs_json, admin_reply, quoted_price, status, linked_order_id, created_at
      `)
      .single();

    if (error) throw error;

    await notifyAdmins({
      title: "New Custom Design Submitted",
      body: `Customer ${user.full_name || user.email} submitted a new packaging design: "${designTitle}".`,
      link: `/admin/designs?id=${design.id}`,
    });

    await logAuditEvent({
      actorId: user.id,
      action: "SUBMIT_DESIGN",
      entity: "designs",
      entityId: design.id,
      metadata: { title: designTitle, filePath: effectiveFilePath },
    });

    return NextResponse.json({ success: true, design }, { status: 201 });
  } catch (err: any) {
    console.error("Submit design error:", err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status < 500 ? err.message : "Failed to submit design" },
      { status }
    );
  }
}
