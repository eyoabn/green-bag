const { Client } = require('pg');
const DIRECT_URL = process.env.DIRECT_URL || 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const c = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  
  await c.query(`
    ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"facebook":"","instagram":"","telegram":"","linkedin":""}'::jsonb;
    CREATE OR REPLACE VIEW public.site_settings AS SELECT * FROM public.settings;
  `);

  console.log('Phase 3 DB updates applied successfully.');
  await c.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
