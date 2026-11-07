const { createClient } = require('./db-config');
const client = createClient();

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
