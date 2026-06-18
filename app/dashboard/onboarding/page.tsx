"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Briefcase, 
  Users, 
  FileText, 
  AlertTriangle,
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/app/context/AuthContext";
import { useNotifications } from "@/app/context/NotificationContext";

export default function OnboardingPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  const router = useRouter();
  const { addNotification } = useNotifications();

  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState("");
  const [clientCount, setClientCount] = useState("");
  const [invoiceCount, setInvoiceCount] = useState("");
  const [challenge, setChallenge] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already onboarded, redirect to dashboard
  useEffect(() => {
    if (userEmail) {
      const onboarded = localStorage.getItem(`kavio_onboarded_${userEmail}`);
      if (onboarded === "true") {
        router.push("/dashboard");
      }
    }
  }, [userEmail, router]);

  const handleNextStep = () => {
    if (step === 2 && !businessType) return;
    if (step === 3 && !clientCount) return;
    if (step === 4 && !invoiceCount) return;
    if (step === 5 && !challenge) return;
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleFinish = async () => {
    if (!challenge) return;
    setIsSubmitting(true);

    try {
      if (userEmail) {
        const responses = {
          businessType,
          clientCount,
          invoiceCount,
          challenge,
          completedAt: new Date().toISOString()
        };
        localStorage.setItem(`kavio_onboarded_responses_${userEmail}`, JSON.stringify(responses));
        localStorage.setItem(`kavio_onboarded_${userEmail}`, "true");

        addNotification({
          type: "SUCCESS",
          title: "Setup Completed",
          message: "Welcome to Kavio! Your collections dashboard is ready."
        });

        // Small delay for micro-animations
        setTimeout(() => {
          router.push("/dashboard");
        }, 800);
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-900/5 p-8 md:p-12 relative overflow-hidden transition-all duration-500">
        
        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div 
              key={s} 
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? "bg-emerald-500" : "bg-slate-100"
              }`}
            />
          ))}
        </div>

        {/* STEP 1: Welcome */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Welcome to Kavio!
              </h1>
              <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                Kavio helps freelancers get paid faster and know exactly who owes them money. Let's customize your dashboard in 4 simple steps.
              </p>
            </div>
            <Button 
              onClick={handleNextStep}
              className="w-full py-6 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 text-sm flex items-center justify-center gap-2 mt-4"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: Business Type */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                What type of business do you run?
              </h2>
              <p className="text-slate-400 text-xs font-semibold">Select the option that matches best.</p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-2">
              {[
                { id: "freelancer", title: "Independent Freelancer", desc: "Software engineering, writing, creative design, etc." },
                { id: "consultant", title: "Solo Consultant", desc: "Providing expert advisory, legal, or strategy services." },
                { id: "agency", title: "Boutique Agency", desc: "Running a small team serving multiple corporate clients." }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setBusinessType(opt.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${
                    businessType === opt.id 
                      ? "border-emerald-500 bg-emerald-500/5 shadow-sm shadow-emerald-500/10" 
                      : "border-slate-150 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">{opt.title}</p>
                  <p className="text-[11px] text-slate-450 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={handlePrevStep} className="flex-1 py-5 rounded-xl text-xs font-bold border-slate-200">
                Back
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={!businessType}
                className="flex-1 py-5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 text-xs flex items-center justify-center gap-1.5"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Client Count */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                How many active clients do you manage?
              </h2>
              <p className="text-slate-400 text-xs font-semibold">This helps us scale your recovery lists.</p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-2">
              {[
                { id: "1-3", title: "1 to 3 clients", desc: "Highly focused retainer or project scopes." },
                { id: "4-10", title: "4 to 10 clients", desc: "A robust volume of contract cycles." },
                { id: "10+", title: "More than 10 clients", desc: "Enterprise scale and multiple client stakeholders." }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setClientCount(opt.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${
                    clientCount === opt.id 
                      ? "border-emerald-500 bg-emerald-500/5 shadow-sm shadow-emerald-500/10" 
                      : "border-slate-150 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">{opt.title}</p>
                  <p className="text-[11px] text-slate-450 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={handlePrevStep} className="flex-1 py-5 rounded-xl text-xs font-bold border-slate-200">
                Back
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={!clientCount}
                className="flex-1 py-5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 text-xs flex items-center justify-center gap-1.5"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Invoice Count */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                How many invoices do you issue per month?
              </h2>
              <p className="text-slate-400 text-xs font-semibold">This helps calculate your average payment rate.</p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-2">
              {[
                { id: "1-5", title: "1 to 5 invoices / month", desc: "Fewer client cycles with larger invoice sizes." },
                { id: "5+", title: "More than 5 invoices / month", desc: "High volume of items, milestones, and retainers." }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setInvoiceCount(opt.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${
                    invoiceCount === opt.id 
                      ? "border-emerald-500 bg-emerald-500/5 shadow-sm shadow-emerald-500/10" 
                      : "border-slate-150 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">{opt.title}</p>
                  <p className="text-[11px] text-slate-450 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={handlePrevStep} className="flex-1 py-5 rounded-xl text-xs font-bold border-slate-200">
                Back
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={!invoiceCount}
                className="flex-1 py-5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 text-xs flex items-center justify-center gap-1.5"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Challenge */}
        {step === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                What is your biggest billing challenge?
              </h2>
              <p className="text-slate-400 text-xs font-semibold">We will prioritize this on your recovery dashboard.</p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 pt-2">
              {[
                { id: "late_payments", title: "Getting paid late by clients", desc: "Chasing outstanding payments manually." },
                { id: "tracking", title: "Tracking who owes me money", desc: "No central ledger to view pending balances." },
                { id: "awkward_reminders", title: "Drafting awkward reminders", desc: "Awkward silences during follow-up messages." }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setChallenge(opt.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${
                    challenge === opt.id 
                      ? "border-emerald-500 bg-emerald-500/5 shadow-sm shadow-emerald-500/10" 
                      : "border-slate-150 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">{opt.title}</p>
                  <p className="text-[11px] text-slate-450 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-6">
              <Button variant="outline" onClick={handlePrevStep} className="flex-1 py-5 rounded-xl text-xs font-bold border-slate-200">
                Back
              </Button>
              <Button 
                onClick={handleFinish}
                disabled={!challenge || isSubmitting}
                className="flex-1 py-5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 text-xs flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Complete Setup
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
