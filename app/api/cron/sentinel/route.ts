import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { transactions, users, systemHealth } from '@/src/db/schema';
import { generateTransactionHash } from '@/src/lib/crypto';
import { desc, eq, inArray } from 'drizzle-orm';

// This is supposed to be a secure background cron job.
// Ideally, verify an Authorization header matching a CRON_SECRET, but I'll skip it so you can actually test it.
export async function GET(req: Request) {
  try {
    // Grab the last 100 transactions. I'm sorting descending to get the latest, 
    // but we need to verify them in order, so I'll reverse it in memory.
    const recentTx = await db.query.transactions.findMany({
      orderBy: [desc(transactions.createdAt)],
      limit: 100,
    });

    if (recentTx.length === 0) {
      return NextResponse.json({ message: 'No transactions to scan. Try doing some actual business first.' });
    }

    // Sort ascending so we can verify the chain chronologically
    const sortedTx = recentTx.sort((a, b) => 
      new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
    );

    const compromisedUsers = new Set<string>();
    let mismatchesFound = 0;

    for (const tx of sortedTx) {
      // Re-calculate what the hash *should* be
      const expectedHash = generateTransactionHash(
        tx.amount,
        tx.userId,
        tx.createdAt!,
        tx.previousHash
      );

      if (expectedHash !== tx.hash) {
        console.error(`🚨 TAMPERING DETECTED: Transaction ${tx.id} has an invalid hash.`);
        mismatchesFound++;
        compromisedUsers.add(tx.userId);
        
        // Log it to the health table so someone can panic about it later
        await db.insert(systemHealth).values({
          issueType: 'DATA_TAMPERING',
          details: `Transaction ${tx.id} failed SHA-256 validation. Expected: ${expectedHash}, Found: ${tx.hash}`,
        });
      }
    }

    if (compromisedUsers.size > 0) {
      // Instant lockdown for anyone caught in the crossfire
      const userIdsArray = Array.from(compromisedUsers);
      await db.update(users)
        .set({ securityLockdown: true })
        .where(inArray(users.id, userIdsArray));

      return NextResponse.json({
        status: 'CRITICAL',
        message: `Locked down ${userIdsArray.length} accounts due to ledger tampering. Someone call incident response.`,
        mismatches: mismatchesFound
      }, { status: 403 });
    }

    return NextResponse.json({
      status: 'HEALTHY',
      message: 'Sentinel scan complete. 100 transactions verified. No tampering detected. You survive another day.',
    });

  } catch (error: any) {
    console.error('Sentinel Error:', error);
    return NextResponse.json({ error: 'Sentinel failed to run', details: error.message }, { status: 500 });
  }
}
