const { Client } = require('pg');
const DIRECT_URL = process.env.DIRECT_URL || 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const c = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const settingsCols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings'");
  console.log('settings columns:', settingsCols.rows);

  const settingsRows = await c.query("SELECT * FROM public.settings");
  console.log('settings rows:', settingsRows.rows);

  const search = 'admin@arenguade.com';
  const q = await c.query("SELECT id, full_name, email, role, is_active FROM public.profiles WHERE (full_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1) LIMIT $2 OFFSET $3", ['%' + search + '%', 10, 0]);
  console.log('Search result for ' + search + ':', q.rows);
  await c.end();
}
main().catch(console.error);
