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
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import OpayButton from "@/components/OpayButton";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "OVERDUE" | "PAID" | "VERIFIED" | "UNDER_REVIEW" | "BLOCKED";
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
export default function PublicInvoicePage() {
  const { id } = useParams() as { id: string };
  
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmedSuccessfully, setIsConfirmedSuccessfully] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceRef = React.useRef<HTMLDivElement>(null);

  // Receipt states
// ...
  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoice?.invoiceNumber || "Kavio"}.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF", e);
    } finally {
      setIsDownloading(false);
    }
  };

  // Determine if check-out actions are completed/frozen
  const isSubmissionCompleted = ["PAID", "VERIFIED", "UNDER_REVIEW", "BLOCKED"].includes(invoice.status);

  return (
    <div data-page="public-invoice" className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col py-8 sm:py-16 px-4 relative overflow-hidden transition-colors duration-300">
      
      {/* Decorative meshes */}
      <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-emerald-100/10 to-teal-200/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-indigo-100/10 to-blue-200/10 blur-[110px] pointer-events-none" />

      {/* Main Card Shell */}
      <div className="w-full max-w-xl mx-auto space-y-6 relative z-10">
        
        {/* Floating Top Brand Logo */}
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-extrabold tracking-widest uppercase text-slate-500 font-mono">Kavio Collections</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={downloadPDF}
              disabled={isDownloading}
              className="text-[10px] text-slate-500 font-bold hover:text-emerald-600 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              PDF
            </button>
            <span className="text-[10px] text-slate-500 font-bold">{new Date(invoice.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Invoice Container */}
        <div 
          ref={invoiceRef}
          className="rounded-3xl p-6 sm:p-10 space-y-6 bg-white border border-slate-100 shadow-xl shadow-slate-200/40 transition-all duration-300"
        >
          {/* Top Status and ID */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Invoice Reference</span>
              <h2 className="text-lg font-mono font-bold text-slate-900 mt-1">{invoice.invoiceNumber}</h2>
            </div>
            {getStatusBadge(invoice.status)}
          </div>

          {/* Billing Overview */}
          <div className="grid grid-cols-2 gap-6 text-xs leading-normal">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Freelancer</span>
              <p className="font-extrabold text-slate-900 text-sm">{invoice.user.name}</p>
              <p className="text-slate-600 font-semibold mt-0.5">{invoice.user.email}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Prepared For</span>
              <p className="font-extrabold text-slate-900 text-sm">{invoice.client.name}</p>
              <p className="text-slate-600 font-semibold mt-0.5">{invoice.client.companyName || invoice.client.email}</p>
            </div>
          </div>

          {/* Project description items */}
          <div className="pt-6 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2.5">Project Scope</span>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between transition-colors duration-300">
              <p className="font-bold text-slate-800 text-xs truncate max-w-[320px]">{invoice.projectDescription}</p>
              <p className="font-mono font-bold text-slate-900 text-xs pl-4">{formatCurrency(invoice.amount)}</p>
            </div>
          </div>

          {/* Bank transfer payment instructions box */}
          {!isSubmissionCompleted && (
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Payment instructions</span>
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 space-y-3 transition-colors duration-300">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Direct Bank Transfer</span>
                <p className="text-xs text-slate-800 font-mono font-bold leading-relaxed whitespace-pre-line">
                  {invoice.paymentInstructions || "Please contact the freelancer directly for payment rails."}
                </p>
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
            </div>
          )}

          {/* Action triggers */}
          {invoice.status === "PAID" ? (
            <div className="pt-8 border-t border-slate-100 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-4.5 rounded-2xl text-xs font-bold text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 mb-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span>Thank you! This invoice has been marked as fully PAID.</span>
              </div>
            </div>
          ) : invoice.status === "VERIFIED" ? (
            <div className="pt-8 border-t border-slate-100 mt-4">
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-2.5">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-1">
                  <CheckCircle2 className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Payment Verified ✅</h3>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  Your payment information has been automatically verified and sent to the business owner for confirmation.
                </p>
                <div className="text-[9px] bg-emerald-500/15 text-emerald-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider mt-1">
                  Status: Verified — Awaiting Approval
                </div>
              </div>
            </div>
          ) : invoice.status === "UNDER_REVIEW" ? (
            <div className="pt-8 border-t border-slate-100 mt-4">
              <div className="bg-amber-50 border border-amber-100 text-amber-700 p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-2.5">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-1">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Payment Submitted ⏳</h3>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  We are manually reviewing your payment information.
                </p>
                <div className="text-[9px] bg-amber-500/15 text-amber-800 px-3 py-1 rounded-full font-bold uppercase tracking-wider mt-1">
                  Status: Needs Review
                </div>
              </div>
            </div>
          ) : invoice.status === "BLOCKED" ? (
            <div className="pt-8 border-t border-slate-100 mt-4">
              <div className="bg-red-50 border border-red-100 text-red-700 p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-2.5">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 mb-1">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Invoice Blocked</h3>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  This invoice has been blocked from further verification attempts. Please contact the freelancer directly.
                </p>
              </div>
            </div>
          ) : !showPaymentForm ? (
            <div className="pt-8 border-t border-slate-100 mt-4">
              <Button
                onClick={() => setShowPaymentForm(true)}
                className="w-full py-6 font-extrabold text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all border-none flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                I Have Paid
              </Button>
            </div>
          ) : (
            <div className="pt-8 border-t border-slate-100 mt-4 space-y-5">
              
              {/* Upload Receipt Panel */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Upload Payment Receipt</span>
                <div className="border border-dashed border-slate-200 hover:border-emerald-500/40 rounded-2xl p-5 bg-slate-50/50 hover:bg-slate-100 transition-all relative flex flex-col items-center justify-center text-center cursor-pointer group">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
                        if (!validTypes.includes(file.type)) {
                          setReceiptError("Only receipt images (PNG, JPG, WEBP) or PDF documents are accepted.");
                          setReceiptFile(null);
                          return;
                        }
                        setReceiptFile(file);
                        setReceiptError(null);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                  />
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 flex items-center justify-center transition-all mb-2 border border-slate-200/20">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  {receiptFile ? (
                    <div className="space-y-1 z-30 pointer-events-none">
                      <p className="text-xs font-bold text-slate-800">{receiptFile.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold font-mono">{(receiptFile.size / 1024).toFixed(0)} KB · Change receipt</p>
                    </div>
                  ) : (
                    <div className="space-y-1 z-30 pointer-events-none">
                      <p className="text-xs font-bold text-slate-700">Select receipt image or PDF</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Gemini AI will automatically scan and verify your payment</p>
                    </div>
                  )}
                </div>
                {receiptError && (
                  <div className="flex flex-col gap-1.5 text-rose-600 bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-sm text-left leading-relaxed">
                    <div className="flex items-center gap-1.5 text-xs font-black">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                      Verification Failed ❌
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold pl-5">
                      {receiptError}
                    </p>
                  </div>
                )}
              </div>

              {isConfirmedSuccessfully ? (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                  Transfer notification sent to freelancer!
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => setShowPaymentForm(false)}
                    variant="outline"
                    className="py-6 font-extrabold text-xs text-slate-500 border-slate-200 rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-1/3"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleClientPaidConfirmation}
                    disabled={isConfirming}
                    className="py-6 font-extrabold text-xs bg-slate-950 text-white rounded-2xl hover:bg-slate-850 transition-all border-none flex items-center justify-center gap-2 shadow-lg cursor-pointer w-full sm:w-2/3"
                  >
                    {isConfirming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Verify Payment
                  </Button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Security / Badge footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-3">
          <span className="font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            AI-Powered Fraud Detection
          </span>
          <span className="font-bold uppercase tracking-wider">Powered by Kavio</span>
        </div>

      </div>

    </div>
  );
}

// Simple Badge fallback component inside local file
function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center text-[10px] ${className}`}>
      {children}
    </span>
  );
}
