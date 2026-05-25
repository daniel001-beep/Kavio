import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { transactions, ledgerEntries } from '@/src/db/schema';
import { generateTransactionHash } from '@/src/lib/crypto';
import { createClient } from '@/src/lib/supabase-server';
import { eq, desc } from 'drizzle-orm';
import { transactionRateLimiter } from '@/src/lib/ratelimit';
import { dispatchWebhook } from '@/src/lib/webhooks';
import { cookies, headers } from 'next/headers';
import { getResilientSession } from "@/src/lib/auth-session";


export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  try {
    const session = await getResilientSession();
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = { id: userId, email: userEmail || '' };

    const headersList = await headers();
    const xForwardedFor = headersList.get("x-forwarded-for") || "";
    const locationIp = xForwardedFor ? xForwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "Velox Core";

    // 0. Rate Limiting Check
    if (!transactionRateLimiter.isAllowed(userId)) {
      return NextResponse.json({ 
        error: 'Too many requests. Please slow down (Limit: 5/min).',
      }, { status: 429 });
    }

    const body = await req.json();

    const { amount, idempotencyKey, orderId, metadata, description, status } = body;

    // Validate inputs
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json({ error: 'Valid amount is required (in cents/kobo)' }, { status: 400 });
    }

    if (!idempotencyKey) {
      return NextResponse.json({ error: 'idempotencyKey is required' }, { status: 400 });
    }

    // Parse amount to BigInt
    let amountBigInt = BigInt(Math.floor(parsedAmount));

    // Atomic transaction with retry logic for network resilience
    const MAX_RETRIES = 2;
    let result;
    
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        result = await db.transaction(async (tx) => {
          // 1. Idempotency Check: Prevent duplicate processing
          const existingTx = await tx.query.transactions.findFirst({
            where: eq(transactions.idempotencyKey, idempotencyKey),
          });

          if (existingTx) {
            // Return existing to be idempotent
            return { success: true, transaction: existingTx, idempotent: true };
          }

          // 2. Fetch the most recent transaction for this user to get previousHash
          const lastTx = await tx.query.transactions.findFirst({
            where: eq(transactions.userId, userId),
            orderBy: [desc(transactions.createdAt)],
          });

          const previousHash = lastTx?.hash || null;
          const timestamp = new Date();

          // 3. Generate cryptographic hash
          const hash = generateTransactionHash(
            amountBigInt,
            userId,
            timestamp,
            previousHash
          );

          // 4. Insert main transaction record
          const [newTx] = await tx.insert(transactions).values({
            userId,
            orderId: orderId || null,
            idempotencyKey,
            amount: amountBigInt,
            status: status === 'Paid' ? 'completed' : 'pending',
            hash,
            previousHash,
            metadata: metadata || {},
            createdAt: timestamp,
            completedAt: status === 'Paid' ? timestamp : null,
          }).returning();

          // 5. Insert double-entry ledger records
          await tx.insert(ledgerEntries).values({
            transactionId: newTx.id,
            userId,
            accountType: 'MAIN',
            entryType: amountBigInt > 0n ? 'CREDIT' : 'DEBIT',
            amount: amountBigInt,
            description: description || 'Ledger transaction',
            createdAt: timestamp,
          });

          // Offset entry for balance
          await tx.insert(ledgerEntries).values({
            transactionId: newTx.id,
            userId: 'SYSTEM',
            accountType: 'SETTLEMENT',
            entryType: amountBigInt > 0n ? 'DEBIT' : 'CREDIT',
            amount: -amountBigInt,
            description: `Offset for transaction ${newTx.id}`,
            createdAt: timestamp,
          });

          // Log transaction created in audits
          try {
            const { auditLogs } = await import('@/src/db/schema');
            await tx.insert(auditLogs).values({
              userId,
              eventType: 'TRANSACTION_CREATED',
              entityType: 'transaction',
              entityId: newTx.id,
              changes: { amount: amountBigInt.toString(), idempotencyKey },
              ipAddress: locationIp,
              userAgent: userAgent,
              metadata: { description: description || 'Ledger transaction', amount: Number(amountBigInt) / 100 }
            });
          } catch (auditErr) {
            console.warn('[Audit Log Bypass] Non-blocking: Failed to log TRANSACTION_CREATED event:', auditErr);
          }

          return { success: true, transaction: newTx, idempotent: false };
        });
        
        break; // Success!
      } catch (error) {
        if (i === MAX_RETRIES - 1) throw error; // Re-throw if last attempt fails
        console.warn(`Transaction attempt ${i + 1} failed due to network. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }

    // 6. Dispatch webhook for new successful transactions (Async)
    if (result.success && !result.idempotent) {
      dispatchWebhook(userId, 'transaction.completed', result.transaction);

      // Sync to Supabase 'invoices' table to trigger Sentinel & real-time dashboard updates
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^["'()]+|["'()]+$/g, "").trim();
        const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.replace(/^["'()]+|["'()]+$/g, "").trim();

        if (supabaseUrl && supabaseServiceKey && user.email) {
          const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
          const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
          
          await supabaseAdmin.from('invoices').insert({
            client_name: metadata?.client_name || 'Client',
            description: description || 'Ledger transaction',
            amount: Number(amountBigInt) / 100, // cents to dollars
            status: status || 'Pending',
            email: user.email,
            user_id: userId,
          });
          console.log(`[Supabase] Synced invoice to Supabase with status ${status || 'Pending'} for ${user.email}`);
        }
      } catch (supabaseErr) {
        console.error('[Supabase] Failed to sync invoice to Supabase:', supabaseErr);
      }
    }


    // Serialize BigInt for JSON response
    const serializedResult = JSON.parse(
      JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json(serializedResult, { status: 200 });

  } catch (error: any) {
    console.error('Transaction Error:', error);
    
    // Check for Postgres unique constraint violation on idempotency key
    if (error.code === '23505' && error.constraint === 'transaction_idempotency_key_key') {
       return NextResponse.json({ error: 'Duplicate transaction (Idempotency Key Collision)' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getResilientSession();
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Define the Drizzle fetch with a resilient 5000ms timeout
    let drizzleSucceeded = false;
    const fetchDrizzleTransactions = async (): Promise<any[]> => {
      try {
        const drizzleQuery = db.query.transactions.findMany({
          where: eq(transactions.userId, userId),
          orderBy: [desc(transactions.createdAt)],
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Drizzle query timed out")), 5000)
        );
        const result = await Promise.race([drizzleQuery, timeoutPromise]);
        drizzleSucceeded = true;
        return result;
      } catch (drizzleErr) {
        console.warn('[GET Transactions] Drizzle query failed or timed out:', drizzleErr);
        return [];
      }
    };

    // 2. Define the Supabase fetch
    let supabaseSucceeded = false;
    const fetchSupabaseTransactions = async (): Promise<any[]> => {
      if (!userEmail) return [];
      try {
        const { supabase } = await import('@/src/lib/supabase-client');
        if (!supabase) return [];
        
        const { data: supabaseInvoices, error: supabaseErr } = await supabase
          .from('invoices')
          .select('*')
          .eq('email', userEmail)
          .order('created_at', { ascending: false });

        if (!supabaseErr && supabaseInvoices && supabaseInvoices.length > 0) {
          supabaseSucceeded = true;
          return supabaseInvoices.map((inv: any) => ({
            id: inv.id?.toString() || `sb_${Math.random().toString(36).substring(2, 11)}`,
            userId: inv.user_id || userId,
            amount: (Number(inv.amount || 0) * 100).toString(), // convert to cents for API uniformity
            status: inv.status === 'Paid' ? 'completed' : 'pending',
            createdAt: inv.created_at || new Date().toISOString(),
            metadata: {
              client_name: inv.client_name || 'Client',
              description: inv.description || 'Invoice',
            }
          }));
        }
        // No error, just no data — that's still a successful query
        supabaseSucceeded = true;
      } catch (err) {
        console.error('[GET Transactions] Failed to fetch invoices from Supabase:', err);
      }
      return [];
    };

    // 3. Execute both concurrently to prevent blocking and ensure instant return
    const [drizzleTransactions, supabaseInvoicesMapped] = await Promise.all([
      fetchDrizzleTransactions(),
      fetchSupabaseTransactions()
    ]);

    // CRITICAL: If both sources failed AND returned empty, return 503 so the client
    // preserves its localStorage cache instead of overwriting it with nothing
    if (!drizzleSucceeded && !supabaseSucceeded) {
      return NextResponse.json(
        { error: 'Database temporarily unavailable', retryable: true },
        { status: 503 }
      );
    }

    // 4. Merge both Drizzle and Supabase lists to avoid duplicates
    const mergedMap = new Map<string, any>();
    
    // Seed with Drizzle transactions first
    drizzleTransactions.forEach((tx) => {
      if (tx && tx.id) {
        mergedMap.set(tx.id.toString(), tx);
      }
    });

    // Merge Supabase invoices, keeping or updating
    supabaseInvoicesMapped.forEach((inv) => {
      if (inv && inv.id) {
        const idStr = inv.id.toString();
        if (!mergedMap.has(idStr)) {
          mergedMap.set(idStr, inv);
        }
      }
    });

    const userTransactions = Array.from(mergedMap.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt || a.created_at).getTime();
      const timeB = new Date(b.createdAt || b.created_at).getTime();
      return timeB - timeA;
    });

    // Serialize BigInt safely for JSON
    const serialized = JSON.parse(
      JSON.stringify(userTransactions, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json(serialized, { status: 200 });
  } catch (error: any) {
    console.error('Fetch Transactions Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
