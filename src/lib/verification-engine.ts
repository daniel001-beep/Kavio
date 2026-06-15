import { db } from "@/src/db";
import { 
  invoices, 
  receiptUploads, 
  verificationAttempts, 
  auditLogs,
} from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createHash, randomUUID } from "crypto";
import { NotificationService } from "@/src/services/notifications";
import { ReceiptScorer, GeminiResponse, InvoiceExpectations } from "./receipt-scorer";
import sharp from "sharp";

export class VerificationEngine {
  /**
   * Run OCR receipt details extraction using Gemini Vision 2.0 Flash
   */
  static async extractReceiptDetails(
    base64Data: string,
    mimeType: string
  ): Promise<GeminiResponse> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined.");
    }

    const prompt = `You are a strict Nigerian bank payment receipt auditor with expertise in detecting fraudulent receipts.

Your task is to extract payment data from this bank transfer receipt image with absolute precision.

RECEIPT TYPES YOU WILL SEE:
Nigerian banks: GTBank, Guaranty Trust, Access Bank, Zenith Bank, UBA, United Bank for Africa, First Bank, Fidelity, FCMB, Union Bank, Sterling, Wema, Stanbic
Nigerian fintechs: OPay, Kuda, Moniepoint, PalmPay, VFD, Carbon
International: Any other bank

FRAUD DETECTION — actively scan for ALL of the following:
1. Screenshot tampering — pixels that look edited, blurred edges around numbers, inconsistent image compression artifacts
2. Font inconsistencies — amounts or account numbers in a different font or size from surrounding text
3. Digital paint or overlay — areas that look painted over or replaced
4. Template markers — standard fake receipt template patterns, placeholder text, wrong bank logos
5. Metadata inconsistencies — image dimensions or quality inconsistent with a real phone screenshot
6. Amount manipulation — numbers that look like they were changed after the receipt was generated
7. Color inconsistencies — areas with slightly different background color suggesting editing

Return ONLY this exact JSON with no markdown, no preamble, no explanation:
{
  "extracted": {
    "amount": number or null,
    "rawAmountText": "string or null",
    "destinationAccountNumber": "string or null",
    "destinationAccountName": "string or null",
    "bankName": "string or null",
    "transactionDate": "YYYY-MM-DD or null",
    "transactionTime": "HH:MM or null",
    "transactionReference": "string or null",
    "senderName": "string or null",
    "senderBank": "string or null",
    "currency": "NGN or null"
  },
  "fraudAnalysis": {
    "suspectedFraud": boolean,
    "fraudReasons": string[],
    "tamperedRegions": string[],
    "overallImageAuthenticity": "AUTHENTIC" | "SUSPICIOUS" | "LIKELY_FAKE",
    "confidenceScore": number between 0 and 100
  },
  "receiptType": "bank_transfer" | "opay" | "kuda" | "moniepoint" | "gtbank" | "access" | "zenith" | "uba" | "other" | "not_a_receipt"
}

CRITICAL RULES:
- Amount must be a plain number with no currency symbols or commas — 150000 not ₦150,000
- If this image is not a payment receipt at all set receiptType to not_a_receipt and set confidenceScore to 0
- If any field is unclear or not visible return null — never guess
- Account numbers in Nigeria are exactly 10 digits
- suspectedFraud must be true if ANY fraud indicator is detected no matter how minor
- DO NOT check for or care about invoice reference numbers (like KAV-XXXX). They are explicitly NO LONGER REQUIRED on receipts. Ignore them.`;

    try {
        const googleInstance = createGoogleGenerativeAI({ apiKey });
        const { text } = await generateText({
          model: googleInstance("gemini-2.0-flash"),
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "file", data: base64Data, mediaType: mimeType }
              ]
            }
          ]
        });

      const cleanJson = text.replace(/\`\`\`json/gi, "").replace(/\`\`\`/g, "").trim();
      return JSON.parse(cleanJson) as GeminiResponse;
    } catch (err) {
      console.error("[VerificationEngine] Gemini Vision call failed:", err);
      throw err;
    }
  }

  /**
   * Execute full verification flow 
   */
  static async verifyReceipt(
    invoiceId: string,
    fileBuffer: Buffer,
    fileType: string,
    fileName: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    const uploadId = randomUUID();

    // 1. File validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return { error: 'FILE_TOO_LARGE', message: 'File must be under 5MB' };
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(fileType)) {
      return { error: 'INVALID_FILE_TYPE', message: 'Accept only: JPG, JPEG, PNG, WEBP, PDF' };
    }

    // 2. Fetch Invoice
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      with: {
        user: true,
        client: true,
      }
    });

    if (!invoice) return { error: 'NOT_FOUND', message: 'Invoice not found.' };
    
    if (invoice.verificationStatus === 'VERIFIED') {
      return { error: 'ALREADY_VERIFIED', message: 'This invoice has already been verified' };
    }
    
    if (invoice.verificationStatus === 'BLOCKED') {
      return { error: 'INVOICE_BLOCKED', message: 'This invoice has been flagged. Please contact the freelancer directly.' };
    }

    // Rate Limiting Check
    const attemptCountRes = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(verificationAttempts).where(eq(verificationAttempts.invoiceId, invoiceId));
    const attemptCount = attemptCountRes[0].count;

    if (attemptCount >= 5) {
      // Set to blocked
      await db.update(invoices).set({ 
        verificationStatus: 'BLOCKED',
        blockedAt: new Date(),
        blockedReason: 'MAX_ATTEMPTS_EXCEEDED'
      }).where(eq(invoices.id, invoiceId));

      await NotificationService.sendBlocked({
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          clientName: invoice.client.name,
          freelancerName: invoice.user.name || "Freelancer",
          freelancerEmail: invoice.user.email,
          clientEmail: invoice.client.email
        },
        uploadId,
        ipAddress: ipAddress || 'Unknown'
      });

      return { error: 'MAX_ATTEMPTS_EXCEEDED', message: 'Maximum verification attempts exceeded. Invoice is blocked.' };
    }

    // 3. Image Sanitization and Hashing
    let sanitizedBuffer = fileBuffer;
    let mimeType = fileType;
    
    if (fileType.startsWith('image/')) {
      // Strip EXIF
      sanitizedBuffer = await sharp(fileBuffer).jpeg().toBuffer();
      mimeType = 'image/jpeg';
    }

    const imageHash = createHash('sha256').update(sanitizedBuffer).digest('hex');

    // Duplicate Hash Check
    const duplicateUpload = await db.query.receiptUploads.findFirst({
      where: eq(receiptUploads.imageHash, imageHash)
    });

    let duplicateDetected = false;
    if (duplicateUpload) {
      duplicateDetected = true;
    }

    // Convert to Base64
    const base64Data = sanitizedBuffer.toString("base64");

    // 4. Extract Details with Gemini Vision
    let ocrResult: GeminiResponse;
    try {
      ocrResult = await this.extractReceiptDetails(base64Data, mimeType);
    } catch (e) {
      return { error: 'AI_PARSE_FAILED', message: 'Failed to process image.' };
    }

    if (ocrResult.receiptType === 'not_a_receipt') {
      // Log and reject
      await this.logAndReject(invoice, uploadId, imageHash, sanitizedBuffer.length, mimeType, 'not_a_receipt', ocrResult, ipAddress, userAgent);
      return { success: false, status: 'REJECTED', reason: 'NOT_A_RECEIPT' };
    }

    // 5. Reused Transaction Ref Check
    if (ocrResult.extracted.transactionReference) {
      const reusedRef = await db.query.verificationAttempts.findFirst({
        where: sql`"extracted_transaction_ref" = ${ocrResult.extracted.transactionReference} AND "verification_status" = 'AUTO_VERIFIED' AND "invoice_id" != ${invoiceId}`
      });
      if (reusedRef) {
        await this.logAndReject(invoice, uploadId, imageHash, sanitizedBuffer.length, mimeType, 'reused_ref', ocrResult, ipAddress, userAgent);
        return { success: false, status: 'REJECTED', reason: 'REUSED_TRANSACTION_REFERENCE' };
      }
    }

    // 6. Score the receipt
    const expectations: InvoiceExpectations = {
      expectedAmount: invoice.amount,
      expectedAccountNumber: invoice.accountNumber || '',
      expectedAccountName: invoice.accountName || '',
      invoiceCreatedAt: invoice.createdAt || new Date(),
      invoiceId: invoice.id,
      freelancerName: invoice.user.name || '',
      clientEmail: invoice.client.email,
      freelancerEmail: invoice.user.email,
      currency: 'NGN'
    };

    const scoringResult = ReceiptScorer.score(ocrResult, expectations, duplicateDetected);
    const finalStatus = scoringResult.status;

    // 7. Write DB records
    // Write to receiptUploads
    await db.insert(receiptUploads).values({
      invoiceId: invoice.id,
      uploadId,
      imageHash,
      fileSizeBytes: sanitizedBuffer.length,
      fileType: mimeType,
      verificationStatus: finalStatus,
      createdAt: new Date()
    });

    // Write to verificationAttempts
    await db.insert(verificationAttempts).values({
      invoiceId: invoice.id,
      uploadId,
      imageHash,
      extractedAmount: ocrResult.extracted.amount?.toString() || null,
      extractedAccountNumber: ocrResult.extracted.destinationAccountNumber,
      extractedAccountName: ocrResult.extracted.destinationAccountName,
      extractedTransactionRef: ocrResult.extracted.transactionReference,
      extractedDate: ocrResult.extracted.transactionDate ? new Date(ocrResult.extracted.transactionDate) : null,
      geminiConfidenceScore: ocrResult.fraudAnalysis.confidenceScore,
      suspectedFraud: ocrResult.fraudAnalysis.suspectedFraud,
      fraudReasons: ocrResult.fraudAnalysis.fraudReasons,
      imageAuthenticity: ocrResult.fraudAnalysis.overallImageAuthenticity,
      scoreBreakdown: scoringResult.breakdown,
      finalScore: scoringResult.breakdown.finalScore,
      verificationStatus: finalStatus,
      attemptNumber: attemptCount + 1,
      createdAt: new Date()
    });

    // Write auditLog
    await db.insert(auditLogs).values({
      invoiceId: invoice.id,
      uploadId,
      action: 'RECEIPT_VERIFICATION_ATTEMPT',
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      result: finalStatus,
      finalScore: scoringResult.breakdown.finalScore,
      suspectedFraud: ocrResult.fraudAnalysis.suspectedFraud,
      metadata: {},
      createdAt: new Date()
    });

    // 8. Update Invoice
    const invoiceEmailPayload = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      clientName: invoice.client.name,
      freelancerName: invoice.user.name || "Freelancer",
      freelancerEmail: invoice.user.email,
      clientEmail: invoice.client.email
    };

    if (finalStatus === 'AUTO_VERIFIED') {
      await db.update(invoices).set({
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        updatedAt: new Date()
      }).where(eq(invoices.id, invoice.id));

      await NotificationService.sendAutoVerified({
        invoice: invoiceEmailPayload,
        senderName: ocrResult.extracted.senderName || 'Unknown',
        transactionDate: ocrResult.extracted.transactionDate || new Date().toISOString(),
        confidenceScore: ocrResult.fraudAnalysis.confidenceScore,
        finalScore: scoringResult.breakdown.finalScore
      });

      await NotificationService.sendClientConfirmation({
        invoice: invoiceEmailPayload,
        uploadId,
        amount: ocrResult.extracted.amount || invoice.amount
      });
    } else if (finalStatus === 'MANUAL_REVIEW') {
      await db.update(invoices).set({
        verificationStatus: 'UNDER_REVIEW',
        updatedAt: new Date()
      }).where(eq(invoices.id, invoice.id));

      await NotificationService.sendManualReview({
        invoice: invoiceEmailPayload,
        positiveMatches: "Partial matches on amount or account found.",
        needsReview: "Some fields were missing or confidence was low.",
        confidenceScore: ocrResult.fraudAnalysis.confidenceScore,
        finalScore: scoringResult.breakdown.finalScore
      });
    } else { // REJECTED
      const newRejectedCount = (invoice.rejectedAttempts || 0) + 1;
      const updateData: any = {
        rejectedAttempts: newRejectedCount,
        updatedAt: new Date()
      };
      
      let blocked = false;
      if (newRejectedCount >= 3) {
        updateData.verificationStatus = 'BLOCKED';
        updateData.blockedAt = new Date();
        updateData.blockedReason = 'TOO_MANY_REJECTIONS';
        blocked = true;
      }

      await db.update(invoices).set(updateData).where(eq(invoices.id, invoice.id));

      if (blocked) {
        await NotificationService.sendBlocked({
          invoice: invoiceEmailPayload,
          uploadId,
          ipAddress: ipAddress || 'unknown'
        });
      } else {
        await NotificationService.sendRejected({
          invoice: invoiceEmailPayload,
          reason: 'Verification score was too low or anomalies were detected.',
          attemptsRemaining: 5 - (attemptCount + 1),
          uploadId
        });
      }
    }

    return {
      success: finalStatus === 'AUTO_VERIFIED' || finalStatus === 'MANUAL_REVIEW',
      status: finalStatus,
      score: scoringResult.breakdown.finalScore,
      attemptId: uploadId
    };
  }

  private static async logAndReject(
    invoice: any, 
    uploadId: string, 
    imageHash: string, 
    fileSizeBytes: number, 
    fileType: string, 
    reason: string, 
    ocrResult: GeminiResponse,
    ipAddress?: string,
    userAgent?: string
  ) {
    const attemptCountRes = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(verificationAttempts).where(eq(verificationAttempts.invoiceId, invoice.id));
    const attemptCount = attemptCountRes[0].count;

    await db.insert(receiptUploads).values({
      invoiceId: invoice.id,
      uploadId,
      imageHash,
      fileSizeBytes,
      fileType,
      verificationStatus: 'REJECTED',
      createdAt: new Date()
    });

    await db.insert(verificationAttempts).values({
      invoiceId: invoice.id,
      uploadId,
      imageHash,
      extractedAmount: null,
      extractedAccountNumber: null,
      extractedAccountName: null,
      extractedTransactionRef: null,
      extractedDate: null,
      geminiConfidenceScore: 0,
      suspectedFraud: false,
      fraudReasons: [reason],
      imageAuthenticity: 'LIKELY_FAKE',
      scoreBreakdown: {},
      finalScore: 0,
      verificationStatus: 'REJECTED',
      attemptNumber: attemptCount + 1,
      createdAt: new Date()
    });

    await db.insert(auditLogs).values({
      invoiceId: invoice.id,
      uploadId,
      action: 'RECEIPT_VERIFICATION_ATTEMPT',
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      result: 'REJECTED',
      finalScore: 0,
      suspectedFraud: false,
      metadata: { reason },
      createdAt: new Date()
    });

    const newRejectedCount = (invoice.rejectedAttempts || 0) + 1;
    await db.update(invoices).set({ rejectedAttempts: newRejectedCount }).where(eq(invoices.id, invoice.id));
  }
}
