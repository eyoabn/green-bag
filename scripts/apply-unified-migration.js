const { createClient } = require('./db-config');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = createClient();
  await client.connect();
  console.log("Connected to Supabase PostgreSQL.");

  try {
    const migrationFile = path.resolve(__dirname, '../supabase/migrations/20261107000000_unify_schema_drift.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log("Applying unified schema drift migration...");
    await client.query(sql);
    console.log("✅ Unified schema migration applied successfully!");

    // Verify columns on class_sessions
    const cs = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'class_sessions' AND column_name = 'ended_at'");
    console.log("class_sessions.ended_at column exists:", cs.rows.length > 0);

    // Verify order_items
    const oi = await client.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'order_items' AND column_name IN ('product_id', 'custom_design_id')");
    console.log("order_items columns:", oi.rows);

    // Verify functions
    const fn1 = await client.query("SELECT proname FROM pg_proc WHERE proname IN ('create_order_atomic', 'check_rate_limit')");
    console.log("Verified functions:", fn1.rows.map(r => r.proname));

  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

