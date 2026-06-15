import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "re_placeholder";
const resend = new Resend(resendApiKey);

const FROM_EMAIL = process.env.FROM_EMAIL || "Kavio Reminders <onboarding@resend.dev>";

export interface InvoiceInfo {
  id: string;
  invoiceNumber: string;
  amount: number;
  clientName: string;
  freelancerName: string;
  freelancerEmail: string;
  clientEmail: string;
}

export class NotificationService {
  /**
   * AUTO_VERIFIED: to freelancer
   */
  static async sendAutoVerified({
    invoice,
    senderName,
    transactionDate,
    confidenceScore,
    finalScore
  }: {
    invoice: InvoiceInfo;
    senderName: string;
    transactionDate: string;
    confidenceScore: number;
    finalScore: number;
  }) {
    const subject = `✅ Payment Verified — Invoice #${invoice.invoiceNumber}`;
    const amountFormatted = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(invoice.amount);

    const html = `
      <p>Great news! The payment receipt for Invoice #${invoice.invoiceNumber} has been automatically verified.</p>
      
      <h3>Verified Details:</h3>
      <ul>
        <li>Amount: ${amountFormatted}</li>
        <li>From: ${senderName}</li>
        <li>Date: ${transactionDate}</li>
        <li>AI Confidence: ${confidenceScore}%</li>
        <li>Verification Score: ${finalScore}/100</li>
      </ul>

      <p>Please log in to Kavio to mark this invoice as Paid and close it out.</p>
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard">View Invoice</a>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: invoice.freelancerEmail,
        subject,
        html,
      });
    } catch (err) {
      console.error("[NotificationService] AutoVerified email failed", err);
    }
  }

  /**
   * MANUAL_REVIEW: to freelancer
   */
  static async sendManualReview({
    invoice,
    positiveMatches,
    needsReview,
    confidenceScore,
    finalScore
  }: {
    invoice: InvoiceInfo;
    positiveMatches: string;
    needsReview: string;
    confidenceScore: number;
    finalScore: number;
  }) {
    const subject = `⚠️ Receipt Needs Your Review — Invoice #${invoice.invoiceNumber}`;
    const html = `
      <p>A payment receipt was uploaded for Invoice #${invoice.invoiceNumber} but requires your manual review.</p>

      <h3>What matched:</h3>
      <p>${positiveMatches}</p>

      <h3>What needs review:</h3>
      <p>${needsReview}</p>

      <ul>
        <li>AI Confidence: ${confidenceScore}%</li>
        <li>Verification Score: ${finalScore}/100</li>
      </ul>

      <p>Please log in to review and either confirm or reject this payment.</p>
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard">Review Receipt</a>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: invoice.freelancerEmail,
        subject,
        html,
      });
    } catch (err) {
      console.error("[NotificationService] ManualReview email failed", err);
    }
  }

  /**
   * REJECTED: to freelancer
   */
  static async sendRejected({
    invoice,
    reason,
    attemptsRemaining,
    uploadId
  }: {
    invoice: InvoiceInfo;
    reason: string;
    attemptsRemaining: number;
    uploadId: string;
  }) {
    const subject = `❌ Receipt Verification Failed — Invoice #${invoice.invoiceNumber}`;
    const html = `
      <p>A receipt uploaded for Invoice #${invoice.invoiceNumber} was automatically rejected.</p>

      <ul>
        <li>Reason: ${reason}</li>
        <li>Attempts remaining: ${attemptsRemaining}</li>
        <li>Upload Reference: ${uploadId}</li>
      </ul>

      <p>If you believe this is an error, the client can try uploading again.</p>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: invoice.freelancerEmail,
        subject,
        html,
      });
    } catch (err) {
      console.error("[NotificationService] Rejected email failed", err);
    }
  }

  /**
   * BLOCKED: to freelancer
   */
  static async sendBlocked({
    invoice,
    uploadId,
    ipAddress
  }: {
    invoice: InvoiceInfo;
    uploadId: string;
    ipAddress: string;
  }) {
    const subject = `🚨 Invoice Blocked — Suspicious Activity Detected — Invoice #${invoice.invoiceNumber}`;
    const html = `
      <p>Invoice #${invoice.invoiceNumber} has been blocked due to repeated failed verification attempts or suspicious receipt activity.</p>
      
      <p>This invoice requires your immediate attention.</p>

      <ul>
        <li>Security Reference: ${uploadId}</li>
        <li>Last Attempt IP: ${ipAddress}</li>
      </ul>

      <p>Please log in immediately to review.</p>
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard">Review Now</a>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: invoice.freelancerEmail,
        subject,
        html,
      });
    } catch (err) {
      console.error("[NotificationService] Blocked email failed", err);
    }
  }

  /**
   * Client Confirmation: to client
   */
  static async sendClientConfirmation({
    invoice,
    uploadId,
    amount
  }: {
    invoice: InvoiceInfo;
    uploadId: string;
    amount: number;
  }) {
    const subject = `Receipt Received — Invoice #${invoice.invoiceNumber}`;
    const amountFormatted = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(amount);

    const html = `
      <p>Your payment receipt for Invoice #${invoice.invoiceNumber} has been received and verified successfully.</p>
      
      <ul>
        <li>Reference: ${uploadId} — keep this for your records.</li>
        <li>Amount: ${amountFormatted}</li>
      </ul>

      <p>The freelancer has been notified.</p>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: invoice.clientEmail,
        subject,
        html,
      });
    } catch (err) {
      console.error("[NotificationService] ClientConfirmation email failed", err);
    }
  }
}
