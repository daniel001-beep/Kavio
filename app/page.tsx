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

export const metadata: Metadata = {
  title: "Velox Fintech | Production-Ready Ledger Infrastructure",
  description: "Enterprise-grade double-entry ledger engine, multi-tenant wallet nesting, and high-frequency real-time event streams.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* 1. Header Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-900 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2 group no-underline">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <Cpu className="w-4.5 h-4.5" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
            Velox <span className="font-medium text-slate-400">Fintech</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
          <Link href="#features" className="hover:text-slate-100 transition-colors no-underline">Infrastructure</Link>
          <Link href="#telemetry" className="hover:text-slate-100 transition-colors no-underline">Telemetry</Link>
          <Link href="#api" className="hover:text-slate-100 transition-colors no-underline">API Specs</Link>
        </nav>
        <div>
          <Link 
            id="nav-cta-dashboard"
            href="/dashboard" 
            className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-950 hover:bg-slate-200 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] no-underline"
          >
            Go to Console <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        
        {/* Sub-badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-400 text-xs font-bold tracking-wide uppercase mb-6 animate-pulse shadow-sm shadow-blue-500/5">
          <Zap className="w-3.5 h-3.5" /> Core Infrastructure v2.4 Live
        </div>

        {/* Centered Glowing Title */}
        <h1 className="text-4xl sm:text-5xl md:text-7.5xl font-black tracking-tight leading-[1.08] max-w-4xl bg-gradient-to-b from-white via-slate-100 to-slate-500 bg-clip-text text-transparent">
          Production-Ready Fintech Infrastructure.<br />
          <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
            Launched in Milliseconds.
          </span>
        </h1>

        <p className="mt-8 text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl font-medium leading-relaxed">
          The mathematical, high-frequency transactional standard for B2B card issuers, neo-banks, and multi-tenant platforms. Fully compliant double-entry ledger constraints, streaming in sub-milliseconds.
        </p>

        {/* Primary CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link 
            id="hero-cta-dashboard"
            href="/dashboard" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-[1.03] active:scale-[0.97] no-underline border border-blue-400/20"
          >
            Explore Live Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link 
            id="hero-cta-docs"
            href="#api" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all hover:scale-[1.03] active:scale-[0.97] no-underline"
          >
            <Terminal className="w-4 h-4 text-slate-500" /> Read API Docs
          </Link>
        </div>
      </section>

      {/* 3. Features Bento Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Architected for Cryptographic Balance Control
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto font-medium">
            Velox replaces legacy periodic reconciliation with strict, database-level isolation and atomic constraints.
          </p>
        </div>

        {/* Bento Box style 3-column responsive grid layout using frosted glass */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Double-Entry Engine */}
          <div className="p-8 rounded-[24px] backdrop-blur-md bg-white/5 border border-white/10 flex flex-col justify-between group hover:border-blue-500/40 transition-all duration-300 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-blue-500/20 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Double-Entry Engine</h3>
              <p className="text-sm font-medium leading-relaxed text-slate-400">
                Velox enforces standard mathematical double-entry balance constraints natively at the database schema level. Utilizes atomic transaction isolation so credit and debit events never drift out of sync.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% ACID Compliant
            </div>
          </div>

          {/* Card 2: Multi-Tenant Account Nesting */}
          <div className="p-8 rounded-[24px] backdrop-blur-md bg-white/5 border border-white/10 flex flex-col justify-between group hover:border-indigo-500/40 transition-all duration-300 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Tenant Wallets</h3>
              <p className="text-sm font-medium leading-relaxed text-slate-400">
                Enables dynamic relational database mapping for multi-currency wallets, sub-ledger cards, and isolated tenant schemes. Safely isolate user ledger states while maintaining instant cross-currency conversion capabilities.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-widest">
              <GitBranch className="w-3.5 h-3.5" /> Unlimited Sub-Nesting
            </div>
          </div>

          {/* Card 3: High-Frequency Real-Time Streams */}
          <div className="p-8 rounded-[24px] backdrop-blur-md bg-white/5 border border-white/10 flex flex-col justify-between group hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Streams</h3>
              <p className="text-sm font-medium leading-relaxed text-slate-400">
                Streams balance mutations and security events natively over persistent, secure WebSocket connections. Eliminate UI polling, layout stutter, and state synchronization lag across global consumer applications.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-widest">
              <Globe className="w-3.5 h-3.5" /> Persistent WebSockets
            </div>
          </div>
        </div>
      </section>

      {/* 4. Telemetry Board */}
      <section id="telemetry" className="py-20 bg-slate-950 border-y border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Global Node Performance</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">Telemetry Board</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Metric 1 */}
            <div className="p-6 border border-slate-900 bg-slate-950 rounded-2xl">
              <span className="text-5xl font-mono font-bold tracking-tight text-white bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                2ms
              </span>
              <p className="mt-3 text-xs uppercase font-bold text-slate-500 tracking-wider">
                Time to First Byte (p90 Edge Response)
              </p>
            </div>
            {/* Metric 2 */}
            <div className="p-6 border border-slate-900 bg-slate-950 rounded-2xl">
              <span className="text-5xl font-mono font-bold tracking-tight text-white bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                99.4%
              </span>
              <p className="mt-3 text-xs uppercase font-bold text-slate-500 tracking-wider">
                Serverless Function Success Rate
              </p>
            </div>
            {/* Metric 3 */}
            <div className="p-6 border border-slate-900 bg-slate-950 rounded-2xl">
              <span className="text-5xl font-mono font-bold tracking-tight text-white bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                67.7%
              </span>
              <p className="mt-3 text-xs uppercase font-bold text-slate-500 tracking-wider">
                Advanced ISR Caching Hit Ratio
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Code Preview / IDE Container */}
      <section id="api" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text area */}
          <div className="lg:col-span-5">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Seamless Integration</span>
            <h2 className="text-3xl font-black text-white tracking-tight mt-3">
              Developer-First API Layout
            </h2>
            <p className="mt-6 text-sm sm:text-base leading-relaxed text-slate-400 font-medium">
              Integrate B2B wallet ledgers in seconds using fully documented HTTP protocols. Support for custom metadata parameters, and atomic verification is embedded in every transaction.
            </p>
            <ul className="mt-8 space-y-4 text-xs font-bold uppercase tracking-wider text-slate-300">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                Idempotency Safe Retries
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                Pure JSON Payloads
              </li>
            </ul>
          </div>

          {/* IDE Mockup */}
          <div className="lg:col-span-7 w-full">
            <div className="w-full bg-[#0d131f] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
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
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="mt-auto border-t border-slate-900 py-8 text-center text-xs text-slate-500 font-medium">
        <p>&copy; {new Date().getFullYear()} Velox Fintech. All rights reserved. Platform-wide secure SSL endpoints.</p>
      </footer>
    </div>
  );
}