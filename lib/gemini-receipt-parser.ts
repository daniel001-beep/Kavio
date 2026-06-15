import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export interface GeminiExtractedData {
  amount: number | null;
  accountNumber: string | null;
  accountName: string | null;
  bankName: string | null;
  transactionDate: string | null;
  transactionTime: string | null;
  transactionReference: string | null;
  senderName: string | null;
  senderBank: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  receiptType: "bank_transfer" | "opay" | "kuda" | "moniepoint" | "gtbank" | "access" | "zenith" | "uba" | "other";
  rawAmountText: string | null;
}

/**
 * Sends a base64 encoded receipt file (image or PDF) to Gemini 1.5-flash with a structured system prompt.
 */
export async function parseReceiptWithGemini(
  base64Data: string,
  mimeType: string
): Promise<GeminiExtractedData> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  // Create Google AI SDK instance
  const google = createGoogleGenerativeAI({ apiKey });
  const model = google("gemini-1.5-flash");

  const systemPrompt = `You are a Nigerian bank receipt verification AI. Your job is to extract payment data from bank transfer receipts with absolute precision.

Extract ONLY these fields and return them as valid JSON with no other text, no markdown, no preamble:
{
  "amount": number or null,
  "accountNumber": "string or null",
  "accountName": "string or null", 
  "bankName": "string or null",
  "transactionDate": "YYYY-MM-DD or null",
  "transactionTime": "HH:MM or null",
  "transactionReference": "string or null",
  "senderName": "string or null",
  "senderBank": "string or null",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "receiptType": "bank_transfer" | "opay" | "kuda" | "moniepoint" | "gtbank" | "access" | "zenith" | "uba" | "other",
  "rawAmountText": "string or null"
}

Rules:
- Amount must be a plain number with no currency symbols or commas (e.g. 150000 not ₦150,000)
- If any field is unclear or not visible, return null for that field
- If this is not a payment receipt at all, return confidence: LOW and all fields null
- Nigerian bank names to recognize: GTBank, Guaranty Trust, Access Bank, Zenith Bank, UBA, United Bank for Africa, First Bank, OPay, Kuda, Moniepoint, PalmPay, Sterling, Wema, FCMB, Fidelity, Union Bank, Stanbic, VFD
- transactionReference is the unique reference/session ID on the receipt`;

  try {
    const { text } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            { type: "file", data: base64Data, mediaType: mimeType }
          ]
        }
      ]
    });

    const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    return {
      amount: parsed.amount ? Number(parsed.amount) : null,
      accountNumber: parsed.accountNumber ? String(parsed.accountNumber).trim() : null,
      accountName: parsed.accountName ? String(parsed.accountName).trim() : null,
      bankName: parsed.bankName ? String(parsed.bankName).trim() : null,
      transactionDate: parsed.transactionDate ? String(parsed.transactionDate).trim() : null,
      transactionTime: parsed.transactionTime ? String(parsed.transactionTime).trim() : null,
      transactionReference: parsed.transactionReference ? String(parsed.transactionReference).trim() : null,
      senderName: parsed.senderName ? String(parsed.senderName).trim() : null,
      senderBank: parsed.senderBank ? String(parsed.senderBank).trim() : null,
      confidence: parsed.confidence || "LOW",
      receiptType: parsed.receiptType || "other",
      rawAmountText: parsed.rawAmountText ? String(parsed.rawAmountText).trim() : null,
    };
  } catch (error) {
    console.error("Error communicating with Gemini receipt verification model:", error);
    throw error;
  }
}
