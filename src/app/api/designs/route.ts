import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";

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
        id, submitted_by, file_path, description, quoted_price, status, created_at, updated_at,
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
    const { filePath, description } = body;

    if (!filePath) {
      return NextResponse.json({ error: "File path or design specification is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: design, error } = await supabase
      .from("designs")
      .insert({
        submitted_by: user.id,
        file_path: filePath,
        description: description || "Custom kraft packaging specification",
        status: "submitted",
      })
      .select(`
        id, submitted_by, file_path, description, quoted_price, status, created_at
      `)
      .single();

    if (error) throw error;

    await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "SUBMIT_DESIGN",
      entity: "designs",
      entity_id: design.id,
      metadata: { filePath },
    });

    return NextResponse.json({ success: true, design });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to submit design" }, { status });
  }
}
