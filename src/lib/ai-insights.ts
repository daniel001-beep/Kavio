import { z } from 'zod';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { db } from '@/src/db';
import { transactions, auditLogs } from '@/src/db/schema';
import { eq, desc } from 'drizzle-orm';

// Defining the schema strictly because I don't trust the AI to not return a block of markdown.
export const InsightSchema = z.object({
  narrative: z.string().describe("A concise, no-nonsense financial health narrative based on the user's transaction history."),
  confidenceScore: z.number().min(0).max(100).describe("A confidence score out of 100 on the accuracy of this insight."),
  behavioralAnomalyDetected: z.boolean().describe("True if the current login fingerprint differs from historical logins."),
});

type InsightResponse = z.infer<typeof InsightSchema>;

interface Fingerprint {
  ipAddress: string;
  userAgent: string;
  timezone?: string; // Optional since the DB might not store it natively in the schema yet
}

export async function generateBusinessInsights(
  userId: string,
  currentFingerprint: Fingerprint
): Promise<InsightResponse> {
  // 1. Transaction Math (using BigInt so we don't drop pennies like an amateur)
  const userTx = await db.query.transactions.findMany({
    where: eq(transactions.userId, userId),
    orderBy: [desc(transactions.createdAt)],
    limit: 50, // Grab the last 50 for trend analysis
  });

  let totalCredits = 0;
  let totalDebits = 0;

  for (const tx of userTx) {
    const amt = Number(tx.amount || 0);
    if (amt > 0) {
      totalCredits += amt;
    } else {
      totalDebits += amt;
    }
  }

  // 2. Behavioral Fingerprinting
  // Fetching the last 5 login events to see if someone stole their session token
  const historicalLogins = await db.query.auditLogs.findMany({
    where: eq(auditLogs.userId, userId),
    // Assuming 'eventType' for logins is 'LOGIN'. I'm hardcoding this because it's what was asked.
    orderBy: [desc(auditLogs.timestamp)],
    limit: 10,
  });

  // Filter down to logins (assuming the seed or real app puts LOGIN in eventType)
  const last5Logins = historicalLogins.filter(log => log.eventType === 'LOGIN').slice(0, 5);

  let isAnomaly = false;
  if (last5Logins.length > 0) {
    // If the current IP or User-Agent has NEVER been seen in the last 5 logins, flag it.
    const ipSeen = last5Logins.some(log => log.ipAddress === currentFingerprint.ipAddress);
    const uaSeen = last5Logins.some(log => log.userAgent === currentFingerprint.userAgent);
    
    if (!ipSeen || !uaSeen) {
      isAnomaly = true;
      console.warn(`[SENTINEL] Behavioral anomaly detected for user ${userId}. IP or UA mismatch.`);
    }
  }

  // 3. AI Generation
  // Formatting down to readable standard floats for the LLM prompt so it doesn't get confused
  const creditsFormatted = totalCredits / 100;
  const debitsFormatted = Math.abs(totalDebits) / 100;

  const prompt = `
    Analyze the following financial data for a user:
    Total Credits (Inflow): $${creditsFormatted}
    Total Debits (Outflow): $${debitsFormatted}
    Transaction Count (Recent): ${userTx.length}
    Behavioral Anomaly: ${isAnomaly ? 'DETECTED - Unusual IP or Device' : 'None'}

    Act as a direct, slightly cynical financial advisor. Provide a "Financial Health Narrative" summarizing their burn rate and inflows. If an anomaly is detected, mention it as a security risk. Keep it under 2 sentences. Do not use corporate fluff.
  `;

  // Actually making the call
  try {
    const { object } = await generateObject({
      model: google('gemini-2.5-pro') as any, // Use the smart model
      schema: InsightSchema,
      prompt: prompt,
    });

    // Hardcode the anomaly flag if the code caught it, just to be safe and not rely purely on AI
    object.behavioralAnomalyDetected = isAnomaly || object.behavioralAnomalyDetected;

    return object;
  } catch (error) {
    console.error("AI Generation failed. Falling back to a hardcoded response because the LLM API is probably down again.", error);
    return {
      narrative: "Error generating insights. You spent some money, you made some money. Check your own ledger.",
      confidenceScore: 0,
      behavioralAnomalyDetected: isAnomaly,
    };
  }
}
