import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./src/db/index";
import { auditLogs, invoices, users } from "./src/db/schema";

async function main() {
  console.log("Seeding audit logs...");
  
  // Try to find a user
  const allUsers = await db.select().from(users).limit(1);
  const userId = allUsers.length > 0 ? allUsers[0].id : null;
  const userEmail = allUsers.length > 0 ? allUsers[0].email : "system@kavio.finance";

  await db.insert(auditLogs).values([
    {
      userId,
      action: "SUCCESSFUL_LOGIN",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
      result: "SUCCESS",
      metadata: { email: userEmail, location: "Lagos, NG" },
      createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5 mins ago
    },
    {
      userId,
      action: "INVOICE_GENERATED",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
      result: "SUCCESS",
      metadata: { email: userEmail, amount: 50000 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
    },
    {
      userId: null,
      action: "FAILED_LOGIN_ATTEMPT",
      ipAddress: "103.45.67.89",
      userAgent: "curl/7.68.0",
      result: "FAILED",
      metadata: { email: "admin@kavio.finance", reason: "Invalid password" },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
    {
      userId,
      action: "RECEIPT_VERIFICATION",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15",
      result: "APPROVED",
      metadata: { email: userEmail, amount: 150000, confidence: 95 },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
    }
  ]);

  console.log("Seeded 4 audit logs!");
  process.exit(0);
}

main().catch(err => {
  console.error("Error seeding:", err);
  process.exit(1);
});
