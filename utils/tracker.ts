import { db } from "@/src/db";
import { 
  userActivityLogs, 
  loginLogs, 
  featureUsageEvents, 
  adminNotifications, 
  users 
} from "@/src/db/schema";
import { eq } from "drizzle-orm";

export type EventType =
  | "USER_SIGNUP"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "INVOICE_CREATED"
  | "INVOICE_UPDATED"
  | "INVOICE_PAID"
  | "CLIENT_CREATED"
  | "CLIENT_UPDATED"
  | "REPORT_EXPORTED";

export interface TrackEventOptions {
  userId: string;
  eventType: EventType;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function trackEvent({
  userId,
  eventType,
  metadata = {},
  ipAddress,
  userAgent,
}: TrackEventOptions) {
  try {
    // 1. Log to userActivityLogs
    await db.insert(userActivityLogs).values({
      userId,
      eventType,
      metadata,
    });

    // 2. Update user's last activity
    const updateObj: Record<string, any> = {
      lastActivity: new Date(),
    };

    if (eventType === "USER_LOGIN") {
      updateObj.lastLogin = new Date();
    }

    await db.update(users).set(updateObj).where(eq(users.id, userId));

    // 3. Detailed log for Logins
    if (eventType === "USER_LOGIN" || eventType === "USER_SIGNUP") {
      let deviceType = "Desktop";
      if (userAgent) {
        const ua = userAgent.toLowerCase();
        if (ua.includes("mobi") || ua.includes("android") || ua.includes("iphone")) {
          deviceType = "Mobile";
        } else if (ua.includes("tablet") || ua.includes("ipad")) {
          deviceType = "Tablet";
        }
      }

      await db.insert(loginLogs).values({
        userId,
        ipAddress: ipAddress || "127.0.0.1",
        userAgent: userAgent || "Unknown",
        deviceType,
        status: "SUCCESS",
      });
    }

    // 4. Feature Usage Mapping
    let featureName = "";
    if (eventType === "INVOICE_CREATED" || eventType === "INVOICE_UPDATED") {
      featureName = "Invoice Creation";
    } else if (eventType === "CLIENT_CREATED" || eventType === "CLIENT_UPDATED") {
      featureName = "Client Management";
    } else if (eventType === "REPORT_EXPORTED") {
      featureName = "Report Downloads";
    }

    if (featureName) {
      await db.insert(featureUsageEvents).values({
        userId,
        featureName,
        metadata,
      });
    }

    // 5. Admin Alert Triggers
    if (eventType === "USER_SIGNUP") {
      await db.insert(adminNotifications).values({
        title: "New User Registered",
        message: `User ${metadata.email || userId} signed up on Kavio.`,
        category: "USER_SIGNUP",
      });
    } else if (eventType === "INVOICE_CREATED") {
      const amount = Number(metadata.amount || 0);
      // Trigger a notification for large invoices (amount >= 100,000 NGN/USD)
      if (amount >= 100000) {
        await db.insert(adminNotifications).values({
          title: "Large Invoice Created",
          message: `User created an invoice with value ₦${amount.toLocaleString()} (Invoice: ${metadata.invoiceNumber}).`,
          category: "LARGE_INVOICE",
        });
      }
    }
  } catch (error) {
    console.error(`[trackEvent] Error tracking event ${eventType}:`, error);
  }
}
