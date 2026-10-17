const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log("Adding confirmed to enrollment_status enum...");
  await client.query(`
    ALTER TYPE enrollment_status ADD VALUE IF NOT EXISTS 'confirmed';
  `);
  console.log("Enum updated!");
  await client.end();
}
run().catch(console.error);
