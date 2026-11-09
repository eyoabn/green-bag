import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { pool } from "@/utils/db";
import { DEFAULT_DESIGN_PRICING } from "@/utils/designPricing";

// GET /api/settings - Public settings reader for Footer, Contact, site-wide branding & Design Studio pricing
export async function GET() {
  const defaultSettings = {
    id: "default",
    company_name: "Ethiopia Arenguade Paper Product",
    contact_phone: "+251 911 223 344",
    contact_email: "info@arenguadepaper.com",
    address: "Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia",
    social_links: { facebook: "", instagram: "", telegram: "", linkedin: "" },
    tax_id: "",
    settlement_days: 3,
    homepage_content: {},
  };

  try {
    const supabase = await createClient();
    const { data: dbSettings } = await supabase
      .from("settings")
      .select("id, company_name, contact_phone, contact_email, address, social_links, tax_id, settlement_days, homepage_content, updated_at")
      .in("id", ["default", "company"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let settings = dbSettings;

    if (!settings) {
      try {
        const res = await pool.query(`
          SELECT id, company_name, contact_phone, contact_email, address, social_links, tax_id, settlement_days, homepage_content, updated_at
          FROM public.settings
          WHERE id = 'default' OR id = 'company'
          ORDER BY updated_at DESC
          LIMIT 1
        `);
        settings = res.rows[0];
      } catch {
        // Fallback to default
      }
    }

    const finalSettings = settings || defaultSettings;
    const homepageContent = (finalSettings as any).homepage_content || {};
    const designPricing = homepageContent.design_pricing || DEFAULT_DESIGN_PRICING;

    return NextResponse.json(
      {
        success: true,
        settings: {
          ...finalSettings,
          design_pricing: designPricing,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (_err: any) {
    return NextResponse.json({
      success: true,
      settings: {
        ...defaultSettings,
        design_pricing: DEFAULT_DESIGN_PRICING,
      },
    });
  }
}
