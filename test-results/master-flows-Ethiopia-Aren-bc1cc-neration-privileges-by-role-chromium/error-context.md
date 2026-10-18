# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: master-flows.spec.ts >> Ethiopia Arenguade Paper Product - Master Flows v2 >> 10. LiveKit token generation privileges by role
- Location: tests\e2e\master-flows.spec.ts:258:7

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  174 |     await expect(page.locator("h1")).toContainText(/Product Catalog|Manufactured Products/i);
  175 | 
  176 |     // Visit /admin/payments
  177 |     await page.goto("/admin/payments");
  178 |     await expect(page.locator("h1")).toContainText(/Settlement & Verification Queue|Payment Verification Queue/i);
  179 | 
  180 |     // Visit /admin/orders
  181 |     await page.goto("/admin/orders");
  182 |     await expect(page.locator("h1")).toContainText(/Orders Master Pipeline|Manufacturing & Orders Management/i);
  183 |   });
  184 | 
  185 |   // 7. Admin verifies payment in queue -> status advances to verified
  186 |   test("7. Admin approves payment proof in unified queue", async ({ request }) => {
  187 |     // Login as Admin
  188 |     await request.post("/api/auth/login", {
  189 |       data: {
  190 |         email: SEED_USERS.admin.email,
  191 |         password: SEED_USERS.admin.password,
  192 |       },
  193 |     });
  194 | 
  195 |     // Get orders to find a pending order
  196 |     const ordersRes = await request.get("/api/orders?status=pending");
  197 |     const ordersData = await ordersRes.json();
  198 | 
  199 |     if (ordersData.orders && ordersData.orders.length > 0) {
  200 |       const pendingOrder = ordersData.orders[0];
  201 | 
  202 |       // Approve order payment
  203 |       const approveRes = await request.patch(`/api/orders/${pendingOrder.id}`, {
  204 |         data: { action: "approve" },
  205 |       });
  206 |       const approveData = await approveRes.json();
  207 |       expect(approveRes.ok()).toBeTruthy();
  208 |       expect(approveData.order.status).toBe("verified");
  209 |     }
  210 |   });
  211 | 
  212 |   // 8. Admin advances order through in_production -> ready -> delivered
  213 |   test("8. Order lifecycle advancement to delivered", async ({ request }) => {
  214 |     // Login as Admin
  215 |     await request.post("/api/auth/login", {
  216 |       data: {
  217 |         email: SEED_USERS.admin.email,
  218 |         password: SEED_USERS.admin.password,
  219 |       },
  220 |     });
  221 | 
  222 |     // Find any order to advance
  223 |     const ordersRes = await request.get("/api/orders");
  224 |     const ordersData = await ordersRes.json();
  225 |     expect(ordersData.orders.length).toBeGreaterThan(0);
  226 |     const order = ordersData.orders[0];
  227 | 
  228 |     // Advance to in_production
  229 |     const pRes = await request.patch(`/api/orders/${order.id}`, {
  230 |       data: { action: "advance_status", status: "in_production" },
  231 |     });
  232 |     expect(pRes.ok()).toBeTruthy();
  233 | 
  234 |     // Advance to delivered
  235 |     const dRes = await request.patch(`/api/orders/${order.id}`, {
  236 |       data: { action: "advance_status", status: "delivered" },
  237 |     });
  238 |     expect(dRes.ok()).toBeTruthy();
  239 |     const dData = await dRes.json();
  240 |     expect(dData.order.status).toBe("delivered");
  241 |   });
  242 | 
  243 |   // 9. Teacher signs in -> visits /teacher, views assigned sessions
  244 |   test("9. Teacher portal access and assigned workshops", async ({ page }) => {
  245 |     await page.goto("/login");
  246 |     await page.fill('input[type="email"]', SEED_USERS.teacher.email);
  247 |     await page.fill('input[type="password"]', SEED_USERS.teacher.password);
  248 |     await page.click('button[type="submit"]');
  249 | 
  250 |     await expect(page).toHaveURL(/\/teacher/);
  251 |     await expect(page.locator("h1")).toContainText(/Instructor Studio Dashboard/i);
  252 | 
  253 |     // Check sessions listed
  254 |     await expect(page.locator("text=Assigned Classes")).toBeVisible();
  255 |   });
  256 | 
  257 |   // 10. Teacher starts live session -> LiveKit token canPublish: true; student token canPublish: false
  258 |   test("10. LiveKit token generation privileges by role", async ({ request }) => {
  259 |     // 1. Fetch live session
  260 |     const classRes = await request.get("/api/classes?type=live");
  261 |     const classData = await classRes.json();
  262 |     expect(classData.classes.length).toBeGreaterThan(0);
  263 |     const liveSession = classData.classes[0];
  264 | 
  265 |     // 2. Start session as Teacher / Admin
  266 |     await request.post("/api/auth/login", {
  267 |       data: {
  268 |         email: SEED_USERS.teacher.email,
  269 |         password: SEED_USERS.teacher.password,
  270 |       },
  271 |     });
  272 | 
  273 |     const startRes = await request.post(`/api/live/${liveSession.id}/start`);
> 274 |     expect(startRes.ok()).toBeTruthy();
      |                           ^ Error: expect(received).toBeTruthy()
  275 | 
  276 |     // 3. Teacher gets token -> isHost = true, canPublish = true
  277 |     const teacherTokenRes = await request.post(`/api/live/${liveSession.id}/token`);
  278 |     const teacherTokenData = await teacherTokenRes.json();
  279 |     expect(teacherTokenRes.ok()).toBeTruthy();
  280 |     expect(teacherTokenData.isHost).toBe(true);
  281 |     expect(teacherTokenData.canPublish).toBe(true);
  282 | 
  283 |     // 4. Ensure customer1 has confirmed enrollment in this live session
  284 |     const { pool } = await import("../../src/utils/db");
  285 |     await pool.query(
  286 |       `INSERT INTO public.enrollments (session_id, student_id, status)
  287 |        VALUES ($1, (SELECT id FROM auth.users WHERE email = $2), 'confirmed')
  288 |        ON CONFLICT (session_id, student_id) DO UPDATE SET status = 'confirmed'`,
  289 |       [liveSession.id, SEED_USERS.customer1.email]
  290 |     );
  291 | 
  292 |     // 5. Customer gets token -> isHost = false, canPublish = false (viewer only)
  293 |     await request.post("/api/auth/login", {
  294 |       data: {
  295 |         email: SEED_USERS.customer1.email,
  296 |         password: SEED_USERS.customer1.password,
  297 |       },
  298 |     });
  299 | 
  300 |     const studentTokenRes = await request.post(`/api/live/${liveSession.id}/token`);
  301 |     const studentTokenData = await studentTokenRes.json();
  302 |     expect(studentTokenRes.ok()).toBeTruthy();
  303 |     expect(studentTokenData.isHost).toBe(false);
  304 |     expect(studentTokenData.canPublish).toBe(false);
  305 |   });
  306 | 
  307 |   // 11. RLS leak test: direct attempt by customer to read another customer's orders or escalate role is blocked
  308 |   test("11. Role enforcement and tenant isolation (RLS / API Guard)", async ({ request }) => {
  309 |     // Login as customer 1
  310 |     await request.post("/api/auth/login", {
  311 |       data: {
  312 |         email: SEED_USERS.customer1.email,
  313 |         password: SEED_USERS.customer1.password,
  314 |       },
  315 |     });
  316 | 
  317 |     // 1. Customer attempts to view another customer's order directly
  318 |     const allOrdersRes = await request.get("/api/orders");
  319 |     const allOrdersData = await allOrdersRes.json();
  320 | 
  321 |     // Verify all returned orders belong strictly to customer1
  322 |     for (const o of allOrdersData.orders) {
  323 |       expect(o.profiles.email).toBe(SEED_USERS.customer1.email);
  324 |     }
  325 | 
  326 |     // 2. Customer attempts to self-escalate role to admin via admin API
  327 |     const hackRoleRes = await request.patch("/api/admin/users", {
  328 |       data: {
  329 |         id: "self",
  330 |         role: "admin",
  331 |       },
  332 |     });
  333 |     // Must be blocked with 403 Forbidden
  334 |     expect(hackRoleRes.status()).toBe(403);
  335 |   });
  336 | 
  337 | });
  338 | 
```