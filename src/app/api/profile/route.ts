import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Name cannot be empty").max(100).optional(),
  phone: z.string().max(30).optional(),
  avatarUrl: z.string().url().or(z.literal("")).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        role: user.role,
        isActive: user.is_active,
      },
    });
  } catch (err: any) {
    const status = err.status || 401;
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { fullName, phone, avatarUrl } = parsed.data;
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (fullName !== undefined) updates.full_name = fullName.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("id, full_name, phone, avatar_url, role, is_active")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: updated.id,
        email: user.email,
        fullName: updated.full_name,
        phone: updated.phone,
        avatarUrl: updated.avatar_url,
        role: updated.role,
        isActive: updated.is_active,
      },
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status });
  }
}
