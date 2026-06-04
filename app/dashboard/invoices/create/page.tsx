"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Send, 
  Loader2,
  CreditCard,
  Building2,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/app/context/NotificationContext";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string | null;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { addNotification } = useNotifications();

  // Database clients lists
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // Invoice Form State
  const [selectedClientId, setSelectedClientId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  
  // Client details caching
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch clients lists on mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoadingClients(true);
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Failed to load clients:", e);
      } finally {
        setIsLoadingClients(false);
      }
    };

    loadClients();

    // Default dates and numbers
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    setDueDate(thirtyDaysLater.toISOString().split("T")[0]);

    const rand = Math.floor(100 + Math.random() * 900);
    setInvoiceNumber(`INV-2026-${rand}`);
  }, []);

  // Update email/name when client is selected
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setClientEmail(client.email);
    } else {
      setClientName("");
      setClientEmail("");
    }
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      alert("Please select a client from your directory.");
      return;
    }
    if (!invoiceNumber || !amount || !dueDate || !projectDescription) {
      alert("Please fill in all invoice details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          invoiceNumber,
          amount: parseFloat(amount),
          dueDate,
          projectDescription,
          paymentInstructions
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create invoice");
      }

      addNotification({
        type: "SUCCESS",
        title: "Invoice Generated",
        message: `Invoice ${invoiceNumber} created and sent tracking status.`,
      });

      router.push("/dashboard/invoices");
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-24 h-full min-h-[calc(100vh-140px)]">
      
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices" passHref legacyBehavior>
          <button className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice Factory</span>
          <h1 className="text-xl font-bold text-slate-800">New Billable Client Document</h1>
        </div>
      </div>

      <form onSubmit={handleSaveInvoice} className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1 items-start">
        
        {/* Left Pane: Input Form */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">Invoice Details</h2>
          <Separator className="bg-slate-50" />

          {/* Client Selector Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Select Client *</label>
            {isLoadingClients ? (
              <div className="flex items-center gap-2 text-slate-400 py-3 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading clients directory...
              </div>
            ) : clients.length === 0 ? (
              <div className="border border-slate-200 rounded-xl p-4 text-center space-y-2.5 bg-slate-50/50">
                <p className="text-xs text-slate-400 font-semibold">Your clients directory is empty.</p>
                <Link href="/dashboard/clients" className="no-underline block">
                  <Button type="button" className="text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 rounded-lg py-1 px-3">
                    Add Client Connection
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer font-semibold text-slate-700"
                  required
                >
                  <option value="">Select a Client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Project Details Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-440 uppercase tracking-widest block">Project / Work Description *</label>
            <Input
              type="text"
              placeholder="e.g. Lead Website UI/UX Design System"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="py-5 border-slate-200 focus-visible:ring-emerald-500 rounded-xl text-xs font-semibold"
              required
            />
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-440 uppercase tracking-widest block">Billing Amount (₦ NGN) *</label>
              <Input
                type="number"
                placeholder="150000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="py-5 border-slate-200 focus-visible:ring-emerald-500 rounded-xl text-xs font-mono font-bold"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-440 uppercase tracking-widest block">Due Date *</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="py-5 border-slate-200 focus-visible:ring-emerald-500 rounded-xl text-xs font-semibold"
                required
              />
            </div>
          </div>

          {/* Invoice Meta Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-440 uppercase tracking-widest block">Invoice Number</label>
            <Input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="py-5 border-slate-200 focus-visible:ring-emerald-500 rounded-xl font-mono text-xs"
              required
            />
          </div>

          {/* Payment instructions notes */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-440 uppercase tracking-widest block">Local Bank Transfer Instructions (Naira Account Details)</label>
            <textarea
              placeholder="e.g. Please transfer to: Adebayo Design Studio / Wema Bank / Acct: 0123456789"
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              className="w-full h-24 p-4 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-semibold"
              required
            />
          </div>

        </div>

        {/* Right Pane: Live Mockup Preview */}
        <div className="bg-slate-100 border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between items-center xl:sticky xl:top-8 min-h-[500px] overflow-hidden relative shadow-inner">
          <div className="absolute top-4 left-6 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            Live preview (updated real-time)
          </div>

          {/* Dynamic Invoice sheet */}
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-[24px] shadow-2xl p-8 sm:p-12 space-y-8 my-auto relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
            
            <div className="space-y-6">
              {/* Preview Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent tracking-tight">
                    Kavio Invoicing
                  </h2>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Nigeria's Freelancer OS</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoice ID</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">{invoiceNumber || "INV-XXXX-XXX"}</span>
                </div>
              </div>

              {/* Sender & Receiver Info */}
              <div className="grid grid-cols-2 gap-4 text-[11px] pt-4 border-t border-slate-50">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Prepared For:</span>
                  <p className="font-bold text-slate-800">{clientName || "(Select a client)"}</p>
                  <p className="text-slate-400 truncate">{clientEmail || "(billing@client.com)"}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Due By:</span>
                  <p className="font-bold text-rose-500">{dueDate || "YYYY-MM-DD"}</p>
                </div>
              </div>

              {/* Items Preview Table */}
              <div className="pt-4 border-t border-slate-50">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-50 pb-2">
                      <th className="py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                      <th className="py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr>
                      <td className="py-3 font-bold text-slate-700 max-w-[200px] truncate">
                        {projectDescription || "(Project description)"}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-800 font-mono">
                        ₦ {amount ? Number(amount).toLocaleString() : "0"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Settlement / Total */}
              <div className="pt-4 border-t border-slate-50 flex items-start justify-between">
                <div className="max-w-[200px] text-[10px] text-slate-400 leading-relaxed font-semibold">
                  {paymentInstructions ? (
                    <p className="truncate max-w-[180px] font-mono">Acct: {paymentInstructions.substring(0, 30)}...</p>
                  ) : (
                    "Settlement instructions will appear here."
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Due</span>
                  <span className="text-lg font-black text-slate-800 font-mono block mt-1">
                    ₦ {amount ? Number(amount).toLocaleString() : "0"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Naira Bank Grade Invoice
              </span>
              <span className="font-black text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 scale-95 uppercase tracking-wide">
                Powered by Kavio
              </span>
            </div>

          </div>

        </div>

      </form>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 py-4 px-8 flex items-center justify-end gap-3 z-40 md:pl-72 shadow-2xl">
        <Button
          type="button"
          onClick={handleSaveInvoice}
          disabled={isSubmitting || !selectedClientId}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-450 hover:to-emerald-550 text-white font-bold text-xs py-5 px-6 rounded-xl border-none shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send & Log Invoice
        </Button>
      </div>

    </div>
  );
}
