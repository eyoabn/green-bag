import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";

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
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to load designs" }, { status });
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

    const effectiveFilePath = filePath || "spec-draft-pending-artwork";
    const designTitle = (title && String(title).trim()) || "Custom Paper Packaging Design";

    const supabase = await createClient();
    const { data: design, error } = await supabase
      .from("designs")
      .insert({
        submitted_by: user.id,
        title: designTitle,
        file_path: effectiveFilePath,
        description: description || "Custom kraft packaging specification",
        quantity: quantity || "1,000 pcs",
        dimensions: dimensions || "Medium (26cm × 32cm + 10cm)",
        gsm: gsm ? Number(gsm) : 200,
        handle_type: handleType || "Twisted Kraft Cord",
        print_finish: printFinish || "1-Color Screenprint",
        urgency: urgency || "Standard (7-10 Days)",
        specs_json: specsJson || {},
        status: "new",
      })
      .select(`
        id, submitted_by, title, file_path, description, quantity, dimensions, gsm, handle_type, print_finish, urgency, specs_json, admin_reply, quoted_price, status, linked_order_id, created_at
      `)
      .single();

    if (error) throw error;

    // Notify all admin users
    const { rows: admins } = await pool.query(
      "SELECT id FROM public.profiles WHERE role = 'admin'"
    );

    for (const adm of admins) {
      await pool.query(
        `INSERT INTO public.notifications (user_id, title, body, link)
         VALUES ($1, $2, $3, $4)`,
        [
          adm.id,
          "New Custom Design Submitted",
          `Customer ${user.full_name || user.email} submitted a new packaging design: "${designTitle}".`,
          `/admin/designs?id=${design.id}`,
        ]
      );
    }

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "SUBMIT_DESIGN",
      entity: "designs",
      entity_id: design.id,
      metadata: { title: designTitle, filePath },
    });

    return NextResponse.json({ success: true, design }, { status: 201 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to submit design" }, { status });
  }
}
