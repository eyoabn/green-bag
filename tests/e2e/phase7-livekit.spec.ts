import { test, expect } from "@playwright/test";
import { Client } from "pg";
import crypto from "crypto";
import { AccessToken } from "livekit-server-sdk";

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

async function queryDb(sql: string, params: any[] = []) {
  const client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await client.query(sql, params);
  } finally {
    await client.end();
  }
}

function decodeJwtPayload(token: string): any {
  const parts = token.split(".");
  expect(parts.length).toBe(3);
  const payloadBase64 = parts[1];
  const jsonStr = Buffer.from(payloadBase64, "base64url").toString("utf8");
  return JSON.parse(jsonStr);
}

test.describe("Phase 7: LiveKit Live Sessions", () => {
  let teacherDawitId: string;
  let teacherTigistId: string;
  let selamId: string;
  let tarikuId: string;

  test.beforeAll(async () => {
    const dawit = await queryDb("SELECT id FROM public.profiles WHERE email = $1", [TEST_USERS.teacherDawit.email]);
    teacherDawitId = dawit.rows[0].id;
    const tigist = await queryDb("SELECT id FROM public.profiles WHERE email = $1", [TEST_USERS.teacherTigist.email]);
    teacherTigistId = tigist.rows[0].id;
    const selam = await queryDb("SELECT id FROM public.profiles WHERE email = $1", [TEST_USERS.customerSelam.email]);
    selamId = selam.rows[0].id;
    const tariku = await queryDb("SELECT id FROM public.profiles WHERE email = $1", [TEST_USERS.customerTariku.email]);
    tarikuId = tariku.rows[0].id;
  });

  test("1. Unapproved student token request: returns 403", async ({ playwright }) => {
    // Create future session
    const sessRes = await queryDb(
      `INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, capacity, price, status, teacher_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        "live",
        `Unapproved Student Test ${Date.now()}`,
        "Security token guard verification",
        "LiveKit Classroom",
        new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        20,
        300,
        "scheduled",
        teacherDawitId,
      ]
    );
    const sessionId = sessRes.rows[0].id;

    try {
      // Tariku has NO enrollment
      const ctxTariku = await playwright.request.newContext();
      await ctxTariku.post("/api/auth/login", { data: TEST_USERS.customerTariku });

      const tokenRes = await ctxTariku.post(`/api/live/${sessionId}/token`);
      expect(tokenRes.status()).toBe(403);
      const json = await tokenRes.json();
      expect(json.error).toMatch(/Access denied|not enrolled/i);

      // Now create a pending_verification enrollment (not yet approved)
      await queryDb(
        `INSERT INTO public.enrollments (session_id, student_id, status)
         VALUES ($1, $2, 'pending_verification')`,
        [sessionId, tarikuId]
      );

      const tokenResPending = await ctxTariku.post(`/api/live/${sessionId}/token`);
      expect(tokenResPending.status()).toBe(403);
      const jsonPending = await tokenResPending.json();
      expect(jsonPending.error).toMatch(/Access is only granted once payment is verified|pending/i);
    } finally {
      await queryDb("DELETE FROM public.enrollments WHERE session_id = $1", [sessionId]);
      await queryDb("DELETE FROM public.class_sessions WHERE id = $1", [sessionId]);
    }
  });

  test("2. Approved student token decodes to canPublish: false and no roomAdmin", async ({ playwright }) => {
    // Create live session
    const sessRes = await queryDb(
      `INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, capacity, price, status, teacher_id, livekit_room_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, livekit_room_name`,
      [
        "live",
        `Student Token Claims Test ${Date.now()}`,
        "Decode JWT claims",
        "LiveKit Classroom",
        new Date().toISOString(),
        20,
        300,
        "live",
        teacherDawitId,
        `test-room-${Date.now()}`,
      ]
    );
    const sessionId = sessRes.rows[0].id;
    const roomName = sessRes.rows[0].livekit_room_name;

    // Enroll Selam as approved
    await queryDb(
      `INSERT INTO public.enrollments (session_id, student_id, status)
       VALUES ($1, $2, 'approved')`,
      [sessionId, selamId]
    );

    try {
      const ctxSelam = await playwright.request.newContext();
      await ctxSelam.post("/api/auth/login", { data: TEST_USERS.customerSelam });

      const tokenRes = await ctxSelam.post(`/api/live/${sessionId}/token`);
      expect(tokenRes.status()).toBe(200);
      const data = await tokenRes.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();

      // Decode the JWT claims
      const claims = decodeJwtPayload(data.token);
      expect(claims.sub).toBe(selamId);
      expect(claims.video).toBeDefined();
      expect(claims.video.room).toBe(roomName);
      expect(claims.video.roomJoin).toBe(true);
      expect(claims.video.canSubscribe).toBe(true);
      expect(claims.video.canPublishData).toBe(true);
      expect(claims.video.canPublish).toBe(false);
      // Core check: roomAdmin must NOT be set on student token
      expect(claims.video.roomAdmin).toBeUndefined();
    } finally {
      await queryDb("DELETE FROM public.enrollments WHERE session_id = $1", [sessionId]);
      await queryDb("DELETE FROM public.class_sessions WHERE id = $1", [sessionId]);
    }
  });

  test("3. Teacher token decodes to roomAdmin: true and canPublish: true", async ({ playwright }) => {
    const sessRes = await queryDb(
      `INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, capacity, price, status, teacher_id, livekit_room_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, livekit_room_name`,
      [
        "live",
        `Teacher Token Claims Test ${Date.now()}`,
        "Teacher host claims verification",
        "LiveKit Classroom",
        new Date().toISOString(),
        20,
        300,
        "scheduled",
        teacherDawitId,
        `test-teacher-room-${Date.now()}`,
      ]
    );
    const sessionId = sessRes.rows[0].id;
    const roomName = sessRes.rows[0].livekit_room_name;

    try {
      const ctxDawit = await playwright.request.newContext();
      await ctxDawit.post("/api/auth/login", { data: TEST_USERS.teacherDawit });

      const tokenRes = await ctxDawit.post(`/api/live/${sessionId}/token`);
      expect(tokenRes.status()).toBe(200);
      const data = await tokenRes.json();
      expect(data.success).toBe(true);
      expect(data.isHost).toBe(true);

      const claims = decodeJwtPayload(data.token);
      expect(claims.sub).toBe(teacherDawitId);
      expect(claims.video).toBeDefined();
      expect(claims.video.room).toBe(roomName);
      expect(claims.video.roomJoin).toBe(true);
      expect(claims.video.canPublish).toBe(true);
      expect(claims.video.canSubscribe).toBe(true);
      expect(claims.video.canPublishData).toBe(true);
      expect(claims.video.roomAdmin).toBe(true);
    } finally {
      await queryDb("DELETE FROM public.class_sessions WHERE id = $1", [sessionId]);
    }
  });

  test("4. Student calling start, end, mute, remove, permissions: all return 403", async ({ playwright }) => {
    const sessRes = await queryDb(
      `INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, capacity, price, status, teacher_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        "live",
        `Student Forbidden Actions Test ${Date.now()}`,
        "Host control lockdown verification",
        "LiveKit Classroom",
        new Date().toISOString(),
        20,
        300,
        "live",
        teacherDawitId,
      ]
    );
    const sessionId = sessRes.rows[0].id;

    // Enroll Selam
    await queryDb(
      `INSERT INTO public.enrollments (session_id, student_id, status) VALUES ($1, $2, 'approved')`,
      [sessionId, selamId]
    );

    try {
      const ctxSelam = await playwright.request.newContext();
      await ctxSelam.post("/api/auth/login", { data: TEST_USERS.customerSelam });

      // 1. Student calls start -> 403
      const startRes = await ctxSelam.post(`/api/live/${sessionId}/start`);
      expect(startRes.status()).toBe(403);

      // 2. Student calls end -> 403
      const endRes = await ctxSelam.post(`/api/live/${sessionId}/end`);
      expect(endRes.status()).toBe(403);

      // 3. Student calls permissions -> 403
      const permRes = await ctxSelam.post(`/api/live/${sessionId}/participants/${tarikuId}/permissions`, {
        data: { canPublish: true },
      });
      expect(permRes.status()).toBe(403);

      // 4. Student calls mute -> 403
      const muteRes = await ctxSelam.post(`/api/live/${sessionId}/participants/${tarikuId}/mute`, {
        data: { trackSid: "TR_dummy", muted: true },
      });
      expect(muteRes.status()).toBe(403);

      // 5. Student calls remove -> 403
      const removeRes = await ctxSelam.post(`/api/live/${sessionId}/participants/${tarikuId}/remove`);
      expect(removeRes.status()).toBe(403);
    } finally {
      await queryDb("DELETE FROM public.enrollments WHERE session_id = $1", [sessionId]);
      await queryDb("DELETE FROM public.class_sessions WHERE id = $1", [sessionId]);
    }
  });

  test("5. Teacher B starting Teacher A's session: returns 403", async ({ playwright }) => {
    // Session assigned to Dawit
    const sessRes = await queryDb(
      `INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, capacity, price, status, teacher_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        "live",
        `Teacher Isolation Test ${Date.now()}`,
        "Cross-teacher authorization boundary",
        "LiveKit Classroom",
        new Date().toISOString(),
        20,
        300,
        "scheduled",
        teacherDawitId,
      ]
    );
    const sessionId = sessRes.rows[0].id;

    try {
      // Tigist attempts to start Dawit's session
      const ctxTigist = await playwright.request.newContext();
      await ctxTigist.post("/api/auth/login", { data: TEST_USERS.teacherTigist });

      const startRes = await ctxTigist.post(`/api/live/${sessionId}/start`);
      expect(startRes.status()).toBe(403);
      const json = await startRes.json();
      expect(json.error).toMatch(/Only the assigned teacher or an admin/i);

      // Dawit (assigned teacher) starting Dawit's session succeeds
      const ctxDawit = await playwright.request.newContext();
      await ctxDawit.post("/api/auth/login", { data: TEST_USERS.teacherDawit });

      const dawitStartRes = await ctxDawit.post(`/api/live/${sessionId}/start`);
      expect(dawitStartRes.status()).toBe(200);
      const dawitJson = await dawitStartRes.json();
      expect(dawitJson.status).toBe("live");
    } finally {
      await queryDb("DELETE FROM public.class_sessions WHERE id = $1", [sessionId]);
    }
  });

  test("6. Student cannot get a token before the session is live / within the 10-minute window", async ({
    playwright,
  }) => {
    // Session scheduled 2 hours in the future, status 'scheduled'
    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const sessRes = await queryDb(
      `INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, capacity, price, status, teacher_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        "live",
        `Window Test ${Date.now()}`,
        "10 minute join window verification",
        "LiveKit Classroom",
        futureDate.toISOString(),
        20,
        300,
        "scheduled",
        teacherDawitId,
      ]
    );
    const sessionId = sessRes.rows[0].id;

    // Enroll Selam as approved
    await queryDb(
      `INSERT INTO public.enrollments (session_id, student_id, status) VALUES ($1, $2, 'approved')`,
      [sessionId, selamId]
    );

    try {
      const ctxSelam = await playwright.request.newContext();
      await ctxSelam.post("/api/auth/login", { data: TEST_USERS.customerSelam });

      // Case A: 2 hours before start -> 403
      const tokenResEarly = await ctxSelam.post(`/api/live/${sessionId}/token`);
      expect(tokenResEarly.status()).toBe(403);
      const earlyJson = await tokenResEarly.json();
      expect(earlyJson.error).toMatch(/Session is not live yet.*10 minutes/i);

      // Case B: Move starts_at to 5 minutes in the future (within 10-minute window) -> 200
      const fiveMinFuture = new Date(Date.now() + 5 * 60 * 1000);
      await queryDb("UPDATE public.class_sessions SET starts_at = $1 WHERE id = $2", [
        fiveMinFuture.toISOString(),
        sessionId,
      ]);

      const tokenResWindow = await ctxSelam.post(`/api/live/${sessionId}/token`);
      expect(tokenResWindow.status()).toBe(200);
      const windowJson = await tokenResWindow.json();
      expect(windowJson.success).toBe(true);
      expect(windowJson.token).toBeDefined();

      // Case C: Session marked 'ended' -> 403
      await queryDb("UPDATE public.class_sessions SET status = 'ended' WHERE id = $1", [sessionId]);
      const tokenResEnded = await ctxSelam.post(`/api/live/${sessionId}/token`);
      expect(tokenResEnded.status()).toBe(403);
      const endedJson = await tokenResEnded.json();
      expect(endedJson.error).toMatch(/ended or been cancelled/i);
    } finally {
      await queryDb("DELETE FROM public.enrollments WHERE session_id = $1", [sessionId]);
      await queryDb("DELETE FROM public.class_sessions WHERE id = $1", [sessionId]);
    }
  });

  test("7. Webhook endpoint verifies signature and keeps status in sync", async ({ playwright }) => {
    const roomName = `webhook-test-${Date.now()}`;
    const sessRes = await queryDb(
      `INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, capacity, price, status, teacher_id, livekit_room_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        "live",
        `Webhook Sync Test ${Date.now()}`,
        "Webhook verification test",
        "LiveKit Classroom",
        new Date().toISOString(),
        20,
        300,
        "scheduled",
        teacherDawitId,
        roomName,
      ]
    );
    const sessionId = sessRes.rows[0].id;

    try {
      const request = await playwright.request.newContext();

      // Case A: Missing Authorization header -> 401
      const noAuthRes = await request.post("/api/livekit/webhook", {
        data: JSON.stringify({ event: "room_started", room: { name: roomName } }),
      });
      expect(noAuthRes.status()).toBe(401);

      // Case B: Invalid Authorization signature -> 401
      const invalidAuthRes = await request.post("/api/livekit/webhook", {
        headers: { Authorization: "Bearer invalid.signature.token" },
        data: JSON.stringify({ event: "room_started", room: { name: roomName } }),
      });
      expect(invalidAuthRes.status()).toBe(401);

      // Case C: Valid signed webhook for room_started using WebhookReceiver
      const apiKey = process.env.LIVEKIT_API_KEY || "APIR3wML2N82ZS5";
      const apiSecret = process.env.LIVEKIT_API_SECRET || "uhBCdD3jOVe9OfewgqeneRL7MsoaPgNyNQWGegexGvLd";

      const payloadStarted = JSON.stringify({
        event: "room_started",
        room: { name: roomName },
        id: `event-${Date.now()}`,
        createdAt: Math.floor(Date.now() / 1000),
      });
      const sha256Started = crypto.createHash("sha256").update(payloadStarted).digest("base64");
      const atStarted = new AccessToken(apiKey, apiSecret, { ttl: "10m" });
      atStarted.sha256 = sha256Started;
      const validTokenStarted = await atStarted.toJwt();

      // Send to webhook route
      const webhookRes = await request.post("/api/livekit/webhook", {
        headers: {
          Authorization: validTokenStarted,
          "Content-Type": "application/json",
        },
        data: payloadStarted,
      });
      expect(webhookRes.status()).toBe(200);

      // Check DB updated to 'live'
      const checkLive = await queryDb("SELECT status FROM public.class_sessions WHERE id = $1", [sessionId]);
      expect(checkLive.rows[0].status).toBe("live");

      // Case D: Valid signed webhook for room_finished
      const payloadFinished = JSON.stringify({
        event: "room_finished",
        room: { name: roomName },
        id: `event-fin-${Date.now()}`,
        createdAt: Math.floor(Date.now() / 1000),
      });
      const sha256Finished = crypto.createHash("sha256").update(payloadFinished).digest("base64");
      const atFinished = new AccessToken(apiKey, apiSecret, { ttl: "10m" });
      atFinished.sha256 = sha256Finished;
      const validTokenFinished = await atFinished.toJwt();

      const webhookFinRes = await request.post("/api/livekit/webhook", {
        headers: {
          Authorization: validTokenFinished,
          "Content-Type": "application/json",
        },
        data: payloadFinished,
      });
      expect(webhookFinRes.status()).toBe(200);

      // Check DB updated to 'ended'
      const checkEnded = await queryDb(
        "SELECT status, ended_at FROM public.class_sessions WHERE id = $1",
        [sessionId]
      );
      expect(checkEnded.rows[0].status).toBe("ended");
      expect(checkEnded.rows[0].ended_at).not.toBeNull();
    } finally {
      await queryDb("DELETE FROM public.class_sessions WHERE id = $1", [sessionId]);
    }
  });

  test("8. Host studio page (/teacher/live/[id]): loads camera, mic, controls, and End Session dialog", async ({
    page,
  }) => {
    test.setTimeout(45000);

    const sessRes = await queryDb(
      `INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, capacity, price, status, teacher_id, livekit_room_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        "live",
        `Host Studio UI Masterclass ${Date.now()}`,
        "Host studio UI rendering validation",
        "LiveKit Classroom",
        new Date().toISOString(),
        25,
        350,
        "live",
        teacherDawitId,
        `host-ui-room-${Date.now()}`,
      ]
    );
    const sessionId = sessRes.rows[0].id;

    try {
      const loginRes = await page.request.post("/api/auth/login", { data: TEST_USERS.teacherDawit });
      expect(loginRes.ok()).toBe(true);

      await page.goto(`/teacher/live/${sessionId}`);
      await expect(page.locator("text=Host Broadcast")).toBeVisible({ timeout: 15000 });
      await expect(page.locator("button:has-text('End Session')")).toBeVisible();
      await expect(page.locator("[title='Leave Room']")).toBeVisible();
      await expect(page.locator("button[title='Share Screen']")).toBeVisible();
      await expect(page.locator("button[title='Mute All Remote Students']")).toBeVisible();
      await expect(page.locator("button:has-text('Artisans')")).toBeVisible();

      // Click the Queue tab to inspect speaking requests
      await page.click("button:has-text('Queue')");
      await expect(page.locator("text=Student Speaking Requests")).toBeVisible();
    } finally {
      await queryDb("DELETE FROM public.class_sessions WHERE id = $1", [sessionId]);
    }
  });

  test("9. Student live page (/dashboard/live/[id]): pre-join check, live viewer, and no-access screen", async ({
    page,
  }) => {
    test.setTimeout(45000);

    const sessRes = await queryDb(
      `INSERT INTO public.class_sessions (
        type, title, description, location, starts_at, capacity, price, status, teacher_id, livekit_room_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        "live",
        `Student UI Studio Masterclass ${Date.now()}`,
        "Student studio UI rendering validation",
        "LiveKit Classroom",
        new Date().toISOString(),
        25,
        350,
        "live",
        teacherDawitId,
        `student-ui-room-${Date.now()}`,
      ]
    );
    const sessionId = sessRes.rows[0].id;

    // Enroll Selam as approved
    await queryDb(
      `INSERT INTO public.enrollments (session_id, student_id, status) VALUES ($1, $2, 'approved')`,
      [sessionId, selamId]
    );

    try {
      // 1. Approved Student (Selam) logs in and visits live session
      const loginSelam = await page.request.post("/api/auth/login", { data: TEST_USERS.customerSelam });
      expect(loginSelam.ok()).toBe(true);

      await page.goto(`/dashboard/live/${sessionId}`);
      // Pre-join device check
      await expect(page.locator("text=Masterclass Studio Check-in")).toBeVisible({ timeout: 15000 });
      await expect(page.locator("button:has-text('Test Microphone')")).toBeVisible();
      await expect(page.locator("button:has-text('Test Speaker')")).toBeVisible();
      await expect(page.locator("button:has-text('Enter Live Classroom')")).toBeVisible();

      // Enter classroom
      await page.click("button:has-text('Enter Live Classroom')");
      await expect(page.locator("text=Student Viewer")).toBeVisible({ timeout: 15000 });
      // CRITICAL: NO host controls rendered
      await expect(page.locator("button:has-text('End Session')")).toHaveCount(0);
      await expect(page.locator("text=Raise Hand to Speak")).toBeVisible();

      // 2. Unenrolled Student (Tariku) sees clear admission denied screen
      const loginTariku = await page.request.post("/api/auth/login", { data: TEST_USERS.customerTariku });
      expect(loginTariku.ok()).toBe(true);

      await page.goto(`/dashboard/live/${sessionId}`);
      await expect(page.locator("text=Live Stream Admission")).toBeVisible({ timeout: 15000 });
      await expect(page.locator("text=Check Enrollment in Dashboard")).toBeVisible();
    } finally {
      await queryDb("DELETE FROM public.enrollments WHERE session_id = $1", [sessionId]);
      await queryDb("DELETE FROM public.class_sessions WHERE id = $1", [sessionId]);
    }
  });
});
