import React from "react";
import Link from "next/link";
import ScrollReveal3D from "./ScrollReveal3D";

export default function EmployerPainPoints() {
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto w-full">
      <ScrollReveal3D duration={0.8} direction="tilt-up">
        <div className="text-center mb-16">
          <h2 
            className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
            style={{ color: "#090d16" }}
          >
            Stop Letting Payments Slip Through the Cracks
          </h2>
        </div>
      </ScrollReveal3D>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <ScrollReveal3D delay={0} duration={0.8} direction="tilt-up" className="h-full">
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 h-full relative overflow-hidden group hover:shadow-md transition-all duration-200">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400"></div>
            <p className="italic text-slate-500 text-sm leading-relaxed">
              "You hired 8 freelancers last month. Remembered to pay 6 of them on time. The other 2 are now avoiding your next project brief."
            </p>
          </div>
        </ScrollReveal3D>

        <ScrollReveal3D delay={150} duration={0.8} direction="tilt-up" className="h-full">
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 h-full relative overflow-hidden group hover:shadow-md transition-all duration-200">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
            <p className="italic text-slate-500 text-sm leading-relaxed">
              "Your contractor sent their invoice 3 weeks ago. You meant to pay it. You forgot. Now it's awkward."
            </p>
          </div>
        </ScrollReveal3D>

        <ScrollReveal3D delay={300} duration={0.8} direction="tilt-up" className="h-full">
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 h-full relative overflow-hidden group hover:shadow-md transition-all duration-200">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400"></div>
            <p className="italic text-slate-500 text-sm leading-relaxed">
              "You're running 4 projects simultaneously. Tracking who's owed what in a WhatsApp group and a spreadsheet. One of those numbers is wrong."
            </p>
          </div>
        </ScrollReveal3D>
      </div>

      <ScrollReveal3D delay={400} duration={0.8} direction="tilt-up">
        <div className="text-center">
          <p className="text-slate-600 font-medium mb-8">
            Kavio fixes this — before the awkwardness happens.
          </p>
          <Link 
            href="/auth/signin?type=employer" 
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-[#00B140] text-white hover:opacity-90 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] no-underline"
          >
            Set Up Employer Account →
          </Link>
        </div>
      </ScrollReveal3D>
    </section>
  );
}
