const { Client } = require('pg');
const DIRECT_URL = process.env.DIRECT_URL || 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const c = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  console.log('Dropping conflicting legacy public policy on storage.objects...');
  await c.query(`DROP POLICY IF EXISTS "Public Access" ON storage.objects;`);
  await c.query(`DROP POLICY IF EXISTS "Authenticated and public uploads" ON storage.objects;`);
  console.log('Legacy policies dropped.');

  await c.end();
}
main().catch(console.error);
