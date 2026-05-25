import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function enableRealtime() {
  let connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (connectionString) {
    connectionString = connectionString.trim().replace(/^["'()]+|["'()]+$/g, "").trim();
  }
  
  console.log("Connecting to Database...");

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const query = `
    -- 1. Ensure RLS is enabled on public.audit_log
    ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;

    -- 2. Drop existing RLS policies on public.audit_log if they exist
    DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.audit_log;
    DROP POLICY IF EXISTS "Allow insert for everyone" ON public.audit_log;

    -- 3. Create RLS policies on public.audit_log
    CREATE POLICY "Allow select for authenticated users" ON public.audit_log
        FOR SELECT TO authenticated USING (true);

    CREATE POLICY "Allow insert for everyone" ON public.audit_log
        FOR INSERT WITH CHECK (true);

    -- 4. Enable Realtime for the tables by adding them to the supabase_realtime publication
    DO $$
    BEGIN
        -- Ensure publication exists
        IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
            CREATE PUBLICATION supabase_realtime;
        END IF;
        
        -- Add audit_log table to publication
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;
        EXCEPTION
            WHEN duplicate_object THEN
                NULL; -- already added
        END;
        
        -- Add transaction table to publication
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction;
        EXCEPTION
            WHEN duplicate_object THEN
                NULL; -- already added
        END;

        -- Add user table to publication
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public."user";
        EXCEPTION
            WHEN duplicate_object THEN
                NULL; -- already added
        END;
    END $$;
  `;

  console.log("Executing Realtime and RLS Enable SQL...");
  try {
    await pool.query(query);
    console.log("✅ Success! Realtime publication and RLS policies established for audit_log, transaction, and user tables.");
  } catch (err: any) {
    console.error("❌ Final Failure:", err.message || err);
  } finally {
    await pool.end();
  }
  process.exit(0);
}

enableRealtime();
