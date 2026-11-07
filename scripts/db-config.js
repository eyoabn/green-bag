const fs = require('fs');
const path = require('path');
const { Client, Pool } = require('pg');

function getDirectUrl() {
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envFiles = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env'),
  ];

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      const directMatch = content.match(/^DIRECT_URL=(.*)$/m);
      if (directMatch) {
        return directMatch[1].trim().replace(/^["']|["']$/g, '');
      }
      const dbMatch = content.match(/^DATABASE_URL=(.*)$/m);
      if (dbMatch) {
        return dbMatch[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  }

  throw new Error('DIRECT_URL or DATABASE_URL must be configured in environment or .env.local');
}

function createClient() {
  return new Client({
    connectionString: getDirectUrl(),
    ssl: { rejectUnauthorized: false },
  });
}

function createPool(options = {}) {
  return new Pool({
    connectionString: getDirectUrl(),
    ssl: { rejectUnauthorized: false },
    ...options,
  });
}

module.exports = {
  getDirectUrl,
  createClient,
  createPool,
};

