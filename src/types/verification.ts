export interface GeminiOcrResult {
  amount: number;
  account_number: string;
  account_name: string;
  bank_name: string;
  transaction_reference: string;
  sender_name: string;
  transaction_date: string;
  confidence_score: number;
}

export interface VerificationScore {
  amountScore: number;
  accountNumberScore: number;
  accountNameScore: number;
  dateScore: number;
  referenceScore: number;
  totalScore: number;
  status: "AUTO_VERIFIED" | "MANUAL_REVIEW" | "REJECTED";
  fraudFlags: string[];
  isSuspectedFraud: boolean;
}

export interface ReceiptSubmissionDetails {
  id: string;
  invoiceId: string;
  status: string;
  confidenceScore: number;
  fraudFlags: string[];
  extractedAmount?: number;
  extractedDate?: string;
  extractedRef?: string;
  senderName?: string;
  receiverName?: string;
  bankName?: string;
  sessionId?: string;
  senderAccountLast4?: string;
  submittedRef?: string;
  ocrResult?: any;
  createdAt: Date;
}
