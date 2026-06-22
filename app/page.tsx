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
import TwoSidedSection from "./components/TwoSidedSection";
import CollectionsAssistantSection from "./components/CollectionsAssistantSection";
import TimelineSection from "./components/TimelineSection";
import EmployerPainPoints from "./components/EmployerPainPoints";
import PricingCTASection from "./components/PricingCTASection";

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
        
        {/* Centered Glowing Title */}
        <ScrollReveal3D delay={150} duration={0.9} direction="tilt-up">
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-snug sm:leading-[1.1] md:leading-[1.08] max-w-4xl"
            style={{ color: "#090d16", WebkitTextFillColor: "#090d16", background: "none", WebkitBackgroundClip: "unset", backgroundClip: "unset" }}
          >
            The Payment Platform Built for<br />
            <span 
              className="bg-gradient-to-r from-emerald-650 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm block sm:inline mt-3.5 sm:mt-0"
              style={{ WebkitTextFillColor: "transparent" }}
            >
              Both Sides of the Invoice.
            </span>
          </h1>
        </ScrollReveal3D>

        <ScrollReveal3D delay={250} duration={0.9}>
          <p className="mt-8 text-base sm:text-lg md:text-xl text-slate-650 max-w-3xl font-medium leading-relaxed">
            Freelancers: stop chasing clients for payment. Employers: stop forgetting who you owe. Kavio automates both — so money moves on time, every time.
          </p>
        </ScrollReveal3D>

        {/* Primary CTAs */}
        <ScrollReveal3D delay={350} duration={0.9}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link 
              id="hero-cta-freelancer"
              href="/auth/signin?type=freelancer" 
              style={{ backgroundColor: '#00B140', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold shadow-xl shadow-emerald-500/20 hover:opacity-90 transition-all hover:scale-[1.03] active:scale-[0.97] no-underline"
            >
              I'm a Freelancer — Get Paid Faster <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              id="hero-cta-employer"
              href="/auth/signin?type=employer" 
              style={{ color: '#0f172a', WebkitTextFillColor: '#0f172a' }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-white border-2 border-[#00B140] hover:bg-emerald-50 shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97] no-underline"
            >
              I'm an Employer — Manage Contractor Payments <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal3D>

        <ScrollReveal3D delay={450} duration={0.9}>
          <p className="text-xs sm:text-sm text-slate-500 text-center font-normal mt-6">
            Used by freelancers and businesses across Nigeria 🇳🇬
          </p>
        </ScrollReveal3D>
      </section>

      {/* 3. Stats Section */}
      <section id="outcomes" className="py-20 bg-white border-y border-slate-100 relative">
        <div className="max-w-5xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Metric 1 */}
            <ScrollReveal3D delay={0} duration={0.8} direction="tilt-up">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 sm:p-8 text-center space-y-2 shadow-sm h-full flex flex-col justify-center">
                <h3 className="text-4xl font-extrabold tracking-tight font-mono mb-2" style={{ color: "#0f172a" }}>48 Hours</h3>
                <p className="text-xs text-slate-550 font-semibold mt-1">Target collection speed for freelancer invoices</p>
              </div>
            </ScrollReveal3D>

            {/* Metric 2 */}
            <ScrollReveal3D delay={150} duration={0.8} direction="tilt-up">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 sm:p-8 text-center space-y-2 shadow-sm h-full flex flex-col justify-center">
                <h3 className="text-4xl font-extrabold tracking-tight font-mono mb-2" style={{ color: "#0f172a" }}>0 Missed Payments</h3>
                <p className="text-xs text-slate-550 font-semibold mt-1">What employers using Kavio's reminder system report</p>
              </div>
            </ScrollReveal3D>

            {/* Metric 3 */}
            <ScrollReveal3D delay={300} duration={0.8} direction="tilt-up">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 sm:p-8 text-center space-y-2 shadow-sm h-full flex flex-col justify-center">
                <h3 className="text-4xl font-extrabold tracking-tight font-mono mb-2" style={{ color: "#0f172a" }}>2-Sided Platform</h3>
                <p className="text-xs text-slate-550 font-semibold mt-1">Built for both the person sending the invoice and the person paying it</p>
              </div>
            </ScrollReveal3D>
          </div>
        </div>
      </section>

      {/* 4. Two-Sided Platform Explainer Section */}
      <TwoSidedSection />

      {/* 5. Collections Assistant Section */}
      <CollectionsAssistantSection />

      {/* 6. Invoice Collection Timeline Section */}
      <TimelineSection />

      {/* 7. Employer Pain Points Section */}
      <EmployerPainPoints />

      {/* 8. Pricing/CTA Section */}
      <PricingCTASection />

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
              💚 Built for Nigerian Freelancers & Employers
            </div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              ✅ Optimized for OPay Transfers
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}