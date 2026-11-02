# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase10-mobile-ui.spec.ts >> Phase 10: Mobile Responsiveness & Zero Horizontal Overflow >> Standard Android (360x780) Viewport Checks >> customer custom designs view has zero horizontal scroll
- Location: tests\e2e\phase10-mobile-ui.spec.ts:104:11

# Error details

```
error: (EAUTHTIMEOUT) timeout while waiting for message
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
> 13  |     const prodRes = await pool.query(
      |                     ^ error: (EAUTHTIMEOUT) timeout while waiting for message
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
  93  |         await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });
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
```