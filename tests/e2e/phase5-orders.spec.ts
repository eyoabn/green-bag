import { test, expect } from "@playwright/test";
import { pool } from "../../src/utils/db";

const SEED_USERS = {
  admin: {
    email: "admin@arenguade.com",
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

test.describe.serial("Phase 5: Ordering and Payments", () => {
  let testProductId: string;
  let unavailableProductId: string;
  let activeBankId: string;
  let customer1Id: string;
  let customer2Id: string;
  const createdOrderIds: string[] = [];

  test.beforeAll(async () => {
    // 1. Get or create active product
    const prodRes = await pool.query(
      "SELECT id, price FROM public.products WHERE is_available = true LIMIT 1"
    );
    if (prodRes.rows.length > 0) {
      testProductId = prodRes.rows[0].id;
    } else {
      const newProd = await pool.query(
        "INSERT INTO public.products (name, description, price, is_available) VALUES ('Test Kraft Bag', 'Spec Test Bag', 250.00, true) RETURNING id"
      );
      testProductId = newProd.rows[0].id;
    }

    // 2. Get or create unavailable product
    const unavailRes = await pool.query(
      "SELECT id FROM public.products WHERE is_available = false LIMIT 1"
    );
    if (unavailRes.rows.length > 0) {
      unavailableProductId = unavailRes.rows[0].id;
    } else {
      const newUnavail = await pool.query(
        "INSERT INTO public.products (name, description, price, is_available) VALUES ('Unavailable Bag', 'Out of stock', 150.00, false) RETURNING id"
      );
      unavailableProductId = newUnavail.rows[0].id;
    }

    // 3. Get active bank account
    const bankRes = await pool.query(
      "SELECT id FROM public.bank_accounts WHERE is_active = true LIMIT 1"
    );
    if (bankRes.rows.length > 0) {
      activeBankId = bankRes.rows[0].id;
    } else {
      const newBank = await pool.query(
        "INSERT INTO public.bank_accounts (bank_name, account_name, account_number, is_active) VALUES ('CBE Test Bank', 'Arenguade PLC', '100099887766', true) RETURNING id"
      );
      activeBankId = newBank.rows[0].id;
    }

    // 4. Resolve customer IDs
    const c1 = await pool.query("SELECT id FROM public.profiles WHERE email = $1", [SEED_USERS.customer1.email]);
    if (c1.rows.length > 0) customer1Id = c1.rows[0].id;

    const c2 = await pool.query("SELECT id FROM public.profiles WHERE email = $1", [SEED_USERS.customer2.email]);
    if (c2.rows.length > 0) customer2Id = c2.rows[0].id;
  });

  test.afterAll(async () => {
    // Cleanup created orders
    for (const orderId of createdOrderIds) {
      await pool.query("DELETE FROM public.order_items WHERE order_id = $1", [orderId]);
      await pool.query("DELETE FROM public.order_status_history WHERE order_id = $1", [orderId]);
      await pool.query("DELETE FROM public.notifications WHERE link LIKE $1", [`%${orderId}%`]);
      await pool.query("DELETE FROM public.audit_log WHERE entity = 'orders' AND entity_id = $1", [orderId]);
      await pool.query("DELETE FROM public.orders WHERE id = $1", [orderId]);
    }
  });

  // 1. Customer orders, uploads proof, admin approves, customer sees approved with timeline
  test("1. Customer orders, uploads proof, admin approves, customer sees approved with timeline", async ({ request }) => {
    // A. Log in as Customer 1
    const loginRes = await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
    });
    expect(loginRes.status()).toBe(200);

    // B. Create order
    const orderRes = await request.post("/api/orders", {
      data: {
        items: [{ productId: testProductId, quantity: 2 }],
        bankAccountId: activeBankId,
        deliveryAddress: "Bole Medhanialem, House 102, Addis Ababa",
        phone: "+251911223344",
      },
    });
    expect(orderRes.status()).toBe(200);
    const orderData = await orderRes.json();
    expect(orderData.success).toBe(true);
    expect(orderData.order.status).toBe("pending_payment");
    expect(orderData.order.order_number).toMatch(/^ARN-\d{4}-\d+/);
    const orderId = orderData.order.id;
    createdOrderIds.push(orderId);

    // C. Upload proof file
    const uploadRes = await request.post("/api/upload", {
      multipart: {
        bucket: "payment-proofs",
        file: {
          name: "cbe_receipt.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from("simulated-jpeg-receipt-content"),
        },
      },
    });
    expect(uploadRes.status()).toBe(200);
    const uploadJson = await uploadRes.json();
    expect(uploadJson.filePath).toBeDefined();

    // D. Customer attaches proof to order
    const patchRes = await request.patch("/api/orders", {
      data: {
        orderId,
        action: "upload_proof",
        paymentProofPath: uploadJson.filePath,
      },
    });
    expect(patchRes.status()).toBe(200);
    const patchedOrder = await patchRes.json();
    expect(patchedOrder.order.status).toBe("pending_verification");

    // E. Log in as Admin and approve
    const adminLogin = await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });
    expect(adminLogin.status()).toBe(200);

    const approveRes = await request.patch("/api/orders", {
      data: {
        orderId,
        action: "approve",
      },
    });
    expect(approveRes.status()).toBe(200);
    const approvedJson = await approveRes.json();
    expect(approvedJson.order.status).toBe("approved");
    expect(approvedJson.order.verified_by).toBeDefined();

    // F. Customer verifies status and timeline
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
    });

    const getRes = await request.get(`/api/orders/${orderId}`);
    expect(getRes.status()).toBe(200);
    const getJson = await getRes.json();
    expect(getJson.order.status).toBe("approved");
    expect(getJson.order.order_status_history.length).toBeGreaterThanOrEqual(3);
    const historyStatuses = getJson.order.order_status_history.map((h: any) => h.to_status);
    expect(historyStatuses).toContain("pending_payment");
    expect(historyStatuses).toContain("pending_verification");
    expect(historyStatuses).toContain("approved");
  });

  // 2. Admin rejects with a reason, customer sees the reason, re-uploads, status returns to pending_verification
  test("2. Admin rejects with a reason, customer sees the reason, re-uploads, status returns to pending_verification", async ({ request }) => {
    // Log in as Customer 1
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
    });

    // Create order with initial proof
    const orderRes = await request.post("/api/orders", {
      data: {
        items: [{ productId: testProductId, quantity: 1 }],
        bankAccountId: activeBankId,
        deliveryAddress: "Kazanchis, Addis Ababa",
        phone: "+251922334455",
        paymentProofPath: "proofs/initial_unclear_receipt.jpg",
      },
    });
    expect(orderRes.status()).toBe(200);
    const orderJson = await orderRes.json();
    const orderId = orderJson.order.id;
    createdOrderIds.push(orderId);
    expect(orderJson.order.status).toBe("pending_verification");

    // Admin rejects with required reason
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });

    const rejectRes = await request.patch("/api/orders", {
      data: {
        orderId,
        action: "reject",
        rejectionReason: "Screenshot illegible, missing transaction reference number.",
      },
    });
    expect(rejectRes.status()).toBe(200);
    const rejectJson = await rejectRes.json();
    expect(rejectJson.order.status).toBe("rejected");
    expect(rejectJson.order.rejection_reason).toBe("Screenshot illegible, missing transaction reference number.");

    // Customer logs in and inspects rejection
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
    });

    const checkRes = await request.get(`/api/orders/${orderId}`);
    expect(checkRes.status()).toBe(200);
    const checkJson = await checkRes.json();
    expect(checkJson.order.status).toBe("rejected");
    expect(checkJson.order.rejection_reason).toContain("missing transaction reference number");

    // Customer logs back in and re-uploads new proof
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
    });

    const reuploadRes = await request.patch("/api/orders", {
      data: {
        orderId,
        action: "upload_proof",
        paymentProofPath: "proofs/clear_official_cbe_receipt.jpg",
      },
    });
    expect(reuploadRes.status()).toBe(200);
    const reuploadJson = await reuploadRes.json();
    expect(reuploadJson.order.status).toBe("pending_verification");
    expect(reuploadJson.order.rejection_reason).toBeNull();
  });

  // 3. Customer cannot open another customer's order page, API, or proof URL
  test("3. Cross-customer isolation: Customer cannot open another customer's order API, detail, or signed proof URL", async ({ request }) => {
    // Customer 1 creates an order
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
    });

    const orderRes = await request.post("/api/orders", {
      data: {
        items: [{ productId: testProductId, quantity: 1 }],
        bankAccountId: activeBankId,
        deliveryAddress: "Customer 1 Secret Address",
        phone: "+251911111111",
        paymentProofPath: "proofs/customer1_private_bank_slip.pdf",
      },
    });
    const orderData = await orderRes.json();
    const order1Id = orderData.order.id;
    createdOrderIds.push(order1Id);

    // Customer 2 logs in
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer2.email, password: SEED_USERS.customer2.password },
    });

    // A. Customer 2 tries to GET Customer 1's order -> 403 Forbidden
    const getRes = await request.get(`/api/orders/${order1Id}`);
    expect(getRes.status()).toBe(403);
    const getJson = await getRes.json();
    expect(getJson.error).toContain("Forbidden");

    // B. Customer 2 tries to request signed URL for Customer 1's private receipt -> 403 Forbidden
    const signRes = await request.get(
      `/api/storage/signed-url?bucket=payment-proofs&path=${encodeURIComponent("proofs/customer1_private_bank_slip.pdf")}`
    );
    expect(signRes.status()).toBe(403);
    const signJson = await signRes.json();
    expect(signJson.error).toContain("Access denied");

    // C. Customer 2 tries to cancel Customer 1's order -> 403 Forbidden
    const cancelRes = await request.patch("/api/orders", {
      data: {
        orderId: order1Id,
        action: "cancel",
      },
    });
    expect(cancelRes.status()).toBe(403);
  });

  // 4. Customer cannot approve their own payment (API returns 403)
  test("4. Privilege Escalation Block: Customer cannot approve their own payment or transition to approved", async ({ request }) => {
    // Customer 1 logs in and creates order
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
    });

    const orderRes = await request.post("/api/orders", {
      data: {
        items: [{ productId: testProductId, quantity: 1 }],
        bankAccountId: activeBankId,
        deliveryAddress: "Self Approval Test",
        phone: "+251911999999",
      },
    });
    const orderData = await orderRes.json();
    const orderId = orderData.order.id;
    createdOrderIds.push(orderId);

    // Customer attempts action: "approve"
    const hackApprove = await request.patch("/api/orders", {
      data: {
        orderId,
        action: "approve",
      },
    });
    expect(hackApprove.status()).toBe(403);
    const hackJson = await hackApprove.json();
    expect(hackJson.error).toContain("Forbidden");

    // Customer attempts status: "approved"
    const hackStatus = await request.patch(`/api/orders/${orderId}`, {
      data: {
        status: "approved",
      },
    });
    expect(hackStatus.status()).toBe(403);
  });

  // 5. Tampering with price or total in the request has no effect, and unavailable products are rejected
  test("5. Server computes price strictly from DB; price tampering has no effect; unavailable products rejected", async ({ request }) => {
    // Fetch real product price
    const prodRow = await pool.query("SELECT price FROM public.products WHERE id = $1", [testProductId]);
    const realPrice = Number(prodRow.rows[0].price);

    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
    });

    // A. Malicious body with tampered price
    const orderRes = await request.post("/api/orders", {
      data: {
        items: [{ productId: testProductId, quantity: 3, unit_price: 1, price: 1, total_price: 3 }],
        total_price: 3,
        totalPrice: 3,
        bankAccountId: activeBankId,
        deliveryAddress: "Price Tamper Attempt",
        phone: "+251911000000",
      },
    });
    expect(orderRes.status()).toBe(200);
    const orderJson = await orderRes.json();
    createdOrderIds.push(orderJson.order.id);

    // Verified: total_price must equal realPrice * 3, ignoring the 3 ETB tampered total
    expect(Number(orderJson.order.total_price)).toBe(realPrice * 3);

    // B. Ordering unavailable product rejected with 400
    const unavailOrder = await request.post("/api/orders", {
      data: {
        items: [{ productId: unavailableProductId, quantity: 1 }],
        bankAccountId: activeBankId,
        deliveryAddress: "Unavailable Attempt",
        phone: "+251911000000",
      },
    });
    expect(unavailOrder.status()).toBe(400);
    const unavailJson = await unavailOrder.json();
    expect(unavailJson.error).toContain("unavailable");
  });

  // 6. Invalid status jumps (e.g. pending_payment -> completed) are rejected
  test("6. State Machine Validation: Invalid status jumps are rejected with HTTP 400", async ({ request }) => {
    // Customer creates pending_payment order
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
    });

    const orderRes = await request.post("/api/orders", {
      data: {
        items: [{ productId: testProductId, quantity: 1 }],
        bankAccountId: activeBankId,
        deliveryAddress: "State Machine Test",
        phone: "+251911000000",
      },
    });
    const orderData = await orderRes.json();
    const orderId = orderData.order.id;
    createdOrderIds.push(orderId);

    // Admin attempts illegal jump: pending_payment -> completed
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });

    const badJump1 = await request.patch("/api/orders", {
      data: {
        orderId,
        status: "completed",
      },
    });
    expect(badJump1.status()).toBe(400);
    const badJson1 = await badJump1.json();
    expect(badJson1.error).toContain("Invalid status transition");

    // Admin attempts illegal jump: pending_payment -> in_production
    const badJump2 = await request.patch("/api/orders", {
      data: {
        orderId,
        status: "in_production",
      },
    });
    expect(badJump2.status()).toBe(400);

    // Valid progression:
    // 1. Move to pending_verification
    await pool.query("UPDATE public.orders SET status = 'pending_verification' WHERE id = $1", [orderId]);

    // 2. pending_verification -> approved
    const approveRes = await request.patch("/api/orders", {
      data: { orderId, action: "approve" },
    });
    expect(approveRes.status()).toBe(200);

    // 3. approved -> in_production
    const prodRes = await request.patch("/api/orders", {
      data: { orderId, status: "in_production" },
    });
    expect(prodRes.status()).toBe(200);

    // 4. in_production -> ready
    const readyRes = await request.patch("/api/orders", {
      data: { orderId, status: "ready" },
    });
    expect(readyRes.status()).toBe(200);

    // 5. ready -> completed
    const completedRes = await request.patch("/api/orders", {
      data: { orderId, status: "completed" },
    });
    expect(completedRes.status()).toBe(200);
    const finalOrder = await completedRes.json();
    expect(finalOrder.order.status).toBe("completed");
  });

  // 7. Wrong file type and oversized file are rejected
  test("7. Storage Validation: Wrong file format (.exe) and oversized file (>5 MB) are rejected", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
    });

    // A. Invalid MIME / format (text/plain or application/x-msdownload)
    const badTypeRes = await request.post("/api/upload", {
      multipart: {
        bucket: "payment-proofs",
        file: {
          name: "malicious.exe",
          mimeType: "application/x-msdownload",
          buffer: Buffer.from("MZ0000fake-executable"),
        },
      },
    });
    expect(badTypeRes.status()).toBe(400);
    const badTypeJson = await badTypeRes.json();
    expect(badTypeJson.error).toContain("Invalid file format");

    // B. Oversized file (> 5 MB)
    const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024, "a");
    const oversizeRes = await request.post("/api/upload", {
      multipart: {
        bucket: "payment-proofs",
        file: {
          name: "oversized_receipt.pdf",
          mimeType: "application/pdf",
          buffer: largeBuffer,
        },
      },
    });
    expect(oversizeRes.status()).toBe(400);
    const oversizeJson = await oversizeRes.json();
    expect(oversizeJson.error).toContain("exceeds maximum allowed size");
  });

  // 8. Admin can create an order on behalf of a customer
  test("8. Admin can create an order on behalf of a customer and it appears in customer portal", async ({ request }) => {
    // Admin logs in
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.admin.email, password: SEED_USERS.admin.password },
    });

    const onBehalfRes = await request.post("/api/orders", {
      data: {
        buyerId: customer1Id,
        items: [{ productId: testProductId, quantity: 4 }],
        bankAccountId: activeBankId,
        deliveryAddress: "Customer 1 Corporate Branch, Bole Road",
        phone: "+251911888888",
        notes: "Placed by plant sales manager",
      },
    });
    expect(onBehalfRes.status()).toBe(200);
    const onBehalfJson = await onBehalfRes.json();
    const createdOrderId = onBehalfJson.order.id;
    createdOrderIds.push(createdOrderId);

    // Verify assigned to Customer 1
    expect(onBehalfJson.order.buyer_id).toBe(customer1Id);

    // Check audit_log
    const auditRes = await pool.query(
      "SELECT action, metadata FROM public.audit_log WHERE entity = 'orders' AND entity_id = $1",
      [createdOrderId]
    );
    expect(auditRes.rows.length).toBeGreaterThan(0);
    expect(auditRes.rows[0].action).toBe("ORDER_CREATED_ON_BEHALF");

    // Customer 1 logs in and sees this order in /api/orders
    await request.post("/api/auth/login", {
      data: { email: SEED_USERS.customer1.email, password: SEED_USERS.customer1.password },
    });

    const custOrdersRes = await request.get("/api/orders");
    expect(custOrdersRes.status()).toBe(200);
    const custOrdersJson = await custOrdersRes.json();
    const found = custOrdersJson.orders.find((o: any) => o.id === createdOrderId);
    expect(found).toBeDefined();
    expect(found.delivery_address).toContain("Customer 1 Corporate Branch");
  });
});
