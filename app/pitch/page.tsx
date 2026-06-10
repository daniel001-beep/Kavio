"use client";

import React, { useState, useEffect } from "react";
import { 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  MessageSquare, 
  Search, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Layers, 
  PieChart, 
  Globe, 
  AlertTriangle,
  PlayCircle
} from "lucide-react";

export default function PitchPage() {
  const [activeSlide, setActiveSlide] = useState<"problem" | "solution" | "engine" | "market" | "how">("problem");
  const [mockVerificationState, setMockVerificationState] = useState<"idle" | "scanning" | "verified">("idle");
  const [progress, setProgress] = useState(0);

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
    <div className="min-h-screen bg-[#070b13] text-slate-200 font-sans flex flex-col py-16 px-4 relative overflow-hidden">
      
      {/* Background decoration elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[550px] h-[550px] rounded-full bg-emerald-950/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-15%] w-[550px] h-[550px] rounded-full bg-indigo-950/20 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Brand/Hero section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-bold text-emerald-400">
            <Zap className="w-3.5 h-3.5" /> Presenting Kavio
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-2xl mx-auto font-sans">
            Freelancers stop chasing clients. <span className="text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 to-teal-300">Get paid faster.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
            An AI-powered payment collection platform helping freelancers and small businesses get paid faster through automated reminders and intelligent transfer verification.
          </p>

          <div className="flex justify-center gap-3 pt-3">
            <button
              onClick={() => window.location.href = "/founder"}
              className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
            >
              Enter Founder Sandbox <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.href = "/pay/demo-id"}
              className="border border-slate-800 bg-slate-950/50 hover:bg-slate-900 text-slate-300 text-xs font-bold px-5 py-3 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              View secure Client Checkout
            </button>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="grid grid-cols-5 bg-slate-950/60 border border-slate-800/80 p-1 rounded-2xl text-center text-[10px] sm:text-xs font-bold font-mono">
          {(["problem", "solution", "engine", "how", "market"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSlide(tab)}
              className={`py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer ${
                activeSlide === tab
                  ? "bg-slate-900 text-white shadow-md border border-slate-800/80"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Active Tab Viewport */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl min-h-[380px] flex items-center">
          
          {/* PROBLEM TAB */}
          {activeSlide === "problem" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">The Friction</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">The Chasing Loop</h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  Freelancers lose up to <strong>20 hours a month</strong> manually emailing and texting clients for outstanding invoices.
                </p>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  When payments are finally made via bank transfer, freelancers are vulnerable to <strong>forged transfer receipts</strong> and delayed ledger clearance.
                </p>
              </div>
              
              <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl space-y-4 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider block">Freelancer Pain Points</span>
                
                <div className="space-y-3 font-semibold">
                  <div className="flex gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
                    <div>
                      <h4 className="font-bold">Awkward Reminder Chats</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Damages relationship asking clients for cash over and over.</p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
                    <div>
                      <h4 className="font-bold">Screenshot Tampering</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Fake mobile app success receipts created via photoshop generators.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SOLUTION TAB */}
          {activeSlide === "solution" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">The Breakthrough</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Automated Verification</h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  Kavio offloads the awkwardness. Our scheduling node automatically contacts clients via WhatsApp & Email reminders.
                </p>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  Clients upload transfers directly to the secure checkout. Gemini Vision instantly inspects and scores the payment proof, pausing reminders immediately.
                </p>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-2xl space-y-3 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider block">Product Benefits</span>
                
                <div className="space-y-2.5 font-semibold">
                  <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl text-emerald-400">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Multi-channel follow-ups (WhatsApp + Email)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl text-emerald-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Gemini-powered transaction verification</span>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl text-emerald-400">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Automatic reminder suspension on verify</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENGINE DEMO TAB */}
          {activeSlide === "engine" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">AI-Powered Scorer</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Gemini Vision Auditing</h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  We use Gemini Vision to parse uploaded receipts. The verification engine assigns trust weights to different parameters.
                </p>
                <div className="text-[11px] text-slate-500 space-y-1 font-semibold">
                  <p>• Amount Match: <span className="text-emerald-400">40 points</span></p>
                  <p>• Account Number Match: <span className="text-emerald-400">25 points</span></p>
                  <p>• Account Name Match: <span className="text-emerald-400">15 points</span></p>
                  <p>• Date & Reference Matches: <span className="text-emerald-400">20 points</span></p>
                </div>
              </div>

              {/* Try Engine Live Mock */}
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl text-xs space-y-4">
                <span className="font-bold text-slate-400 uppercase tracking-wider block font-mono text-[10px]">Verify Receipt Demo</span>
                
                {mockVerificationState === "idle" && (
                  <div className="text-center py-6 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                      <FileText className="w-5 h-5" />
                    </div>
                    <p className="text-slate-400 font-semibold text-[11px]">Upload simulated transfer receipt</p>
                    <button
                      onClick={startMockScan}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Trigger Mock OCR Scans
                    </button>
                  </div>
                )}

                {mockVerificationState === "scanning" && (
                  <div className="space-y-3 py-4 text-center">
                    <div className="font-bold text-white animate-pulse">Gemini Scanning...</div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500">Extracting amount, account number, and signatures</p>
                  </div>
                )}

                {mockVerificationState === "verified" && (
                  <div className="space-y-3">
                    <div className="bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 p-3 rounded-xl font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" /> Payment verified Successfully (95/100)
                    </div>
                    <div className="text-[10px] text-slate-400 space-y-1 font-mono">
                      <p>Amount: ₦150,000 (Matched)</p>
                      <p>Bank: OPay (Matched)</p>
                      <p>Account Name: Chidi Services (Matched)</p>
                    </div>
                    <button
                      onClick={() => setMockVerificationState("idle")}
                      className="text-slate-400 hover:text-white font-bold"
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
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">The Workflow</span>
                <h2 className="text-xl font-bold text-white tracking-tight">How it Works</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold">
                
                <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-xl space-y-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold">1</div>
                  <h4 className="font-bold text-slate-200">Invoice Created</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Freelancer creates invoice with bank info.</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-xl space-y-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold">2</div>
                  <h4 className="font-bold text-slate-200">Auto Reminders</h4>
                  <p className="text-[10px] text-slate-500 font-medium">WhatsApp follow-ups sent on schedule Day 0, 2, 5, 7.</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-xl space-y-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold">3</div>
                  <h4 className="font-bold text-slate-200">AI Verification</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Client uploads receipt, scanned by Gemini Vision.</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-xl space-y-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold">4</div>
                  <h4 className="font-bold text-slate-200">Ledger Settled</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Reminders halt, freelancer gets notified to confirm.</p>
                </div>

              </div>
            </div>
          )}

          {/* MARKET TAB */}
          {activeSlide === "market" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Market Potential</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">Sizing the Opportunity</h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  African gig economy is expanding rapidly, with over <strong>50 million</strong> freelancers, designers, developers, and creators.
                </p>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                  We capture value by taking a tiny <strong>1% fee</strong> on settled payments, securing transaction velocity.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-center space-y-1">
                  <Globe className="w-4 h-4 text-indigo-400 mx-auto" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">TAM</span>
                  <div className="text-sm font-bold text-white font-mono">$15 Billion+</div>
                  <span className="text-[8px] text-slate-600 font-semibold block">African gig billings</span>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-center space-y-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase block">SOM</span>
                  <div className="text-sm font-bold text-emerald-400 font-mono">$150 Million</div>
                  <span className="text-[8px] text-slate-600 font-semibold block">Kavio addressable fee volume</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Call to Actions Footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900 pt-6">
          <span>🛡️ Developed with strict verification checkpoints</span>
          <span className="font-bold uppercase tracking-widest">Kavio pitch Deck 2026</span>
        </div>

      </div>
    </div>
  );
}
