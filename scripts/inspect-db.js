const { Client } = require('pg');
const { getDirectUrl } = require('./db-config');
const DIRECT_URL = getDirectUrl();

async function main() {
  const c = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const settingsCols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'settings'");
  console.log('settings columns:', settingsCols.rows);

  const settingsRows = await c.query("SELECT * FROM public.settings");
  console.log('settings rows:', settingsRows.rows);

  const cols = await c.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products'");
  console.log('products columns:', cols.rows);
  const sample = await c.query("SELECT * FROM public.products LIMIT 2");
  console.log('sample products:', sample.rows);
  await c.end();
}
main().catch(console.error);
