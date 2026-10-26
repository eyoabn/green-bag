import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL;

if (!connectionString) {
  console.warn("WARNING: Neither DATABASE_URL nor DIRECT_URL is defined in the environment. Direct PostgreSQL pool cannot connect.");
}

// Singleton PostgreSQL pool for direct administrative and schema operations
declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

export const pool: Pool =
  global.__pgPool ||
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}
