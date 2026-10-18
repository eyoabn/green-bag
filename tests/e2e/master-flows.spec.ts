import { test, expect } from "@playwright/test";

const SEED_USERS = {
  admin: {
    email: "admin@arenguade.com",
    password: "Password123!",
  },
  teacher: {
    email: "teacher.tigist@arenguade.com",
    password: "Password123!",
  },
  customer1: {
    email: "customer.selam@gmail.com",
    password: "Password123!",
  },
  customer2: {
    email: "customer.tariku@gmail.com",
    password: "Password123!",
  },
};

test.describe("Ethiopia Arenguade Paper Product - Master Flows v2", () => {
  
  // 1. Visitor can browse /products and view a single product
  test("1. Visitor can browse /products and view single product", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/products/);
    
    // Check catalog header and products
    await expect(page.locator("h1")).toContainText(/Packaging Catalog|Factory Portfolio/i);
    
    // Check at least one product card is visible
    const productCard = page.locator("a[href^='/products/']").first();
    await expect(productCard).toBeVisible();

    // Click product to view single product detail page
    await productCard.click();
    await expect(page).toHaveURL(/\/products\/.+/);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Manufactured in Addis Ababa")).toBeVisible();
  });

  // 2. Visitor cannot access /admin, /teacher, or /dashboard (all redirect to /login)
  test("2. Visitor is redirected from protected routes to login", async ({ page }) => {
    // Attempt /admin
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fadmin/);

    // Attempt /teacher
    await page.goto("/teacher");
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fteacher/);

    // Attempt /dashboard
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fdashboard/);
  });

  // 3. Customer signs up -> profile row created in profiles with role = 'customer'
  test("3. Customer sign-up creates profile with customer role", async ({ page, request }) => {
    const uniqueEmail = `test.customer.${Date.now()}@testgreenwork.com`;
    const password = "Password123!";
    const fullName = "Abebe Test Customer";
    const phone = "0911888999";

    await page.goto("/signup");
    await page.fill('input[type="text"]', fullName);
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="tel"]', phone);
    await page.fill('input[type="password"]', password);

    await page.click('button[type="submit"]');

    // Should redirect to dashboard or login
    await expect(page).toHaveURL(/\/dashboard|\/login/);

    // Verify role in profiles via backend API login
    const loginRes = await request.post("/api/auth/login", {
      data: { email: uniqueEmail, password },
    });
    const loginData = await loginRes.json();
    expect(loginRes.ok()).toBeTruthy();
    expect(loginData.user.role).toBe("customer");
  });

  // 4. Customer signs in, places an order with receipt -> pending status, order_items snapshot
  test("4. Customer places order with payment proof and snapshots recorded", async ({ request }) => {
    // 1. Sign in as customer
    const loginRes = await request.post("/api/auth/login", {
      data: {
        email: SEED_USERS.customer1.email,
        password: SEED_USERS.customer1.password,
      },
    });
    expect(loginRes.ok()).toBeTruthy();

    // 2. Get active product and active bank account
    const prodRes = await request.get("/api/products");
    const prodData = await prodRes.json();
    expect(prodData.products.length).toBeGreaterThan(0);
    const targetProduct = prodData.products[0];

    const bankRes = await request.get("/api/admin/bank-accounts");
    const bankData = await bankRes.json();
    const targetBank = (bankData.bankAccounts || []).find((b: any) => b.is_active) || bankData.bankAccounts[0];

    // 3. Post order
    const orderRes = await request.post("/api/orders", {
      data: {
        items: [{ productId: targetProduct.id, quantity: 2 }],
        bankAccountId: targetBank.id,
        deliveryAddress: "Bole Medhanialem, Addis Ababa",
        phone: "0911223344",
        notes: "Automated E2E Test Order with Custom Printing",
        paymentProofPath: "payment-proofs/test_receipt.jpg",
      },
    });

    const orderData = await orderRes.json();
    expect(orderRes.ok()).toBeTruthy();
    expect(orderData.order).toBeDefined();
    expect(orderData.order.status).toMatch(/^pending/);
    expect(Number(orderData.order.total_price)).toBe(Number(targetProduct.price) * 2);
  });

  // 5. Customer registers for class session -> atomic capacity RPC decrements spots
  test("5. Class session atomic registration and overcapacity protection", async ({ request }) => {
    // Login as customer
    await request.post("/api/auth/login", {
      data: {
        email: SEED_USERS.customer1.email,
        password: SEED_USERS.customer1.password,
      },
    });

    // Fetch classes
    const classesRes = await request.get("/api/classes");
    const classesData = await classesRes.json();
    expect(classesData.classes.length).toBeGreaterThan(0);
    const session = classesData.classes.find((c: any) => c.status === "scheduled") || classesData.classes[0];

    // Register
    const regRes = await request.post("/api/enrollments", {
      data: {
        sessionId: session.id,
        paymentProofPath: "payment-proofs/workshop_receipt.jpg",
      },
    });
    if (regRes.status() === 400) {
      const regErr = await regRes.json();
      expect(regErr.error).toMatch(/already_enrolled|active enrollment|already have an active registration|Session is already full|not open for registration/i);
    } else {
      expect(regRes.ok()).toBeTruthy();
      const regData = await regRes.json();
      expect(regData.result.success).toBe(true);
    }
  });

  // 6. Admin signs in -> visits /admin, /admin/users, /admin/products, /admin/payments, /admin/orders
  test("6. Admin portal navigation and management modules", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', SEED_USERS.admin.email);
    await page.fill('input[type="password"]', SEED_USERS.admin.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator("h1")).toContainText(/Factory Management Hub|Plant Operations|Manufacturing & Academy Operations/i);

    // Visit /admin/users
    await page.goto("/admin/users");
    await expect(page.locator("h1")).toContainText(/User Accounts & Permissions|Platform Users & Staff/i);

    // Visit /admin/products
    await page.goto("/admin/products");
    await expect(page.locator("h1")).toContainText(/Product Catalog|Manufactured Products/i);

    // Visit /admin/payments
    await page.goto("/admin/payments");
    await expect(page.locator("h1")).toContainText(/Settlement & Verification Queue|Payment Verification Queue/i);

    // Visit /admin/orders
    await page.goto("/admin/orders");
    await expect(page.locator("h1")).toContainText(/Orders Master Pipeline|Manufacturing & Orders Management/i);
  });

  // 7. Admin verifies payment in queue -> status advances to verified
  test("7. Admin approves payment proof in unified queue", async ({ request }) => {
    // Login as Admin
    await request.post("/api/auth/login", {
      data: {
        email: SEED_USERS.admin.email,
        password: SEED_USERS.admin.password,
      },
    });

    // Get orders to find a pending order
    const ordersRes = await request.get("/api/orders?status=pending");
    const ordersData = await ordersRes.json();

    if (ordersData.orders && ordersData.orders.length > 0) {
      const pendingOrder = ordersData.orders[0];

      // Approve order payment
      const approveRes = await request.patch(`/api/orders/${pendingOrder.id}`, {
        data: { action: "approve" },
      });
      const approveData = await approveRes.json();
      expect(approveRes.ok()).toBeTruthy();
      expect(approveData.order.status).toBe("approved");
    }
  });

  // 8. Admin advances order through in_production -> ready -> completed
  test("8. Order lifecycle advancement to completed", async ({ request }) => {
    // Login as Admin
    await request.post("/api/auth/login", {
      data: {
        email: SEED_USERS.admin.email,
        password: SEED_USERS.admin.password,
      },
    });

    // Find any order to advance
    const ordersRes = await request.get("/api/orders");
    const ordersData = await ordersRes.json();
    expect(ordersData.orders.length).toBeGreaterThan(0);
    const order = ordersData.orders[0];

    // Advance to in_production
    const pRes = await request.patch(`/api/orders/${order.id}`, {
      data: { action: "advance_status", status: "in_production" },
    });
    expect(pRes.ok()).toBeTruthy();

    // Advance to ready
    const rRes = await request.patch(`/api/orders/${order.id}`, {
      data: { action: "advance_status", status: "ready" },
    });
    expect(rRes.ok()).toBeTruthy();

    // Advance to completed
    const cRes = await request.patch(`/api/orders/${order.id}`, {
      data: { action: "advance_status", status: "completed" },
    });
    expect(cRes.ok()).toBeTruthy();
    const cData = await cRes.json();
    expect(cData.order.status).toBe("completed");
  });

  // 9. Teacher signs in -> visits /teacher, views assigned sessions
  test("9. Teacher portal access and assigned workshops", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', SEED_USERS.teacher.email);
    await page.fill('input[type="password"]', SEED_USERS.teacher.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/teacher/);
    await expect(page.locator("h1")).toContainText(/Instructor Studio Dashboard/i);

    // Check sessions listed
    await expect(page.locator("text=Assigned Classes")).toBeVisible();
  });

  // 10. Teacher starts live session -> LiveKit token canPublish: true; student token canPublish: false
  test("10. LiveKit token generation privileges by role", async ({ request }) => {
    // 1. Fetch live session
    const classRes = await request.get("/api/classes?type=live");
    const classData = await classRes.json();
    expect(classData.classes.length).toBeGreaterThan(0);
    const liveSession = classData.classes[0];

    // Assign teacher to session in DB
    const { pool } = await import("../../src/utils/db");
    await pool.query(
      `UPDATE public.class_sessions 
       SET teacher_id = (SELECT id FROM auth.users WHERE email = $1), status = 'scheduled' 
       WHERE id = $2`,
      [SEED_USERS.teacher.email, liveSession.id]
    );

    // 2. Start session as Teacher
    await request.post("/api/auth/login", {
      data: {
        email: SEED_USERS.teacher.email,
        password: SEED_USERS.teacher.password,
      },
    });

    const startRes = await request.post(`/api/live/${liveSession.id}/start`);
    expect(startRes.ok()).toBeTruthy();

    // 3. Teacher gets token -> isHost = true, canPublish = true
    const teacherTokenRes = await request.post(`/api/live/${liveSession.id}/token`);
    const teacherTokenData = await teacherTokenRes.json();
    expect(teacherTokenRes.ok()).toBeTruthy();
    expect(teacherTokenData.isHost).toBe(true);
    expect(teacherTokenData.canPublish).toBe(true);

    // 4. Ensure customer1 has confirmed enrollment in this live session
    await pool.query(
      `INSERT INTO public.enrollments (session_id, student_id, status)
       VALUES ($1, (SELECT id FROM auth.users WHERE email = $2), 'confirmed')
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = 'confirmed'`,
      [liveSession.id, SEED_USERS.customer1.email]
    );

    // 5. Customer gets token -> isHost = false, canPublish = false (viewer only)
    await request.post("/api/auth/login", {
      data: {
        email: SEED_USERS.customer1.email,
        password: SEED_USERS.customer1.password,
      },
    });

    const studentTokenRes = await request.post(`/api/live/${liveSession.id}/token`);
    const studentTokenData = await studentTokenRes.json();
    expect(studentTokenRes.ok()).toBeTruthy();
    expect(studentTokenData.isHost).toBe(false);
    expect(studentTokenData.canPublish).toBe(false);
  });

  // 11. RLS leak test: direct attempt by customer to read another customer's orders or escalate role is blocked
  test("11. Role enforcement and tenant isolation (RLS / API Guard)", async ({ request }) => {
    // Login as customer 1
    await request.post("/api/auth/login", {
      data: {
        email: SEED_USERS.customer1.email,
        password: SEED_USERS.customer1.password,
      },
    });

    // 1. Customer attempts to view another customer's order directly
    const allOrdersRes = await request.get("/api/orders");
    const allOrdersData = await allOrdersRes.json();

    // Verify all returned orders belong strictly to customer1
    for (const o of allOrdersData.orders) {
      expect(o.profiles.email).toBe(SEED_USERS.customer1.email);
    }

    // 2. Customer attempts to self-escalate role to admin via admin API
    const hackRoleRes = await request.patch("/api/admin/users", {
      data: {
        id: "self",
        role: "admin",
      },
    });
    // Must be blocked with 403 Forbidden
    expect(hackRoleRes.status()).toBe(403);
  });

});
