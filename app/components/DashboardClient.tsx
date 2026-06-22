"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  Activity, 
  ArrowDownRight, 
  ArrowUpRight, 
  Plus, 
  MessageSquare,
  Mail,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  Loader2,
  Trash2,
  Copy,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Sparkles
} from "lucide-react";
import { useDashboardData, Invoice } from "@/app/hooks/useDashboardData";
import { usePWAInstall } from "@/app/hooks/usePWAInstall";
import WhatsAppNudgeModal, { WhatsAppNudgePayload } from "@/app/components/WhatsAppNudgeModal";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function DashboardClient() {
  const router = useRouter();
  const {
    status,
    isLoading,
    userEmail,
    invoices,
    clientsCount,
    clients,
    outstandingSum,
    overdueSum,
    paidSum,
    formatCurrency,
    todayReadable,
    recordManualPayment,
    logReminder,
  } = useDashboardData();
  const { isInstallable: isPWAInstallable, triggerInstall: triggerPWAInstall } = usePWAInstall();

  const [onboardingResponses, setOnboardingResponses] = useState<any>(null);
  const [greeting, setGreeting] = useState("Welcome back 👋");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning ☀️");
    else if (hour < 18) setGreeting("Good afternoon ☕");
    else setGreeting("Good evening 🌙");
  }, []);

  // Redirect to onboarding if not completed yet
  useEffect(() => {
    if (userEmail) {
      const onboarded = localStorage.getItem(`kavio_onboarded_${userEmail}`);
      if (onboarded !== "true") {
        router.push("/dashboard/onboarding");
      } else {
        const cached = localStorage.getItem(`kavio_onboarded_responses_${userEmail}`);
        if (cached) {
          try {
            setOnboardingResponses(JSON.parse(cached));
          } catch (e) {
            console.warn("Failed to parse onboarding responses", e);
          }
        }
      }
    }
  }, [userEmail, router]);

  // 1. Recent Invoices (limit to 5)
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [invoices]);

  // 2. Top Clients (sorted by total billed)
  const topClients = useMemo(() => {
    if (!clients || clients.length === 0) return [];
    return clients
      .map(client => {
        const clientInvoices = invoices.filter(inv => inv.client.id === client.id);
        const totalBilled = clientInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const totalPaid = clientInvoices.filter(inv => inv.status === "PAID").reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const outstanding = clientInvoices.filter(inv => ["SENT", "VIEWED", "OVERDUE"].includes(inv.status)).reduce((sum, inv) => sum + (inv.amount || 0), 0);
        return {
          ...client,
          totalBilled,
          totalPaid,
          outstanding
        };
      })
      .sort((a, b) => b.totalBilled - a.totalBilled)
      .slice(0, 5);
  }, [clients, invoices]);

  // 3. Overdue Clients (with unpaid invoices past due date)
  const overdueClients = useMemo(() => {
    if (!clients || clients.length === 0) return [];
    return clients
      .map(client => {
        const clientInvoices = invoices.filter(inv => inv.client.id === client.id);
        const overdueInvoices = clientInvoices.filter(inv => {
          const now = new Date();
          const isOverdueStatus = inv.status === "OVERDUE";
          const isPastDue = new Date(inv.dueDate) < now && inv.status !== "PAID" && inv.status !== "DRAFT";
          return isOverdueStatus || isPastDue;
        });
        const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        return {
          ...client,
          overdueCount: overdueInvoices.length,
          overdueAmount
        };
      })
      .filter(c => c.overdueCount > 0)
      .sort((a, b) => b.overdueAmount - a.overdueAmount);
  }, [clients, invoices]);

  // 4. Upcoming Due Dates (not Paid/Draft and due today or in the future, sorted earliest due first)
  const upcomingInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return invoices
      .filter(inv => {
        if (inv.status === "PAID" || inv.status === "DRAFT") return false;
        const due = new Date(inv.dueDate);
        return due >= today;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [invoices]);

  // 5. Client Reliability Rankings (health score based on overdue invoices)
  const reliabilityRankings = useMemo(() => {
    if (!clients || clients.length === 0) return [];
    return clients
      .map(client => {
        const clientInvoices = invoices.filter(inv => inv.client.id === client.id);
        const totalCount = clientInvoices.length;
        const overdueInvoices = clientInvoices.filter(inv => {
          const now = new Date();
          const isOverdueStatus = inv.status === "OVERDUE";
          const isPastDue = new Date(inv.dueDate) < now && inv.status !== "PAID" && inv.status !== "DRAFT";
          return isOverdueStatus || isPastDue;
        });
        const overdueCount = overdueInvoices.length;

        let riskStatus: "Reliable" | "Moderate" | "High Risk" = "Reliable";
        let healthScore = 100;

        if (totalCount === 0) {
          riskStatus = "Reliable";
          healthScore = 100;
        } else if (overdueCount > 1) {
          riskStatus = "High Risk";
          healthScore = Math.max(10, 100 - (overdueCount * 25));
        } else if (overdueCount === 1) {
          riskStatus = "Moderate";
          healthScore = 70;
        } else {
          riskStatus = "Reliable";
          healthScore = 95;
        }

        return {
          ...client,
          riskStatus,
          healthScore,
          totalCount
        };
      })
      .sort((a, b) => b.healthScore - a.healthScore);
  }, [clients, invoices]);

  // 6. Outstanding Aging (breakdown of money owed)
  const outstandingAging = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let withinWeek = 0;
    let withinMonth = 0;
    let overdue = 0;

    invoices.forEach(inv => {
      if (inv.status === "PAID" || inv.status === "DRAFT") return;
      const due = new Date(inv.dueDate);
      if (due < today) {
        overdue += inv.amount || 0;
      } else {
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          withinWeek += inv.amount || 0;
        } else {
          withinMonth += inv.amount || 0;
        }
      }
    });

    return { withinWeek, withinMonth, overdue };
  }, [invoices]);

  // Payment Modal States
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [invoiceTab, setInvoiceTab] = useState<"ALL" | "PENDING" | "PAID">("ALL");
  const [nudgePayload, setNudgePayload] = useState<WhatsAppNudgePayload | null>(null);

  // Manual payment modal handler
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsSubmittingPayment(true);
    const success = await recordManualPayment(
      selectedInvoice.id,
      paymentReference,
      paymentNotes
    );
    setIsSubmittingPayment(false);

    if (success) {
      setSelectedInvoice(null);
      setPaymentReference("");
      setPaymentNotes("");
    }
  };

  // Pre-populated WhatsApp reminder link generator
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
      // 7 days overdue or general check-in
      textMessage = `Hi ${invoice.client.name}, I hope this message finds you well. I'm checking in on the status of invoice ${invoice.invoiceNumber} (NGN ${invoice.amount.toLocaleString()}), which is now past due. You can find the payment instructions and bank details here: ${paymentLink}. Thank you!`;
    }

    setNudgePayload({
      invoiceId: invoice.id,
      clientName: invoice.client.name,
      clientPhone: invoice.client.phone || "",
      messageText: textMessage,
      templateType,
    });
  };

  const handleNudgeConfirm = (phone: string, payload: WhatsAppNudgePayload) => {
    logReminder(payload.invoiceId, payload.templateType, "WHATSAPP");

    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(payload.messageText)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Copy shareable link helper
  const copyShareableLink = (id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://kavio.finance";
    const invoiceUrl = `${origin}/invoice/${id}`;
    navigator.clipboard.writeText(invoiceUrl);
    alert(`Public invoice link copied to clipboard!\n${invoiceUrl}`);
  };

  const getStatusBadge = (invoiceStatus: string) => {
    switch (invoiceStatus) {
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
            <UserCheck className="w-3.5 h-3.5" />
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
          <Badge className="bg-slate-500/10 border border-slate-500/20 text-slate-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
            <FileText className="w-3.5 h-3.5" />
            Draft
          </Badge>
        );
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Loading your collections console...
          </p>
        </div>
      </div>
    );
  }

  // Segment pending invoices
  const pendingInvoices = invoices.filter(inv => inv.status !== "PAID" && inv.status !== "DRAFT");

  return (
    <div className="relative flex flex-col space-y-4 animate-in fade-in duration-500 pb-24 min-h-full px-4 md:px-8">
      {/* Background Decorative Blur Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-50/20 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Desktop Header Row */}
      <div className="hidden md:flex md:items-center justify-between gap-6 bg-white/80 backdrop-blur-md text-slate-800 p-8 rounded-[2rem] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative z-10">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Collections Dashboard
          </h1>
          <p className="text-slate-500 text-sm">
            Track outstanding balances, log payments, and nudge client accounts on time. As of {todayReadable}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/invoices/create" className="bg-[#00B140] hover:bg-[#009933] text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100 hover:translate-y-[-2px] active:translate-y-0 flex items-center gap-2 border-none cursor-pointer text-sm">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Mobile Native Hero & CTA */}
      <div className="md:hidden pt-6 pb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{greeting}</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{session?.user?.name || "Welcome"}</h1>
        <p className="text-sm text-slate-400 mt-1">As of {todayReadable}</p>
      </div>

      <div className="md:hidden relative z-10 w-full mb-2">
        <Link href="/dashboard/invoices/create" className="w-full bg-[#00B140] hover:bg-[#009933] text-white font-bold py-4 rounded-2xl min-h-[52px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform duration-100 no-underline text-base">
          <Plus className="w-5 h-5" />
          Create Invoice
        </Link>
      </div>

      {/* Mobile Recovery Tip Banner */}
      {onboardingResponses && (
        <div className="md:hidden bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 relative z-10 active:scale-[0.98] shadow-sm transition-transform duration-100 -mx-0">
          <div className="flex items-center gap-3">
            <div className="text-[#00B140] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-800 leading-snug break-words">
              {onboardingResponses.challenge === "late_payments" ? "Track and nudge late invoices." : "Monitor your due dates easily."}
            </p>
          </div>
          <Link href="/dashboard/collections" className="text-[#00B140] text-xs font-bold uppercase tracking-wider shrink-0 flex items-center no-underline">
            Open <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      )}
      
      {/* Desktop Onboarding Widgets */}
      <div className="hidden md:flex flex-col gap-4">
        {onboardingResponses && (
          <div className="bg-gradient-to-r from-emerald-50/50 to-white border border-slate-100 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4 text-left">
              <div className="text-[#00B140] shrink-0 p-2.5 bg-emerald-50 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {onboardingResponses.challenge === "late_payments" && "We've optimized your dashboard to track late invoices. Go to Collections to send quick WhatsApp nudges."}
                  {onboardingResponses.challenge === "tracking" && "We've highlighted outstanding balances below. Use the clients registry to track payment health."}
                  {onboardingResponses.challenge === "awkward_reminders" && "Kavio provides pre-written message templates. Click Nudge on any invoice to send a polite reminder."}
                  {!["late_payments", "tracking", "awkward_reminders"].includes(onboardingResponses.challenge) && "Use the Collections Center to monitor due dates and send pre-written payment links."}
                </p>
              </div>
            </div>
            <Link href="/dashboard/collections" className="bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all duration-200 shrink-0 flex items-center gap-2 border-none cursor-pointer hover:shadow-sm">
              Open Collections Center
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {isPWAInstallable && (
          <div className="bg-gradient-to-r from-emerald-50/50 to-white border border-slate-100 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4 text-left">
              <div className="text-[#00B140] shrink-0 p-2.5 bg-emerald-50 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-850">Install Kavio App</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add Kavio to your home screen for quick offline access and persistent collections tracking.
                </p>
              </div>
            </div>
            <button 
              onClick={triggerPWAInstall}
              className="bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all duration-200 shrink-0 flex items-center gap-2 border-none cursor-pointer hover:shadow-sm"
            >
              Add to Home Screen
            </button>
          </div>
        )}
      </div>

      {/* Aggregate Cards (Outstanding Revenue Dashboard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        
        {/* Total Outstanding */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all duration-100 relative z-10 flex flex-col justify-between min-h-[96px]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider leading-tight">Total<br/>Outstanding</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2 font-mono truncate">{formatCurrency(outstandingSum)}</h3>
        </div>

        {/* Total Overdue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all duration-100 relative z-10 flex flex-col justify-between min-h-[96px]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider leading-tight">Total<br/>Overdue</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight mt-2 font-mono truncate">{formatCurrency(overdueSum)}</h3>
        </div>

        {/* Total Recovered */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all duration-100 relative z-10 flex flex-col justify-between min-h-[96px]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider leading-tight">Total<br/>Recovered</span>
            <span className="w-2 h-2 rounded-full bg-[#00B140] shrink-0" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#00B140] tracking-tight mt-2 font-mono truncate">{formatCurrency(paidSum)}</h3>
        </div>

        {/* Total Invoices Count */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-all duration-100 relative z-10 flex flex-col justify-between min-h-[96px]">
          <div className="flex items-start justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider leading-tight">Tracked<br/>Invoices</span>
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2 font-mono truncate">{invoices.length}</h3>
        </div>
      </div>

      {/* Bento Layout Grid for Revenue OS Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left Columns (Invoices and Top Clients) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recent Invoices & Collections */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Recent Invoices & Collections</h2>
                <p className="text-xs text-slate-400 mt-0.5">Track, log payments, and nudge client accounts on time</p>
              </div>
              
              {/* Tab Filters */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl w-fit self-start sm:self-center">
                <button
                  onClick={() => setInvoiceTab("ALL")}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer ${
                    invoiceTab === "ALL" 
                      ? "bg-white text-emerald-700 border border-slate-100 shadow-sm" 
                      : "text-slate-400 hover:text-slate-700 bg-transparent"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setInvoiceTab("PENDING")}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer ${
                    invoiceTab === "PENDING" 
                      ? "bg-white text-emerald-700 border border-slate-100 shadow-sm" 
                      : "text-slate-400 hover:text-slate-700 bg-transparent"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setInvoiceTab("PAID")}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer ${
                    invoiceTab === "PAID" 
                      ? "bg-white text-emerald-700 border border-slate-100 shadow-sm" 
                      : "text-slate-400 hover:text-slate-700 bg-transparent"
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>

            <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-5">Invoice</th>
                    <th className="py-4 px-5">Client Name</th>
                    <th className="py-4 px-5">Amount Owed</th>
                    <th className="py-4 px-5">Due Date</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 text-sm">
                  {(() => {
                    const filtered = invoices.filter(inv => {
                      if (invoiceTab === "PENDING") return inv.status !== "PAID" && inv.status !== "DRAFT";
                      if (invoiceTab === "PAID") return inv.status === "PAID";
                      return true; // "ALL"
                    }).slice(0, 5);

                    if (isLoading) {
                      return (
                        <tr>
                          <td colSpan={6}>
                            <div className="py-12 flex flex-col items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading invoices...</p>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6}>
                            <div className="py-12 flex flex-col items-center gap-4 text-center">
                              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <CheckCircle className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="text-slate-650 font-semibold mt-4">No invoices in this view</h4>
                                <p className="text-slate-400 text-sm mt-1">Use the create invoice action to add collections logs.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/20 transition-colors duration-150 group">
                        <td className="py-4 px-5 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-4 px-5">
                          <p className="font-semibold text-slate-800 leading-tight">{inv.client.name}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{inv.client.companyName || inv.client.email}</p>
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-slate-900">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="py-4 px-5 text-slate-500 font-mono text-sm">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-5">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Copy Link */}
                            <button
                              onClick={() => copyShareableLink(inv.id)}
                              className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-700 border border-slate-100 rounded-xl transition-all duration-150 bg-transparent cursor-pointer"
                              title="Copy Public Link"
                              type="button"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Nudge (only if not paid) */}
                            {inv.status !== "PAID" && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    triggerWhatsAppNudge(inv, e.target.value);
                                    e.target.value = ""; // Reset
                                  }
                                }}
                                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-650 hover:text-slate-800 font-medium cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              >
                                <option value="">💬 Nudge...</option>
                                <option value="DUE_TOMORROW">Due Tomorrow</option>
                                <option value="DUE_TODAY">Due Today</option>
                                <option value="OVERDUE_3D">3 Days Overdue</option>
                                <option value="OVERDUE_7D">Past Due Check-in</option>
                              </select>
                            )}

                            {/* Log manual payment */}
                            {inv.status !== "PAID" ? (
                              <button
                                onClick={() => setSelectedInvoice(inv)}
                                className="py-1.5 px-3.5 bg-[#00B140] hover:bg-[#009933] text-white font-semibold text-xs rounded-xl border-none cursor-pointer hover:shadow-md hover:shadow-emerald-50 transition-all duration-200"
                              >
                                Log Pay
                              </button>
                            ) : (
                              <span className="text-xs text-emerald-700 font-semibold px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-100/80">Settled</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Link href="/dashboard/invoices" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition-all hover:underline">
                View All Invoices Hub
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Top Billing Clients */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300 relative z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Top Billing Clients</h2>
              <p className="text-xs text-slate-400 mt-0.5">Clients sorted by highest volume of total invoices billed</p>
            </div>

            <div className="overflow-x-auto bg-white rounded-2xl border border-slate-100 w-full">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-4 px-5">Client Name</th>
                    <th className="py-4 px-5">Company / Country</th>
                    <th className="py-4 px-5">Total Invoiced</th>
                    <th className="py-4 px-5">Total Settled</th>
                    <th className="py-4 px-5">Outstanding Owed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 text-sm">
                  {topClients.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="py-12 flex flex-col items-center gap-4 text-center">
                          <p className="text-slate-400 text-sm">No client data found. Start by adding a client inside the Clients Directory.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    topClients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/20 transition-colors duration-150">
                        <td className="py-4 px-5">
                          <Link href={`/dashboard/clients/${c.id}`} className="font-bold text-slate-900 hover:text-[#00B140] transition-colors block leading-tight">
                            {c.name}
                          </Link>
                          <span className="text-xs text-slate-400 font-mono mt-0.5">{c.email}</span>
                        </td>
                        <td className="py-4 px-5 font-medium text-slate-500">
                          {c.companyName || "Solo"} {c.location ? `• ${c.location}` : ""}
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-slate-900">
                          {formatCurrency(c.totalBilled)}
                        </td>
                        <td className="py-4 px-5 font-mono font-bold text-emerald-600">
                          {formatCurrency(c.totalPaid)}
                        </td>
                        <td className={`py-4 px-5 font-mono font-bold ${c.outstanding > 0 ? "text-amber-500" : "text-slate-400"}`}>
                          {formatCurrency(c.outstanding)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Link href="/dashboard/clients" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition-all hover:underline">
                Open Clients Directory
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* Right Column (Side Widgets) */}
        <div className="space-y-8">
                 {/* Money Owed Breakdown */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative z-10">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Money Owed Breakdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">Collections aging distribution</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Outstanding</span>
                  <span className="text-xl font-mono font-bold text-slate-900">{formatCurrency(outstandingSum)}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">Overdue Share</span>
                  <span className="text-xs font-mono font-bold text-rose-600">
                    {outstandingSum > 0 ? Math.round((overdueSum / outstandingSum) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Progress bar split */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                {outstandingSum > 0 ? (
                  <>
                    <div 
                      style={{ width: `${(outstandingAging.overdue / outstandingSum) * 100}%` }} 
                      className="bg-rose-500 h-full transition-all duration-350"
                      title={`Overdue: ${formatCurrency(outstandingAging.overdue)}`}
                    />
                    <div 
                      style={{ width: `${(outstandingAging.withinWeek / outstandingSum) * 100}%` }} 
                      className="bg-amber-500 h-full transition-all duration-350"
                      title={`Due within 7 days: ${formatCurrency(outstandingAging.withinWeek)}`}
                    />
                    <div 
                      style={{ width: `${(outstandingAging.withinMonth / outstandingSum) * 100}%` }} 
                      className="bg-emerald-500 h-full transition-all duration-350"
                      title={`Due later: ${formatCurrency(outstandingAging.withinMonth)}`}
                    />
                  </>
                ) : (
                  <div className="bg-emerald-500 w-full h-full" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100/80 text-xs font-medium text-slate-550">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Overdue</p>
                    <p className="font-mono text-slate-800 font-bold">{formatCurrency(outstandingAging.overdue)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">1-7 Days</p>
                    <p className="font-mono text-slate-800 font-bold">{formatCurrency(outstandingAging.withinWeek)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">8-30 Days</p>
                    <p className="font-mono text-slate-800 font-bold">{formatCurrency(outstandingAging.withinMonth)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Client Reliability Rankings */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative z-10">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Client Reliability Ratings</h3>
              <p className="text-xs text-slate-400 mt-0.5">Behavior assessment & risk tiers</p>
            </div>

            <div className="space-y-3">
              {reliabilityRankings.length === 0 ? (
                <p className="text-slate-400 text-xs py-2">No reliability rankings. Please log invoices to analyze payment speed.</p>
              ) : (
                reliabilityRankings.slice(0, 5).map((rank) => (
                  <div key={rank.id} className="flex items-center justify-between gap-4 p-2.5 bg-slate-50/40 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-all duration-200">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{rank.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{rank.companyName || "Solo Business"}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        rank.riskStatus === "Reliable" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100/50" 
                          : rank.riskStatus === "Moderate" 
                            ? "bg-amber-50 text-amber-700 border-amber-100/50" 
                            : "bg-rose-50 text-rose-600 border-rose-100/50"
                      }`}>
                        {rank.riskStatus === "Reliable" ? "Good" : rank.riskStatus === "Moderate" ? "Moderate" : "High Risk"}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-500">{rank.healthScore}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Due Dates */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative z-10">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Upcoming Due Dates</h3>
              <p className="text-xs text-slate-400 mt-0.5">Payments expected this week</p>
            </div>

            <div className="space-y-3">
              {upcomingInvoices.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs font-bold bg-emerald-50 text-emerald-700 py-2.5 px-4 rounded-2xl flex items-center justify-center gap-1.5 border border-emerald-100/50">
                    <CheckCircle className="w-3.5 h-3.5" />
                    No upcoming collections this week
                  </p>
                </div>
              ) : (
                upcomingInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-3 text-xs border-b border-slate-100/60 pb-3 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-slate-800 leading-tight">{inv.client.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-900">{formatCurrency(inv.amount)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Overdue Alerts */}
          {overdueClients.length > 0 && (
            <div className="bg-rose-50/50 border border-rose-100/80 rounded-3xl p-6 shadow-sm space-y-4 relative z-10 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <h3 className="text-sm font-bold text-rose-800 tracking-tight">Overdue Warnings</h3>
              </div>
              <p className="text-xs text-rose-600">The following clients are currently holding outstanding balances past their deadlines. Immediate chase advised:</p>
              
              <div className="space-y-2.5">
                {overdueClients.slice(0, 3).map((oc) => (
                  <div key={oc.id} className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800 truncate max-w-[120px]">{oc.name}</span>
                    <span className="text-rose-650 font-mono">{formatCurrency(oc.overdueAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Manual Payment Logging Dialog / Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-[#00B140]" />
            
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Record Manual Payment</h2>
              <p className="text-xs text-slate-400 mt-1">
                Log a direct transfer or card payment for invoice <strong>{selectedInvoice.invoiceNumber}</strong>.
              </p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Amount Received</label>
                <Input
                  type="text"
                  disabled
                  value={formatCurrency(selectedInvoice.amount)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm text-slate-500 focus:outline-none font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Payment Reference / Bank ID</label>
                <Input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UBA/REF-839210"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-200 placeholder:text-slate-300"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Internal Notes</label>
                <Input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via bank transfer to NGN account"
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#00B140] transition-all duration-200 placeholder:text-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="bg-transparent text-slate-400 hover:text-slate-650 text-sm font-semibold border-none cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="bg-[#00B140] hover:bg-[#009933] text-white font-semibold px-6 py-2.5 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-100 hover:translate-y-[-1px] active:translate-y-0 flex items-center gap-2 border-none cursor-pointer text-sm"
                >
                  {isSubmittingPayment && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Nudge Modal */}
      <WhatsAppNudgeModal
        payload={nudgePayload}
        onClose={() => setNudgePayload(null)}
        onConfirm={handleNudgeConfirm}
      />

    </div>
  );
}
