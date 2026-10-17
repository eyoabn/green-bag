const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const directUrl = 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function testSignupAndLogin() {
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const testEmail = `test.user.${Date.now()}@testgreenwork.com`;
  const testPass = 'Password123!';
  const testName = 'Test User Abebe';
  const testPhone = '0911223344';

  const res = await client.query(`
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
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone_change,
      phone_change_token,
      email_change_token_current,
      reauthentication_token,
      is_super_admin,
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
      json_build_object('full_name', $3::text, 'phone', $4::text, 'role', 'customer'),
      '', '', '', '', '', '', '', '', false,
      NOW(), NOW()
    )
    RETURNING id;
  `, [testEmail, testPass, testName, testPhone]);

  const newId = res.rows[0].id;
  console.log("Inserted auth.users row with id:", newId);

  // Check profile created by trigger
  const prof = await client.query('SELECT * FROM public.profiles WHERE id = $1', [newId]);
  console.log("Trigger created profile:", prof.rows[0]);
  await client.end();

  // Now test logging in with this newly registered user via Supabase Auth
  const supabase = createClient(
    'https://heslqxyonklerdcxjohf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlc2xxeHlvbmtsZXJkY3hqb2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5ODMyOTIsImV4cCI6MjEwNDU1OTI5Mn0.NaVbb5W4lZa82GjtFBjE3hur60p68v5r13OdOwp3iwE'
  );

  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPass,
  });

  if (loginErr) {
    console.error("Sign in failed:", loginErr);
  } else {
    console.log("SUCCESS! User signed up and successfully logged in:", loginData.user?.id, loginData.user?.email);
  }
}

testSignupAndLogin().catch(console.error);
