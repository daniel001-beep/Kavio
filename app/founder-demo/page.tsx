"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  MessageSquare,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  UserCheck,
  DollarSign,
  ArrowRight,
  TrendingDown,
  Layers,
  ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Mock Data for Recharts Graphing

const userGrowthData = [
  { name: "Jan", Users: 200 },
  { name: "Feb", Users: 380 },
  { name: "Mar", Users: 610 },
  { name: "Apr", Users: 900 },
  { name: "May", Users: 1150 },
  { name: "Jun", Users: 1420 },
];

const revenueGrowthData = [
  { name: "Jan", Revenue: 22000000 },
  { name: "Feb", Revenue: 45000000 },
  { name: "Mar", Revenue: 78000000 },
  { name: "Apr", Revenue: 112000000 },
  { name: "May", Revenue: 148000000 },
  { name: "Jun", Revenue: 185400000 },
];

const paymentCollectionData = [
  { name: "Jan", Rate: 72 },
  { name: "Feb", Rate: 78 },
  { name: "Mar", Rate: 84 },
  { name: "Apr", Rate: 89 },
  { name: "May", Rate: 91 },
  { name: "Jun", Rate: 94 },
];

const invoiceCreationData = [
  { name: "Jan", Invoices: 250 },
  { name: "Feb", Invoices: 420 },
  { name: "Mar", Invoices: 690 },
  { name: "Apr", Invoices: 880 },
  { name: "May", Invoices: 1080 },
  { name: "Jun", Invoices: 1250 },
];

const industryData = [
  { name: "Developers", value: 450, color: "#6366f1" },
  { name: "Designers", value: 320, color: "#3b82f6" },
  { name: "Agencies", value: 280, color: "#10b981" },
  { name: "Consultants", value: 210, color: "#f59e0b" },
  { name: "Tutors", value: 160, color: "#a855f7" },
];

export default function FounderDemoPage() {
  const [selectedChartTab, setSelectedChartTab] = useState<"growth" | "collection">("growth");

  // Currency Formatter
  const formatCurrency = (val: number) => {
    return "₦" + val.toLocaleString("en-NG");
  };

  return (
    <div className="h-screen w-screen bg-[#f8fafc] flex flex-col overflow-hidden text-slate-800 font-sans fintech-layout-root">
      
      {/* Warning Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 text-center text-xs font-black uppercase tracking-widest shrink-0 flex items-center justify-center gap-2 shadow-inner">
        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
        Demo Mode — Sample Data For Presentation Purposes
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col bg-white shrink-0 border-r border-slate-150 w-64 h-full p-6 justify-between shadow-sm">
          <div className="space-y-8">
            <div className="flex items-center gap-2 px-2">
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight">
                Kavio
              </span>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                DEMO
              </span>
            </div>

            <nav className="space-y-1.5">
              <Link
                href="/demo"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span>Demo Dashboard</span>
              </Link>
              <Link
                href="/founder-demo"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 border-l-2 border-emerald-500 transition-all"
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
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

        {/* Main Content Dashboard */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-hidden">
          
          {/* Mobile Header */}
          <header className="md:hidden bg-white border-b border-slate-100 h-16 px-6 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight">Kavio</span>
              <span className="text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">DEMO</span>
            </div>
            <div className="flex gap-1">
              <Link href="/demo" className="text-[11px] font-bold text-slate-550 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg">Demo</Link>
              <Link href="/founder-demo" className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">Founder</Link>
              <Link href="/pitch" className="text-[11px] font-bold text-slate-550 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg">Pitch</Link>
            </div>
          </header>

          {/* Core Scroll Window */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 pb-24 md:pb-8">
            
            {/* Page Header banner */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Founder Board & Platform Growth</h1>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold">
                Consolidated business telemetry showing platform scale, growth curves, and user acquisition metrics.
              </p>
            </div>

            {/* Platform metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              {/* Total signups */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3 text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Total Users</span>
                  <Users className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">1,420</h3>
                  <p className="text-[9px] text-slate-400 font-semibold mt-1">Platform signups</p>
                </div>
              </div>

              {/* Active users */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3 text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Active Users</span>
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-600 font-mono tracking-tight">890</h3>
                  <p className="text-[9px] text-emerald-500/80 font-bold mt-1">62.6% Monthly Active</p>
                </div>
              </div>

              {/* Volume collected */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between col-span-2 md:col-span-1">
                <div className="flex items-center justify-between mb-3 text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Total Collected</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">₦185.4M</h3>
                  <p className="text-[9px] text-slate-400 font-semibold mt-1">Settled transaction volume</p>
                </div>
              </div>

              {/* Outstanding */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between col-span-2 md:col-span-1">
                <div className="flex items-center justify-between mb-3 text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Outstanding</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-amber-600 font-mono tracking-tight">₦33.35M</h3>
                  <p className="text-[9px] text-amber-500/80 font-bold mt-1">Unsettled invoices</p>
                </div>
              </div>

              {/* Verified Receipts */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3 text-slate-400">
                  <span className="text-[9px] font-bold uppercase tracking-widest">Verified Payments</span>
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">12,500</h3>
                  <p className="text-[9px] text-slate-400 font-semibold mt-1">AI verified receipts</p>
                </div>
              </div>

              {/* Reminder Success */}
              <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-slate-200 transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3 text-slate-400">
                  <span className="text-[9px] font-bold uppercase tracking-widest">Nudge Success</span>
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-indigo-600 font-mono tracking-tight">94%</h3>
                  <p className="text-[9px] text-indigo-550/80 font-bold mt-1">Settled on reminder</p>
                </div>
              </div>

            </div>

            {/* Bento charts Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column (Main Charts) */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                
                {/* Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Platform Performance Trends</h2>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Track key conversion funnels over the past 6 months.</p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl w-fit">
                    <button
                      onClick={() => setSelectedChartTab("growth")}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer ${
                        selectedChartTab === "growth"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Growth Metrics
                    </button>
                    <button
                      onClick={() => setSelectedChartTab("collection")}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all border-none cursor-pointer ${
                        selectedChartTab === "collection"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Collection & Invoices
                    </button>
                  </div>
                </div>

                {selectedChartTab === "growth" ? (
                  <div className="space-y-8">
                    {/* User Growth Chart */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">User Growth Trend</h4>
                        <span className="text-[11px] font-bold text-indigo-650 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> +610% YTD
                        </span>
                      </div>
                      <div className="w-full" style={{ height: 180, minHeight: 180, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height={180}>
                          <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            <Area type="monotone" dataKey="Users" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#userGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Revenue Growth Chart */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">Platform Billed Volume (NGN)</h4>
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> +185.4M Collected
                        </span>
                      </div>
                      <div className="w-full" style={{ height: 180, minHeight: 180, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={revenueGrowthData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(v) => `₦${v / 1000000}M`} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => formatCurrency(v)} />
                            <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Collection Success Rates */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">Month-over-Month Collection Rate</h4>
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> 94% Peak Target Met
                        </span>
                      </div>
                      <div className="w-full" style={{ height: 180, minHeight: 180, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={paymentCollectionData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => `${v}%`} />
                            <Line type="monotone" dataKey="Rate" name="Collection Rate" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Invoice Creation Curve */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">Monthly Invoices Created</h4>
                        <span className="text-[11px] font-bold text-indigo-650 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" /> 1,250 Cumulative
                        </span>
                      </div>
                      <div className="w-full" style={{ height: 180, minHeight: 180, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={invoiceCreationData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                            <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            <Bar dataKey="Invoices" name="Invoices Created" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column (Top Industries Pie Chart & Breakdown) */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Top Billing Industries</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Volume distribution across freelancer professional categories.</p>
                </div>

                {/* Pie Chart container */}
                <div className="w-full flex items-center justify-center relative my-4" style={{ height: 192, minHeight: 192 }}>
                  <ResponsiveContainer width="100%" height={192}>
                    <PieChart>
                      <Pie
                        data={industryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {industryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} Freelancers`} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center metrics overlay */}
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-black text-slate-905 font-mono">1,420</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Users</span>
                  </div>
                </div>

                {/* Industry labels list */}
                <div className="space-y-2">
                  {industryData.map((ind) => {
                    const percentage = Math.round((ind.value / 1420) * 100);
                    return (
                      <div key={ind.name} className="flex items-center justify-between text-xs p-2 bg-slate-50 border border-slate-100/50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ind.color }} />
                          <span className="font-bold text-slate-700">{ind.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-black text-slate-800">{ind.value}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pitch deck link */}
                <Link
                  href="/pitch"
                  className="w-full flex items-center justify-center gap-1.5 mt-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                >
                  <span>Read Kavio Presentation</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

            </div>

          </main>
        </div>

      </div>

    </div>
  );
}
