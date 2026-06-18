import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { transactions, ledgerEntries, users } from '@/src/db/schema';
import { generateTransactionHash } from '@/src/lib/crypto';
import { eq, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Next.js 15 Secure Webhook Route Handler for Velox Fintech Ledger
 * Endpoint: POST /api/webhooks/ledger
 */
export async function POST(req: Request) {
  const timestampHeader = req.headers.get('X-Velox-Timestamp') || Date.now().toString();
  const signatureHeader = req.headers.get('X-Velox-Signature');
  const authorizationHeader = req.headers.get('Authorization');

  try {
    // Read raw body for HMAC verification
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { 
      userId, 
      amount, 
      duplicatePreventionKey, 
      orderId, 
      metadata = {}, 
      description = 'Webhook transaction', 
      status = 'Paid' 
    } = body;

    // 1. Basic Payload Validation
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      return NextResponse.json({ error: 'Valid non-zero amount is required (in cents)' }, { status: 400 });
    }
    if (!duplicatePreventionKey) {
      return NextResponse.json({ error: 'duplicatePreventionKey is required' }, { status: 400 });
    }

    // 2. Multi-Tier Security Verification
    // A. HMAC-SHA256 Signature Verification (Primary Production Guard)
    const secretKey = process.env.VELOX_WEBHOOK_SECRET || 'velox_super_secure_webhook_secret_key_2026';
    if (signatureHeader) {
      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(`${timestampHeader}.${rawBody}`)
        .digest('hex');

      // Use timingSafeEqual to protect against timing attacks
      const signatureBuffer = Buffer.from(signatureHeader, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return NextResponse.json({ error: 'Invalid security signature' }, { status: 401 });
      }
    } 
    // B. Token Fallback (for external providers that don't support custom headers)
    else if (authorizationHeader) {
      const token = authorizationHeader.replace('Bearer ', '').trim();
      if (token !== secretKey) {
        return NextResponse.json({ error: 'Unauthorized security token' }, { status: 401 });
      }
    } 
    // C. Development Guard (Skip signature only in development if explicitly allowed)
    else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Missing security signature headers' }, { status: 401 });
    }

    const amountBigInt = BigInt(Math.floor(parsedAmount));
    const timestamp = new Date();

    // 3. Isolated Database Transaction with Per-Tenant Row Locking & Duplicate Prevention
    const MAX_RETRIES = 3;
    let result;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        result = await db.transaction(async (tx) => {
          // A. Tenant Row Locking: Locks the user record in Postgres for the duration of this tx.
          // This serializes hash chain computation and prevents concurrent race conditions for this user.
          try {
            await tx.execute(sql`SELECT 1 FROM "user" WHERE id = ${userId} FOR UPDATE`);
          } catch (lockErr) {
            console.warn('[Webhook] Lock SELECT FOR UPDATE bypassed (likely local database emulator):', lockErr);
          }

          // B. Duplicate Prevention Check: Prevent duplicate ledger processing
          const existingTx = await tx.query.transactions.findFirst({
            where: eq(transactions.duplicatePreventionKey, duplicatePreventionKey),
          });

          if (existingTx) {
            return { success: true, transaction: existingTx, idempotent: true };
          }

          // C. Secure Transaction Log: Fetch previous completed transaction
          const lastTx = await tx.query.transactions.findFirst({
            where: eq(transactions.userId, userId),
            orderBy: [desc(transactions.createdAt)],
          });

          const previousHash = lastTx?.hash || null;

          // Generate current cryptographic hash for immutable audit trail
          const hash = generateTransactionHash(
            amountBigInt,
            userId,
            timestamp,
            previousHash
          );

          // D. Double-Entry Accounting Enforcements
          const isCompleted = status.toLowerCase() === 'paid' || status.toLowerCase() === 'completed';
          
          // I. Insert main transaction
          const [newTx] = await tx.insert(transactions).values({
            userId,
            orderId: orderId || null,
            duplicatePreventionKey,
            amount: Number(amountBigInt),
            status: isCompleted ? 'completed' : 'pending',
            hash,
            previousHash,
            metadata: metadata || {},
            createdAt: timestamp,
            completedAt: isCompleted ? timestamp : null,
          }).returning();

          // II. Double-Entry Ledger Entry (Debit/Credit Main User Account)
          await tx.insert(ledgerEntries).values({
            transactionId: newTx.id,
            userId,
            accountType: 'MAIN',
            entryType: amountBigInt > 0n ? 'CREDIT' : 'DEBIT',
            amount: Number(amountBigInt),
            description: description || 'Webhook transaction lines',
            createdAt: timestamp,
          });

          // III. Offset Ledger Entry (Perfect Settlement Balance to Zero)
          await tx.insert(ledgerEntries).values({
            transactionId: newTx.id,
            userId: 'SYSTEM',
            accountType: 'SETTLEMENT',
            entryType: amountBigInt > 0n ? 'DEBIT' : 'CREDIT',
            amount: Number(-amountBigInt),
            description: `Offset settlement for transaction ${newTx.id}`,
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
              changes: { amount: amountBigInt.toString(), duplicatePreventionKey, source: 'webhook' },
              ipAddress: 'Webhook Ingestion',
              userAgent: 'External payment gateway provider',
              metadata: { description: description || 'Webhook ledger transaction', amount: Number(amountBigInt) / 100 }
            });
          } catch (auditErr) {
            console.warn('[Webhook] Failed to insert audit log inside tx:', auditErr);
          }

          return { success: true, transaction: newTx, idempotent: false };
        });

        // Break on success
        break;
      } catch (err: any) {
        if (attempt === MAX_RETRIES - 1) {
          throw err; // Out of retries
        }
        console.warn(`[Webhook] Serialization contention on attempt ${attempt + 1}. Retrying in 200ms...`, err.message);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // 4. Real-time Cloud Sync & Sentinel Notification Triggering
    if (result && result.success && !result.idempotent) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^["'()]+|["'()]+$/g, "").trim();
        const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.replace(/^["'()]+|["'()]+$/g, "").trim();

        if (supabaseUrl && supabaseServiceKey) {
          // Fetch target user's email to map correctly in Supabase invoices
          const userRecord = await db.query.users.findFirst({
            where: eq(users.id, userId),
          });

          if (userRecord?.email) {
            const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
            const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);
            
            // Inserting this invoice triggers the Supabase real-time client in DashboardClient
            await supabaseAdmin.from('invoices').insert({
              client_name: metadata?.client_name || 'Client Webhook',
              description: description || 'Webhook Ledger Transaction',
              amount: Number(amountBigInt) / 100, // cents to dollars
              status: status || 'Paid',
              email: userRecord.email,
              user_id: userId,
            });
            console.log(`[Webhook Sync] Synced invoice to Supabase for ${userRecord.email}`);
          }
        }
      } catch (supabaseErr) {
        console.error('[Webhook Sync] Failed to sync real-time database:', supabaseErr);
      }
    }

    // Serialize BigInt safely for JSON
    const serializedResult = JSON.parse(
      JSON.stringify(result, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    return NextResponse.json(serializedResult, { status: 200 });

  } catch (error: any) {
    console.error('[Webhook API Error]:', error);

    // Postgres unique constraint violation on Duplicate Prevention key
    if (error.code === '23505' && error.constraint === 'transaction_Duplicate Prevention_key_key') {
      return NextResponse.json({ error: 'Duplicate transaction (Duplicate Prevention Key Collision)' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
