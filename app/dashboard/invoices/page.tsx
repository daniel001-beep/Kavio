"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Copy, 
  MoreVertical, 
  Trash2, 
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface InvoiceItem {
  description: string;
  qty: number;
  rate: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  status: "PAID" | "UNPAID" | "OVERDUE" | "DRAFT";
  notes?: string;
}

const BASELINE_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    number: "INV-2026-001",
    clientName: "Paystack Nigeria",
    clientEmail: "billing@paystack.com",
    date: "2026-05-15",
    dueDate: "2026-06-15",
    status: "UNPAID",
    items: [
      { description: "Lead UI/UX Redesign - Kavio Command Center", qty: 1, rate: 850000 },
      { description: "Frontend Architecture Consultation", qty: 10, rate: 25000 },
    ],
    notes: "Please process via direct bank transfer to our NGN ledger."
  },
  {
    id: "inv-2",
    number: "INV-2026-002",
    clientName: "Flutterwave Inc.",
    clientEmail: "finance@flutterwavego.com",
    date: "2026-05-01",
    dueDate: "2026-05-15",
    status: "PAID",
    items: [
      { description: "Mobile App Design System & Styleguide", qty: 1, rate: 1200000 },
    ],
  },
  {
    id: "inv-3",
    number: "INV-2026-003",
    clientName: "Brass Banking",
    clientEmail: "accounts@brass.co",
    date: "2026-04-10",
    dueDate: "2026-05-10",
    status: "OVERDUE",
    items: [
      { description: "Dribble Visual Mockups & Brand Assets", qty: 1, rate: 450000 },
    ],
  },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PAID" | "UNPAID" | "OVERDUE" | "DRAFT">("ALL");
  const [search, setSearch] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("kavio_invoices");
    if (saved) {
      try {
        setInvoices(JSON.parse(saved));
      } catch (e) {
        setInvoices(BASELINE_INVOICES);
      }
    } else {
      setInvoices(BASELINE_INVOICES);
      localStorage.setItem("kavio_invoices", JSON.stringify(BASELINE_INVOICES));
    }
  }, []);

  const calculateTotal = (invoice: Invoice) => {
    return invoice.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  };

  // Delete invoice
  const deleteInvoice = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      localStorage.setItem("kavio_invoices", JSON.stringify(updated));
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesFilter = filter === "ALL" ? true : inv.status === filter;
    const matchesSearch = 
      inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.number.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
            <CheckCircle className="w-3.5 h-3.5" />
            Paid
          </Badge>
        );
      case "UNPAID":
        return (
          <Badge className="bg-amber-500/10 border border-amber-500/20 text-amber-600 hover:bg-amber-500/20 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5" />
            Sent
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge className="bg-rose-500/10 border border-rose-500/20 text-rose-600 hover:bg-rose-500/20 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
            <AlertTriangle className="w-3.5 h-3.5" />
            Overdue
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge className="bg-slate-500/10 border border-slate-500/20 text-slate-600 hover:bg-slate-500/20 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit">
            <FileText className="w-3.5 h-3.5" />
            Draft
          </Badge>
        );
    }
  };

  const copyPaymentLink = (id: string) => {
    const dummyLink = `https://kavio.finance/pay/invoice-${id}`;
    navigator.clipboard.writeText(dummyLink);
    alert(`Payment link copied to clipboard!\n${dummyLink}`);
  };

  // Compute stat aggregates
  const totalInvoiced = invoices.reduce((sum, inv) => sum + calculateTotal(inv), 0);
  const settledAmount = invoices.filter(inv => inv.status === "PAID").reduce((sum, inv) => sum + calculateTotal(inv), 0);
  const outstandingAmount = invoices.filter(inv => inv.status === "UNPAID").reduce((sum, inv) => sum + calculateTotal(inv), 0);
  const overdueAmount = invoices.filter(inv => inv.status === "OVERDUE").reduce((sum, inv) => sum + calculateTotal(inv), 0);

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Invoice Factory</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Draft, send, and collect client payments instantly</p>
        </div>

        <Link href="/dashboard/invoices/create" passHref legacyBehavior>
          <Button className="py-6 px-6 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 border-none transition-all duration-200 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Aggregate Cards (Bento) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-slate-100 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 font-mono">₦ {totalInvoiced.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">All invoices drafted & sent</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settled Earnings</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 font-mono">₦ {settledAmount.toLocaleString()}</h3>
            <p className="text-[10px] text-emerald-500 font-semibold mt-1">Direct bank transfers confirmed</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 font-mono">₦ {outstandingAmount.toLocaleString()}</h3>
            <p className="text-[10px] text-amber-600 font-semibold mt-1">Awaiting client payment</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Alert</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 font-mono">₦ {overdueAmount.toLocaleString()}</h3>
            <p className="text-[10px] text-rose-500 font-semibold mt-1">Past due invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tab Filters */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["ALL", "PAID", "UNPAID", "OVERDUE", "DRAFT"] as const).map((t) => (
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
              className="pl-9 py-5 rounded-xl border-slate-200 focus-visible:ring-emerald-500 text-xs"
            />
          </div>

        </div>

        {/* Invoice Table list */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice No.</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sent Date</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="py-16 flex flex-col items-center gap-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-700">No invoices found</h4>
                        <p className="text-xs text-slate-400 mt-1">Create a new invoice and share payment link with clients.</p>
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
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4.5 px-4 font-mono font-bold text-slate-700">
                      {inv.number}
                    </td>
                    <td className="py-4.5 px-4">
                      <p className="font-bold text-slate-800">{inv.clientName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{inv.clientEmail}</p>
                    </td>
                    <td className="py-4.5 px-4 text-slate-500 font-medium">
                      {inv.date}
                    </td>
                    <td className="py-4.5 px-4 text-slate-500 font-medium">
                      {inv.dueDate}
                    </td>
                    <td className="py-4.5 px-4 font-mono font-bold text-slate-800">
                      ₦ {calculateTotal(inv).toLocaleString()}
                    </td>
                    <td className="py-4.5 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-4.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== "DRAFT" && (
                          <button
                            onClick={() => copyPaymentLink(inv.id)}
                            className="p-2 hover:bg-slate-50 text-slate-400 hover:text-emerald-500 border border-transparent rounded-lg transition-colors"
                            title="Copy Payment Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteInvoice(inv.id)}
                          className="p-2 hover:bg-slate-50 text-slate-400 hover:text-rose-500 border border-transparent rounded-lg transition-colors"
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

    </div>
  );
}
