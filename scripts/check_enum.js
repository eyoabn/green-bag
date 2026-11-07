const { createClient } = require('./db-config');
const client = createClient();

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'enrollment_status';
  `);
  console.log('enrollment_status enum values:', res.rows.map(r => r.enumlabel));
  await client.end();
}
run().catch(console.error);
