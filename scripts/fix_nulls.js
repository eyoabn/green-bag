const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const directUrl = 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function fix() {
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Connected to DB, updating NULLs on auth.users...");

  await client.query(`
    UPDATE auth.users 
    SET 
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      is_super_admin = COALESCE(is_super_admin, false);
  `);
  console.log("NULLs updated on auth.users.");
  await client.end();

  // Test Supabase auth login
  console.log("Testing Supabase auth login now...");
  const supabase = createClient(
    'https://heslqxyonklerdcxjohf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlc2xxeHlvbmtsZXJkY3hqb2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5ODMyOTIsImV4cCI6MjEwNDU1OTI5Mn0.NaVbb5W4lZa82GjtFBjE3hur60p68v5r13OdOwp3iwE'
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@arenguade.com',
    password: 'Password123!',
  });

  if (error) {
    console.error("Login failed:", error);
  } else {
    console.log("LOGIN SUCCEEDED! User ID:", data.user?.id, "Email:", data.user?.email);
  }
}

fix().catch(console.error);
