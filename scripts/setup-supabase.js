const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function run() {
  console.log("Connecting to Supabase Postgres via direct pooler...");
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ Successfully connected to Supabase PostgreSQL!");

    // 1. Read schema.sql
    const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log("Applying database schema from supabase/schema.sql...");
    await client.query(schemaSql);
    console.log("✅ Schema successfully applied!");

    // 2. Add auth trigger for resilient profile creation
    console.log("Adding automated auth user profile trigger...");
    const triggerSql = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, full_name, phone, role)
        VALUES (
          new.id,
          COALESCE(new.raw_user_meta_data->>'full_name', 'Valued Customer'),
          COALESCE(new.raw_user_meta_data->>'phone', ''),
          COALESCE(new.raw_user_meta_data->>'role', 'customer')
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone,
          role = EXCLUDED.role;
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `;
    await client.query(triggerSql);
    console.log("✅ Auth profile trigger created!");

    // 3. Create Storage Buckets
    console.log("Provisioning storage buckets...");
    const storageBucketsSql = `
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES 
        ('payment-proofs', 'payment-proofs', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
        ('dielines', 'dielines', true, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/vnd.adobe.photoshop', 'application/illustrator', 'application/octet-stream']),
        ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
        ('payment-screenshots', 'payment-screenshots', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
        ('submitted-designs', 'submitted-designs', true, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/octet-stream'])
      ON CONFLICT (id) DO UPDATE SET
        public = EXCLUDED.public,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

      -- Allow public access to public buckets in storage.objects
      DROP POLICY IF EXISTS "Public Access" ON storage.objects;
      CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id IN ('payment-proofs', 'dielines', 'product-images', 'payment-screenshots', 'submitted-designs'));

      DROP POLICY IF EXISTS "Authenticated and public uploads" ON storage.objects;
      CREATE POLICY "Authenticated and public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('payment-proofs', 'dielines', 'product-images', 'payment-screenshots', 'submitted-designs'));
    `;
    await client.query(storageBucketsSql);
    console.log("✅ Storage buckets ('payment-proofs', 'dielines', 'product-images', etc.) successfully created and configured!");

    // 4. Seed initial default bank accounts if empty
    console.log("Checking and seeding default Ethiopian bank accounts...");
    const seedBanksSql = `
      INSERT INTO public.bank_accounts (bank_name, account_name, account_number, is_active)
      SELECT 'Commercial Bank of Ethiopia (CBE)', 'Arenguade Paper Products PLC', '1000123456789', true
      WHERE NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE bank_name LIKE '%Commercial Bank of Ethiopia%');

      INSERT INTO public.bank_accounts (bank_name, account_name, account_number, is_active)
      SELECT 'Telebirr', 'Arenguade Paper Products (Merchant)', '+251911223344', true
      WHERE NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE bank_name LIKE '%Telebirr%');

      INSERT INTO public.bank_accounts (bank_name, account_name, account_number, is_active)
      SELECT 'Awash Bank', 'Arenguade Paper Products PLC', '01320876543200', true
      WHERE NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE bank_name LIKE '%Awash%');
    `;
    await client.query(seedBanksSql);
    console.log("✅ Settlement bank accounts checked/seeded!");

    // 5. Query verification
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("Live tables in public schema:", tableRes.rows.map(r => r.table_name).join(', '));

    const bucketRes = await client.query(`
      SELECT id, name, public FROM storage.buckets;
    `);
    console.log("Live storage buckets:", bucketRes.rows.map(r => `${r.id} (public=${r.public})`).join(', '));

    console.log("🎉 ALL DATABASE MIGRATIONS AND STORAGE PROVISIONING COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Error running migration:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
