# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: master-flows.spec.ts >> Ethiopia Arenguade Paper Product - Master Flows v2 >> 5. Class session atomic registration and overcapacity protection
- Location: tests\e2e\master-flows.spec.ts:126:7

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /already have an active registration|Session is already full/i
Received string:  "Class session is not open for registration (status: live)"
```

# Test source

```ts
  50  |     await page.goto("/teacher");
  51  |     await expect(page).toHaveURL(/\/login\?returnTo=%2Fteacher/);
  52  | 
  53  |     // Attempt /dashboard
  54  |     await page.goto("/dashboard");
  55  |     await expect(page).toHaveURL(/\/login\?returnTo=%2Fdashboard/);
  56  |   });
  57  | 
  58  |   // 3. Customer signs up -> profile row created in profiles with role = 'customer'
  59  |   test("3. Customer sign-up creates profile with customer role", async ({ page, request }) => {
  60  |     const uniqueEmail = `test.customer.${Date.now()}@testgreenwork.com`;
  61  |     const password = "Password123!";
  62  |     const fullName = "Abebe Test Customer";
  63  |     const phone = "0911888999";
  64  | 
  65  |     await page.goto("/signup");
  66  |     await page.fill('input[type="text"]', fullName);
  67  |     await page.fill('input[type="email"]', uniqueEmail);
  68  |     await page.fill('input[type="tel"]', phone);
  69  |     await page.fill('input[type="password"]', password);
  70  | 
  71  |     await page.click('button[type="submit"]');
  72  | 
  73  |     // Should redirect to dashboard or login
  74  |     await expect(page).toHaveURL(/\/dashboard|\/login/);
  75  | 
  76  |     // Verify role in profiles via backend API login
  77  |     const loginRes = await request.post("/api/auth/login", {
  78  |       data: { email: uniqueEmail, password },
  79  |     });
  80  |     const loginData = await loginRes.json();
  81  |     expect(loginRes.ok()).toBeTruthy();
  82  |     expect(loginData.user.role).toBe("customer");
  83  |   });
  84  | 
  85  |   // 4. Customer signs in, places an order with receipt -> pending status, order_items snapshot
  86  |   test("4. Customer places order with payment proof and snapshots recorded", async ({ request }) => {
  87  |     // 1. Sign in as customer
  88  |     const loginRes = await request.post("/api/auth/login", {
  89  |       data: {
  90  |         email: SEED_USERS.customer1.email,
  91  |         password: SEED_USERS.customer1.password,
  92  |       },
  93  |     });
  94  |     expect(loginRes.ok()).toBeTruthy();
  95  | 
  96  |     // 2. Get active product and active bank account
  97  |     const prodRes = await request.get("/api/products");
  98  |     const prodData = await prodRes.json();
  99  |     expect(prodData.products.length).toBeGreaterThan(0);
  100 |     const targetProduct = prodData.products[0];
  101 | 
  102 |     const bankRes = await request.get("/api/admin/bank-accounts");
  103 |     const bankData = await bankRes.json();
  104 |     const targetBank = (bankData.bankAccounts || []).find((b: any) => b.is_active) || bankData.bankAccounts[0];
  105 | 
  106 |     // 3. Post order
  107 |     const orderRes = await request.post("/api/orders", {
  108 |       data: {
  109 |         items: [{ productId: targetProduct.id, quantity: 2 }],
  110 |         bankAccountId: targetBank.id,
  111 |         deliveryAddress: "Bole Medhanialem, Addis Ababa",
  112 |         phone: "0911223344",
  113 |         notes: "Automated E2E Test Order with Custom Printing",
  114 |         paymentProofPath: "payment-proofs/test_receipt.jpg",
  115 |       },
  116 |     });
  117 | 
  118 |     const orderData = await orderRes.json();
  119 |     expect(orderRes.ok()).toBeTruthy();
  120 |     expect(orderData.order).toBeDefined();
  121 |     expect(orderData.order.status).toMatch(/^pending/);
  122 |     expect(Number(orderData.order.total_price)).toBe(Number(targetProduct.price) * 2);
  123 |   });
  124 | 
  125 |   // 5. Customer registers for class session -> atomic capacity RPC decrements spots
  126 |   test("5. Class session atomic registration and overcapacity protection", async ({ request }) => {
  127 |     // Login as customer
  128 |     await request.post("/api/auth/login", {
  129 |       data: {
  130 |         email: SEED_USERS.customer1.email,
  131 |         password: SEED_USERS.customer1.password,
  132 |       },
  133 |     });
  134 | 
  135 |     // Fetch classes
  136 |     const classesRes = await request.get("/api/classes");
  137 |     const classesData = await classesRes.json();
  138 |     expect(classesData.classes.length).toBeGreaterThan(0);
  139 |     const session = classesData.classes[0];
  140 | 
  141 |     // Register
  142 |     const regRes = await request.post("/api/enrollments", {
  143 |       data: {
  144 |         sessionId: session.id,
  145 |         paymentProofPath: "payment-proofs/workshop_receipt.jpg",
  146 |       },
  147 |     });
  148 |     if (regRes.status() === 400) {
  149 |       const regErr = await regRes.json();
> 150 |       expect(regErr.error).toMatch(/already have an active registration|Session is already full/i);
      |                            ^ Error: expect(received).toMatch(expected)
  151 |     } else {
  152 |       expect(regRes.ok()).toBeTruthy();
  153 |       const regData = await regRes.json();
  154 |       expect(regData.result.success).toBe(true);
  155 |     }
  156 |   });
  157 | 
  158 |   // 6. Admin signs in -> visits /admin, /admin/users, /admin/products, /admin/payments, /admin/orders
  159 |   test("6. Admin portal navigation and management modules", async ({ page }) => {
  160 |     await page.goto("/login");
  161 |     await page.fill('input[type="email"]', SEED_USERS.admin.email);
  162 |     await page.fill('input[type="password"]', SEED_USERS.admin.password);
  163 |     await page.click('button[type="submit"]');
  164 | 
  165 |     await expect(page).toHaveURL(/\/admin/);
  166 |     await expect(page.locator("h1")).toContainText(/Factory Management Hub|Plant Operations|Manufacturing & Academy Operations/i);
  167 | 
  168 |     // Visit /admin/users
  169 |     await page.goto("/admin/users");
  170 |     await expect(page.locator("h1")).toContainText(/User Accounts & Permissions|Platform Users & Staff/i);
  171 | 
  172 |     // Visit /admin/products
  173 |     await page.goto("/admin/products");
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
```