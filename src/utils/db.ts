import { Pool } from "pg";

const FALLBACK_DATABASE_URL =
  "postgresql://postgres.heslqxyonklerdcxjohf:2122Eyoab2122@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  FALLBACK_DATABASE_URL;

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
