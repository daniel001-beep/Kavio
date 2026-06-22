"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ScrollReveal3D from "./ScrollReveal3D";

export default function TimelineSection() {
  const [activeFlow, setActiveFlow] = useState<"freelancer" | "employer">("freelancer");

  return (
    <section className="py-24 px-6 max-w-5xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Text area */}
        <div className="lg:col-span-5">
          <ScrollReveal3D duration={0.8} direction="left">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Automation Flows</span>
            <h2 
              className="text-3xl font-black text-slate-900 tracking-tight mt-3"
              style={{ color: "#0f172a" }}
            >
              How It Works
            </h2>
            <p className="mt-6 text-sm sm:text-base leading-relaxed text-slate-600 font-medium">
              Kavio monitors due dates and handles all the communication and verification automatically. See how the magic happens.
            </p>
            <ul className="mt-8 space-y-4 text-xs font-bold uppercase tracking-wider text-slate-700">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-650 shadow-inner">
                  <Check className="w-3 h-3" />
                </div>
                Fully automated workflows
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-655 shadow-inner">
                  <Check className="w-3 h-3" />
                </div>
                Always on time, every time
              </li>
            </ul>
          </ScrollReveal3D>
        </div>

        {/* Visual Timeline */}
        <div className="lg:col-span-7 w-full flex flex-col items-center">
          {/* Flow Toggle */}
          <ScrollReveal3D delay={100} duration={0.8} direction="tilt-up" className="mb-8 w-full max-w-sm">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveFlow("freelancer")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeFlow === "freelancer" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Freelancer Flow
              </button>
              <button
                onClick={() => setActiveFlow("employer")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeFlow === "employer" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Employer Flow
              </button>
            </div>
          </ScrollReveal3D>

          <ScrollReveal3D delay={200} duration={0.95} direction="tilt-up" className="w-full">
            <div className="w-full bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden min-h-[500px]">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Kavio Autopilot</span>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight mt-1">
                    {activeFlow === 'freelancer' ? 'Invoice Collection Timeline' : 'Contractor Payout Timeline'}
                  </h3>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 font-bold border-none text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                  Active Pipeline
                </Badge>
              </div>

              {/* Freelancer Flow */}
              <div className={`absolute left-6 sm:left-8 right-6 sm:right-8 transition-opacity duration-300 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 ${activeFlow === 'freelancer' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
                {/* Step 1 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10">✓</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-850">Invoice Sent</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      You send an invoice to the client and set the due date.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10 animate-pulse">💬</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-850">Reminder Sent</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Kavio sends polite WhatsApp/Email reminders before and after the due date.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">✉️</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-850">Receipt Uploaded</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Client pays and uploads the bank transfer receipt.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-100">🤖</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-850">AI Verifies</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Kavio's AI verifies the receipt matches the invoice amount.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10">₦</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-850">Paid</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Invoice marked as paid and reminders are stopped.
                    </p>
                  </div>
                </div>
              </div>

              {/* Employer Flow */}
              <div className={`absolute left-6 sm:left-8 right-6 sm:right-8 transition-opacity duration-300 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 ${activeFlow === 'employer' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
                {/* Step 1 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-blue-500/10">1</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-850">Add Contractor</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Employer adds contractor name, role, amount owed, and due date.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-blue-500/10">2</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-850">Kavio Sets Reminder</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Automatic reminder scheduled 3 days before due date.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-amber-500/10 animate-pulse">3</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-850">You Get Notified</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      WhatsApp/email alert: "Payment to [Contractor] is due in 3 days."
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10">4</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-850">Make Payment</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Employer pays via bank transfer or OPay with pre-filled details.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4 items-start relative z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10">5</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-850">Contractor Confirms</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Contractor uploads receipt, Kavio verifies and closes the record.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </ScrollReveal3D>
        </div>
      </div>
    </section>
  );
}
