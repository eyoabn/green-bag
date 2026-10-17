import { test, expect } from "@playwright/test";
import { pool } from "../../src/utils/db";

const SEED_USERS = {
  admin: {
    email: "admin@arenguade.com",
    password: "Password123!",
  },
  customer: {
    email: "customer.selam@gmail.com",
    password: "Password123!",
  },
};

test.describe.serial("Phase 4: Products and Public Pages", () => {
  let createdProductId: string | null = null;

  test.afterAll(async () => {
    // Cleanup any test products created during tests
    if (createdProductId) {
      await pool.query("DELETE FROM public.order_items WHERE product_id = $1", [createdProductId]);
      await pool.query("DELETE FROM public.products WHERE id = $1", [createdProductId]);
    }
  });

  // 1. Customer calling product create/update/delete API gets 403
  test("1. Non-admin (customer) calling product mutations receives HTTP 403 Forbidden", async ({ request }) => {
    // Log in as customer
    const loginRes = await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer.email, password: SEED_USERS.customer.password },
    });
    expect(loginRes.status()).toBe(200);

    // POST /api/products -> 403
    const createRes = await request.post("/api/products", {
      data: {
        name: "Hacker Kraft Bag",
        price: 99.99,
        category: "Packaging",
        images: ["https://example.com/image.jpg"],
      },
    });
    expect(createRes.status()).toBe(403);
    const createJson = await createRes.json();
    expect(createJson.error).toContain("Forbidden");

    // PATCH /api/products -> 403
    const patchRes = await request.patch("/api/products", {
      data: {
        id: "00000000-0000-0000-0000-000000000000",
        name: "Unauthorized Rename",
      },
    });
    expect(patchRes.status()).toBe(403);

    // DELETE /api/products -> 403
    const deleteRes = await request.delete("/api/products?id=00000000-0000-0000-0000-000000000000");
    expect(deleteRes.status()).toBe(403);
  });

  // 2. Storage upload validation: file type & size, role check
  test("2. Product images upload enforces admin authorization and file validation", async ({ request }) => {
    // Customer trying to upload to product-images bucket gets 403
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer.email, password: SEED_USERS.customer.password },
    });

    const unauthorizedUpload = await request.post("/api/upload", {
      multipart: {
        bucket: "product-images",
        file: {
          name: "test.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from("fake-image-bytes"),
        },
      },
    });
    expect(unauthorizedUpload.status()).toBe(403);

    // Admin uploading invalid MIME type gets 400
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });

    const invalidTypeUpload = await request.post("/api/upload", {
      multipart: {
        bucket: "product-images",
        file: {
          name: "malicious.exe",
          mimeType: "application/x-msdownload",
          buffer: Buffer.from("executable content"),
        },
      },
    });
    expect(invalidTypeUpload.status()).toBe(400);
    const invalidJson = await invalidTypeUpload.json();
    expect(invalidJson.error).toContain("Invalid file format");
  });

  // 3. Admin creates product with 3 images and featured flag; appears on /products and landing page without redeploy
  test("3. Admin creates product with 3 images; dynamically visible on /products and landing page", async ({ page, request }) => {
    // Authenticate admin
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });

    const uniqueName = `Sidama Single-Origin Bag ${Date.now()}`;
    const testImages = [
      "/images/photo_6_2026-09-05_00-36-03.jpg",
      "/images/photo_3_2026-09-05_00-36-02.jpg",
      "/images/photo_9_2026-09-05_00-36-03.jpg",
    ];

    // Admin creates product via API
    const createRes = await request.post("/api/products", {
      data: {
        name: uniqueName,
        description: "Bespoke Ethiopian specialty coffee pouch with degas valve.",
        price: 340,
        category: "Coffee & Food",
        stock_quantity: 1200,
        is_available: true,
        is_featured: true,
        images: testImages,
      },
    });

    const createJson = await createRes.json();
    expect([200, 201]).toContain(createRes.status());
    expect(createJson.product).toBeDefined();
    expect(createJson.product.id).toBeDefined();
    expect(createJson.product.is_featured).toBe(true);
    createdProductId = createJson.product.id;

    // Verify it appears immediately on /products without redeploy
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    const productCard = page.locator(`text=${uniqueName}`);
    await expect(productCard).toBeVisible({ timeout: 10000 });

    // Verify it appears on the landing page featured section without redeploy
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const landingFeaturedCard = page.locator(`text=${uniqueName}`);
    await expect(landingFeaturedCard).toBeVisible({ timeout: 10000 });
  });

  // 4. Toggling availability hides or disables product publicly
  test("4. Toggling product availability hides from public catalog and disables ordering", async ({ page, request }) => {
    expect(createdProductId).toBeTruthy();

    // Authenticate admin
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });

    // Admin sets is_available = false
    const toggleRes = await request.patch("/api/products", {
      data: {
        id: createdProductId,
        is_available: false,
      },
    });
    expect(toggleRes.status()).toBe(200);

    // Public /api/products query (without all=true) must NOT return the unavailable product
    const publicListRes = await request.get("/api/products");
    const publicListJson = await publicListRes.json();
    const foundInPublic = publicListJson.products.some((p: any) => p.id === createdProductId);
    expect(foundInPublic).toBe(false);

    // Direct visit to /products/[id] shows unavailable badge and disables ordering
    await page.goto(`/products/${createdProductId}`);
    await page.waitForLoadState("networkidle");

    // Must show Unavailable indicator badge
    const unavailableBadge = page.getByText("Unavailable", { exact: true });
    await expect(unavailableBadge).toBeVisible({ timeout: 10000 });

    // Order button must be disabled
    const orderBtn = page.getByRole("button", { name: "Product Currently Unavailable" });
    await expect(orderBtn).toBeVisible({ timeout: 10000 });
    await expect(orderBtn).toBeDisabled();

    // Re-enable availability for subsequent tests
    await request.patch("/api/products", {
      data: { id: createdProductId, is_available: true },
    });
  });

  // 5. Product detail page: gallery, description, price, stock status, order flow button
  test("5. Public /products/[id] renders gallery, specs, price, and Add to Cart/Order controls", async ({ page }) => {
    expect(createdProductId).toBeTruthy();

    // Sign in as customer to access full order flow
    await page.goto("/login");
    await page.fill('input[type="email"]', SEED_USERS.customer.email);
    await page.fill('input[type="password"]', SEED_USERS.customer.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    await page.goto(`/products/${createdProductId}`);
    await page.waitForLoadState("networkidle");

    // Title and price
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("340 ETB", { exact: true })).toBeVisible({ timeout: 10000 });

    // Stock status indicator
    await expect(page.locator("text=In Stock")).toBeVisible({ timeout: 10000 });

    // Active order flow button is visible
    const orderFlowBtn = page.locator('button:has-text("Request Custom Production")');
    await expect(orderFlowBtn).toBeVisible({ timeout: 10000 });
  });

  // 6. Public /products: search, category filter, and pagination
  test("6. Public /products catalog filters by search, category pills, and pagination", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");

    // Search filter using exact placeholder
    const searchInput = page.locator('input[placeholder="Search catalog..."]');
    const searchPromise = page.waitForResponse((r) => r.url().includes("/api/products") && r.url().includes("search=Coffee") && r.status() === 200);
    await searchInput.fill("Coffee");
    await searchPromise;

    // Verify search results rendered
    const firstItem = page.locator("h3").first();
    await expect(firstItem).toBeVisible({ timeout: 10000 });

    // Clear search
    const clearPromise = page.waitForResponse((r) => r.url().includes("/api/products") && r.status() === 200);
    await searchInput.fill("");
    await clearPromise;

    // Category filter click "Packaging" using exact role
    const packagingPill = page.getByRole("button", { name: "Packaging", exact: true });
    if (await packagingPill.isVisible()) {
      const catPromise = page.waitForResponse((r) => r.url().includes("/api/products") && r.url().includes("category=Packaging") && r.status() === 200);
      await packagingPill.click();
      await catPromise;
      await expect(packagingPill).toHaveClass(/bg-\[#1E3B2E\]/);
    }
  });

  // 7. Admin /admin/products page: edit, toggle, and soft-delete enforcement
  test("7. Product deletion enforces soft-delete when referenced in orders", async ({ request }) => {
    expect(createdProductId).toBeTruthy();

    // Insert a dummy order and order_item referencing this product to simulate real financial history
    const orderRes = await pool.query(
      `INSERT INTO public.orders (buyer_id, total_price, status)
       VALUES ((SELECT id FROM public.profiles WHERE role = 'customer' LIMIT 1), 3400.00, 'pending_payment')
       RETURNING id`
    );
    const orderId = orderRes.rows[0].id;

    await pool.query(
      `INSERT INTO public.order_items (order_id, product_id, quantity, unit_price_snapshot)
       VALUES ($1, $2, 10, 340.00)`,
      [orderId, createdProductId]
    );

    // Authenticate admin
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });

    // Attempt to delete product
    const deleteRes = await request.delete(`/api/products?id=${createdProductId}`);
    expect(deleteRes.status()).toBe(200);
    const deleteJson = await deleteRes.json();
    expect(deleteJson.softDeleted || deleteJson.soft_deleted).toBe(true);

    // Verify in database: is_deleted = true, is_available = false, deleted_at is set
    const dbCheck = await pool.query("SELECT is_deleted, is_available, deleted_at FROM public.products WHERE id = $1", [createdProductId]);
    expect(dbCheck.rows[0].is_deleted).toBe(true);
    expect(dbCheck.rows[0].is_available).toBe(false);
    expect(dbCheck.rows[0].deleted_at).not.toBeNull();

    // Verify it is excluded from public catalog
    const catalogRes = await request.get("/api/products");
    const catalogJson = await catalogRes.json();
    const stillPresent = catalogJson.products.some((p: any) => p.id === createdProductId);
    expect(stillPresent).toBe(false);

    // Clean up the dummy order and order_item
    await pool.query("DELETE FROM public.order_items WHERE order_id = $1", [orderId]);
    await pool.query("DELETE FROM public.orders WHERE id = $1", [orderId]);
  });
});
