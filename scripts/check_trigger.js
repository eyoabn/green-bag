const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
  `);
  console.log('handle_new_user body:\n', res.rows[0]?.prosrc);
  await client.end();
}
run().catch(console.error);
