import { NextResponse } from "next/server";
import { pool } from "@/utils/db";
import { DEFAULT_DESIGN_PRICING } from "@/utils/designPricing";

// GET /api/settings - Public settings reader for Footer, Contact, site-wide branding & Design Studio pricing
export async function GET() {
  try {
    const res = await pool.query(`
      SELECT id, company_name, contact_phone, contact_email, address, social_links, tax_id, settlement_days, homepage_content, updated_at
      FROM public.settings
      WHERE id = 'default' OR id = 'company'
      ORDER BY updated_at DESC
      LIMIT 1
    `);

    const settings = res.rows[0] || {
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

    const homepageContent = settings.homepage_content || {};
    const designPricing = homepageContent.design_pricing || DEFAULT_DESIGN_PRICING;

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        design_pricing: designPricing,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load public settings" }, { status: 500 });
  }
}
