import { Pool } from "pg";

// Singleton PostgreSQL pool for direct administrative and schema operations
declare global {
  var __pgPool: Pool | undefined;
}

function resolveSslConfig() {
  const ca = process.env.PG_SSL_CA?.replace(/\\n/g, "\n");
  if (ca) {
    return { rejectUnauthorized: true, ca };
  }
  const strict = process.env.PG_SSL_REJECT_UNAUTHORIZED === "true";
  return { rejectUnauthorized: strict };
}

function getPoolInstance(): Pool {
  if (global.__pgPool) {
    return global.__pgPool;
  }

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DIRECT_URL;

  if (!connectionString) {
    throw new Error(
      "Missing database connection string. Set DATABASE_URL or DIRECT_URL in your environment or Vercel Project Settings."
    );
  }

  const instance = new Pool({
    connectionString,
    ssl: resolveSslConfig(),
    max: 10,
    idleTimeoutMillis: 30000,
  });

  if (process.env.NODE_ENV !== "production") {
    global.__pgPool = instance;
  }

  return instance;
}

export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop: string | symbol) {
    const instance = getPoolInstance();
    const val = (instance as any)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});
