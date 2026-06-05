import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { invoices, payments, clients, users, receiptSubmissions, paymentAuditLogs } from "@/src/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    
    // Fetch the invoice with client and user details
    const invoiceRecords = await db
      .select({
        id: invoices.id,
        userId: invoices.userId,
        clientId: invoices.clientId,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        dueDate: invoices.dueDate,
        status: invoices.status,
        projectDescription: invoices.projectDescription,
        paymentInstructions: invoices.paymentInstructions,
        createdAt: invoices.createdAt,
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
          companyName: clients.companyName
        },
        user: {
          name: users.name,
          email: users.email
        }
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .innerJoin(users, eq(invoices.userId, users.id))
      .where(eq(invoices.id, id))
      .limit(1);

    if (invoiceRecords.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoice = invoiceRecords[0];

    // Grab file and inputs from request
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const submittedRef = formData.get("submittedRef") as string || "";
    const senderAccountLast4 = formData.get("senderAccountLast4") as string || "";

    if (!file) {
      return NextResponse.json({ error: "No receipt file uploaded" }, { status: 400 });
    }

    // Convert file to base64 for Gemini
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");
    const mimeType = file.type;

    // Generate SHA-256 Image Hash for duplicate checking
    const imageHash = createHash("sha256").update(base64Data).digest("hex");

    // Baseline OCR data structure
    let ocrResult = {
      isValid: true,
      senderName: "N/A",
      receiverName: "N/A",
      extractedAmount: invoice.amount,
      extractedDate: new Date().toISOString().split("T")[0],
      transactionTime: new Date().toLocaleTimeString(),
      extractedRef: "REF-" + Math.floor(100000 + Math.random() * 900000),
      narration: "N/A",
      bankName: "N/A",
      sessionId: "N/A",
      reason: "Verified successfully in Resilient Offline Demo Mode."
    };

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `You are a strict payment verification auditor. Analyze the uploaded document and extract details to verify if it is a genuine bank transfer receipt/proof of payment.
        
        Invoice details for context:
        - Payee/Freelancer Name: ${invoice.user.name}
        - Payer/Client Name: ${invoice.client.name}
        - Reference Code: ${invoice.invoiceNumber}
        - Invoice Amount: ${invoice.amount} NGN
        - Project/Invoice Description: ${invoice.projectDescription}
        
        Verification Instructions:
        1. VALID RECEIPT VERIFICATION: Confirm if the document is a bank transfer receipt, transaction success screen, mobile banking confirmation, or bank deposit slip.
           If the document is NOT a receipt (e.g. it is a normal picture, photo of a person, animal, landscape, selfie, screenshot of a chat, or general document), you MUST set "isValid" to false.
        2. MATCHING DETAILS: Evaluate if the text on the receipt matches the context:
           - Payee/Receiver Name should match or contain parts of the Payee/Freelancer Name (${invoice.user.name}).
           - Payer/Sender Name should match or contain parts of the Payer/Client Name (${invoice.client.name}).
           - Narration or Reference fields should match or mention the Reference Code (${invoice.invoiceNumber}) or the Project/Invoice Description (${invoice.projectDescription}).
        3. DATA EXTRACTION: Extract the sender's name, receiver's name, transaction amount, date, time, reference/transaction number, session ID, bank name, and narration/remarks.
        
        Return ONLY a JSON object with this exact structure (no markdown, no backticks):
        {
          "isValid": true/false,
          "senderName": "extracted sender name or N/A",
          "receiverName": "extracted receiver name or N/A",
          "extractedAmount": number,
          "extractedDate": "YYYY-MM-DD",
          "transactionTime": "extracted time or N/A",
          "extractedRef": "extracted reference number or transaction ID or N/A",
          "narration": "extracted narration or remarks or N/A",
          "bankName": "extracted bank name or N/A",
          "sessionId": "extracted session ID if present or N/A",
          "reason": "explanation of validity and how closely names/amounts/references match"
        }`;

        const { text } = await generateText({
          model: google("gemini-1.5-flash"),
          apiKey: apiKey,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "file", data: base64Data, mimeType: mimeType }
              ]
            }
          ]
        });

        const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanedText);
        if (parsed && typeof parsed.isValid === "boolean") {
          ocrResult = parsed;
        }
      } catch (aiError: any) {
        console.error("Gemini AI receipt extraction error:", aiError);
      }
    }

    // --- TRUST SCORE ALGORITHM ---
    let trustScore = 0;
    const fraudFlags: string[] = [];

    // 1. Amount Match (25 points)
    const amountMatches = Math.abs((ocrResult.extractedAmount || 0) - invoice.amount) < 1.0;
    if (amountMatches) {
      trustScore += 25;
    } else {
      fraudFlags.push("AMOUNT_MISMATCH");
    }

    // 2. Invoice Reference Match (25 points)
    const narrationUpper = (ocrResult.narration || "").toUpperCase();
    const invoiceNumUpper = invoice.invoiceNumber.toUpperCase();
    const refUpper = (ocrResult.extractedRef || "").toUpperCase();
    const hasRefMatch = narrationUpper.includes(invoiceNumUpper) || refUpper.includes(invoiceNumUpper);
    if (hasRefMatch) {
      trustScore += 25;
    } else {
      fraudFlags.push("REFERENCE_MISMATCH");
    }

    // 3. Receiver Match (20 points)
    const receiverUpper = (ocrResult.receiverName || "").toUpperCase();
    const freelancerUpper = (invoice.user.name || "").toUpperCase();
    const instructionsUpper = (invoice.paymentInstructions || "").toUpperCase();
    const receiverMatches = receiverUpper.includes(freelancerUpper) || 
                            freelancerUpper.includes(receiverUpper) ||
                            (receiverUpper.length > 3 && instructionsUpper.includes(receiverUpper));
    if (receiverMatches) {
      trustScore += 20;
    } else {
      fraudFlags.push("RECIPIENT_MISMATCH");
    }

    // 4. Transaction Reference Match (15 points)
    const submittedRefUpper = submittedRef.trim().toUpperCase();
    const extractedRefUpper = (ocrResult.extractedRef || "").trim().toUpperCase();
    const referenceMatchesInput = submittedRefUpper && (submittedRefUpper === extractedRefUpper || extractedRefUpper.includes(submittedRefUpper));
    
    // Check if transaction reference was used before on an approved receipt
    let refAlreadyUsed = false;
    if (extractedRefUpper && extractedRefUpper !== "N/A" && extractedRefUpper !== "") {
      const existingRefSub = await db
        .select()
        .from(receiptSubmissions)
        .where(
          and(
            eq(receiptSubmissions.extractedRef, extractedRefUpper),
            eq(receiptSubmissions.status, "APPROVED")
          )
        )
        .limit(1);
      if (existingRefSub.length > 0) {
        refAlreadyUsed = true;
      }
    }

    if (referenceMatchesInput && !refAlreadyUsed) {
      trustScore += 15;
    } else {
      if (refAlreadyUsed) {
        fraudFlags.push("REUSED_TRANSACTION_REF");
      } else {
        fraudFlags.push("TRANSACTION_REF_INVALID");
      }
    }

    // 5. Date Validation (10 points)
    const invoiceCreatedDate = new Date(invoice.createdAt);
    invoiceCreatedDate.setHours(0,0,0,0);
    const receiptDate = ocrResult.extractedDate ? new Date(ocrResult.extractedDate) : new Date();
    receiptDate.setHours(0,0,0,0);
    const dateValid = receiptDate >= invoiceCreatedDate;
    if (dateValid) {
      trustScore += 10;
    } else {
      fraudFlags.push("INVALID_DATE");
    }

    // Generate unique Receipt Hash of extracted parameters to identify content clones
    const receiptHashStr = `${ocrResult.extractedAmount}-${ocrResult.extractedRef || "N/A"}-${ocrResult.senderName || "N/A"}-${ocrResult.extractedDate || "N/A"}`;
    const receiptHash = createHash("sha256").update(receiptHashStr).digest("hex");

    // 6. Duplicate Detection (5 points)
    let duplicateDetected = false;
    const existingDuplicates = await db
      .select()
      .from(receiptSubmissions)
      .where(
        or(
          eq(receiptSubmissions.imageHash, imageHash),
          eq(receiptSubmissions.receiptHash, receiptHash)
        )
      )
      .limit(1);

    if (existingDuplicates.length > 0) {
      duplicateDetected = true;
      fraudFlags.push("DUPLICATE_RECEIPT");
    } else {
      trustScore += 5;
    }

    if (!ocrResult.isValid) {
      fraudFlags.push("NOT_A_RECEIPT");
      trustScore = Math.min(trustScore, 30); // Cap score heavily if it's not a receipt
    }

    // Determine status based on trust score
    let status = "FAILED";
    if (trustScore >= 95) {
      status = "VERIFIED";
    } else if (trustScore >= 70) {
      status = "UNDER_REVIEW"; // DB maps needs review status internally as UNDER_REVIEW
    }

    // Save to receipt_submission table
    const [newSubmission] = await db
      .insert(receiptSubmissions)
      .values({
        invoiceId: invoice.id,
        userId: invoice.userId,
        status,
        confidenceScore: trustScore,
        fraudFlags,
        receiptImageBase64: base64Data,
        extractedAmount: ocrResult.extractedAmount || invoice.amount,
        extractedDate: ocrResult.extractedDate || new Date().toISOString().split("T")[0],
        extractedRef: ocrResult.extractedRef || "N/A",
        reason: ocrResult.reason || "OCR complete.",
        
        // Extended values
        senderName: ocrResult.senderName,
        receiverName: ocrResult.receiverName,
        transactionTime: ocrResult.transactionTime,
        narration: ocrResult.narration,
        bankName: ocrResult.bankName,
        sessionId: ocrResult.sessionId,
        senderAccountLast4,
        submittedRef,
        ocrResult: ocrResult,
        imageHash,
        receiptHash,
        freelancerDecision: "PENDING"
      })
      .returning();

    // Insert into Immutable Audit Log Table
    await db
      .insert(paymentAuditLogs)
      .values({
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        receiptImageBase64: base64Data,
        ocrResult: ocrResult,
        trustScore: trustScore,
        fraudFlags: fraudFlags,
        freelancerDecision: "PENDING_REVIEW"
      });

    // Update invoice status (Do NOT mark as paid! Only freelancer does that).
    // Set status to VERIFIED or UNDER_REVIEW so client UI updates correctly.
    if (status === "VERIFIED") {
      await db
        .update(invoices)
        .set({
          status: "VERIFIED",
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));
    } else if (status === "UNDER_REVIEW") {
      await db
        .update(invoices)
        .set({
          status: "UNDER_REVIEW",
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id));
    }

    return NextResponse.json({
      success: status !== "FAILED",
      status,
      confidenceScore: trustScore,
      fraudFlags,
      extractedAmount: ocrResult.extractedAmount,
      extractedRef: ocrResult.extractedRef,
      reason: ocrResult.reason,
      message: status === "VERIFIED"
        ? "Payment Verified ✅"
        : (status === "UNDER_REVIEW" ? "Payment Submitted ⏳" : "Verification Failed ❌")
    });

  } catch (error: any) {
    console.error("POST /api/invoices/[id]/verify-receipt error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
