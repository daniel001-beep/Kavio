"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertOctagon, 
  Search, 
  ArrowUpRight, 
  ArrowRight,
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  RefreshCw,
  Eye,
  Check,
  X,
  FileCheck2,
  Lock,
  ExternalLink,
  Smartphone,
  Send,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  UserCheck,
  Building
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from "recharts";
import { useSession } from "@/app/context/AuthContext";

// Currency formatter utility
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace("NGN", "₦");
};

// --- HIGH FIDELITY DEMO DATA GENERATOR ---
const GENERATE_DEMO_FREELANCERS = () => {
  const firstNames = ["Chidi", "Amina", "Femi", "Ngozi", "Tunde", "Chioma", "Olumide", "Yinka", "Abubakar", "Funmi", "Uche", "Emeka", "Fatima", "Sani"];
  const lastNames = ["Chukwuma", "Bello", "Adebayo", "Okonkwo", "Suleiman", "Balogun", "Onyekwere", "Alabi", "Danjuma", "Falola"];
  const categories = ["Graphic Designers", "Developers", "Copywriters", "Social Media Managers", "Video Editors", "Agencies", "Small Businesses"];
  
  const list = [];
  for (let i = 1; i <= 100; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const fullName = `${fn} ${ln}`;
    const category = categories[i % categories.length];
    list.push({
      id: `f_${i}`,
      name: fullName,
      category,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@kavio.co`,
      joined: new Date(2026, 4, 1 + (i % 28)).toLocaleDateString(),
      status: i % 25 === 0 ? "SUSPENDED" : "ACTIVE",
      invoices: 3 + (i % 8),
      revenue: 50000 + (i * 1250)
    });
  }
  return list;
};

const GENERATE_DEMO_INVOICES = () => {
  const clients = ["Google Nigeria", "Paystack", "Moniepoint", "Flutterwave", "Brass Technologies", "PiggyVest", "Sterling Ltd", "Aluko & Oyebode"];
  const freelancers = ["Chidi Chukwuma", "Amina Bello", "Femi Adebayo", "Ngozi Okonkwo", "Tunde Suleiman"];
  const descriptions = ["Web Development Suite", "UI Design System", "Security Audit", "API Integrations", "Marketing Strategy"];
  const banks = ["OPay", "GTBank", "Zenith Bank", "Access Bank", "United Bank for Africa (UBA)", "Moniepoint", "Kuda Bank"];
  
  const list = [];
  let paidSum = 0;
  let outstandingSum = 0;

  for (let i = 1; i <= 500; i++) {
    const isPaid = i <= 370; // exactly 370 paid, 130 outstanding
    let amount = 0;
    
    if (isPaid) {
      if (i === 370) {
        amount = 9300000 - paidSum; // Exact precision match
      } else {
        amount = Math.floor(10000 + Math.random() * 35000);
        paidSum += amount;
      }
    } else {
      if (i === 500) {
        amount = 3200000 - outstandingSum; // Exact precision match
      } else {
        amount = Math.floor(10000 + Math.random() * 30000);
        outstandingSum += amount;
      }
    }

    const status = isPaid ? "PAID" : i % 5 === 0 ? "OVERDUE" : i % 8 === 0 ? "UNDER_REVIEW" : "SENT";

    list.push({
      id: `inv_seed_${i}`,
      invoiceNumber: `INV-2026-${String(1000 + i).substring(1)}`,
      clientName: clients[i % clients.length],
      freelancerName: freelancers[i % freelancers.length],
      description: descriptions[i % descriptions.length],
      amount,
      dueDate: new Date(2026, 5, 20 + (i % 10)).toLocaleDateString(),
      status,
      bank: banks[i % banks.length],
      accountNumber: `0${Math.floor(100000000 + Math.random() * 900000000)}`
    });
  }
  return list;
};

const DEMO_QUEUE_ITEMS = [
  {
    id: "sub_1",
    invoiceId: "inv_101",
    invoiceNumber: "INV-2026-089",
    clientName: "Sterling Ltd",
    freelancerName: "Chidi Chukwuma",
    amount: 150000,
    extractedAmount: 150000,
    bankName: "Zenith Bank",
    accountNumber: "0123456789",
    extractedAccountNumber: "0123456789",
    accountName: "Chidi Chukwuma Services",
    extractedAccountName: "Chidi Chukwuma Services",
    transactionDate: "2026-06-08",
    refCode: "TXN-Zenith-9828",
    extractedRefCode: "TXN-Zenith-9828",
    totalScore: 100,
    confidence: 98,
    status: "AUTO_VERIFIED",
    fraudFlags: [],
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=sterling"
  },
  {
    id: "sub_2",
    invoiceId: "inv_102",
    invoiceNumber: "INV-2026-092",
    clientName: "Aluko & Oyebode",
    freelancerName: "Amina Bello",
    amount: 350000,
    extractedAmount: 350000,
    bankName: "GTBank",
    accountNumber: "0234567890",
    extractedAccountNumber: "0234567890",
    accountName: "Amina Bello Consultancy",
    extractedAccountName: "Amina Bello Consultancy",
    transactionDate: "2026-06-09",
    refCode: "TXN-GTB-7716",
    extractedRefCode: "TXN-GTB-7716",
    totalScore: 85,
    confidence: 88,
    status: "MANUAL_REVIEW",
    fraudFlags: ["ACCOUNT_NAME_MISMATCH"],
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=aluko"
  },
  {
    id: "sub_3",
    invoiceId: "inv_103",
    invoiceNumber: "INV-2026-095",
    clientName: "Brass Tech",
    freelancerName: "Femi Adebayo",
    amount: 75000,
    extractedAmount: 75000,
    bankName: "OPay",
    accountNumber: "9012345678",
    extractedAccountNumber: "9012345678",
    accountName: "Femi Adebayo",
    extractedAccountName: "FEMI ADEBAYO",
    transactionDate: "2026-06-01",
    refCode: "TXN-OPY-8822",
    extractedRefCode: "TXN-OPY-9900",
    totalScore: 70,
    confidence: 65,
    status: "MANUAL_REVIEW",
    fraudFlags: ["REFERENCE_MISMATCH", "LOW_GEMINI_CONFIDENCE"],
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=brass"
  },
  {
    id: "sub_4",
    invoiceId: "inv_104",
    invoiceNumber: "INV-2026-099",
    clientName: "PiggyVest Mock",
    freelancerName: "Chioma Nwachukwu",
    amount: 200000,
    extractedAmount: 200000,
    bankName: "Kuda Bank",
    accountNumber: "2012345678",
    extractedAccountNumber: "2012345678",
    accountName: "Chioma Design",
    extractedAccountName: "Unknown Account",
    transactionDate: "2026-05-15",
    refCode: "TXN-KUD-1122",
    extractedRefCode: "TXN-KUD-1122",
    totalScore: 45,
    confidence: 90,
    status: "REJECTED",
    fraudFlags: ["ACCOUNT_NAME_MISMATCH", "DUPLICATE_RECEIPT_IMAGE", "REUSED_TRANSACTION_REF"],
    image: "https://api.dicebear.com/7.x/identicon/svg?seed=piggy"
  }
];

const DEMO_AUDIT_LOGS = [
  { id: "log_1", date: "2026-06-10 10:12", user: "system", event: "RECEIPT_VERIFICATION_AUTO", desc: "Invoice INV-2026-089 verified (100 pts) for Sterling Ltd." },
  { id: "log_2", date: "2026-06-10 09:44", user: "system", event: "REMINDER_DISPATCHED", desc: "WhatsApp Reminder Day 2 sent to Aluko & Oyebode client." },
  { id: "log_3", date: "2026-06-09 18:22", user: "admin@kavio.co", event: "MANUAL_CLEARANCE", desc: "Admin manually approved invoice INV-2026-074." },
  { id: "log_4", date: "2026-06-09 15:30", user: "system", event: "RECEIPT_VERIFICATION_FAIL", desc: "Receipt rejected for INV-2026-099 due to duplicate image check." },
  { id: "log_5", date: "2026-06-08 11:00", user: "admin@kavio.co", event: "USER_SUSPENDED", desc: "Suspended freelancer account tobi.alabi@kaviomock.com." }
];

export default function FounderDashboard() {
  const { data: session } = useSession();
  
  const [mounted, setMounted] = useState(false);
  const [demoMode, setDemoMode] = useState(true); 
  const [activeTab, setActiveTab] = useState<"overview" | "queue" | "users" | "invoices" | "audit" | "walkthrough">("overview");

  // Search & Filter states
  const [userSearch, setUserSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");

  // Seeding states
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);

  // Lists & State (initialized with demo details)
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Selected details modal
  const [selectedQueueItem, setSelectedQueueItem] = useState<any | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Walkthrough animation wizard states
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [walkthroughInvoiceNum, setWalkthroughInvoiceNum] = useState("");
  const [walkthroughActive, setWalkthroughActive] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFreelancers(GENERATE_DEMO_FREELANCERS());
    setInvoices(GENERATE_DEMO_INVOICES());
    setQueue(DEMO_QUEUE_ITEMS);
    setLogs(DEMO_AUDIT_LOGS);
  }, []);

  // Check Auth Role
  const isAdmin = session?.user?.isAdmin || session?.user?.email?.toLowerCase().trim() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@kavio.co").toLowerCase().trim();

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedSuccess(null);
    try {
      const res = await fetch("/api/admin/seed-demo?bypass=true", {
        method: "POST"
      });
      if (res.ok) {
        const result = await res.json();
        setSeedSuccess(result.message);
        // If not in demo mode, update lists from actual database
        if (!demoMode) {
          const statsRes = await fetch("/api/admin/dashboard");
          if (statsRes.ok) {
            const data = await statsRes.json();
            setInvoices(data.invoices || []);
            setFreelancers(data.users || []);
          }
        }
      } else {
        const err = await res.json();
        alert(`Seeding failed: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Database seeding failed. Check console.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleReviewAction = async (action: "APPROVE" | "REJECT" | "REQUEST_NEW") => {
    if (!selectedQueueItem) return;
    setIsSubmittingReview(true);

    if (demoMode) {
      // Direct state simulation
      if (action === "APPROVE") {
        setInvoices(prev => prev.map(inv => inv.id === selectedQueueItem.invoiceId || inv.invoiceNumber === selectedQueueItem.invoiceNumber ? { ...inv, status: "PAID" } : inv));
        setQueue(prev => prev.filter(q => q.id !== selectedQueueItem.id));
        setLogs(prev => [
          {
            id: `log_${Date.now()}`,
            date: new Date().toLocaleString(),
            user: "admin@kavio.co",
            event: "MANUAL_CLEARANCE",
            desc: `Admin manually approved invoice ${selectedQueueItem.invoiceNumber} via Review Center.`
          },
          ...prev
        ]);
        alert(`Invoice ${selectedQueueItem.invoiceNumber} marked as PAID. Dashboard metrics updated.`);
      } else {
        setQueue(prev => prev.filter(q => q.id !== selectedQueueItem.id));
        alert(`Receipt submission rejected. Remarks saved.`);
      }
      setSelectedQueueItem(null);
      setIsSubmittingReview(false);
      return;
    }

    // Live mode call
    try {
      const res = await fetch(`/api/invoices/${selectedQueueItem.invoiceId}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: reviewNotes })
      });

      if (res.ok) {
        alert("Receipt status updated successfully in Postgres!");
        setSelectedQueueItem(null);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Toggle user status
  const handleToggleUserStatus = (userId: string) => {
    setFreelancers(prev => prev.map(f => {
      if (f.id === userId) {
        const newStatus = f.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        setLogs(l => [
          {
            id: `log_${Date.now()}`,
            date: new Date().toLocaleString(),
            user: "admin@kavio.co",
            event: newStatus === "SUSPENDED" ? "USER_SUSPENDED" : "USER_ACTIVATED",
            desc: `${newStatus === "SUSPENDED" ? "Suspended" : "Reactivated"} freelancer ${f.name}.`
          },
          ...l
        ]);
        return { ...f, status: newStatus };
      }
      return f;
    }));
  };

  // --- RUN LIVE PRODUCT WALKTHROUGH SIMULATOR ---
  const runWalkthrough = () => {
    setWalkthroughActive(true);
    setWalkthroughStep(1);
    const invNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setWalkthroughInvoiceNum(invNum);
  };

  const advanceWalkthrough = () => {
    setWalkthroughStep(prev => {
      const next = prev + 1;
      if (next === 6) {
        // Apply final increments to statistics
        setInvoices(prevInvs => [
          {
            id: `inv_walkthrough`,
            invoiceNumber: walkthroughInvoiceNum,
            clientName: "Access Bank Plc",
            freelancerName: "Chidi Chukwuma",
            description: "OPay Landing Page UI/UX Redesign",
            amount: 180000,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            status: "PAID",
            bank: "OPay",
            accountNumber: "0123456789"
          },
          ...prevInvs
        ]);
        setLogs(prevLogs => [
          {
            id: `log_walk_${Date.now()}`,
            date: new Date().toLocaleString(),
            user: "system",
            event: "INVOICE_PAID",
            desc: `Invoice ${walkthroughInvoiceNum} (₦180,000) verified and settled successfully.`
          },
          ...prevLogs
        ]);
      }
      return next;
    });
  };

  const resetWalkthrough = () => {
    setWalkthroughStep(0);
    setWalkthroughActive(false);
  };

  if (!mounted) return null;

  // Protect path if Live and not Admin
  if (!isAdmin && !demoMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-950/20 blur-[120px] pointer-events-none" />
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 text-center shadow-2xl relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">Founder Portal Protected</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              This panel is restricted to verified Kavio Administrators. Sign in with the admin email to access live production servers.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => window.location.href = "/auth/signin"}
              className="w-full h-11 rounded-xl bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold transition-all shadow-lg active:scale-[0.99] cursor-pointer"
            >
              Sign In to Admin Console
            </button>
            <button
              onClick={() => setDemoMode(true)}
              className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-900 text-slate-300 text-xs font-semibold transition-all active:scale-[0.99] cursor-pointer"
            >
              Bypass / Launch Demo Sandbox Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- STATS MATHEMATICS ---
  const totalUsers = freelancers.length;
  const activeUsers = freelancers.filter(f => f.status === "ACTIVE").length;
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === "PAID").length;
  const pendingInvoices = invoices.filter(i => i.status === "SENT" || i.status === "VIEWED").length;
  const overdueInvoices = invoices.filter(i => i.status === "OVERDUE").length;
  
  const totalCollected = invoices.filter(i => i.status === "PAID").reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstanding = invoices.filter(i => i.status !== "PAID").reduce((sum, inv) => sum + inv.amount, 0);

  const collectionRate = (totalCollected / (totalCollected + totalOutstanding)) * 100;
  const reminderSuccessRate = 84.5;
  const verificationSuccess = 92.4;

  // --- BANK PERFORMANCE COMPILATION ---
  const getBankStats = (bankName: string) => {
    const bankInvs = invoices.filter(i => i.bank && i.bank.toLowerCase().includes(bankName.toLowerCase()));
    const count = bankInvs.length;
    const collected = bankInvs.filter(i => i.status === "PAID").reduce((sum, inv) => sum + inv.amount, 0);
    const rate = count > 0 ? (bankInvs.filter(i => i.status === "PAID").length / count) * 100 : 0;
    return { count, collected, rate };
  };

  const targetBanks = ["OPay", "GTBank", "Zenith Bank", "Access Bank", "United Bank for Africa (UBA)", "Moniepoint", "Kuda Bank"];

  // --- RECHARTS CHART DATA ---
  const monthlyGrowthData = [
    { month: "Jan", users: 30, invoices: 120 },
    { month: "Feb", users: 52, invoices: 195 },
    { month: "Mar", users: 68, invoices: 290 },
    { month: "Apr", users: 80, invoices: 380 },
    { month: "May", users: 95, invoices: 440 },
    { month: "Jun", users: totalUsers, invoices: totalInvoices }
  ];

  const revenueGrowthData = [
    { month: "Jan", collected: 2100000 },
    { month: "Feb", collected: 3400000 },
    { month: "Mar", collected: 5600000 },
    { month: "Apr", collected: 7100000 },
    { month: "May", collected: 8400000 },
    { month: "Jun", collected: totalCollected }
  ];

  const rateAnalysisData = [
    { month: "Jan", reminderRate: 76, verificationRate: 88 },
    { month: "Feb", reminderRate: 79, verificationRate: 90 },
    { month: "Mar", reminderRate: 81, verificationRate: 91 },
    { month: "Apr", reminderRate: 83, verificationRate: 91 },
    { month: "May", reminderRate: 84, verificationRate: 92 },
    { month: "Jun", reminderRate: reminderSuccessRate, verificationRate: verificationSuccess }
  ];

  const trendData = [
    { day: "01 Jun", collected: 150000, outstanding: 90000 },
    { day: "03 Jun", collected: 380000, outstanding: 120000 },
    { day: "05 Jun", collected: 590000, outstanding: 140000 },
    { day: "07 Jun", collected: 1200000, outstanding: 280000 },
    { day: "09 Jun", collected: 1800000, outstanding: 350000 }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col">
      
      {/* Demo Badge Banner */}
      {demoMode && (
        <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border-b border-amber-500/20 text-amber-600 py-2 text-center text-xs font-bold font-mono flex items-center justify-center gap-2 relative z-50">
          <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
          <span>DEMO DATA - FOR PRESENTATION PURPOSES</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] bg-amber-500 text-white font-sans">SANDBOX</span>
        </div>
      )}

      {/* Header section */}
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <ShieldCheck className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-wide uppercase font-mono flex items-center gap-2">
              Kavio Control <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-sans">Founder Hub</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold">OPay Innovation Challenge Edition</p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          
          {/* Demo Sandbox switch */}
          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 shadow-inner">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Demo Sandbox
            </span>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-all relative cursor-pointer ${
                demoMode ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-all shadow-md ${
                demoMode ? "translate-x-4.5" : "translate-x-0"
              }`} />
            </button>
          </div>

          {/* Seeding postgres */}
          {demoMode && (
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-550 disabled:bg-slate-100 disabled:text-slate-400 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all active:scale-[0.99] cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
              {isSeeding ? "Syncing DB..." : "Seed Postgres"}
            </button>
          )}

          <button
            onClick={() => window.location.href = "/pitch"}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer shadow-sm"
          >
            OPay Pitch <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">

        {/* Dynamic seeding prompt */}
        {seedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex items-center justify-between shadow-md">
            <span>✅ {seedSuccess}</span>
            <button onClick={() => setSeedSuccess(null)} className="text-emerald-650 font-bold hover:text-emerald-800">Dismiss</button>
          </div>
        )}

        {/* Dashboard sub navigation */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-px overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "overview" ? "border-emerald-500 text-emerald-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Analytics Overview
          </button>
          <button
            onClick={() => setActiveTab("walkthrough")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "walkthrough" ? "border-emerald-500 text-emerald-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Live Product Walkthrough
          </button>
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "queue" ? "border-emerald-500 text-emerald-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" /> Review Center
            {queue.length > 0 && (
              <span className="w-4.5 h-4.5 bg-amber-500 text-slate-950 text-[9px] font-extrabold rounded-full flex items-center justify-center shrink-0">
                {queue.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "users" ? "border-emerald-500 text-emerald-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Freelancers Directory
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "invoices" ? "border-emerald-500 text-emerald-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Invoice Ledger
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "audit" ? "border-emerald-500 text-emerald-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" /> Audit Trail
          </button>
        </div>

        {/* TAB CONTENTS: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* Overview Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              
              {/* Users */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[9px] font-bold uppercase tracking-wider">Total Users</span>
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-slate-950 tracking-tight">{totalUsers}</div>
                <div className="text-[9px] text-slate-500 font-semibold">{activeUsers} Active Accounts</div>
              </div>

              {/* Invoices */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[9px] font-bold uppercase tracking-wider">Total Invoices</span>
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-950 tracking-tight">{totalInvoices}</div>
                <div className="text-[9px] text-slate-500 font-semibold flex justify-between">
                  <span>{paidInvoices} Paid</span>
                  <span>{overdueInvoices} Overdue</span>
                </div>
              </div>

              {/* Collected */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all col-span-2 sm:col-span-1 shadow-sm">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[9px] font-bold uppercase tracking-wider">Collected</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-950 font-mono leading-none">
                  {formatCurrency(totalCollected)}
                </div>
                <div className="text-[9px] text-emerald-650 font-bold">
                  {collectionRate.toFixed(1)}% Collection Rate
                </div>
              </div>

              {/* Outstanding */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all col-span-2 sm:col-span-1 shadow-sm">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[9px] font-bold uppercase tracking-wider">Outstanding</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-950 font-mono leading-none">
                  {formatCurrency(totalOutstanding)}
                </div>
                <div className="text-[9px] text-slate-500 font-semibold">Pending client clearings</div>
              </div>

              {/* Reminder Rate */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[9px] font-bold uppercase tracking-wider">Reminders Success</span>
                  <Send className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-2xl font-bold text-slate-950 font-mono leading-none">
                  {reminderSuccessRate}%
                </div>
                <div className="text-[9px] text-slate-500 font-semibold">Day 2 WhatsApp conversion</div>
              </div>

              {/* Verification success rate */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 relative overflow-hidden group hover:border-slate-300 transition-all shadow-sm">
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[9px] font-bold uppercase tracking-wider">OCR Verified</span>
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-950 font-mono leading-none">
                  {verificationSuccess}%
                </div>
                <div className="text-[9px] text-slate-500 font-semibold">Gemini 2.5 Flash Audits</div>
              </div>

            </div>

            {/* 7 Recharts Implementation Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* 1. Invoice Growth & User Growth */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Invoice & User Growth</h3>
                  <p className="text-[9px] text-slate-500 font-semibold">Monthly platform user counts and total invoices issued</p>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a", fontSize: "10px" }} />
                      <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} name="Users" />
                      <Line type="monotone" dataKey="invoices" stroke="#10b981" strokeWidth={2} name="Invoices" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Revenue Growth & Collection Trend */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Payment Collection Trend</h3>
                  <p className="text-[9px] text-slate-500 font-semibold">Cumulative collections volume growth over time</p>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueGrowthData}>
                      <defs>
                        <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} tickFormatter={(v) => `₦${v/1000000}M`} />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a", fontSize: "10px" }} />
                      <Area type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} fill="url(#colorColl)" name="Collected" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3. Reminder & Verification Success Rates */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Success Rate Analysis</h3>
                  <p className="text-[9px] text-slate-500 font-semibold">WhatsApp conversion vs. Gemini validation rates</p>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rateAnalysisData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} domain={[50, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a", fontSize: "10px" }} />
                      <Bar dataKey="reminderRate" fill="#0ea5e9" name="Reminder Success %" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="verificationRate" fill="#10b981" name="Gemini Success %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4. Outstanding Revenue Trend */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 lg:col-span-3 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Outstanding Revenue Ledger</h3>
                  <p className="text-[9px] text-slate-500 font-semibold">Comparison of collected payments versus outstanding billing volume</p>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                      <XAxis dataKey="day" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a", fontSize: "10px" }} />
                      <Area type="monotone" dataKey="collected" stroke="#10b981" fill="#10b981" fillOpacity={0.05} name="Collected" />
                      <Area type="monotone" dataKey="outstanding" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.05} name="Outstanding" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Bank Analytics (OPay, GTBank, Zenith, Access, UBA, Moniepoint, Kuda) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-600" /> Bank Analytics Ledger
                </h3>
                <p className="text-[9px] text-slate-500 font-semibold">Payment collection performance index across target financial gateways</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {targetBanks.map((bank, idx) => {
                  const stats = getBankStats(bank);
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                      <div className="font-bold text-slate-900 truncate font-mono">{bank.split(" ")[0]}</div>
                      
                      <div className="space-y-1 text-[11px] font-semibold">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Invoices</span>
                          <span className="text-slate-700">{stats.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Collected</span>
                          <span className="text-emerald-650">{formatCurrency(stats.collected)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Success</span>
                          <span className="text-emerald-650">{stats.rate.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB CONTENTS: WALKTHROUGH */}
        {activeTab === "walkthrough" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-600" /> One-Click Interactive Product Walkthrough
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Demonstrate the end-to-end Kavio lifecycle flow visually in real-time.
                </p>
              </div>

              {!walkthroughActive ? (
                <button
                  onClick={runWalkthrough}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                >
                  <Play className="w-4 h-4 fill-white" /> Start Live Walkthrough
                </button>
              ) : (
                <button
                  onClick={resetWalkthrough}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1.5 border border-slate-200"
                >
                  <RotateCcw className="w-4 h-4" /> Reset Walkthrough
                </button>
              )}
            </div>

            {/* Walkthrough Panel / Animation frame */}
            {walkthroughActive ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
                
                {/* Steps left selector */}
                <div className="lg:col-span-4 space-y-3">
                  {[
                    "Freelancer Creates Invoice",
                    "WhatsApp Reminder Dispatched",
                    "Client Uploads Transfer Receipt",
                    "Gemini Scan & Details Extraction",
                    "Transfer Verified & Settled",
                    "Dashboard & Metrics Updated"
                  ].map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-3 transition-all ${
                        walkthroughStep === idx + 1
                          ? "bg-white border-slate-350 text-slate-900 shadow-md scale-[1.01]"
                          : walkthroughStep > idx + 1
                          ? "bg-slate-100 border-slate-200/60 text-slate-400"
                          : "bg-transparent border-transparent text-slate-500"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        walkthroughStep === idx + 1
                          ? "bg-emerald-600 text-white"
                          : walkthroughStep > idx + 1
                          ? "bg-slate-300 text-slate-600"
                          : "bg-slate-200 text-slate-500"
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="truncate">{step}</span>
                    </div>
                  ))}
                </div>

                {/* Walkthrough Live Frame Output */}
                <div className="lg:col-span-8 bg-[#f8fafc] border border-slate-200 rounded-3xl p-6 flex flex-col justify-between min-h-[350px] relative overflow-hidden shadow-inner">
                  
                  {/* Step 1: Create Invoice Mock */}
                  {walkthroughStep === 1 && (
                    <div className="space-y-4 my-auto">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-mono">Invoice Creation Screen</span>
                      
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 block mb-1">Invoice Number</span>
                            <div className="font-bold text-slate-900 font-mono">{walkthroughInvoiceNum}</div>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-1">Billing Amount</span>
                            <div className="font-bold text-emerald-650 font-mono text-sm">₦180,000</div>
                          </div>
                        </div>

                        <div className="text-xs">
                          <span className="text-slate-550 block mb-1">Billing Description</span>
                          <div className="font-bold text-slate-900">OPay Landing Page UI/UX Redesign</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-100 pt-3">
                          <div>
                            <span className="text-slate-550 block mb-1">Payout Target Bank</span>
                            <div className="font-bold text-slate-900">OPay</div>
                          </div>
                          <div>
                            <span className="text-slate-550 block mb-1">Client Contact</span>
                            <div className="font-bold text-slate-900">Access Bank Plc (+2348033281290)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: WhatsApp mockup screen */}
                  {walkthroughStep === 2 && (
                    <div className="space-y-4 my-auto max-w-sm mx-auto w-full">
                      <span className="text-[10px] font-bold text-teal-650 uppercase tracking-widest font-mono block text-center">Simulated WhatsApp reminders</span>
                      
                      <div className="bg-[#e5ddd5] border border-slate-200 rounded-3xl p-4 space-y-3 shadow-md h-56 flex flex-col justify-between">
                        
                        {/* Header */}
                        <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2 text-[10px]">
                          <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-[8px]">K</div>
                          <div className="font-bold text-slate-800">Kavio Remind Engine</div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 space-y-2 overflow-y-auto pt-2 text-[10px] leading-relaxed">
                          <div className="bg-white text-slate-800 p-2.5 rounded-r-xl rounded-bl-xl max-w-[85%] border border-slate-100 shadow-sm">
                            Hello billing rep at Access Bank Plc, friendly reminder regarding outstanding invoice <span className="font-bold text-emerald-700">{walkthroughInvoiceNum}</span> (₦180,000) for OPay Landing Page UI/UX Redesign.
                          </div>
                          <div className="bg-white text-slate-800 p-2.5 rounded-r-xl rounded-bl-xl max-w-[85%] border border-slate-100 shadow-sm">
                            Please make transfer to: <br/>
                            <span className="font-bold">Bank:</span> OPay <br/>
                            <span className="font-bold">Acc Name:</span> Chidi Services <br/>
                            <span className="font-bold">Acc Num:</span> 0123456789 <br/>
                            Checkout link: <span className="text-sky-600 underline cursor-pointer">kavio.co/pay/demo-id</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Step 3: Client Uploads Receipt */}
                  {walkthroughStep === 3 && (
                    <div className="space-y-4 my-auto text-center">
                      <span className="text-[10px] font-bold text-indigo-650 uppercase tracking-widest font-mono">Client Secure Portal</span>
                      
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm mx-auto space-y-4 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto animate-bounce">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-xs">opay_payment_receipt_success.png</div>
                          <p className="text-[9px] text-slate-500">182 KB · Uploaded successfully via Drag & Drop</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 py-1 px-3 rounded-lg text-[10px] font-bold inline-block">
                          Ready for AI scanning
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Gemini Scan Details */}
                  {walkthroughStep === 4 && (
                    <div className="space-y-4 my-auto">
                      <span className="text-[10px] font-bold text-emerald-650 uppercase tracking-widest font-mono">Gemini Vision Auditing</span>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
                          <div className="font-bold text-slate-700 border-b border-slate-100 pb-1 text-[10px] uppercase">Invoice Specs</div>
                          <p>Amount: <span className="text-slate-900 font-mono font-bold">₦180,000</span></p>
                          <p>Acc Number: <span className="text-slate-900 font-mono">0123456789</span></p>
                          <p>Bank Name: <span className="text-slate-900">OPay</span></p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm">
                          <div className="font-bold text-slate-700 border-b border-slate-100 pb-1 text-[10px] uppercase">Gemini OCR Extracted</div>
                          <p>Amount: <span className="text-emerald-700 font-mono font-bold">₦180,000</span></p>
                          <p>Acc Number: <span className="text-emerald-700 font-mono">0123456789</span></p>
                          <p>Bank Name: <span className="text-emerald-700">OPay</span></p>
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-center font-bold text-[10px] flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                        AUDIT TRUST MATCH SCORE: 98/100 (AUTO_VERIFIED)
                      </div>
                    </div>
                  )}

                  {/* Step 5: Transfer Verified */}
                  {walkthroughStep === 5 && (
                    <div className="space-y-4 my-auto text-center">
                      <span className="text-[10px] font-bold text-emerald-650 uppercase tracking-widest font-mono">Ledger Settlement Engine</span>
                      
                      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 text-sm">Invoice {walkthroughInvoiceNum} Cleared!</h3>
                        <p className="text-xs text-slate-650 max-w-xs mx-auto">
                          WhatsApp reminders stopped. Email notification dispatched to billing contact. Freelancer notified.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Complete walkthrough dashboard updates */}
                  {walkthroughStep === 6 && (
                    <div className="space-y-4 my-auto text-center">
                      <span className="text-[10px] font-bold text-indigo-650 uppercase tracking-widest font-mono">Completed</span>
                      
                      <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mx-auto animate-pulse">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-bold text-slate-900 text-xs">Metrics Incremented in State</h3>
                        <p className="text-[11px] text-slate-600 max-w-sm mx-auto leading-relaxed">
                          Platform Total Collected increased by ₦180,000. Invoice ledger logs the transaction. Check the ledger and logs tabs to see updates.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Control triggers */}
                  <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold font-mono">Step {walkthroughStep} of 6</span>
                    
                    {walkthroughStep < 6 ? (
                      <button
                        onClick={advanceWalkthrough}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        Next Step <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={resetWalkthrough}
                        className="bg-indigo-650 hover:bg-indigo-550 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        Finish Walkthrough
                      </button>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4 bg-slate-50 max-w-md mx-auto">
                <Smartphone className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">Interactive Sandbox Simulator</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Trigger a step-by-step product walkthrough highlighting invoice dispatch, automated WhatsApp follow-ups, receipt scanning, and AI ledger clearing.
                  </p>
                </div>
                <button
                  onClick={runWalkthrough}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  Launch Demo Wizard
                </button>
              </div>
            )}

          </div>
        )}

        {/* TAB CONTENTS: QUEUE */}
        {activeTab === "queue" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900">Review Center Queue</h2>
              <p className="text-xs text-slate-500 mt-1">Review bank transfers processed by Gemini Vision and approve manually.</p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-550 uppercase tracking-widest text-[9px] bg-slate-50">
                    <th className="px-6 py-4">Invoice / Client</th>
                    <th className="px-6 py-4">Freelancer</th>
                    <th className="px-6 py-4">Transfer Amount</th>
                    <th className="px-6 py-4">Weighted Score</th>
                    <th className="px-6 py-4">Fraud Flags</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {queue.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-all font-medium">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{item.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-500">{item.clientName}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {item.freelancerName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-emerald-700 font-bold">{formatCurrency(item.amount)}</div>
                        <div className="text-[9px] text-slate-500">Bank: {item.bankName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold ${
                            item.totalScore >= 90
                              ? "text-emerald-600"
                              : item.totalScore >= 60
                              ? "text-amber-600"
                              : "text-rose-600"
                          }`}>{item.totalScore}/100</span>
                          <span className="text-[9px] text-slate-500">({item.confidence}% OCR)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.fraudFlags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.fraudFlags.map((flag, fIdx) => (
                              <span key={fIdx} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-50 border border-rose-200 text-rose-700 tracking-wider">
                                {flag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.status === "AUTO_VERIFIED" ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 border border-emerald-250 text-emerald-800">
                            Auto Verified
                          </span>
                        ) : item.status === "MANUAL_REVIEW" ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 border border-amber-250 text-amber-800">
                            Needs Review
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 border border-rose-250 text-rose-800">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedQueueItem(item)}
                          className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB CONTENTS: USERS */}
        {activeTab === "users" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Freelancer Directory</h2>
                <p className="text-xs text-slate-500 mt-1">Filter accounts by specialization and status.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-semibold text-slate-700 cursor-pointer shadow-sm"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Graphic Designers">Graphic Designers</option>
                  <option value="Developers">Developers</option>
                  <option value="Copywriters">Copywriters</option>
                  <option value="Social Media Managers">Social Media Managers</option>
                  <option value="Video Editors">Video Editors</option>
                  <option value="Agencies">Agencies</option>
                  <option value="Small Businesses">Small Businesses</option>
                </select>

                <div className="relative max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search freelancers..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs text-slate-800 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-550 uppercase tracking-widest text-[9px] bg-slate-50">
                    <th className="px-6 py-4">Freelancer</th>
                    <th className="px-6 py-4">Specialization</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4">Total Invoices</th>
                    <th className="px-6 py-4">Settled Revenue</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {freelancers
                    .filter(f => {
                      const matchSearch = f.name.toLowerCase().includes(userSearch.toLowerCase()) || f.email.toLowerCase().includes(userSearch.toLowerCase());
                      const matchFilter = userFilter === "ALL" || f.category === userFilter;
                      return matchSearch && matchFilter;
                    })
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-all font-medium">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {item.name}
                            {item.status === "SUSPENDED" && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-50 border border-rose-200 text-rose-700">SUSPENDED</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">{item.email}</div>
                        </td>
                        <td className="px-6 py-4 text-indigo-600 font-semibold">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {item.joined}
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-mono">
                          {item.invoices} invoices
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                          {formatCurrency(item.revenue)}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(item.id)}
                            className={`font-bold px-2 py-1 rounded text-[10px] transition-all cursor-pointer border ${
                              item.status === "ACTIVE" 
                                ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" 
                                : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"
                            }`}
                          >
                            {item.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB CONTENTS: INVOICES */}
        {activeTab === "invoices" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Invoice Ledger</h2>
                <p className="text-xs text-slate-500 mt-1">Audit log of all platform billing transactions.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={invoiceFilter}
                  onChange={(e) => setInvoiceFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-semibold text-slate-700 cursor-pointer shadow-sm"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PAID">Paid</option>
                  <option value="SENT">Sent</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                </select>

                <div className="relative max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-xs text-slate-800 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-550 uppercase tracking-widest text-[9px] bg-slate-50">
                    <th className="px-6 py-4">Invoice Reference</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Freelancer</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoices
                    .filter(inv => {
                      const matchSearch = inv.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) || 
                                          inv.clientName.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                                          inv.freelancerName.toLowerCase().includes(invoiceSearch.toLowerCase());
                      const matchFilter = invoiceFilter === "ALL" || inv.status === invoiceFilter;
                      return matchSearch && matchFilter;
                    })
                    .slice(0, 50)
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-all font-medium">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {item.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {item.clientName}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.freelancerName}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {item.dueDate}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4">
                          {item.status === "PAID" ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 border border-emerald-250 text-emerald-800">
                              Paid
                            </span>
                          ) : item.status === "UNDER_REVIEW" ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 border border-amber-250 text-amber-800">
                              Under Review
                            </span>
                          ) : item.status === "OVERDUE" ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 border border-rose-250 text-rose-800">
                              Overdue
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-750">
                              Sent
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedInvoice(item)}
                            className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB CONTENTS: AUDIT */}
        {activeTab === "audit" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900">System Audit Trail</h2>
              <p className="text-xs text-slate-500 mt-1">Immutable records of core system activities and transaction verifications.</p>
            </div>

            <div className="space-y-3">
              {logs.map((log, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono tracking-wider uppercase">
                        {log.event}
                      </span>
                      <span className="text-slate-500">{log.date}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{log.desc}</p>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold font-mono">
                    Actor: {log.user}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

            {selectedQueueItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedQueueItem(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">Verify proof of Payment</h3>
              <h2 className="text-base font-bold text-slate-900 mt-1">Invoice {selectedQueueItem.invoiceNumber}</h2>
              <p className="text-xs text-slate-500">Client: {selectedQueueItem.clientName} · Freelancer: {selectedQueueItem.freelancerName}</p>
            </div>

            {/* Extracted stats details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">OCR Extracted Details</span>
                <div className="space-y-1 font-mono text-[11px]">
                  <p><span className="text-slate-500">Amount:</span> <span className="text-slate-900 font-bold">{formatCurrency(selectedQueueItem.extractedAmount)}</span></p>
                  <p><span className="text-slate-500">Acc Num:</span> <span className="text-slate-900">{selectedQueueItem.extractedAccountNumber}</span></p>
                  <p><span className="text-slate-500">Acc Name:</span> <span className="text-slate-900 truncate block max-w-[180px]">{selectedQueueItem.extractedAccountName}</span></p>
                  <p><span className="text-slate-500">Date:</span> <span className="text-slate-900">{selectedQueueItem.transactionDate}</span></p>
                  <p><span className="text-slate-500">Ref Code:</span> <span className="text-slate-900 truncate block max-w-[180px]">{selectedQueueItem.extractedRefCode}</span></p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Auditor Verification Score</span>
                <div className="space-y-1 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Score:</span>
                    <span className={`font-mono ${selectedQueueItem.totalScore >= 90 ? "text-emerald-700" : "text-amber-700"}`}>{selectedQueueItem.totalScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Match:</span>
                    <span className="text-emerald-700">{selectedQueueItem.amount === selectedQueueItem.extractedAmount ? "PASS" : "FAIL"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Match:</span>
                    <span className="text-emerald-700">{selectedQueueItem.accountNumber === selectedQueueItem.extractedAccountNumber ? "PASS" : "FAIL"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference Match:</span>
                    <span className="text-emerald-700">{selectedQueueItem.refCode === selectedQueueItem.extractedRefCode ? "PASS" : "FAIL"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fraud flags alerts */}
            {selectedQueueItem.fraudFlags.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <AlertOctagon className="w-4 h-4 text-rose-600" /> Fraud flags Detected
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedQueueItem.fraudFlags.map((flag: string, idx: number) => (
                    <span key={idx} className="bg-rose-100 text-rose-800 font-bold font-mono px-1.5 py-0.5 rounded text-[9px] uppercase">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Review Remarks / Internal Notes</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Write audit decisions, internal notes..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-xs text-slate-800 font-semibold shadow-sm"
                rows={3}
              />
            </div>

            {/* Decision actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleReviewAction("REJECT")}
                disabled={isSubmittingReview}
                className="flex-1 h-11 bg-rose-650 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <X className="w-4 h-4" /> Reject Receipt
              </button>
              
              <button
                onClick={() => handleReviewAction("APPROVE")}
                disabled={isSubmittingReview}
                className="flex-1 h-11 bg-emerald-650 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
              >
                <Check className="w-4 h-4" /> Approve & Mark Paid
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Invoice details modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">Invoice Specifications</h3>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedInvoice.invoiceNumber}</h2>
              <p className="text-xs text-slate-500">{selectedInvoice.description}</p>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-800">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Client Contact</span>
                <span className="text-slate-900">{selectedInvoice.clientName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Freelancer</span>
                <span className="text-slate-900">{selectedInvoice.freelancerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Amount due</span>
                <span className="text-emerald-750 font-mono font-bold">{formatCurrency(selectedInvoice.amount)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Target Bank</span>
                <span className="text-slate-900">{selectedInvoice.bank || "OPay"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Target Account</span>
                <span className="text-slate-900 font-mono">{selectedInvoice.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date</span>
                <span className="text-slate-900">{selectedInvoice.dueDate}</span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  setSelectedInvoice(null);
                  alert("WhatsApp follow-up dispatch re-triggered manually.");
                }}
                className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Send Manual Follow-up
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
