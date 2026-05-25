import { Pool } from "pg";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const connectionString = "postgres://postgres:Z9QZIS6lXSIBNBdR@db.lyhgfezubrbgikuxhcug.supabase.co:5432/postgres?sslmode=require";
  
  console.log("Connecting directly to db.lyhgfezubrbgikuxhcug.supabase.co:5432 from Vercel...");

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const queries = [
    // 1. Enable RLS on audit_log
    `ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;`,

    // 2. Drop existing RLS policies on audit_log if they exist
    `DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.audit_log;`,
    `DROP POLICY IF EXISTS "Allow insert for everyone" ON public.audit_log;`,

    // 3. Create RLS policies on audit_log to allow SELECT and INSERT
    `CREATE POLICY "Allow select for authenticated users" ON public.audit_log FOR SELECT USING (true);`,
    `CREATE POLICY "Allow insert for everyone" ON public.audit_log FOR INSERT WITH CHECK (true);`,

    // 4. Grant select/insert privileges to authenticated, anon, and service_role
    `GRANT SELECT, INSERT ON public.audit_log TO authenticated, anon, service_role;`,

    // 5. Ensure publication exists and add tables to realtime publication
    `DO $$
     BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
             CREATE PUBLICATION supabase_realtime;
         END IF;
         
         BEGIN
             ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_log;
         EXCEPTION
             WHEN duplicate_object THEN NULL;
         END;
         
         BEGIN
             ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction;
         EXCEPTION
             WHEN duplicate_object THEN NULL;
         END;

         BEGIN
             ALTER PUBLICATION supabase_realtime ADD TABLE public."user";
         EXCEPTION
             WHEN duplicate_object THEN NULL;
         END;
     END $$;`
  ];

  const results: string[] = [];

  try {
    for (const q of queries) {
      await pool.query(q);
      results.push(`Successfully executed: ${q.substring(0, 50)}...`);
    }
    return NextResponse.json({
      status: "success",
      results
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: err.message || err,
      results
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}
