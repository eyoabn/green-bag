const { Client } = require('pg');

const directUrl = process.env.DIRECT_URL || 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function seed() {
  console.log("🌱 Starting complete system seed...");
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ Connected to Supabase PostgreSQL");

    // 1. Initial Settings
    console.log("Setting company settings...");
    await client.query(`
      INSERT INTO public.settings (id, company_name, contact_phone, contact_email, address, updated_at)
      VALUES (
        'default',
        'Ethiopia Arenguade Paper Product',
        '+251 911 223 344',
        'info@arenguadepaper.com',
        'Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia',
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        contact_phone = EXCLUDED.contact_phone,
        contact_email = EXCLUDED.contact_email,
        address = EXCLUDED.address,
        updated_at = NOW();
    `);

    // 2. Seed Users in auth.users and profiles
    console.log("Seeding core roles & accounts (Admin, 2 Teachers, 3 Customers)...");
    const users = [
      {
        email: 'admin@arenguade.com',
        password: 'Password123!',
        role: 'admin',
        full_name: 'Abebe Admin (Owner)',
        phone: '+251911000001'
      },
      {
        email: 'teacher.tigist@arenguade.com',
        password: 'Password123!',
        role: 'teacher',
        full_name: 'Tigist Tadesse',
        phone: '+251911000002'
      },
      {
        email: 'teacher.dawit@arenguade.com',
        password: 'Password123!',
        role: 'teacher',
        full_name: 'Dawit Haile',
        phone: '+251911000003'
      },
      {
        email: 'customer.selam@gmail.com',
        password: 'Password123!',
        role: 'customer',
        full_name: 'Selam Kebede',
        phone: '+251911000004'
      },
      {
        email: 'customer.tariku@gmail.com',
        password: 'Password123!',
        role: 'customer',
        full_name: 'Tariku Alemu',
        phone: '+251911000005'
      },
      {
        email: 'customer.helen@gmail.com',
        password: 'Password123!',
        role: 'customer',
        full_name: 'Helen Berhanu',
        phone: '+251911000006'
      }
    ];

    const userMap = {};

    for (const u of users) {
      const existing = await client.query('SELECT id FROM auth.users WHERE email = $1', [u.email]);
      let userId;
      if (existing.rows.length > 0) {
        userId = existing.rows[0].id;
        await client.query(`
          UPDATE auth.users
          SET encrypted_password = crypt($2, gen_salt('bf')),
              email_confirmed_at = NOW(),
              raw_user_meta_data = json_build_object('full_name', $3::text, 'phone', $4::text, 'role', $5::text),
              updated_at = NOW()
          WHERE id = $1;
        `, [userId, u.password, u.full_name, u.phone, u.role]);
      } else {
        const insertRes = await client.query(`
          INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
          )
          VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            $1,
            crypt($2, gen_salt('bf')),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            json_build_object('full_name', $3::text, 'phone', $4::text, 'role', $5::text),
            NOW(),
            NOW()
          )
          RETURNING id;
        `, [u.email, u.password, u.full_name, u.phone, u.role]);
        userId = insertRes.rows[0].id;
      }
      userMap[u.email] = userId;

      // Upsert profile
      await client.query(`
        INSERT INTO public.profiles (id, full_name, phone, role, is_active, updated_at)
        VALUES ($1, $2, $3, $4::user_role, true, NOW())
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          role = EXCLUDED.role,
          is_active = true,
          updated_at = NOW();
      `, [userId, u.full_name, u.phone, u.role]);
    }
    console.log("✅ Seeded users successfully:", Object.keys(userMap));

    // 3. Clean up dependent order tables before bank accounts/products
    console.log("Cleaning up previous orders and bank accounts...");
    await client.query(`DELETE FROM public.order_items;`);
    await client.query(`DELETE FROM public.order_status_history;`);
    await client.query(`DELETE FROM public.orders;`);
    await client.query(`DELETE FROM public.bank_accounts;`);

    console.log("Seeding 3 active Ethiopian bank accounts...");
    const bankRes = await client.query(`
      INSERT INTO public.bank_accounts (bank_name, account_name, account_number, instructions, is_active)
      VALUES 
        ('Commercial Bank of Ethiopia (CBE)', 'Arenguade Paper Products PLC', '1000123456789', 'Transfer via CBE Birr or Mobile Banking. Put your Order Number in the transfer remarks.', true),
        ('Telebirr', 'Arenguade Paper Products (Merchant)', '+251911223344', 'Pay via Telebirr SuperApp merchant payment. Use your Order Number as payment reference.', true),
        ('Awash Bank', 'Arenguade Paper Products PLC', '01320876543200', 'Transfer via Awash Online or branch deposit. Reference your Order Number on the receipt.', true)
      RETURNING id, bank_name;
    `);
    const defaultBankId = bankRes.rows[0].id;
    console.log("✅ Bank accounts seeded:", bankRes.rows.map(b => b.bank_name).join(', '));

    // 4. Seed 8 Products
    console.log("Seeding 8 catalog products...");
    await client.query(`DELETE FROM public.products;`);

    const products = [
      {
        name: "Rare Specialty Coffee Roasters Bag",
        description: "Signature unbleached kraft carrier bag crafted for Ethiopian specialty coffee roasters. Features custom typography, aroma seal capability, and high-tensile black twisted cord handles.",
        price: 180,
        images: ["/images/photo_6_2026-09-05_00-36-03.jpg", "/images/photo_13_2026-09-05_00-36-03.jpg"],
        category: "Coffee & Food",
        stock_quantity: 500,
        is_available: true
      },
      {
        name: "Richo Luxury Boutique Tote with Tibeb Border",
        description: "Premium white coated luxury retail bag featuring traditional Ethiopian Tibeb geometric pattern border, reinforced bottom card, and durable black braided rope handles for fashion boutiques.",
        price: 260,
        images: ["/images/photo_3_2026-09-05_00-36-02.jpg", "/images/photo_4_2026-09-05_00-36-02.jpg"],
        category: "Luxury Retail",
        stock_quantity: 350,
        is_available: true
      },
      {
        name: "Hassan Adama Luxury Fashion Shopper",
        description: "Clean, elegant typography with custom monogram emblem. Manufactured with rigid sidewalls and reinforced handle eyelets for suits, dresses, and footwear.",
        price: 250,
        images: ["/images/photo_4_2026-09-05_00-36-02.jpg", "/images/photo_3_2026-09-05_00-36-02.jpg"],
        category: "Luxury Retail",
        stock_quantity: 400,
        is_available: true
      },
      {
        name: "Liora Fashion Store Carrier",
        description: "Natural earth brown kraft bag printed with clean modern branding and social tags. Perfect for everyday retail, cosmetics, and lifestyle brands.",
        price: 160,
        images: ["/images/photo_13_2026-09-05_00-36-03.jpg", "/images/photo_6_2026-09-05_00-36-03.jpg"],
        category: "Standard Retail",
        stock_quantity: 600,
        is_available: true
      },
      {
        name: "Family Dental Clinic Medical Luxury Carrier",
        description: "Crisp white clinic presentation bag with two-tone cyan and navy corporate print. Used for patient care kits, pharmaceutical giveaways, and executive gifts.",
        price: 220,
        images: ["/images/photo_10_2026-09-05_00-36-03.jpg", "/images/photo_7_2026-09-05_00-36-03.jpg"],
        category: "Healthcare & Corporate",
        stock_quantity: 250,
        is_available: true
      },
      {
        name: "Véro Tiramisù Artisan Sleeve Box",
        description: "Food-grade specialty sleeve box designed for premium tiramisu and pastries. Features a rigid outer sleeve and a grease-resistant inner tray.",
        price: 190,
        images: ["/images/photo_16_2026-09-05_00-36-03.jpg", "/images/photo_14_2026-09-05_00-36-03.jpg"],
        category: "Confectionery & Bakery",
        stock_quantity: 450,
        is_available: true
      },
      {
        name: "Eco-Friendly Recycled Grocery Sack",
        description: "Our most sustainable, unbranded brown grocery sack. Perfect for organic markets, zero-waste stores, and delivery services.",
        price: 85,
        images: ["/images/photo_15_2026-09-05_00-36-03.jpg", "/images/photo_11_2026-09-05_00-36-03.jpg"],
        category: "Grocery & Market",
        stock_quantity: 1200,
        is_available: true
      },
      {
        name: "Addis Corporate Executive Gift Bag",
        description: "Sleek, professional die-cut handle bag with matte black lamination and silver foil stamping. Ideal for corporate events and high-end tech accessories.",
        price: 280,
        images: ["/images/photo_17_2026-09-05_00-36-03.jpg", "/images/photo_12_2026-09-05_00-36-03.jpg"],
        category: "Healthcare & Corporate",
        stock_quantity: 300,
        is_available: true
      }
    ];

    const productIds = [];
    for (const p of products) {
      const pRes = await client.query(`
        INSERT INTO public.products (
          name, description, price, images, image_urls, category, stock_quantity, is_available
        ) VALUES ($1, $2, $3, $4, $4, $5, $6, $7)
        RETURNING id;
      `, [p.name, p.description, p.price, p.images, p.category, p.stock_quantity, p.is_available]);
      productIds.push({ id: pRes.rows[0].id, name: p.name, price: p.price });
    }
    console.log("✅ Seeded 8 products!");

    // 5. Seed 6 Class Sessions (3 Live, 3 In-Person)
    console.log("Seeding 6 class sessions...");
    await client.query(`
      ALTER TABLE public.class_sessions ALTER COLUMN teacher_name DROP NOT NULL;
      ALTER TABLE public.class_sessions ALTER COLUMN start_time DROP NOT NULL;
      ALTER TABLE public.class_sessions ALTER COLUMN end_time DROP NOT NULL;
      ALTER TABLE public.orders ALTER COLUMN product_id DROP NOT NULL;
      ALTER TABLE public.orders ALTER COLUMN quantity DROP NOT NULL;
    `);
    await client.query(`DELETE FROM public.enrollments;`);
    await client.query(`DELETE FROM public.class_sessions;`);

    const tigistId = userMap['teacher.tigist@arenguade.com'];
    const dawitId = userMap['teacher.dawit@arenguade.com'];

    const sessions = [
      {
        type: 'live',
        title: 'Live Masterclass: Eco Packaging Die-Line Geometry',
        description: 'Deep dive into standard packaging formulas, folding resistance, and structural die-line planning using vector software.',
        teacher_id: tigistId,
        teacher_name: 'Tigist Tadesse',
        location: null,
        starts_at: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 min from now
        ends_at: new Date(Date.now() + 1000 * 60 * 150).toISOString(),
        capacity: 25,
        price: 450,
        status: 'scheduled',
        livekit_room_name: 'arenguade-live-101'
      },
      {
        type: 'live',
        title: 'Live Workshop: Sustainable Inks & Screen Printing on Kraft',
        description: 'Learn ink formulation, spot color registration, and drying dynamics on virgin Ethiopian kraft paper.',
        teacher_id: dawitId,
        teacher_name: 'Dawit Haile',
        location: null,
        starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days from now
        ends_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 120).toISOString(),
        capacity: 30,
        price: 550,
        status: 'scheduled',
        livekit_room_name: 'arenguade-live-102'
      },
      {
        type: 'live',
        title: 'Live QA: Food-Grade Paper Standards & Certifications',
        description: 'Comprehensive overview of FDA and Ethiopian packaging standards for bakery and takeout packaging.',
        teacher_id: tigistId,
        teacher_name: 'Tigist Tadesse',
        location: null,
        starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        ends_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 90).toISOString(),
        capacity: 40,
        price: 350,
        status: 'scheduled',
        livekit_room_name: 'arenguade-live-103'
      },
      {
        type: 'in_person',
        title: 'In-Person Intensive: Kraft Bag Folding & Manual Assembly',
        description: 'Hands-on practical training on scoring, base card insertion, and high-tensile handle attachment.',
        teacher_id: dawitId,
        teacher_name: 'Dawit Haile',
        location: 'Arenguade Workshop Studio, Bole Sub-City, Addis Ababa',
        starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
        ends_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 240).toISOString(),
        capacity: 15,
        price: 750,
        status: 'scheduled',
        livekit_room_name: 'arenguade-inperson-201'
      },
      {
        type: 'in_person',
        title: 'In-Person Hands-on: Tibeb Foil Stamping & Luxury Finishing',
        description: 'Master heat stamping, pressure calibration, and foil release on premium coated retail carriers.',
        teacher_id: tigistId,
        teacher_name: 'Tigist Tadesse',
        location: 'Arenguade Innovation Hub, Kazanchis, Addis Ababa',
        starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString(),
        ends_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6 + 1000 * 60 * 180).toISOString(),
        capacity: 12,
        price: 850,
        status: 'scheduled',
        livekit_room_name: 'arenguade-inperson-202'
      },
      {
        type: 'in_person',
        title: 'In-Person Workshop: Corrugated Box Structural Testing',
        description: 'Drop tests, crush resistance testing, and moisture exposure analysis on heavy-duty kraft packaging.',
        teacher_id: dawitId,
        teacher_name: 'Dawit Haile',
        location: 'Arenguade Workshop Studio, Bole Sub-City, Addis Ababa',
        starts_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8).toISOString(),
        ends_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8 + 1000 * 60 * 200).toISOString(),
        capacity: 15,
        price: 600,
        status: 'scheduled',
        livekit_room_name: 'arenguade-inperson-203'
      }
    ];

    const sessionIds = [];
    for (const s of sessions) {
      const sRes = await client.query(`
        INSERT INTO public.class_sessions (
          type, title, description, teacher_id, teacher_name, location, starts_at, ends_at, start_time, end_time, capacity, price, status, livekit_room_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $7, $8, $9, $10, $11::session_status, $12)
        RETURNING id, title;
      `, [s.type, s.title, s.description, s.teacher_id, s.teacher_name, s.location, s.starts_at, s.ends_at, s.capacity, s.price, s.status, s.livekit_room_name]);
      sessionIds.push(sRes.rows[0]);
    }
    console.log("✅ Seeded 6 class sessions!");

    // 6. Seed Sample Orders with real status timeline
    console.log("Seeding sample orders & order status histories...");
    const selamId = userMap['customer.selam@gmail.com'];
    const tarikuId = userMap['customer.tariku@gmail.com'];
    const helenId = userMap['customer.helen@gmail.com'];
    const adminId = userMap['admin@arenguade.com'];

    // Order 1: Pending Verification (Tariku)
    const o1Res = await client.query(`
      INSERT INTO public.orders (
        order_number, buyer_id, status, total_price, delivery_address, phone, notes, bank_account_id, payment_proof_path
      ) VALUES (
        'ARN-2026-0001', $1, 'pending_verification'::order_status, 36000, 'Bole Japan Embassy Area, Addis Ababa', '+251911000005', 'Handle with care', $2, 'seed/proof_tariku_cbe.jpg'
      ) RETURNING id;
    `, [tarikuId, defaultBankId]);
    const o1Id = o1Res.rows[0].id;
    await client.query(`
      INSERT INTO public.order_items (order_id, product_id, quantity, unit_price_snapshot)
      VALUES ($1, $2, 200, 180);
    `, [o1Id, productIds[0].id]);
    await client.query(`
      INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
      VALUES 
        ($1, 'pending_payment', 'pending_verification', $2, 'Customer uploaded CBE receipt screenshot');
    `, [o1Id, tarikuId]);

    // Order 2: Approved (Selam)
    const o2Res = await client.query(`
      INSERT INTO public.orders (
        order_number, buyer_id, status, total_price, delivery_address, phone, bank_account_id, payment_proof_path, verified_by, verified_at
      ) VALUES (
        'ARN-2026-0002', $1, 'approved'::order_status, 26000, 'Kazanchis Menelik II Ave, Addis Ababa', '+251911000004', $2, 'seed/proof_selam_telebirr.png', $3, NOW()
      ) RETURNING id;
    `, [selamId, defaultBankId, adminId]);
    const o2Id = o2Res.rows[0].id;
    await client.query(`
      INSERT INTO public.order_items (order_id, product_id, quantity, unit_price_snapshot)
      VALUES ($1, $2, 100, 260);
    `, [o2Id, productIds[1].id]);
    await client.query(`
      INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
      VALUES 
        ($1, 'pending_payment', 'pending_verification', $2, 'Telebirr transaction confirmed'),
        ($1, 'pending_verification', 'approved', $3, 'Admin verified CBE transfer of 26,000 ETB');
    `, [o2Id, selamId, adminId]);

    // Order 3: In Production (Helen)
    const o3Res = await client.query(`
      INSERT INTO public.orders (
        order_number, buyer_id, status, total_price, delivery_address, phone, bank_account_id, payment_proof_path, verified_by, verified_at
      ) VALUES (
        'ARN-2026-0003', $1, 'in_production'::order_status, 50000, 'CMC Michael, Addis Ababa', '+251911000006', $2, 'seed/proof_helen_awash.pdf', $3, NOW()
      ) RETURNING id;
    `, [helenId, defaultBankId, adminId]);
    const o3Id = o3Res.rows[0].id;
    await client.query(`
      INSERT INTO public.order_items (order_id, product_id, quantity, unit_price_snapshot)
      VALUES ($1, $2, 200, 250);
    `, [o3Id, productIds[2].id]);
    await client.query(`
      INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
      VALUES 
        ($1, 'pending_payment', 'pending_verification', $2, 'Awash online deposit receipt uploaded'),
        ($1, 'pending_verification', 'approved', $3, 'Payment verified'),
        ($1, 'approved', 'in_production', $3, 'Batch scheduled for printing & die-cutting');
    `, [o3Id, helenId, adminId]);

    // 7. Seed Enrollments
    console.log("Seeding class enrollments...");
    // Selam approved in Live Masterclass 101
    await client.query(`
      INSERT INTO public.enrollments (session_id, student_id, status, payment_proof_path, verified_by, verified_at, attended)
      VALUES ($1, $2, 'approved'::enrollment_status, 'seed/enroll_selam.jpg', $3, NOW(), false);
    `, [sessionIds[0].id, selamId, adminId]);

    // Tariku pending in Live Masterclass 101
    await client.query(`
      INSERT INTO public.enrollments (session_id, student_id, status, payment_proof_path)
      VALUES ($1, $2, 'pending_verification'::enrollment_status, 'seed/enroll_tariku.png');
    `, [sessionIds[0].id, tarikuId]);

    // Helen approved in In-person 201
    await client.query(`
      INSERT INTO public.enrollments (session_id, student_id, status, payment_proof_path, verified_by, verified_at, attended)
      VALUES ($1, $2, 'approved'::enrollment_status, 'seed/enroll_helen.pdf', $3, NOW(), true);
    `, [sessionIds[3].id, helenId, adminId]);

    // 8. Seed Custom Designs
    console.log("Seeding custom design submissions...");
    await client.query(`ALTER TABLE public.designs ALTER COLUMN file_url DROP NOT NULL;`);
    await client.query(`DELETE FROM public.designs;`);
    await client.query(`
      INSERT INTO public.designs (submitted_by, title, description, file_path, file_url, status)
      VALUES ($1, 'Embossed Coffee Pouch with Gold Seal', 'We need a bespoke 250g coffee pouch with gold hot foil stamping and side gusset for our export brand.', 'seed/design_selam.pdf', 'seed/design_selam.pdf', 'new'::design_status);
    `, [selamId]);

    await client.query(`
      INSERT INTO public.designs (submitted_by, title, description, file_path, file_url, status, admin_reply, quoted_price)
      VALUES ($1, 'Traditional Harari Pattern Retail Box', 'Specialty pastry gift box with rigid magnetic closure and Harari geometric motif.', 'seed/design_tariku.png', 'seed/design_tariku.png', 'quoted'::design_status, 'We can produce 500 units with high-density kraft board and matte lamination. Quoted at 450 ETB/unit.', 450);
    `, [tarikuId]);

    // 9. Seed Notifications
    console.log("Seeding initial notifications...");
    await client.query(`DELETE FROM public.notifications;`);
    await client.query(`
      INSERT INTO public.notifications (user_id, title, body, link, is_read)
      VALUES 
        ($1, 'Welcome to Ethiopia Arenguade Paper Product', 'Your business account is active. Explore our eco-friendly packaging collection.', '/products', false),
        ($1, 'Order ARN-2026-0002 Approved', 'Your order of 100 units has been verified and approved.', '/dashboard/orders/' || $2, false),
        ($3, 'Class Registration Approved', 'Your seat for "Live Masterclass: Eco Packaging Die-Line Geometry" is confirmed!', '/dashboard', false),
        ($4, 'Design Quote Ready', 'Admin has provided a quote for "Traditional Harari Pattern Retail Box".', '/dashboard', false);
    `, [selamId, o2Id, selamId, tarikuId]);

    // 10. Seed Audit Log
    console.log("Seeding audit log entries...");
    await client.query(`DELETE FROM public.audit_log;`);
    await client.query(`
      INSERT INTO public.audit_log (actor_id, action, entity, entity_id, metadata)
      VALUES 
        ($1, 'SYSTEM_SEED', 'system', 'init', '{"seeded_by": "seed_script", "version": "2.0"}'::jsonb),
        ($1, 'APPROVE_PAYMENT', 'orders', $2, '{"order_number": "ARN-2026-0002", "amount": 26000}'::jsonb),
        ($1, 'APPROVE_ENROLLMENT', 'enrollments', $3, '{"session_title": "Live Masterclass: Eco Packaging Die-Line Geometry"}'::jsonb);
    `, [adminId, o2Id, sessionIds[0].id]);

    console.log("\n=======================================================");
    console.log("🎉 SEED COMPLETED SUCCESSFULLY!");
    console.log("=======================================================");
    console.log("Seed Credentials:");
    console.log("  Admin:    admin@arenguade.com / Password123!");
    console.log("  Teacher:  teacher.tigist@arenguade.com / Password123!");
    console.log("  Teacher:  teacher.dawit@arenguade.com / Password123!");
    console.log("  Customer: customer.selam@gmail.com / Password123!");
    console.log("  Customer: customer.tariku@gmail.com / Password123!");
    console.log("  Customer: customer.helen@gmail.com / Password123!");
    console.log("=======================================================\n");

  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
