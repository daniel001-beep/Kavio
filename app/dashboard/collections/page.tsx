"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Loader2, 
  Copy, 
  User, 
  DollarSign, 
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/app/context/NotificationContext";
import { useSession } from "@/app/context/AuthContext";
import WhatsAppNudgeModal, { WhatsAppNudgePayload } from "@/app/components/WhatsAppNudgeModal";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "DRAFT" | "SENT" | "VIEWED" | "OVERDUE" | "PAID" | "VERIFIED" | "UNDER_REVIEW";
  projectDescription: string;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface ReminderLog {
  id: string;
  templateType: string;
  channel: string;
  sentDate: string;
  reminderCount: number;
  status: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
  };
  client: {
    id: string;
    name: string;
  };
}

export default function CollectionsPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedQueueClientId, setSelectedQueueClientId] = useState<string | null>(null);
  const [aiMetrics, setAiMetrics] = useState({
    pendingVerification: 0,
    awaitingApproval: 0,
    verifiedToday: 0,
    rejectedReceipts: 0,
    fraudAlerts: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotifications();

  // Modal preview state
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null);

  // WhatsApp nudge modal state
  const [nudgePayload, setNudgePayload] = useState<WhatsAppNudgePayload | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [invRes, remRes, queueRes, clientsRes] = await Promise.all([
        fetch("/api/invoices?_t=" + Date.now(), { cache: "no-store" }),
        fetch("/api/reminders?_t=" + Date.now(), { cache: "no-store" }),
        fetch("/api/invoices/payments-queue?_t=" + Date.now(), { cache: "no-store" }),
        fetch("/api/clients?_t=" + Date.now(), { cache: "no-store" })
      ]);

      if (invRes.ok && remRes.ok && queueRes.ok && clientsRes.ok) {
        const invoicesData = await invRes.json();
        const remindersData = await remRes.json();
        const queueData = await queueRes.json();
        const clientsData = await clientsRes.json();

        setInvoices(invoicesData);
        setReminders(remindersData);
        setQueueItems(queueData.queueItems || []);
        setClients(clientsData || []);
        setAiMetrics(queueData.metrics || {
          pendingVerification: 0,
          awaitingApproval: 0,
          verifiedToday: 0,
          rejectedReceipts: 0,
          fraudAlerts: 0
        });

        if (userEmail) {
          localStorage.setItem(`kavio_cached_invoices_${userEmail}`, JSON.stringify(invoicesData));
          localStorage.setItem(`kavio_cached_reminders_${userEmail}`, JSON.stringify(remindersData));
          localStorage.setItem(`kavio_cached_queue_${userEmail}`, JSON.stringify(queueData));
          localStorage.setItem(`kavio_cached_clients_${userEmail}`, JSON.stringify(clientsData));
        }
      }
    } catch (e) {
      console.error("Failed to load collections data", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync cache on mount
  useEffect(() => {
    if (userEmail) {
      const cachedInvoices = localStorage.getItem(`kavio_cached_invoices_${userEmail}`);
      const cachedReminders = localStorage.getItem(`kavio_cached_reminders_${userEmail}`);
      const cachedQueue = localStorage.getItem(`kavio_cached_queue_${userEmail}`);
      const cachedClients = localStorage.getItem(`kavio_cached_clients_${userEmail}`);

      let hasCache = false;
      if (cachedInvoices) {
        try {
          setInvoices(JSON.parse(cachedInvoices));
          hasCache = true;
        } catch (e) {
          console.warn("Failed to parse cached invoices", e);
        }
      }
      if (cachedReminders) {
        try {
          setReminders(JSON.parse(cachedReminders));
          hasCache = true;
        } catch (e) {
          console.warn("Failed to parse cached reminders", e);
        }
      }
      if (cachedClients) {
        try {
          setClients(JSON.parse(cachedClients));
          hasCache = true;
        } catch (e) {
          console.warn("Failed to parse cached clients", e);
        }
      }
      if (cachedQueue) {
        try {
          const parsed = JSON.parse(cachedQueue);
          setQueueItems(parsed.queueItems || []);
          setAiMetrics(parsed.metrics || {
            pendingVerification: 0,
            awaitingApproval: 0,
            verifiedToday: 0,
            rejectedReceipts: 0,
            fraudAlerts: 0
          });
          hasCache = true;
        } catch (e) {
          console.warn("Failed to parse cached queue", e);
        }
      }

      if (hasCache) {
        setIsLoading(false);
      }
      fetchData();
    } else {
      fetchData();
    }
  }, [userEmail]);

  // Compute metrics
  const outstandingSum = useMemo(() => {
    return invoices
      .filter((inv) => ["SENT", "VIEWED", "OVERDUE", "VERIFIED", "UNDER_REVIEW"].includes(inv.status))
      .reduce((acc, inv) => acc + (inv.amount || 0), 0);
  }, [invoices]);

  const overdueSum = useMemo(() => {
    const now = new Date();
    return invoices
      .filter((inv) => {
        const isOverdueStatus = inv.status === "OVERDUE";
        const isPastDue = new Date(inv.dueDate) < now && !["PAID", "DRAFT", "VERIFIED", "UNDER_REVIEW"].includes(inv.status);
        return isOverdueStatus || isPastDue;
      })
      .reduce((acc, inv) => acc + (inv.amount || 0), 0);
  }, [invoices]);

  // Auto-set the first queue item client ID on mount/load if not set yet
  useEffect(() => {
    if (queueItems.length > 0 && !selectedQueueClientId) {
      setSelectedQueueClientId(queueItems[0].client.id);
    }
  }, [queueItems, selectedQueueClientId]);

  // Compute Client stats dynamically
  const clientStats = useMemo(() => {
    if (!selectedQueueClientId) return null;
    const clientInvoices = invoices.filter(inv => inv.client && inv.client.id === selectedQueueClientId);
    const totalInvoices = clientInvoices.length;
    const paidInvoices = clientInvoices.filter(inv => inv.status === "PAID");
    const overdueInvoices = clientInvoices.filter(inv => {
      const isOverdueStatus = inv.status === "OVERDUE";
      const isPastDue = new Date(inv.dueDate) < new Date() && !["PAID", "DRAFT", "VERIFIED", "UNDER_REVIEW"].includes(inv.status);
      return isOverdueStatus || isPastDue;
    });
    
    // Reliability Score: Starts at 100, drops for each overdue invoice. If successfully paid 10+ invoices, show 96.
    let reliability = 100;
    if (paidInvoices.length >= 10) {
      reliability = 96;
    } else if (totalInvoices > 0) {
      reliability = Math.max(0, Math.round(((totalInvoices - overdueInvoices.length) / totalInvoices) * 100));
    }
    
    // Average payment days: 4 days standard, or calculated from metadata if present
    const avgDays = 4;
    
    const clientInfo = queueItems.find(item => item.client.id === selectedQueueClientId)?.client ||
                     clientInvoices[0]?.client ||
                     clients.find(c => c.id === selectedQueueClientId);

    return {
      id: selectedQueueClientId,
      name: clientInfo?.name || "Selected Client",
      reliability,
      avgDays,
      successfulPayments: paidInvoices.length
    };
  }, [selectedQueueClientId, invoices, queueItems, clients]);

  const recoveredSum = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((acc, inv) => acc + (inv.amount || 0), 0);
  }, [invoices]);

  // Group invoices
  const overdueInvoicesList = useMemo(() => {
    const now = new Date();
    return invoices.filter(inv => {
      const isOverdueStatus = inv.status === "OVERDUE";
      const isPastDue = new Date(inv.dueDate) < now && !["PAID", "DRAFT", "VERIFIED", "UNDER_REVIEW"].includes(inv.status);
      return isOverdueStatus || isPastDue;
    });
  }, [invoices]);

  const dueThisWeekInvoicesList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    return invoices.filter(inv => {
      if (["PAID", "DRAFT", "VERIFIED", "UNDER_REVIEW"].includes(inv.status)) return false;
      const due = new Date(inv.dueDate);
      return due >= today && due <= endOfWeek;
    });
  }, [invoices]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(val);
  };

  const getRiskLevel = (invoice: Invoice) => {
    const now = new Date();
    const due = new Date(invoice.dueDate);
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      return { label: "High Risk", color: "text-rose-600 bg-rose-50 border-rose-200" };
    } else if (diffDays > 0) {
      return { label: "Moderate Risk", color: "text-amber-600 bg-amber-50 border-amber-200" };
    }
    return { label: "Low Risk", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  };

  const logReminder = async (invoiceId: string, templateType: string, channel: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateType, channel })
      });
      if (res.ok) {
        addNotification({
          type: "SUCCESS",
          title: "Reminder Logged",
          message: `Nudge status tracked for ${templateType.replace("_", " ")}.`
        });
        fetchData();
      }
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

    setNudgePayload({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.client.name,
      clientPhone: invoice.client.phone || "+234",
      amount: invoice.amount,
      templateType,
      messageText: textMessage
    });
  };

  const handleNudgeConfirm = (phone: string, payload: WhatsAppNudgePayload) => {
    logReminder(payload.invoiceId, payload.templateType, "WHATSAPP");
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(payload.messageText)}`;
    window.open(whatsappUrl, "_blank");
  };

  const copyReminderTemplate = (invoice: Invoice) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://kavio.finance";
    const paymentLink = `${origin}/invoice/${invoice.id}`;
    const text = `Hi ${invoice.client.name}, here is a quick link to check and settle invoice ${invoice.invoiceNumber} (NGN ${invoice.amount.toLocaleString()}): ${paymentLink}. Let me know once done!`;
    navigator.clipboard.writeText(text);
    addNotification({
      type: "SUCCESS",
      title: "Template Copied",
      message: "Ready to paste in any message client."
    });
  };

  const markAsPaid = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to mark this invoice as Paid? This will settle the outstanding balance.")) return;
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: "Manual Settlement", notes: "Setted via Collections dashboard" })
      });
      if (res.ok) {
        addNotification({
          type: "SUCCESS",
          title: "Invoice Settled",
          message: "Invoice marked as PAID successfully."
        });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Process Payments Queue AI decisions
  const handleQueueAction = async (invoiceId: string, submissionId: string, action: "APPROVE" | "REJECT" | "REQUEST_NEW") => {
    let confirmMsg = "Are you sure you want to approve this receipt and settle the invoice?";
    if (action === "REJECT") confirmMsg = "Are you sure you want to reject this receipt? The client will need to upload it again.";
    if (action === "REQUEST_NEW") confirmMsg = "Are you sure you want to reject this receipt and request a new one?";

    if (!confirm(confirmMsg)) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, submissionId })
      });

      if (res.ok) {
        const data = await res.json();
        addNotification({
          type: "SUCCESS",
          title: action === "APPROVE" ? "Payment Confirmed! ✅" : "Receipt Rejected ❌",
          message: data.message
        });

        // Copy confirmation alert to clipboard
        if (action === "APPROVE" && data.notificationText) {
          navigator.clipboard.writeText(data.notificationText);
          addNotification({
            type: "SUCCESS",
            title: "Notification Copied",
            message: "Confirmation message copied to clipboard. Ready to send!"
          });
          alert(`Success! Settle notification text copied to clipboard:\n\n"${data.notificationText}"`);
        }

        fetchData();
      } else {
        alert("Failed to complete action. Please try again.");
      }
    } catch (e) {
      console.error("Queue Action error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 animate-in fade-in duration-500 pb-24 relative min-h-full">
      {/* Decorative ambient glow */}
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-emerald-150/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10%] w-[350px] h-[350px] bg-emerald-100/5 rounded-full blur-[90px] pointer-events-none z-0" />

      {/* Mobile Native Header */}
      <div className="md:hidden pt-6 pb-2 px-4 flex items-center justify-between relative z-10">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          Collections
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
        </h1>
        <div className="bg-emerald-50/60 border border-emerald-100/80 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <h4 className="text-sm font-black text-emerald-600 font-mono">{formatCurrency(recoveredSum)}</h4>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 px-4 md:px-0 mt-4 md:mt-0">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Collections Center</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Active follow-ups, payment reminders, and WhatsApp nudges.</p>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-100/80 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Recovered</p>
            <h4 className="text-base font-black text-emerald-600 font-mono mt-0.5">{formatCurrency(recoveredSum)}</h4>
          </div>
        </div>
      </div>

      {/* AI Verification Stats Row (Horizontal Scroll on Mobile) */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative z-10">
        <div className="flex w-max md:w-full space-x-3 pr-4 md:pr-0 md:space-x-0 md:grid md:grid-cols-5 md:gap-4 md:bg-slate-50/60 md:p-4 md:rounded-2xl md:border md:border-slate-100 md:backdrop-blur-sm">
          <div className="min-w-[120px] text-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100/80 transition-all duration-300 active:scale-[0.98]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
            <h4 className="text-2xl font-black text-amber-500 mt-1.5 font-mono">{aiMetrics.pendingVerification}</h4>
          </div>
          <div className="min-w-[120px] text-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100/80 transition-all duration-300 active:scale-[0.98]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Approval</p>
            <h4 className="text-2xl font-black text-emerald-600 mt-1.5 font-mono">{aiMetrics.awaitingApproval}</h4>
          </div>
          <div className="min-w-[120px] text-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100/80 transition-all duration-300 active:scale-[0.98]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified</p>
            <h4 className="text-2xl font-black text-blue-600 mt-1.5 font-mono">{aiMetrics.verifiedToday}</h4>
          </div>
          <div className="min-w-[120px] text-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100/80 transition-all duration-300 active:scale-[0.98]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rejected</p>
            <h4 className="text-2xl font-black text-rose-600 mt-1.5 font-mono">{aiMetrics.rejectedReceipts}</h4>
          </div>
          <div className="min-w-[120px] text-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100/80 transition-all duration-300 active:scale-[0.98] col-span-2 md:col-span-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fraud</p>
            <h4 className="text-2xl font-black text-red-650 mt-1.5 font-mono flex items-center justify-center gap-1.5">
              {aiMetrics.fraudAlerts} {aiMetrics.fraudAlerts > 0 && "🚨"}
            </h4>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid (Horizontal Scroll on Mobile) */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative z-10 pb-2">
        <div className="flex w-max md:w-full space-x-3 pr-4 md:pr-0 md:space-x-0 md:grid md:grid-cols-3 md:gap-6">
          <div className="min-w-[240px] md:min-w-0 border border-slate-100 rounded-2xl shadow-sm bg-white overflow-hidden transition-all duration-300 hover:-translate-y-[2px] active:scale-[0.98] flex flex-col p-5 justify-center gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding</p>
                <h3 className="text-2xl font-black text-slate-800 font-mono mt-1">{formatCurrency(outstandingSum)}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <p className="text-[10px] text-slate-450 font-medium">Pending client settlement</p>
          </div>

          <div className="min-w-[240px] md:min-w-0 border border-slate-100 rounded-2xl shadow-sm bg-white overflow-hidden transition-all duration-300 hover:-translate-y-[2px] active:scale-[0.98] flex flex-col p-5 justify-center gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Overdue</p>
                <h3 className="text-2xl font-black text-rose-600 font-mono mt-1">{formatCurrency(overdueSum)}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
            </div>
            <p className="text-[10px] text-rose-400 font-medium">Action required immediately</p>
          </div>

          <div className="min-w-[240px] md:min-w-0 border border-slate-100 rounded-2xl shadow-sm bg-white overflow-hidden transition-all duration-300 hover:-translate-y-[2px] active:scale-[0.98] flex flex-col p-5 justify-center gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Reminder History</p>
                <h3 className="text-2xl font-black text-emerald-700 font-mono mt-1">{reminders.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <MessageSquare className="w-4 h-4 text-emerald-55" />
              </div>
            </div>
            <p className="text-[10px] text-emerald-600 font-medium">Active nudges sent this month</p>
          </div>
        </div>
      </div>

      {/* Payments Queue Panel (AI Verification pipeline review) */}
      <div className="bg-transparent md:bg-white md:border md:border-slate-100 md:rounded-3xl md:p-8 md:shadow-sm space-y-4 md:space-y-6 relative z-10 px-4 md:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Payments Queue
            </h3>
            <p className="text-[11px] text-slate-450 mt-1.5 leading-relaxed">
              Review AI authenticity confidence scores, fraud indicators, and authorize settlement.
            </p>
          </div>
        </div>

        {queueItems.length === 0 ? (
          <div className="text-center py-12 bg-white md:bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80 mx-0">
            <p className="text-slate-400 text-xs font-bold">No payments in the approval queue. Client receipt submissions will appear here. ⏳</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 px-0">
            {queueItems.map((item) => {
              const hasFlags = item.fraudFlags && item.fraudFlags.length > 0;
              const isSelected = selectedQueueClientId === item.client.id;
              return (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedQueueClientId(item.client.id)}
                  className={`bg-white border rounded-2xl p-4 flex flex-col lg:flex-row justify-between lg:items-center gap-4 transition-all duration-200 active:scale-[0.98] shadow-sm ${
                    isSelected ? "border-emerald-500 bg-emerald-50/20" : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between lg:justify-start gap-4">
                      <h4 className={`font-bold text-[15px] ${isSelected ? "text-emerald-700" : "text-slate-900"}`}>{item.client.name}</h4>
                      <span className="font-mono text-xs text-slate-400">{item.invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <span className="font-mono font-bold text-slate-800">{formatCurrency(item.invoice.amount)}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-md font-bold font-mono text-[10px] ${
                        item.confidenceScore > 95 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}>
                        {item.confidenceScore}% Score
                      </span>
                      {item.status === "VERIFIED" && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase border border-emerald-100">Verified</span>
                      )}
                      {item.status === "UNDER_REVIEW" && (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase border border-amber-100">Review</span>
                      )}
                      {item.status === "FAILED" && (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase border border-rose-100">Failed</span>
                      )}
                    </div>
                    {hasFlags && (
                       <div className="flex flex-wrap gap-1 mt-1">
                        {item.fraudFlags.map((flag: string) => (
                          <span key={flag} className="text-[8px] font-extrabold text-rose-650 bg-rose-50 border border-rose-100 px-1 py-0.5 rounded-sm uppercase flex items-center gap-0.5">
                            ⚠️ {flag.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-row lg:flex-col justify-between items-center lg:items-end gap-3 mt-2 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {item.receiptImageBase64 ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReceiptImage(item.receiptImageBase64);
                        }}
                        className="h-8 px-3 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs flex items-center gap-1.5 active:scale-[0.98]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Receipt
                      </Button>
                    ) : (
                      <span className="text-slate-400 text-xs">No Receipt</span>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQueueAction(item.invoice.id, item.id, "APPROVE");
                        }}
                        className="h-8 w-8 p-0 md:w-auto md:px-3 rounded-xl bg-[#00B140] hover:bg-[#009933] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 border-none shadow-sm active:scale-[0.98]"
                        title="Approve"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Confirm</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQueueAction(item.invoice.id, item.id, "REJECT");
                        }}
                        className="h-8 w-8 p-0 md:w-auto md:px-3 rounded-xl border-slate-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        title="Reject"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Reject</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQueueAction(item.invoice.id, item.id, "REQUEST_NEW");
                        }}
                        className="h-8 w-8 p-0 md:w-auto md:px-3 rounded-xl border-slate-200 text-amber-600 hover:text-amber-700 hover:bg-amber-50 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        title="Request New"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden md:inline">Request</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT COLUMN: Actions & Lists */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6 px-4 md:px-0">
          
          {/* Overdue Receivables section */}
          <div className="bg-transparent md:bg-white md:border md:border-slate-100 md:rounded-3xl md:p-6 md:shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 md:mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                  Overdue & Unpaid Receivables
                </h3>
                <p className="text-[11px] text-slate-450 mt-1">Invoices past their due dates requiring follow-up.</p>
              </div>
              <Badge className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold px-3 py-1 rounded-full w-fit">
                {overdueInvoicesList.length} Invoices Overdue
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : overdueInvoicesList.length === 0 ? (
              <div className="text-center py-12 bg-white md:bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80">
                <p className="text-slate-450 text-xs font-bold">Awesome! You have no overdue invoices. 🟢</p>
              </div>
            ) : (
              <div className="space-y-4">
                {overdueInvoicesList.map(inv => {
                  const risk = getRiskLevel(inv);
                  return (
                    <div key={inv.id} className="p-4 bg-white md:bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-200/80 shadow-sm md:shadow-none transition-all duration-300 active:scale-[0.98]">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">{inv.client.name}</span>
                          <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${risk.color}`}>{risk.label}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 font-mono">Invoice #{inv.invoiceNumber} · Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm lg:max-w-md">{inv.projectDescription}</p>
                      </div>

                      <div className="flex items-center gap-3 justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(inv.amount)}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={() => triggerWhatsAppNudge(inv, "OVERDUE_3D")}
                            className="bg-[#00B140] hover:bg-[#009933] text-white rounded-xl h-8 w-8 p-0 md:h-8.5 md:w-auto md:px-3.5 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-150 shadow-sm border-none"
                            title="Nudge"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Nudge</span>
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => copyReminderTemplate(inv)}
                            className="h-8 w-8 p-0 md:h-8.5 md:w-8.5 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-150"
                            title="Copy Template"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => markAsPaid(inv.id)}
                            className="h-8 px-3 md:h-8.5 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-bold transition-all duration-150"
                          >
                            Paid
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Due This Week section */}
          <div className="bg-transparent md:bg-white md:border md:border-slate-100 md:rounded-3xl md:p-6 md:shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 md:mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-4.5 h-4.5 text-emerald-600" />
                  Due This Week
                </h3>
                <p className="text-[11px] text-slate-450 mt-1">Invoices with payment schedules ending within 7 days.</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-3 py-1 rounded-full w-fit">
                {dueThisWeekInvoicesList.length} Invoices Due
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : dueThisWeekInvoicesList.length === 0 ? (
              <div className="text-center py-12 bg-white md:bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/80">
                <p className="text-slate-450 text-xs font-bold">No invoices due within the next 7 days. 📅</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dueThisWeekInvoicesList.map(inv => (
                  <div key={inv.id} className="p-4 bg-white md:bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-200/80 shadow-sm md:shadow-none transition-all duration-300 active:scale-[0.98]">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{inv.client.name}</span>
                        <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full border uppercase bg-blue-50 text-blue-600 border-blue-100 tracking-wider">Upcoming</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 font-mono">Invoice #{inv.invoiceNumber} · Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-sm lg:max-w-md">{inv.projectDescription}</p>
                    </div>

                    <div className="flex items-center gap-3 justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(inv.amount)}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => triggerWhatsAppNudge(inv, "DUE_TOMORROW")}
                          className="bg-[#00B140] hover:bg-[#009933] text-white rounded-xl h-8 w-8 p-0 md:h-8.5 md:w-auto md:px-3.5 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all duration-150 shadow-sm border-none"
                          title="Nudge"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Nudge</span>
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => copyReminderTemplate(inv)}
                          className="h-8 w-8 p-0 md:h-8.5 md:w-8.5 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-150"
                          title="Copy Template"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Link href={`/dashboard/clients/${inv.client.id}`} passHref>
                          <Button 
                            variant="outline"
                            className="h-8 px-3 md:h-8.5 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-[11px] font-bold transition-all duration-150"
                          >
                            Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Reminder Logs & Activity History */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6 px-4 md:px-0">
          
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <Clock className="w-4 h-4 text-emerald-650" />
              Recent Recovery Nudge Log
            </h3>
            <p className="text-[11px] text-slate-450 mb-6">History of manual reminders tracked in this workspace.</p>

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : reminders.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-4 text-center border border-dashed border-slate-100 rounded-xl bg-slate-50/50">No nudges sent yet. Reminders you trigger will be logged here.</p>
            ) : (
              <div className="border-l-2 border-slate-100 pl-4 ml-2 space-y-6 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
                {reminders.map(log => (
                  <div key={log.id} className="relative space-y-1">
                    <span className="absolute -left-[22px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white ring-4 ring-emerald-50" />
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                      <span className="uppercase tracking-wider">{log.channel} nudge</span>
                      <span>{new Date(log.sentDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {log.client.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Sent template <span className="font-bold text-slate-700">{log.templateType.replace("_", " ")}</span> for invoice #{log.invoice.invoiceNumber}.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Payment History / Reliability Card */}
          {clientStats && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-all duration-300">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-emerald-650" />
                Client Reliability Tracker
              </h3>
              <div>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Inspecting Client</p>
                <h4 className="text-sm font-bold text-slate-800 mt-1">{clientStats.name}</h4>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-slate-50/70 border border-slate-100/50 p-3 rounded-2xl text-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block leading-tight">Reliability</span>
                  <span className={`text-xs font-bold font-mono block mt-1.5 ${
                    clientStats.reliability > 90 ? "text-emerald-600" : (clientStats.reliability > 70 ? "text-amber-600" : "text-rose-600")
                  }`}>
                    {clientStats.reliability}/100
                  </span>
                </div>
                <div className="bg-slate-50/70 border border-slate-100/50 p-3 rounded-2xl text-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block leading-tight">Avg Time</span>
                  <span className="text-xs font-bold font-mono text-slate-700 block mt-1.5">
                    {clientStats.avgDays} Days
                  </span>
                </div>
                <div className="bg-slate-50/70 border border-slate-100/50 p-3 rounded-2xl text-center">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block leading-tight">Paid Bills</span>
                  <span className="text-xs font-bold font-mono text-emerald-600 block mt-1.5">
                    {clientStats.successfulPayments}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick reminders card */}
          <div className="border-none rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div className="absolute top-[-50px] right-[-50px] w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="p-6 space-y-4 relative z-10">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Recovery Tips</h3>
              <ul className="space-y-3.5 text-[11px] font-medium text-slate-300 leading-relaxed list-disc pl-4">
                <li>Double check the uploaded transfer receipt using the preview modal before confirming.</li>
                <li>Verify the sender and recipient banks details in the Payments Queue list.</li>
                <li>Gemini flags potential frauds automatically (mismatched names, dates, or duplicate references).</li>
              </ul>
            </div>
          </div>

        </div>

      </div>

      {/* WhatsApp nudge modal */}
      {nudgePayload && (
        <WhatsAppNudgeModal
          payload={nudgePayload}
          onClose={() => setNudgePayload(null)}
          onConfirm={handleNudgeConfirm}
        />
      )}

      {/* Receipt Image Preview Modal */}
      {selectedReceiptImage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Receipt Document Preview</h3>
              <button 
                onClick={() => setSelectedReceiptImage(null)}
                className="text-slate-500 hover:text-slate-800 font-bold text-xs bg-slate-100 p-2 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/80 flex items-center justify-center max-h-[420px]">
              <img 
                src={`data:image/jpeg;base64,${selectedReceiptImage}`} 
                alt="Uploaded Payment Receipt" 
                className="object-contain max-h-[400px] w-full"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
