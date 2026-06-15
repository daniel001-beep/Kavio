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
  CheckCircle2
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
    if (confirm("Are you sure you want to delete this invoice? This will remove all collection logs.")) {
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
    <div className="relative flex flex-col space-y-8 animate-in fade-in duration-500 pb-16 min-h-full">
      {/* Background Decorative Blur Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-50/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* WhatsApp Nudge Modal */}
      <WhatsAppNudgeModal
        payload={nudgePayload}
        onClose={() => setNudgePayload(null)}
        onConfirm={handleNudgeConfirm}
      />
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/80 backdrop-blur-md text-slate-800 p-8 rounded-[2rem] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Invoice Factory
            {isLoading && invoices.length > 0 && (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">Draft, send, and collect client payments instantly</p>
        </div>

        <Link href="/dashboard/invoices/create" passHref legacyBehavior>
          <button className="bg-[#00B140] hover:bg-[#009933] text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100 hover:translate-y-[-2px] active:translate-y-0 flex items-center gap-2 border-none cursor-pointer text-sm">
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </Link>
      </div>

      {/* Tab Switcher: Invoices vs Payments */}
      <div className="flex items-center gap-6 border-b border-slate-100 pb-1 mt-2 relative z-10">
        <button
          onClick={() => setActiveSubTab("INVOICES")}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-all border-none bg-transparent cursor-pointer ${
            activeSubTab === "INVOICES"
              ? "border-[#00B140] text-[#00B140]"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Invoices Registry
        </button>
        <button
          onClick={() => setActiveSubTab("PAYMENTS")}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-all border-none bg-transparent cursor-pointer ${
            activeSubTab === "PAYMENTS"
              ? "border-[#00B140] text-[#00B140]"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Payments Ledger
        </button>
      </div>

      {/* Aggregate Cards */}
      {activeSubTab === "INVOICES" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-slate-200/60 transition-all duration-300 relative z-10 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
              <FileText className="w-4 h-4 text-slate-400 group-hover:text-[#00B140] transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 font-mono group-hover:text-[#00B140] transition-colors duration-300">{formatCurrency(totalInvoiced)}</h3>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">All invoices tracked</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-slate-200/60 transition-all duration-300 relative z-10 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Settled Earnings</span>
              <TrendingUp className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-600 tracking-tight mt-1 font-mono group-hover:text-emerald-700 transition-colors duration-300">{formatCurrency(settledAmount)}</h3>
            <p className="text-xs text-emerald-600 mt-1.5 font-medium">Payments confirmed</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-slate-200/60 transition-all duration-300 relative z-10 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 font-mono group-hover:text-amber-600 transition-colors duration-300">{formatCurrency(outstandingAmount)}</h3>
            <p className="text-xs text-amber-600 mt-1.5 font-medium">Awaiting client action</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-slate-200/60 transition-all duration-300 relative z-10 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overdue Alert</span>
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-bounce" />
            </div>
            <h3 className="text-2xl font-bold text-rose-650 tracking-tight mt-1 font-mono group-hover:text-rose-700 transition-colors duration-300">{formatCurrency(overdueAmount)}</h3>
            <p className="text-xs text-rose-600 mt-1.5 font-medium">Past due invoices</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-slate-200/60 transition-all duration-300 relative z-10 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue Paid</span>
              <DollarSign className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 font-mono group-hover:text-emerald-700 transition-colors duration-300">{formatCurrency(settledAmount)}</h3>
            <p className="text-xs text-emerald-600 mt-1.5 font-medium">Settled collection receipts</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-slate-200/60 transition-all duration-300 relative z-10 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transactions Count</span>
              <ArrowLeftRight className="w-4 h-4 text-[#00B140]" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 group-hover:text-[#00B140] transition-colors duration-300">{paymentsList.length} Payments</h3>
            <p className="text-xs text-slate-505 mt-1.5 font-medium">All-time collection count</p>
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

          {/* Invoice grid list */}
          {isLoading && filteredInvoices.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 bg-slate-50/20 rounded-3xl border border-slate-100">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-4 text-center bg-slate-50/20 rounded-3xl border border-slate-100 p-6">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-350">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-slate-650 font-semibold mt-4">No invoices found</h4>
                <p className="text-slate-400 text-sm mt-1">Create a new invoice and share payment link with clients.</p>
              </div>
              <Link href="/dashboard/invoices/create" passHref legacyBehavior>
                <button className="bg-[#00B140] hover:bg-[#009933] text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100 hover:translate-y-[-2px] active:translate-y-0 flex items-center gap-2 border-none cursor-pointer text-sm">
                  Create Your First Invoice
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvoices.map((inv) => (
                <div key={inv.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-slate-200/60 transition-all duration-300 flex flex-col justify-between gap-5 relative z-10 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-400 font-semibold">{inv.invoiceNumber}</span>
                    {getStatusBadge(inv.status)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">{inv.client.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{inv.client.email}</p>
                    <p className="text-sm text-slate-600 mt-3 line-clamp-2 h-10 leading-relaxed">{inv.projectDescription}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100/60">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount</p>
                      <p className="font-mono font-bold text-lg text-slate-900 mt-0.5">{formatCurrency(inv.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Due Date</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{new Date(inv.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    {inv.status !== "PAID" && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            triggerWhatsAppNudge(inv, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-650 hover:text-slate-800 font-medium cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">💬 Nudge...</option>
                        <option value="DUE_TOMORROW">Due Tomorrow</option>
                        <option value="DUE_TODAY">Due Today</option>
                        <option value="OVERDUE_3D">3 Days Overdue</option>
                        <option value="OVERDUE_7D">Past Due Follow-up</option>
                      </select>
                    )}
                    <button
                      onClick={() => copyPaymentLink(inv.id)}
                      className="p-2 text-slate-400 hover:text-[#00B140] hover:bg-slate-50 border border-slate-100/60 rounded-xl transition-all duration-200 bg-transparent cursor-pointer"
                      title="Copy Shareable Invoice Link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteInvoice(inv.id)}
                      className="p-2 text-slate-450 hover:text-rose-550 hover:bg-rose-50 border border-slate-100/60 hover:border-rose-100 rounded-xl transition-all duration-200 bg-transparent cursor-pointer"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
