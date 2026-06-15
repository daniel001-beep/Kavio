import { db } from "@/src/db";
import { invoiceReminders, invoices } from "@/src/db/schema";
import { eq } from "drizzle-orm";

interface WhatsAppReminderParams {
  invoiceId: string;
  scheduleDay: number; // 0, 2, 5, 7
  recipientPhone: string;
  recipientName: string;
  amount: number;
  invoiceNumber: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  portalToken: string;
}

export class WhatsAppService {
  /**
   * Templates and triggers a simulated WhatsApp reminder.
   * In production, this would make an API call to Meta's WhatsApp Cloud API
   * or Twilio to send a template message.
   */
  static async triggerReminder(params: WhatsAppReminderParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`[WhatsAppService] Evaluating reminder for invoice ${params.invoiceNumber} on Day ${params.scheduleDay}`);

    // 1. Double check invoice status before sending. Ensure reminders stop automatically when paid.
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, params.invoiceId),
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    if (invoice.status === "PAID" || invoice.status === "VERIFIED" || !invoice.isAutomatedReminderEnabled) {
      console.log(`[WhatsAppService] Skipping reminder: Invoice status is ${invoice.status} or automated reminders are disabled.`);
      return { success: false, error: `Skipped: Invoice status is ${invoice.status}` };
    }

    // 2. Format currency
    const amountFormatted = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(params.amount);

    // 3. Construct the secure portal link
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const paymentUrl = `${baseUrl}/pay/${params.portalToken || params.invoiceId}`;

    // 4. Compose the message
    const message = `Hello ${params.recipientName},\n\n` +
      `This is a friendly reminder from Kavio regarding invoice *${params.invoiceNumber}*.\n\n` +
      `• *Amount Due:* ${amountFormatted}\n` +
      `• *Bank Name:* ${params.bankName || "N/A"}\n` +
      `• *Account Name:* ${params.accountName || "N/A"}\n` +
      `• *Account Number:* ${params.accountNumber || "N/A"}\n\n` +
      `Please complete the bank transfer and upload your receipt here to automatically clear the invoice: ${paymentUrl}\n\n` +
      `Thank you!`;

    // Log the message for presentation/demo
    console.log("---------------- WHATSAPP SEND ----------------");
    console.log(`To: ${params.recipientPhone}`);
    console.log(message);
    console.log("-----------------------------------------------");

    try {
      // In production, integrate Meta Business API endpoint here:
      // const res = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, { ... });

      const fakeMessageId = `wa_msg_${Math.random().toString(36).substring(2, 11)}`;

      // Record in the invoice_reminder table
      await db.insert(invoiceReminders).values({
        invoiceId: params.invoiceId,
        status: "SENT",
        channel: "WHATSAPP",
        scheduleDay: params.scheduleDay,
        reminderDate: new Date(),
      });

      // Update invoice last reminder timestamp
      await db.update(invoices)
        .set({ lastReminderSentAt: new Date() })
        .where(eq(invoices.id, params.invoiceId));

      return { success: true, messageId: fakeMessageId };
    } catch (err: any) {
      console.error("[WhatsAppService] Error recording reminder:", err);

      await db.insert(invoiceReminders).values({
        invoiceId: params.invoiceId,
        status: "FAILED",
        channel: "WHATSAPP",
        scheduleDay: params.scheduleDay,
        errorMessage: err.message || "Unknown error",
        reminderDate: new Date(),
      });

      return { success: false, error: err.message };
    }
  }

  /**
   * Run the cron engine logic.
   * Walks through all sent/overdue invoices and schedules reminders according to Day 0, 2, 5, 7.
   */
  static async runReminderEngine() {
    console.log("[WhatsAppService] Running automated reminder scheduler...");
    
    // Fetch all active unpaid invoices
    const activeInvoices = await db.query.invoices.findMany({
      where: (fields, { and, or, eq, inArray }) => 
        and(
          inArray(fields.status, ["SENT", "VIEWED", "OVERDUE", "UNDER_REVIEW"]),
          eq(fields.isAutomatedReminderEnabled, true)
        ),
      with: {
        client: true,
      } as any // Safely bypass strict Drizzle query typing
    });

    let remindersTriggered = 0;

    for (const inv of activeInvoices) {
      // Calculate how many days have passed since invoice creation
      const createdTime = new Date(inv.createdAt || new Date()).getTime();
      const nowTime = new Date().getTime();
      const daysPassed = Math.floor((nowTime - createdTime) / (1000 * 60 * 60 * 24));

      // Map days passed to schedule day. Match exactly or closest trigger day.
      let targetScheduleDay = -1;
      if (daysPassed === 0) targetScheduleDay = 0;
      else if (daysPassed === 2) targetScheduleDay = 2;
      else if (daysPassed === 5) targetScheduleDay = 5;
      else if (daysPassed === 7) targetScheduleDay = 7;

      if (targetScheduleDay === -1) {
        continue; // Not a reminder day
      }

      // Check if we've already sent a reminder for this invoice and scheduleDay
      const alreadySent = await db.query.invoiceReminders.findFirst({
        where: (fields, { and, eq }) =>
          and(
            eq(fields.invoiceId, inv.id),
            eq(fields.scheduleDay, targetScheduleDay),
            eq(fields.status, "SENT")
          ),
      });

      if (alreadySent) {
        console.log(`[WhatsAppService] Reminder for invoice ${inv.invoiceNumber} Day ${targetScheduleDay} already sent. Skipping.`);
        continue;
      }

      // Trigger reminder
      // Drizzle handles joins differently, fetch details directly to prevent schema mismatch errors
      const client = await db.query.clients.findFirst({
        where: (fields, { eq }) => eq(fields.id, inv.clientId),
      });

      if (client) {
        await this.triggerReminder({
          invoiceId: inv.id,
          scheduleDay: targetScheduleDay,
          recipientPhone: client.phone || "",
          recipientName: client.name || "",
          amount: inv.amount,
          invoiceNumber: inv.invoiceNumber,
          bankName: inv.bankName || "",
          accountName: inv.accountName || "",
          accountNumber: inv.accountNumber || "",
          portalToken: inv.clientPortalToken || inv.id,
        });
        remindersTriggered++;
      }
    }

    console.log(`[WhatsAppService] Reminder run complete. Triggered ${remindersTriggered} reminders.`);
    return { success: true, count: remindersTriggered };
  }
}
