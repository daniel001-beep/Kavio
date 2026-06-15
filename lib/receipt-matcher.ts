import { GeminiExtractedData } from "./gemini-receipt-parser";

export interface MatchResult {
  accountNumberMatch: boolean;
  accountNameMatch: boolean;
  amountMatch: boolean;
  amountDifference: number;
  overallMatch: "CONFIRMED" | "PARTIAL" | "FAILED" | "SUSPICIOUS";
  failureReasons: string[];
  confidenceScore: number; // 0-100
}

/**
 * Normalizes an account number by stripping spaces, dashes, and other non-digit characters.
 */
function normalizeAccountNumber(accNum: string | null): string {
  if (!accNum) return "";
  return accNum.replace(/[\s-]/g, "");
}

/**
 * Normalizes and compares bank account names using fuzzy word matching.
 * Normalize to uppercase, remove punctuation, split into words, check if >= 2 words match.
 */
export function fuzzyNameMatch(name1: string | null, name2: string | null): boolean {
  if (!name1 || !name2) return false;

  const clean = (s: string) =>
    s
      .toUpperCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const n1 = clean(name1);
  const n2 = clean(name2);

  if (n1 === n2 && n1 !== "") return true;

  const words1 = n1.split(" ").filter((w) => w.length > 1); // Ignore single letter initials
  const words2 = n2.split(" ").filter((w) => w.length > 1);

  let matchCount = 0;
  for (const w of words2) {
    if (words1.includes(w)) {
      matchCount++;
    }
  }

  if (matchCount >= 2) return true;

  // Fallback for single-word exact match
  if (words1.length === 1 && words2.length === 1 && words1[0] === words2[0]) {
    return true;
  }

  return false;
}

/**
 * Runs matching and scoring logic between Gemini extracted data and the DB invoice record.
 */
export function matchReceipt(
  geminiData: GeminiExtractedData,
  invoice: {
    amount: number;
    accountNumber: string | null;
    accountName: string | null;
  },
  context: {
    isReferenceDuplicate: boolean;
    isFileModifiedRecently: boolean;
    failedAttemptsCount: number;
  }
): MatchResult {
  const failureReasons: string[] = [];
  let score = 0;

  // 1. Account Number Match (MUST match for any positive result)
  const normalizedInvoiceAcc = normalizeAccountNumber(invoice.accountNumber);
  const normalizedExtractedAcc = normalizeAccountNumber(geminiData.accountNumber);
  
  const accountNumberMatch =
    normalizedInvoiceAcc !== "" &&
    normalizedExtractedAcc !== "" &&
    normalizedInvoiceAcc === normalizedExtractedAcc;

  if (!accountNumberMatch) {
    return {
      accountNumberMatch: false,
      accountNameMatch: false,
      amountMatch: false,
      amountDifference: 0,
      overallMatch: "FAILED",
      failureReasons: ["Account number on receipt does not match the invoice account number"],
      confidenceScore: 0,
    };
  }
  
  // Account number matched (+40 points)
  score += 40;

  // 2. Amount Match (allow tolerance of ±₦100 for bank charges)
  const extractedAmount = geminiData.amount || 0;
  const amountDifference = extractedAmount - invoice.amount;
  
  // If amount is more than ₦100 short -> FAILED
  const amountShort = amountDifference < -100;
  
  let amountMatch = false;
  if (!amountShort) {
    amountMatch = true;
    if (Math.abs(amountDifference) === 0) {
      score += 30; // Amount matches exactly
    } else if (Math.abs(amountDifference) <= 100) {
      score += 20; // Amount within tolerance (±₦100)
    }
  } else {
    failureReasons.push("Amount on receipt is short by more than ₦100");
  }

  // 3. Account Name Match (Fuzzy match)
  const accountNameMatch = fuzzyNameMatch(invoice.accountName, geminiData.accountName);
  if (accountNameMatch) {
    score += 20;
  } else {
    failureReasons.push("Account name on receipt does not match the invoice account name");
  }

  // 4. Gemini confidence is HIGH (+10 points)
  if (geminiData.confidence === "HIGH") {
    score += 10;
  }

  // 5. Transaction reference exists (+5 points)
  const hasReference = !!geminiData.transactionReference && geminiData.transactionReference !== "null";
  if (hasReference) {
    score += 5;
  }

  // Determine overall match based on score
  let overallMatch: MatchResult["overallMatch"] = "FAILED";
  
  if (score > 70) {
    overallMatch = "CONFIRMED";
  } else if (score >= 40) {
    overallMatch = "PARTIAL";
  }

  // If amount is more than 100 short, it must fail regardless of score
  if (amountShort) {
    overallMatch = "FAILED";
  }

  // --- SUSPICIOUS FLAGS OVERRIDES ---
  let isSuspicious = false;
  const suspicionReasons: string[] = [];

  // Same transaction reference submitted more than once across any invoice
  if (context.isReferenceDuplicate) {
    isSuspicious = true;
    suspicionReasons.push("Duplicate transaction reference submitted across invoices");
  }

  // Receipt date is more than 7 days old
  if (geminiData.transactionDate) {
    const rxDate = new Date(geminiData.transactionDate);
    const now = new Date();
    // Reset hours to compare dates
    rxDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(now.getTime() - rxDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 7) {
      isSuspicious = true;
      suspicionReasons.push("Receipt date is older than 7 days");
    }
  }

  // Amount is exactly ₦0
  if (extractedAmount === 0) {
    isSuspicious = true;
    suspicionReasons.push("Extracted receipt amount is exactly ₦0");
  }

  // Gemini confidence is LOW
  if (geminiData.confidence === "LOW") {
    isSuspicious = true;
    suspicionReasons.push("Gemini OCR verification confidence is LOW");
  }

  // File was modified recently
  if (context.isFileModifiedRecently) {
    isSuspicious = true;
    suspicionReasons.push("Receipt file metadata indicates recent modifications");
  }

  // More than 2 failed verification attempts on same invoice (attempts >= 3)
  if (context.failedAttemptsCount > 2) {
    isSuspicious = true;
    suspicionReasons.push("Too many failed verification attempts for this invoice");
  }

  if (isSuspicious) {
    overallMatch = "SUSPICIOUS";
    failureReasons.push(...suspicionReasons);
  }

  return {
    accountNumberMatch,
    accountNameMatch,
    amountMatch,
    amountDifference,
    overallMatch,
    failureReasons,
    confidenceScore: Math.min(score, 100),
  };
}
