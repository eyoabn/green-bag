import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/utils/db";

// GET /api/products/[id] - Fetch single product by id from PostgreSQL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const res = await pool.query(
      `
      SELECT id, name, description, price, images, image_urls, category, stock_quantity, is_available, is_featured, created_at, updated_at
      FROM public.products
      WHERE id = $1 AND is_deleted IS NOT TRUE
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
    return NextResponse.json({ error: err.message || "Failed to fetch product" }, { status: 500 });
  }
}
