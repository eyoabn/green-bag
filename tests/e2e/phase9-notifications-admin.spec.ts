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

test.describe("Phase 9: Realtime Notifications, Audit Log & Admin Dashboard", () => {
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

  // --------------------------------------------------------------------------
  // TEST 1: Cross-User Notification Isolation
  // --------------------------------------------------------------------------
  test("1. Cross-User Notification Isolation: User A cannot read or mark User B's notifications", async ({ playwright }) => {
    // Insert a private notification specifically for Tariku
    const secretTitle = `Tariku Private Alert ${Date.now()}`;
    const ins = await queryDb(
      `INSERT INTO public.notifications (user_id, title, body, link, is_read)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id`,
      [tarikuId, secretTitle, "Confidential message for Tariku only", "/dashboard/orders"]
    );
    const tarikuNotifId = ins.rows[0].id;

    try {
      // Login as Selam (User A)
      const ctxSelam = await playwright.request.newContext();
      await ctxSelam.post("/api/auth/login", { data: TEST_USERS.customerSelam });

      // 1. Selam fetches /api/notifications -> must NOT include Tariku's notification
      const getRes = await ctxSelam.get("/api/notifications");
      expect(getRes.status()).toBe(200);
      const data = await getRes.json();
      const titles = (data.notifications || []).map((n: any) => n.title);
      expect(titles).not.toContain(secretTitle);

      // 2. Selam attempts to mark Tariku's notification as read via PATCH
      await ctxSelam.patch("/api/notifications", {
        data: { id: tarikuNotifId },
      });
      // Verify Tariku's DB record remains UNMODIFIED (is_read = false)
      const checkDb = await queryDb("SELECT is_read FROM public.notifications WHERE id = $1", [tarikuNotifId]);
      expect(checkDb.rows[0].is_read).toBe(false);
    } finally {
      // Clean up
      await queryDb("DELETE FROM public.notifications WHERE id = $1", [tarikuNotifId]);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 2: Multi-Window Realtime Bell Notification
  // --------------------------------------------------------------------------
  test("2. Realtime Bell & Notifications Page: Admin action updates customer bell live", async ({ browser }) => {
    // Clean initial state for Selam
    await queryDb("UPDATE public.notifications SET is_read = true WHERE user_id = $1", [selamId]);

    // Window 1: Customer Selam logged in on the homepage
    const customerContext = await browser.newContext();
    const customerPage = await customerContext.newPage();

    // Login as Customer Selam
    await customerPage.goto("/login");
    await customerPage.fill('input[type="email"]', TEST_USERS.customerSelam.email);
    await customerPage.fill('input[type="password"]', TEST_USERS.customerSelam.password);
    await customerPage.click('button[type="submit"]');
    await customerPage.waitForURL("**/dashboard", { timeout: 15000 });

    // Open homepage to observe the Navbar notification bell
    await customerPage.goto("/");
    await customerPage.waitForSelector('[data-testid="notification-bell"]', { timeout: 10000 });

    // Window 2: Trigger a real-time notification
    const alertTitle = `Order Verified #${Date.now()}`;
    const ins = await queryDb(
      `INSERT INTO public.notifications (user_id, title, body, link, is_read)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id`,
      [selamId, alertTitle, "Your payment of 5,400 ETB has been verified. Manufacturing begins now.", "/dashboard/orders"]
    );
    const notifId = ins.rows[0].id;

    try {
      // In Customer's window, the bell badge should appear without page refresh!
      const unreadBadge = customerPage.locator('[data-testid="unread-badge"]').first();
      await expect(unreadBadge).toBeVisible({ timeout: 15000 });

      // Click notification bell to open dropdown
      await customerPage.locator('[data-testid="notification-bell"]').first().click();
      const dropdown = customerPage.locator('[data-testid="notification-dropdown"]').first();
      await expect(dropdown).toBeVisible({ timeout: 5000 });

      // Verify the new notification is listed in the dropdown
      await expect(dropdown).toContainText(alertTitle, { timeout: 8000 });

      // Click "Mark all read" in the dropdown
      const markAllBtn = customerPage.locator('[data-testid="mark-all-read"]').first();
      if (await markAllBtn.isVisible()) {
        await markAllBtn.click();
        await expect(unreadBadge).not.toBeVisible({ timeout: 8000 });
      }

      // Navigate to full /dashboard/notifications page
      await customerPage.goto("/dashboard/notifications");
      await customerPage.waitForSelector('[data-testid="notifications-page-list"]', { timeout: 10000 });
      const pageList = customerPage.locator('[data-testid="notifications-page-list"]');
      await expect(pageList).toContainText(alertTitle);
    } finally {
      await customerContext.close();
      await queryDb("DELETE FROM public.notifications WHERE id = $1", [notifId]);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 3: SPEC.md W8 Triggers Verification
  // --------------------------------------------------------------------------
  test("3. W8 Triggers: Order, enrollment, class cancellation, and live session create notifications", async ({ playwright }) => {
    const adminCtx = await playwright.request.newContext();
    await adminCtx.post("/api/auth/login", { data: TEST_USERS.admin });

    const customerCtx = await playwright.request.newContext();
    await customerCtx.post("/api/auth/login", { data: TEST_USERS.customerSelam });

    // 1. Order Status Advancement Notification
    // Create test order for Selam
    const orderIns = await queryDb(
      `INSERT INTO public.orders (buyer_id, order_number, total_price, status)
       VALUES ($1, $2, 4500, 'approved')
       RETURNING id, order_number`,
      [selamId, `ORD-TEST-${Date.now()}`]
    );
    const testOrderId = orderIns.rows[0].id;
    const testOrderNum = orderIns.rows[0].order_number;

    try {
      // Admin advances status to 'in_production'
      const advanceRes = await adminCtx.patch(`/api/orders/${testOrderId}`, {
        data: {
          action: "advance_status",
          status: "in_production",
          note: "Paper rolls mounted on flexo press",
        },
      });
      expect(advanceRes.status()).toBe(200);

      // Verify customer notification was created
      const notifCheck = await queryDb(
        `SELECT * FROM public.notifications 
         WHERE user_id = $1 AND title ILIKE $2
         ORDER BY created_at DESC LIMIT 1`,
        [selamId, `%${testOrderNum}%`]
      );
      expect(notifCheck.rows.length).toBe(1);
      expect(notifCheck.rows[0].body).toContain("in production");

      // 2. Class Cancellation Notification to Enrolled Students
      // Create session and enroll Selam
      const classIns = await queryDb(
        `INSERT INTO public.class_sessions (type, title, description, capacity, price, status, starts_at, ends_at)
         VALUES ('in_person', 'Bag Folding Masterclass Test', 'Fold origami bags', 10, 500, 'scheduled', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 3 hours')
         RETURNING id, title`,
        []
      );
      const testSessionId = classIns.rows[0].id;
      const testClassTitle = classIns.rows[0].title;

      await queryDb(
        `INSERT INTO public.enrollments (session_id, student_id, status)
         VALUES ($1, $2, 'approved')`,
        [testSessionId, selamId]
      );

      // Cancel class via API
      const cancelRes = await adminCtx.patch(`/api/classes/${testSessionId}`, {
        data: { action: "cancel", reason: "Plant maintenance" },
      });
      expect(cancelRes.status()).toBe(200);

      // Verify enrolled student received cancellation notification
      const cancelNotif = await queryDb(
        `SELECT * FROM public.notifications 
         WHERE user_id = $1 AND title ILIKE $2
         ORDER BY created_at DESC LIMIT 1`,
        [selamId, `%Class Cancelled%`]
      );
      expect(cancelNotif.rows.length).toBe(1);
      expect(cancelNotif.rows[0].body).toContain(testClassTitle);

      // 3. Live Session Start Notification
      const liveSessionIns = await queryDb(
        `INSERT INTO public.class_sessions (type, title, capacity, price, status, starts_at, ends_at)
         VALUES ('live', 'Live Crafting Workshop Test', 15, 600, 'scheduled', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '2 hours')
         RETURNING id, title`,
        []
      );
      const liveSessionId = liveSessionIns.rows[0].id;
      const liveClassTitle = liveSessionIns.rows[0].title;

      await queryDb(
        `INSERT INTO public.enrollments (session_id, student_id, status)
         VALUES ($1, $2, 'approved')`,
        [liveSessionId, selamId]
      );

      // Admin starts live session
      const startRes = await adminCtx.post(`/api/live/${liveSessionId}/start`);
      expect(startRes.status()).toBe(200);

      // Verify student received "Class is Now Live!" notification
      const liveNotif = await queryDb(
        `SELECT * FROM public.notifications 
         WHERE user_id = $1 AND title ILIKE $2
         ORDER BY created_at DESC LIMIT 1`,
        [selamId, `%Class is Now Live%`]
      );
      expect(liveNotif.rows.length).toBe(1);
      expect(liveNotif.rows[0].body).toContain(liveClassTitle);

      // Clean up test entities
      await queryDb("DELETE FROM public.class_sessions WHERE id IN ($1, $2)", [testSessionId, liveSessionId]);
    } finally {
      await queryDb("DELETE FROM public.orders WHERE id = $1", [testOrderId]);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 4: Admin Dashboard REAL Numbers vs Direct SQL
  // --------------------------------------------------------------------------
  test("4. Admin Dashboard Metrics: Real DB numbers match direct SQL counts with zero fakes", async ({ browser }) => {
    // 1. Direct SQL baseline queries
    const qPendingOrders = await queryDb("SELECT count(*)::int as c FROM public.orders WHERE status = 'pending_verification'");
    const qPendingEnrollments = await queryDb("SELECT count(*)::int as c FROM public.enrollments WHERE status = 'pending_verification'");
    const expectedPendingPayments = qPendingOrders.rows[0].c + qPendingEnrollments.rows[0].c;

    const qUpcoming = await queryDb("SELECT count(*)::int as c FROM public.class_sessions WHERE status IN ('scheduled', 'live')");
    const expectedUpcoming = qUpcoming.rows[0].c;

    const qDesigns = await queryDb("SELECT count(*)::int as c FROM public.designs WHERE status = 'new'");
    const expectedNewDesigns = qDesigns.rows[0].c;

    const qOrderRev = await queryDb("SELECT COALESCE(sum(total_price), 0)::float as s FROM public.orders WHERE status IN ('approved', 'in_production', 'ready', 'completed')");
    const qEnrRev = await queryDb("SELECT COALESCE(sum(cs.price), 0)::float as s FROM public.enrollments e JOIN public.class_sessions cs ON e.session_id = cs.id WHERE e.status = 'approved'");
    const expectedTotalRevenue = qOrderRev.rows[0].s + qEnrRev.rows[0].s;

    // 2. Open /admin in browser as Admin
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto("/login");
    await adminPage.fill('input[type="email"]', TEST_USERS.admin.email);
    await adminPage.fill('input[type="password"]', TEST_USERS.admin.password);
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL("**/admin", { timeout: 15000 });

    // Verify Metric Cards in DOM
    const revVal = adminPage.locator('[data-testid="stat-revenue-value"]');
    await expect(revVal).toBeVisible({ timeout: 10000 });
    const revText = await revVal.textContent();
    expect(revText).toContain(expectedTotalRevenue.toLocaleString());

    const pendingVal = adminPage.locator('[data-testid="stat-pending-count"]');
    await expect(pendingVal).toBeVisible();
    const pendingText = await pendingVal.textContent();
    expect(pendingText?.trim()).toBe(expectedPendingPayments.toString());

    const upcomingVal = adminPage.locator('[data-testid="stat-upcoming-count"]');
    await expect(upcomingVal).toBeVisible();
    const upcomingText = await upcomingVal.textContent();
    expect(upcomingText?.trim()).toBe(expectedUpcoming.toString());

    const designsCard = adminPage.locator('[data-testid="stat-new-designs"]');
    await expect(designsCard).toBeVisible();
    const designsText = await designsCard.textContent();
    expect(designsText?.trim()).toBe(expectedNewDesigns.toString());

    // Verify Revenue Chart is rendered
    const chart = adminPage.locator('[data-testid="revenue-chart"]');
    await expect(chart).toBeVisible();

    // Verify Orders Pipeline is rendered
    const pipeline = adminPage.locator('[data-testid="orders-pipeline"]');
    await expect(pipeline).toBeVisible();

    // Verify Recent Activity Feed
    const activityFeed = adminPage.locator('[data-testid="recent-activity-feed"]');
    await expect(activityFeed).toBeVisible();

    await adminContext.close();
  });

  // --------------------------------------------------------------------------
  // TEST 5: Searchable, Filterable Audit Log (/admin/audit)
  // --------------------------------------------------------------------------
  test("5. Audit Log Explorer: Search, filter by action/entity/date, and inspect metadata", async ({ browser }) => {
    // Insert a distinctive audit log entry to test search
    const testAction = "TEST_SECURITY_CHECK";
    const testEntityId = `order-audit-${Date.now()}`;
    const ins = await queryDb(
      `INSERT INTO public.audit_log (actor_id, action, entity, entity_id, metadata)
       VALUES ($1, $2, 'orders', $3, $4)
       RETURNING id`,
      [adminId, testAction, testEntityId, JSON.stringify({ verified: true, testSuite: "Phase9" })]
    );
    const auditId = ins.rows[0].id;

    const adminContext = await browser.newContext();
    const page = await adminContext.newPage();

    try {
      // Login as Admin
      await page.goto("/login");
      await page.fill('input[type="email"]', TEST_USERS.admin.email);
      await page.fill('input[type="password"]', TEST_USERS.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL("**/admin", { timeout: 15000 });

      // Navigate to /admin/audit
      await page.goto("/admin/audit");
      await page.waitForSelector('[data-testid="audit-table-row"]', { timeout: 10000 });

      // 1. Test search input
      const searchInput = page.locator('[data-testid="audit-search-input"]');
      await searchInput.fill(testEntityId);
      await page.keyboard.press("Enter");

      // Verify the search result appears
      await page.waitForTimeout(1000);
      const rows = page.locator('[data-testid="audit-table-row"]');
      await expect(rows.first()).toBeVisible();
      const rowContent = await rows.first().textContent();
      expect(rowContent).toContain(testAction);
      expect(rowContent).toContain("orders");

      // 2. Click "Inspect" button to verify metadata modal
      await rows.first().locator("button:has-text('Inspect')").click();
      await expect(page.locator("text=Audit Snapshot Details")).toBeVisible();
      const modalPre = page.locator('[data-testid="audit-metadata-pre"]');
      await expect(modalPre).toBeVisible();
      const modalContent = await modalPre.textContent();
      expect(modalContent).toContain("Phase9");

      // Close modal
      await page.click("button:has-text('Close Inspector')");
      await expect(page.locator("text=Audit Snapshot Details")).not.toBeVisible();
    } finally {
      await adminContext.close();
      await queryDb("DELETE FROM public.audit_log WHERE id = $1", [auditId]);
    }
  });
});
