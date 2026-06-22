import React from "react";
import Link from "next/link";
import ScrollReveal3D from "./ScrollReveal3D";

export default function PricingCTASection() {
  return (
    <section className="py-24 px-6 max-w-5xl mx-auto w-full border-t border-slate-100">
      <ScrollReveal3D duration={0.8} direction="tilt-up">
        <div className="text-center mb-16">
          <h2 
            className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
            style={{ color: "#090d16" }}
          >
            Ready to Streamline Your Payments?
          </h2>
        </div>
      </ScrollReveal3D>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Freelancer CTA */}
        <ScrollReveal3D delay={100} duration={0.8} direction="tilt-up">
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 h-full flex flex-col items-center text-center">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">I'm a Freelancer</h3>
            <p className="text-slate-600 mb-8 font-medium leading-relaxed flex-grow">
              Get paid faster with automated reminders and AI receipt verification
            </p>
            <Link 
              href="/auth/signin?type=freelancer" 
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-[#00B140] text-white hover:opacity-90 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] no-underline"
            >
              Start Free as Freelancer
            </Link>
          </div>
        </ScrollReveal3D>

        {/* Employer CTA */}
        <ScrollReveal3D delay={200} duration={0.8} direction="tilt-up">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 h-full flex flex-col items-center text-center shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">I'm an Employer</h3>
            <p className="text-slate-600 mb-8 font-medium leading-relaxed flex-grow">
              Never miss a contractor payment with automated reminders and a full payment dashboard
            </p>
            <Link 
              href="/auth/signin?type=employer" 
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-white text-slate-900 border-2 border-[#00B140] hover:bg-emerald-50 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98] no-underline"
            >
              Start Free as Employer
            </Link>
          </div>
        </ScrollReveal3D>
      </div>

      <ScrollReveal3D delay={300} duration={0.8} direction="tilt-up">
        <p className="text-center mt-8 text-sm text-slate-500 font-semibold">
          Free to start. No CAC or bank integration required.
        </p>
      </ScrollReveal3D>
    </section>
  );
}
