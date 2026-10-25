const { Client } = require('pg');
const DIRECT_URL = process.env.DIRECT_URL || 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const c = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const policies = await c.query(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname IN ('public', 'storage')
    ORDER BY schemaname, tablename, policyname
  `);
  
  console.log('Total policies found:', policies.rows.length);
  for (const p of policies.rows) {
    console.log(`[${p.schemaname}.${p.tablename}] "${p.policyname}" cmd=${p.cmd} permissive=${p.permissive}`);
    if (p.qual) console.log(`   qual: ${p.qual}`);
    if (p.with_check) console.log(`   with_check: ${p.with_check}`);
  }

  await c.end();
}
main().catch(console.error);
