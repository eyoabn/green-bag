const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log("Adding verified and delivered to order_status enum...");
  await client.query(`
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'verified';
  `);
  await client.query(`
    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'delivered';
  `);
  console.log("Enum values added successfully!");

  const res = await client.query(`
    SELECT enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'order_status';
  `);
  console.log('Updated order_status enum values:', res.rows.map(r => r.enumlabel));
  await client.end();
}
run().catch(console.error);
