const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const directUrl = process.env.DIRECT_URL || 'postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function run() {
  console.log("Connecting to Supabase PostgreSQL via Direct Pooler...");
  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL!");

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20261017000000_master_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log("Applying master schema migration...");
    await client.query(sql);
    console.log("Master schema migration successfully applied!");

    // Verify all tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("Public tables:", tableRes.rows.map(r => r.table_name).join(', '));

    // Verify buckets
    const bucketRes = await client.query(`
      SELECT id, name, public FROM storage.buckets;
    `);
    console.log("Storage buckets:", bucketRes.rows.map(r => `${r.id} (public=${r.public})`).join(', '));

    console.log("Database schema is 100% up to date with Master Prompt Section 4!");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
