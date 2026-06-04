"use client";

import React, { useState } from "react";
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
  const {
    status,
    userEmail,
    invoices,
    clientsCount,
    outstandingSum,
    overdueSum,
    paidSum,
    formatCurrency,
    todayReadable,
    recordManualPayment,
    logReminder,
  } = useDashboardData();
  const { isInstallable: isPWAInstallable, triggerInstall: triggerPWAInstall } = usePWAInstall();

  // Payment Modal States
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

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

    // Log the reminder event to database
    logReminder(invoice.id, templateType, "WHATSAPP");

    // Redirect to WhatsApp
    const cleanPhone = invoice.client.phone.replace(/[^0-9+]/g, "");
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white text-slate-800 p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Revenue OS Dashboard
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

      {/* PWA App Installation Promotion Banner */}
      {isPWAInstallable && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-55/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top duration-300">
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
        <Card className="border border-slate-100 rounded-2xl shadow-sm bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/10 hover:border-amber-500/20 transition-all">
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
        <Card className="border border-slate-100 rounded-2xl shadow-sm bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/10 hover:border-rose-500/20 transition-all">
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
        <Card className="border border-slate-100 rounded-2xl shadow-sm bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10 hover:border-emerald-500/20 transition-all">
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
        <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white">
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

      {/* Main Action Area: Invoices Registry */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Active Accounts Receivable</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Politely chase overdue payments and record transfers</p>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Name</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount Owed</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Collections & Tracking Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {pendingInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="py-16 flex flex-col items-center gap-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-350">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-700">No pending collections!</h4>
                        <p className="text-xs text-slate-400 mt-1">You are 100% paid up. Create an invoice to begin tracking new client payments.</p>
                      </div>
                      <Link href="/dashboard/invoices/create" passHref legacyBehavior>
                        <Button className="mt-2 text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100/50 py-4 rounded-xl">
                          Create Your First Invoice
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4.5 px-4 font-mono font-bold text-slate-700">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4.5 px-4">
                      <p className="font-bold text-slate-800">{inv.client.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{inv.client.companyName || inv.client.email}</p>
                    </td>
                    <td className="py-4.5 px-4 font-mono font-bold text-slate-800">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="py-4.5 px-4 text-slate-500 font-medium">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-4.5 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-4.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Copy Shareable Link */}
                        <button
                          onClick={() => copyShareableLink(inv.id)}
                          className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-transparent rounded-lg transition-colors"
                          title="Copy Public Payment Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* WhatsApp Dropdown Trigger */}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              triggerWhatsAppNudge(inv, e.target.value);
                              e.target.value = ""; // Reset dropdown
                            }
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none"
                        >
                          <option value="">💬 Nudge Client...</option>
                          <option value="DUE_TOMORROW">Nudge: Due Tomorrow</option>
                          <option value="DUE_TODAY">Nudge: Due Today</option>
                          <option value="OVERDUE_3D">Nudge: 3 Days Overdue</option>
                          <option value="OVERDUE_7D">Nudge: Past Due Follow-up</option>
                        </select>

                        {/* Record manual payment */}
                        <Button
                          onClick={() => setSelectedInvoice(inv)}
                          className="py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg border-none"
                        >
                          Log Payment
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Logging Dialog / Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-6">
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
                  className="rounded-xl border-slate-100 bg-slate-50 text-slate-500 text-xs py-4 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Reference / Bank ID</label>
                <Input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. UBA/REF-839210"
                  className="rounded-xl border-slate-200 text-xs py-4"
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
                  className="rounded-xl border-slate-200 text-xs py-4"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-xl px-5 text-xs py-4 border-slate-200 font-semibold"
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
