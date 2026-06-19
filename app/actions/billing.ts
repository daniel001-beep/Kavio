"use server";

import { db } from "@/src/db";
import { workers, employerPayments, subscriptions } from "@/src/db/schema";
import { eq, count } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getBillingUsage() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Get current subscription or create a default trial one if none exists
  let userSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });

  if (!userSub) {
    const [newSub] = await db.insert(subscriptions).values({
      userId,
      planTier: "Starter",
      status: "trial",
      workerLimit: 1000, // Early access unlimited practically
      trialStart: new Date(),
      // trialEnd intentionally left null for "Early Access Beta" forever-trial
    }).returning();
    userSub = newSub;
  }

  // Get workers count
  const workersQuery = await db.select({ value: count() }).from(workers).where(eq(workers.employerId, userId));
  const workersCount = workersQuery[0].value || 0;

  // Get payments count
  const paymentsQuery = await db.select({ value: count() }).from(employerPayments).where(eq(employerPayments.employerId, userId));
  const paymentsCount = paymentsQuery[0].value || 0;

  // We don't have receipts implemented yet, just return 0 for now
  const receiptsCount = 0;

  return {
    subscription: userSub,
    usage: {
      workersCount,
      paymentsCount,
      receiptsCount,
    }
  };
}
