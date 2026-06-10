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
          <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
            <CheckCircle className="w-3.5 h-3.5" />
            Paid
          </Badge>
        );
      case "SENT":
        return (
          <Badge className="bg-blue-500/10 border border-blue-500/20 text-blue-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5" />
            Sent
          </Badge>
        );
      case "VIEWED":
        return (
          <Badge className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5" />
            Viewed
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge className="bg-rose-500/10 border border-rose-500/20 text-rose-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/10 border border-slate-500/20 text-slate-655 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
            <FileText className="w-3.5 h-3.5" />
            Draft
          </Badge>
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
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-16">

      {/* WhatsApp Nudge Modal */}
      <WhatsAppNudgeModal
        payload={nudgePayload}
        onClose={() => setNudgePayload(null)}
        onConfirm={handleNudgeConfirm}
      />
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            Invoice Factory
            {isLoading && invoices.length > 0 && (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            )}
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Draft, send, and collect client payments instantly</p>
        </div>

        <Link href="/dashboard/invoices/create" passHref legacyBehavior>
          <Button className="py-6 px-6 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-450 hover:to-emerald-550 text-white shadow-lg shadow-emerald-500/20 border-none transition-all duration-200 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Tab Switcher: Invoices vs Payments */}
      <div className="flex items-center gap-6 border-b border-slate-100 pb-1 mt-2">
        <button
          onClick={() => setActiveSubTab("INVOICES")}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "INVOICES"
              ? "border-emerald-500 text-emerald-600 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Invoices Registry
        </button>
        <button
          onClick={() => setActiveSubTab("PAYMENTS")}
          className={`pb-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === "PAYMENTS"
              ? "border-emerald-500 text-emerald-600 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Payments Ledger
        </button>
      </div>

      {/* Aggregate Cards */}
      {activeSubTab === "INVOICES" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/55 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-mono">{formatCurrency(totalInvoiced)}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">All invoices tracked</p>
            </CardContent>
          </Card>

          <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/55 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settled Earnings</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-mono">{formatCurrency(settledAmount)}</h3>
              <p className="text-[10px] text-emerald-500 font-semibold mt-1">Payments confirmed</p>
            </CardContent>
          </Card>

          <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/55 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-mono">{formatCurrency(outstandingAmount)}</h3>
              <p className="text-[10px] text-amber-650 font-semibold mt-1">Awaiting bank details</p>
            </CardContent>
          </Card>

          <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/55 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Alert</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-mono">{formatCurrency(overdueAmount)}</h3>
              <p className="text-[10px] text-rose-500 font-semibold mt-1">Past due invoices</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/55 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Total Revenue Paid</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 font-mono">{formatCurrency(settledAmount)}</h3>
              <p className="text-[10px] text-emerald-650 font-semibold mt-1">Settled collection receipts</p>
            </CardContent>
          </Card>

          <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/55 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Transactions Count</span>
                <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">{paymentsList.length} Payments</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">All-time collection count</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      {/* Filter and Search Bar + Lists */}
      {activeSubTab === "INVOICES" ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Tab Filters */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(["ALL", "PAID", "SENT", "VIEWED", "OVERDUE"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
                    filter === t
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search invoice or client name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 py-5 rounded-xl border-slate-200/50 focus-visible:ring-emerald-500 text-xs"
              />
            </div>

          </div>

          {/* Invoice Table list */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100/40 bg-slate-50/30">
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice No.</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Details</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {isLoading && filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="py-16 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading invoices...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="py-16 flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-700">No invoices found</h4>
                          <p className="text-xs text-slate-400 mt-1">Create a new invoice and share payment link with clients.</p>
                        </div>
                        <Link href="/dashboard/invoices/create" passHref legacyBehavior>
                          <Button className="mt-2 text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100/50 py-4 rounded-xl">
                            Create Your First Invoice
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4.5 px-4 font-mono font-bold text-slate-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-4.5 px-4">
                        <p className="font-bold text-slate-800">{inv.client.name}</p>
                        <p className="text-[10px] text-slate-450 font-semibold">{inv.client.email}</p>
                      </td>
                      <td className="py-4.5 px-4 text-slate-500 font-semibold truncate max-w-[200px]">
                        {inv.projectDescription}
                      </td>
                      <td className="py-4.5 px-4 text-slate-500 font-medium">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-4.5 px-4 font-mono font-bold text-slate-800">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-4.5 px-4">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="py-4.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* WhatsApp Dropdown Trigger */}
                          {inv.status !== "PAID" && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  triggerWhatsAppNudge(inv, e.target.value);
                                  e.target.value = ""; // Reset dropdown
                                }
                              }}
                              className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/50 text-slate-700 text-[10px] font-bold rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none"
                            >
                              <option value="">💬 Nudge Client...</option>
                              <option value="DUE_TOMORROW">Nudge: Due Tomorrow</option>
                              <option value="DUE_TODAY">Nudge: Due Today</option>
                              <option value="OVERDUE_3D">Nudge: 3 Days Overdue</option>
                              <option value="OVERDUE_7D">Nudge: Past Due Follow-up</option>
                            </select>
                          )}

                          <button
                            onClick={() => copyPaymentLink(inv.id)}
                            className="p-2 hover:bg-slate-55 text-slate-400 hover:text-emerald-500 border border-transparent rounded-lg transition-colors"
                            title="Copy Shareable Invoice Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteInvoice(inv.id)}
                            className="p-2 hover:bg-slate-55 text-slate-400 hover:text-rose-500 border border-transparent rounded-lg transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search payments by client, invoice number..."
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
              className="pl-9 py-5 rounded-xl border-slate-200/50 focus-visible:ring-emerald-500 text-xs"
            />
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-4">Client / Tenant</th>
                  <th className="py-4 px-4">Invoice details</th>
                  <th className="py-4 px-4">Payment Method</th>
                  <th className="py-4 px-4">Settlement Date</th>
                  <th className="py-4 px-4 text-right">Amount Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-655">
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
                    <td colSpan={5} className="py-12 text-center text-slate-450">
                      No paid transactions matching search.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/20 transition-all">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-slate-800">{pay.clientName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{pay.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-medium">
                        {pay.reference}
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(pay.datePaid).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-emerald-600 font-mono">
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
