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
  UploadCloud,
  File
} from "lucide-react";
import OpayButton from "@/components/OpayButton";
import CopyButton from "@/components/CopyButton";

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
        throw new Error("Upload failed, please try again");
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
      setReceiptError("Upload failed, please try again");
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
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Retrieving payment details...
          </p>
        </div>
      </div>
    );
  }

  // Edge Case 8d: Invoice not found or invalid
  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-4 shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">This invoice link is invalid or has expired</h1>
        <p className="text-xs text-slate-500 mt-2 max-w-sm font-semibold">
          The requested payment link is invalid, expired, or was removed by the freelancer.
        </p>
      </div>
    );
  }

  const isPaid = invoice.status === "PAID";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col py-12 px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl mx-auto space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/10">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-extrabold tracking-wider uppercase text-slate-500 font-mono">
              Kavio Secure Portal
            </span>
          </div>
          <span className="text-xs text-slate-500 font-semibold font-mono">
            {new Date(invoice.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Invoice details card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Invoice Reference</span>
              <h2 className="text-xl font-mono font-bold text-slate-900 mt-1">{invoice.invoiceNumber}</h2>
            </div>
            
            {/* Status indicator */}
            <div>
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-250 text-emerald-800">
                  <CheckCircle className="w-3.5 h-3.5" /> Paid & Settled
                </span>
              ) : invoice.status === "VERIFIED" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-250 text-blue-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Transfer Verified
                </span>
              ) : invoice.status === "UNDER_REVIEW" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-250 text-amber-800">
                  <Clock className="w-3.5 h-3.5 animate-pulse" /> Awaiting Clearance
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700">
                  <Clock className="w-3.5 h-3.5" /> Awaiting Payment
                </span>
              )}
            </div>
          </div>

          {/* Pricing scope / Invoice Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs border-b border-slate-200/80 pb-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Payee (Freelancer)</span>
              <p className="font-bold text-slate-900 text-sm">{invoice.user.name}</p>
              <p className="text-slate-500 font-semibold">{invoice.user.email}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Billing Description</span>
              <p className="font-bold text-slate-900 text-sm">{invoice.projectDescription}</p>
              <p id="invoice-amount-text" className="text-emerald-700 font-bold font-mono text-base mt-1">
                {formatCurrency(invoice.amount)}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Due Date</span>
              <p className="font-bold text-slate-900 text-sm">
                {new Date(invoice.dueDate).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-slate-550 font-semibold mt-1">
                {new Date(invoice.dueDate) < new Date() && invoice.status !== "PAID" ? (
                  <span className="text-rose-500 font-bold">Overdue</span>
                ) : (
                  <span>Standard Term</span>
                )}
              </p>
            </div>
          </div>

          {/* Payment Section (Edge Case 8c: Hide payment section if Paid) */}
          {isPaid ? (
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-6 rounded-2xl text-center space-y-2 shadow-sm">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-black text-sm">This invoice has already been paid ✅</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                This invoice has been cleared and fully settled. No further actions are required.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* PRIMARY CALL TO ACTION: OPay Button & Guidance text */}
              <div className="pt-2">
                <OpayButton
                  invoiceAmount={invoice.amount}
                  freelancerAccount={invoice.accountNumber}
                  freelancerBank={invoice.bankName}
                  freelancerName={invoice.user.name}
                />
                <p className="text-[11px] italic text-slate-500 text-center mt-3 font-semibold leading-relaxed">
                  Once you've paid, upload your OPay receipt below to confirm payment and stop all reminders instantly ⬇️
                </p>
              </div>

              {/* Secondary Option Divider */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <span className="relative bg-white px-3 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                  Or pay manually via bank transfer
                </span>
              </div>

              {/* Manual bank details */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Bank Account Details</span>
                
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  
                  {/* Bank Name */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Bank Name</span>
                    <span className="font-bold text-slate-900 font-mono">{invoice.bankName || "OPay"}</span>
                  </div>

                  {/* Account Name */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Account Name</span>
                    <span className="font-bold text-slate-900 font-mono">{invoice.accountName || invoice.user.name}</span>
                  </div>

                  {/* Account Number */}
                  <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-3">
                    <span className="text-slate-500 font-semibold">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span id="manual-account-number" className="font-bold text-slate-950 font-mono text-sm tracking-wider">
                        {invoice.accountNumber || "1234567890"}
                      </span>
                      <CopyButton text={invoice.accountNumber || "1234567890"} highlightTargetId="manual-account-number" />
                    </div>
                  </div>

                  {/* Amount to transfer (with copy button) */}
                  <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-3">
                    <span className="text-slate-500 font-semibold">Amount to Pay</span>
                    <div className="flex items-center gap-2">
                      <span id="manual-amount" className="font-bold text-emerald-700 font-mono text-sm">
                        {formatCurrency(invoice.amount)}
                      </span>
                      <CopyButton text={invoice.amount.toString()} highlightTargetId="manual-amount" />
                    </div>
                  </div>

                </div>
              </div>

              {/* Receipt Upload Section */}
              <form onSubmit={handleVerifyPayment} className="space-y-4 pt-4 border-t border-slate-200/80">
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
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                      <UploadCloud className="w-5 h-5" />
                    </div>

                    {receiptFile ? (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">{receiptFile.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">
                          {(receiptFile.size / 1024).toFixed(0)} KB · Drag/Click to change
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700">Drag & drop your transfer receipt</p>
                        <p className="text-[10px] text-slate-500 font-semibold">
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 text-xs font-semibold text-slate-800 shadow-sm"
                  />
                </div>

                {/* Error handling displaying receipt error message (Edge Case 8h) */}
                {receiptError && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-800 flex items-start gap-2 font-semibold shadow-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <div>{receiptError}</div>
                  </div>
                )}

                {/* Verification processing display */}
                {verificationResult && (
                  <div className={`border rounded-2xl p-4 text-xs space-y-1.5 shadow-sm ${
                    verificationResult.status === "AUTO_VERIFIED"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}>
                    <div className="font-black flex items-center gap-1.5">
                      {verificationResult.status === "AUTO_VERIFIED" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}
                      {verificationResult.message}
                    </div>
                    <p className="text-slate-550 text-[11px] leading-relaxed font-semibold">
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
                    backgroundColor: isConfirming || !receiptFile ? "#e2e8f0" : "#10b981",
                    color: isConfirming || !receiptFile ? "#94a3b8" : "#ffffff",
                    fontWeight: "700",
                    fontSize: "13px",
                    border: "none",
                    cursor: isConfirming || !receiptFile ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: isConfirming || !receiptFile ? "none" : "0 4px 14px rgba(16,185,129,0.20)",
                    transition: "all 0.15s ease-in-out",
                  }}
                  className="hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
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

            </div>
          )}

        </div>

        {/* Portal footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-4">
          <span className="font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            256-bit encrypted transfer verification node
          </span>
          <span className="font-bold uppercase tracking-wider">Powered by Kavio</span>
        </div>

      </div>
    </div>
  );
}
