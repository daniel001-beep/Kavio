import { db } from "../db";
import { webhookEndpoints } from "../db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

/**
 * Dispatches a webhook event to all active endpoints for a user.
 * 
 * Includes an HMAC signature in the X-Velox-Signature header for security.
 * The signature is generated using: HMAC-SHA256(secret, timestamp + "." + JSON.stringify(payload))
 */
export async function dispatchWebhook(userId: string, event: string, payload: any) {
  try {
    const endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.userId, userId),
          eq(webhookEndpoints.isActive, true)
        )
      );

    if (endpoints.length === 0) return;

    const timestamp = Date.now().toString();
    const dataString = JSON.stringify(payload);

    const promises = endpoints.map(async (endpoint) => {
      // HMAC-SHA256 signature for verification
      const signature = crypto
        .createHmac("sha256", endpoint.secret)
        .update(`${timestamp}.${dataString}`)
        .digest("hex");

      try {
        const response = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Velox-Signature": signature,
            "X-Velox-Timestamp": timestamp,
            "X-Velox-Event": event,
            "User-Agent": "Velox-Webhook-Dispatcher/1.0",
          },
          body: dataString,
          // 5 second timeout for webhooks
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          console.error(`[Webhook] Failed for ${endpoint.url}: ${response.status} ${response.statusText}`);
        } else {
          console.log(`[Webhook] Successfully dispatched ${event} to ${endpoint.url}`);
        }
      } catch (err) {
        console.error(`[Webhook] Error sending to ${endpoint.url}:`, err);
      }
    });

    // Don't block the main process, but wait for all attempts to settle
    await Promise.allSettled(promises);
  } catch (error) {
    console.error("[Webhook] Dispatch system failure:", error);
  }
}
