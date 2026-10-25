const { Client } = require('pg');
const DIRECT_URL = process.env.DIRECT_URL || 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const c = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const buckets = await c.query("SELECT id, name, public FROM storage.buckets");
  console.log('Buckets:', buckets.rows);

  const policies = await c.query("SELECT polname, polcmd, pg_get_expr(polqual, polrelid) as qual FROM pg_policy WHERE polrelid = 'storage.objects'::regclass");
  console.log('Policies on storage.objects:');
  policies.rows.forEach(p => console.log(`- ${p.polname} (${p.polcmd}): ${p.qual}`));

  await c.end();
}
main().catch(console.error);
