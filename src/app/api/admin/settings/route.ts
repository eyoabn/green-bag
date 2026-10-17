import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/utils/roles";
import { pool } from "@/utils/db";
import { logAuditEvent } from "@/utils/audit";

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
    })
    .optional(),
  tax_id: z.string().optional(),
  settlement_days: z.number().int().min(1).max(30).optional(),
});

// GET /api/admin/settings - Read company configuration
export async function GET() {
  try {
    const res = await pool.query(`
      SELECT id, company_name, contact_phone, contact_email, address, social_links, tax_id, settlement_days, updated_at
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
      social_links: { facebook: "", instagram: "", telegram: "", linkedin: "" },
      tax_id: "ETH-TIN-2024-001",
      settlement_days: 3,
    };

    return NextResponse.json({
      success: true,
      settings: data,
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

    const { company_name, contact_phone, contact_email, address, social_links, tax_id, settlement_days } = parsed.data;

    const res = await pool.query(
      `
      INSERT INTO public.settings (id, company_name, contact_phone, contact_email, address, social_links, tax_id, settlement_days, updated_at)
      VALUES ('default', $1, $2, $3, $4, $5::jsonb, $6, $7, NOW())
      ON CONFLICT (id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        contact_phone = EXCLUDED.contact_phone,
        contact_email = EXCLUDED.contact_email,
        address = EXCLUDED.address,
        social_links = EXCLUDED.social_links,
        tax_id = COALESCE(EXCLUDED.tax_id, public.settings.tax_id),
        settlement_days = COALESCE(EXCLUDED.settlement_days, public.settings.settlement_days),
        updated_at = NOW()
      RETURNING id, company_name, contact_phone, contact_email, address, social_links, tax_id, settlement_days, updated_at;
    `,
      [
        company_name.trim(),
        contact_phone.trim(),
        contact_email.trim(),
        address.trim(),
        JSON.stringify(social_links || {}),
        tax_id?.trim() || "",
        settlement_days ?? 3,
      ]
    );

    const updated = res.rows[0];

    // Also update any 'company' row if present to maintain consistency
    await pool.query(
      `
      UPDATE public.settings
      SET company_name = $1, contact_phone = $2, contact_email = $3, address = $4, social_links = $5::jsonb, updated_at = NOW()
      WHERE id = 'company';
    `,
      [company_name.trim(), contact_phone.trim(), contact_email.trim(), address.trim(), JSON.stringify(social_links || {})]
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
