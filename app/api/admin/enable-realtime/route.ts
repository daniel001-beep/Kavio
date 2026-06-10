import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { sql } from 'drizzle-orm';
import { getResilientSession } from '@/src/lib/auth-session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // const session = await getResilientSession();
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    // }

    // Create outbox_event table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS outbox_event (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type text NOT NULL,
        payload jsonb NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        attempt_count integer NOT NULL DEFAULT 0,
        next_retry_at timestamp NOT NULL DEFAULT now(),
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    // Attempt to add the "transaction" table to the existing supabase_realtime publication
    await db.execute(sql`ALTER PUBLICATION supabase_realtime ADD TABLE "transaction";`);

    return NextResponse.json({
      status: 'success',
      message: 'Supabase Realtime enabled for the transaction table.',
    });
  } catch (error: any) {
    console.error('Failed to enable realtime:', error);
    
    // If the table is already in the publication, postgres throws a specific error we can safely ignore
    if (error.code === '42704' || error.message?.includes('already exists') || error.message?.includes('already in publication')) {
      return NextResponse.json({
        status: 'success',
        message: 'Realtime was already enabled for the transaction table. No changes made.',
      });
    }

    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
