"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  Copy, 
  CheckCircle,
  Clock,
  Sparkles,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface LineItem {
  description: string;
  qty: number;
  rate: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();

  // Invoice State
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "Consulting Services", qty: 1, rate: 150000 },
  ]);
  const [notes, setNotes] = useState("");

  // Default initial dates and number
  useEffect(() => {
    const today = new Date();
    const formattedToday = today.toISOString().split("T")[0];
    setDate(formattedToday);

    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    setDueDate(thirtyDaysLater.toISOString().split("T")[0]);

    // Generate random invoice number
    const rand = Math.floor(100 + Math.random() * 900);
    setInvoiceNumber(`INV-2026-${rand}`);
  }, []);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  };

  const addItem = () => {
    setItems([...items, { description: "", qty: 1, rate: 0 }]);
  };

  const removeItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const updateItem = (idx: number, field: keyof LineItem, val: string | number) => {
    const updated = [...items];
    if (field === "description") {
      updated[idx].description = String(val);
    } else {
      updated[idx][field] = Number(val);
    }
    setItems(updated);
  };

  const handleSave = (status: "PAID" | "UNPAID" | "DRAFT") => {
    if (!clientName || !clientEmail) {
      alert("Please fill out the client name and email.");
      return;
    }

    const newInvoice = {
      id: `inv-${Date.now()}`,
      number: invoiceNumber,
      clientName,
      clientEmail,
      date,
      dueDate,
      items,
      status,
      notes,
    };

    const saved = localStorage.getItem("kavio_invoices");
    let currentInvoices = [];
    if (saved) {
      try {
        currentInvoices = JSON.parse(saved);
      } catch (e) {}
    }
    
    currentInvoices = [newInvoice, ...currentInvoices];
    localStorage.setItem("kavio_invoices", JSON.stringify(currentInvoices));

    alert(`Invoice ${invoiceNumber} created as ${status}!`);
    router.push("/dashboard/invoices");
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-16 h-full min-h-[calc(100vh-140px)]">
      
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

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1 items-start">
        
        {/* Left Pane: Input Form */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">Invoice Details</h2>
          <Separator className="bg-slate-50" />

          {/* Client Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Name</label>
              <Input
                type="text"
                placeholder="e.g. Paystack Nigeria"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="py-5 border-slate-200 focus-visible:ring-emerald-500 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Email</label>
              <Input
                type="email"
                placeholder="billing@client.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="py-5 border-slate-200 focus-visible:ring-emerald-500 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Invoice Meta Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice No.</label>
              <Input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="py-5 border-slate-200 focus-visible:ring-emerald-500 rounded-xl font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issue Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="py-5 border-slate-200 focus-visible:ring-emerald-500 rounded-xl text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="py-5 border-slate-200 focus-visible:ring-emerald-500 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Line Items</label>
              <Button
                type="button"
                onClick={addItem}
                className="text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/50 py-1.5 px-3 rounded-lg h-auto flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex-1 space-y-1 min-w-0">
                    <Input
                      type="text"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                      className="border-slate-200 focus-visible:ring-emerald-500 rounded-xl text-xs py-4 bg-white"
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.qty || ""}
                      onChange={(e) => updateItem(idx, "qty", e.target.value)}
                      className="border-slate-200 focus-visible:ring-emerald-500 rounded-xl text-xs py-4 bg-white font-mono text-center"
                    />
                  </div>
                  <div className="w-36">
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={item.rate || ""}
                      onChange={(e) => updateItem(idx, "rate", e.target.value)}
                      className="border-slate-200 focus-visible:ring-emerald-500 rounded-xl text-xs py-4 bg-white font-mono text-right"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length <= 1}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-rose-500 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terms & Settlement Instructions</label>
            <textarea
              placeholder="e.g. Bank transfer to Kavio Bank - Acct No. 0123456789"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-24 p-4 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

        </div>

        {/* Right Pane: Live Mockup Preview */}
        <div className="bg-slate-100 border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between items-center xl:sticky xl:top-8 min-h-[600px] overflow-hidden relative shadow-inner">
          <div className="absolute top-4 left-6 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            Live preview (updated real-time)
          </div>

          {/* Dynamic Invoice sheet */}
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-[24px] shadow-2xl p-8 sm:p-12 space-y-8 my-auto relative overflow-hidden flex flex-col justify-between">
            {/* Top design header */}
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
                  <p className="font-bold text-slate-800">{clientName || "(Client Name)"}</p>
                  <p className="text-slate-400 truncate">{clientEmail || "(billing@client.com)"}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed On:</span>
                  <p className="font-medium text-slate-600">{date || "YYYY-MM-DD"}</p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-2 mb-1">Due By:</span>
                  <p className="font-bold text-rose-500">{dueDate || "YYYY-MM-DD"}</p>
                </div>
              </div>

              {/* Items Preview Table */}
              <div className="pt-4 border-t border-slate-50">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-50 pb-2">
                      <th className="py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                      <th className="py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center w-12">Qty</th>
                      <th className="py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right w-24">Rate</th>
                      <th className="py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 font-bold text-slate-700 max-w-[150px] truncate">
                          {item.description || "(No description)"}
                        </td>
                        <td className="py-3 text-center text-slate-500 font-semibold font-mono">
                          {item.qty}
                        </td>
                        <td className="py-3 text-right text-slate-500 font-semibold font-mono">
                          ₦ {item.rate.toLocaleString()}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-800 font-mono">
                          ₦ {(item.qty * item.rate).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Settlement / Total */}
              <div className="pt-4 border-t border-slate-50 flex items-start justify-between">
                <div className="max-w-[200px] text-[10px] text-slate-400 leading-relaxed font-semibold">
                  {notes ? (
                    <p className="truncate max-w-[180px]">Note: {notes}</p>
                  ) : (
                    "Settlement processed instantly via Kavio Direct Rails."
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Due</span>
                  <span className="text-lg font-black text-slate-800 font-mono block mt-1">
                    ₦ {calculateSubtotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer with conversion anchor */}
            <div className="pt-8 mt-8 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-semibold flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                Verified Bank Grade Invoice
              </span>
              <span className="font-black text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 scale-95 uppercase tracking-wide">
                Powered by Kavio
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 py-4 px-8 flex items-center justify-end gap-3 z-40 md:pl-72 shadow-2xl">
        <Button
          onClick={() => handleSave("DRAFT")}
          className="bg-transparent hover:bg-slate-800 text-slate-300 font-bold text-xs py-5 px-5 rounded-xl border border-slate-700 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Draft
        </Button>
        <Button
          onClick={() => handleSave("UNPAID")}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-xs py-5 px-6 rounded-xl border-none shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Send className="w-4 h-4 mr-2" />
          Send Invoice
        </Button>
      </div>

    </div>
  );
}
