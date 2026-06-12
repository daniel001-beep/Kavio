import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const dbUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const isPlaceholder = !dbUrl || dbUrl.includes("your_postgres_url_here") || dbUrl.includes("placeholder");

// We do not throw at module load time so the Next.js static build step doesn't crash 
// if environment variables are missing during the CI build phase.
// It will gracefully fail at runtime if a query is attempted without a valid URL.
const globalForDb = global as unknown as { pool: Pool | undefined };

if (!globalForDb.pool) {
  globalForDb.pool = new Pool({
    connectionString: isPlaceholder ? "postgres://invalid-placeholder-host:5432/db" : dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  if (isPlaceholder) {
    // Override connect and query methods to throw a descriptive error instead of a confusing DNS error
    globalForDb.pool.connect = (cb?: any) => {
      const err = new Error("Database URL is not configured. Please update POSTGRES_URL in .env.local with your database connection string.");
      if (cb) {
        cb(err, null, () => {});
        return;
      }
      return Promise.reject(err);
    };

    globalForDb.pool.query = (text: any, params: any, cb: any) => {
      const err = new Error("Database URL is not configured. Please update POSTGRES_URL in .env.local with your database connection string.");
      const callback = typeof params === 'function' ? params : cb;
      if (callback) {
        callback(err, null);
        return;
      }
      return Promise.reject(err);
    };
  }
}

export const db = drizzle(globalForDb.pool, { schema });
