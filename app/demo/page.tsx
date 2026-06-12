"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Plus,
  Copy,
  LayoutDashboard,
  ShieldCheck,
  Upload,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Search,
  MessageSquare,
  AlertCircle,
  Users
} from "lucide-react";

interface DemoInvoice {
  id: string;
  invoiceNumber: string;
  freelancerName: string;
  profession: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: "Paid" | "Pending" | "Overdue" | "Under Review";
  remindersActive: boolean;
}

export default function DemoPage() {
  // Demo Invoices Initial State
  const [invoices, setInvoices] = useState<DemoInvoice[]>([
    {
      id: "demo-1",
      invoiceNumber: "INV-2026-001",
      freelancerName: "Amina Bello",
      profession: "Software Developer",
      clientName: "Vanguard Tech Ltd",
      amount: 750000,
      dueDate: "2026-06-15",
      status: "Paid",
      remindersActive: false,
    },
    {
      id: "demo-2",
      invoiceNumber: "INV-2026-002",
      freelancerName: "Chidi Kalu",
      profession: "Graphic Designer",
      clientName: "Megacorp Agency",
      amount: 120000,
      dueDate: "2026-06-05",
      status: "Overdue",
      remindersActive: true,
    },
    {
      id: "demo-3",
      invoiceNumber: "INV-2026-003",
      freelancerName: "Tunde Oyelowo",
      profession: "Social Media Manager",
      clientName: "Apex Retailers",
      amount: 85050,
      dueDate: "2026-06-20",
      status: "Pending",
      remindersActive: true,
    },
    {
      id: "demo-4",
      invoiceNumber: "INV-2026-004",
      freelancerName: "Obinna Nwachukwu",
      profession: "Video Editor",
      clientName: "Stream Studio",
      amount: 350000,
      dueDate: "2026-06-12",
      status: "Under Review",
      remindersActive: false,
    },
    {
      id: "demo-5",
      invoiceNumber: "INV-2026-005",
      freelancerName: "Yemi Adebayo",
      profession: "Copywriter",
      clientName: "Echo Marketing",
      amount: 95000,
      dueDate: "2026-06-25",
      status: "Pending",
      remindersActive: true,
    },
  ]);

  // Selected Invoice for Receipt Verification Simulator
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("demo-3"); // Tunde Socials default
  const [simState, setSimState] = useState<"idle" | "uploading" | "scanning" | "matched" | "mismatched">("idle");
  const [progress, setProgress] = useState<number>(0);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [isCopied, setIsCopied] = useState<string | null>(null);

  // Active Selected Invoice Details helper
  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId) || invoices[2];

  // Run upload + scan simulator
  const runVerification = (type: "match" | "mismatch") => {
    setSimState("uploading");
    setProgress(0);
  };

  useEffect(() => {
    let timer: any;
    if (simState === "uploading") {
      timer = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(timer);
            setSimState("scanning");
            setProgress(0);
            return 100;
          }
          return p + 25;
        });
      }, 150);
    } else if (simState === "scanning") {
      timer = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(timer);
            // Completed scan, process match or mismatch result
            const matchStatus = selectedInvoiceId === "demo-3" ? "match" : (selectedInvoiceId === "demo-5" ? "match" : "mismatch");
            triggerResult(matchStatus);
            return 100;
          }
          return p + 10;
        });
      }, 200);
    }
    return () => clearInterval(timer);
  }, [simState]);

  const triggerResult = (outcome: "match" | "mismatch") => {
    if (outcome === "match") {
      setSimState("matched");
      // Set OCR data matching invoice exactly
      setOcrResult({
        amount: selectedInvoice.amount,
        accountNumber: "9928374829 (OPay)",
        date: new Date().toLocaleDateString() + " 11:24 AM",
        senderName: selectedInvoice.clientName,
        confidence: "98.7%",
      });

      // Update invoice list state
      setInvoices(prev => prev.map(inv => {
        if (inv.id === selectedInvoice.id) {
          return { ...inv, status: "Paid", remindersActive: false };
        }
        return inv;
      }));
    } else {
      setSimState("mismatched");
      // Set mismatched OCR data
      setOcrResult({
        amount: Math.round(selectedInvoice.amount * 0.9), // Mismatched amount
        accountNumber: "0028711621 (Access Bank)",
        date: new Date().toLocaleDateString() + " 09:15 AM",
        senderName: "Unknown Account",
        confidence: "42.1%",
        mismatchReasons: ["Amount does not match invoice", "Sender name could not be verified"],
      });

      // Update invoice list state
      setInvoices(prev => prev.map(inv => {
        if (inv.id === selectedInvoice.id) {
          return { ...inv, status: "Under Review" };
        }
        return inv;
      }));
    }
  };

  const resetSimulator = () => {
    setSimState("idle");
    setProgress(0);
    setOcrResult(null);
  };

  const handleCopyLink = (id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://kavio.finance";
    const paymentUrl = `${origin}/invoice/${id}`;
    navigator.clipboard.writeText(paymentUrl);
    setIsCopied(id);
    setTimeout(() => setIsCopied(null), 2000);
  };

  return (
    <div className="h-screen w-screen bg-[#f8fafc] flex flex-col overflow-hidden text-slate-800 font-sans fintech-layout-root">
      
      {/* Dynamic Demo Mode Warning Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 text-center text-xs font-black uppercase tracking-widest shrink-0 flex items-center justify-center gap-2 shadow-inner">
        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
        Demo Mode — Sample Data For Presentation Purposes
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col bg-white shrink-0 border-r border-slate-150 w-64 h-full p-6 justify-between shadow-sm">
          <div className="space-y-8">
            {/* Brand Title */}
            <div className="flex items-center gap-2 px-2">
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight">
                Kavio
              </span>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                DEMO
              </span>
            </div>

            {/* Navigation List */}
            <nav className="space-y-1.5">
              <Link
                href="/demo"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 border-l-2 border-emerald-500 transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <span>Demo Dashboard</span>
              </Link>
              <Link
                href="/founder-demo"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span>Founder Dashboard</span>
              </Link>
              <Link
                href="/pitch"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>OPay Pitch Deck</span>
              </Link>
            </nav>
          </div>

          {/* Sidebar Account Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="w-8.5 h-8.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-xs font-black">
                GJ
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-800 truncate">OPay Judge</p>
                <p className="text-[9px] font-bold text-slate-400 truncate">guest-judge@opay.com</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
            >
              <span>Exit Demo Mode</span>
            </Link>
          </div>
        </aside>

        {/* Main Console Viewport */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-hidden">
          
          {/* Mobile Topbar */}
          <header className="md:hidden bg-white border-b border-slate-100 h-16 px-6 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight">Kavio</span>
              <span className="text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">DEMO</span>
            </div>
            <div className="flex gap-1">
              <Link href="/demo" className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">Demo</Link>
              <Link href="/founder-demo" className="text-[11px] font-bold text-slate-550 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg">Founder</Link>
              <Link href="/pitch" className="text-[11px] font-bold text-slate-550 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg">Pitch</Link>
            </div>
          </header>

          {/* Inner Content Scroller */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 pb-24 md:pb-8">
            
            {/* Header Title Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Collections Dashboard
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm font-semibold">
                  Mock environment to demonstrate automated reminders and AI vision audits.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setInvoices(prev => prev.map(inv => {
                      if (inv.id === "demo-3" || inv.id === "demo-5") return { ...inv, status: "Pending", remindersActive: true };
                      if (inv.id === "demo-4") return { ...inv, status: "Under Review" };
                      return inv;
                    }));
                    resetSimulator();
                  }}
                  className="py-3 px-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Demo State
                </button>
              </div>
            </div>

            {/* aggregate cards (Bento Style metrics) */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              
              {/* Total volume */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between col-span-2">
                <div className="flex items-center justify-between mb-3 text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Total Invoices</span>
                  <FileText className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">₦18,750,000</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">1,250 invoices created platform-wide</p>
                </div>
              </div>

              {/* Collected */}
              <div className="bg-emerald-50/20 border border-emerald-500/10 p-5 rounded-2xl shadow-sm hover:border-emerald-500/20 transition-all flex flex-col justify-between col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between mb-3 text-emerald-600">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Collected Revenue</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-600 font-mono tracking-tight">₦15,400,000</h3>
                  <p className="text-[10px] text-emerald-500/80 font-bold mt-1">82% collection efficiency</p>
                </div>
              </div>

              {/* Outstanding */}
              <div className="bg-amber-50/20 border border-amber-500/10 p-5 rounded-2xl shadow-sm hover:border-amber-500/20 transition-all flex flex-col justify-between col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between mb-3 text-amber-600">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Outstanding</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-amber-600 font-mono tracking-tight">₦3,350,000</h3>
                  <p className="text-[10px] text-amber-500/80 font-bold mt-1">Pending verification</p>
                </div>
              </div>

              {/* Success Rate */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between col-span-1">
                <div className="flex items-center justify-between mb-3 text-slate-450">
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">Reminder Success</span>
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 font-mono tracking-tight">94%</h3>
                  <p className="text-[9px] text-slate-450 font-semibold mt-1">WhatsApp success</p>
                </div>
              </div>

              {/* Freelancers */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between col-span-1">
                <div className="flex items-center justify-between mb-3 text-slate-450">
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">Freelancers</span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 font-mono tracking-tight">100</h3>
                  <p className="text-[9px] text-slate-450 font-semibold mt-1">Active builders</p>
                </div>
              </div>

            </div>

            {/* Main Workspace Layout (Table on left, AI scanning widget on right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Invoices List Table */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Simulated Freelancer Ledger</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Select a Pending invoice, then verify the payment receipt on the right.</p>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice / Freelancer</th>
                        <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Name</th>
                        <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Amount</th>
                        <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                        <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {invoices.map((inv) => {
                        const isSelected = selectedInvoiceId === inv.id;
                        return (
                          <tr
                            key={inv.id}
                            onClick={() => {
                              setSelectedInvoiceId(inv.id);
                              resetSimulator();
                            }}
                            className={`hover:bg-slate-50/60 transition-all cursor-pointer border-l-2 ${
                              isSelected
                                ? "bg-emerald-500/5 border-l-emerald-500"
                                : "border-l-transparent"
                            }`}
                          >
                            <td className="py-4.5 px-4">
                              <p className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-bold text-slate-700 text-[10.5px]">{inv.freelancerName}</span>
                                <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-medium">{inv.profession}</span>
                              </div>
                            </td>
                            <td className="py-4.5 px-4 font-semibold text-slate-700">
                              {inv.clientName}
                            </td>
                            <td className="py-4.5 px-4 font-mono font-bold text-slate-900">
                              ₦{inv.amount.toLocaleString()}
                            </td>
                            <td className="py-4.5 px-4 text-slate-500 font-medium">
                              {new Date(inv.dueDate).toLocaleDateString()}
                            </td>
                            <td className="py-4.5 px-4">
                              {inv.status === "Paid" && (
                                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200/50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                  <CheckCircle className="w-3 h-3" /> Paid
                                </span>
                              )}
                              {inv.status === "Pending" && (
                                <span className="bg-blue-50 text-blue-600 border border-blue-250/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              )}
                              {inv.status === "Overdue" && (
                                <span className="bg-rose-50 text-rose-600 border border-rose-200/50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                  <AlertTriangle className="w-3 h-3" /> Overdue
                                </span>
                              )}
                              {inv.status === "Under Review" && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-250/50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                  <AlertCircle className="w-3 h-3" /> Under Review
                                </span>
                              )}
                            </td>
                            <td className="py-4.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleCopyLink(inv.id)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-all border border-transparent bg-transparent"
                                  title="Copy payment details link"
                                >
                                  {isCopied === inv.id ? (
                                    <span className="text-[9px] text-emerald-650 font-bold">Copied!</span>
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedInvoiceId(inv.id);
                                    resetSimulator();
                                    // Trigger verification directly
                                    runVerification("match");
                                  }}
                                  disabled={inv.status === "Paid"}
                                  className={`px-2 py-1.5 rounded-lg font-bold text-[10px] border-none transition-all ${
                                    inv.status === "Paid"
                                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                      : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm active:scale-[0.98] cursor-pointer"
                                  }`}
                                >
                                  Verify Receipt
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-100 text-xs">
                  <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 font-bold">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Auto-Reminders Active:</h4>
                    <p className="text-slate-500 font-medium mt-0.5">
                      Kavio sends automated nudges via WhatsApp & Email for invoices with <span className="font-bold text-blue-600 font-mono">Pending</span> or <span className="font-bold text-rose-500 font-mono">Overdue</span> status. Verify receipt below to stop them.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gemini Vision Simulator Card */}
              <div className="bg-slate-950 text-slate-200 border border-slate-850 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-emerald-950/20 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-indigo-950/20 blur-3xl pointer-events-none" />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      <Sparkles className="w-3.5 h-3.5" /> Gemini Vision Engine
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">Auditor V1.4</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">AI Payment Verifier</h3>
                    <p className="text-slate-400 text-xs font-semibold leading-relaxed mt-0.5">
                      Auditing invoice <span className="font-bold text-slate-200 font-mono">{selectedInvoice.invoiceNumber}</span> (NGN {selectedInvoice.amount.toLocaleString()})
                    </p>
                  </div>

                  {/* SIMULATOR VIEWPORTS */}

                  {/* View 1: IDLE */}
                  {simState === "idle" && (
                    <div className="border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-4 py-8 bg-slate-900/30">
                      <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                        <Upload className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-300">Upload Transaction Receipt</p>
                        <p className="text-[10px] text-slate-500 font-semibold max-w-[200px] mx-auto">Supports JPG, PNG, PDF transfers from OPay, Access, GTBank</p>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          onClick={() => {
                            setSimState("uploading");
                            setProgress(0);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-4 h-4 text-emerald-350" />
                          Simulate Correct Receipt
                        </button>
                        <button
                          onClick={() => {
                            setSimState("uploading");
                            setProgress(0);
                          }}
                          className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                        >
                          Simulate Bad Receipt (Mismatch)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* View 2: UPLOADING */}
                  {simState === "uploading" && (
                    <div className="border border-slate-850 rounded-2xl p-6 text-center space-y-4 py-12 bg-slate-900/30">
                      <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">Uploading Receipt Document...</p>
                        <p className="text-[10px] text-slate-500 font-semibold font-mono">{progress}% Complete</p>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all duration-150" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* View 3: SCANNING / MAGNIFY SCAN EFFECT */}
                  {simState === "scanning" && (
                    <div className="border border-slate-850 rounded-2xl p-4.5 text-center space-y-4 bg-slate-900/40 relative overflow-hidden">
                      {/* Laser scanning vertical bar animation */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#10b981] animate-bounce z-10" />

                      <div className="h-28 bg-slate-950 border border-slate-850 rounded-xl relative flex items-center justify-center overflow-hidden">
                        <div className="text-[9px] font-mono text-emerald-400 text-left space-y-0.5 p-2 absolute inset-0 opacity-40 select-none">
                          <p>&gt; RUNNING OCR ANALYZER</p>
                          <p>&gt; DETECTING BANKING HEADERS: OPAY_TRANSFER</p>
                          <p>&gt; EXTRACTING META FIELDS AMOUNT, TIMESTAMP</p>
                          <p>&gt; CALIBRATING CHECKPOINT SUMS...</p>
                        </div>
                        <div className="relative z-10 text-center space-y-1.5">
                          <p className="text-xs font-bold text-white tracking-widest animate-pulse">Gemini Vision Auditing</p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider font-mono">Running Layout Verification {progress}%</p>
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-slate-500 font-semibold">Gemini extracts amount, date, name, and bank seals to match invoice metadata.</p>
                    </div>
                  )}

                  {/* View 4: MATCHED SUCCESS */}
                  {simState === "matched" && ocrResult && (
                    <div className="space-y-4">
                      {/* Success box */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Payment Verified</h4>
                          <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                            Match Score: <span className="text-emerald-400 font-bold font-mono">98.7%</span>. Invoice updated to <span className="text-white font-bold font-mono">PAID</span>. Reminder system halted.
                          </p>
                        </div>
                      </div>

                      {/* Scanned Fields */}
                      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4.5 space-y-2.5 font-mono text-[10.5px]">
                        <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider font-sans block mb-1">Extracted Metadata</span>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Sender Name:</span>
                          <span className="text-white font-bold font-sans">{ocrResult.senderName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Account Number:</span>
                          <span className="text-white font-semibold">{ocrResult.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Amount Paid:</span>
                          <span className="text-emerald-400 font-black">₦{ocrResult.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Timestamp:</span>
                          <span className="text-slate-400">{ocrResult.date}</span>
                        </div>
                      </div>

                      <button
                        onClick={resetSimulator}
                        className="text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Reset Scanner
                      </button>
                    </div>
                  )}

                  {/* View 5: MISMATCHED FAILURE */}
                  {simState === "mismatched" && ocrResult && (
                    <div className="space-y-4">
                      {/* Mismatch Alert box */}
                      <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider">Verification Mismatch</h4>
                          <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                            Match Score: <span className="text-rose-500 font-bold font-mono">35.0%</span>. Invoice status flipped to <span className="text-white font-bold font-mono">UNDER REVIEW</span>.
                          </p>
                        </div>
                      </div>

                      {/* Scanned Fields */}
                      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4.5 space-y-2.5 font-mono text-[10.5px]">
                        <span className="font-bold text-slate-500 text-[9px] uppercase tracking-wider font-sans block mb-1">Extracted Metadata</span>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Sender Name:</span>
                          <span className="text-white font-bold font-sans">{ocrResult.senderName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Account Number:</span>
                          <span className="text-white font-semibold">{ocrResult.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Amount Paid:</span>
                          <span className="text-rose-400 font-black">₦{ocrResult.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-850 pt-2 text-[10px] text-rose-400 flex-col gap-1 font-sans font-semibold">
                          {ocrResult.mismatchReasons.map((reason: string, idx: number) => (
                            <p key={idx} className="flex items-center gap-1">
                              • {reason}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={resetSimulator}
                          className="text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reset Scanner
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                <div className="border-t border-slate-900 pt-4 mt-6 text-[10px] text-slate-500 flex items-center gap-1.5 relative z-10">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>OPay Innovation Challenge Audit Layer</span>
                </div>
              </div>

            </div>

          </main>
        </div>

      </div>

    </div>
  );
}
