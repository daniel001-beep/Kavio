import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function runMigration() {
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ No connection string found.");
    process.exit(1);
  }
  
  console.log("Connecting to Database...");
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  const db = drizzle(pool);

  try {
    console.log("Adding columns to client table...");
    await db.execute(sql`ALTER TABLE "client" ADD COLUMN IF NOT EXISTS "industry" text;`);
    await db.execute(sql`ALTER TABLE "client" ADD COLUMN IF NOT EXISTS "notes" text;`);

    console.log("Adding columns to invoice table...");
    await db.execute(sql`ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "is_automated_reminder_enabled" boolean DEFAULT true;`);
    await db.execute(sql`ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "last_reminder_sent_at" timestamp;`);
    await db.execute(sql`ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0;`);
    await db.execute(sql`ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "viewed_at" timestamp;`);
    await db.execute(sql`ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "client_portal_token" text;`);

    console.log("Creating client_notes table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "client_notes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "client_id" uuid NOT NULL REFERENCES "client"("id") ON DELETE CASCADE,
        "note" text NOT NULL,
        "category" text NOT NULL DEFAULT 'MEETING',
        "created_at" timestamp DEFAULT now()
      );
    `);

    console.log("Creating client_tags table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "client_tags" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "client_id" uuid NOT NULL REFERENCES "client"("id") ON DELETE CASCADE,
        "tag" text NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `);

    console.log("Creating client_activities table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "client_activities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "client_id" uuid NOT NULL REFERENCES "client"("id") ON DELETE CASCADE,
        "event_type" text NOT NULL,
        "description" text NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `);

    console.log("Creating client_scores table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "client_scores" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "client_id" uuid NOT NULL REFERENCES "client"("id") ON DELETE CASCADE,
        "health_score" integer NOT NULL DEFAULT 100,
        "reliability_status" text NOT NULL DEFAULT 'Reliable',
        "payment_speed" integer,
        "completion_rate" integer,
        "outstanding_balance" double precision DEFAULT 0,
        "overdue_balance" double precision DEFAULT 0,
        "updated_at" timestamp DEFAULT now()
      );
    `);

    console.log("Creating client_contacts table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "client_contacts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "client_id" uuid NOT NULL REFERENCES "client"("id") ON DELETE CASCADE,
        "contact_name" text NOT NULL,
        "email" text,
        "phone" text,
        "role" text,
        "created_at" timestamp DEFAULT now()
      );
    `);

    console.log("Creating client_followups table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "client_followups" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "client_id" uuid NOT NULL REFERENCES "client"("id") ON DELETE CASCADE,
        "followup_date" timestamp NOT NULL,
        "notes" text,
        "status" text NOT NULL DEFAULT 'PENDING',
        "created_at" timestamp DEFAULT now()
      );
    `);

    console.log("Creating client_relationships table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "client_relationships" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "client_id" uuid NOT NULL REFERENCES "client"("id") ON DELETE CASCADE,
        "preferred_method" text NOT NULL DEFAULT 'EMAIL',
        "last_contact_date" timestamp,
        "next_follow_up_date" timestamp,
        "notes" text,
        "created_at" timestamp DEFAULT now()
      );
    `);

    console.log("Creating indices for performance...");
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_client_notes_client" ON "client_notes"("client_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_client_tags_client" ON "client_tags"("client_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_client_act_client" ON "client_activities"("client_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_client_scr_client" ON "client_scores"("client_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_client_con_client" ON "client_contacts"("client_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_client_flw_client" ON "client_followups"("client_id");`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_client_rel_client" ON "client_relationships"("client_id");`);

    console.log("🎉 Clients schema migrated successfully!");
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message || err);
  } finally {
    await pool.end();
  }
}

runMigration();
