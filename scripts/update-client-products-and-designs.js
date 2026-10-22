'use strict';
const { Client } = require('pg');

const DIRECT_URL =
  process.env.DIRECT_URL ||
  'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const client = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log('1. Adding is_client_work column to public.products...');
  await client.query(`
    ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS is_client_work BOOLEAN DEFAULT false;
  `);

  console.log('2. Tagging client-exclusive products...');
  // Mark company-specific branded deliverables as client works
  await client.query(`
    UPDATE public.products 
    SET is_client_work = true
    WHERE name ILIKE '%Rare%'
       OR name ILIKE '%Richo%'
       OR name ILIKE '%Hassan Adama%'
       OR name ILIKE '%Liora%'
       OR name ILIKE '%Family Dental%'
       OR name ILIKE '%Vero Tiramisu%';
  `);

  // Ensure generic/stock products remain orderable
  await client.query(`
    UPDATE public.products 
    SET is_client_work = false
    WHERE name ILIKE '%Grocery%'
       OR name ILIKE '%Addis Corporate%'
       OR is_client_work IS NULL;
  `);

  console.log('3. Adding structured spec columns to public.designs...');
  await client.query(`
    ALTER TABLE public.designs 
    ADD COLUMN IF NOT EXISTS quantity TEXT DEFAULT '1,000 pcs',
    ADD COLUMN IF NOT EXISTS dimensions TEXT DEFAULT 'Medium (26cm × 32cm + 10cm)',
    ADD COLUMN IF NOT EXISTS gsm INTEGER DEFAULT 200,
    ADD COLUMN IF NOT EXISTS handle_type TEXT DEFAULT 'Twisted Kraft Cord',
    ADD COLUMN IF NOT EXISTS print_finish TEXT DEFAULT '1-Color Screenprint',
    ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'Standard (7-10 Days)',
    ADD COLUMN IF NOT EXISTS specs_json JSONB DEFAULT '{}'::jsonb;
  `);

  console.log('4. Verifying updated products:');
  const prods = await client.query(`
    SELECT id, name, is_client_work, is_available FROM public.products ORDER BY is_client_work DESC, name ASC;
  `);
  for (const r of prods.rows) {
    console.log(` - [${r.is_client_work ? 'CLIENT SHOWCASE' : 'ORDERABLE CATALOG'}] ${r.name}`);
  }

  await client.end();
  console.log('\n✅ Database schema and data successfully updated!');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
