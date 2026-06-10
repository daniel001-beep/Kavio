import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "re_placeholder";
const resend = new Resend(resendApiKey);

// Fallback email sender if domain isn't verified
const FROM_EMAIL = process.env.FROM_EMAIL || "Kavio Reminders <onboarding@resend.dev>";

interface InvoiceInfo {
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
   * Send Email Notification when Client uploads a Receipt
   */
  static async sendReceiptUploaded({
    invoice,
    uploadDetails,
  }: {
    invoice: InvoiceInfo;
    uploadDetails: { fileName: string; fileSizeKB: number; totalScore: number };
  }) {
    console.log(`[NotificationService] Sending Receipt Uploaded email for ${invoice.invoiceNumber}`);
    
    const subject = `Proof of Payment Uploaded - ${invoice.invoiceNumber}`;
    const amountFormatted = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(invoice.amount);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #0f172a;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid #f1f5f9; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
          
          <!-- Logo -->
          <div style="display: flex; align-items: center; margin-bottom: 32px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; text-align: center; line-height: 32px;">K</div>
            <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.5px; margin-left: 8px;">Kavio <span style="color: #64748b; font-weight: 500;">Collections</span></span>
          </div>

          <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 16px; color: #0f172a; letter-spacing: -0.5px;">Client uploaded a receipt</h2>
          
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Hi ${invoice.freelancerName}, your client <strong>${invoice.clientName}</strong> has uploaded a proof of payment for invoice <strong>${invoice.invoiceNumber}</strong>.
          </p>

          <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 10px; tracking: 1px;">Invoice Value</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;">${amountFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 10px; tracking: 1px;">Uploaded File</td>
                <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 600;">${uploadDetails.fileName} (${uploadDetails.fileSizeKB} KB)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 10px; tracking: 1px;">Trust Score</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: ${uploadDetails.totalScore >= 90 ? "#10b981" : "#d97706"};">${uploadDetails.totalScore}/100</td>
              </tr>
            </table>
          </div>

          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" style="display: block; text-align: center; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-size: 13px; font-weight: 700; box-shadow: 0 4px 12px rgba(15,23,42,0.15); margin-bottom: 20px;">Review Transfer Receipt</a>
          
          <p style="font-size: 11px; text-align: center; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 24px;">
            🔒 Security reminder: Never release project source codes or deliverables until bank transfer is fully cleared in your dashboard.
          </p>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: invoice.freelancerEmail,
        subject,
        html,
      });
    } catch (err) {
      console.error("[NotificationService] Resend failed to send receipt upload email:", err);
    }
  }

  /**
   * Send Email Notification when Invoice is Auto-Verified
   */
  static async sendInvoiceVerified({
    invoice,
    trustScore,
  }: {
    invoice: InvoiceInfo;
    trustScore: number;
  }) {
    console.log(`[NotificationService] Sending Invoice Verified email for ${invoice.invoiceNumber}`);
    
    const subject = `Payment Verified Successfully - ${invoice.invoiceNumber}`;
    const amountFormatted = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(invoice.amount);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #0f172a;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid #f1f5f9; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
          
          <div style="display: flex; align-items: center; margin-bottom: 32px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; text-align: center; line-height: 32px;">K</div>
            <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.5px; margin-left: 8px;">Kavio <span style="color: #64748b; font-weight: 500;">Collections</span></span>
          </div>

          <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 16px; color: #10b981; letter-spacing: -0.5px;">Payment Verified Successfully</h2>
          
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Hi ${invoice.freelancerName}, our Gemini Vision engine has successfully verified the client transfer receipt for <strong>${invoice.invoiceNumber}</strong>.
          </p>

          <div style="background-color: #f0fdf4; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #bbf7d0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #166534; font-weight: 600; text-transform: uppercase; font-size: 10px; tracking: 1px;">Amount Matched</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #166534;">${amountFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #166534; font-weight: 600; text-transform: uppercase; font-size: 10px; tracking: 1px;">Match Confidence</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #166534;">${trustScore}% (Auto-Approved)</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #475569; margin-bottom: 24px;">
            The payment has been marked as <strong>VERIFIED</strong>. You can now approve the invoice in your dashboard to stop all automated reminders and record it as settled.
          </p>

          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" style="display: block; text-align: center; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-size: 13px; font-weight: 700; box-shadow: 0 4px 12px rgba(16,185,129,0.2); margin-bottom: 20px;">Open Founder Dashboard</a>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: invoice.freelancerEmail,
        subject,
        html,
      });
    } catch (err) {
      console.error("[NotificationService] Resend failed to send invoice verified email:", err);
    }
  }

  /**
   * Send Email Notification when Manual Review is Required
   */
  static async sendManualReviewRequired({
    invoice,
    trustScore,
    reason,
  }: {
    invoice: InvoiceInfo;
    trustScore: number;
    reason: string;
  }) {
    console.log(`[NotificationService] Sending Manual Review Required email for ${invoice.invoiceNumber}`);
    
    const subject = `Manual Review Required - ${invoice.invoiceNumber}`;
    const amountFormatted = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(invoice.amount);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #0f172a;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid #f1f5f9; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
          
          <div style="display: flex; align-items: center; margin-bottom: 32px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; text-align: center; line-height: 32px;">K</div>
            <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.5px; margin-left: 8px;">Kavio <span style="color: #64748b; font-weight: 500;">Collections</span></span>
          </div>

          <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 16px; color: #d97706; letter-spacing: -0.5px;">Manual Review Required</h2>
          
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Hi ${invoice.freelancerName}, your client uploaded a transfer receipt for invoice <strong>${invoice.invoiceNumber}</strong>, but the verification score was <strong>${trustScore}/100</strong>, which fell into the Manual Review threshold.
          </p>

          <div style="background-color: #fffbeb; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #fef3c7;">
            <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: bold; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px;">Flagged Issues</p>
            <p style="margin: 0; font-size: 13px; color: #78350f; font-weight: 600; line-height: 1.5;">${reason}</p>
          </div>

          <p style="font-size: 13px; color: #475569; margin-bottom: 24px;">
            Please sign in to review this transfer slip manually. You can crosscheck your bank statement and manually approve or reject the receipt.
          </p>

          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" style="display: block; text-align: center; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-size: 13px; font-weight: 700; box-shadow: 0 4px 12px rgba(217,119,6,0.2); margin-bottom: 20px;">Review Receipt in Dashboard</a>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: invoice.freelancerEmail,
        subject,
        html,
      });
    } catch (err) {
      console.error("[NotificationService] Resend failed to send manual review email:", err);
    }
  }

  /**
   * Send Email Notification when Invoice is marked Paid
   */
  static async sendInvoicePaid({
    invoice,
    refId,
  }: {
    invoice: InvoiceInfo;
    refId?: string;
  }) {
    console.log(`[NotificationService] Sending Invoice Paid email for ${invoice.invoiceNumber}`);
    
    const subject = `Payment Confirmed - ${invoice.invoiceNumber}`;
    const amountFormatted = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(invoice.amount);

    const clientHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #0f172a;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid #f1f5f9; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
          
          <div style="display: flex; align-items: center; margin-bottom: 32px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; text-align: center; line-height: 32px;">K</div>
            <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.5px; margin-left: 8px;">Kavio <span style="color: #64748b; font-weight: 500;">Collections</span></span>
          </div>

          <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 16px; color: #10b981; letter-spacing: -0.5px;">Payment Settled successfully</h2>
          
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Hi ${invoice.clientName}, your payment for invoice <strong>${invoice.invoiceNumber}</strong> has been successfully cleared and approved by <strong>${invoice.freelancerName}</strong>.
          </p>

          <div style="background-color: #f0fdf4; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #bbf7d0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #166534; font-weight: 600; text-transform: uppercase; font-size: 10px; tracking: 1px;">Amount Received</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #166534;">${amountFormatted}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #166534; font-weight: 600; text-transform: uppercase; font-size: 10px; tracking: 1px;">Ref Code</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #166534;">${refId || "N/A"}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #475569; margin-bottom: 24px;">
            This invoice is now fully settled, and all automated follow-ups and reminders have been deactivated. Thank you for your business.
          </p>
        </div>
      </div>
    `;

    try {
      // Notify Client
      await resend.emails.send({
        from: FROM_EMAIL,
        to: invoice.clientEmail,
        subject,
        html: clientHtml,
      });

      // Also notify Freelancer
      const freelancerSubject = `Payment Recorded - ${invoice.invoiceNumber}`;
      const freelancerHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #0f172a;">
          <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid #f1f5f9; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            
            <div style="display: flex; align-items: center; margin-bottom: 32px;">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; text-align: center; line-height: 32px;">K</div>
              <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.5px; margin-left: 8px;">Kavio <span style="color: #64748b; font-weight: 500;">Collections</span></span>
            </div>

            <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 16px; color: #10b981; letter-spacing: -0.5px;">Invoice Settled!</h2>
            
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
              Hi ${invoice.freelancerName}, payment of <strong>${amountFormatted}</strong> has been cleared for invoice <strong>${invoice.invoiceNumber}</strong>.
            </p>

            <div style="background-color: #f0fdf4; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #bbf7d0;">
              <p style="margin: 0; font-size: 13px; color: #166534; font-weight: 600;">The invoice is now officially PAID. Reminders have been stopped automatically.</p>
            </div>

            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" style="display: block; text-align: center; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-size: 13px; font-weight: 700; box-shadow: 0 4px 12px rgba(15,23,42,0.15); margin-bottom: 20px;">Open Dashboard</a>
          </div>
        </div>
      `;
      await resend.emails.send({
        from: FROM_EMAIL,
        to: invoice.freelancerEmail,
        subject: freelancerSubject,
        html: freelancerHtml,
      });

    } catch (err) {
      console.error("[NotificationService] Resend failed to send invoice paid email:", err);
    }
  }
}
