"use client";

import React, { useState } from "react";
import { MessageSquare, Mail, Clock, FileText, Bell, History, ArrowRight } from "lucide-react";
import ScrollReveal3D from "./ScrollReveal3D";

export default function CollectionsAssistantSection() {
  const [activeTab, setActiveTab] = useState<"freelancers" | "employers">("freelancers");

  return (
    <section id="solution" className="py-24 px-6 max-w-7xl mx-auto w-full">
      <ScrollReveal3D duration={0.8} threshold={0.15}>
        <div className="text-center mb-10">
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

      {/* Tab Switcher */}
      <ScrollReveal3D delay={100} duration={0.8} direction="tilt-up">
        <div className="flex justify-center mb-12 overflow-x-auto pb-4">
          <div className="flex bg-slate-50 p-1 rounded-full border border-slate-100 min-w-max">
            <button
              onClick={() => setActiveTab("freelancers")}
              className={`px-6 py-2.5 rounded-full text-sm transition-all duration-200 ${
                activeTab === "freelancers"
                  ? "bg-[#00B140] text-white font-semibold shadow-md"
                  : "bg-transparent text-slate-600 font-medium hover:bg-slate-200"
              }`}
            >
              For Freelancers
            </button>
            <button
              onClick={() => setActiveTab("employers")}
              className={`px-6 py-2.5 rounded-full text-sm transition-all duration-200 ${
                activeTab === "employers"
                  ? "bg-[#00B140] text-white font-semibold shadow-md"
                  : "bg-transparent text-slate-600 font-medium hover:bg-slate-200"
              }`}
            >
              For Employers
            </button>
          </div>
        </div>
      </ScrollReveal3D>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Solution Cards */}
        <div className="lg:col-span-6 space-y-6 relative min-h-[500px]">
          
          <div className={`absolute inset-0 space-y-6 transition-opacity duration-300 ${activeTab === 'freelancers' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}`}>
            {/* Freelancer Card 1 */}
            <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 group card-3d-premium relative overflow-hidden shadow-sm shadow-slate-100 hover:shadow-md transition-all duration-200">
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

            {/* Freelancer Card 2 */}
            <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 group card-3d-premium relative overflow-hidden shadow-sm shadow-slate-100 hover:shadow-md transition-all duration-200">
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

            {/* Freelancer Card 3 */}
            <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 group card-3d-premium relative overflow-hidden shadow-sm shadow-slate-100 hover:shadow-md transition-all duration-200">
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


          </div>

          <div className={`absolute inset-0 space-y-6 transition-opacity duration-300 ${activeTab === 'employers' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}`}>
            {/* Employer Card 1 */}
            <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 group card-3d-premium relative overflow-hidden shadow-sm shadow-slate-100 hover:shadow-md transition-all duration-200">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "#0f172a" }}>Contractor Dashboard</h3>
                  <p className="text-xs font-semibold leading-relaxed text-slate-600">
                    Add all your contractors in one place — names, roles, agreed amounts, and payment dates. Never lose track of who you owe.
                  </p>
                </div>
              </div>
            </div>

            {/* Employer Card 2 */}
            <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 group card-3d-premium relative overflow-hidden shadow-sm shadow-slate-100 hover:shadow-md transition-all duration-200">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "#0f172a" }}>Automatic Payment Reminders</h3>
                  <p className="text-xs font-semibold leading-relaxed text-slate-600">
                    Kavio reminds you before each payment is due, not after. You get notified in advance so payments go out on time.
                  </p>
                </div>
              </div>
            </div>

            {/* Employer Card 3 */}
            <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 group card-3d-premium relative overflow-hidden shadow-sm shadow-slate-100 hover:shadow-md transition-all duration-200">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "#0f172a" }}>Payment History & Audit Trail</h3>
                  <p className="text-xs font-semibold leading-relaxed text-slate-600">
                    Every payment logged, every confirmation recorded. Full history of what was paid, when, and to whom.
                  </p>
                </div>
              </div>
            </div>

            {/* Employer Card 4 */}
            <div className="p-6 rounded-[24px] bg-white border border-slate-200/80 group card-3d-premium relative overflow-hidden shadow-sm shadow-slate-100 hover:shadow-md transition-all duration-200">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 text-base">
                  💚
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "#0f172a" }}>OPay Optimized Payouts</h3>
                  <p className="text-xs font-semibold leading-relaxed text-slate-600">
                    Send payments directly from your OPay wallet with one tap. Kavio pre-fills contractor account details automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Mockup */}
        <div className="lg:col-span-6 w-full flex justify-center mt-12 lg:mt-0">
          <ScrollReveal3D delay={200} duration={0.9} direction="tilt-up">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden relative p-5 font-sans">
              
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#00B140] flex items-center justify-center font-extrabold text-white text-sm shadow-sm">
                  KA
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold text-sm">Kavio Assistant</h4>
                  <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active Now
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Freelancer Mockup */}
                <div className={`${activeTab === 'freelancers' ? 'block animate-fade-in' : 'hidden'}`}>
                  <div className="bg-slate-50 text-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-200 max-w-[90%] mr-auto shadow-sm">
                    <p className="leading-relaxed text-sm">
                      Hi Chioma, hope you're having a great week! 
                    </p>
                    <p className="leading-relaxed text-sm mt-2">
                      Just a friendly note that invoice <strong className="text-emerald-600">INV-2026-002</strong> for <strong>Flutterwave Inc.</strong> is due tomorrow. 
                    </p>
                    <p className="leading-relaxed text-sm mt-2">
                      You can complete payment instantly via bank transfer or card using this secure link:
                    </p>
                    <a href="#" className="text-blue-600 font-medium block mt-3 text-xs truncate pointer-events-none">
                      https://kavio.finance/pay/invoice-inv-2026-002
                    </a>
                  </div>
                </div>

                {/* Employer Mockup */}
                <div className={`${activeTab === 'employers' ? 'block animate-fade-in' : 'hidden'}`}>
                  <div className="bg-slate-50 text-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-200 max-w-[90%] mr-auto shadow-sm">
                    <p className="leading-relaxed text-sm">
                      Hi Tunde, quick reminder! 
                    </p>
                    <p className="leading-relaxed text-sm mt-2">
                      Payment for <strong className="text-amber-600">David O. (Frontend Dev)</strong> is due in 3 days. 
                    </p>
                    <p className="leading-relaxed text-sm mt-2">
                      Amount: ₦450,000<br/>
                      Tap below to pay via OPay or mark as paid if already completed:
                    </p>
                    <a href="#" className="text-[#00B140] font-bold block mt-3 text-sm pointer-events-none">
                      [ Pay via OPay ]
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 text-slate-500 text-[10px] font-bold text-center py-3 uppercase tracking-widest border-t border-slate-100 mt-6 relative z-20 rounded-b-xl -mx-5 -mb-5">
                ⚡ Kavio Automated Alert
              </div>
            </div>
          </ScrollReveal3D>
        </div>
      </div>
    </section>
  );
}
