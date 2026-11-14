import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { isValidUUID } from "@/utils/validation";

async function isAdminViewer(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const profRes = await pool.query(
      "SELECT role, is_active FROM public.profiles WHERE id = $1 LIMIT 1",
      [user.id]
    );
    const prof = profRes.rows[0];
    return Boolean(prof && prof.is_active !== false && prof.role === "admin");
  } catch {
    return false;
  }
}

// GET /api/products/[id] - Fetch single product by id from PostgreSQL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid product ID format." }, { status: 400 });
    }

    const admin = await isAdminViewer();

    const res = await pool.query(
      `
      SELECT id, name, description, price, images, image_urls, category, stock_quantity, is_available, is_featured, is_client_work, created_at, updated_at
      FROM public.products
      WHERE id = $1 AND is_deleted IS NOT TRUE ${admin ? "" : "AND is_available = true"}
      LIMIT 1
    `,
      [id]
    );

    const product = res.rows[0];

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const imgList = (product.images && product.images.length > 0) ? product.images : (product.image_urls || []);
    const normalized = {
      ...product,
      price: Number(product.price),
      images: imgList.length > 0 ? imgList : ["/images/photo_6_2026-09-05_00-36-03.jpg"],
      image_urls: imgList.length > 0 ? imgList : ["/images/photo_6_2026-09-05_00-36-03.jpg"],
    };

    return NextResponse.json({ success: true, product: normalized });
  } catch (err: any) {
    console.error("Fetch product error:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
