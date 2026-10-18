# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase3-admin.spec.ts >> Phase 3: Admin Shell, Users, Bank Accounts, Settings >> 2. Admin cannot demote or deactivate self (UI locked and API returns 403)
- Location: tests\e2e\phase3-admin.spec.ts:62:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('tr').filter({ hasText: 'admin@arenguade.com' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('tr').filter({ hasText: 'admin@arenguade.com' }) with timeout 15000ms
  - waiting for locator('tr').filter({ hasText: 'admin@arenguade.com' })

```

```yaml
- main:
  - complementary:
    - text: አ Arenguade Executive Suite
    - navigation:
      - link "Dashboard Overview":
        - /url: /admin
      - link "Payment Queue":
        - /url: /admin/payments
      - link "Orders & Fulfillment":
        - /url: /admin/orders
      - link "Product Catalog":
        - /url: /admin/products
      - link "Classrooms & Workshops":
        - /url: /admin/classes
      - link "Users & Staff":
        - /url: /admin/users
      - link "Design Submissions":
        - /url: /admin/designs
      - link "Banking & Settlement":
        - /url: /admin/bank-accounts
      - link "Audit Log & History":
        - /url: /admin/audit
      - link "Factory Settings":
        - /url: /admin/settings
    - text: Logged in as Abebe Admin (Owner) Admin
    - link "My Profile & Settings":
      - /url: /profile
    - link "Return to Public Site":
      - /url: /
    - button "Sign Out of Console"
  - text: Plant Administration / users
  - button "Notifications": 9+
  - text: A Abebe Admin (Owner)
  - main:
    - text: Identity & Access Management
    - heading "Platform Users & Staff" [level=1]
    - paragraph: Manage client accounts, assign certified teachers, and govern administrator clearance.
    - button "Provision Teacher / Staff"
    - textbox "Search by name, email, or phone number..."
    - combobox:
      - 'option "Role: All Roles"'
      - 'option "Role: Customer"'
      - 'option "Role: Teacher"'
      - 'option "Role: Admin" [selected]'
    - combobox:
      - 'option "Status: All Statuses" [selected]'
      - 'option "Status: Active"'
      - 'option "Status: Inactive"'
    - table:
      - rowgroup:
        - row "User Details Role Clearance Account Status Registered":
          - columnheader "User Details"
          - columnheader "Role Clearance"
          - columnheader "Account Status"
          - columnheader "Registered"
      - rowgroup:
        - row "P Phase Two Customer 0912345678 CUSTOMER Active 10/18/2026":
          - cell "P Phase Two Customer 0912345678"
          - cell "CUSTOMER":
            - combobox:
              - option "CUSTOMER" [selected]
              - option "TEACHER"
              - option "ADMIN"
          - cell "Active":
            - button "Active"
          - cell "10/18/2026"
        - row "A Abebe Test Customer 0911888999 CUSTOMER Active 10/18/2026":
          - cell "A Abebe Test Customer 0911888999"
          - cell "CUSTOMER":
            - combobox:
              - option "CUSTOMER" [selected]
              - option "TEACHER"
              - option "ADMIN"
          - cell "Active":
            - button "Active"
          - cell "10/18/2026"
        - row "A Abebe Test Customer test.customer.1792241927988@testgreenwork.com 0911888999 CUSTOMER Active 10/17/2026":
          - cell "A Abebe Test Customer test.customer.1792241927988@testgreenwork.com 0911888999"
          - cell "CUSTOMER":
            - combobox:
              - option "CUSTOMER" [selected]
              - option "TEACHER"
              - option "ADMIN"
          - cell "Active":
            - button "Active"
          - cell "10/17/2026"
        - row "P Phase Two Customer p2.customer.1792241836535@testgreenwork.com 0912345678 CUSTOMER Active 10/17/2026":
          - cell "P Phase Two Customer p2.customer.1792241836535@testgreenwork.com 0912345678"
          - cell "CUSTOMER":
            - combobox:
              - option "CUSTOMER" [selected]
              - option "TEACHER"
              - option "ADMIN"
          - cell "Active":
            - button "Active"
          - cell "10/17/2026"
        - row "P Phase Two Customer p2.customer.1792241477968@testgreenwork.com 0912345678 CUSTOMER Active 10/17/2026":
          - cell "P Phase Two Customer p2.customer.1792241477968@testgreenwork.com 0912345678"
          - cell "CUSTOMER":
            - combobox:
              - option "CUSTOMER" [selected]
              - option "TEACHER"
              - option "ADMIN"
          - cell "Active":
            - button "Active"
          - cell "10/17/2026"
        - row "A Abebe Test Customer test.customer.1792241411658@testgreenwork.com 0911888999 CUSTOMER Active 10/17/2026":
          - cell "A Abebe Test Customer test.customer.1792241411658@testgreenwork.com 0911888999"
          - cell "CUSTOMER":
            - combobox:
              - option "CUSTOMER" [selected]
              - option "TEACHER"
              - option "ADMIN"
          - cell "Active":
            - button "Active"
          - cell "10/17/2026"
        - row "P Phase Two Customer p2.customer.1792239134797@testgreenwork.com 0912345678 CUSTOMER Active 10/17/2026":
          - cell "P Phase Two Customer p2.customer.1792239134797@testgreenwork.com 0912345678"
          - cell "CUSTOMER":
            - combobox:
              - option "CUSTOMER" [selected]
              - option "TEACHER"
              - option "ADMIN"
          - cell "Active":
            - button "Active"
          - cell "10/17/2026"
        - row "A Abebe Test Customer test.customer.1792239078950@testgreenwork.com 0911888999 CUSTOMER Active 10/17/2026":
          - cell "A Abebe Test Customer test.customer.1792239078950@testgreenwork.com 0911888999"
          - cell "CUSTOMER":
            - combobox:
              - option "CUSTOMER" [selected]
              - option "TEACHER"
              - option "ADMIN"
          - cell "Active":
            - button "Active"
          - cell "10/17/2026"
        - row "P Phase Two Customer p2.customer.1792239004861@testgreenwork.com 0912345678 CUSTOMER Active 10/17/2026":
          - cell "P Phase Two Customer p2.customer.1792239004861@testgreenwork.com 0912345678"
          - cell "CUSTOMER":
            - combobox:
              - option "CUSTOMER" [selected]
              - option "TEACHER"
              - option "ADMIN"
          - cell "Active":
            - button "Active"
          - cell "10/17/2026"
        - row "A Abebe Test Customer test.customer.1792238942195@testgreenwork.com 0911888999 CUSTOMER Active 10/17/2026":
          - cell "A Abebe Test Customer test.customer.1792238942195@testgreenwork.com 0911888999"
          - cell "CUSTOMER":
            - combobox:
              - option "CUSTOMER" [selected]
              - option "TEACHER"
              - option "ADMIN"
          - cell "Active":
            - button "Active"
          - cell "10/17/2026"
    - text: Showing 1 to 10 of 28 entries
    - button "Prev" [disabled]
    - text: Page 1 of 3
    - button "Next"
- alert
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { pool } from "../../src/utils/db";
  3   | 
  4   | const SEED_USERS = {
  5   |   admin: {
  6   |     email: "admin@arenguade.com",
  7   |     password: "Password123!",
  8   |   },
  9   |   teacher: {
  10  |     email: "teacher.tigist@arenguade.com",
  11  |     password: "Password123!",
  12  |   },
  13  |   customer1: {
  14  |     email: "customer.selam@gmail.com",
  15  |     password: "Password123!",
  16  |   },
  17  |   customer2: {
  18  |     email: "customer.tariku@gmail.com",
  19  |     password: "Password123!",
  20  |   },
  21  | };
  22  | 
  23  | test.describe("Phase 3: Admin Shell, Users, Bank Accounts, Settings", () => {
  24  |   test.beforeEach(async ({ page }) => {
  25  |     await page.setViewportSize({ width: 1280, height: 800 });
  26  |   });
  27  | 
  28  |   // 1. Admin layout shell with 9-link sidebar, top bar, and notification bell
  29  |   test("1. Admin layout displays full 9-link navigation and desktop top bar with notification bell", async ({ page }) => {
  30  |     // Sign in as admin
  31  |     await page.goto("/login");
  32  |     await page.fill('input[type="email"]', SEED_USERS.admin.email);
  33  |     await page.fill('input[type="password"]', SEED_USERS.admin.password);
  34  |     await page.click('button[type="submit"]');
  35  |     await page.waitForURL(/\/admin/, { timeout: 10000 });
  36  | 
  37  |     // Verify all 9 sidebar navigation items
  38  |     const expectedLinks = [
  39  |       { href: "/admin", label: "Dashboard Overview" },
  40  |       { href: "/admin/payments", label: "Payment Queue" },
  41  |       { href: "/admin/orders", label: "Orders & Fulfillment" },
  42  |       { href: "/admin/products", label: "Product Catalog" },
  43  |       { href: "/admin/classes", label: "Classrooms & Workshops" },
  44  |       { href: "/admin/users", label: "Users & Staff" },
  45  |       { href: "/admin/designs", label: "Design Submissions" },
  46  |       { href: "/admin/bank-accounts", label: "Banking & Settlement" },
  47  |       { href: "/admin/settings", label: "Factory Settings" },
  48  |     ];
  49  | 
  50  |     for (const link of expectedLinks) {
  51  |       const el = page.locator(`aside nav a[href="${link.href}"]`);
  52  |       await expect(el).toBeVisible();
  53  |     }
  54  | 
  55  |     // Verify desktop header contains top bar and notification bell
  56  |     const topBar = page.locator('[data-testid="admin-topbar"]');
  57  |     await expect(topBar).toBeVisible();
  58  |     await expect(topBar.locator("button[aria-label='Notifications']")).toBeVisible();
  59  |   });
  60  | 
  61  |   // 2. Admin cannot demote or deactivate themselves (UI locked and API returns 403)
  62  |   test("2. Admin cannot demote or deactivate self (UI locked and API returns 403)", async ({ page, request }) => {
  63  |     // Sign in as admin via UI
  64  |     await page.goto("/login");
  65  |     await page.fill('input[type="email"]', SEED_USERS.admin.email);
  66  |     await page.fill('input[type="password"]', SEED_USERS.admin.password);
  67  |     await page.click('button[type="submit"]');
  68  |     await page.waitForURL(/\/admin/, { timeout: 10000 });
  69  | 
  70  |     await page.goto("/admin/users");
  71  |     await page.waitForSelector("table", { timeout: 10000 });
  72  | 
  73  |     // Filter for Admin role using the DataTable filter dropdown
  74  |     const responsePromise = page.waitForResponse(
  75  |       (r) => r.url().includes("/api/admin/users") && r.status() === 200
  76  |     );
  77  |     const roleSelect = page.locator("select").filter({ hasText: /Role/ });
  78  |     await roleSelect.selectOption("admin");
  79  |     await responsePromise;
  80  | 
  81  |     // Verify admin self-row shows "ADMIN (Locked)" and cannot be deactivated
  82  |     const selfRow = page.locator("tr").filter({ hasText: SEED_USERS.admin.email });
> 83  |     await expect(selfRow).toBeVisible();
      |                           ^ Error: expect(locator).toBeVisible() failed
  84  |     await expect(selfRow.locator("text=ADMIN (Locked)")).toBeVisible();
  85  |     
  86  |     // Inactive button on self is disabled
  87  |     const activeBtn = selfRow.locator("button", { hasText: "Active" });
  88  |     await expect(activeBtn).toBeDisabled();
  89  | 
  90  |     // Authenticate request context as admin
  91  |     await request.post("/api/auth/login", {
  92  |       data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
  93  |     });
  94  | 
  95  |     // Verify server-side API strictly rejects demoting or deactivating self with HTTP 403
  96  |     const adminUserRes = await pool.query("SELECT id FROM public.profiles WHERE email = $1", [SEED_USERS.admin.email]);
  97  |     const adminId = adminUserRes.rows[0].id;
  98  | 
  99  |     // Direct PATCH to demote self -> 403
  100 |     const demoteRes = await request.patch("/api/admin/users", {
  101 |       data: { userId: adminId, role: "customer" },
  102 |     });
  103 |     expect(demoteRes.status()).toBe(403);
  104 |     const demoteJson = await demoteRes.json();
  105 |     expect(demoteJson.error).toContain("Administrators cannot demote their own account");
  106 | 
  107 |     // Direct PATCH to deactivate self -> 403
  108 |     const deactRes = await request.patch("/api/admin/users", {
  109 |       data: { userId: adminId, is_active: false },
  110 |     });
  111 |     expect(deactRes.status()).toBe(403);
  112 |     const deactJson = await deactRes.json();
  113 |     expect(deactJson.error).toContain("Administrators cannot deactivate their own account");
  114 |   });
  115 | 
  116 |   // 3. Customer or Teacher calling /api/admin/* gets 403 Forbidden
  117 |   test("3. Non-admin users calling /api/admin/* receive HTTP 403 Forbidden", async ({ request }) => {
  118 |     // Authenticate request context as customer1
  119 |     await request.post("/api/auth/login", {
  120 |       data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
  121 |     });
  122 | 
  123 |     // Customer attempts to call admin endpoints -> all return 403 Forbidden
  124 |     const usersRes = await request.get("/api/admin/users");
  125 |     expect(usersRes.status()).toBe(403);
  126 | 
  127 |     const bankRes = await request.post("/api/admin/bank-accounts", {
  128 |       data: { bank_name: "Illegal Bank", account_name: "Hacker", account_number: "0000" },
  129 |     });
  130 |     expect(bankRes.status()).toBe(403);
  131 | 
  132 |     const settingsRes = await request.patch("/api/admin/settings", {
  133 |       data: { company_name: "Defaced Site" },
  134 |     });
  135 |     expect(settingsRes.status()).toBe(403);
  136 |   });
  137 | 
  138 |   // 4. Admin promotes customer to teacher -> User can access /teacher & audit log is written
  139 |   test("4. Admin promotes customer to teacher and writes audit log", async ({ page, request }) => {
  140 |     // Get customer2 ID
  141 |     const custRes = await pool.query("SELECT id FROM public.profiles WHERE email = $1", [SEED_USERS.customer2.email]);
  142 |     const custId = custRes.rows[0].id;
  143 | 
  144 |     // Authenticate request as admin
  145 |     await request.post("/api/auth/login", {
  146 |       data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
  147 |     });
  148 | 
  149 |     // Promote customer2 to teacher via API
  150 |     const promoteRes = await request.patch("/api/admin/users", {
  151 |       data: { userId: custId, role: "teacher" },
  152 |     });
  153 |     expect(promoteRes.ok()).toBeTruthy();
  154 | 
  155 |     // Verify audit log has the event
  156 |     const auditRes = await pool.query(
  157 |       "SELECT * FROM public.audit_log WHERE action = 'UPDATE_USER' AND entity_id = $1 ORDER BY created_at DESC LIMIT 1",
  158 |       [custId]
  159 |     );
  160 |     expect(auditRes.rows.length).toBe(1);
  161 |     expect(auditRes.rows[0].action).toBe("UPDATE_USER");
  162 | 
  163 |     // Login as customer2 (now teacher) in browser and verify access to /teacher
  164 |     await page.goto("/login");
  165 |     await page.fill('input[type="email"]', SEED_USERS.customer2.email);
  166 |     await page.fill('input[type="password"]', SEED_USERS.customer2.password);
  167 |     await page.click('button[type="submit"]');
  168 |     await page.waitForURL(/\/teacher/, { timeout: 10000 });
  169 |     await expect(page).toHaveURL(/\/teacher/);
  170 | 
  171 |     // Revert customer2 back to customer
  172 |     await pool.query("UPDATE public.profiles SET role = 'customer'::user_role WHERE id = $1", [custId]);
  173 |   });
  174 | 
  175 |   // 5. Admin provisions a new teacher account
  176 |   test("5. Admin provisions a new teacher account and verifies profile & audit log", async ({ request }) => {
  177 |     const timestamp = Date.now();
  178 |     const newTeacherEmail = `teacher.p3.${timestamp}@arenguade.com`;
  179 |     const newTeacherName = `Artisan Instructor ${timestamp}`;
  180 | 
  181 |     // Authenticate request as admin
  182 |     await request.post("/api/auth/login", {
  183 |       data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
```