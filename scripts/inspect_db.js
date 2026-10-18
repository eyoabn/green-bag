'use strict';
const { Client } = require('pg');

const DIRECT_URL =
  process.env.DIRECT_URL ||
  'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  await client.query("UPDATE public.profiles SET email = 'eyoab.nigusie@astu.edu.et' WHERE id = 'ccfdb1d1-4e4c-4e12-af3a-6497d926ea78'");
  console.log('--- USER ACCOUNTS ---');
  const usersRes = await client.query('SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC');
  for (const u of usersRes.rows) {
    console.log(`- ${u.email} (${u.id}) [${u.created_at}]`);
  }

  console.log('\n--- ROW COUNTS ---');
  const tables = ['orders', 'order_items', 'order_status_history', 'enrollments', 'designs', 'notifications', 'audit_log', 'products', 'bank_accounts', 'class_sessions'];
  for (const t of tables) {
    const res = await client.query(`SELECT COUNT(*) FROM public.${t}`);
    console.log(`${t}: ${res.rows[0].count}`);
  }

  await client.end();
}

main().catch(console.error);
