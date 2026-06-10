"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  UploadCloud,
  File
} from "lucide-react";

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

export default function ClientPaymentPage() {
  const { invoiceId } = useParams() as { invoiceId: string };
  
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Receipt states
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    status: string;
    score: number;
    fraudFlags: string[];
    message: string;
    reason?: string;
  } | null>(null);

  // Load invoice data
  const loadInvoice = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
        
        // Quietly track viewed status if SENT
        if (data.status === "SENT") {
          fetch(`/api/invoices/${invoiceId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "VIEWED" })
          }).catch(err => console.warn("Failed to update status", err));
        }
      }
    } catch (e) {
      console.error("Failed to load invoice:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(field);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setReceiptError("Invalid file type. Only PNG, JPG, JPEG, and PDF files are accepted.");
      setReceiptFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setReceiptError("File is too large. Maximum size allowed is 5MB.");
      setReceiptFile(null);
      return;
    }
    setReceiptFile(file);
    setReceiptError(null);
    setVerificationResult(null);
  };

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    if (!receiptFile) {
      setReceiptError("Please upload your transfer receipt first.");
      return;
    }

    setIsConfirming(true);
    setReceiptError(null);
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append("file", receiptFile);
      formData.append("submittedRef", transactionRef);

      const res = await fetch(`/api/invoices/${invoice.id}/verify-receipt`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to connect to verification engine.");
      }

      const data = await res.json();
      setVerificationResult(data);

      if (data.success) {
        // Reload invoice status
        await loadInvoice();
      } else {
        setReceiptError(data.reason || data.message || "Verification failed. Please upload a clear receipt.");
      }
    } catch (err: any) {
      setReceiptError(err.message || "An error occurred during verification.");
    } finally {
      setIsConfirming(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Retrieving payment details...
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-950/30 border border-rose-800/30 flex items-center justify-center text-rose-500 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold">Invoice Not Found</h1>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          The requested payment link is invalid, expired, or was removed by the freelancer.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-200 font-sans flex flex-col py-12 px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-950/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-950/25 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl mx-auto space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-extrabold tracking-wider uppercase text-slate-400 font-mono">
              Kavio Secure Portal
            </span>
          </div>
          <span className="text-xs text-slate-500 font-semibold font-mono">
            {new Date(invoice.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Invoice details card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-black/50">
          
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Invoice Reference</span>
              <h2 className="text-xl font-mono font-bold text-white mt-1">{invoice.invoiceNumber}</h2>
            </div>
            
            {/* Status indicator */}
            <div>
              {invoice.status === "PAID" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Paid & Settled
                </span>
              ) : invoice.status === "VERIFIED" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Transfer Verified
                </span>
              ) : invoice.status === "UNDER_REVIEW" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Clock className="w-3.5 h-3.5 animate-pulse" /> Awaiting Clearance
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 border border-slate-500/20 text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> Awaiting Payment
                </span>
              )}
            </div>
          </div>

          {/* Pricing scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-slate-800/60 pb-6">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Payee (Freelancer)</span>
              <p className="font-bold text-white text-sm">{invoice.user.name}</p>
              <p className="text-slate-400 font-semibold">{invoice.user.email}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Billing Description</span>
              <p className="font-bold text-white text-sm">{invoice.projectDescription}</p>
              <p className="text-emerald-400 font-bold font-mono text-base mt-1">{formatCurrency(invoice.amount)}</p>
            </div>
          </div>

          {/* Bank details instruction */}
          {invoice.status !== "PAID" && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Bank Account Details</span>
              
              <div className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                
                {/* Bank Name */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Bank Name</span>
                  <span className="font-bold text-white font-mono">{invoice.bankName || "OPay"}</span>
                </div>

                {/* Account Name */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Account Name</span>
                  <span className="font-bold text-white font-mono">{invoice.accountName || invoice.user.name}</span>
                </div>

                {/* Account Number */}
                <div className="flex justify-between items-center text-xs border-t border-slate-800/40 pt-3">
                  <span className="text-slate-400 font-medium">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400 font-mono text-sm tracking-wider">
                      {invoice.accountNumber || "1234567890"}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(invoice.accountNumber || "1234567890", "acc")}
                      className="p-1 hover:bg-slate-800 rounded transition-all text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {isCopied === "acc" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Action areas based on status */}
          {invoice.status === "PAID" ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-2xl text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-sm">Payment Confirmed</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This invoice has been cleared and fully settled. No further actions are required.
              </p>
            </div>
          ) : invoice.status === "VERIFIED" ? (
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-6 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-blue-400 mx-auto" />
              <h3 className="font-bold text-sm">Transfer Auto-Verified ✅</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your receipt has been scanned and verified. We are awaiting the freelancer to crosscheck their bank app and approve.
              </p>
            </div>
          ) : invoice.status === "UNDER_REVIEW" ? (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-6 rounded-2xl text-center space-y-2">
              <Clock className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
              <h3 className="font-bold text-sm">Receipt Under Review ⏳</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We've logged your receipt details and flagged it for the freelancer's review. Automated reminders have been paused.
              </p>
            </div>
          ) : (
            <form onSubmit={handleVerifyPayment} className="space-y-4 pt-4 border-t border-slate-800/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Provide Proof of Bank Transfer
              </span>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-950/10"
                    : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
                }`}
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <UploadCloud className="w-5 h-5" />
                  </div>

                  {receiptFile ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-200">{receiptFile.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {(receiptFile.size / 1024).toFixed(0)} KB · Drag/Click to change
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-300">Drag & drop your transfer receipt</p>
                      <p className="text-[10px] text-slate-500">
                        Accepts PNG, JPG, JPEG, or PDF (Max 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Ref input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                  Optional transaction Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Session ID or Reference Code"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/40 focus:outline-none focus:border-emerald-500 text-xs font-semibold text-slate-200"
                />
              </div>

              {receiptError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-[11px] text-rose-400 flex items-start gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>{receiptError}</div>
                </div>
              )}

              {/* Verification processing display */}
              {verificationResult && (
                <div className={`border rounded-2xl p-4 text-xs space-y-1.5 ${
                  verificationResult.status === "AUTO_VERIFIED"
                    ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-400"
                    : "bg-amber-950/20 border-amber-800/40 text-amber-400"
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {verificationResult.status === "AUTO_VERIFIED" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400" />
                    )}
                    {verificationResult.message}
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {verificationResult.reason}
                  </p>
                </div>
              )}

              {/* Action trigger button */}
              <button
                type="submit"
                disabled={isConfirming || !receiptFile}
                style={{
                  height: "46px",
                  width: "100%",
                  borderRadius: "14px",
                  backgroundColor: isConfirming || !receiptFile ? "#1e293b" : "#10b981",
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: "13px",
                  border: "none",
                  cursor: isConfirming || !receiptFile ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: isConfirming || !receiptFile ? "none" : "0 4px 14px rgba(16,185,129,0.25)",
                  transition: "all 0.15s ease-in-out",
                }}
                className="hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Receipt with Gemini OCR...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Bank Transfer
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Portal footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-600 px-4">
          <span className="font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            256-bit encrypted transfer verification node
          </span>
          <span className="font-bold uppercase tracking-wider">Powered by Kavio</span>
        </div>

      </div>
    </div>
  );
}
