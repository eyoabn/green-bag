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

test.describe("Phase 2: Auth, Roles, Middleware & Navigation", () => {

  // 1. New signup becomes role customer and lands on /dashboard
  test("1. New signup becomes role customer and lands on /dashboard", async ({ page, request }) => {
    const timestamp = Date.now();
    const uniqueEmail = `p2.customer.${timestamp}@testgreenwork.com`;
    const password = "Password123!";
    const fullName = "Phase Two Customer";
    const phone = "0912345678";

    await page.goto("/signup");
    await page.fill('input[type="text"]', fullName);
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="tel"]', phone);
    await page.fill('input[type="password"]', password);

    await page.click('button[type="submit"]');

    // Should redirect to /dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify role in PostgreSQL profiles via login API
    const loginRes = await request.post("/api/auth/login", {
      data: { email: uniqueEmail, password },
    });
    const loginData = await loginRes.json();
    expect(loginRes.ok()).toBeTruthy();
    expect(loginData.user.role).toBe("customer");
  });

  // 2. Customer visiting /admin and /teacher is redirected
  test("2. Customer visiting /admin and /teacher is redirected to /dashboard", async ({ page }) => {
    // Sign in as customer
    await page.goto("/login");
    await page.fill('input[type="email"]', SEED_USERS.customer1.email);
    await page.fill('input[type="password"]', SEED_USERS.customer1.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Customer attempts to navigate to /admin -> should be redirected to /dashboard
    await page.goto("/admin");
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // Customer attempts to navigate to /teacher -> should be redirected to /dashboard
    await page.goto("/teacher");
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // 3. Teacher visiting /admin is redirected; teacher reaching /teacher works
  test("3. Teacher visiting /admin is redirected; teacher reaching /teacher works", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', SEED_USERS.teacher.email);
    await page.fill('input[type="password"]', SEED_USERS.teacher.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/teacher/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/teacher/);

    // Teacher visits /admin -> redirected to /teacher
    await page.goto("/admin");
    await page.waitForURL(/\/teacher/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/teacher/);
  });

  // 4. Admin can reach all three areas (/admin, /teacher, /dashboard)
  test("4. Admin can reach all three areas (/admin, /teacher, /dashboard)", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', SEED_USERS.admin.email);
    await page.fill('input[type="password"]', SEED_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin/);

    // Admin can visit /teacher
    await page.goto("/teacher");
    await page.waitForURL(/\/teacher/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/teacher/);

    // Admin can visit /dashboard
    await page.goto("/dashboard");
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // 5. Customer attempting to PATCH their own role via API fails
  test("5. Customer attempting to PATCH their own role via API fails", async ({ request }) => {
    // Log in as customer
    await request.post("/api/auth/login", {
      data: {
        email: SEED_USERS.customer1.email,
        password: SEED_USERS.customer1.password,
      },
    });

    // 1. Try to escalate via admin users API -> 403 Forbidden
    const adminApiRes = await request.patch("/api/admin/users", {
      data: { id: "self", role: "admin" },
    });
    expect(adminApiRes.status()).toBe(403);

    // 2. Try to pass role field to /api/profile -> role must remain customer
    const profileRes = await request.patch("/api/profile", {
      data: { fullName: "Selam Updated", role: "admin" },
    });
    expect(profileRes.ok()).toBeTruthy();
    const profileData = await profileRes.json();
    expect(profileData.profile.role).toBe("customer");
  });

  // 6. Deactivated user cannot log in
  test("6. Deactivated user cannot log in", async ({ request }) => {
    const { pool } = await import("../../src/utils/db");

    // Deactivate customer2 temporarily
    await pool.query(
      "UPDATE public.profiles SET is_active = false WHERE id = (SELECT id FROM auth.users WHERE email = $1)",
      [SEED_USERS.customer2.email]
    );

    try {
      const res = await request.post("/api/auth/login", {
        data: {
          email: SEED_USERS.customer2.email,
          password: SEED_USERS.customer2.password,
        },
      });
      expect(res.status()).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("deactivated");
    } finally {
      // Re-activate customer2
      await pool.query(
        "UPDATE public.profiles SET is_active = true WHERE id = (SELECT id FROM auth.users WHERE email = $1)",
        [SEED_USERS.customer2.email]
      );
    }
  });

  // 7. Logout then back button does not show protected content
  test("7. Logout then navigating to protected route redirects to login", async ({ page }) => {
    // Log in as customer
    await page.goto("/login");
    await page.fill('input[type="email"]', SEED_USERS.customer1.email);
    await page.fill('input[type="password"]', SEED_USERS.customer1.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Log out via API / client
    await page.goto("/dashboard");
    const logoutBtn = page.locator("button:has-text('Sign Out'), button:has-text('Logout')").first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
      await page.goto("/login");
    }

    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Try navigating back to /dashboard
    await page.goto("/dashboard");
    await page.waitForURL(/\/login\?returnTo=%2Fdashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fdashboard/);
  });

  // 8. Password reset flow: forgot-password and reset-password forms
  test("8. Password reset flow: /forgot-password and /reset-password pages function", async ({ page, request }) => {
    const testResetEmail = `reset.customer.${Date.now()}@testgreenwork.com`;

    // 1. Visit /forgot-password
    await page.goto("/forgot-password");
    await expect(page.locator("h1")).toContainText(/Reset Password/i);

    // Submit email on page
    await page.fill('input[type="email"]', testResetEmail);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=dispatched")).toBeVisible();

    // 2. Direct API test of forgot password endpoint with another unique email
    const apiResetEmail = `api.reset.${Date.now()}@testgreenwork.com`;
    const forgotRes = await request.post("/api/auth/forgot-password", {
      data: { email: apiResetEmail },
    });
    expect(forgotRes.ok()).toBeTruthy();
    const forgotData = await forgotRes.json();
    expect(forgotData.success).toBe(true);

    // 3. Visit /reset-password
    await page.goto("/reset-password");
    await expect(page.locator("h1")).toContainText(/Set New Password/i);
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  // 9. Profile management: edit name, phone, and view read-only role
  test("9. Profile page: view read-only role and update contact information", async ({ page }) => {
    // Log in as teacher
    await page.goto("/login");
    await page.fill('input[type="email"]', SEED_USERS.teacher.email);
    await page.fill('input[type="password"]', SEED_USERS.teacher.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/teacher/, { timeout: 15000 });

    // Navigate to /profile
    await page.goto("/profile");
    await page.waitForURL(/\/profile/, { timeout: 15000 });

    // Check read-only role
    await expect(page.locator("text=Role: TEACHER")).toBeVisible();
    const roleInput = page.locator('input[value="TEACHER"]');
    await expect(roleInput).toBeDisabled();

    // Edit full name
    const newName = `Tigist Tadesse ${Date.now().toString().slice(-4)}`;
    await page.fill('input[placeholder="Abebe Bikila"]', newName);
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Profile updated successfully")).toBeVisible();

    // Verify change in DB via page.request (inherits browser session cookies)
    const verifyRes = await page.request.get("/api/profile");
    expect(verifyRes.ok()).toBeTruthy();
    const verifyData = await verifyRes.json();
    expect(verifyData.profile.fullName).toBe(newName);
    expect(verifyData.profile.role).toBe("teacher");
  });

});
