import { test, expect } from "@playwright/test";
import { Client } from "pg";

const directUrl =
  process.env.DIRECT_URL ||
  "postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

const TEST_USERS = {
  admin: { email: "admin@arenguade.com", password: "Password123!" },
  teacherDawit: { email: "teacher.dawit@arenguade.com", password: "Password123!" },
  teacherTigist: { email: "teacher.tigist@arenguade.com", password: "Password123!" },
  customerSelam: { email: "customer.selam@gmail.com", password: "Password123!" },
  customerTariku: { email: "customer.tariku@gmail.com", password: "Password123!" },
};

async function getDbClient() {
  const client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

test.describe("Phase 6: Classes and Enrollment", () => {
  // Helper to log in a user and return cookie headers
  async function loginUser(request: any, credentials: { email: string; password: string }) {
    const res = await request.post("/api/auth/login", {
      data: credentials,
    });
    expect(res.ok()).toBeTruthy();
    return res;
  }

  test("1. Last-seat race with two customers: exactly one succeeds, the other sees 'full'", async ({
    playwright,
  }) => {
    const db = await getDbClient();

    // 1. Create a class session with capacity = 1 in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const startsAt = futureDate.toISOString();

    const teacherRes = await db.query(
      "SELECT id FROM public.profiles WHERE email = $1",
      [TEST_USERS.teacherDawit.email]
    );
    const teacherId = teacherRes.rows[0].id;

    const classInsert = await db.query(
      `INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, capacity, price, status, teacher_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, title`,
      [
        "live",
        `Race Test Masterclass ${Date.now()}`,
        "Concurrency race condition verification",
        "LiveKit Classroom",
        startsAt,
        1, // EXACTLY 1 SEAT
        250,
        "scheduled",
        teacherId,
      ]
    );
    const testSession = classInsert.rows[0];

    try {
      // 2. Initialize two isolated browser request contexts for Customer Selam and Customer Tariku
      const contextSelam = await playwright.request.newContext();
      const contextTariku = await playwright.request.newContext();

      await loginUser(contextSelam, TEST_USERS.customerSelam);
      await loginUser(contextTariku, TEST_USERS.customerTariku);

      // 3. Fire concurrent enrollment requests simultaneously
      const [res1, res2] = await Promise.all([
        contextSelam.post("/api/enrollments", {
          data: {
            sessionId: testSession.id,
            paymentProofPath: "proofs/selam_race_receipt.png",
          },
        }),
        contextTariku.post("/api/enrollments", {
          data: {
            sessionId: testSession.id,
            paymentProofPath: "proofs/tariku_race_receipt.png",
          },
        }),
      ]);

      const [status1, status2] = [res1.status(), res2.status()];
      const [data1, data2] = [await res1.json(), await res2.json()];

      // Exactly one must succeed (200) and one must be rejected (400)
      const successCount = [status1, status2].filter((s) => s === 200).length;
      const fullCount = [status1, status2].filter((s) => s === 400).length;

      expect(successCount).toBe(1);
      expect(fullCount).toBe(1);

      // The failed request must indicate that the session is full
      const failedData = status1 === 400 ? data1 : data2;
      expect(failedData.error.toLowerCase()).toContain("full");

      // Verify DB enrollments count is exactly 1
      const countRes = await db.query(
        "SELECT COUNT(*) FROM public.enrollments WHERE session_id = $1",
        [testSession.id]
      );
      expect(parseInt(countRes.rows[0].count, 10)).toBe(1);
    } finally {
      // Cleanup
      await db.query("DELETE FROM public.enrollments WHERE session_id = $1", [testSession.id]);
      await db.query("DELETE FROM public.class_sessions WHERE id = $1", [testSession.id]);
      await db.end();
    }
  });

  test("2. Duplicate registration blocked for same customer", async ({ playwright }) => {
    const db = await getDbClient();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const startsAt = futureDate.toISOString();

    const classInsert = await db.query(
      `INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, capacity, price, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        "in_person",
        `Duplicate Test Class ${Date.now()}`,
        "Testing duplicate prevention",
        "Addis Ababa Studio",
        startsAt,
        10,
        150,
        "scheduled",
      ]
    );
    const testSession = classInsert.rows[0];

    try {
      const context = await playwright.request.newContext();
      await loginUser(context, TEST_USERS.customerSelam);

      // First registration -> succeeds
      const firstRes = await context.post("/api/enrollments", {
        data: {
          sessionId: testSession.id,
          paymentProofPath: "proofs/selam_receipt_1.png",
        },
      });
      expect(firstRes.status()).toBe(200);

      // Second registration -> blocked
      const secondRes = await context.post("/api/enrollments", {
        data: {
          sessionId: testSession.id,
          paymentProofPath: "proofs/selam_receipt_2.png",
        },
      });
      expect(secondRes.status()).toBe(400);
      const secondData = await secondRes.json();
      expect(secondData.error.toLowerCase()).toContain("already");
    } finally {
      await db.query("DELETE FROM public.enrollments WHERE session_id = $1", [testSession.id]);
      await db.query("DELETE FROM public.class_sessions WHERE id = $1", [testSession.id]);
      await db.end();
    }
  });

  test("3. Past sessions are not registerable", async ({ playwright }) => {
    const db = await getDbClient();

    // Create session that started 2 hours ago
    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const classInsert = await db.query(
      `INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, capacity, price, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        "in_person",
        `Past Workshop ${Date.now()}`,
        "Workshop in the past",
        "Addis Ababa Studio",
        pastDate,
        20,
        200,
        "scheduled",
      ]
    );
    const testSession = classInsert.rows[0];

    try {
      const context = await playwright.request.newContext();
      await loginUser(context, TEST_USERS.customerTariku);

      const res = await context.post("/api/enrollments", {
        data: {
          sessionId: testSession.id,
          paymentProofPath: "proofs/past_receipt.png",
        },
      });
      expect(res.status()).toBe(400);
      const data = await res.json();
      expect(data.error.toLowerCase()).toContain("past");
    } finally {
      await db.query("DELETE FROM public.class_sessions WHERE id = $1", [testSession.id]);
      await db.end();
    }
  });

  test("4. Teacher A cannot see or fetch Teacher B's roster (API returns 403 / empty)", async ({
    playwright,
  }) => {
    const db = await getDbClient();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const startsAt = futureDate.toISOString();

    const dawitRes = await db.query("SELECT id FROM public.profiles WHERE email = $1", [
      TEST_USERS.teacherDawit.email,
    ]);
    const tigistRes = await db.query("SELECT id FROM public.profiles WHERE email = $1", [
      TEST_USERS.teacherTigist.email,
    ]);
    const dawitId = dawitRes.rows[0].id;
    const tigistId = tigistRes.rows[0].id;

    // Create session assigned to Teacher Tigist
    const tigistSession = (
      await db.query(
        `INSERT INTO public.class_sessions (
          type, title, description, location, starts_at, capacity, price, status, teacher_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
          "live",
          `Teacher Tigist Workshop ${Date.now()}`,
          "Masterclass by Tigist",
          "LiveKit Room",
          startsAt,
          20,
          300,
          "scheduled",
          tigistId,
        ]
      )
    ).rows[0];

    // Enroll a student in Teacher Tigist's session
    const customerRes = await db.query("SELECT id FROM public.profiles WHERE email = $1", [
      TEST_USERS.customerSelam.email,
    ]);
    const customerId = customerRes.rows[0].id;

    await db.query(
      `INSERT INTO public.enrollments (session_id, student_id, status, payment_proof_path)
       VALUES ($1, $2, $3, $4)`,
      [tigistSession.id, customerId, "approved", "proofs/tigist_student.png"]
    );

    try {
      // 1. Teacher Dawit attempts to fetch Teacher Tigist's session roster
      const dawitContext = await playwright.request.newContext();
      await loginUser(dawitContext, TEST_USERS.teacherDawit);

      // Attempt /api/enrollments?sessionId=<Tigist Session>
      const dawitEnrollRes = await dawitContext.get(
        `/api/enrollments?sessionId=${tigistSession.id}`
      );
      // Must return HTTP 403 Forbidden
      expect(dawitEnrollRes.status()).toBe(403);

      // Attempt /api/classes/<Tigist Session>
      const dawitClassRes = await dawitContext.get(`/api/classes/${tigistSession.id}`);
      expect(dawitClassRes.ok()).toBeTruthy();
      const dawitClassData = await dawitClassRes.json();
      // Enrollments roster must be empty for Teacher Dawit
      expect(dawitClassData.session.enrollments).toHaveLength(0);

      // 2. Teacher Tigist fetches her own session roster -> succeeds
      const tigistContext = await playwright.request.newContext();
      await loginUser(tigistContext, TEST_USERS.teacherTigist);

      const tigistEnrollRes = await tigistContext.get(
        `/api/enrollments?sessionId=${tigistSession.id}`
      );
      expect(tigistEnrollRes.ok()).toBeTruthy();
      const tigistEnrollData = await tigistEnrollRes.json();
      expect(tigistEnrollData.enrollments.length).toBeGreaterThan(0);
      expect(tigistEnrollData.enrollments[0].student_id).toBe(customerId);
    } finally {
      await db.query("DELETE FROM public.enrollments WHERE session_id = $1", [tigistSession.id]);
      await db.query("DELETE FROM public.class_sessions WHERE id = $1", [tigistSession.id]);
      await db.end();
    }
  });

  test("5. Customer cannot approve an enrollment, cannot see other students' rosters", async ({
    playwright,
  }) => {
    const db = await getDbClient();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 8);
    const startsAt = futureDate.toISOString();

    // Create session and enroll Customer Tariku
    const sessionRes = (
      await db.query(
        `INSERT INTO public.class_sessions (
          type, title, description, location, starts_at, capacity, price, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`,
        [
          "in_person",
          `Customer Roster Test ${Date.now()}`,
          "Isolation test",
          "Addis Studio",
          startsAt,
          15,
          100,
          "scheduled",
        ]
      )
    ).rows[0];

    const tarikuRes = await db.query("SELECT id FROM public.profiles WHERE email = $1", [
      TEST_USERS.customerTariku.email,
    ]);
    const tarikuId = tarikuRes.rows[0].id;

    const enrInsert = await db.query(
      `INSERT INTO public.enrollments (session_id, student_id, status)
       VALUES ($1, $2, $3) RETURNING id`,
      [sessionRes.id, tarikuId, "pending_verification"]
    );
    const enrollmentId = enrInsert.rows[0].id;

    try {
      // Login as Customer Selam (different customer)
      const selamContext = await playwright.request.newContext();
      await loginUser(selamContext, TEST_USERS.customerSelam);

      // Customer Selam attempts to approve Customer Tariku's enrollment -> 403 Forbidden
      const approveRes = await selamContext.patch("/api/enrollments", {
        data: {
          enrollmentId,
          action: "approve",
        },
      });
      expect(approveRes.status()).toBe(403);

      // Customer Selam calls GET /api/classes/[id] -> does not leak other students' roster
      const classRes = await selamContext.get(`/api/classes/${sessionRes.id}`);
      expect(classRes.ok()).toBeTruthy();
      const classData = await classRes.json();
      expect(classData.session.enrollments).toHaveLength(0); // Selam is not enrolled, so 0 visible
    } finally {
      await db.query("DELETE FROM public.enrollments WHERE session_id = $1", [sessionRes.id]);
      await db.query("DELETE FROM public.class_sessions WHERE id = $1", [sessionRes.id]);
      await db.end();
    }
  });

  test("6. Admin cancelling a class notifies enrolled students", async ({ playwright }) => {
    const db = await getDbClient();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 12);
    const startsAt = futureDate.toISOString();

    const sessionRes = (
      await db.query(
        `INSERT INTO public.class_sessions (
          type, title, description, location, starts_at, capacity, price, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, title`,
        [
          "live",
          `Class to be Cancelled ${Date.now()}`,
          "Testing cancellation notification",
          "LiveKit Room",
          startsAt,
          25,
          200,
          "scheduled",
        ]
      )
    ).rows[0];

    const customerRes = await db.query("SELECT id FROM public.profiles WHERE email = $1", [
      TEST_USERS.customerSelam.email,
    ]);
    const customerId = customerRes.rows[0].id;

    // Enroll Customer Selam
    await db.query(
      `INSERT INTO public.enrollments (session_id, student_id, status)
       VALUES ($1, $2, $3)`,
      [sessionRes.id, customerId, "pending_verification"]
    );

    try {
      // Admin logs in and cancels session via PATCH /api/classes/[id]
      const adminContext = await playwright.request.newContext();
      await loginUser(adminContext, TEST_USERS.admin);

      const cancelRes = await adminContext.patch(`/api/classes/${sessionRes.id}`, {
        data: { status: "cancelled" },
      });
      expect(cancelRes.ok()).toBeTruthy();

      // Verify that notification was created for Customer Selam
      const notifyRes = await db.query(
        `SELECT id, title, body FROM public.notifications 
         WHERE user_id = $1 AND title ILIKE '%Cancelled%'
         ORDER BY created_at DESC LIMIT 1`,
        [customerId]
      );

      expect(notifyRes.rows.length).toBe(1);
      expect(notifyRes.rows[0].title).toContain("Class Cancelled");
      expect(notifyRes.rows[0].title).toContain(sessionRes.title);
    } finally {
      await db.query("DELETE FROM public.notifications WHERE user_id = $1", [customerId]);
      await db.query("DELETE FROM public.enrollments WHERE session_id = $1", [sessionRes.id]);
      await db.query("DELETE FROM public.class_sessions WHERE id = $1", [sessionRes.id]);
      await db.end();
    }
  });

  test("7. Attendance saved and visible to admin", async ({ playwright }) => {
    const db = await getDbClient();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);
    const startsAt = futureDate.toISOString();

    const dawitRes = await db.query("SELECT id FROM public.profiles WHERE email = $1", [
      TEST_USERS.teacherDawit.email,
    ]);
    const teacherId = dawitRes.rows[0].id;

    // Create session assigned to Teacher Dawit
    const sessionRes = (
      await db.query(
        `INSERT INTO public.class_sessions (
          type, title, description, location, starts_at, capacity, price, status, teacher_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
          "in_person",
          `Attendance Workshop ${Date.now()}`,
          "Testing attendance tracking",
          "Studio Bole",
          startsAt,
          20,
          150,
          "scheduled",
          teacherId,
        ]
      )
    ).rows[0];

    const customerRes = await db.query("SELECT id FROM public.profiles WHERE email = $1", [
      TEST_USERS.customerSelam.email,
    ]);
    const customerId = customerRes.rows[0].id;

    // Enroll and approve Customer Selam
    const enrRes = await db.query(
      `INSERT INTO public.enrollments (session_id, student_id, status, attended)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [sessionRes.id, customerId, "approved", false]
    );
    const enrollmentId = enrRes.rows[0].id;

    try {
      // 1. Teacher Dawit logs in and marks attendance
      const teacherContext = await playwright.request.newContext();
      await loginUser(teacherContext, TEST_USERS.teacherDawit);

      const attendRes = await teacherContext.patch("/api/enrollments", {
        data: {
          enrollmentId,
          action: "attendance",
          attended: true,
        },
      });
      expect(attendRes.ok()).toBeTruthy();
      const attendData = await attendRes.json();
      expect(attendData.enrollment.attended).toBe(true);

      // 2. Admin logs in and inspects roster
      const adminContext = await playwright.request.newContext();
      await loginUser(adminContext, TEST_USERS.admin);

      const adminClassRes = await adminContext.get(`/api/classes/${sessionRes.id}`);
      expect(adminClassRes.ok()).toBeTruthy();
      const adminClassData = await adminClassRes.json();

      const enrolledStudent = adminClassData.session.enrollments.find(
        (e: any) => e.id === enrollmentId
      );
      expect(enrolledStudent).toBeDefined();
      expect(enrolledStudent.attended).toBe(true);
    } finally {
      await db.query("DELETE FROM public.enrollments WHERE session_id = $1", [sessionRes.id]);
      await db.query("DELETE FROM public.class_sessions WHERE id = $1", [sessionRes.id]);
      await db.end();
    }
  });

  test("8. Customer Registration UI, cancellation before approval, and Join Button state", async ({
    page,
    playwright,
  }) => {
    const db = await getDbClient();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 6);
    const startsAt = futureDate.toISOString();

    // Create a live session
    const sessionRes = (
      await db.query(
        `INSERT INTO public.class_sessions (
          type, title, description, location, starts_at, capacity, price, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, title`,
        [
          "live",
          `UI Flow Live Session ${Date.now()}`,
          "Interactive UI verification",
          "LiveKit Classroom",
          startsAt,
          30,
          200,
          "scheduled",
        ]
      )
    ).rows[0];

    try {
      // Set dialog handler globally for this page
      page.on("dialog", (dialog) => dialog.accept());

      // 1. Customer Selam logs in and visits /dashboard/classes
      await page.goto("/login");
      await page.fill('input[type="email"]', TEST_USERS.customerSelam.email);
      await page.fill('input[type="password"]', TEST_USERS.customerSelam.password);
      await page.click('button[type="submit"]');
      await page.waitForURL("**/dashboard**");

      // 2. Register for session via API
      const apiContext = await playwright.request.newContext();
      await loginUser(apiContext, TEST_USERS.customerSelam);

      const regRes = await apiContext.post("/api/enrollments", {
        data: {
          sessionId: sessionRes.id,
          paymentProofPath: "proofs/ui_flow_test.png",
        },
      });
      expect(regRes.ok()).toBeTruthy();

      // 3. Visit /dashboard/classes ("My Classes")
      await page.goto("/dashboard/classes");

      // Verify session card appears with status 'pending verification'
      await expect(page.locator("h2").filter({ hasText: sessionRes.title })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByText(/pending verification/i).first()).toBeVisible();

      // Verify Live join button is disabled with notice
      const joinBtn = page.getByRole("button", { name: /verification pending/i });
      await expect(joinBtn).toBeDisabled();

      // 4. Cancel registration while pending_verification
      const sessionCard = page.locator("div.bg-white").filter({ hasText: sessionRes.title }).first();
      const cancelBtn = sessionCard.getByRole("button", { name: /cancel seat/i });
      await expect(cancelBtn).toBeVisible();

      await cancelBtn.click();

      // Confirm toast / status message and that status updates to cancelled
      await expect(page.getByText(/registration cancelled successfully/i)).toBeVisible({ timeout: 10000 });
      await expect(sessionCard.getByText(/cancelled/i)).toBeVisible({ timeout: 10000 });
    } finally {
      await db.query("DELETE FROM public.enrollments WHERE session_id = $1", [sessionRes.id]);
      await db.query("DELETE FROM public.class_sessions WHERE id = $1", [sessionRes.id]);
      await db.end();
    }
  });
});
