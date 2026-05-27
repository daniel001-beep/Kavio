import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Layers, 
  Zap, 
  Terminal, 
  Cpu, 
  ArrowRight,
  Database,
  RefreshCw,
  GitBranch,
  Lock,
  Globe
} from "lucide-react";
import type { Metadata } from "next";
import ScrollReveal3D from "./components/ScrollReveal3D";

export const metadata: Metadata = {
  title: "Velox Fintech | Production-Ready Ledger Infrastructure",
  description: "Enterprise-grade double-entry ledger engine, multi-tenant wallet nesting, and high-frequency real-time event streams.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-600 overflow-x-hidden">
      
      {/* 1. Header Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-200/80 sticky top-0 bg-[#f8fafc]/80 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2 group no-underline">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <Cpu className="w-4.5 h-4.5" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
            Velox <span className="font-semibold text-slate-500">Fintech</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
          <Link href="#features" className="hover:text-slate-900 transition-colors no-underline">Infrastructure</Link>
          <Link href="#telemetry" className="hover:text-slate-900 transition-colors no-underline">Telemetry</Link>
          <Link href="#api" className="hover:text-slate-900 transition-colors no-underline">API Specs</Link>
        </nav>
        <div>
          <Link 
            id="nav-cta-dashboard"
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] no-underline"
          >
            Go to Console <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        {/* Sub-badge */}
        <ScrollReveal3D delay={50} duration={0.8} direction="down">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50/50 text-blue-700 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm shadow-blue-100/50">
            <Zap className="w-3.5 h-3.5" /> Core Infrastructure v2.4 Live
          </div>
        </ScrollReveal3D>

        {/* Centered Glowing Title (Guaranteed Sharp Visible Slate/Black Text) */}
        <ScrollReveal3D delay={150} duration={0.9} direction="tilt-up">
          <h1 
            className="text-4xl sm:text-5xl md:text-7.5xl font-black tracking-tight leading-snug sm:leading-[1.1] md:leading-[1.08] max-w-4xl"
            style={{ color: "#090d16", WebkitTextFillColor: "#090d16", background: "none", WebkitBackgroundClip: "unset", backgroundClip: "unset" }}
          >
            Production-Ready Fintech Infrastructure.<br />
            <span 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm block sm:inline mt-3.5 sm:mt-0"
              style={{ WebkitTextFillColor: "transparent" }}
            >
              Launched in Milliseconds.
            </span>
          </h1>
        </ScrollReveal3D>

        <ScrollReveal3D delay={250} duration={0.9}>
          <p className="mt-8 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl font-medium leading-relaxed">
            The mathematical, high-frequency transactional standard for B2B card issuers, neo-banks, and multi-tenant platforms. Fully compliant double-entry ledger constraints, streaming in sub-milliseconds.
          </p>
        </ScrollReveal3D>

        {/* Primary CTAs */}
        <ScrollReveal3D delay={350} duration={0.9}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link 
              id="hero-cta-dashboard"
              href="/dashboard" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold bg-slate-900 text-white shadow-xl shadow-slate-800/10 hover:bg-slate-800 transition-all hover:scale-[1.03] active:scale-[0.97] no-underline border border-slate-900/10"
            >
              Explore Live Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              id="hero-cta-docs"
              href="#api" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97] no-underline"
            >
              <Terminal className="w-4 h-4 text-slate-500" /> Read API Docs
            </Link>
          </div>
        </ScrollReveal3D>
      </section>

      {/* 2.5 — Animated Platform Metrics Strip (Stripe/Plaid style) */}
      <section className="w-full border-y border-slate-200/80 bg-white/60 backdrop-blur-sm py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-slate-200">
            {[
              { value: '99.97%', label: 'Platform Uptime', live: true },
              { value: '< 2ms', label: 'Ledger Write Latency', live: false },
              { value: '2x Entry', label: 'Double-Entry Enforced', live: false },
              { value: 'SOC 2', label: 'Security Standard Ready', live: false },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1 px-4 text-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">
                    {stat.value}
                  </span>
                  {stat.live && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Live</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Features Bento Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <ScrollReveal3D duration={0.8} threshold={0.15}>
          <div className="text-center mb-16">
            {/* Guaranteed Bold Visible Black feature header */}
            <h2 
              className="text-3xl font-black tracking-tight text-slate-955 sm:text-4xl"
              style={{ color: "#090d16", WebkitTextFillColor: "#090d16", background: "none" }}
            >
              Architected for Cryptographic Balance Control
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto font-medium">
              Velox replaces legacy periodic reconciliation with strict, database-level isolation and atomic constraints.
            </p>
          </div>
        </ScrollReveal3D>

        {/* Bento Box style 3-column responsive grid layout using white frosted glass */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Double-Entry Engine */}
          <ScrollReveal3D delay={0} duration={0.85} direction="tilt-up" className="h-full">
            <div className="h-full p-8 rounded-[24px] bg-white border border-slate-200/80 flex flex-col justify-between group card-3d-premium card-3d-blue relative overflow-hidden shadow-sm shadow-slate-100">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-blue-500/10 transition-all" />
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <Database className="w-5 h-5" />
                </div>
                {/* Guaranteed Sharp Visible Black header */}
                <h3 
                  className="text-xl font-bold text-slate-955 mb-3"
                  style={{ color: "#090d16", WebkitTextFillColor: "#090d16", background: "none" }}
                >
                  Double-Entry Engine
                </h3>
                <p className="text-sm font-medium leading-relaxed text-slate-700">
                  Velox enforces standard mathematical double-entry balance constraints natively at the database schema level. Utilizes atomic transaction isolation so credit and debit events never drift out of sync.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% ACID Compliant
              </div>
            </div>
          </ScrollReveal3D>

          {/* Card 2: Multi-Tenant Wallets */}
          <ScrollReveal3D delay={150} duration={0.85} direction="tilt-up" className="h-full">
            <div className="h-full p-8 rounded-[24px] bg-white border border-slate-200/80 flex flex-col justify-between group card-3d-premium card-3d-indigo relative overflow-hidden shadow-sm shadow-slate-100">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <GitBranch className="w-5 h-5" />
                </div>
                {/* Guaranteed Sharp Visible Black header */}
                <h3 
                  className="text-xl font-bold text-slate-955 mb-3"
                  style={{ color: "#090d16", WebkitTextFillColor: "#090d16", background: "none" }}
                >
                  Multi-Tenant Wallets
                </h3>
                <p className="text-sm font-medium leading-relaxed text-slate-700">
                  Enables dynamic relational database mapping for multi-currency wallets, sub-ledger cards, and isolated tenant schemes. Safely isolate user ledger states while maintaining instant cross-currency conversion capabilities.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-widest">
                <GitBranch className="w-3.5 h-3.5" /> Unlimited Sub-Nesting
              </div>
            </div>
          </ScrollReveal3D>

          {/* Card 3: Real-Time Streams */}
          <ScrollReveal3D delay={300} duration={0.85} direction="tilt-up" className="h-full">
            <div className="h-full p-8 rounded-[24px] bg-white border border-slate-200/80 flex flex-col justify-between group card-3d-premium card-3d-emerald relative overflow-hidden shadow-sm shadow-slate-100">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <RefreshCw className="w-5 h-5" />
                </div>
                {/* Guaranteed Sharp Visible Black header */}
                <h3 
                  className="text-xl font-bold text-slate-955 mb-3"
                  style={{ color: "#090d16", WebkitTextFillColor: "#090d16", background: "none" }}
                >
                  Real-Time Streams
                </h3>
                <p className="text-sm font-medium leading-relaxed text-slate-700">
                  Streams balance mutations and security events natively over persistent, secure WebSocket connections. Eliminate UI polling, layout stutter, and state synchronization lag across global consumer applications.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-emerald-600 uppercase tracking-widest">
                <Globe className="w-3.5 h-3.5" /> Persistent WebSockets
              </div>
            </div>
          </ScrollReveal3D>
        </div>
      </section>

      {/* 4. Telemetry Board */}
      <section id="telemetry" className="py-20 bg-white border-y border-slate-200/60 relative">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <ScrollReveal3D duration={0.8}>
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Global Node Performance</span>
              {/* Guaranteed Sharp Visible Black Header */}
              <h2 
                className="text-2xl sm:text-3xl font-black text-slate-955 mt-2"
                style={{ color: "#090d16", WebkitTextFillColor: "#090d16", background: "none" }}
              >
                Telemetry Board
              </h2>
            </div>
          </ScrollReveal3D>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Metric 1 - CDN */}
            <ScrollReveal3D delay={0} duration={0.8} direction="tilt-up" className="h-full">
              <div className="h-full min-h-[160px] flex items-center justify-center rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-white p-4">
                <img 
                  src="/cdn.png" 
                  alt="CDN Performance" 
                  className="max-w-full h-auto max-h-[180px] object-contain select-none" 
                  style={{ imageRendering: "-webkit-optimize-contrast" }}
                />
              </div>
            </ScrollReveal3D>
            {/* Metric 2 - 2ms */}
            <ScrollReveal3D delay={150} duration={0.8} direction="tilt-up" className="h-full">
              <div className="h-full min-h-[160px] flex items-center justify-center rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-white p-4">
                <img 
                  src="/2ms.png" 
                  alt="2ms Response Time" 
                  className="max-w-full h-auto max-h-[180px] object-contain select-none" 
                  style={{ imageRendering: "-webkit-optimize-contrast" }}
                />
              </div>
            </ScrollReveal3D>
            {/* Metric 3 - ISR */}
            <ScrollReveal3D delay={300} duration={0.8} direction="tilt-up" className="h-full">
              <div className="h-full min-h-[160px] flex items-center justify-center rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-white p-4">
                <img 
                  src="/isr.png" 
                  alt="ISR Caching" 
                  className="max-w-full h-auto max-h-[180px] object-contain select-none" 
                  style={{ imageRendering: "-webkit-optimize-contrast" }}
                />
              </div>
            </ScrollReveal3D>
          </div>
        </div>
      </section>

      {/* 5. Code Preview / IDE Container */}
      <section id="api" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text area */}
          <div className="lg:col-span-5">
            <ScrollReveal3D duration={0.8} direction="left">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Seamless Integration</span>
              {/* Guaranteed Sharp Visible Black Header */}
              <h2 
                className="text-3xl font-black text-slate-955 tracking-tight mt-3"
                style={{ color: "#090d16", WebkitTextFillColor: "#090d16", background: "none" }}
              >
                Developer-First API Layout
              </h2>
              <p className="mt-6 text-sm sm:text-base leading-relaxed text-slate-600 font-medium">
                Integrate B2B wallet ledgers in seconds using fully documented HTTP protocols. Support for custom metadata parameters, and atomic verification is embedded in every transaction.
              </p>
              <ul className="mt-8 space-y-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-50/80 flex items-center justify-center text-blue-600 shadow-inner">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  Idempotency Safe Retries
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-50/80 flex items-center justify-center text-blue-600 shadow-inner">
                    <Terminal className="w-3.5 h-3.5" />
                  </div>
                  Pure JSON Payloads
                </li>
              </ul>
            </ScrollReveal3D>
          </div>

          {/* IDE Mockup */}
          <div className="lg:col-span-7 w-full">
            <ScrollReveal3D delay={200} duration={0.95} direction="tilt-up">
              <div className="w-full bg-[#0d131f] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden card-3d-premium">
                {/* IDE Top bar */}
                <div className="px-6 py-4.5 bg-[#070b13] border-b border-slate-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-[11px] font-mono font-bold text-slate-500 ml-4">POST /api/v1/ledger</span>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/5 border border-blue-500/10">
                    Secure Request
                  </div>
                </div>

                {/* Code Panel */}
                <div className="p-6 overflow-x-auto font-mono text-xs text-slate-300 leading-relaxed max-w-full">
                  <pre className="text-left select-all">
                    <code>
<span className="text-emerald-400 font-bold">curl</span> -X POST <span className="text-blue-400">"https://api.velox.com/v1/ledger"</span> \
  -H <span className="text-amber-400">"Authorization: Bearer sec_live_839a2k"</span> \
  -H <span className="text-amber-400">"Content-Type: application/json"</span> \
  -H <span className="text-amber-400">"X-Idempotency-Key: tx_idemp_83ha9d"</span> \
  -d <span className="text-blue-400">'{'{'}
    <span className="text-purple-400">"user_id"</span>: <span className="text-emerald-300">"usr_6wshej3ht"</span>,
    <span className="text-purple-400">"amount"</span>: <span className="text-emerald-300">"145000"</span>, <span className="text-slate-500">// BigInt cents/kobo (1,450.00)</span>
    <span className="text-purple-400">"currency"</span>: <span className="text-emerald-300">"USD"</span>,
    <span className="text-purple-400">"metadata"</span>: {'{'}
      <span className="text-purple-400">"client_name"</span>: <span className="text-emerald-300">"Daniel's Laptop"</span>,
      <span className="text-purple-400">"description"</span>: <span className="text-emerald-300">"Vault Allocation Mutation"</span>
    {'}'}
  {'}'}'</span>
                    </code>
                  </pre>
                </div>
              </div>
            </ScrollReveal3D>
          </div>
        </div>
      </section>

      {/* 6. Premium Multi-Column Footer */}
      <footer className="mt-auto border-t border-slate-205 bg-white pt-16 pb-12 w-full">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 group no-underline">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-slate-950 tracking-tight">
                Velox <span className="font-semibold text-slate-500">Fintech</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mt-2">
              High-frequency, double-entry ledger engine and cryptographically isolated multi-tenant wallet systems built for B2B financial operators.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-600 tracking-wide uppercase">
                <Lock className="w-3 h-3 text-slate-400" /> SOC-2 Compliant
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-[9px] font-bold text-slate-600 tracking-wide uppercase">
                <ShieldCheck className="w-3 h-3 text-slate-400" /> PCI-DSS Lvl 1
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</span>
            <ul className="space-y-2 text-xs font-bold text-slate-600 list-none p-0 m-0">
              <li><Link href="#features" className="hover:text-blue-600 transition-colors no-underline">Ledger Engine</Link></li>
              <li><Link href="#features" className="hover:text-blue-600 transition-colors no-underline">Wallet Nesting</Link></li>
              <li><Link href="#features" className="hover:text-blue-600 transition-colors no-underline">Real-Time Streams</Link></li>
              <li><Link href="#telemetry" className="hover:text-blue-600 transition-colors no-underline">System Performance</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resources</span>
            <ul className="space-y-2 text-xs font-bold text-slate-600 list-none p-0 m-0">
              <li><Link href="#api" className="hover:text-blue-600 transition-colors no-underline">API Specification</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-600 transition-colors no-underline">Developer Console</Link></li>
              <li><Link href="#api" className="hover:text-blue-600 transition-colors no-underline">Integration Guide</Link></li>
              <li><Link href="#telemetry" className="hover:text-blue-600 transition-colors no-underline">Status Sandbox</Link></li>
            </ul>
          </div>

          {/* Security & Legal Links */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security & Compliance</span>
            <ul className="space-y-2 text-xs font-bold text-slate-600 list-none p-0 m-0">
              <li><Link href="/dashboard" className="hover:text-blue-600 transition-colors no-underline">Audit Timelines</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-600 transition-colors no-underline">Identity Verification (KYC)</Link></li>
              <li><Link href="/" className="hover:text-blue-600 transition-colors no-underline">Security Policy</Link></li>
              <li><Link href="/" className="hover:text-blue-600 transition-colors no-underline">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto px-6 border-t border-slate-200 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-505 font-medium m-0">
            &copy; {new Date().getFullYear()} Velox Fintech Inc. All rights reserved. Platform-wide secure SSL endpoints.
          </p>
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Platform Status: Fully Operational
          </div>
        </div>
      </footer>
    </div>
  );
}