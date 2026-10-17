const { Client } = require('pg');
const directUrl = process.env.DIRECT_URL || 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function run() {
  const client = new Client({ connectionString: directUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  await client.query(`
    CREATE OR REPLACE FUNCTION public.register_for_session(
      p_session_id UUID,
      p_student_id UUID,
      p_payment_proof_path TEXT DEFAULT ''
    )
    RETURNS JSONB AS $$
    BEGIN
      RETURN public.register_for_session_atomic(p_session_id, p_student_id, p_payment_proof_path);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);

  console.log("✅ Alias register_for_session created successfully");
  await client.end();
}

run().catch(console.error);
