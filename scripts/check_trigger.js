const { createClient } = require('./db-config');
const client = createClient();
async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
  `);
  console.log('handle_new_user body:\n', res.rows[0]?.prosrc);
  await client.end();
}
run().catch(console.error);
