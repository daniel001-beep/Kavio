'use client';

import { SignIn } from '@clerk/nextjs';
import { Zap } from 'lucide-react';

// Force dynamic rendering — Clerk components cannot be statically prerendered
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <div data-page="auth" className="min-h-screen bg-[#fafbfe] relative overflow-hidden flex items-center justify-center p-4 font-sans">
      {/* Background glows */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-200/20 to-teal-200/20 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-100/20 to-blue-200/20 blur-[110px] pointer-events-none" />

      <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight" style={{ color: '#0f172a' }}>
            Kavio <span style={{ color: '#94a3b8', fontWeight: 600 }}>Finance</span>
          </span>
        </div>

        <SignIn
          routing="hash"
          signUpUrl="/auth/signup"
          forceRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#10b981',
            },
            elements: {
              card: 'border border-slate-100/50 shadow-xl rounded-t-3xl rounded-b-none bg-white/95 backdrop-blur-md w-full',
              headerTitle: 'text-slate-900 font-extrabold tracking-tight',
              headerSubtitle: 'text-slate-500 text-xs font-medium',
              socialButtonsBlockButton: 'border border-slate-200 hover:bg-slate-50/50 transition-all rounded-xl',
              formFieldLabel: 'text-slate-500 text-[10px] font-bold uppercase tracking-wider',
              formFieldInput: 'bg-slate-50 border border-slate-250/50 text-slate-900 text-xs rounded-xl focus:border-emerald-500 focus:bg-white transition-all',
              formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl py-3 border-none shadow-md shadow-emerald-500/10 transition-all active:scale-[0.99]',
              footerActionLink: 'text-emerald-500 hover:text-emerald-600 font-bold',
              developmentModeBadge: 'hidden',
            }
          }}
        />

        {/* Demo buttons — attached flush to the bottom of the Clerk card */}
        <div className="w-full bg-white/95 backdrop-blur-md border border-slate-100/50 border-t border-slate-100 shadow-xl rounded-b-3xl px-6 pb-5 pt-3.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
            Or explore without an account
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = "/founder-demo"}
              className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-semibold text-[10px] py-2 px-3 rounded-lg transition-all active:scale-[0.98] cursor-pointer text-center bg-white"
            >
              Founder Demo
            </button>
            <button
              onClick={() => window.location.href = "/demo"}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[10px] py-2 px-3 rounded-lg transition-all active:scale-[0.98] cursor-pointer text-center border-none"
            >
              Demo Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
