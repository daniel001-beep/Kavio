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
  Globe, 
  AlertTriangle,
} from "lucide-react";

export default function PitchPage() {
  const [activeSlide, setActiveSlide] = useState<"problem" | "solution" | "engine" | "how" | "market">("problem");
  const [mockVerificationState, setMockVerificationState] = useState<"idle" | "scanning" | "verified">("idle");
  const [progress, setProgress] = useState(0);

  const tabs = [
    { id: "problem", label: "The Chasing Loop" },
    { id: "solution", label: "Automated Verification" },
    { id: "engine", label: "Gemini Vision Auditing" },
    { id: "how", label: "How it Works" },
    { id: "market", label: "Seizing the Opportunity" },
  ] as const;

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
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "inherit" }} className="flex flex-col py-16 px-4 relative overflow-hidden">
      
      {/* Decorative gradient accents */}
      <div className="absolute top-[-20%] right-[-10%] w-[550px] h-[550px] rounded-full bg-emerald-100/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-15%] w-[550px] h-[550px] rounded-full bg-indigo-100/40 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full shadow-sm">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span style={{ color: "#065f46", fontSize: "11px", fontWeight: 900 }}>Presenting Kavio</span>
          </div>
          
          <h1
            className="text-4xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto"
            style={{ color: "#0f172a", background: "none", WebkitTextFillColor: "#0f172a" }}
          >
            Freelancers stop chasing clients. <br />
            <span style={{ color: "#059669", WebkitTextFillColor: "#059669" }}>
              Get paid faster.
            </span>
          </h1>

          <p style={{ color: "#475569", fontSize: "14px", fontWeight: 600, maxWidth: "600px", margin: "0 auto", lineHeight: "1.7" }}>
            An AI-powered payment collection platform helping freelancers and small businesses get paid faster through automated reminders and intelligent transfer verification.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => window.location.href = "/demo"}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-6 py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer border-none"
              style={{ WebkitTextFillColor: "#ffffff" }}
            >
              Launch Live Demo <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.href = "/founder-demo"}
              className="border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black px-6 py-4 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              style={{ color: "#1e293b", WebkitTextFillColor: "#1e293b" }}
            >
              Explore Founder Dashboard
            </button>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-5 bg-slate-100 border border-slate-200 p-1.5 rounded-2xl text-center shadow-inner gap-1">
          {tabs.map((tab) => {
            const isActive = activeSlide === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSlide(tab.id);
                  setMockVerificationState("idle");
                }}
                className={`py-3 px-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer leading-tight font-black border-none ${
                  isActive
                    ? "bg-white shadow-md border border-slate-200"
                    : "hover:bg-white/50"
                }`}
                style={{
                  color: isActive ? "#0f172a" : "#475569",
                  fontSize: "10.5px",
                  WebkitTextFillColor: isActive ? "#0f172a" : "#475569",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Tab Viewport */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl min-h-[380px] flex items-center">
          
          {/* ── PROBLEM TAB ── */}
          {activeSlide === "problem" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="space-y-5">
                <span style={{ color: "#dc2626", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", display: "block", fontFamily: "monospace" }}>The Friction</span>
                <h2 style={{ color: "#0f172a", fontSize: "26px", fontWeight: 900, letterSpacing: "-0.02em" }}>
                  The Chasing Loop
                </h2>
                <p style={{ color: "#334155", fontSize: "13px", fontWeight: 600, lineHeight: "1.7" }}>
                  Freelancers lose up to <strong style={{ color: "#dc2626" }}>20 hours a month</strong> manually emailing and texting clients for outstanding invoices.
                </p>
                <p style={{ color: "#334155", fontSize: "13px", fontWeight: 600, lineHeight: "1.7" }}>
                  When payments are finally made via bank transfer, freelancers are vulnerable to <strong style={{ color: "#dc2626" }}>forged transfer receipts</strong> and delayed ledger clearance.
                </p>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
                <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", display: "block", fontFamily: "monospace" }}>Freelancer Pain Points</span>
                
                <div className="space-y-3">
                  <div className="flex gap-3 bg-rose-50 border border-rose-200 p-4 rounded-xl">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <h4 style={{ color: "#9f1239", fontSize: "12.5px", fontWeight: 800 }}>Awkward Reminder Chats</h4>
                      <p style={{ color: "#475569", fontSize: "10.5px", fontWeight: 600, lineHeight: "1.5", marginTop: "4px" }}>Damages relationships by repeatedly asking clients for cash manually.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 bg-rose-50 border border-rose-200 p-4 rounded-xl">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <h4 style={{ color: "#9f1239", fontSize: "12.5px", fontWeight: 800 }}>Screenshot Tampering</h4>
                      <p style={{ color: "#475569", fontSize: "10.5px", fontWeight: 600, lineHeight: "1.5", marginTop: "4px" }}>Fake mobile app success receipts generated to trick freelancers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SOLUTION TAB ── */}
          {activeSlide === "solution" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="space-y-5">
                <span style={{ color: "#059669", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", display: "block", fontFamily: "monospace" }}>The Breakthrough</span>
                <h2 style={{ color: "#0f172a", fontSize: "26px", fontWeight: 900, letterSpacing: "-0.02em" }}>
                  Automated Verification
                </h2>
                <p style={{ color: "#334155", fontSize: "13px", fontWeight: 600, lineHeight: "1.7" }}>
                  Kavio offloads the awkwardness. Our scheduling node automatically contacts clients via WhatsApp &amp; Email reminders.
                </p>
                <p style={{ color: "#334155", fontSize: "13px", fontWeight: 600, lineHeight: "1.7" }}>
                  Clients upload transfers directly to the secure checkout. Gemini Vision instantly inspects and scores the payment proof, pausing reminders immediately.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3.5">
                <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", display: "block", fontFamily: "monospace" }}>Product Benefits</span>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span style={{ color: "#065f46", fontSize: "12px", fontWeight: 700 }}>Multi-channel follow-ups (WhatsApp + Email)</span>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span style={{ color: "#065f46", fontSize: "12px", fontWeight: 700 }}>Gemini-powered transaction verification</span>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span style={{ color: "#065f46", fontSize: "12px", fontWeight: 700 }}>Automatic reminder suspension on verify</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ENGINE TAB ── */}
          {activeSlide === "engine" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="space-y-5">
                <span style={{ color: "#059669", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", display: "block", fontFamily: "monospace" }}>AI-Powered Scorer</span>
                <h2 style={{ color: "#0f172a", fontSize: "26px", fontWeight: 900, letterSpacing: "-0.02em" }}>
                  Gemini Vision Auditing
                </h2>
                <p style={{ color: "#334155", fontSize: "13px", fontWeight: 600, lineHeight: "1.7" }}>
                  We use Gemini Vision to parse uploaded receipts. The verification engine assigns trust weights to different parameters.
                </p>
                <div className="space-y-2" style={{ fontFamily: "monospace" }}>
                  <p style={{ color: "#334155", fontSize: "11px", fontWeight: 700 }}>• Amount Match: <span style={{ color: "#059669", fontWeight: 900 }}>40 points</span></p>
                  <p style={{ color: "#334155", fontSize: "11px", fontWeight: 700 }}>• Account Number Match: <span style={{ color: "#059669", fontWeight: 900 }}>25 points</span></p>
                  <p style={{ color: "#334155", fontSize: "11px", fontWeight: 700 }}>• Account Name Match: <span style={{ color: "#059669", fontWeight: 900 }}>15 points</span></p>
                  <p style={{ color: "#334155", fontSize: "11px", fontWeight: 700 }}>• Date &amp; Reference Matches: <span style={{ color: "#059669", fontWeight: 900 }}>20 points</span></p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
                <span style={{ color: "#64748b", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", display: "block", fontFamily: "monospace" }}>Verify Receipt Demo</span>
                
                {mockVerificationState === "idle" && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto shadow-sm">
                      <FileText className="w-6 h-6 text-slate-500" />
                    </div>
                    <p style={{ color: "#475569", fontSize: "11px", fontWeight: 700 }}>Upload simulated transfer receipt</p>
                    <button
                      onClick={startMockScan}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer border-none"
                      style={{ fontSize: "12px", WebkitTextFillColor: "#ffffff" }}
                    >
                      Trigger Mock OCR Scans
                    </button>
                  </div>
                )}

                {mockVerificationState === "scanning" && (
                  <div className="space-y-4 py-4 text-center">
                    <div style={{ color: "#0f172a", fontWeight: 900, fontSize: "13px" }} className="animate-pulse">Gemini Scanning...</div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-300">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p style={{ color: "#64748b", fontSize: "10px", fontWeight: 600, fontFamily: "monospace" }}>Extracting amount, account, and timestamp metadata</p>
                  </div>
                )}

                {mockVerificationState === "verified" && (
                  <div className="space-y-3.5">
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span style={{ color: "#065f46", fontSize: "12px", fontWeight: 700 }}>Payment Verified Successfully (95/100)</span>
                    </div>
                    <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm space-y-1.5" style={{ fontFamily: "monospace" }}>
                      <p style={{ color: "#334155", fontSize: "11px", fontWeight: 600 }}>Amount: ₦150,000 (Matched)</p>
                      <p style={{ color: "#334155", fontSize: "11px", fontWeight: 600 }}>Bank: OPay (Matched)</p>
                      <p style={{ color: "#334155", fontSize: "11px", fontWeight: 600 }}>Account Name: Chidi Services (Matched)</p>
                    </div>
                    <button
                      onClick={() => setMockVerificationState("idle")}
                      className="hover:text-slate-800 font-bold underline transition-colors cursor-pointer border-none bg-transparent"
                      style={{ color: "#64748b", fontSize: "11px" }}
                    >
                      Reset Scanner
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── HOW IT WORKS TAB ── */}
          {activeSlide === "how" && (
            <div className="w-full space-y-6">
              <div>
                <span style={{ color: "#059669", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", display: "block", fontFamily: "monospace" }}>The Workflow</span>
                <h2 style={{ color: "#0f172a", fontSize: "26px", fontWeight: 900, letterSpacing: "-0.02em" }}>
                  How it Works
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { num: 1, title: "Create Invoice", desc: "Freelancer creates invoice with custom bank details." },
                  { num: 2, title: "Send Payment Details", desc: "Automatic multi-channel invoice links are shared with clients." },
                  { num: 3, title: "Bank Transfer Payment", desc: "Client transfers payment directly to designated banking portal." },
                  { num: 4, title: "Upload Receipt", desc: "Client uploads bank transfer receipt screenshot directly on check-out." },
                  { num: 5, title: "Gemini Verifies Payment", desc: "Gemini Vision extracts details and runs comparative checks." },
                  { num: 6, title: "Reminders Stop", desc: "System automatically halts all active WhatsApp & Email nudge loops." },
                ].map(({ num, title, desc }) => (
                  <div key={num} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm hover:border-slate-300 transition-all">
                    <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center" style={{ color: "#4f46e5", fontWeight: 900, fontSize: "12px" }}>{num}</div>
                    <h4 style={{ color: "#0f172a", fontSize: "13px", fontWeight: 800 }}>{title}</h4>
                    <p style={{ color: "#475569", fontSize: "10.5px", fontWeight: 600, lineHeight: "1.6" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MARKET TAB ── */}
          {activeSlide === "market" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="space-y-5">
                <span style={{ color: "#059669", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", display: "block", fontFamily: "monospace" }}>Market Potential</span>
                <h2 style={{ color: "#0f172a", fontSize: "26px", fontWeight: 900, letterSpacing: "-0.02em" }}>
                  Seizing the Opportunity
                </h2>
                <p style={{ color: "#334155", fontSize: "13px", fontWeight: 600, lineHeight: "1.7" }}>
                  African gig economy is expanding rapidly, with over <strong style={{ color: "#0f172a" }}>50 million</strong> freelancers, designers, developers, and creators.
                </p>
                <p style={{ color: "#334155", fontSize: "13px", fontWeight: 600, lineHeight: "1.7" }}>
                  We capture value by taking a tiny <strong style={{ color: "#0f172a" }}>1% fee</strong> on settled payments, securing transaction velocity.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-xl text-center space-y-2 shadow-sm">
                  <Globe className="w-5 h-5 text-indigo-600 mx-auto" />
                  <span style={{ color: "#6366f1", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", display: "block", fontFamily: "monospace" }}>TAM</span>
                  <div style={{ color: "#1e1b4b", fontSize: "20px", fontWeight: 900, fontFamily: "monospace" }}>$15 Billion+</div>
                  <span style={{ color: "#64748b", fontSize: "9px", fontWeight: 700, display: "block", lineHeight: "1.4" }}>African gig billings</span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl text-center space-y-2 shadow-sm">
                  <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto" />
                  <span style={{ color: "#059669", fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", display: "block", fontFamily: "monospace" }}>SOM</span>
                  <div style={{ color: "#064e3b", fontSize: "20px", fontWeight: 900, fontFamily: "monospace" }}>$150 Million</div>
                  <span style={{ color: "#64748b", fontSize: "9px", fontWeight: 700, display: "block", lineHeight: "1.4" }}>Kavio service fee volume</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <span style={{ color: "#64748b", fontSize: "11px", fontWeight: 700 }}>🛡️ Developed with strict verification checkpoints</span>
          <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace" }}>Kavio Pitch Deck 2026</span>
        </div>

      </div>
    </div>
  );
}
