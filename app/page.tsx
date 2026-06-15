import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Zap, 
  Terminal, 
  ArrowRight,
  Lock,
  MessageSquare,
  Mail,
  Clock,
  Check,
  CheckCircle2
} from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import ScrollReveal3D from "./components/ScrollReveal3D";

export const metadata: Metadata = {
  title: "Kavio | Automated Payment Collection for Freelancers",
  description: "Stop chasing clients. Kavio automates polite, persistent WhatsApp and Email nudges so you get paid on time, without the awkward silence.",
};

export default function Home() {
  return (
    <div data-page="landing" className="min-h-screen flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-800 overflow-x-hidden" style={{ background: "#f8fafc", color: "#0f172a" }}>
      
      {/* 1. Header Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-200/80 sticky top-0 bg-[#f8fafc]/80 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2 group no-underline">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
            Kavio <span className="font-semibold text-slate-500">Finance</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
          <Link href="#problem" className="hover:text-slate-900 transition-colors no-underline">The Problem</Link>
          <Link href="#solution" className="hover:text-slate-900 transition-colors no-underline">The Nudge Engine</Link>
          <Link href="#outcomes" className="hover:text-slate-900 transition-colors no-underline">Outcomes</Link>
        </nav>
        <div>
          <Link 
            id="nav-cta-dashboard"
            href="/dashboard" 
            style={{ backgroundColor: '#10b981', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] no-underline"
          >
            Launch Kavio <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        {/* Sub-badge */}
        <ScrollReveal3D delay={50} duration={0.8} direction="down">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-250 bg-emerald-50/50 text-emerald-700 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm shadow-emerald-100/50">
            <Zap className="w-3.5 h-3.5" /> Stop Chasing. Start Collecting.
          </div>
        </ScrollReveal3D>

        {/* Centered Glowing Title */}
        <ScrollReveal3D delay={150} duration={0.9} direction="tilt-up">
          <h1 
            className="text-4xl sm:text-5xl md:text-7.5xl font-black tracking-tight leading-snug sm:leading-[1.1] md:leading-[1.08] max-w-4xl"
            style={{ color: "#090d16", WebkitTextFillColor: "#090d16", background: "none", WebkitBackgroundClip: "unset", backgroundClip: "unset" }}
          >
            Stop Chasing Payments.<br />
            <span 
              className="bg-gradient-to-r from-emerald-650 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm block sm:inline mt-3.5 sm:mt-0"
              style={{ WebkitTextFillColor: "transparent" }}
            >
              Get Paid Faster.
            </span>
          </h1>
        </ScrollReveal3D>

        <ScrollReveal3D delay={200} duration={0.9}>
          <p className="text-xs sm:text-sm text-slate-500 text-center font-normal mt-4">
            Trusted by freelancers and small businesses across Nigeria 🇳🇬
          </p>
        </ScrollReveal3D>

        <ScrollReveal3D delay={250} duration={0.9}>
          <p className="mt-8 text-base sm:text-lg md:text-xl text-slate-650 max-w-2xl font-medium leading-relaxed">
            Track invoices, monitor outstanding revenue, identify risky clients, and send payment reminders from one unified space.
          </p>
        </ScrollReveal3D>

        {/* Primary CTAs */}
        <ScrollReveal3D delay={350} duration={0.9}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link 
              id="hero-cta-dashboard"
              href="/dashboard" 
              style={{ backgroundColor: '#10b981', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold shadow-xl shadow-emerald-500/20 hover:opacity-90 transition-all hover:scale-[1.03] active:scale-[0.97] no-underline"
            >
              Automate My Collections <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              id="hero-cta-docs"
              href="/auth/signin?demo=true" 
              style={{ color: '#0f172a', WebkitTextFillColor: '#0f172a' }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97] no-underline"
            >
              <Zap className="w-4 h-4 text-emerald-500" /> Start Free Demo
            </Link>
          </div>
        </ScrollReveal3D>
      </section>

      {/* 3. Problem Section */}
      <section id="problem" className="py-24 bg-white border-y border-slate-100 px-6 w-full">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <ScrollReveal3D duration={0.8} direction="left">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">The Freelancer's Reality</span>
                <h2 
                  className="text-3xl font-black text-slate-900 tracking-tight mt-3"
                  style={{ color: "#0f172a" }}
                >
                  The "Awkward Silence" of Unpaid Invoices
                </h2>
                <p className="text-slate-655 font-medium text-sm sm:text-base leading-relaxed mt-4">
                  You completed the project on time. You sent the invoice. And then... nothing. Just absolute silence.
                </p>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mt-3">
                  Now you have to choose between waiting indefinitely or drafting a series of uncomfortable emails, worried about sounding too desperate or damaging the client relationship. 
                </p>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mt-3 font-semibold text-rose-600">
                  Manual chasing kills your creative flow, wastes hours of your week, and strains client relationships.
                </p>
              </ScrollReveal3D>
            </div>
            
            <div className="lg:col-span-6">
              <ScrollReveal3D delay={200} duration={0.9} direction="tilt-up">
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">The Friction Checklist</span>
                    <h4 className="text-sm font-bold text-slate-800">Why manual reminders fail:</h4>
                  </div>
                  <ul className="space-y-3.5 text-xs text-slate-650 font-semibold list-none p-0">
                    <li className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">✕</div>
                      <span>Reminding clients manually feels uncomfortable and harms client trust.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">✕</div>
                      <span>Emails easily get buried in inbox clutter or marked as read and forgotten.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">✕</div>
                      <span>Tracking due dates takes time away from billable design or development work.</span>
                    </li>
                  </ul>
                </div>
              </ScrollReveal3D>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Solution Section (The Nudge Engine) */}
      <section id="solution" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <ScrollReveal3D duration={0.8} threshold={0.15}>
          <div className="text-center mb-16">
            <h2 
              className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
              style={{ color: "#090d16" }}
            >
              Meet Your Collections Assistant
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto font-medium">
              Kavio takes the awkwardness out of getting paid. We act as your sidekick, handling late payments politely and persistently.
            </p>
          </div>
        </ScrollReveal3D>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Solution Cards */}
          <div className="lg:col-span-6 space-y-6">
            {/* Card 1: Polite Automation */}
            <ScrollReveal3D delay={0} duration={0.8} direction="tilt-up">
              <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 group card-3d-premium card-3d-emerald relative overflow-hidden shadow-sm shadow-slate-100">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "#0f172a" }}>Automated WhatsApp Follow-ups</h3>
                    <p className="text-xs font-semibold leading-relaxed text-slate-600">
                      Reminders are delivered directly to your client's WhatsApp chat window. Kavio writes polite, contextual reminders using client details so payments are made without delays.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal3D>

            {/* Card 2: Email Backup Reminders */}
            <ScrollReveal3D delay={150} duration={0.8} direction="tilt-up">
              <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 group card-3d-premium card-3d-blue relative overflow-hidden shadow-sm shadow-slate-100">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "#0f172a" }}>Polite Email Sequences</h3>
                    <p className="text-xs font-semibold leading-relaxed text-slate-600">
                      If WhatsApp isn't preferred, Kavio schedules beautiful, clean billing notifications containing direct links. The email copy is structured as a helpful check-in to preserve client goodwill.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal3D>

            {/* Card 3: Persistence Intervals */}
            <ScrollReveal3D delay={300} duration={0.8} direction="tilt-up">
              <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 group card-3d-premium card-3d-indigo relative overflow-hidden shadow-sm shadow-slate-100">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "#0f172a" }}>Smart Reminders Scheduling</h3>
                    <p className="text-xs font-semibold leading-relaxed text-slate-600">
                      Configure nudges to trigger automatically 3 days before the due date, on the due date, and every 48 hours afterward until the balance is resolved.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal3D>

            {/* Card 4: OPay Optimized Payments */}
            <ScrollReveal3D delay={450} duration={0.8} direction="tilt-up">
              <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 group card-3d-premium card-3d-emerald relative overflow-hidden shadow-sm shadow-slate-100">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 text-base">
                    💚
                  </div>
                  <div>
                    <h3 className="text-base font-bold mb-2" style={{ color: "#0f172a" }}>OPay Optimized Payments</h3>
                    <p className="text-xs font-semibold leading-relaxed text-slate-600">
                      Clients with OPay wallets can pay instantly with one tap. Kavio generates a direct OPay payment link pre-filled with the freelancer's account details and invoice amount — no manual copying needed
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal3D>
          </div>

          {/* Visual Nudge Mockup (WhatsApp preview) */}
          <div className="lg:col-span-6 w-full flex justify-center">
            <ScrollReveal3D delay={200} duration={0.9} direction="tilt-up">
              <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative p-4 font-sans text-xs">
                
                {/* Chat Top bar */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-900 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-extrabold text-white text-[11px] shadow-sm">
                    KA
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs">Kavio Assistant</h4>
                    <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active Collection Node
                    </p>
                  </div>
                </div>

                {/* WhatsApp Message Preview Box */}
                <div className="space-y-3.5">
                  <div className="bg-[#121b22] text-[#e9edef] p-3.5 rounded-2xl rounded-tl-none border border-slate-800 max-w-[90%] mr-auto shadow-md">
                    <p className="leading-relaxed text-[11px]">
                      Hi Chioma, hope you're having a great week! 
                    </p>
                    <p className="leading-relaxed text-[11px] mt-1.5">
                      Just a friendly note that invoice <strong className="text-emerald-400">INV-2026-002</strong> for <strong>Flutterwave Inc.</strong> is due tomorrow. 
                    </p>
                    <p className="leading-relaxed text-[11px] mt-1.5">
                      You can complete payment instantly via bank transfer or card using this secure link:
                    </p>
                    <a href="#" className="text-sky-400 underline block mt-2 text-[10px] truncate">
                      https://kavio.finance/pay/invoice-inv-2026-002
                    </a>
                  </div>

                  <div className="bg-[#0b141a]/60 text-slate-500 text-[9px] font-bold text-center py-2.5 uppercase tracking-widest border-t border-slate-900 mt-4">
                    ⚡ Auto-reminders pause once client pays
                  </div>
                </div>

              </div>
            </ScrollReveal3D>
          </div>
        </div>
      </section>

      {/* 5. Outcomes & Metrics Section */}
      <section id="outcomes" className="py-20 bg-white border-y border-slate-250 relative">
        <div className="max-w-5xl mx-auto px-6 w-full">
          <ScrollReveal3D duration={0.8}>
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Proven Outcomes</span>
              <h2 
                className="text-2xl sm:text-3xl font-black text-slate-900 mt-2"
                style={{ color: "#090d16" }}
              >
                Collection Analytics & Payout Performance
              </h2>
            </div>
          </ScrollReveal3D>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Metric 1 */}
            <ScrollReveal3D delay={0} duration={0.8} direction="tilt-up">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 sm:p-8 text-center space-y-2 shadow-sm">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Average collection speed</span>
                <h3 className="text-4xl font-extrabold tracking-tight font-mono" style={{ color: "#0f172a" }}>48 Hours</h3>
                <p className="text-xs text-slate-550 font-semibold mt-1">Target collection speed based on WhatsApp nudge behavior research</p>
              </div>
            </ScrollReveal3D>

            {/* Metric 2 */}
            <ScrollReveal3D delay={150} duration={0.8} direction="tilt-up">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 sm:p-8 text-center space-y-2 shadow-sm">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">First-nudge success rate</span>
                <h3 className="text-4xl font-extrabold tracking-tight font-mono" style={{ color: "#0f172a" }}>94%</h3>
                <p className="text-xs text-slate-550 font-semibold mt-1">Of early testers reported faster payment after first WhatsApp nudge</p>
              </div>
            </ScrollReveal3D>

            {/* Metric 3 */}
            <ScrollReveal3D delay={300} duration={0.8} direction="tilt-up">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 sm:p-8 text-center space-y-2 shadow-sm">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Awkward Conversations Avoided</span>
                <h3 className="text-4xl font-extrabold tracking-tight font-mono" style={{ color: "#10b981" }}>100%</h3>
                <p className="text-xs text-slate-550 font-semibold mt-1">The system does the chasing, so you stay the creative professional.</p>
              </div>
            </ScrollReveal3D>
          </div>
        </div>
      </section>

      {/* 6. Integration API Section */}
      <section className="py-24 px-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text area */}
          <div className="lg:col-span-5">
            <ScrollReveal3D duration={0.8} direction="left">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Invoice Automation</span>
              <h2 
                className="text-3xl font-black text-slate-900 tracking-tight mt-3"
                style={{ color: "#0f172a" }}
              >
                Auto-Reminders Setup
              </h2>
              <p className="mt-6 text-sm sm:text-base leading-relaxed text-slate-600 font-medium">
                Configure collection parameters directly when you draft an invoice. Let Kavio monitor dates and handle follow-ups automatically.
              </p>
              <ul className="mt-8 space-y-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-650 shadow-inner">
                    <Check className="w-3 h-3" />
                  </div>
                  Polite conversational copy presets
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-655 shadow-inner">
                    <Check className="w-3 h-3" />
                  </div>
                  Auto-pauses the instant payment clears
                </li>
              </ul>
            </ScrollReveal3D>
          </div>

          {/* Visual Invoice Collection Timeline (Replaces Developer Code Mockup) */}
          <div className="lg:col-span-7 w-full flex justify-center">
            <ScrollReveal3D delay={200} duration={0.95} direction="tilt-up" className="w-full">
              <div className="w-full bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Kavio Auto-Reminders</span>
                    <h3 className="text-base font-bold text-slate-800 tracking-tight mt-1">Invoice Collection Timeline</h3>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 font-bold border-none text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                    Active Pipeline
                  </Badge>
                </div>

                <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  
                  {/* Step 1 */}
                  <div className="flex gap-4 items-start relative z-10">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10">
                      ✓
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-850">Invoice Created</span>
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">Day 0</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                        You send a professional invoice for <strong className="text-slate-800">₦1,200,000</strong> to client **Chioma Nze**.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4 items-start relative z-10">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10 animate-pulse">
                      💬
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-850">Friendly Check-in</span>
                        <span className="text-[9px] font-mono text-emerald-650 bg-emerald-50 px-1.5 py-0.5 rounded font-black">2 Days Before Due</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                        Kavio automatically delivers a polite WhatsApp check-in containing a secure payment link directly to Chioma's phone.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4 items-start relative z-10">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">
                      ✉️
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-850">Payment Due Date</span>
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">Day 30</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                        A beautiful email reminder with clear local bank transfer details is delivered automatically.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-4 items-start relative z-10">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-100">
                      ₦
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-850">Automatic Pause & Complete</span>
                        <span className="text-[9px] font-mono text-emerald-650 bg-emerald-50 px-1.5 py-0.5 rounded font-black font-mono">Payment Cleared</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                        Client uploads payment receipt. Kavio's AI verifies it instantly and pauses all future reminders automatically
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </ScrollReveal3D>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white pt-16 pb-12 w-full">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Column */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 group no-underline">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-slate-950 tracking-tight">
                Kavio <span className="font-semibold text-slate-500">Finance</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mt-2">
              The polite, persistent collection assistant for freelancers. Automating late invoice reminders via WhatsApp and Email.
            </p>
          </div>

          {/* Product Links */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</span>
            <ul className="space-y-2 text-xs font-bold text-slate-600 list-none p-0 m-0">
              <li><Link href="#problem" className="hover:text-emerald-650 transition-colors no-underline">The Problem</Link></li>
              <li><Link href="#solution" className="hover:text-emerald-650 transition-colors no-underline">The Nudge Engine</Link></li>
              <li><Link href="#outcomes" className="hover:text-emerald-650 transition-colors no-underline">Outcomes</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resources</span>
            <ul className="space-y-2 text-xs font-bold text-slate-600 list-none p-0 m-0">
              <li><Link href="/dashboard" className="hover:text-emerald-650 transition-colors no-underline">Launch Dashboard</Link></li>
              <li><Link href="/auth/signin?demo=true" className="hover:text-emerald-650 transition-colors no-underline">Live Demo</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security & Compliance</span>
            <ul className="space-y-2 text-xs font-bold text-slate-600 list-none p-0 m-0">
              <li><Link href="/dashboard/settings" className="hover:text-emerald-650 transition-colors no-underline">Account Security</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-650 transition-colors no-underline">Privacy Policy</Link></li>
              <li><Link href="/" className="hover:text-emerald-650 transition-colors no-underline">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto px-6 border-t border-slate-200 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 font-medium m-0">
            &copy; {new Date().getFullYear()} Kavio Finance. All rights reserved.
          </p>
          <div className="flex flex-col items-center sm:items-end gap-1.5">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Platform Status: Fully Operational
            </div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              💚 Optimized for OPay Transfers
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}