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
  ShieldCheck
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
  const [isLoading, setIsLoading] = useState(true);
  const { addNotification } = useNotifications();

  // WhatsApp nudge modal state
  const [nudgePayload, setNudgePayload] = useState<WhatsAppNudgePayload | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [invRes, remRes] = await Promise.all([
        fetch("/api/invoices?_t=" + Date.now(), { cache: "no-store" }),
        fetch("/api/reminders?_t=" + Date.now(), { cache: "no-store" })
      ]);

      if (invRes.ok && remRes.ok) {
        const invoicesData = await invRes.json();
        const remindersData = await remRes.json();

        setInvoices(invoicesData);
        setReminders(remindersData);

        if (userEmail) {
          localStorage.setItem(`kavio_cached_invoices_${userEmail}`, JSON.stringify(invoicesData));
          localStorage.setItem(`kavio_cached_reminders_${userEmail}`, JSON.stringify(remindersData));
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
      .filter((inv) => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status))
      .reduce((acc, inv) => acc + (inv.amount || 0), 0);
  }, [invoices]);

  const overdueSum = useMemo(() => {
    const now = new Date();
    return invoices
      .filter((inv) => {
        const isOverdueStatus = inv.status === "OVERDUE";
        const isPastDue = new Date(inv.dueDate) < now && inv.status !== "PAID" && inv.status !== "DRAFT";
        return isOverdueStatus || isPastDue;
      })
      .reduce((acc, inv) => acc + (inv.amount || 0), 0);
  }, [invoices]);

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
      const isPastDue = new Date(inv.dueDate) < now && inv.status !== "PAID" && inv.status !== "DRAFT";
      return isOverdueStatus || isPastDue;
    });
  }, [invoices]);

  const dueThisWeekInvoicesList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    return invoices.filter(inv => {
      if (inv.status === "PAID" || inv.status === "DRAFT") return false;
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

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Collections Center</h2>
          <p className="text-slate-500 text-xs font-semibold">Active follow-ups, payment reminders, and WhatsApp nudges.</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Recovered</p>
            <h4 className="text-base font-black text-emerald-600 font-mono">{formatCurrency(recoveredSum)}</h4>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding Revenue</p>
              <h3 className="text-2xl font-black text-slate-800 font-mono mt-1">{formatCurrency(outstandingSum)}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Pending client settlement</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-655 flex items-center justify-center border border-slate-100">
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Overdue Revenue</p>
              <h3 className="text-2xl font-black text-rose-650 font-mono mt-1">{formatCurrency(overdueSum)}</h3>
              <p className="text-[10px] text-rose-450 font-medium mt-1">Action required immediately</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none rounded-2xl shadow-sm bg-white overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Nudge Logs Count</p>
              <h3 className="text-2xl font-black text-emerald-700 font-mono mt-1">{reminders.length} Logs</h3>
              <p className="text-[10px] text-emerald-600 font-medium mt-1">Active nudges sent this month</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Actions & Lists */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Overdue Receivables section */}
          <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                  Overdue & Unpaid Receivables
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Invoices past their due dates requiring follow-up.</p>
              </div>
              <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold">
                {overdueInvoicesList.length} Invoices Overdue
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-450" />
              </div>
            ) : overdueInvoicesList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-bold">Awesome! You have no overdue invoices. 🟢</p>
              </div>
            ) : (
              <div className="space-y-4">
                {overdueInvoicesList.map(inv => {
                  const risk = getRiskLevel(inv);
                  return (
                    <div key={inv.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-200 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800">{inv.client.name}</span>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border uppercase ${risk.color}`}>{risk.label}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 font-mono">Invoice #{inv.invoiceNumber} · Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm">{inv.projectDescription}</p>
                      </div>

                      <div className="flex items-center gap-3 justify-between md:justify-end">
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800 font-mono">{formatCurrency(inv.amount)}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={() => triggerWhatsAppNudge(inv, "OVERDUE_3D")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-8 px-3 text-[10px] font-bold flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Nudge
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => copyReminderTemplate(inv)}
                            className="h-8 w-8 p-0 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-100"
                            title="Copy Template"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => markAsPaid(inv.id)}
                            className="h-8 px-2.5 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-100 text-[10px] font-bold"
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
          <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-4.5 h-4.5 text-emerald-600" />
                  Due This Week
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Invoices with payment schedules ending within 7 days.</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                {dueThisWeekInvoicesList.length} Invoices Due
              </Badge>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-450" />
              </div>
            ) : dueThisWeekInvoicesList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-bold">No invoices due within the next 7 days.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dueThisWeekInvoicesList.map(inv => (
                  <div key={inv.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-200 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">{inv.client.name}</span>
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full border uppercase bg-blue-50 text-blue-600 border-blue-200">Upcoming</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 font-mono">Invoice #{inv.invoiceNumber} · Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-sm">{inv.projectDescription}</p>
                    </div>

                    <div className="flex items-center gap-3 justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800 font-mono">{formatCurrency(inv.amount)}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => triggerWhatsAppNudge(inv, "DUE_TOMORROW")}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-8 px-3 text-[10px] font-bold flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Nudge
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => copyReminderTemplate(inv)}
                          className="h-8 w-8 p-0 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-100"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Link href={`/dashboard/clients/${inv.client.id}`} passHref>
                          <Button 
                            variant="outline"
                            className="h-8 px-2.5 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-100 text-[10px] font-bold"
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
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-4">
              <Clock className="w-4 h-4 text-emerald-600" />
              Recent Recovery Nudge Log
            </h3>
            <p className="text-[10px] text-slate-400 mb-6">Logs of manual reminders tracked in this workspace.</p>

            {isLoading ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : reminders.length === 0 ? (
              <p className="text-xs text-slate-400">No nudges sent yet. Reminders you trigger will be logged here.</p>
            ) : (
              <div className="border-l border-slate-100 pl-4 ml-2 space-y-6 max-h-[420px] overflow-y-auto pr-2">
                {reminders.map(log => (
                  <div key={log.id} className="relative space-y-1">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white ring-4 ring-emerald-50" />
                    <div className="flex justify-between items-center text-[8px] font-bold text-slate-400">
                      <span className="uppercase">{log.channel} nudge</span>
                      <span>{new Date(log.sentDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 leading-tight">
                      {log.client.name}
                    </p>
                    <p className="text-[10px] text-slate-450 font-medium">
                      Sent template <span className="font-bold text-slate-600">{log.templateType.replace("_", " ")}</span> for invoice #{log.invoice.invoiceNumber}.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick reminders card */}
          <Card className="border-none rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl">
            <CardContent className="p-6 space-y-4">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">Recovery Tips</h3>
              <ul className="space-y-3.5 text-[11px] font-semibold text-slate-300 leading-relaxed list-disc pl-4">
                <li>Send reminders 1 day before due date (due tomorrow nudge).</li>
                <li>Polite but direct follow-up on WhatsApp has a 3x higher response rate than email.</li>
                <li>Once paid, mark invoice paid instantly to trigger client score positive updates.</li>
              </ul>
            </CardContent>
          </Card>

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

    </div>
  );
}
