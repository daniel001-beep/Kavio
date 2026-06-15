"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Zap,
  Lock,
  AlertCircle,
  CheckCircle2,
  BadgeAlert
} from "lucide-react";
import OpayButton from "@/components/OpayButton";
import CopyButton from "@/components/CopyButton";
import ReceiptUpload from "@/components/ReceiptUpload";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "OVERDUE" | "PAID" | "VERIFIED" | "UNDER_REVIEW";
  projectDescription: string;
  paymentInstructions?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  expiresAt?: string;
  verificationStatus?: "unverified" | "confirmed" | "partial" | "failed" | "suspicious";
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    companyName?: string;
  };
  user: {
    name: string;
    email: string;
  };
}

interface VerificationOutcome {
  success: boolean;
  status: "CONFIRMED" | "PARTIAL" | "FAILED" | "SUSPICIOUS";
  score: number;
  failureReasons: string[];
  attemptsRemaining: number;
  uploadId: string;
}

export default function ClientPaymentPage() {
  const { invoiceId } = useParams() as { invoiceId: string };

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Receipt Upload & Verification States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<VerificationOutcome | null>(null);

  // Security elements
  const [fingerprint, setFingerprint] = useState("");

  // Load client session fingerprint
  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        const ua = navigator.userAgent;
        const screenRes = `${window.screen.width}x${window.screen.height}`;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const lang = navigator.language;
        const fpString = [ua, screenRes, tz, lang].join("|");

        const msgBuffer = new TextEncoder().encode(fpString);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        setFingerprint(hashHex);
      } catch (e) {
        // Fallback simple fingerprint
        setFingerprint(btoa(navigator.userAgent).substring(0, 32));
      }
    };
    generateFingerprint();
  }, []);

  // Load invoice data and CSRF token
  const loadInvoiceData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data.invoice);
        setCsrfToken(data.csrfToken);

        // Track viewed status if SENT
        if (data.invoice.status === "SENT") {
          fetch(`/api/invoices/${invoiceId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "VIEWED" })
          }).catch(err => console.warn("Failed to update status", err));
        }
      } else {
        setInvoice(null);
      }
    } catch (e) {
      console.error("Failed to load invoice:", e);
      setInvoice(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceData();
    }
  }, [invoiceId]);

  // Cryptographic Request Signing helper
  const signRequest = async (timestamp: string, fingerprint: string, token: string): Promise<string> => {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(token);
    const messageData = encoder.encode(`${timestamp}:${fingerprint}`);

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, messageData);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  };

  // Submit file for AI Verification
  const handleVerify = async () => {
    if (!invoice || !selectedFile || !csrfToken) return;

    setIsVerifying(true);
    setErrorMsg(null);
    setOutcome(null);

    try {
      const timestamp = Date.now().toString();
      // Generate HMAC signature using CSRF token as key
      const signature = await signRequest(timestamp, fingerprint, csrfToken);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("invoiceId", invoice.id);
      formData.append("csrfToken", csrfToken);
      formData.append("timestamp", timestamp);
      formData.append("fingerprint", fingerprint);
      formData.append("signature", signature);
      formData.append("website", ""); // Honeypot field (must stay empty)
      formData.append("lastModified", selectedFile.lastModified.toString());

      const res = await fetch("/api/verify-receipt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process receipt verification");
      }

      setOutcome(data);

      if (data.status === "CONFIRMED") {
        // Reload page data to reflect PAID status after brief delay
        setTimeout(() => {
          loadInvoiceData();
        }, 1500);
      }
    } catch (e: any) {
      console.error("Verification submit failed:", e);
      setErrorMsg(e.message || "Something went wrong during verification. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Get due date text color
  const getDueDateColor = (dueDateStr: string, isPaid: boolean) => {
    if (isPaid) return "text-emerald-600";
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    dueDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    if (dueDate.getTime() > today.getTime()) {
      return "text-emerald-600"; // not due yet
    } else if (dueDate.getTime() === today.getTime()) {
      return "text-amber-600"; // due today
    } else {
      return "text-rose-500 font-bold"; // overdue
    }
  };

  // Check link expiry: 30 days after due date
  const isInvoiceExpired = (invoiceData: InvoiceData) => {
    if (invoiceData.status === "PAID") return false;
    
    if (invoiceData.expiresAt) {
      return new Date(invoiceData.expiresAt).getTime() < Date.now();
    }
    const expiryTime = new Date(invoiceData.dueDate).getTime() + 30 * 24 * 60 * 60 * 1000;
    return expiryTime < Date.now();
  };

  // State 1: Skeleton Loading UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
            Retrieving payment details...
          </p>
        </div>
      </div>
    );
  }

  // State 2: Invoice not found or invalid
  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-4 shadow-sm animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">This invoice link is invalid or has expired</h1>
        <p className="text-xs text-slate-550 mt-2 max-w-sm font-semibold leading-relaxed">
          The requested payment link is invalid, expired, or was removed by the freelancer. Please request a new link.
        </p>
      </div>
    );
  }

  const isPaid = invoice.status === "PAID" || invoice.verificationStatus === "confirmed";

  // State 3: Already Paid success view
  if (isPaid) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-6 shadow-md shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Verified Successfully!</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md font-semibold leading-relaxed">
          This invoice has already been paid ✅ No further action needed. 
          The freelancer has been notified of the clearance.
        </p>
        <div className="mt-8 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm max-w-sm w-full">
          <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-100">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Invoice Reference</span>
            <span className="font-mono font-bold text-slate-800">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-3">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Amount Paid</span>
            <span className="font-bold text-emerald-600 font-mono text-sm">{formatCurrency(invoice.amount)}</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-12">Powered by Kavio</p>
      </div>
    );
  }

  // State 4: Expired payment view
  if (isInvoiceExpired(invoice)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4 shadow-sm">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">This invoice has expired</h1>
        <p className="text-xs text-slate-500 mt-2 max-w-sm font-semibold leading-relaxed">
          This payment portal link is expired. Please contact <span className="font-bold text-slate-800">{invoice.user.name}</span> for a new invoice link.
        </p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-12">Powered by Kavio</p>
      </div>
    );
  }

  // State 5: Active invoice payment view
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col py-12 px-4 relative overflow-hidden">
      {/* Visual background glows */}
      <div className="absolute top-[-15%] right-[-10%] w-[450px] h-[450px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/15">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-slate-500 font-mono">
              Kavio Checkout
            </span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 shadow-sm font-mono">
            <Lock className="w-3 h-3 text-emerald-500" />
            Secure Payment
          </div>
        </div>

        {/* Invoice details summary card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          
          <div className="space-y-4">
            {/* Freelancer profile */}
            <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Payee (Freelancer)</p>
                <h3 className="text-lg font-black text-slate-900 mt-1">{invoice.user.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{invoice.user.email}</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                {invoice.invoiceNumber}
              </span>
            </div>

            {/* Description & Large Amount */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Billing description</span>
              <p className="text-sm font-bold text-slate-800">{invoice.projectDescription}</p>
              <h2 className="text-3xl font-black text-emerald-600 tracking-tight pt-1">
                {formatCurrency(invoice.amount)}
              </h2>
            </div>

            {/* Due date row */}
            <div className="flex justify-between items-center text-xs pt-4 border-t border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Due Date</span>
                <p className={`font-bold ${getDueDateColor(invoice.dueDate, isPaid)}`}>
                  {new Date(invoice.dueDate).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold bg-emerald-50/50 border border-emerald-100 text-emerald-800">
                Verified Kavio Freelancer
              </span>
            </div>
          </div>

          {/* Security badge row */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-slate-500 font-bold text-center">
            <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 flex flex-col items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>256-bit encrypted</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 flex flex-col items-center justify-center gap-1">
              <Zap className="w-3.5 h-3.5 text-slate-400" />
              <span>AI-verified payments</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl py-2 flex flex-col items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Kavio protected</span>
            </div>
          </div>

          {/* OPay checkout option */}
          <div className="pt-2">
            <OpayButton
              invoiceAmount={invoice.amount}
              freelancerAccount={invoice.accountNumber || "0123456789"}
              freelancerBank={invoice.bankName || "OPay"}
              freelancerName={invoice.user.name}
            />
          </div>

          {/* Transfer separator */}
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative bg-white px-4 text-[9px] font-bold uppercase tracking-widest text-slate-400 font-mono">
              Or pay via bank transfer
            </span>
          </div>

          {/* Bank Transfer Details */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Account details</h5>
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Bank Name</span>
                <span className="font-bold text-slate-800 font-mono">{invoice.bankName || "Access Bank"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Account Name</span>
                <span className="font-bold text-slate-800 font-mono">{invoice.accountName || invoice.user.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2.5">
                <span className="text-slate-500 font-medium">Account Number</span>
                <div className="flex items-center gap-2">
                  <span id="bank-acc-num" className="font-mono text-sm font-black text-slate-950 tracking-wider">
                    {invoice.accountNumber || "0123456789"}
                  </span>
                  <CopyButton text={invoice.accountNumber || "0123456789"} highlightTargetId="bank-acc-num" />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2.5">
                <span className="text-slate-500 font-medium">Exact Amount to Pay</span>
                <div className="flex items-center gap-2">
                  <span id="bank-amt" className="font-mono text-sm font-black text-emerald-600">
                    {formatCurrency(invoice.amount)}
                  </span>
                  <CopyButton text={invoice.amount.toString()} highlightTargetId="bank-amt" />
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Uploader */}
          <div className="pt-2 border-t border-slate-100">
            <ReceiptUpload
              onFileSelect={setSelectedFile}
              onVerify={handleVerify}
              isVerifying={isVerifying}
              selectedFile={selectedFile}
            />
          </div>

          {/* Local errors display */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 flex items-start gap-2 font-semibold shadow-sm animate-shake">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-500" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Verification Results Cards */}
          {outcome && (
            <div className="space-y-4 pt-2">
              {outcome.status === "CONFIRMED" && (
                <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-950 p-5 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span>Payment Verified Successfully</span>
                  </div>
                  <div className="text-xs font-semibold space-y-1 text-slate-700">
                    <p>&bull; Amount: <span className="font-bold text-slate-900">{formatCurrency(invoice.amount)} confirmed</span></p>
                    <p>&bull; Account: <span className="font-bold text-slate-900">matched</span></p>
                    <p>&bull; AI Confidence: <span className="font-bold text-slate-900">High</span></p>
                  </div>
                  <p className="text-xs font-bold text-emerald-800 leading-relaxed pt-1.5 border-t border-emerald-100">
                    Thank you! The freelancer has been notified.
                  </p>
                </div>
              )}

              {outcome.status === "PARTIAL" && (
                <div className="bg-amber-50/80 border border-amber-200 text-amber-950 p-5 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-600 font-black text-sm">
                    <Clock className="w-5 h-5 shrink-0" />
                    <span>Receipt Under Review</span>
                  </div>
                  <div className="text-xs font-semibold leading-relaxed text-slate-700">
                    Some details need manual confirmation. The freelancer has been notified to review your receipt.
                  </div>
                  <div className="text-[10px] font-mono font-bold text-slate-500 pt-1.5 border-t border-amber-200/50">
                    Reference ID: <span className="text-slate-800">{outcome.uploadId}</span>
                  </div>
                </div>
              )}

              {outcome.status === "FAILED" && (
                <div className="bg-rose-50/80 border border-rose-200 text-rose-950 p-5 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>Verification Failed</span>
                  </div>
                  <div className="text-xs font-semibold leading-relaxed text-slate-700">
                    {outcome.failureReasons[0] || "The details on the receipt do not match this invoice."}
                  </div>
                  <div className="text-xs font-bold text-rose-800 leading-relaxed pt-1">
                    Please check you uploaded the correct receipt.
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 pt-1.5 border-t border-rose-200/50">
                    Attempts remaining: <span className="font-black text-rose-600">{outcome.attemptsRemaining}</span>
                  </div>
                </div>
              )}

              {outcome.status === "SUSPICIOUS" && (
                <div className="bg-rose-50/80 border border-rose-200 text-rose-950 p-5 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
                    <BadgeAlert className="w-5 h-5 shrink-0 animate-pulse" />
                    <span>Verification Issue Detected</span>
                  </div>
                  <div className="text-xs font-semibold leading-relaxed text-slate-700">
                    This receipt could not be processed. Please contact <span className="font-bold text-slate-900">{invoice.user.name}</span> directly.
                  </div>
                  <div className="text-[10px] font-mono font-bold text-slate-500 pt-1.5 border-t border-rose-200/50">
                    Reference: <span className="text-slate-800">{outcome.uploadId}</span> &mdash; quote this when contacting them
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Portal Footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-3 font-semibold font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
            256-bit encrypted checkout portal
          </span>
          <span className="font-bold uppercase tracking-wider">Powered by Kavio</span>
        </div>

      </div>
    </div>
  );
}
