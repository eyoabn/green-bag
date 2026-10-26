import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/utils/roles";
import { pool } from "@/utils/db";
import { logAuditEvent } from "@/utils/audit";
import { DEFAULT_DESIGN_PRICING } from "@/utils/designPricing";

const settingsSchema = z.object({
  company_name: z.string().min(2, "Company name must be at least 2 characters"),
  contact_phone: z.string().min(5, "Contact phone is required"),
  contact_email: z.string().email("A valid contact email is required"),
  address: z.string().min(5, "Physical address is required"),
  social_links: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      telegram: z.string().optional(),
      linkedin: z.string().optional(),
      tiktok: z.string().optional(),
      youtube: z.string().optional(),
    })
    .optional(),
  tax_id: z.string().optional(),
  settlement_days: z.number().int().min(1).max(30).optional(),
  homepage_content: z.record(z.string(), z.any()).optional(),
  design_pricing: z.record(z.string(), z.any()).optional(),
});

// GET /api/admin/settings - Read company configuration
export async function GET() {
  try {
    const res = await pool.query(`
      SELECT id, company_name, contact_phone, contact_email, address, social_links, tax_id, settlement_days, homepage_content, updated_at
      FROM public.settings
      WHERE id = 'default' OR id = 'company'
      ORDER BY updated_at DESC
      LIMIT 1
    `);

    const data = res.rows[0] || {
      id: "default",
      company_name: "Ethiopia Arenguade Paper Product",
      contact_phone: "+251 911 223 344",
      contact_email: "info@arenguadepaper.com",
      address: "Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia",
      social_links: { 
        facebook: "", 
        instagram: "", 
        telegram: "https://t.me/arenguadepaper", 
        linkedin: "",
        tiktok: "https://www.tiktok.com/@arenguadepaper",
        youtube: "https://www.youtube.com/@arenguadepaper"
      },
      tax_id: "ETH-TIN-2024-001",
      settlement_days: 3,
      homepage_content: {},
    };

    const content = data.homepage_content || {};
    const designPricing = content.design_pricing || DEFAULT_DESIGN_PRICING;

    return NextResponse.json({
      success: true,
      settings: {
        ...data,
        design_pricing: designPricing,
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

    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { company_name, contact_phone, contact_email, address, social_links, tax_id, settlement_days, homepage_content, design_pricing } = parsed.data;

    const mergedContent = {
      ...(homepage_content || {}),
      ...(design_pricing ? { design_pricing } : {}),
    };

    const res = await pool.query(
      `
      INSERT INTO public.settings (id, company_name, contact_phone, contact_email, address, social_links, tax_id, settlement_days, homepage_content, updated_at)
      VALUES ('default', $1, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        contact_phone = EXCLUDED.contact_phone,
        contact_email = EXCLUDED.contact_email,
        address = EXCLUDED.address,
        social_links = EXCLUDED.social_links,
        tax_id = COALESCE(EXCLUDED.tax_id, public.settings.tax_id),
        settlement_days = COALESCE(EXCLUDED.settlement_days, public.settings.settlement_days),
        homepage_content = COALESCE(EXCLUDED.homepage_content, public.settings.homepage_content),
        updated_at = NOW()
      RETURNING id, company_name, contact_phone, contact_email, address, social_links, tax_id, settlement_days, homepage_content, updated_at;
    `,
      [
        company_name.trim(),
        contact_phone.trim(),
        contact_email.trim(),
        address.trim(),
        JSON.stringify(social_links || {}),
        tax_id?.trim() || "",
        settlement_days ?? 3,
        JSON.stringify(mergedContent),
      ]
    );

    const updated = res.rows[0];

    // Also update any 'company' row if present to maintain consistency
    await pool.query(
      `
      UPDATE public.settings
      SET company_name = $1, contact_phone = $2, contact_email = $3, address = $4, social_links = $5::jsonb, homepage_content = $6::jsonb, updated_at = NOW()
      WHERE id = 'company';
    `,
      [
        company_name.trim(), 
        contact_phone.trim(), 
        contact_email.trim(), 
        address.trim(), 
        JSON.stringify(social_links || {}),
        JSON.stringify(mergedContent)
      ]
    );

    // Central audit log event
    await logAuditEvent({
      actorId: admin.id,
      action: "UPDATE_FACTORY_SETTINGS",
      entity: "settings",
      entityId: "default",
      metadata: {
        company_name,
        contact_phone,
        contact_email,
        address,
        social_links,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status });
  }
}
