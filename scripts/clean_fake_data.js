'use strict';
const { Client } = require('pg');

const DIRECT_URL =
  process.env.DIRECT_URL ||
  'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('Beginning Fresh Start Database Cleanup...\n');

  try {
    await client.query('BEGIN');

    // 1. Clean transactional test data
    console.log('1. Clearing test order items...');
    await client.query('DELETE FROM public.order_items');

    console.log('2. Clearing test order status history...');
    await client.query('DELETE FROM public.order_status_history');

    console.log('3. Clearing test orders...');
    await client.query('DELETE FROM public.orders');

    console.log('4. Clearing test academy enrollments...');
    await client.query('DELETE FROM public.enrollments');

    // Class session enrollments are computed dynamically from the enrollments table, so clearing enrollments resets counts to 0.

    console.log('6. Clearing test designs...');
    await client.query('DELETE FROM public.designs');

    console.log('7. Clearing test notifications...');
    await client.query('DELETE FROM public.notifications');

    console.log('8. Clearing test audit logs...');
    await client.query('DELETE FROM public.audit_log');

    // 2. Identify test users to delete from auth.users (cascades to profiles)
    console.log('9. Deleting test user accounts from auth.users...');
    const testUsersRes = await client.query(`
      SELECT id, email FROM auth.users 
      WHERE email LIKE '%@testgreenwork.com' 
         OR email LIKE 'testcustomer123@%'
    `);

    console.log(`Found ${testUsersRes.rows.length} test accounts to remove.`);
    for (const u of testUsersRes.rows) {
      // First ensure profile is deleted if not cascading
      await client.query('DELETE FROM public.profiles WHERE id = $1', [u.id]);
      await client.query('DELETE FROM auth.users WHERE id = $1', [u.id]);
      console.log(`   - Deleted: ${u.email}`);
    }

    // 3. Log an initial clean audit log entry
    await client.query(`
      INSERT INTO public.audit_log (actor_id, action, entity, entity_id, metadata)
      VALUES (
        '317300cb-9b00-43b5-bcf3-f457e30a6589',
        'SYSTEM_FRESH_START',
        'system',
        '317300cb-9b00-43b5-bcf3-f457e30a6589',
        '{"reason": "Cleared automated testing artifacts and test orders for production readiness"}'::jsonb
      )
    `);

    await client.query('COMMIT');
    console.log('\nFresh Start Database Cleanup successfully COMMITTED!\n');

    // Verification check
    console.log('--- POST-CLEANUP STATUS ---');
    const tables = ['orders', 'order_items', 'order_status_history', 'enrollments', 'designs', 'notifications', 'audit_log', 'products', 'bank_accounts', 'class_sessions'];
    for (const t of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM public.${t}`);
      console.log(`${t}: ${res.rows[0].count}`);
    }

    const remainingUsers = await client.query('SELECT email, role FROM public.profiles ORDER BY created_at ASC');
    console.log('\n--- ACTIVE PRESERVED PROFILES ---');
    for (const p of remainingUsers.rows) {
      console.log(`- ${p.email} (${p.role})`);
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cleanup failed, transaction rolled back:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
