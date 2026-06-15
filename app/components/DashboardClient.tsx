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

    // Prompt user to verify/enter WhatsApp phone number
    const targetPhone = prompt(
      `Confirm WhatsApp Number for ${invoice.client.name} (include country code, e.g. +234):`,
      invoice.client.phone || "+234"
    );
    
    if (targetPhone === null) {
      return; // User cancelled
    }
    
    const validatedPhone = targetPhone.trim();
    if (!validatedPhone) {
      alert("A valid phone number is required to trigger WhatsApp nudges.");
      return;
    }

    // Log the reminder event to database
    logReminder(invoice.id, templateType, "WHATSAPP");

    // Redirect to WhatsApp
    const cleanPhone = validatedPhone.replace(/[^0-9+]/g, "");
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textMessage)}`;
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
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white text-slate-800 p-8 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Collections Dashboard
          </h1>
          <p className="text-slate-500 text-sm font-semibold">
            Track outstanding balances, log payments, and nudge clients on time. As of {todayReadable}.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Link href="/dashboard/invoices/create" passHref legacyBehavior>
            <Button className="py-6 px-6 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-450 hover:to-emerald-550 text-white shadow-lg shadow-emerald-500/20 border-none transition-all duration-200 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Onboarding Suggestion Widget */}
      {onboardingResponses && (
        <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Personalized Recovery Tip</h4>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                {onboardingResponses.challenge === "late_payments" && "We've optimized your dashboard to track late invoices. Go to Collections to send quick WhatsApp nudges."}
                {onboardingResponses.challenge === "tracking" && "We've highlighted outstanding balances below. Use the clients registry to track payment health."}
                {onboardingResponses.challenge === "awkward_reminders" && "Kavio provides pre-written message templates. Click Nudge on any invoice to send a polite reminder."}
                {!["late_payments", "tracking", "awkward_reminders"].includes(onboardingResponses.challenge) && "Use the Collections Center to monitor due dates and send pre-written payment links."}
              </p>
            </div>
          </div>
          <Link href="/dashboard/collections" passHref legacyBehavior>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold px-5 py-3.5 text-xs shrink-0 flex items-center gap-2 border-none">
              Open Collections Center
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* PWA App Installation Promotion Banner */}
      {isPWAInstallable && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Install Kavio App</h4>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Add Kavio to your home screen for quick offline access and persistent collections tracking.
              </p>
            </div>
          </div>
          <Button 
            onClick={triggerPWAInstall}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-5 py-4 text-xs shrink-0 flex items-center gap-2 shadow-md shadow-emerald-500/10 border-none"
          >
            <Sparkles className="w-4 h-4 text-amber-350" />
            Add to Home Screen
          </Button>
        </div>
      )}

      {/* Aggregate Cards (Outstanding Revenue Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Outstanding */}
        <Card className="border-none rounded-2xl shadow-sm bg-amber-500/5 hover:bg-amber-500/10 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Outstanding</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 font-mono tracking-tight">{formatCurrency(outstandingSum)}</h3>
            <p className="text-[10px] text-slate-550 font-semibold mt-1">Pending client payments</p>
          </CardContent>
        </Card>

        {/* Total Overdue */}
        <Card className="border-none rounded-2xl shadow-sm bg-rose-500/5 hover:bg-rose-500/10 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Overdue</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-rose-600 font-mono tracking-tight">{formatCurrency(overdueSum)}</h3>
            <p className="text-[10px] text-rose-500 font-semibold mt-1">Past due invoices</p>
          </CardContent>
        </Card>

        {/* Total Paid (This month / aggregate) */}
        <Card className="border-none rounded-2xl shadow-sm bg-emerald-500/5 hover:bg-emerald-500/10 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Recovered</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-emerald-600 font-mono tracking-tight">{formatCurrency(paidSum)}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">Total revenue collected</p>
          </CardContent>
        </Card>

        {/* Total Invoices Count */}
        <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tracked Invoices</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{invoices.length} Invoices</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Across {clientsCount} clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Bento Layout Grid for Revenue OS Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Invoices and Top Clients) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recent Invoices & Collections */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Invoices & Collections</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Track, log payments, and nudge client accounts on time</p>
              </div>
              
              {/* Tab Filters */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl w-fit self-start sm:self-center">
                <button
                  onClick={() => setInvoiceTab("ALL")}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                    invoiceTab === "ALL" 
                      ? "bg-white text-slate-800 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setInvoiceTab("PENDING")}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                    invoiceTab === "PENDING" 
                      ? "bg-white text-slate-800 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setInvoiceTab("PAID")}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                    invoiceTab === "PAID" 
                      ? "bg-white text-slate-800 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Paid
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100/40 bg-slate-50/30">
                    <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice</th>
                    <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Name</th>
                    <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount Owed</th>
                    <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                    <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
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
                              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-350">
                                <CheckCircle className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-700">No invoices in this view</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Use the create invoice action to add collections logs.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-4 font-mono font-bold text-slate-700">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-800">{inv.client.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{inv.client.companyName || inv.client.email}</p>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-slate-800">
                          {formatCurrency(inv.amount)}
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-medium">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Copy Link */}
                            <button
                              onClick={() => copyShareableLink(inv.id)}
                              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-transparent rounded-lg transition-colors animate-none bg-transparent"
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
                                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/50 text-slate-700 text-[10px] font-bold rounded-lg px-1.5 py-1 cursor-pointer focus:outline-none"
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
                              <Button
                                onClick={() => setSelectedInvoice(inv)}
                                className="py-0.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] rounded-lg border-none"
                              >
                                Log Pay
                              </Button>
                            ) : (
                              <span className="text-[10px] text-emerald-650 font-bold px-2 py-0.5 bg-emerald-50 rounded-md">Settled</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-100/40">
              <Link href="/dashboard/invoices" passHref legacyBehavior>
                <a className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5">
                  View All Invoices Hub
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </Link>
            </div>
          </div>

          {/* Top Billing Clients */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Top Billing Clients</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">Clients sorted by highest volume of total invoices billed</p>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100/40 bg-slate-50/30">
                    <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Name</th>
                    <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company / Country</th>
                    <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Invoiced</th>
                    <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Settled</th>
                    <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding Owed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {topClients.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="py-12 flex flex-col items-center gap-4 text-center">
                          <p className="text-[10px] text-slate-400">No client data found. Start by adding a client inside the Clients Directory.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    topClients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <Link href={`/dashboard/clients/${c.id}`} passHref legacyBehavior>
                            <a className="font-bold text-slate-805 hover:text-emerald-600 block">{c.name}</a>
                          </Link>
                          <span className="text-[10px] text-slate-400 font-semibold">{c.email}</span>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-505">
                          {c.companyName || "Solo"} {c.location ? `• ${c.location}` : ""}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-slate-800">
                          {formatCurrency(c.totalBilled)}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-emerald-600">
                          {formatCurrency(c.totalPaid)}
                        </td>
                        <td className={`py-4 px-4 font-mono font-bold ${c.outstanding > 0 ? "text-amber-600" : "text-slate-400"}`}>
                          {formatCurrency(c.outstanding)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100/40">
              <Link href="/dashboard/clients" passHref legacyBehavior>
                <a className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5">
                  Open Clients Directory
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </Link>
            </div>
          </div>

        </div>

        {/* Right Column (Side Widgets) */}
        <div className="space-y-8">
          
          {/* Money Owed Breakdown */}
          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Money Owed Breakdown</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Collections aging distribution</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Outstanding</span>
                  <span className="text-xl font-mono font-black text-slate-800">{formatCurrency(outstandingSum)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-rose-500 uppercase block">Overdue Share</span>
                  <span className="text-xs font-mono font-bold text-rose-650">
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
                      className="bg-rose-500 h-full"
                      title={`Overdue: ${formatCurrency(outstandingAging.overdue)}`}
                    />
                    <div 
                      style={{ width: `${(outstandingAging.withinWeek / outstandingSum) * 100}%` }} 
                      className="bg-amber-450 h-full"
                      title={`Due within 7 days: ${formatCurrency(outstandingAging.withinWeek)}`}
                    />
                    <div 
                      style={{ width: `${(outstandingAging.withinMonth / outstandingSum) * 100}%` }} 
                      className="bg-emerald-500 h-full"
                      title={`Due later: ${formatCurrency(outstandingAging.withinMonth)}`}
                    />
                  </>
                ) : (
                  <div className="bg-emerald-500 w-full h-full" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 text-[10px] font-semibold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <p className="text-[8px] text-slate-400 uppercase">Overdue</p>
                    <p className="font-mono text-slate-700 font-bold">{formatCurrency(outstandingAging.overdue)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-450 shrink-0" />
                  <div>
                    <p className="text-[8px] text-slate-400 uppercase">1-7 Days</p>
                    <p className="font-mono text-slate-700 font-bold">{formatCurrency(outstandingAging.withinWeek)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[8px] text-slate-400 uppercase">8-30 Days</p>
                    <p className="font-mono text-slate-700 font-bold">{formatCurrency(outstandingAging.withinMonth)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Client Reliability Rankings */}
          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Client Reliability Ratings</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Behavior assessment & risk tiers</p>
            </div>

            <div className="space-y-4">
              {reliabilityRankings.length === 0 ? (
                <p className="text-[10px] text-slate-400 py-2">No reliability rankings. Please log invoices to analyze payment speed.</p>
              ) : (
                reliabilityRankings.slice(0, 5).map((rank) => (
                  <div key={rank.id} className="flex items-center justify-between gap-4 p-2 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-all">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{rank.name}</p>
                      <p className="text-[9px] text-slate-400 font-semibold truncate">{rank.companyName || "Solo Business"}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                        rank.riskStatus === "Reliable" 
                          ? "bg-emerald-50 text-emerald-700" 
                          : rank.riskStatus === "Moderate" 
                            ? "bg-amber-50 text-amber-600" 
                            : "bg-rose-50 text-rose-650 font-black"
                      }`}>
                        {rank.riskStatus === "Reliable" ? "🟢 Good" : rank.riskStatus === "Moderate" ? "🟡 Moderate" : "🔴 High Risk"}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{rank.healthScore}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Due Dates */}
          <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Upcoming Due Dates</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Payments expected this week</p>
            </div>

            <div className="space-y-3">
              {upcomingInvoices.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-[10px] text-emerald-650 font-bold bg-emerald-50 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    No upcoming collections this week
                  </p>
                </div>
              ) : (
                upcomingInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-3 text-xs border-b border-slate-50 pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-bold text-slate-800">{inv.client.name}</p>
                      <p className="text-[9px] text-slate-400 font-mono font-bold">{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-slate-800">{formatCurrency(inv.amount)}</p>
                      <p className="text-[9px] text-slate-550 font-semibold">Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Overdue Alerts */}
          {overdueClients.length > 0 && (
            <div className="bg-rose-50/40 border border-rose-100/50 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <h3 className="text-sm font-black text-rose-900 tracking-tight">Overdue Warnings</h3>
              </div>
              <p className="text-[10px] text-rose-700 font-medium">The following clients are currently holding outstanding balances past their deadlines. Immediate chase advised:</p>
              
              <div className="space-y-2.5">
                {overdueClients.slice(0, 3).map((oc) => (
                  <div key={oc.id} className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 truncate max-w-[120px]">{oc.name}</span>
                    <span className="text-rose-650 font-mono font-bold">{formatCurrency(oc.overdueAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Manual Payment Logging Dialog / Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Record Manual Payment</h2>
              <p className="text-xs text-slate-500 mt-1">
                Log a direct transfer or card payment for invoice <strong>{selectedInvoice.invoiceNumber}</strong>.
              </p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Amount Received</label>
                <Input
                  type="text"
                  disabled
                  value={formatCurrency(selectedInvoice.amount)}
                  className="rounded-xl border-transparent bg-slate-50 text-slate-500 text-xs py-4 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Reference / Bank ID</label>
                <Input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UBA/REF-839210"
                  className="rounded-xl border-slate-200/50 text-xs py-4"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Internal Notes</label>
                <Input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via bank transfer to NGN account"
                  className="rounded-xl border-slate-200/50 text-xs py-4"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-xl px-5 text-xs py-4 border-slate-200/50 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="rounded-xl px-5 text-xs py-4 bg-emerald-600 text-white font-bold hover:bg-emerald-500 flex items-center gap-1.5"
                >
                  {isSubmittingPayment && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirm Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
