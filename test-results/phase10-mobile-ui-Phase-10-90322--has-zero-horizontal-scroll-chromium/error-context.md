# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase10-mobile-ui.spec.ts >> Phase 10: Mobile Responsiveness & Zero Horizontal Overflow >> Standard Android (360x780) Viewport Checks >> customer dashboard orders view has zero horizontal scroll
- Location: tests\e2e\phase10-mobile-ui.spec.ts:87:11

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - navigation [ref=e4]:
      - link "Arenguade Artisanal Packaging & Craft Academy Arenguade" [ref=e5] [cursor=pointer]:
        - /url: /
        - img "Arenguade Artisanal Packaging & Craft Academy" [ref=e7]
        - generic [ref=e8]: Arenguade
      - generic [ref=e10]:
        - button "Toggle language" [ref=e11] [cursor=pointer]:
          - generic [ref=e16]: አማ
        - button "Toggle navigation" [ref=e17] [cursor=pointer]
  - navigation "Public Mobile Navigation" [ref=e19]:
    - generic [ref=e20]:
      - link "Home" [ref=e21] [cursor=pointer]:
        - /url: /
      - link "Bags" [ref=e27] [cursor=pointer]:
        - /url: /products
      - link "3D Studio" [ref=e33] [cursor=pointer]:
        - /url: /design-submission
      - link "Academy" [ref=e39] [cursor=pointer]:
        - /url: /learn/schedule
      - link "Portal" [ref=e44] [cursor=pointer]:
        - /url: /dashboard
  - main [ref=e50]:
    - generic [ref=e52]:
      - generic [ref=e53]:
        - link [ref=e54] [cursor=pointer]:
          - /url: /
          - img "Arenguade Artisanal Kraft Packaging & Craft Academy" [ref=e55]
        - generic [ref=e56]: Ethiopian Packaging Guild
        - heading "Welcome Back" [level=1] [ref=e61]
        - paragraph [ref=e62]: Sign in to access your role-specific dashboard and tools.
      - generic [ref=e63]: Unable to authenticate with remote service.
      - generic [ref=e68]:
        - generic [ref=e69]:
          - generic [ref=e70]: Email Address
          - textbox "you@domain.et" [ref=e71]: customer.selam@gmail.com
        - generic [ref=e72]:
          - generic [ref=e73]:
            - generic [ref=e74]: Password
            - link "Forgot password?" [ref=e75] [cursor=pointer]:
              - /url: /forgot-password
          - textbox "••••••••" [ref=e76]: Password123!
        - button "Sign In to Portal" [ref=e77] [cursor=pointer]
      - generic [ref=e81]:
        - paragraph [ref=e82]: Role-Based Demo Access
        - generic [ref=e83]:
          - button [ref=e84] [cursor=pointer]:
            - generic [ref=e88]:
              - paragraph [ref=e89]: Admin
              - paragraph [ref=e90]: Abebe Admin
          - button [ref=e91] [cursor=pointer]:
            - generic [ref=e94]:
              - paragraph [ref=e95]: Teacher
              - paragraph [ref=e96]: Tigist Tadesse
          - button [ref=e97] [cursor=pointer]:
            - generic [ref=e102]:
              - paragraph [ref=e103]: Customer
              - paragraph [ref=e104]: Selam Kebede
      - generic [ref=e105]:
        - generic [ref=e106]:
          - text: Don't have an account?
          - link "Create buyer or student account" [ref=e107] [cursor=pointer]:
            - /url: /signup
        - generic [ref=e108]: "Plant Administrators: Access is authenticated via your registered admin account."
  - contentinfo [ref=e113]:
    - generic [ref=e114]:
      - generic [ref=e115]:
        - generic [ref=e116]:
          - generic [ref=e117]:
            - img "Arenguade Packaging & Craft Academy" [ref=e119]
            - generic [ref=e120]:
              - generic [ref=e121]: Arenguade
              - generic [ref=e122]: Artisanal Kraft Packaging & Craft Academy
          - paragraph [ref=e123]: Pioneering circular eco-packaging in East Africa. We manufacture 100% biodegradable kraft bags and empower Ethiopian youth and women through vocational paper-crafting academies.
          - generic [ref=e124]:
            - generic [ref=e125]: Zero Plastic Initiative
            - generic [ref=e129]: ISO 14001 Compliant
          - generic [ref=e133]:
            - link "Telegram Channel" [ref=e134] [cursor=pointer]:
              - /url: https://t.me/arenguade_official
            - link "Instagram" [ref=e138] [cursor=pointer]:
              - /url: https://instagram.com/arenguade
        - generic [ref=e141]:
          - heading "Catalog & B2B" [level=4] [ref=e142]
          - list [ref=e143]:
            - listitem [ref=e144]:
              - link "Specialty Coffee Bags" [ref=e145] [cursor=pointer]:
                - /url: /products
            - listitem [ref=e146]:
              - link "Luxury Boutique Totes" [ref=e147] [cursor=pointer]:
                - /url: /products
            - listitem [ref=e148]:
              - link "Bakery & Food Pouches" [ref=e149] [cursor=pointer]:
                - /url: /products
            - listitem [ref=e150]:
              - link "Heavy-Duty Kraft Sacks" [ref=e151] [cursor=pointer]:
                - /url: /products
            - listitem [ref=e152]:
              - link "Custom 3D Lab" [ref=e153] [cursor=pointer]:
                - /url: /design-submission
        - generic [ref=e157]:
          - heading "Craft Academy" [level=4] [ref=e158]
          - list [ref=e159]:
            - listitem [ref=e160]:
              - link "Curriculum Overview" [ref=e161] [cursor=pointer]:
                - /url: /learn
            - listitem [ref=e162]:
              - link "In-Person Studio (Addis)" [ref=e163] [cursor=pointer]:
                - /url: /learn/schedule
            - listitem [ref=e164]:
              - link "LiveKit Online Classes Live" [ref=e165] [cursor=pointer]:
                - /url: /learn/schedule
                - text: LiveKit Online Classes
                - generic [ref=e166]: Live
            - listitem [ref=e167]:
              - link "Corporate Team Workshops" [ref=e168] [cursor=pointer]:
                - /url: /learn
            - listitem [ref=e169]:
              - link "Artisan Apprenticeship" [ref=e170] [cursor=pointer]:
                - /url: /learn
        - generic [ref=e171]:
          - heading "Headquarters & Desk" [level=4] [ref=e172]
          - list [ref=e173]:
            - listitem [ref=e174]:
              - generic [ref=e178]: Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia
            - listitem [ref=e179]:
              - generic [ref=e182]: +251 911 223 344
            - listitem [ref=e183]:
              - generic [ref=e187]: info@arenguadepaper.com
            - listitem [ref=e188]:
              - link "Request Investor Deck (Q4 2026)" [ref=e189] [cursor=pointer]:
                - /url: mailto:info@arenguadepaper.com?subject=Inquiry%20-%20Arenguade
      - generic [ref=e193]:
        - generic [ref=e194]:
          - generic [ref=e195]: "Verified Banking:"
          - generic [ref=e196]: CBE (Commercial Bank of Ethiopia)
          - generic [ref=e197]: •
          - generic [ref=e198]: Telebirr SuperApp
          - generic [ref=e199]: •
          - generic [ref=e200]: Awash Bank
        - generic [ref=e201]:
          - generic [ref=e202]: © 2026 Ethiopia Arenguade Paper Product.
          - generic [ref=e203]: Crafted with
          - generic [ref=e206]: in Addis Ababa
  - button "Open Next.js Dev Tools" [ref=e212] [cursor=pointer]
  - alert [ref=e216]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { pool } from "../../src/utils/db";
  3   | 
  4   | const MOBILE_VIEWPORTS = [
  5   |   { name: "iPhone SE (375x667)", width: 375, height: 667 },
  6   |   { name: "Standard Android (360x780)", width: 360, height: 780 },
  7   | ];
  8   | 
  9   | test.describe("Phase 10: Mobile Responsiveness & Zero Horizontal Overflow", () => {
  10  |   let activeProductId: string = "";
  11  | 
  12  |   test.beforeAll(async () => {
  13  |     const prodRes = await pool.query(
  14  |       "SELECT id FROM public.products WHERE is_available = true LIMIT 1"
  15  |     );
  16  |     if (prodRes.rows.length > 0) {
  17  |       activeProductId = prodRes.rows[0].id;
  18  |     }
  19  |   });
  20  | 
  21  |   for (const vp of MOBILE_VIEWPORTS) {
  22  |     test.describe(`${vp.name} Viewport Checks`, () => {
  23  |       test.use({ viewport: { width: vp.width, height: vp.height } });
  24  | 
  25  |       test("public home page has zero horizontal scroll", async ({ page }) => {
  26  |         await page.goto("/");
  27  |         await page.waitForLoadState("domcontentloaded");
  28  | 
  29  |         const overflow = await page.evaluate(() => {
  30  |           return document.documentElement.scrollWidth > window.innerWidth;
  31  |         });
  32  |         expect(overflow).toBe(false);
  33  |       });
  34  | 
  35  |       test("product catalog has zero horizontal scroll", async ({ page }) => {
  36  |         await page.goto("/products");
  37  |         await page.waitForLoadState("domcontentloaded");
  38  | 
  39  |         const overflow = await page.evaluate(() => {
  40  |           return document.documentElement.scrollWidth > window.innerWidth;
  41  |         });
  42  |         expect(overflow).toBe(false);
  43  |       });
  44  | 
  45  |       test("product detail page has zero horizontal scroll", async ({ page }) => {
  46  |         if (!activeProductId) return;
  47  |         await page.goto(`/products/${activeProductId}`);
  48  |         await page.waitForLoadState("domcontentloaded");
  49  | 
  50  |         const overflow = await page.evaluate(() => {
  51  |           return document.documentElement.scrollWidth > window.innerWidth;
  52  |         });
  53  |         expect(overflow).toBe(false);
  54  |       });
  55  | 
  56  |       test("checkout page has zero horizontal scroll and fits viewport", async ({ page }) => {
  57  |         // Go to products and add item to cart via local storage or navigation
  58  |         await page.goto("/checkout");
  59  |         await page.waitForLoadState("domcontentloaded");
  60  | 
  61  |         const overflow = await page.evaluate(() => {
  62  |           return document.documentElement.scrollWidth > window.innerWidth;
  63  |         });
  64  |         expect(overflow).toBe(false);
  65  |       });
  66  | 
  67  |       test("learn & workshop calendar page has zero horizontal scroll", async ({ page }) => {
  68  |         await page.goto("/learn/schedule");
  69  |         await page.waitForLoadState("domcontentloaded");
  70  | 
  71  |         const overflow = await page.evaluate(() => {
  72  |           return document.documentElement.scrollWidth > window.innerWidth;
  73  |         });
  74  |         expect(overflow).toBe(false);
  75  |       });
  76  | 
  77  |       test("customer login page has zero horizontal scroll", async ({ page }) => {
  78  |         await page.goto("/login");
  79  |         await page.waitForLoadState("domcontentloaded");
  80  | 
  81  |         const overflow = await page.evaluate(() => {
  82  |           return document.documentElement.scrollWidth > window.innerWidth;
  83  |         });
  84  |         expect(overflow).toBe(false);
  85  |       });
  86  | 
  87  |       test("customer dashboard orders view has zero horizontal scroll", async ({ page }) => {
  88  |         // Log in as customer
  89  |         await page.goto("/login");
  90  |         await page.fill('input[type="email"]', "customer.selam@gmail.com");
  91  |         await page.fill('input[type="password"]', "Password123!");
  92  |         await page.click('button[type="submit"]');
> 93  |         await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });
      |                    ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  94  | 
  95  |         await page.goto("/dashboard/orders");
  96  |         await page.waitForLoadState("domcontentloaded");
  97  | 
  98  |         const overflow = await page.evaluate(() => {
  99  |           return document.documentElement.scrollWidth > window.innerWidth;
  100 |         });
  101 |         expect(overflow).toBe(false);
  102 |       });
  103 | 
  104 |       test("customer custom designs view has zero horizontal scroll", async ({ page }) => {
  105 |         await page.goto("/dashboard/designs");
  106 |         await page.waitForLoadState("domcontentloaded");
  107 | 
  108 |         const overflow = await page.evaluate(() => {
  109 |           return document.documentElement.scrollWidth > window.innerWidth;
  110 |         });
  111 |         expect(overflow).toBe(false);
  112 |       });
  113 |     });
  114 |   }
  115 | });
  116 | 
```