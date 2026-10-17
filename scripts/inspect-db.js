const { Client } = require('pg');
const directUrl = process.env.DIRECT_URL || 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';
const client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });

async function check() {
  await client.connect();
  const tables = ['profiles', 'products', 'bank_accounts', 'orders', 'order_items', 'order_status_history', 'designs', 'class_sessions', 'enrollments', 'notifications', 'audit_log', 'settings'];
  for (const t of tables) {
    const res = await client.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [t]);
    console.log(`\nTable ${t}:`);
    console.log(res.rows.map(r => `  ${r.column_name}: ${r.udt_name} (${r.data_type})`).join('\n'));
  }
  await client.end();
}

check();
