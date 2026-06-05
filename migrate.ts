import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function runMigration() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ No connection string found. Set POSTGRES_URL or DATABASE_URL in .env.local");
    process.exit(1);
  }
  
  console.log("Connecting to Database host...");
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  const db = drizzle(pool);

  try {
    console.log("Adding columns to user table if they don't exist...");
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "plan_type" text DEFAULT 'FREE';`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'ACTIVE';`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_login" timestamp;`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_activity" timestamp;`);
    console.log("✅ User columns added successfully.");

    console.log("Creating user_activity_logs table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_activity_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "event_type" text NOT NULL,
        "metadata" jsonb DEFAULT '{}',
        "timestamp" timestamp DEFAULT now()
      );
    `);
    console.log("✅ user_activity_logs table created.");

    console.log("Creating login_logs table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "login_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "ip_address" text,
        "user_agent" text,
        "device_type" text,
        "status" text NOT NULL DEFAULT 'SUCCESS',
        "timestamp" timestamp DEFAULT now()
      );
    `);
    console.log("✅ login_logs table created.");

    console.log("Creating feature_usage_events table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "feature_usage_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "feature_name" text NOT NULL,
        "metadata" jsonb DEFAULT '{}',
        "timestamp" timestamp DEFAULT now()
      );
    `);
    console.log("✅ feature_usage_events table created.");

    console.log("Creating support_tickets table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "support_tickets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "category" text NOT NULL,
        "priority" text NOT NULL DEFAULT 'MEDIUM',
        "status" text NOT NULL DEFAULT 'OPEN',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    console.log("✅ support_tickets table created.");

    console.log("Creating admin_notifications table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "admin_notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "message" text NOT NULL,
        "category" text NOT NULL,
        "is_read" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now()
      );
    `);
    console.log("✅ admin_notifications table created.");

    console.log("Creating receipt_submission table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "receipt_submission" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoice_id" uuid NOT NULL REFERENCES "invoice"("id") ON DELETE CASCADE,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "status" text NOT NULL DEFAULT 'UNDER_REVIEW',
        "confidence_score" double precision NOT NULL DEFAULT 0,
        "fraud_flags" jsonb DEFAULT '[]',
        "receipt_image_base64" text,
        "extracted_amount" double precision,
        "extracted_date" text,
        "extracted_ref" text,
        "reason" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    console.log("✅ receipt_submission table created.");

    console.log("Injecting columns to receipt_submission if they don't exist...");
    await db.execute(sql`ALTER TABLE "receipt_submission" ADD COLUMN IF NOT EXISTS "sender_name" text;`);
    await db.execute(sql`ALTER TABLE "receipt_submission" ADD COLUMN IF NOT EXISTS "receiver_name" text;`);
    await db.execute(sql`ALTER TABLE "receipt_submission" ADD COLUMN IF NOT EXISTS "transaction_time" text;`);
    await db.execute(sql`ALTER TABLE "receipt_submission" ADD COLUMN IF NOT EXISTS "narration" text;`);
    await db.execute(sql`ALTER TABLE "receipt_submission" ADD COLUMN IF NOT EXISTS "bank_name" text;`);
    await db.execute(sql`ALTER TABLE "receipt_submission" ADD COLUMN IF NOT EXISTS "session_id" text;`);
    await db.execute(sql`ALTER TABLE "receipt_submission" ADD COLUMN IF NOT EXISTS "sender_account_last4" text;`);
    await db.execute(sql`ALTER TABLE "receipt_submission" ADD COLUMN IF NOT EXISTS "submitted_ref" text;`);
    await db.execute(sql`ALTER TABLE "receipt_submission" ADD COLUMN IF NOT EXISTS "ocr_result" jsonb DEFAULT '{}';`);
    await db.execute(sql`ALTER TABLE "receipt_submission" ADD COLUMN IF NOT EXISTS "image_hash" text;`);
    await db.execute(sql`ALTER TABLE "receipt_submission" ADD COLUMN IF NOT EXISTS "receipt_hash" text;`);
    await db.execute(sql`ALTER TABLE "receipt_submission" ADD COLUMN IF NOT EXISTS "freelancer_decision" text;`);
    console.log("✅ receipt_submission columns injected.");

    console.log("Creating payment_audit_log table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payment_audit_log" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "invoice_id" uuid NOT NULL REFERENCES "invoice"("id") ON DELETE CASCADE,
        "client_id" uuid NOT NULL REFERENCES "client"("id") ON DELETE CASCADE,
        "receipt_image_base64" text,
        "ocr_result" jsonb DEFAULT '{}',
        "trust_score" double precision NOT NULL DEFAULT 0,
        "fraud_flags" jsonb DEFAULT '[]',
        "freelancer_decision" text,
        "timestamp" timestamp DEFAULT now()
      );
    `);
    console.log("✅ payment_audit_log table created.");


    console.log("🎉 All migrations applied successfully!");
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message || error);
  } finally {
    await pool.end();
  }
}

runMigration();
