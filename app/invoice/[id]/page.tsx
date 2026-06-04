"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  CreditCard,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Zap,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "OVERDUE" | "PAID";
  projectDescription: string;
  paymentInstructions?: string;
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

  // Load invoice data
  const loadInvoice = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/invoices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
        
        // Auto-trigger VIEWED status updates in background if currently SENT
        if (data.status === "SENT") {
          fetch(`/api/invoices/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "VIEWED" })
          }).then(() => {
            // Quietly update local representation
            setInvoice(prev => prev ? { ...prev, status: "VIEWED" } : null);
          }).catch(err => console.warn("Failed to update status to Viewed", err));
        }
      }
    } catch (e) {
      console.error("Failed to load invoice:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const handleClientPaidConfirmation = async () => {
    if (!invoice) return;

    setIsConfirming(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: "Confirmed by client from public invoice page"
        })
      });

      if (res.ok) {
        setIsConfirmedSuccessfully(true);
        // Refresh local display status to PAID
        setInvoice(prev => prev ? { ...prev, status: "PAID" } : null);
      } else {
        alert("Failed to register check-in. Please try again.");
      }
    } catch (e) {
      alert("Failed to connect to collections rails.");
    } finally {
      setIsConfirming(false);
    }
  };

  const getStatusBadge = (status: InvoiceData["status"]) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <CheckCircle className="w-4 h-4" />
            Paid & Cleared
          </Badge>
        );
      case "SENT":
      case "VIEWED":
        return (
          <Badge className="bg-blue-500/10 border border-blue-500/20 text-blue-600 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Clock className="w-4 h-4" />
            Awaiting Transfer
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge className="bg-rose-500/10 border border-rose-500/20 text-rose-600 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <AlertTriangle className="w-4 h-4" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/10 border border-slate-500/20 text-slate-600 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <FileText className="w-4 h-4" />
            Drafting
          </Badge>
        );
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
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Retrieving payment instructions...
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-base font-bold text-slate-800">Invoice not found</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">The link you requested is invalid or the document was deleted by the freelancer.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfe] font-sans flex flex-col py-8 sm:py-16 px-4 relative overflow-hidden">
      
      {/* Decorative meshes */}
      <div className="absolute -top-40 -right-40 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-emerald-100/20 to-teal-200/20 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-indigo-100/10 to-blue-200/10 blur-[110px] pointer-events-none" />

      {/* Main Card Shell */}
      <div className="w-full max-w-xl mx-auto space-y-6 relative z-10">
        
        {/* Floating Top Brand Logo */}
        <div className="flex items-center justify-between px-3">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-extrabold tracking-widest uppercase text-slate-400 font-mono">Kavio Collections</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">{new Date(invoice.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Invoice Container */}
        <div 
          style={{
            border: "1px solid rgba(0, 0, 0, 0.04)",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.01), 0 20px 40px -5px rgba(16, 185, 129, 0.04)",
            background: "#ffffff"
          }}
          className="rounded-3xl p-6 sm:p-10 space-y-6"
        >
          {/* Top Status and ID */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Invoice Reference</span>
              <h2 className="text-lg font-mono font-bold text-slate-700 mt-1">{invoice.invoiceNumber}</h2>
            </div>
            {getStatusBadge(invoice.status)}
          </div>

          {/* Billing Overview */}
          <div className="grid grid-cols-2 gap-6 text-xs leading-normal">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Freelancer</span>
              <p className="font-extrabold text-slate-900 text-sm">{invoice.user.name}</p>
              <p className="text-slate-450 font-semibold mt-0.5">{invoice.user.email}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Prepared For</span>
              <p className="font-extrabold text-slate-800 text-sm">{invoice.client.name}</p>
              <p className="text-slate-450 font-semibold mt-0.5">{invoice.client.companyName || invoice.client.email}</p>
            </div>
          </div>

          {/* Project description items */}
          <div className="pt-6 border-t border-slate-100/60">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">Project Scope</span>
            <div className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4 flex items-center justify-between">
              <p className="font-bold text-slate-750 text-xs truncate max-w-[320px]">{invoice.projectDescription}</p>
              <p className="font-mono font-bold text-slate-900 text-xs pl-4">{formatCurrency(invoice.amount)}</p>
            </div>
          </div>

          {/* Bank transfer payment instructions box */}
          {invoice.status !== "PAID" && (
            <div className="pt-6 border-t border-slate-100/60 space-y-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Payment instructions</span>
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 space-y-3">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Direct Bank Transfer</span>
                <p className="text-xs text-slate-700 font-mono font-bold leading-relaxed whitespace-pre-line">
                  {invoice.paymentInstructions || "Please contact the freelancer directly for payment rails."}
                </p>
              </div>
            </div>
          )}

          {/* Action triggers */}
          {invoice.status !== "PAID" ? (
            <div className="pt-8 border-t border-slate-150 mt-4 space-y-4">
              {isConfirmedSuccessfully ? (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                  Transfer notification sent to freelancer!
                </div>
              ) : (
                <Button
                  onClick={handleClientPaidConfirmation}
                  disabled={isConfirming}
                  className="w-full py-6 font-bold text-xs bg-slate-950 text-white rounded-2xl hover:bg-slate-800 transition-all border-none flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  {isConfirming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  I Have Completed This Transfer
                </Button>
              )}
            </div>
          ) : (
            <div className="pt-8 border-t border-slate-150 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-4.5 rounded-2xl text-xs font-bold text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 mb-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span>Thank you! This invoice has been marked as fully PAID.</span>
              </div>
            </div>
          )}

        </div>

        {/* Security / Badge footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-3">
          <span className="font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            End-to-End Encrypted Invoice Node
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
