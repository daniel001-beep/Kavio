import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { outboxEvents } from "@/src/db/schema";
import { eq, lte, or, inArray } from "drizzle-orm";
import { dispatchWebhook } from "@/src/lib/webhooks";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // 1. Authorization: Ensure this is called by a secure Cron job runner (e.g. Vercel Cron)
    const authHeader = req.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 2. Query for pending or failed events that are ready to be processed
    const eventsToProcess = await db.query.outboxEvents.findMany({
      where: (outboxEvents, { and, or, eq, lte }) =>
        and(
          or(
            eq(outboxEvents.status, "pending"),
            eq(outboxEvents.status, "failed"),
          ),
          lte(outboxEvents.nextRetryAt, now),
        ),
      limit: 100, // Batch limit to prevent Vercel timeout
    });

    if (eventsToProcess.length === 0) {
      return NextResponse.json({ message: "No events to process" });
    }

    // 3. Mark batch as 'processing' to prevent concurrent cron collision
    const eventIds = eventsToProcess.map((e) => e.id);
    await db
      .update(outboxEvents)
      .set({ status: "processing" })
      .where(inArray(outboxEvents.id, eventIds));

    let successCount = 0;
    let failCount = 0;

    // 4. Processing Loop
    for (const event of eventsToProcess) {
      try {
        const payload = event.payload as any;
        const userId = payload.userId; // Based on newTx object from transaction route

        if (!userId) {
          throw new Error("Missing userId in payload");
        }

        // We leverage the existing dispatchWebhook utility
        // This utility ideally throws on 500s or network failure.
        // For resilience, we wrap it. If it succeeds, mark completed.
        await dispatchWebhook(userId, event.eventType, payload);

        // Mark completed
        await db
          .update(outboxEvents)
          .set({ status: "completed" })
          .where(eq(outboxEvents.id, event.id));
        
        successCount++;
      } catch (error) {
        console.error(`Outbox Processor Failed for Event ${event.id}:`, error);

        // Calculate exponential backoff: 2^attemptCount minutes
        const newAttemptCount = (event.attemptCount || 0) + 1;
        const backoffMinutes = Math.pow(2, newAttemptCount);
        const nextRetry = new Date(Date.now() + backoffMinutes * 60000);

        await db
          .update(outboxEvents)
          .set({
            status: "failed",
            attemptCount: newAttemptCount,
            nextRetryAt: nextRetry,
          })
          .where(eq(outboxEvents.id, event.id));
          
        failCount++;
      }
    }

    return NextResponse.json({
      message: `Processed ${eventsToProcess.length} events`,
      success: successCount,
      failed: failCount,
    });
  } catch (error: any) {
    console.error("Outbox Cron Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
