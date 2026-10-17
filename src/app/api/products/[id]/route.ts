import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/products/[id] - Fetch single product by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, description, price, images, image_urls, category, stock_quantity, is_available, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const imgList = (product.images && product.images.length > 0) ? product.images : (product.image_urls || []);
    const normalized = {
      ...product,
      images: imgList.length > 0 ? imgList : ["/images/photo_6_2026-09-05_00-36-03.jpg"],
    };

    return NextResponse.json({ success: true, product: normalized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch product" }, { status: 500 });
  }
}
