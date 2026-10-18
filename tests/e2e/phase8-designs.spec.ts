import { test, expect } from "@playwright/test";
import { Client } from "pg";

const directUrl =
  process.env.DIRECT_URL ||
  "postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

const TEST_USERS = {
  admin: { email: "admin@arenguade.com", password: "Password123!" },
  customerSelam: { email: "customer.selam@gmail.com", password: "Password123!" },
  customerTariku: { email: "customer.tariku@gmail.com", password: "Password123!" },
};

async function queryDb(sql: string, params: any[] = []) {
  const client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await client.query(sql, params);
  } finally {
    await client.end();
  }
}

test.describe("Phase 8: Custom Designs & Quotations", () => {
  let adminId: string;
  let selamId: string;
  let tarikuId: string;

  test.beforeAll(async () => {
    const admin = await queryDb("SELECT id FROM public.profiles WHERE email = $1", [TEST_USERS.admin.email]);
    adminId = admin.rows[0].id;
    const selam = await queryDb("SELECT id FROM public.profiles WHERE email = $1", [TEST_USERS.customerSelam.email]);
    selamId = selam.rows[0].id;
    const tariku = await queryDb("SELECT id FROM public.profiles WHERE email = $1", [TEST_USERS.customerTariku.email]);
    tarikuId = tariku.rows[0].id;
  });

  test("1. Cross-customer isolation: Customer cannot view another customer's design row or file", async ({ playwright }) => {
    // Insert a design belonging to Selam
    const fileKey = `${selamId}/sample-dieline-${Date.now()}.pdf`;
    const ins = await queryDb(
      `INSERT INTO public.designs (submitted_by, title, description, file_path, status)
       VALUES ($1, $2, $3, $4, 'new')
       RETURNING id`,
      [selamId, "Selam Luxury Rigid Box", "Custom green foil embossed packaging", fileKey]
    );
    const designId = ins.rows[0].id;

    try {
      // Login as Tariku (different customer)
      const ctxTariku = await playwright.request.newContext();
      await ctxTariku.post("/api/auth/login", { data: TEST_USERS.customerTariku });

      // 1. Tariku attempts to GET Selam's design record -> must be 403 Forbidden
      const getRes = await ctxTariku.get(`/api/designs/${designId}`);
      expect(getRes.status()).toBe(403);
      const json = await getRes.json();
      expect(json.error).toMatch(/Access denied|Forbidden/i);

      // 2. Tariku attempts to generate signed URL for Selam's private file -> must be 403
      const signedRes = await ctxTariku.get(`/api/storage/signed-url?bucket=designs&path=${encodeURIComponent(fileKey)}`);
      expect(signedRes.status()).toBe(403);
      const signedJson = await signedRes.json();
      expect(signedJson.error).toMatch(/Forbidden|Access denied/i);

      // 3. Selam can access her own design record
      const ctxSelam = await playwright.request.newContext();
      await ctxSelam.post("/api/auth/login", { data: TEST_USERS.customerSelam });
      const selamGetRes = await ctxSelam.get(`/api/designs/${designId}`);
      expect(selamGetRes.status()).toBe(200);
      const selamJson = await selamGetRes.json();
      expect(selamJson.design.title).toBe("Selam Luxury Rigid Box");

      // 4. Admin can also access Selam's design record
      const ctxAdmin = await playwright.request.newContext();
      await ctxAdmin.post("/api/auth/login", { data: TEST_USERS.admin });
      const adminGetRes = await ctxAdmin.get(`/api/designs/${designId}`);
      expect(adminGetRes.status()).toBe(200);
    } finally {
      await queryDb("DELETE FROM public.designs WHERE id = $1", [designId]);
    }
  });

  test("2. Privilege escalation block: Customer cannot set status to quoted or edit quoted price", async ({ playwright }) => {
    // Insert design for Selam
    const ins = await queryDb(
      `INSERT INTO public.designs (submitted_by, title, description, file_path, status)
       VALUES ($1, $2, $3, $4, 'new')
       RETURNING id`,
      [selamId, "Tamper Attempt Design", "Testing security barriers", `${selamId}/test.png`]
    );
    const designId = ins.rows[0].id;

    try {
      const ctxSelam = await playwright.request.newContext();
      await ctxSelam.post("/api/auth/login", { data: TEST_USERS.customerSelam });

      // Selam attempts to set quoted price to 100 ETB
      const hackPriceRes = await ctxSelam.patch(`/api/designs/${designId}`, {
        data: { quoted_price: 100 },
      });
      expect(hackPriceRes.status()).toBe(403);
      const hackPriceJson = await hackPriceRes.json();
      expect(hackPriceJson.error).toMatch(/Customers cannot set or modify quoted prices|Only administrators/i);

      // Selam attempts to set status directly to 'quoted'
      const hackStatusRes = await ctxSelam.patch(`/api/designs/${designId}`, {
        data: { status: "quoted" },
      });
      expect(hackStatusRes.status()).toBe(403);
      const hackStatusJson = await hackStatusRes.json();
      expect(hackStatusJson.error).toMatch(/Customers cannot set status to quoted|Only administrators/i);

      // Verify in DB that price and status are untouched
      const dbCheck = await queryDb("SELECT status, quoted_price FROM public.designs WHERE id = $1", [designId]);
      expect(dbCheck.rows[0].status).toBe("new");
      expect(dbCheck.rows[0].quoted_price).toBeNull();
    } finally {
      await queryDb("DELETE FROM public.designs WHERE id = $1", [designId]);
    }
  });

  test("3. Upload validation: Invalid file type and oversized files are rejected", async ({ playwright }) => {
    const ctxSelam = await playwright.request.newContext();
    await ctxSelam.post("/api/auth/login", { data: TEST_USERS.customerSelam });

    // 1. Invalid file type (.exe / application/x-msdownload)
    const badFileBuffer = Buffer.from("MZ malicious executable content");
    const badTypeRes = await ctxSelam.post("/api/upload", {
      multipart: {
        bucket: "designs",
        file: {
          name: "malware.exe",
          mimeType: "application/x-msdownload",
          buffer: badFileBuffer,
        },
      },
    });
    expect(badTypeRes.status()).toBe(400);
    const badTypeJson = await badTypeRes.json();
    expect(badTypeJson.error).toMatch(/Invalid file format|Allowed formats: JPG/i);

    // 2. Oversized file (> 5 MB, e.g. 5.5 MB)
    const hugeBuffer = Buffer.alloc(5.5 * 1024 * 1024, "a");
    const hugeRes = await ctxSelam.post("/api/upload", {
      multipart: {
        bucket: "designs",
        file: {
          name: "huge_dieline.pdf",
          mimeType: "application/pdf",
          buffer: hugeBuffer,
        },
      },
    });
    expect(hugeRes.status()).toBe(400);
    const hugeJson = await hugeRes.json();
    expect(hugeJson.error).toMatch(/exceeds maximum allowed size of 5 MB/i);
  });

  test("4. Full Lifecycle Flow: Submit -> Admin Quotes -> Customer Accepts -> Order Created -> Payment Flow", async ({ playwright }) => {
    let createdDesignId: string | null = null;
    let createdOrderId: string | null = null;

    try {
      // STEP 1: Customer Selam uploads a valid design file & submits
      const ctxSelam = await playwright.request.newContext();
      await ctxSelam.post("/api/auth/login", { data: TEST_USERS.customerSelam });

      const samplePdf = Buffer.from("%PDF-1.4 sample vector packaging dieline");
      const uploadRes = await ctxSelam.post("/api/upload", {
        multipart: {
          bucket: "designs",
          file: {
            name: "coffee_pouch_dieline.pdf",
            mimeType: "application/pdf",
            buffer: samplePdf,
          },
        },
      });
      expect(uploadRes.status()).toBe(200);
      const uploadJson = await uploadRes.json();
      const filePath = uploadJson.filePath;
      expect(filePath).toContain(selamId);

      // Selam posts to /api/designs
      const title = `Specialty Yirgacheffe Standup Pouch ${Date.now()}`;
      const submitRes = await ctxSelam.post("/api/designs", {
        data: {
          title,
          description: "Matte finish with gold foil logo, zipper top, 250g capacity",
          filePath,
        },
      });
      expect(submitRes.status()).toBe(201);
      const submitJson = await submitRes.json();
      createdDesignId = submitJson.design.id;
      expect(submitJson.design.status).toBe("new");

      // Verify admin was notified
      const adminNotifs = await queryDb(
        `SELECT * FROM public.notifications WHERE user_id = $1 AND (title ILIKE '%Design Submitted%' OR title ILIKE '%Design Submission%') ORDER BY created_at DESC LIMIT 1`,
        [adminId]
      );
      expect(adminNotifs.rows.length).toBeGreaterThan(0);
      expect(adminNotifs.rows[0].body).toContain(title);

      // STEP 2: Admin reviews and quotes the design
      const ctxAdmin = await playwright.request.newContext();
      await ctxAdmin.post("/api/auth/login", { data: TEST_USERS.admin });

      // Admin sets status to reviewing first
      const reviewRes = await ctxAdmin.patch(`/api/designs/${createdDesignId}`, {
        data: {
          status: "reviewing",
          admin_reply: "Dielines received. Reviewing cylinder setup and minimum run sizes.",
        },
      });
      expect(reviewRes.status()).toBe(200);

      // Admin quotes price of 18,500 ETB
      const quoteRes = await ctxAdmin.patch(`/api/designs/${createdDesignId}`, {
        data: {
          status: "quoted",
          quoted_price: 18500,
          admin_reply: "Approved for production. Unit run minimum 1,000 pouches at 18.50 ETB each. Total 18,500 ETB.",
        },
      });
      expect(quoteRes.status()).toBe(200);
      const quoteJson = await quoteRes.json();
      expect(quoteJson.design.status).toBe("quoted");
      expect(Number(quoteJson.design.quoted_price)).toBe(18500);

      // Verify customer Selam was notified of the quote
      const customerNotifs = await queryDb(
        `SELECT * FROM public.notifications WHERE user_id = $1 AND title ILIKE '%Design%Update%' ORDER BY created_at DESC LIMIT 1`,
        [selamId]
      );
      expect(customerNotifs.rows.length).toBeGreaterThan(0);
      expect(customerNotifs.rows[0].body).toContain("18500");

      // STEP 3: Customer Selam reviews the quote and Accepts
      const acceptRes = await ctxSelam.patch(`/api/designs/${createdDesignId}`, {
        data: {
          action: "accept",
        },
      });
      expect(acceptRes.status()).toBe(200);
      const acceptJson = await acceptRes.json();
      expect(acceptJson.design.status).toBe("accepted");

      // Verify admin was notified of the acceptance
      const acceptAdminNotifs = await queryDb(
        `SELECT * FROM public.notifications WHERE user_id = $1 AND title ILIKE '%Design Quote Accepted%' ORDER BY created_at DESC LIMIT 1`,
        [adminId]
      );
      expect(acceptAdminNotifs.rows.length).toBeGreaterThan(0);

      // STEP 4: Admin creates order from design
      const createOrderRes = await ctxAdmin.patch(`/api/designs/${createdDesignId}`, {
        data: {
          action: "create_order",
        },
      });
      const createOrderJson = await createOrderRes.json();
      if (createOrderRes.status() !== 200) {
        console.error("Create order failed with error:", createOrderJson);
      }
      expect(createOrderRes.status()).toBe(200);
      expect(createOrderJson.order).toBeDefined();
      createdOrderId = createOrderJson.order.id;
      expect(Number(createOrderJson.order.total_price)).toBe(18500);
      expect(createOrderJson.order.status).toBe("pending_payment");
      expect(createOrderJson.order.buyer_id).toBe(selamId);

      // Verify design is linked to the new order
      const updatedDesign = await queryDb("SELECT linked_order_id, status FROM public.designs WHERE id = $1", [createdDesignId]);
      expect(updatedDesign.rows[0].linked_order_id).toBe(createdOrderId);

      // Verify order references design and quoted price
      const orderDb = await queryDb("SELECT notes FROM public.orders WHERE id = $1", [createdOrderId]);
      expect(orderDb.rows[0].notes).toContain("Custom Design Order");

      const orderItems = await queryDb("SELECT * FROM public.order_items WHERE order_id = $1", [createdOrderId]);
      expect(orderItems.rows.length).toBeGreaterThan(0);
      expect(Number(orderItems.rows[0].unit_price_snapshot)).toBe(18500);

      // STEP 5: Customer sees order at /dashboard/orders/[id] and is ready for Phase 5 payment proof upload
      const orderDetailRes = await ctxSelam.get(`/api/orders/${createdOrderId}`);
      expect(orderDetailRes.status()).toBe(200);
      const orderDetailJson = await orderDetailRes.json();
      expect(orderDetailJson.order.order_number).toBeDefined();
      expect(Number(orderDetailJson.order.total_price)).toBe(18500);
      expect(orderDetailJson.order.status).toBe("pending_payment");
    } finally {
      if (createdOrderId) {
        await queryDb("DELETE FROM public.order_items WHERE order_id = $1", [createdOrderId]);
        await queryDb("DELETE FROM public.order_status_history WHERE order_id = $1", [createdOrderId]);
        await queryDb("DELETE FROM public.orders WHERE id = $1", [createdOrderId]);
      }
      if (createdDesignId) {
        await queryDb("DELETE FROM public.designs WHERE id = $1", [createdDesignId]);
      }
    }
  });

  test("5. UI Verification: Customer /dashboard/designs and Admin /admin/designs", async ({ page, playwright }) => {
    // Clean up any stale records from previous aborted runs
    await queryDb("DELETE FROM public.designs WHERE title ILIKE '%UI Verification Kraft Box%'");

    // Upload a real sample dieline asset so signed URL generation succeeds
    const ctxUpload = await playwright.request.newContext();
    await ctxUpload.post("/api/auth/login", { data: TEST_USERS.customerSelam });
    const samplePdf = Buffer.from("%PDF-1.4 test dieline preview document");
    const uploadRes = await ctxUpload.post("/api/upload", {
      multipart: {
        bucket: "designs",
        file: {
          name: "dieline.pdf",
          mimeType: "application/pdf",
          buffer: samplePdf,
        },
      },
    });
    const uploadJson = await uploadRes.json();
    const realFilePath = uploadJson.filePath;

    // Insert a design in 'quoted' state for Selam
    const ins = await queryDb(
      `INSERT INTO public.designs (submitted_by, title, description, file_path, status, quoted_price, admin_reply)
       VALUES ($1, $2, $3, $4, 'quoted', 12000, 'All dieline specs verified. Ready for run.')
       RETURNING id`,
      [selamId, "UI Verification Kraft Box", "Recycled corrugated mailing box", realFilePath]
    );
    const designId = ins.rows[0].id;

    try {
      // 1. Test Customer Dashboard Designs Page (clear any existing session first)
      await page.context().clearCookies();
      await page.goto("/login");
      await page.fill('input[type="email"]', TEST_USERS.customerSelam.email);
      await page.fill('input[type="password"]', TEST_USERS.customerSelam.password);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes("/login"));

      await page.goto("/dashboard/designs");
      await expect(page.locator("text=UI Verification Kraft Box").first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator("span", { hasText: "12,000 ETB" }).first()).toBeVisible();
      await expect(page.locator("text=All dieline specs verified")).toBeVisible();
      // Check that Accept and Decline buttons are available
      const acceptBtn = page.locator('button:has-text("Accept Quote")').first();
      const declineBtn = page.locator('button:has-text("Decline")').first();
      await expect(acceptBtn).toBeVisible();
      await expect(declineBtn).toBeVisible();

      // 2. Test Admin Designs Page (clear customer cookies first)
      await page.context().clearCookies();
      await page.goto("/login");
      await page.fill('input[type="email"]', TEST_USERS.admin.email);
      await page.fill('input[type="password"]', TEST_USERS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => !url.pathname.includes("/login"));

      await page.goto("/admin/designs");
      await expect(page.locator("text=Customer Design Submissions")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("text=UI Verification Kraft Box").first()).toBeVisible();

      // Toggle inline file preview
      const toggleFileBtn = page.locator('button:has-text("Show File Inline")').first();
      if (await toggleFileBtn.isVisible()) {
        await toggleFileBtn.click();
        await expect(page.locator("text=Preflight Dieline File Preview")).toBeVisible({ timeout: 5000 });
      }

      // Verify quoted price input is populated
      const priceInput = page.locator('input[placeholder="e.g. 45000"]').first();
      await expect(priceInput).toHaveValue("12000");

      // Verify admin reply textarea
      const replyArea = page.locator("textarea").first();
      await expect(replyArea).toHaveValue("All dieline specs verified. Ready for run.");
    } finally {
      await queryDb("DELETE FROM public.designs WHERE id = $1", [designId]);
    }
  });
});
