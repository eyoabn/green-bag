import { test, expect } from "@playwright/test";
import { pool } from "../../src/utils/db";

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

test.describe("Phase 3: Admin Shell, Users, Bank Accounts, Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  // 1. Admin layout shell with 9-link sidebar, top bar, and notification bell
  test("1. Admin layout displays full 9-link navigation and desktop top bar with notification bell", async ({ page }) => {
    // Sign in as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', SEED_USERS.admin.email);
    await page.fill('input[type="password"]', SEED_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 10000 });

    // Verify all 9 sidebar navigation items
    const expectedLinks = [
      { href: "/admin", label: "Dashboard Overview" },
      { href: "/admin/payments", label: "Payment Queue" },
      { href: "/admin/orders", label: "Orders & Fulfillment" },
      { href: "/admin/products", label: "Product Catalog" },
      { href: "/admin/classes", label: "Classrooms & Workshops" },
      { href: "/admin/users", label: "Users & Staff" },
      { href: "/admin/designs", label: "Design Submissions" },
      { href: "/admin/bank-accounts", label: "Banking & Settlement" },
      { href: "/admin/settings", label: "Factory Settings" },
    ];

    for (const link of expectedLinks) {
      const el = page.locator(`aside nav a[href="${link.href}"]`);
      await expect(el).toBeVisible();
    }

    // Verify desktop header contains top bar and notification bell
    const topBar = page.locator('[data-testid="admin-topbar"]');
    await expect(topBar).toBeVisible();
    await expect(topBar.locator("button[aria-label='Notifications']")).toBeVisible();
  });

  // 2. Admin cannot demote or deactivate themselves (UI locked and API returns 403)
  test("2. Admin cannot demote or deactivate self (UI locked and API returns 403)", async ({ page, request }) => {
    // Sign in as admin via UI
    await page.goto("/login");
    await page.fill('input[type="email"]', SEED_USERS.admin.email);
    await page.fill('input[type="password"]', SEED_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 10000 });

    await page.goto("/admin/users");
    await page.waitForSelector("table", { timeout: 10000 });

    // Filter for Admin role using the DataTable filter dropdown
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes("/api/admin/users") && r.status() === 200
    );
    const roleSelect = page.locator("select").filter({ hasText: /Role/ });
    await roleSelect.selectOption("admin");
    await responsePromise;

    // Verify admin self-row shows "ADMIN (Locked)" and cannot be deactivated
    const selfRow = page.locator("tr").filter({ hasText: SEED_USERS.admin.email });
    await expect(selfRow).toBeVisible();
    await expect(selfRow.locator("text=ADMIN (Locked)")).toBeVisible();
    
    // Inactive button on self is disabled
    const activeBtn = selfRow.locator("button", { hasText: "Active" });
    await expect(activeBtn).toBeDisabled();

    // Authenticate request context as admin
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });

    // Verify server-side API strictly rejects demoting or deactivating self with HTTP 403
    const adminUserRes = await pool.query("SELECT id FROM public.profiles WHERE email = $1", [SEED_USERS.admin.email]);
    const adminId = adminUserRes.rows[0].id;

    // Direct PATCH to demote self -> 403
    const demoteRes = await request.patch("/api/admin/users", {
      data: { userId: adminId, role: "customer" },
    });
    expect(demoteRes.status()).toBe(403);
    const demoteJson = await demoteRes.json();
    expect(demoteJson.error).toContain("Administrators cannot demote their own account");

    // Direct PATCH to deactivate self -> 403
    const deactRes = await request.patch("/api/admin/users", {
      data: { userId: adminId, is_active: false },
    });
    expect(deactRes.status()).toBe(403);
    const deactJson = await deactRes.json();
    expect(deactJson.error).toContain("Administrators cannot deactivate their own account");
  });

  // 3. Customer or Teacher calling /api/admin/* gets 403 Forbidden
  test("3. Non-admin users calling /api/admin/* receive HTTP 403 Forbidden", async ({ request }) => {
    // Authenticate request context as customer1
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
    });

    // Customer attempts to call admin endpoints -> all return 403 Forbidden
    const usersRes = await request.get("/api/admin/users");
    expect(usersRes.status()).toBe(403);

    const bankRes = await request.post("/api/admin/bank-accounts", {
      data: { bank_name: "Illegal Bank", account_name: "Hacker", account_number: "0000" },
    });
    expect(bankRes.status()).toBe(403);

    const settingsRes = await request.patch("/api/admin/settings", {
      data: { company_name: "Defaced Site" },
    });
    expect(settingsRes.status()).toBe(403);
  });

  // 4. Admin promotes customer to teacher -> User can access /teacher & audit log is written
  test("4. Admin promotes customer to teacher and writes audit log", async ({ page, request }) => {
    // Get customer2 ID
    const custRes = await pool.query("SELECT id FROM public.profiles WHERE email = $1", [SEED_USERS.customer2.email]);
    const custId = custRes.rows[0].id;

    // Authenticate request as admin
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });

    // Promote customer2 to teacher via API
    const promoteRes = await request.patch("/api/admin/users", {
      data: { userId: custId, role: "teacher" },
    });
    expect(promoteRes.ok()).toBeTruthy();

    // Verify audit log has the event
    const auditRes = await pool.query(
      "SELECT * FROM public.audit_log WHERE action = 'UPDATE_USER' AND entity_id = $1 ORDER BY created_at DESC LIMIT 1",
      [custId]
    );
    expect(auditRes.rows.length).toBe(1);
    expect(auditRes.rows[0].action).toBe("UPDATE_USER");

    // Login as customer2 (now teacher) in browser and verify access to /teacher
    await page.goto("/login");
    await page.fill('input[type="email"]', SEED_USERS.customer2.email);
    await page.fill('input[type="password"]', SEED_USERS.customer2.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/teacher/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/teacher/);

    // Revert customer2 back to customer
    await pool.query("UPDATE public.profiles SET role = 'customer'::user_role WHERE id = $1", [custId]);
  });

  // 5. Admin provisions a new teacher account
  test("5. Admin provisions a new teacher account and verifies profile & audit log", async ({ request }) => {
    const timestamp = Date.now();
    const newTeacherEmail = `teacher.p3.${timestamp}@arenguade.com`;
    const newTeacherName = `Artisan Instructor ${timestamp}`;

    // Authenticate request as admin
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });

    // Provision new teacher
    const provRes = await request.post("/api/admin/users", {
      data: {
        email: newTeacherEmail,
        fullName: newTeacherName,
        phone: "0922334455",
        password: "Password123!",
        role: "teacher",
      },
    });
    expect(provRes.ok()).toBeTruthy();
    const provData = await provRes.json();
    expect(provData.user.role).toBe("teacher");
    expect(provData.user.email).toBe(newTeacherEmail);

    // Verify audit log
    const auditRes = await pool.query(
      "SELECT * FROM public.audit_log WHERE action = 'PROVISION_USER' AND entity_id = $1",
      [provData.user.id]
    );
    expect(auditRes.rows.length).toBe(1);

    // Clean up provisioned user
    await pool.query("DELETE FROM public.profiles WHERE id = $1", [provData.user.id]);
    await pool.query("DELETE FROM auth.users WHERE id = $1", [provData.user.id]);
  });

  // 6. Admin bank accounts full CRUD & disabled account filtered out of checkout
  test("6. Admin bank accounts CRUD and disabled account filtered out of checkout", async ({ request }) => {
    // Authenticate request as admin
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });

    const bankName = `Test Awash Bank ${Date.now()}`;
    const accNum = `999000${Date.now().toString().slice(-6)}`;

    // CREATE
    const createRes = await request.post("/api/admin/bank-accounts", {
      data: {
        bank_name: bankName,
        account_name: "Ethiopia Arenguade Paper Product PLC",
        account_number: accNum,
        instructions: "Include Order ARN in remark.",
        is_active: true,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createdAccount = (await createRes.json()).account;

    // Verify public checkout endpoint lists it when active
    const publicActiveRes = await request.get("/api/bank-accounts");
    const publicActiveJson = await publicActiveRes.json();
    const foundActive = publicActiveJson.accounts.find((a: any) => a.id === createdAccount.id);
    expect(foundActive).toBeDefined();

    // UPDATE: Disable account
    const disableRes = await request.patch("/api/admin/bank-accounts", {
      data: { id: createdAccount.id, is_active: false },
    });
    expect(disableRes.ok()).toBeTruthy();

    // Verify public checkout endpoint excludes it when disabled
    const publicDisabledRes = await request.get("/api/bank-accounts");
    const publicDisabledJson = await publicDisabledRes.json();
    const foundDisabled = publicDisabledJson.accounts.find((a: any) => a.id === createdAccount.id);
    expect(foundDisabled).toBeUndefined();

    // DELETE / Clean up
    const deleteRes = await request.delete(`/api/admin/bank-accounts?id=${createdAccount.id}`);
    expect(deleteRes.ok()).toBeTruthy();

    // Verify audit logs for bank accounts
    const auditRes = await pool.query(
      "SELECT action FROM public.audit_log WHERE entity = 'bank_accounts' AND entity_id = $1",
      [createdAccount.id]
    );
    expect(auditRes.rows.some((r) => r.action === "CREATE_BANK_ACCOUNT")).toBeTruthy();
    expect(auditRes.rows.some((r) => r.action === "UPDATE_BANK_ACCOUNT")).toBeTruthy();
    expect(auditRes.rows.some((r) => r.action === "DELETE_BANK_ACCOUNT")).toBeTruthy();
  });

  // 7. Settings update persists to DB, updates public footer, and logs to audit_log
  test("7. Updating settings updates database, public footer, and audit log", async ({ page, request }) => {
    // Authenticate request as admin
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });

    const newPhone = `+251 911 ${Math.floor(100000 + Math.random() * 900000)}`;
    const newAddress = `Addis Ababa Eco-Industrial Park, Sector ${Math.floor(1 + Math.random() * 10)}`;

    // Update settings via admin API
    const updateRes = await request.patch("/api/admin/settings", {
      data: {
        company_name: "Ethiopia Arenguade Paper Product",
        contact_phone: newPhone,
        contact_email: "support@arenguadepaper.com",
        address: newAddress,
        social_links: { telegram: "@arenguade_official", instagram: "https://instagram.com/arenguade" },
      },
    });
    expect(updateRes.ok()).toBeTruthy();

    // Check public /api/settings
    const publicSettingsRes = await request.get("/api/settings");
    const publicSettings = (await publicSettingsRes.json()).settings;
    expect(publicSettings.contact_phone).toBe(newPhone);
    expect(publicSettings.address).toBe(newAddress);

    // Verify public home page footer renders updated values
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer.locator(`text=${newPhone}`)).toBeVisible();
    await expect(footer.locator(`text=${newAddress}`)).toBeVisible();

    // Verify audit log
    const auditRes = await pool.query(
      "SELECT * FROM public.audit_log WHERE action = 'UPDATE_FACTORY_SETTINGS' ORDER BY created_at DESC LIMIT 1"
    );
    expect(auditRes.rows.length).toBe(1);
    expect(auditRes.rows[0].metadata.contact_phone).toBe(newPhone);
  });
});
