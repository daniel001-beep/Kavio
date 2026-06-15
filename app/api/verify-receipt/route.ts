import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/src/db";
import { invoices, verificationAttempts, receiptUploads, notifications, users, clients } from "@/src/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { verifyCsrfToken, verifyRequestSignature, checkFileMetadataSuspicious, sanitizeImage } from "@/lib/security";
import { parseReceiptWithGemini } from "@/lib/gemini-receipt-parser";
import { matchReceipt } from "@/lib/receipt-matcher";
import { NotificationService } from "@/src/services/notifications";

export const dynamic = "force-dynamic";

/**
 * Validates the file magic bytes against allowed image and PDF formats.
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  const type = mimeType.toLowerCase();

  // JPG / JPEG: starts with FF D8 FF
  if (type === "image/jpeg" || type === "image/jpg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
  if (type === "image/png") {
    if (buffer.length < 8) return false;
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WEBP: starts with RIFF (52 49 46 46) and WEBP (57 45 42 50) at offset 8
  if (type === "image/webp") {
    if (buffer.length < 12) return false;
    return (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    );
  }

  // PDF: starts with %PDF (25 50 44 46)
  if (type === "application/pdf") {
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    );
  }

  return false;
}

export async function POST(req: Request) {
  const uploadId = crypto.randomUUID();
  console.log(`[VerifyReceipt:${uploadId}] Starting receipt verification`);

  try {
    const headersList = await headers();
    const clientIp = headersList.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    
    // Parse Multipart Form Data
    const formData = await req.formData();
    
    // 1. Honeypot check
    const honeypot = formData.get("website");
    if (honeypot && String(honeypot).trim() !== "") {
      console.warn(`[VerifyReceipt:${uploadId}] Bot detected via honeypot field`);
      // Silent rejection to bot
      return NextResponse.json({ success: false, status: "SUSPICIOUS", message: "Verification processed" });
    }

    const invoiceId = formData.get("invoiceId") as string;
    const csrfToken = formData.get("csrfToken") as string;
    const timestamp = formData.get("timestamp") as string;
    const fingerprint = formData.get("fingerprint") as string;
    const signature = formData.get("signature") as string;
    const file = formData.get("file") as File;
    const lastModified = formData.get("lastModified") as string;

    if (!invoiceId || !file) {
      console.warn(`[VerifyReceipt:${uploadId}] Missing required fields`);
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Retrieve invoice record
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
    });

    if (!invoice) {
      console.warn(`[VerifyReceipt:${uploadId}] Invoice not found: ${invoiceId}`);
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Retrieve freelancer & client details for notifications
    const freelancer = await db.query.users.findFirst({
      where: eq(users.id, invoice.userId),
    });
    
    const clientInfo = await db.query.clients.findFirst({
      where: eq(clients.id, invoice.clientId),
    });

    if (!freelancer || !clientInfo) {
      return NextResponse.json({ error: "System user configuration missing" }, { status: 500 });
    }

    const emailInvoiceInfo = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      clientName: clientInfo.name,
      freelancerName: freelancer.name || "Freelancer",
      freelancerEmail: freelancer.email,
      clientEmail: clientInfo.email,
    };

    // 2. Rate Limiting Check (Max 3 attempts)
    // If client attempts a 4th time (invoice.verificationAttempts >= 3), flag invoice as suspicious
    if (invoice.verificationAttempts >= 3) {
      console.warn(`[VerifyReceipt:${uploadId}] Rate limit exceeded for invoice: ${invoice.invoiceNumber}`);
      
      // Update DB to flagged suspicious
      await db.update(invoices)
        .set({
          verificationStatus: "suspicious",
          flagged: true,
          flagReason: "Rate limit exceeded: Maximum 3 verification attempts reached",
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId));

      // Trigger URGENT Email
      await NotificationService.sendSuspiciousAlert({
        invoice: emailInvoiceInfo,
        reason: "Rate limit exceeded (Maximum 3 verification attempts reached)",
        uploadId,
      }).catch(e => console.error("Suspicious alert email failed", e));

      // Trigger in-app notification
      await db.insert(notifications).values({
        userId: invoice.userId,
        title: "🚨 URGENT: Suspicious activity blocked",
        message: `Invoice #${invoice.invoiceNumber} has exceeded maximum verification attempts. Flagged as suspicious.`,
        type: "manual_review_required",
      });

      return NextResponse.json({
        success: false,
        status: "SUSPICIOUS",
        uploadId,
        message: "This receipt could not be processed. Please contact the freelancer directly."
      });
    }

    // 3. Security tokens verification (CSRF and Request signature)
    const isCsrfValid = verifyCsrfToken(csrfToken, invoiceId, clientIp);
    const isSignatureValid = verifyRequestSignature(signature, timestamp, fingerprint, csrfToken);

    if (!isCsrfValid || !isSignatureValid) {
      console.warn(`[VerifyReceipt:${uploadId}] CSRF or request signature verification failed. CSRF: ${isCsrfValid}, Signature: ${isSignatureValid}`);
      return NextResponse.json({ error: "Security validation failed. Please refresh the page and try again." }, { status: 403 });
    }

    // 4. File Validation
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
      console.warn(`[VerifyReceipt:${uploadId}] Invalid file MIME type: ${file.type}`);
      return NextResponse.json({ error: "Invalid file format. Acceptable formats: JPG, JPEG, PNG, WEBP, PDF" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`[VerifyReceipt:${uploadId}] File too large: ${file.size} bytes`);
      return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(new Uint8Array(arrayBuffer)) as any;

    // Verify magic bytes
    if (!validateMagicBytes(fileBuffer, file.type)) {
      console.warn(`[VerifyReceipt:${uploadId}] Magic bytes do not match file mime type.`);
      return NextResponse.json({ error: "Security validation failed. Uploaded file is corrupted or spoofed." }, { status: 400 });
    }

    // 5. Client fingerprint discrepancy check
    // Query previous attempts to see if same invoice got uploads from different fingerprints
    const prevAttempts = await db.select()
      .from(verificationAttempts)
      .where(eq(verificationAttempts.invoiceId, invoiceId));

    let fingerprintDiscrepancy = false;
    if (prevAttempts.length > 0) {
      const distinctFingerprints = new Set(prevAttempts.map(a => a.fingerprint).filter(Boolean));
      if (distinctFingerprints.size > 0 && !distinctFingerprints.has(fingerprint)) {
        fingerprintDiscrepancy = true;
        console.warn(`[VerifyReceipt:${uploadId}] Fingerprint mismatch detected. Previous fingerprints: ${Array.from(distinctFingerprints).join(", ")}, Current: ${fingerprint}`);
      }
    }

    // 6. EXIF scan and metadata editing check
    const metadataCheck = await checkFileMetadataSuspicious(fileBuffer, file.type);
    
    // File modification date check
    const lastModifiedTime = Number(lastModified);
    let isFileModifiedRecently = false;
    
    if (!isNaN(lastModifiedTime)) {
      const timeDiff = Date.now() - lastModifiedTime;
      // If it was modified within the last 5 minutes, mark as recently modified
      if (timeDiff >= 0 && timeDiff < 5 * 60 * 1000) {
        isFileModifiedRecently = true;
      }
    }

    const isMetadataSuspicious = metadataCheck.suspicious || fingerprintDiscrepancy || isFileModifiedRecently;
    const metadataSuspicionReason = [
      metadataCheck.reason,
      fingerprintDiscrepancy ? "Multiple distinct client session fingerprints detected on invoice attempts" : null,
      isFileModifiedRecently ? "Receipt file was modified recently (within 5 minutes)" : null
    ].filter(Boolean).join(" | ");

    // 7. Sanitize file (strip EXIF metadata)
    let processedBuffer = fileBuffer;
    try {
      processedBuffer = await sanitizeImage(fileBuffer, file.type);
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Failed to sanitize image" }, { status: 400 });
    }

    // 8. Convert to Base64 and run Gemini OCR parser
    const base64Data = processedBuffer.toString("base64");
    const extractedData = await parseReceiptWithGemini(base64Data, file.type);
    console.log(`[VerifyReceipt:${uploadId}] Gemini OCR extraction completed`, extractedData);

    // 9. Duplicate reference check
    let isReferenceDuplicate = false;
    if (extractedData.transactionReference && extractedData.transactionReference !== "null") {
      const dupInvoice = await db.select()
        .from(invoices)
        .where(
          and(
            eq(invoices.transactionReference, extractedData.transactionReference),
            ne(invoices.id, invoiceId)
          )
        )
        .limit(1);

      if (dupInvoice.length > 0) {
        isReferenceDuplicate = true;
        console.warn(`[VerifyReceipt:${uploadId}] Duplicate transaction reference detected: ${extractedData.transactionReference}`);
      }
    }

    // Increment invoice attempts counter
    const currentAttempts = (invoice.verificationAttempts || 0) + 1;
    await db.update(invoices)
      .set({
        verificationAttempts: currentAttempts,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId));

    // 10. Run Matcher & Score Scorer
    const matchResult = matchReceipt(
      extractedData,
      {
        amount: invoice.amount,
        accountNumber: invoice.accountNumber,
        accountName: invoice.accountName
      },
      {
        isReferenceDuplicate,
        isFileModifiedRecently: isMetadataSuspicious, // Combine EXIF, fingerprint, and modification checks
        failedAttemptsCount: currentAttempts
      }
    );

    console.log(`[VerifyReceipt:${uploadId}] Matching logic outcome:`, matchResult);

    // 11. Save receipt upload record
    const [upload] = await db.insert(receiptUploads).values({
      invoiceId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type.split("/")[1].toUpperCase(),
      receiptImageBase64: base64Data
    }).returning();

    // 12. Save verification attempt
    await db.insert(verificationAttempts).values({
      invoiceId,
      receiptUploadId: upload.id,
      confidenceScore: matchResult.confidenceScore,
      extractedAmount: extractedData.amount,
      extractedAccountNumber: extractedData.accountNumber,
      extractedAccountName: extractedData.accountName,
      extractedBankName: extractedData.bankName,
      extractedRef: extractedData.transactionReference,
      extractedSenderName: extractedData.senderName,
      extractedDate: extractedData.transactionDate,
      scoreAmount: matchResult.amountMatch ? 30 : 0, // matches exactly = 30
      scoreAccountNumber: matchResult.accountNumberMatch ? 40 : 0,
      scoreAccountName: matchResult.accountNameMatch ? 20 : 0,
      scoreDate: extractedData.transactionDate ? 5 : 0,
      scoreReference: extractedData.transactionReference ? 5 : 0,
      totalScore: matchResult.confidenceScore,
      status: matchResult.overallMatch === "CONFIRMED" ? "AUTO_VERIFIED" : (matchResult.overallMatch === "PARTIAL" ? "MANUAL_REVIEW" : "REJECTED"),
      fraudFlags: matchResult.failureReasons,
      isSuspectedFraud: matchResult.overallMatch === "SUSPICIOUS",
      ocrRawResult: extractedData,
      fingerprint,
    });

    // 13. Perform Database updates & trigger corresponding email/notification templates
    if (matchResult.overallMatch === "CONFIRMED") {
      // CONFIRMED outcome
      await db.update(invoices)
        .set({
          status: "PAID",
          verificationStatus: "confirmed",
          verifiedAt: new Date(),
          transactionReference: extractedData.transactionReference,
          geminiExtractedData: extractedData,
          confidenceScore: matchResult.confidenceScore,
          uploadId,
          isAutomatedReminderEnabled: false, // Stop reminders immediately
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId));

      // Trigger Confirmed Email
      await NotificationService.sendPaymentConfirmed({
        invoice: emailInvoiceInfo,
        senderName: extractedData.senderName || "the client",
      }).catch(e => console.error("Payment confirmed email failed", e));

    } else if (matchResult.overallMatch === "PARTIAL") {
      // PARTIAL outcome
      await db.update(invoices)
        .set({
          verificationStatus: "partial",
          geminiExtractedData: extractedData,
          confidenceScore: matchResult.confidenceScore,
          uploadId,
          flagged: true,
          flagReason: "Partial verification match, manual review required",
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId));

      // Trigger Partial Email
      await NotificationService.sendPartialVerification({
        invoice: emailInvoiceInfo,
        matchDetails: {
          accountNumberMatch: matchResult.accountNumberMatch,
          accountNameMatch: matchResult.accountNameMatch,
          amountMatch: matchResult.amountMatch,
          score: matchResult.confidenceScore,
        }
      }).catch(e => console.error("Partial verification email failed", e));

    } else if (matchResult.overallMatch === "FAILED") {
      // FAILED outcome
      const isRateLimited = currentAttempts >= 3;
      await db.update(invoices)
        .set({
          verificationStatus: "failed",
          geminiExtractedData: extractedData,
          confidenceScore: matchResult.confidenceScore,
          uploadId,
          flagged: isRateLimited,
          flagReason: isRateLimited ? "Maximum verification attempts exceeded" : "Receipt details mismatched",
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId));

      // Trigger Failed Email
      const reason = matchResult.failureReasons[0] || "Details on the receipt did not match the invoice requirements";
      await NotificationService.sendVerificationFailed({
        invoice: emailInvoiceInfo,
        reason,
      }).catch(e => console.error("Verification failed email failed", e));

    } else if (matchResult.overallMatch === "SUSPICIOUS") {
      // SUSPICIOUS outcome
      const reason = isReferenceDuplicate
        ? "Duplicate transaction reference — this receipt may have been used before"
        : (metadataSuspicionReason || "Detected risk patterns (Low confidence / Old date / ₦0 amount)");

      await db.update(invoices)
        .set({
          verificationStatus: "suspicious",
          flagged: true,
          flagReason: reason,
          geminiExtractedData: extractedData,
          confidenceScore: matchResult.confidenceScore,
          uploadId,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId));

      // Trigger URGENT email
      await NotificationService.sendSuspiciousAlert({
        invoice: emailInvoiceInfo,
        reason,
        uploadId,
      }).catch(e => console.error("Suspicious alert email failed", e));

      // Trigger in-app notification
      await db.insert(notifications).values({
        userId: invoice.userId,
        title: "🚨 URGENT: Suspicious Receipt Uploaded",
        message: `Invoice #${invoice.invoiceNumber} has been flagged: ${reason}`,
        type: "manual_review_required",
      });
    }

    return NextResponse.json({
      success: matchResult.overallMatch === "CONFIRMED" || matchResult.overallMatch === "PARTIAL",
      status: matchResult.overallMatch,
      score: matchResult.confidenceScore,
      failureReasons: matchResult.failureReasons,
      attemptsRemaining: Math.max(0, 3 - currentAttempts),
      uploadId,
    });

  } catch (error: any) {
    console.error(`[VerifyReceipt:${uploadId}] Server error:`, error);
    return NextResponse.json(
      { error: error.message || "An internal error occurred during receipt processing." },
      { status: 500 }
    );
  }
}
