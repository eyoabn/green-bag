const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'users';
  `);
  console.log("auth.users columns:");
  console.table(cols.rows);

  const sample = await client.query(`
    SELECT * FROM auth.users WHERE email = 'admin@arenguade.com';
  `);
  console.log("Admin row keys & values:");
  console.log(sample.rows[0]);

  await client.end();
}

run().catch(console.error);
