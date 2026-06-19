"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  FileText, 
  Copy, 
  Trash2, 
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Loader2,
  ArrowLeftRight,
  DollarSign,
  Calendar,
  User,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNotifications } from "@/app/context/NotificationContext";
import { useSession } from "@/app/context/AuthContext";
import WhatsAppNudgeModal, { WhatsAppNudgePayload } from "@/app/components/WhatsAppNudgeModal";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "OVERDUE" | "PAID";
  projectDescription: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export default function InvoicesPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "SENT" | "VIEWED" | "OVERDUE">("ALL");
  const [search, setSearch] = useState("");
  const { addNotification } = useNotifications();

  // WhatsApp nudge modal state
  const [nudgePayload, setNudgePayload] = useState<WhatsAppNudgePayload | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<"INVOICES" | "PAYMENTS">("INVOICES");
  const [paymentSearch, setPaymentSearch] = useState("");

  // Sync tab from URL query on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "payments") {
        setActiveSubTab("PAYMENTS");
      }
    }
  }, []);

  // Compute payments list in-memory from paid invoices
  const paymentsList = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === "PAID")
      .map((inv) => ({
        id: inv.id,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.client?.name || "Freelance Client",
        amount: inv.amount,
        datePaid: inv.createdAt, // fallback to createdAt if no payment log exists
        reference: inv.metadata?.paymentReference || "Manual Bank Transfer",
        notes: inv.paymentInstructions || "Collections payment settled."
      }));
  }, [invoices]);

  const filteredPayments = useMemo(() => {
    return paymentsList.filter(p => {
      return p.clientName.toLowerCase().includes(paymentSearch.toLowerCase()) || 
             p.invoiceNumber.toLowerCase().includes(paymentSearch.toLowerCase()) ||
             (p.reference || "").toLowerCase().includes(paymentSearch.toLowerCase());
    });
  }, [paymentsList, paymentSearch]);

  // Load invoices
  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices?_t=" + Date.now(), {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setInvoices(list);
        if (userEmail) {
          localStorage.setItem(`kavio_cached_invoices_${userEmail}`, JSON.stringify(list));
        }
      }
    } catch (e) {
      console.error("Failed to load invoices:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync cache on mount
  useEffect(() => {
    if (userEmail) {
      const cached = localStorage.getItem(`kavio_cached_invoices_${userEmail}`);
      if (cached) {
        try {
          setInvoices(JSON.parse(cached));
          setIsLoading(false);
        } catch (e) {
          console.warn("Failed to parse cached invoices in registry", e);
        }
      }
      fetchInvoices();
    } else {
      fetchInvoices();
    }
  }, [userEmail]);

  // Delete invoice
  const deleteInvoice = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice? This will remove all reminder history.")) {
      try {
        const res = await fetch(`/api/invoices/${id}`, {
          method: "DELETE"
        });

        if (res.ok) {
          addNotification({
            type: "SUCCESS",
            title: "Invoice Deleted",
            message: "Invoice was successfully removed from registry.",
          });
          fetchInvoices();
        } else {
          throw new Error("Failed to delete invoice");
        }
      } catch (err) {
        alert("Failed to delete invoice");
      }
    }
  };

  const logReminder = async (invoiceId: string, templateType: string, channel: string) => {
    try {
      await fetch(`/api/invoices/${invoiceId}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateType, channel }),
      });
      addNotification({
        type: "SUCCESS",
        title: "Reminder Logged",
        message: `Sent ${templateType.replace("_", " ")} nudge tracking status.`,
      });
    } catch (e) {
      console.warn("Failed to log reminder event", e);
    }
  };

  const triggerWhatsAppNudge = (invoice: Invoice, templateType: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://kavio.finance";
    const paymentLink = `${origin}/invoice/${invoice.id}`;
    
    let textMessage = "";
    if (templateType === "DUE_TOMORROW") {
      textMessage = `Hi ${invoice.client.name}, hope you're having a great week! Just a friendly note that invoice ${invoice.invoiceNumber} for NGN ${invoice.amount.toLocaleString()} is due tomorrow. Here is the payment link with bank details: ${paymentLink}. Thank you!`;
    } else if (templateType === "DUE_TODAY") {
      textMessage = `Hi ${invoice.client.name}, hope you're doing well. Just a gentle reminder that invoice ${invoice.invoiceNumber} (NGN ${invoice.amount.toLocaleString()}) is due today. You can complete payment here: ${paymentLink}. Thanks!`;
    } else if (templateType === "OVERDUE_3D") {
      textMessage = `Hi ${invoice.client.name}, hope all is well. Just following up on invoice ${invoice.invoiceNumber} (NGN ${invoice.amount.toLocaleString()}) which is now 3 days overdue. Here is the payment link: ${paymentLink}. Appreciate your help with this!`;
    } else {
      textMessage = `Hi ${invoice.client.name}, I hope this message finds you well. I'm checking in on the status of invoice ${invoice.invoiceNumber} (NGN ${invoice.amount.toLocaleString()}), which is now past due. You can find the payment instructions and bank details here: ${paymentLink}. Thank you!`;
    }

    // Open the styled modal instead of native browser prompt
    setNudgePayload({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client.name,
      clientPhone: invoice.client.phone || "+234",
      amount: invoice.amount,
      templateType,
      messageText: textMessage,
    });
  };

  const handleNudgeConfirm = (phone: string, payload: WhatsAppNudgePayload) => {
    logReminder(payload.invoiceId, payload.templateType, "WHATSAPP");
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(payload.messageText)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesFilter = filter === "ALL" ? true : inv.status === filter;
    const matchesSearch = 
      inv.client.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.projectDescription.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "PAID":
        return (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 inline-flex items-center gap-1.5 w-fit">
            <CheckCircle className="w-3.5 h-3.5" />
            Paid
          </span>
        );
      case "OVERDUE":
        return (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 inline-flex items-center gap-1.5 w-fit">
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 inline-flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  const copyPaymentLink = (id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://kavio.finance";
    const dummyLink = `${origin}/invoice/${id}`;
    navigator.clipboard.writeText(dummyLink);
    alert(`Public payment link copied to clipboard!\n${dummyLink}`);
  };

  // Compute stat aggregates
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const settledAmount = invoices.filter(inv => inv.status === "PAID").reduce((sum, inv) => sum + inv.amount, 0);
  const outstandingAmount = invoices.filter(inv => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status)).reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices.filter(inv => inv.status === "OVERDUE").reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="relative flex flex-col space-y-4 animate-in fade-in duration-500 pb-24 min-h-full">
      {/* Background Decorative Blur Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-50/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* WhatsApp Nudge Modal */}
      <WhatsAppNudgeModal
        payload={nudgePayload}
        onClose={() => setNudgePayload(null)}
        onConfirm={handleNudgeConfirm}
      />
      
      {/* Mobile Native Header */}
      <div className="md:hidden pt-6 pb-2 px-4 flex items-center justify-between relative z-10">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Invoices
          {isLoading && invoices.length > 0 && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
        </h1>
        <Link href="/dashboard/invoices/create" className="bg-[#00B140] hover:bg-[#009933] text-white p-2 rounded-xl transition-all duration-300 flex items-center justify-center active:scale-[0.98]">
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {/* Desktop Header Area */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/80 backdrop-blur-md text-slate-800 p-8 rounded-[2rem] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative z-10 mx-4 md:mx-8 mt-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Invoices
            {isLoading && invoices.length > 0 && (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">Draft, send, and collect client payments instantly</p>
        </div>

        <Link href="/dashboard/invoices/create" className="bg-[#00B140] hover:bg-[#009933] text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100 hover:translate-y-[-2px] active:translate-y-0 flex items-center gap-2 border-none cursor-pointer text-sm">
          <Plus className="w-4 h-4" />
          Create Invoice
        </Link>
      </div>

      {/* Tab Switcher: Invoices vs Payments (Mobile Native Pill Tabs) */}
      <div className="px-4 md:px-8 relative z-10 flex md:justify-start">
        <div className="bg-slate-100 rounded-2xl p-1 flex w-full md:w-[400px]">
          <button
            onClick={() => setActiveSubTab("INVOICES")}
            className={`flex-1 py-2 text-sm text-center transition-all border-none cursor-pointer ${
              activeSubTab === "INVOICES"
                ? "bg-white rounded-xl shadow-sm font-semibold text-slate-900"
                : "bg-transparent text-slate-500 font-medium"
            }`}
          >
            Invoices Registry
          </button>
          <button
            onClick={() => setActiveSubTab("PAYMENTS")}
            className={`flex-1 py-2 text-sm text-center transition-all border-none cursor-pointer ${
              activeSubTab === "PAYMENTS"
                ? "bg-white rounded-xl shadow-sm font-semibold text-slate-900"
                : "bg-transparent text-slate-500 font-medium"
            }`}
          >
            Payments Record
          </button>
        </div>
      </div>

      {/* Aggregate Cards (Horizontal Scroll) */}
      {activeSubTab === "INVOICES" ? (
        <div className="overflow-x-auto -mx-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative z-10 md:mx-4 md:px-0">
          <div className="flex w-max space-x-3 pr-4 md:grid md:grid-cols-4 md:w-full md:space-x-0 md:gap-4 md:pr-0">
            <div className="min-w-[140px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative z-10 active:scale-[0.98] transition-transform duration-100">
              <FileText className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Invoiced</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono truncate">{formatCurrency(totalInvoiced)}</h3>
            </div>
            <div className="min-w-[140px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative z-10 active:scale-[0.98] transition-transform duration-100">
              <TrendingUp className="w-4 h-4 text-emerald-500 mb-2 animate-pulse" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Settled</p>
              <h3 className="text-2xl font-black text-emerald-600 tracking-tight font-mono truncate">{formatCurrency(settledAmount)}</h3>
            </div>
            <div className="min-w-[140px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative z-10 active:scale-[0.98] transition-transform duration-100">
              <Clock className="w-4 h-4 text-amber-500 mb-2" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pending</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono truncate">{formatCurrency(outstandingAmount)}</h3>
            </div>
            <div className="min-w-[140px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative z-10 active:scale-[0.98] transition-transform duration-100">
              <AlertTriangle className="w-4 h-4 text-rose-500 mb-2" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Overdue</p>
              <h3 className="text-2xl font-black text-rose-600 tracking-tight font-mono truncate">{formatCurrency(overdueAmount)}</h3>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative z-10 md:mx-4 md:px-0">
          <div className="flex w-max space-x-3 pr-4 md:grid md:grid-cols-2 md:w-full md:space-x-0 md:gap-4 md:pr-0">
            <div className="min-w-[140px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative z-10 active:scale-[0.98] transition-transform duration-100">
              <DollarSign className="w-4 h-4 text-emerald-500 mb-2 animate-pulse" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Revenue</p>
              <h3 className="text-2xl font-black text-emerald-600 tracking-tight font-mono truncate">{formatCurrency(settledAmount)}</h3>
            </div>
            <div className="min-w-[140px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm relative z-10 active:scale-[0.98] transition-transform duration-100">
              <ArrowLeftRight className="w-4 h-4 text-[#00B140] mb-2" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Transactions</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono truncate">{paymentsList.length}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar + Lists */}
      {activeSubTab === "INVOICES" ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative z-10 hover:shadow-md transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Tab Filters */}
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
              {(["ALL", "PAID", "SENT", "VIEWED", "OVERDUE"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-2 text-xs font-semibold rounded-full transition-all border-none cursor-pointer shrink-0 ${
                    filter === t
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100/85 font-medium"
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice or client name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/65 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-200 placeholder:text-slate-400 text-slate-900"
              />
            </div>

          </div>

          {/* Invoice grid list / Mobile list */}
          {isLoading && filteredInvoices.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-slate-500 font-medium text-base mt-3 text-center">No invoices found</h4>
                <p className="text-slate-400 text-sm mt-1 text-center">Create a new invoice and share payment link with clients.</p>
              </div>
              <Link href="/dashboard/invoices/create" className="w-full md:w-auto md:px-10 bg-[#00B140] hover:bg-[#009933] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mt-4 min-h-[52px] active:scale-[0.98] transition-transform no-underline">
                Create Your First Invoice
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
              {filteredInvoices.map((inv) => (
                <Link key={inv.id} href={`/invoice/${inv.id}`} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between min-h-[56px] active:scale-[0.98] transition-transform no-underline relative z-10 group hover:shadow-md">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="font-semibold text-slate-900 truncate group-hover:text-[#00B140] transition-colors">{inv.client.name}</span>
                    <span className="text-xs font-mono text-slate-400 mt-0.5">{inv.invoiceNumber}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(inv.amount)}</span>
                      <div className="mt-1">{getStatusBadge(inv.status)}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-slate-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative z-10 hover:shadow-md transition-all duration-300">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search payments by client, invoice number..."
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-150 placeholder:text-slate-400 text-slate-900"
            />
          </div>

          <div className="overflow-hidden bg-white rounded-2xl border border-slate-100 w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-4 px-5">Client / Tenant</th>
                  <th className="py-4 px-5">Invoice details</th>
                  <th className="py-4 px-5">Payment Method</th>
                  <th className="py-4 px-5">Settlement Date</th>
                  <th className="py-4 px-5 text-right">Amount Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 text-sm">
                {isLoading && filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading payments...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-450 font-medium">
                      No paid transactions matching search.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/20 transition-all duration-150 group">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-100/30 shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-800 leading-none">{pay.clientName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="font-mono text-slate-900 font-bold">{pay.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-500 font-medium">
                        {pay.reference}
                      </td>
                      <td className="py-4 px-5 text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(pay.datePaid).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-emerald-600 font-mono">
                        ₦ {pay.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
