export interface GeminiResponse {
  extracted: {
    amount: number | null;
    rawAmountText: string | null;
    destinationAccountNumber: string | null;
    destinationAccountName: string | null;
    bankName: string | null;
    transactionDate: string | null;
    transactionTime: string | null;
    transactionReference: string | null;
    senderName: string | null;
    senderBank: string | null;
    currency: string | null;
  };
  fraudAnalysis: {
    suspectedFraud: boolean;
    fraudReasons: string[];
    tamperedRegions: string[];
    overallImageAuthenticity: "AUTHENTIC" | "SUSPICIOUS" | "LIKELY_FAKE";
    confidenceScore: number;
  };
  receiptType: "bank_transfer" | "opay" | "kuda" | "moniepoint" | "gtbank" | "access" | "zenith" | "uba" | "other" | "not_a_receipt";
}

export interface InvoiceExpectations {
  expectedAmount: number;
  expectedAccountNumber: string;
  expectedAccountName: string;
  invoiceCreatedAt: Date;
  invoiceId: string;
  freelancerName: string;
  clientEmail: string;
  freelancerEmail: string;
  currency: string;
}

export interface ScoreBreakdown {
  amountScore: number;        // max 40
  accountNumberScore: number; // max 25
  accountNameScore: number;   // max 15
  dateScore: number;          // max 10
  fraudScore: number;         // max 10
  total: number;              // max 100
  penalties: number;          // deducted
  finalScore: number;         // total - penalties
}

export type VerificationStatus = 'AUTO_VERIFIED' | 'MANUAL_REVIEW' | 'REJECTED';

export class ReceiptScorer {
  static score(
    geminiData: GeminiResponse,
    invoice: InvoiceExpectations,
    duplicateImagePenalty: boolean = false
  ): {
    breakdown: ScoreBreakdown;
    status: VerificationStatus;
  } {
    let amountScore = 0;
    let accountNumberScore = 0;
    let accountNameScore = 0;
    let dateScore = 0;
    let fraudScore = 0;
    let penalties = 0;

    // 1. Amount Scoring (40 max)
    if (geminiData.extracted.amount !== null) {
      const diff = geminiData.extracted.amount - invoice.expectedAmount;
      if (Math.abs(diff) < 1.0) {
        amountScore = 40; // Exact
      } else if (Math.abs(diff) <= 100) {
        amountScore = 30; // Small bank charge diff
      } else if (Math.abs(diff) <= 500) {
        amountScore = 15; // Moderate diff
      } else if (diff > 0) {
        amountScore = 35; // Overpayment
      } else {
        amountScore = 0; // Short by > 500
      }
    }

    // 2. Account Number Scoring (25 max)
    const extAcc = geminiData.extracted.destinationAccountNumber?.replace(/\s|-/g, "");
    const invAcc = invoice.expectedAccountNumber?.replace(/\s|-/g, "");
    if (extAcc && invAcc) {
      if (extAcc === invAcc) {
        accountNumberScore = 25;
      } else {
        let matches = 0;
        for (let i = 0; i < Math.min(extAcc.length, invAcc.length); i++) {
          if (extAcc[i] === invAcc[i]) matches++;
        }
        if (matches >= 9) {
          accountNumberScore = 10;
        }
      }
    }

    // 3. Account Name Scoring (15 max)
    const extName = (geminiData.extracted.destinationAccountName || "").toUpperCase();
    const invName = (invoice.expectedAccountName || "").toUpperCase();
    if (extName && invName) {
      const jaro = this.computeJaroWinkler(extName, invName);
      if (jaro > 0.85) {
        accountNameScore = 15;
      } else if (jaro >= 0.70) {
        accountNameScore = 10;
      } else {
        const extWords = extName.split(" ");
        const invWords = invName.split(" ");
        let matchCount = 0;
        extWords.forEach(w => {
          if (w.length > 2 && invWords.includes(w)) matchCount++;
        });
        if (matchCount >= 2) {
          accountNameScore = 8;
        }
      }
    }

    // 4. Date Scoring (10 max)
    if (geminiData.extracted.transactionDate) {
      const receiptDate = new Date(geminiData.extracted.transactionDate);
      receiptDate.setHours(0, 0, 0, 0);
      const invoiceDate = new Date(invoice.invoiceCreatedAt);
      invoiceDate.setHours(0, 0, 0, 0);
      
      const daysDiff = (new Date().getTime() - receiptDate.getTime()) / (1000 * 3600 * 24);

      if (daysDiff > 60) {
        dateScore = 0;
        penalties += 15; // RECEIPT_TOO_OLD
      } else if (receiptDate >= invoiceDate) {
        dateScore = 10;
      } else {
        dateScore = 0;
      }
    } else {
      dateScore = 5; // null date
    }

    // 5. Fraud Scoring (10 max)
    if (geminiData.fraudAnalysis.overallImageAuthenticity === "AUTHENTIC" && !geminiData.fraudAnalysis.suspectedFraud) {
      fraudScore = 10;
    } else {
      fraudScore = 0;
    }

    const total = amountScore + accountNumberScore + accountNameScore + dateScore + fraudScore;

    // Penalties
    if (duplicateImagePenalty) penalties += 50;
    if (geminiData.fraudAnalysis.confidenceScore < 30) {
      penalties += 20;
    } else if (geminiData.fraudAnalysis.confidenceScore < 50) {
      penalties += 10;
    }
    if (geminiData.fraudAnalysis.suspectedFraud) penalties += 30;
    if (geminiData.fraudAnalysis.fraudReasons.length > 2) penalties += 10;

    let finalScore = total - penalties;
    if (finalScore < 0) finalScore = 0;

    const breakdown: ScoreBreakdown = {
      amountScore,
      accountNumberScore,
      accountNameScore,
      dateScore,
      fraudScore,
      total,
      penalties,
      finalScore
    };

    return {
      breakdown,
      status: this.determineStatus(finalScore, geminiData)
    };
  }

  private static determineStatus(score: number, geminiData: GeminiResponse): VerificationStatus {
    if (geminiData.fraudAnalysis.overallImageAuthenticity === 'LIKELY_FAKE') return 'REJECTED';
    if (geminiData.fraudAnalysis.suspectedFraud && geminiData.fraudAnalysis.fraudReasons.length > 2) return 'REJECTED';
    if (score < 60) return 'REJECTED';
    
    if (
      score >= 90 &&
      geminiData.fraudAnalysis.confidenceScore >= 80 &&
      !geminiData.fraudAnalysis.suspectedFraud &&
      geminiData.fraudAnalysis.overallImageAuthenticity === 'AUTHENTIC'
    ) {
      return 'AUTO_VERIFIED';
    }
    
    return 'MANUAL_REVIEW';
  }

  private static computeJaroWinkler(s1: string, s2: string): number {
    let m = 0;
    if (s1.length === 0 || s2.length === 0) return 0;
    if (s1 === s2) return 1;

    const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length);
    const s2Matches = new Array(s2.length);

    for (let i = 0; i < s1.length; i++) {
      const low = Math.max(0, i - range);
      const high = Math.min(s2.length - 1, i + range);
      for (let j = low; j <= high; j++) {
        if (!s1Matches[i] && !s2Matches[j] && s1[i] === s2[j]) {
          s1Matches[i] = true;
          s2Matches[j] = true;
          m++;
          break;
        }
      }
    }

    if (m === 0) return 0;

    let t = 0;
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (s1Matches[i]) {
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) t++;
        k++;
      }
    }

    const jaro = (m / s1.length + m / s2.length + (m - t / 2) / m) / 3;
    return jaro;
  }
}
