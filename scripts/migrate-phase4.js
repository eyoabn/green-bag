const { Client } = require('pg');
const DIRECT_URL = process.env.DIRECT_URL || 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function main() {
  const c = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  
  await c.query(`
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    
    -- Ensure at least some seed products are marked is_featured = true so landing page shows them immediately
    UPDATE public.products SET is_featured = true WHERE id IN (SELECT id FROM public.products ORDER BY created_at ASC LIMIT 4);
  `);

  console.log('Phase 4 schema updates (is_featured, is_deleted) applied successfully.');
  await c.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
