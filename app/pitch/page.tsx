"use client";

import React, { useState, useEffect } from "react";
import { 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  MessageSquare, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Layers, 
  Globe, 
  AlertTriangle,
  PlayCircle
} from "lucide-react";

export default function PitchPage() {
  const [activeSlide, setActiveSlide] = useState<"problem" | "solution" | "engine" | "how" | "market">("problem");
  const [mockVerificationState, setMockVerificationState] = useState<"idle" | "scanning" | "verified">("idle");
  const [progress, setProgress] = useState(0);

  // Tabs structure with custom labels requested by the user
  const tabs = [
    { id: "problem", label: "The Chasing Loop" },
    { id: "solution", label: "Automated Verification" },
    { id: "engine", label: "Gemini Vision Auditing" },
    { id: "how", label: "How it Works" },
    { id: "market", label: "Sizing the Opportunity" },
  ] as const;

  // Trigger simulated scanning effect
  const startMockScan = () => {
    setMockVerificationState("scanning");
    setProgress(0);
  };

  useEffect(() => {
    if (mockVerificationState === "scanning") {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setMockVerificationState("verified");
            return 100;
          }
          return prev + 10;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [mockVerificationState]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col py-16 px-4 relative overflow-hidden">
      
      {/* Decorative gradient canvas accents */}
      <div className="absolute top-[-20%] right-[-10%] w-[550px] h-[550px] rounded-full bg-emerald-100/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-15%] w-[550px] h-[550px] rounded-full bg-indigo-100/40 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Pitch Hero Section */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-black text-emerald-700 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-emerald-600" /> Presenting Kavio
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
            Freelancers stop chasing clients. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Get paid faster.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-bold">
            An AI-powered payment collection platform helping freelancers and small businesses get paid faster through automated reminders and intelligent transfer verification.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => window.location.href = "/demo"}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-6 py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer border-none"
            >
              Launch Live Demo <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.href = "/founder-demo"}
              className="border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black px-6 py-4 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              Explore Founder Dashboard
            </button>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-5 bg-slate-100 border border-slate-200/80 p-1.5 rounded-2xl text-center text-[10px] sm:text-xs font-black font-mono shadow-inner gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSlide(tab.id);
                setMockVerificationState("idle");
              }}
              className={`py-3 px-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer text-[10px] leading-tight font-black ${
                activeSlide === tab.id
                  ? "bg-white text-slate-900 shadow-md border border-slate-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Viewport */}
        <div className="bg-white border-2 border-slate-150 rounded-3xl p-6 sm:p-10 shadow-xl min-h-[380px] flex items-center">
          
          {/* PROBLEM TAB */}
          {activeSlide === "problem" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="space-y-5">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block font-mono">The Friction</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">The Chasing Loop</h2>
                <p className="text-xs sm:text-sm text-slate-605 leading-relaxed font-bold">
                  Freelancers lose up to <strong className="text-rose-600">20 hours a month</strong> manually emailing and texting clients for outstanding invoices.
                </p>
                <p className="text-xs sm:text-sm text-slate-605 leading-relaxed font-bold">
                  When payments are finally made via bank transfer, freelancers are vulnerable to <strong className="text-rose-600 font-extrabold">forged transfer receipts</strong> and delayed ledger clearance.
                </p>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 text-xs">
                <span className="font-black text-slate-500 uppercase tracking-wider block font-mono">Freelancer Pain Points</span>
                
                <div className="space-y-3 font-bold">
                  <div className="flex gap-3 text-rose-700 bg-rose-50 border border-rose-200/50 p-4 rounded-xl">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                    <div>
                      <h4 className="font-extrabold text-[12.5px]">Awkward Reminder Chats</h4>
                      <p className="text-[10.5px] text-slate-600 mt-1 font-semibold leading-normal">Damages relationships by repeatedly asking clients for cash manually.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 text-rose-700 bg-rose-50 border border-rose-200/50 p-4 rounded-xl">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                    <div>
                      <h4 className="font-extrabold text-[12.5px]">Screenshot Tampering</h4>
                      <p className="text-[10.5px] text-slate-600 mt-1 font-semibold leading-normal">Fake mobile app success receipts generated to trick freelancers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SOLUTION TAB */}
          {activeSlide === "solution" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="space-y-5">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block font-mono">The Breakthrough</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Automated Verification</h2>
                <p className="text-xs sm:text-sm text-slate-605 leading-relaxed font-bold">
                  Kavio offloads the awkwardness. Our scheduling node automatically contacts clients via WhatsApp & Email reminders.
                </p>
                <p className="text-xs sm:text-sm text-slate-605 leading-relaxed font-bold">
                  Clients upload transfers directly to the secure checkout. Gemini Vision instantly inspects and scores the payment proof, pausing reminders immediately.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3.5 text-xs">
                <span className="font-black text-slate-500 uppercase tracking-wider block font-mono">Product Benefits</span>
                
                <div className="space-y-3 font-bold">
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200/50 p-3.5 rounded-xl text-emerald-700">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Multi-channel follow-ups (WhatsApp + Email)</span>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200/50 p-3.5 rounded-xl text-emerald-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Gemini-powered transaction verification</span>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200/50 p-3.5 rounded-xl text-emerald-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Automatic reminder suspension on verify</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENGINE DEMO TAB */}
          {activeSlide === "engine" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="space-y-5">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block font-mono">AI-Powered Scorer</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">Gemini Vision Auditing</h2>
                <p className="text-xs sm:text-sm text-slate-605 leading-relaxed font-bold">
                  We use Gemini Vision to parse uploaded receipts. The verification engine assigns trust weights to different parameters.
                </p>
                <div className="text-[11px] text-slate-700 space-y-2 font-bold font-mono">
                  <p>• Amount Match: <span className="text-emerald-700 font-black">40 points</span></p>
                  <p>• Account Number Match: <span className="text-emerald-700 font-black">25 points</span></p>
                  <p>• Account Name Match: <span className="text-emerald-700 font-black">15 points</span></p>
                  <p>• Date & Reference Matches: <span className="text-emerald-700 font-black">20 points</span></p>
                </div>
              </div>

              {/* Try Engine Live Mock */}
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-xs space-y-4">
                <span className="font-black text-slate-500 uppercase tracking-wider block font-mono text-[10px]">Verify Receipt Demo</span>
                
                {mockVerificationState === "idle" && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-550 mx-auto shadow-sm">
                      <FileText className="w-6 h-6 text-slate-600" />
                    </div>
                    <p className="text-slate-700 font-bold text-[11px]">Upload simulated transfer receipt</p>
                    <button
                      onClick={startMockScan}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer border-none"
                    >
                      Trigger Mock OCR Scans
                    </button>
                  </div>
                )}

                {mockVerificationState === "scanning" && (
                  <div className="space-y-4 py-4 text-center">
                    <div className="font-black text-slate-800 animate-pulse">Gemini Scanning...</div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-300/40">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold font-mono">Extracting amount, account, and timestamp metadata</p>
                  </div>
                )}

                {mockVerificationState === "verified" && (
                  <div className="space-y-3.5">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl font-bold flex items-center gap-2">
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <span>Payment Verified Successfully (95/100)</span>
                    </div>
                    <div className="text-[11px] text-slate-700 space-y-1.5 font-mono bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                      <p>Amount: ₦150,000 (Matched)</p>
                      <p>Bank: OPay (Matched)</p>
                      <p>Account Name: Chidi Services (Matched)</p>
                    </div>
                    <button
                      onClick={() => setMockVerificationState("idle")}
                      className="text-slate-550 hover:text-slate-800 font-bold underline transition-colors cursor-pointer border-none bg-transparent"
                    >
                      Reset Scanner
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HOW IT WORKS TAB */}
          {activeSlide === "how" && (
            <div className="w-full space-y-6">
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block font-mono">The Workflow</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">How it Works</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                
                <div className="bg-slate-50 border border-slate-250 p-5 rounded-2xl space-y-3 shadow-sm hover:border-slate-300 transition-all">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black">1</div>
                  <h4 className="font-extrabold text-slate-900 text-[13px]">Create Invoice</h4>
                  <p className="text-[10.5px] text-slate-600 font-bold leading-normal">Freelancer creates invoice with custom bank details.</p>
                </div>

                <div className="bg-slate-50 border border-slate-250 p-5 rounded-2xl space-y-3 shadow-sm hover:border-slate-300 transition-all">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black">2</div>
                  <h4 className="font-extrabold text-slate-900 text-[13px]">Send Payment Details</h4>
                  <p className="text-[10.5px] text-slate-600 font-bold leading-normal">Automatic multi-channel invoice links are shared with clients.</p>
                </div>

                <div className="bg-slate-50 border border-slate-250 p-5 rounded-2xl space-y-3 shadow-sm hover:border-slate-300 transition-all">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black">3</div>
                  <h4 className="font-extrabold text-slate-900 text-[13px]">Bank Transfer Payment</h4>
                  <p className="text-[10.5px] text-slate-600 font-bold leading-normal">Client transfers payment directly to designated banking portal.</p>
                </div>

                <div className="bg-slate-50 border border-slate-250 p-5 rounded-2xl space-y-3 shadow-sm hover:border-slate-300 transition-all">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black">4</div>
                  <h4 className="font-extrabold text-slate-900 text-[13px]">Upload Receipt</h4>
                  <p className="text-[10.5px] text-slate-600 font-bold leading-normal">Client uploads bank transfer receipt screenshot directly on check-out.</p>
                </div>

                <div className="bg-slate-50 border border-slate-250 p-5 rounded-2xl space-y-3 shadow-sm hover:border-slate-300 transition-all">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black">5</div>
                  <h4 className="font-extrabold text-slate-900 text-[13px]">Gemini Verifies Payment</h4>
                  <p className="text-[10.5px] text-slate-600 font-bold leading-normal">Gemini Vision extracts details and runs comparative checks.</p>
                </div>

                <div className="bg-slate-50 border border-slate-250 p-5 rounded-2xl space-y-3 shadow-sm hover:border-slate-300 transition-all">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black">6</div>
                  <h4 className="font-extrabold text-slate-900 text-[13px]">Reminders Stop</h4>
                  <p className="text-[10.5px] text-slate-600 font-bold leading-normal">System automatically halts all active WhatsApp & Email nudge loops.</p>
                </div>

              </div>
            </div>
          )}

          {/* MARKET TAB */}
          {activeSlide === "market" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="space-y-5">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block font-mono">Market Potential</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sizing the Opportunity</h2>
                <p className="text-xs sm:text-sm text-slate-655 leading-relaxed font-bold">
                  African gig economy is expanding rapidly, with over <strong>50 million</strong> freelancers, designers, developers, and creators.
                </p>
                <p className="text-xs sm:text-sm text-slate-655 leading-relaxed font-bold">
                  We capture value by taking a tiny <strong>1% fee</strong> on settled payments, securing transaction velocity.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <div className="bg-indigo-50 border border-indigo-150 p-5 rounded-xl text-center space-y-2 shadow-sm">
                  <Globe className="w-5 h-5 text-indigo-600 mx-auto" />
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block font-mono">TAM</span>
                  <div className="text-lg font-black text-indigo-900 font-mono">$15 Billion+</div>
                  <span className="text-[9px] text-slate-500 font-bold block leading-normal">African gig billings</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-150 p-5 rounded-xl text-center space-y-2 shadow-sm">
                  <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block font-mono">SOM</span>
                  <div className="text-lg font-black text-emerald-800 font-mono">$150 Million</div>
                  <span className="text-[9px] text-slate-550 font-bold block leading-normal">Kavio service fee volume</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Call to Actions Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200 pt-6 font-bold">
          <span>🛡️ Developed with strict verification checkpoints</span>
          <span className="uppercase tracking-widest font-mono">Kavio Pitch Deck 2026</span>
        </div>

      </div>
    </div>
  );
}
