import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";

// GET /api/admin/settings - Read company configuration (used by footer/contact/landing and admin)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("settings")
      .select("id, company_name, contact_phone, contact_email, address, updated_at")
      .eq("id", "default")
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      settings: data || {
        id: "default",
        company_name: "Ethiopia Arenguade Paper Product",
        contact_phone: "+251 911 223 344",
        contact_email: "info@arenguadepaper.com",
        address: "Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load settings" }, { status: 500 });
  }
}

// PATCH /api/admin/settings - Update company settings
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const body = await request.json().catch(() => ({}));
    const { company_name, contact_phone, contact_email, address } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (company_name) updates.company_name = String(company_name).trim();
    if (contact_phone) updates.contact_phone = String(contact_phone).trim();
    if (contact_email) updates.contact_email = String(contact_email).trim();
    if (address) updates.address = String(address).trim();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("settings")
      .upsert({
        id: "default",
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;

    // Log to audit_log
    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "UPDATE_FACTORY_SETTINGS",
      entity: "settings",
      entity_id: "default",
      metadata: updates,
    });

    return NextResponse.json({ success: true, settings: data });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status });
  }
}
