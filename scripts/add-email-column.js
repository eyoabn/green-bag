const { Client } = require('pg');
const directUrl = process.env.DIRECT_URL || 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  await client.query(`
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
    UPDATE public.profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, full_name, phone, role, is_active, email)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'phone', ''),
        'customer',
        true,
        new.email
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
        phone = CASE WHEN profiles.phone = '' THEN EXCLUDED.phone ELSE profiles.phone END;
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);

  const res = await client.query('SELECT id, full_name, role, email, is_active FROM public.profiles ORDER BY created_at DESC');
  console.log("✅ Profiles with email:", res.rows);
  await client.end();
}

run().catch(console.error);
