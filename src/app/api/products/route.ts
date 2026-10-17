import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";

// GET /api/products - Read catalog from PostgreSQL
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const all = searchParams.get("all") === "true"; // if true, admin can see unavailable products
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : null;

    let query = supabase
      .from("products")
      .select("id, name, description, price, images, image_urls, category, stock_quantity, is_available, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (!all) {
      query = query.eq("is_available", true);
    }

    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    if (search && search.trim()) {
      const s = search.trim();
      query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%,category.ilike.%${s}%`);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data: products, error } = await query;
    if (error) throw error;

    // Normalize images array
    const normalized = (products || []).map((p) => {
      const imgList = (p.images && p.images.length > 0) ? p.images : (p.image_urls || []);
      return {
        ...p,
        images: imgList.length > 0 ? imgList : ["/images/photo_6_2026-09-05_00-36-03.jpg"],
      };
    });

    return NextResponse.json({
      success: true,
      products: normalized,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/products - Create product (Admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const body = await request.json().catch(() => ({}));
    const { name, description, price, images, category = "Packaging", stock_quantity = 500, is_available = true } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required." }, { status: 400 });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ error: "Price must be a valid positive number." }, { status: 400 });
    }

    const imgArray = Array.isArray(images) && images.length > 0
      ? images
      : ["/images/photo_6_2026-09-05_00-36-03.jpg"];

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: String(name).trim(),
        description: description ? String(description).trim() : "",
        price: numPrice,
        images: imgArray,
        image_urls: imgArray,
        category: String(category).trim(),
        stock_quantity: stock_quantity !== null ? Number(stock_quantity) : null,
        is_available: Boolean(is_available),
      })
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "CREATE_PRODUCT",
      entity: "products",
      entity_id: data.id,
      metadata: { name: data.name, price: data.price },
    });

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to create product" }, { status });
  }
}

// PATCH /api/products - Update product (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const body = await request.json().catch(() => ({}));
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const supabase = await createClient();

    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) payload.name = String(updates.name).trim();
    if (updates.description !== undefined) payload.description = String(updates.description).trim();
    if (updates.category !== undefined) payload.category = String(updates.category).trim();
    if (updates.price !== undefined) payload.price = Number(updates.price);
    if (updates.stock_quantity !== undefined) payload.stock_quantity = updates.stock_quantity === null ? null : Number(updates.stock_quantity);
    if (updates.is_available !== undefined) payload.is_available = Boolean(updates.is_available);
    if (updates.images !== undefined && Array.isArray(updates.images)) {
      payload.images = updates.images;
      payload.image_urls = updates.images;
    }

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "UPDATE_PRODUCT",
      entity: "products",
      entity_id: id,
      metadata: payload,
    });

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update product" }, { status });
  }
}

// DELETE /api/products - Delete product (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if product is in any order items
    const { count } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("product_id", id);

    if (count && count > 0) {
      // Soft disable availability to maintain historical orders
      await supabase
        .from("products")
        .update({ is_available: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      await supabase.from("audit_log").insert({
        actor_id: admin.id,
        action: "DEACTIVATE_PRODUCT_HISTORICAL",
        entity: "products",
        entity_id: id,
        metadata: { reason: "Product in existing orders", order_items_count: count },
      });

      return NextResponse.json({
        success: true,
        deactivated: true,
        message: "Product is referenced in order history; availability has been toggled to false.",
      });
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;

    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "DELETE_PRODUCT",
      entity: "products",
      entity_id: id,
      metadata: { deleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to delete product" }, { status });
  }
}
