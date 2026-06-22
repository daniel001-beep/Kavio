"use client";

import React from "react";
import Link from "next/link";
import { Receipt, Users, Check } from "lucide-react";
import ScrollReveal3D from "./ScrollReveal3D";

export default function TwoSidedSection() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto w-full bg-white border-y border-slate-100">
      <ScrollReveal3D duration={0.8} direction="tilt-up">
        <div className="text-center mb-16">
          <h2 
            className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
            style={{ color: "#090d16" }}
          >
            One Platform. Two Problems Solved.
          </h2>
        </div>
      </ScrollReveal3D>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Freelancer Card */}
        <ScrollReveal3D delay={100} duration={0.8} direction="tilt-up" className="flex-1 w-full">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6 h-full flex flex-col hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-sm">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">For Freelancers</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Create invoices, send automatic WhatsApp and email reminders, and let AI verify bank transfer receipts — so you never have to chase a client again.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-8 mt-auto">
              {["WhatsApp Reminders", "AI Receipt Verification", "OPay Optimized", "PWA — Works on Any Phone"].map((feature) => (
                <span key={feature} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                  <Check className="w-3 h-3 text-emerald-500" /> {feature}
                </span>
              ))}
            </div>

            <Link 
              href="/auth/signin" 
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-[#00B140] text-white hover:opacity-90 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] no-underline"
            >
              Start Collecting →
            </Link>
          </div>
        </ScrollReveal3D>

        {/* Employer Card */}
        <ScrollReveal3D delay={200} duration={0.8} direction="tilt-up" className="flex-1 w-full">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6 h-full flex flex-col hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">For Employers</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Managing 5, 10, or 30 contractors? Add them once and Kavio reminds you automatically before every payment is due — so nobody waits, nobody chases, and your reputation stays intact.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-8 mt-auto">
              {["Contractor Dashboard", "Payment Reminders", "Due Date Alerts", "Full Payment History"].map((feature) => (
                <span key={feature} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                  <Check className="w-3 h-3 text-blue-500" /> {feature}
                </span>
              ))}
            </div>

            <Link 
              href="/auth/signin?type=employer" 
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-white text-slate-900 border-2 border-[#00B140] hover:bg-emerald-50 transition-all hover:scale-[1.02] active:scale-[0.98] no-underline"
            >
              Manage Contractor Payments →
            </Link>
          </div>
        </ScrollReveal3D>
      </div>
    </section>
  );
}
