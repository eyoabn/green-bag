import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/utils/roles";
import { pool } from "@/utils/db";
import { logAuditEvent } from "@/utils/audit";

const createProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional().default(""),
  price: z.number().positive("Price must be a positive number"),
  category: z.string().min(2, "Category is required").default("Packaging"),
  stock_quantity: z.number().int().nonnegative().nullable().optional().default(500),
  is_available: z.boolean().optional().default(true),
  is_featured: z.boolean().optional().default(false),
  images: z.array(z.string()).min(1, "At least one product image is required"),
});

const updateProductSchema = z.object({
  id: z.string().uuid("Invalid product ID"),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  category: z.string().min(2).optional(),
  stock_quantity: z.number().int().nonnegative().nullable().optional(),
  is_available: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  images: z.array(z.string()).optional(),
});

// GET /api/products - Read catalog from PostgreSQL with search, category, pagination & featured filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim() || "";
    const featured = searchParams.get("featured") === "true";
    const all = searchParams.get("all") === "true"; // if true, admin sees unavailable products
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || searchParams.get("limit") || "12", 10)));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ["is_deleted IS NOT TRUE"];
    const params: any[] = [];
    let paramIdx = 1;

    // Public users only see available products unless all=true is passed
    if (!all) {
      conditions.push("is_available = true");
    }

    if (featured) {
      conditions.push("is_featured = true");
    }

    if (category && category !== "All" && category.toLowerCase() !== "all products") {
      conditions.push(`category = $${paramIdx++}`);
      params.push(category);
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR category ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query for pagination
    const countRes = await pool.query(
      `SELECT COUNT(*) as total FROM public.products ${whereClause}`,
      params
    );
    const totalCount = parseInt(countRes.rows[0]?.total || "0", 10);

    // Data query
    const dataParams = [...params, pageSize, offset];
    const dataQuery = `
      SELECT id, name, description, price, images, image_urls, category, stock_quantity, is_available, is_featured, is_client_work, created_at, updated_at
      FROM public.products
      ${whereClause}
      ORDER BY is_featured DESC, created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const productsRes = await pool.query(dataQuery, dataParams);

    const normalized = (productsRes.rows || []).map((p) => {
      const imgList = (p.images && p.images.length > 0) ? p.images : (p.image_urls || []);
      return {
        ...p,
        price: Number(p.price),
        images: imgList.length > 0 ? imgList : ["/images/photo_6_2026-09-05_00-36-03.jpg"],
        image_urls: imgList.length > 0 ? imgList : ["/images/photo_6_2026-09-05_00-36-03.jpg"],
      };
    });

    // Query distinct active categories from database
    const catRes = await pool.query(
      `SELECT DISTINCT category FROM public.products WHERE is_deleted IS NOT TRUE AND category IS NOT NULL ORDER BY category ASC`
    );
    const dbCategories = ["All", ...Array.from(new Set(catRes.rows.map((r: any) => r.category).filter(Boolean)))];

    return NextResponse.json({
      success: true,
      products: normalized,
      categories: dbCategories,
      totalCount,
      page,
      pageSize,
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

    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { name, description, price, category, stock_quantity, is_available, is_featured, images } = parsed.data;

    const res = await pool.query(
      `
      INSERT INTO public.products (
        name, description, price, category, stock_quantity, is_available, is_featured, images, image_urls, is_deleted, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, false, NOW(), NOW())
      RETURNING id, name, description, price, images, image_urls, category, stock_quantity, is_available, is_featured, created_at, updated_at;
    `,
      [
        name.trim(),
        description.trim(),
        price,
        category.trim(),
        stock_quantity,
        is_available,
        is_featured,
        images,
      ]
    );

    const product = res.rows[0];

    await logAuditEvent({
      actorId: admin.id,
      action: "CREATE_PRODUCT",
      entity: "products",
      entityId: product.id,
      metadata: { name: product.name, price: product.price, is_featured: product.is_featured },
    });

    return NextResponse.json({ success: true, product });
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

    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { id, images, ...fields } = parsed.data;

    const setClauses: string[] = ["updated_at = NOW()"];
    const values: any[] = [id];
    let paramIdx = 2;

    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) {
        setClauses.push(`${k} = $${paramIdx++}`);
        values.push(v);
      }
    }

    if (images !== undefined) {
      setClauses.push(`images = $${paramIdx}`);
      setClauses.push(`image_urls = $${paramIdx}`);
      values.push(images);
      paramIdx++;
    }

    const updateQuery = `
      UPDATE public.products
      SET ${setClauses.join(", ")}
      WHERE id = $1 AND is_deleted IS NOT TRUE
      RETURNING id, name, description, price, images, image_urls, category, stock_quantity, is_available, is_featured, created_at, updated_at;
    `;

    const res = await pool.query(updateQuery, values);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const product = res.rows[0];

    await logAuditEvent({
      actorId: admin.id,
      action: "UPDATE_PRODUCT",
      entity: "products",
      entityId: id,
      metadata: { updates: fields, hasNewImages: Boolean(images) },
    });

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update product" }, { status });
  }
}

// DELETE /api/products - Delete product (Admin only; soft-deletes if in order history)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireRole(["admin"]);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    // Check if product is referenced in order_items or orders
    const orderItemsCheck = await pool.query(
      "SELECT COUNT(*) as count FROM public.order_items WHERE product_id = $1",
      [id]
    );
    const ordersCheck = await pool.query(
      "SELECT COUNT(*) as count FROM public.orders WHERE product_id = $1",
      [id]
    ).catch(() => ({ rows: [{ count: "0" }] }));

    const linkedCount = parseInt(orderItemsCheck.rows[0]?.count || "0", 10) + parseInt(ordersCheck.rows[0]?.count || "0", 10);

    if (linkedCount > 0) {
      // Soft-delete to preserve historical orders
      await pool.query(
        "UPDATE public.products SET is_deleted = true, is_available = false, deleted_at = NOW(), updated_at = NOW() WHERE id = $1",
        [id]
      );

      await logAuditEvent({
        actorId: admin.id,
        action: "SOFT_DELETE_PRODUCT_HISTORICAL",
        entity: "products",
        entityId: id,
        metadata: { linked_orders: linkedCount, reason: "Product in existing orders" },
      });

      return NextResponse.json({
        success: true,
        softDeleted: true,
        soft_deleted: true,
        message: "Product appears in customer order history; it has been soft-deleted and hidden publicly.",
      });
    }

    // If not referenced in any order, mark soft deleted or purge
    await pool.query(
      "UPDATE public.products SET is_deleted = true, is_available = false, deleted_at = NOW(), updated_at = NOW() WHERE id = $1",
      [id]
    );

    await logAuditEvent({
      actorId: admin.id,
      action: "DELETE_PRODUCT",
      entity: "products",
      entityId: id,
      metadata: { deleted: true },
    });

    return NextResponse.json({ success: true, message: "Product deleted successfully." });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to delete product" }, { status });
  }
}
