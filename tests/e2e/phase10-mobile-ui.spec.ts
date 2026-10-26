import { test, expect } from "@playwright/test";
import { pool } from "../../src/utils/db";

const MOBILE_VIEWPORTS = [
  { name: "iPhone SE (375x667)", width: 375, height: 667 },
  { name: "Standard Android (360x780)", width: 360, height: 780 },
];

test.describe("Phase 10: Mobile Responsiveness & Zero Horizontal Overflow", () => {
  let activeProductId: string = "";

  test.beforeAll(async () => {
    const prodRes = await pool.query(
      "SELECT id FROM public.products WHERE is_available = true LIMIT 1"
    );
    if (prodRes.rows.length > 0) {
      activeProductId = prodRes.rows[0].id;
    }
  });

  for (const vp of MOBILE_VIEWPORTS) {
    test.describe(`${vp.name} Viewport Checks`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test("public home page has zero horizontal scroll", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("domcontentloaded");

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);
      });

      test("product catalog has zero horizontal scroll", async ({ page }) => {
        await page.goto("/products");
        await page.waitForLoadState("domcontentloaded");

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);
      });

      test("product detail page has zero horizontal scroll", async ({ page }) => {
        if (!activeProductId) return;
        await page.goto(`/products/${activeProductId}`);
        await page.waitForLoadState("domcontentloaded");

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);
      });

      test("checkout page has zero horizontal scroll and fits viewport", async ({ page }) => {
        // Go to products and add item to cart via local storage or navigation
        await page.goto("/checkout");
        await page.waitForLoadState("domcontentloaded");

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);
      });

      test("learn & workshop calendar page has zero horizontal scroll", async ({ page }) => {
        await page.goto("/learn/schedule");
        await page.waitForLoadState("domcontentloaded");

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);
      });

      test("customer login page has zero horizontal scroll", async ({ page }) => {
        await page.goto("/login");
        await page.waitForLoadState("domcontentloaded");

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);
      });

      test("customer dashboard orders view has zero horizontal scroll", async ({ page }) => {
        // Log in as customer
        await page.goto("/login");
        await page.fill('input[type="email"]', "customer.selam@gmail.com");
        await page.fill('input[type="password"]', "Password123!");
        await page.click('button[type="submit"]');
        await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10000 });

        await page.goto("/dashboard/orders");
        await page.waitForLoadState("domcontentloaded");

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);
      });

      test("customer custom designs view has zero horizontal scroll", async ({ page }) => {
        await page.goto("/dashboard/designs");
        await page.waitForLoadState("domcontentloaded");

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);
      });
    });
  }
});
