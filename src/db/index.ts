import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, Client } from "pg";
import * as schema from "./schema";

const isProduction = process.env.NODE_ENV === "production";

// Helper to enforce sslmode=verify-full and avoid the pg-driver warning
function enforceSslMode(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
      const parsedUrl = new URL(url);
      if (!parsedUrl.searchParams.has("sslmode")) {
        parsedUrl.searchParams.set("sslmode", "verify-full");
      }
      return parsedUrl.toString();
    }
  } catch (e) {
    // Fallback if the connection string isn't a standard URL
  }
  return url;
}

// For Vercel/Serverless, we want to handle connections carefully to avoid exhaustion
let dbInstance: any;

if (isProduction) {
  // In production, we use the non-pooling URL for migrations or long-running tasks, 
  // but for the app, we usually use the pooling one. 
  // However, for pure serverless, sometimes a single Client is better if not using a pooler.
  const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  const connectionString = enforceSslMode(rawConnectionString);
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Standard for Supabase
    },
    max: 1, // Keep it low for serverless
    connectionTimeoutMillis: 10000,
  });
  
  dbInstance = drizzle(pool, { schema });
} else {
  // Development: Persistent pool
  if (!(global as any).db) {
    const rawConnectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
    const connectionString = enforceSslMode(rawConnectionString);
    
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    (global as any).db = drizzle(pool, { schema });
  }
  dbInstance = (global as any).db;
}

export const db = dbInstance;

