import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { invoices, reminders, clients, users } from "@/src/db/schema";
import { eq, and, inArray, isNotNull } from "drizzle-orm";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// Initialize Resend if key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(req: Request) {
  try {
    // Basic Cron Security (If using Vercel Cron)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Fetch invoices that are unpaid and have automated reminders enabled
    const targetInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          inArray(invoices.status, ["SENT", "VIEWED", "OVERDUE", "DRAFT"]),
          eq(invoices.isAutomatedReminderEnabled, true)
        )
      );

    let sentCount = 0;

    for (const invoice of targetInvoices) {
      if (!invoice.dueDate) continue;

      const dueDate = new Date(invoice.dueDate);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Determine template type
      let templateType = null;
      let emailSubject = "";
      let emailBody = "";

      if (diffDays === 1) {
        templateType = "DUE_TOMORROW";
        emailSubject = `Reminder: Invoice ${invoice.invoiceNumber} is due tomorrow`;
        emailBody = `This is a friendly reminder that invoice ${invoice.invoiceNumber} for NGN ${invoice.amount} is due tomorrow.`;
      } else if (diffDays === 0) {
        templateType = "DUE_TODAY";
        emailSubject = `Action Required: Invoice ${invoice.invoiceNumber} is due today`;
        emailBody = `This is a reminder that invoice ${invoice.invoiceNumber} for NGN ${invoice.amount} is due today. Please arrange for payment.`;
      } else if (diffDays === -3) {
        templateType = "OVERDUE_3D";
        emailSubject = `Overdue Notice: Invoice ${invoice.invoiceNumber} is 3 days overdue`;
        emailBody = `Invoice ${invoice.invoiceNumber} is now 3 days overdue. Please process the payment of NGN ${invoice.amount} immediately.`;
      } else if (diffDays === -7) {
        templateType = "OVERDUE_7D";
        emailSubject = `Final Notice: Invoice ${invoice.invoiceNumber} is 7 days overdue`;
        emailBody = `Your invoice ${invoice.invoiceNumber} is 7 days overdue. Immediate payment of NGN ${invoice.amount} is required.`;
      }

      // Check if we already sent a reminder today
      const lastSentStr = invoice.lastReminderSentAt
        ? new Date(invoice.lastReminderSentAt).toISOString().split("T")[0]
        : null;

      if (templateType && lastSentStr !== todayStr) {
        // We need the client details to send the email
        const clientRecords = await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1);
        const clientEmail = clientRecords[0]?.email;

        const freelancerRecords = await db.select().from(users).where(eq(users.id, invoice.userId)).limit(1);
        const freelancerName = freelancerRecords[0]?.name || "Kavio Collections";

        if (clientEmail) {
          try {
            if (resend) {
              await resend.emails.send({
                from: "Kavio Collections <noreply@kavio.finance>",
                to: [clientEmail],
                subject: emailSubject,
                text: `${emailBody}\n\nPay here: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/invoice/${invoice.id}\n\nRegards,\n${freelancerName}`,
              });
            } else {
              console.log(`[Mock Email Sent] To: ${clientEmail} | Subject: ${emailSubject}`);
            }

            // Log the reminder
            await db.insert(reminders).values({
              invoiceId: invoice.id,
              templateType,
              channel: "EMAIL",
              sentDate: new Date(),
              status: "SENT",
              reminderCount: 1, // You could aggregate this later
            });

            // Update invoice
            await db
              .update(invoices)
              .set({ lastReminderSentAt: new Date() })
              .where(eq(invoices.id, invoice.id));

            sentCount++;
          } catch (error) {
            console.error(`Failed to send reminder for invoice ${invoice.id}:`, error);
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: targetInvoices.length, sent: sentCount });
  } catch (error: any) {
    console.error("Cron reminders error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
