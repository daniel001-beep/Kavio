import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

// We do not throw at module load time so the Next.js static build step doesn't crash 
// if environment variables are missing during the CI build phase.
// It will gracefully fail at runtime if a query is attempted without a valid URL.
const globalForDb = global as unknown as { pool: Pool | undefined };

if (!globalForDb.pool) {
  globalForDb.pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export const db = drizzle(globalForDb.pool, { schema });
