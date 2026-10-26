#!/usr/bin/env node
// scripts/seed.js
// Idempotent seed for Ethiopia Arenguade Paper Product platform.
// Run: npm run seed (or node scripts/seed.js)
// Safe to re-run: uses ON CONFLICT DO UPDATE / DO NOTHING throughout.
// Prints all seeded credentials at the end.

'use strict';
const { Client } = require('pg');

const DIRECT_URL =
  process.env.DIRECT_URL ||
  'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const USERS = [
  { email: 'admin@arenguade.com',            password: 'Password123!', role: 'admin',    full_name: 'Abebe Admin (Owner)',  phone: '+251911000001' },
  { email: 'teacher.tigist@arenguade.com',   password: 'Password123!', role: 'teacher',  full_name: 'Tigist Tadesse',       phone: '+251911000002' },
  { email: 'teacher.dawit@arenguade.com',    password: 'Password123!', role: 'teacher',  full_name: 'Dawit Haile',          phone: '+251911000003' },
  { email: 'customer.selam@gmail.com',       password: 'Password123!', role: 'customer', full_name: 'Selam Kebede',         phone: '+251911000004' },
  { email: 'customer.tariku@gmail.com',      password: 'Password123!', role: 'customer', full_name: 'Tariku Alemu',         phone: '+251911000005' },
  { email: 'customer.helen@gmail.com',       password: 'Password123!', role: 'customer', full_name: 'Helen Berhanu',        phone: '+251911000006' },
];

const PRODUCTS = [
  {
    name: 'Rare Specialty Coffee Roasters Bag',
    description: 'Signature unbleached kraft carrier bag for Ethiopian specialty coffee roasters. Features custom typography, aroma seal, and black twisted cord handles.',
    price: 180, category: 'Coffee & Food', stock_quantity: 500, is_available: true,
    images: ['/images/photo_6_2026-09-05_00-36-03.jpg', '/images/photo_13_2026-09-05_00-36-03.jpg'],
  },
  {
    name: 'Richo Luxury Boutique Tote with Tibeb Border',
    description: 'Premium white coated luxury retail bag featuring traditional Ethiopian Tibeb geometric border, reinforced bottom card, and durable braided rope handles.',
    price: 260, category: 'Luxury Retail', stock_quantity: 350, is_available: true,
    images: ['/images/photo_3_2026-09-05_00-36-02.jpg', '/images/photo_4_2026-09-05_00-36-02.jpg'],
  },
  {
    name: 'Hassan Adama Luxury Fashion Shopper',
    description: 'Clean, elegant typography with custom monogram emblem. Rigid sidewalls and reinforced eyelets for suits, dresses, and footwear.',
    price: 250, category: 'Luxury Retail', stock_quantity: 400, is_available: true,
    images: ['/images/photo_4_2026-09-05_00-36-02.jpg', '/images/photo_3_2026-09-05_00-36-02.jpg'],
  },
  {
    name: 'Liora Fashion Store Carrier',
    description: 'Natural earth brown kraft bag with clean modern branding. Perfect for everyday retail, cosmetics, and lifestyle brands.',
    price: 160, category: 'Standard Retail', stock_quantity: 600, is_available: true,
    images: ['/images/photo_13_2026-09-05_00-36-03.jpg', '/images/photo_6_2026-09-05_00-36-03.jpg'],
  },
  {
    name: 'Family Dental Clinic Medical Luxury Carrier',
    description: 'Crisp white clinic bag with two-tone cyan and navy corporate print for patient care kits and pharmaceutical giveaways.',
    price: 220, category: 'Healthcare & Corporate', stock_quantity: 250, is_available: true,
    images: ['/images/photo_10_2026-09-05_00-36-03.jpg', '/images/photo_7_2026-09-05_00-36-03.jpg'],
  },
  {
    name: 'Vero Tiramisu Artisan Sleeve Box',
    description: 'Food-grade specialty sleeve box for premium tiramisu and pastries. Rigid outer sleeve with grease-resistant inner tray.',
    price: 190, category: 'Confectionery & Bakery', stock_quantity: 450, is_available: true,
    images: ['/images/photo_16_2026-09-05_00-36-03.jpg', '/images/photo_14_2026-09-05_00-36-03.jpg'],
  },
  {
    name: 'Eco-Friendly Recycled Grocery Sack',
    description: 'Unbranded brown grocery sack for organic markets, zero-waste stores, and delivery services. Our most sustainable option.',
    price: 85, category: 'Grocery & Market', stock_quantity: 1200, is_available: true,
    images: ['/images/photo_15_2026-09-05_00-36-03.jpg', '/images/photo_11_2026-09-05_00-36-03.jpg'],
  },
  {
    name: 'Addis Corporate Executive Gift Bag',
    description: 'Sleek die-cut handle bag with matte black lamination and silver foil stamping. Ideal for corporate events and high-end accessories.',
    price: 280, category: 'Healthcare & Corporate', stock_quantity: 300, is_available: true,
    images: ['/images/photo_17_2026-09-05_00-36-03.jpg', '/images/photo_12_2026-09-05_00-36-03.jpg'],
  },
];

const BANK_ACCOUNTS = [
  {
    bank_name: 'Commercial Bank of Ethiopia (CBE)',
    account_name: 'Arenguade Paper Products PLC',
    account_number: '1000123456789',
    instructions: 'Transfer via CBE Birr or Mobile Banking. Include your Order Number as the reference.',
  },
  {
    bank_name: 'Telebirr',
    account_name: 'Arenguade Paper Products (Merchant)',
    account_number: '+251911223344',
    instructions: 'Pay via Telebirr SuperApp merchant payment. Use your Order Number as payment reference.',
  },
  {
    bank_name: 'Awash Bank',
    account_name: 'Arenguade Paper Products PLC',
    account_number: '01320876543200',
    instructions: 'Transfer via Awash Online or branch deposit. Reference your Order Number on the receipt.',
  },
];

async function upsertUser(client, user) {
  const existing = await client.query('SELECT id FROM auth.users WHERE email = $1', [user.email]);
  let userId;

  if (existing.rows.length > 0) {
    userId = existing.rows[0].id;
    await client.query(`
      UPDATE auth.users SET
        encrypted_password       = crypt($2, gen_salt('bf')),
        email_confirmed_at       = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data       = jsonb_build_object('full_name', $3::text, 'phone', $4::text, 'role', $5::text),
        confirmation_token       = COALESCE(confirmation_token, ''),
        recovery_token           = COALESCE(recovery_token, ''),
        email_change_token_new   = COALESCE(email_change_token_new, ''),
        email_change             = COALESCE(email_change, ''),
        phone_change             = COALESCE(phone_change, ''),
        phone_change_token       = COALESCE(phone_change_token, ''),
        email_change_token_current = COALESCE(email_change_token_current, ''),
        reauthentication_token   = COALESCE(reauthentication_token, ''),
        is_super_admin           = COALESCE(is_super_admin, false),
        updated_at               = NOW()
      WHERE id = $1
    `, [userId, user.password, user.full_name, user.phone, user.role]);
  } else {
    const res = await client.query(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email,
        encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token,
        email_change_token_new, email_change,
        phone_change, phone_change_token,
        email_change_token_current, reauthentication_token,
        is_super_admin, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
        'authenticated', 'authenticated', $1,
        crypt($2, gen_salt('bf')), NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', $3::text, 'phone', $4::text, 'role', $5::text),
        '', '', '', '', '', '', '', '', false, NOW(), NOW()
      ) RETURNING id
    `, [user.email, user.password, user.full_name, user.phone, user.role]);
    userId = res.rows[0].id;
  }

  // Upsert profile — bypass role escalation trigger by using postgres superuser
  await client.query(`
    INSERT INTO public.profiles (id, full_name, phone, role, is_active, updated_at)
    VALUES ($1, $2, $3, $4::public.user_role, true, NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name  = EXCLUDED.full_name,
      phone      = EXCLUDED.phone,
      role       = EXCLUDED.role,
      is_active  = true,
      updated_at = NOW()
  `, [userId, user.full_name, user.phone, user.role]);

  return userId;
}

async function seed() {
  console.log('\n🌱  Ethiopia Arenguade — Database Seed');
  console.log('═'.repeat(50));

  const client = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅  Connected to Supabase PostgreSQL\n');

  // ------------------------------------------------------------------
  // 1. Site Settings
  // ------------------------------------------------------------------
  console.log('📋  Seeding site settings…');
  await client.query(`
    INSERT INTO public.settings (id, company_name, contact_phone, contact_email, address, tax_id, settlement_days)
    VALUES ('company',
      'Ethiopia Arenguade Paper Product',
      '+251 911 223 344',
      'info@arenguadepaper.com',
      'Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia',
      'ETH-TIN-2024-001',
      3
    )
    ON CONFLICT (id) DO UPDATE SET
      company_name    = EXCLUDED.company_name,
      contact_phone   = EXCLUDED.contact_phone,
      contact_email   = EXCLUDED.contact_email,
      address         = EXCLUDED.address,
      tax_id          = EXCLUDED.tax_id,
      settlement_days = EXCLUDED.settlement_days,
      updated_at      = NOW()
  `);
  console.log('   ✓ Settings upserted');

  // ------------------------------------------------------------------
  // 2. Users (1 admin, 2 teachers, 3 customers)
  // ------------------------------------------------------------------
  console.log('\n👤  Seeding users (1 admin + 2 teachers + 3 customers)…');
  const userMap = {};
  for (const u of USERS) {
    userMap[u.email] = await upsertUser(client, u);
    console.log(`   ✓ ${u.role.padEnd(8)} ${u.email}  → ${userMap[u.email]}`);
  }

  // ------------------------------------------------------------------
  // 3. Bank Accounts (3)
  // ------------------------------------------------------------------
  console.log('\n🏦  Seeding bank accounts…');
  // Delete dependent rows first (orders reference bank_accounts)
  await client.query('DELETE FROM public.enrollments');
  await client.query('DELETE FROM public.designs');
  await client.query('DELETE FROM public.order_items');
  await client.query('DELETE FROM public.order_status_history');
  await client.query('DELETE FROM public.orders');
  await client.query('DELETE FROM public.class_sessions');
  await client.query('DELETE FROM public.bank_accounts');
  const bankRows = [];
  for (const b of BANK_ACCOUNTS) {
    const res = await client.query(`
      INSERT INTO public.bank_accounts (bank_name, account_name, account_number, instructions, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, bank_name
    `, [b.bank_name, b.account_name, b.account_number, b.instructions]);
    bankRows.push(res.rows[0]);
    console.log(`   ✓ ${res.rows[0].bank_name}`);
  }
  const defaultBankId = bankRows[0].id;

  // ------------------------------------------------------------------
  // 4. Products (8)
  // ------------------------------------------------------------------
  console.log('\n📦  Seeding 8 products…');
  await client.query('DELETE FROM public.products');

  const productRows = [];
  for (const p of PRODUCTS) {
    const res = await client.query(`
      INSERT INTO public.products (name, description, price, images, category, stock_quantity, is_available)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, price
    `, [p.name, p.description, p.price, p.images, p.category, p.stock_quantity, p.is_available]);
    productRows.push(res.rows[0]);
    console.log(`   ✓ ${res.rows[0].name} (${res.rows[0].price} ETB)`);
  }

  // ------------------------------------------------------------------
  // 5. Class Sessions (6: 3 live, 3 in-person — future dates)
  // ------------------------------------------------------------------
  console.log('\n🎓  Seeding 6 class sessions…');
  await client.query('DELETE FROM public.enrollments');
  await client.query('DELETE FROM public.class_sessions');

  const tigistId = userMap['teacher.tigist@arenguade.com'];
  const dawitId  = userMap['teacher.dawit@arenguade.com'];

  const SESSION_DEFS = [
    {
      type: 'live', title: 'Paper Bag Making — Beginner Live Workshop',
      description: 'Learn the fundamentals of kraft paper bag construction with live guidance from our master artisan.',
      teacher_id: tigistId, capacity: 20, price: 450,
      starts_at: 'NOW() + INTERVAL \'7 days\'',
      ends_at:   'NOW() + INTERVAL \'7 days\' + INTERVAL \'3 hours\'',
      livekit_room_name: 'arenguade-beginner-live-01',
    },
    {
      type: 'live', title: 'Advanced Packaging Design — Live Masterclass',
      description: 'Master die-cut handle construction, lamination, and foil-stamping techniques.',
      teacher_id: tigistId, capacity: 15, price: 750,
      starts_at: 'NOW() + INTERVAL \'14 days\'',
      ends_at:   'NOW() + INTERVAL \'14 days\' + INTERVAL \'4 hours\'',
      livekit_room_name: 'arenguade-advanced-masterclass-01',
    },
    {
      type: 'live', title: 'Eco-Friendly Bag Production — Live Session',
      description: 'Sustainable production techniques using recycled and unbleached materials.',
      teacher_id: dawitId, capacity: 25, price: 350,
      starts_at: 'NOW() + INTERVAL \'21 days\'',
      ends_at:   'NOW() + INTERVAL \'21 days\' + INTERVAL \'2 hours\'',
      livekit_room_name: 'arenguade-eco-live-01',
    },
    {
      type: 'in_person', title: 'Hands-On Paper Bag Workshop — Addis Ababa',
      description: 'Full-day hands-on workshop at our Bole production facility. All materials provided.',
      teacher_id: dawitId, capacity: 12, price: 850,
      location: 'Arenguade Workshop, Bole Sub-City, Addis Ababa',
      starts_at: 'NOW() + INTERVAL \'10 days\'',
      ends_at:   'NOW() + INTERVAL \'10 days\' + INTERVAL \'8 hours\'',
    },
    {
      type: 'in_person', title: 'Corporate Packaging Design Sprint',
      description: 'Intensive 2-day corporate training program for businesses wanting in-house packaging capability.',
      teacher_id: tigistId, capacity: 8, price: 2500,
      location: 'Arenguade Workshop, Bole Sub-City, Addis Ababa',
      starts_at: 'NOW() + INTERVAL \'30 days\'',
      ends_at:   'NOW() + INTERVAL \'32 days\'',
    },
    {
      type: 'in_person', title: 'Weekend Paper Craft Intensive',
      description: 'A focused weekend class covering paper selection, cutting, folding, gluing, and finishing.',
      teacher_id: dawitId, capacity: 16, price: 600,
      location: 'Arenguade Workshop, Bole Sub-City, Addis Ababa',
      starts_at: 'NOW() + INTERVAL \'5 days\'',
      ends_at:   'NOW() + INTERVAL \'7 days\'',
    },
  ];

  const sessionRows = [];
  for (const s of SESSION_DEFS) {
    const res = await client.query(`
      INSERT INTO public.class_sessions
        (type, title, description, teacher_id, capacity, price, status,
         starts_at, ends_at, location, livekit_room_name)
      VALUES
        ($1, $2, $3, $4, $5, $6, 'scheduled',
         ${s.starts_at}, ${s.ends_at},
         $7, $8)
      RETURNING id, title, type
    `, [s.type, s.title, s.description, s.teacher_id, s.capacity, s.price,
        s.location || '', s.livekit_room_name || null]);
    sessionRows.push(res.rows[0]);
    console.log(`   ✓ [${s.type.padEnd(9)}] ${res.rows[0].title}`);
  }

  // ------------------------------------------------------------------
  // 6. Sample Orders (various statuses)
  // ------------------------------------------------------------------
  console.log('\n🛒  Seeding sample orders…');
  const selamId  = userMap['customer.selam@gmail.com'];
  const tarikuId = userMap['customer.tariku@gmail.com'];
  const helenId  = userMap['customer.helen@gmail.com'];
  const adminId  = userMap['admin@arenguade.com'];

  const orderDefs = [
    { buyer_id: selamId,  product: productRows[0], qty: 100, status: 'approved',            proof: 'payment-proofs/sample-proof.jpg' },
    { buyer_id: tarikuId, product: productRows[1], qty: 50,  status: 'pending_verification', proof: 'payment-proofs/sample-proof.jpg' },
    { buyer_id: helenId,  product: productRows[2], qty: 200, status: 'in_production',        proof: 'payment-proofs/sample-proof.jpg' },
    { buyer_id: selamId,  product: productRows[4], qty: 75,  status: 'completed',            proof: 'payment-proofs/sample-proof.jpg' },
    { buyer_id: tarikuId, product: productRows[6], qty: 300, status: 'rejected',             proof: 'payment-proofs/sample-proof.jpg' },
  ];

  for (const od of orderDefs) {
    const totalPrice = od.product.price * od.qty;
    const orderRes = await client.query(`
      INSERT INTO public.orders
        (buyer_id, status, total_price, bank_account_id, payment_proof_path,
         delivery_address, phone, verified_by, verified_at)
      VALUES ($1, $2::public.order_status, $3, $4, $5,
              'Bole Sub-City, Addis Ababa', '+251911000099',
              CASE WHEN $2 IN ('approved','in_production','completed') THEN $6::uuid ELSE NULL END,
              CASE WHEN $2 IN ('approved','in_production','completed') THEN NOW() ELSE NULL END)
      RETURNING id, order_number
    `, [od.buyer_id, od.status, totalPrice, defaultBankId, od.proof, adminId]);

    const orderId     = orderRes.rows[0].id;
    const orderNumber = orderRes.rows[0].order_number;

    await client.query(`
      INSERT INTO public.order_items (order_id, product_id, quantity, unit_price_snapshot)
      VALUES ($1, $2, $3, $4)
    `, [orderId, od.product.id, od.qty, od.product.price]);

    await client.query(`
      INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
      VALUES ($1, 'pending_payment', $2, $3, 'Seeded status')
    `, [orderId, od.status, adminId]);

    console.log(`   ✓ ${orderNumber} [${od.status}]  ${od.product.name.substring(0, 30)}…`);
  }

  // ------------------------------------------------------------------
  // 7. Sample Enrollments (various statuses)
  // ------------------------------------------------------------------
  console.log('\n📚  Seeding sample enrollments…');
  const enrollDefs = [
    { student_id: selamId,  session: sessionRows[0], status: 'approved' },
    { student_id: tarikuId, session: sessionRows[0], status: 'pending_verification' },
    { student_id: helenId,  session: sessionRows[1], status: 'approved' },
    { student_id: selamId,  session: sessionRows[3], status: 'confirmed' },
    { student_id: tarikuId, session: sessionRows[4], status: 'pending_verification' },
  ];

  for (const ed of enrollDefs) {
    await client.query(`
      INSERT INTO public.enrollments
        (session_id, student_id, status, payment_proof_path,
         verified_by, verified_at)
      VALUES (
        $1, $2, $3::public.enrollment_status,
        'payment-proofs/sample-proof.jpg',
        CASE WHEN $3 IN ('approved','confirmed') THEN $4::uuid ELSE NULL END,
        CASE WHEN $3 IN ('approved','confirmed') THEN NOW() ELSE NULL END
      )
      ON CONFLICT (session_id, student_id) DO UPDATE SET
        status       = EXCLUDED.status,
        verified_by  = EXCLUDED.verified_by,
        verified_at  = EXCLUDED.verified_at,
        updated_at   = NOW()
    `, [ed.session.id, ed.student_id, ed.status, adminId]);
    console.log(`   ✓ [${ed.status.padEnd(20)}] ${ed.session.title.substring(0, 35)}…`);
  }

  // ------------------------------------------------------------------
  // 8. Sample Design Submission
  // ------------------------------------------------------------------
  console.log('\n🎨  Seeding sample design submission…');
  await client.query(`DELETE FROM public.designs`);
  await client.query(`
    INSERT INTO public.designs
      (submitted_by, title, description, file_path, status, quoted_price)
    VALUES
      ($1, 'Custom Coffee Roaster Bag - Yirgacheffe Edition',
       'I need a premium kraft bag with our Yirgacheffe farm logo and altitude details printed.',
       'designs/sample-design.pdf', 'quoted', 1200),
      ($2, 'Wedding Gift Packaging Set',
       'White luxury bags with gold foil for 200-person wedding. 3 sizes needed.',
       'designs/sample-design2.pdf', 'new', NULL)
    ON CONFLICT DO NOTHING
  `, [selamId, tarikuId]);
  console.log('   ✓ 2 design submissions seeded');

  await client.end();

  // ------------------------------------------------------------------
  // 9. Print credentials table
  // ------------------------------------------------------------------
  console.log('\n' + '═'.repeat(60));
  console.log('🔑  SEEDED CREDENTIALS');
  console.log('═'.repeat(60));
  console.log('All passwords: Password123!\n');
  console.log('Role     | Email');
  console.log('─'.repeat(50));
  for (const u of USERS) {
    console.log(`${u.role.padEnd(8)} | ${u.email}`);
  }
  console.log('═'.repeat(60));
  console.log('✅  Seed complete!\n');
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message);
  process.exit(1);
});
