'use client';

import { SignUp, useAuth } from '@clerk/nextjs';
import { Zap, Loader2 } from 'lucide-react';

// Force dynamic rendering — Clerk components cannot be statically prerendered
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard/onboarding');
    }
  }, [isSignedIn, router]);

  if (!isLoaded || isSignedIn) {
    return (
      <div data-page="auth" className="min-h-screen bg-[#fafbfe] relative overflow-hidden flex items-center justify-center p-4 font-sans">
        {/* Background glows */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-200/20 to-teal-200/20 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-100/20 to-blue-200/20 blur-[110px] pointer-events-none" />

        <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Zap className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Redirecting to onboarding...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-page="auth" className="min-h-screen bg-[#fafbfe] relative overflow-hidden flex items-center justify-center p-4 font-sans">
      {/* Background glows */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-200/20 to-teal-200/20 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-100/20 to-blue-200/20 blur-[110px] pointer-events-none" />

      <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight" style={{ color: '#0f172a' }}>
            Kavio <span style={{ color: '#94a3b8', fontWeight: 600 }}>Finance</span>
          </span>
        </div>

        <SignUp
          routing="hash"
          signInUrl="/auth/signin"
          forceRedirectUrl="/dashboard/onboarding"
          appearance={{
            variables: {
              colorPrimary: '#10b981',
            },
            elements: {
              card: 'border border-slate-100/50 shadow-xl rounded-3xl bg-white/95 backdrop-blur-md w-full',
              headerTitle: 'text-slate-900 font-extrabold tracking-tight',
              headerSubtitle: 'text-slate-500 text-xs font-medium',
              socialButtonsBlockButton: 'border border-slate-200 hover:bg-slate-50/50 transition-all rounded-xl',
              formFieldLabel: 'text-slate-500 text-[10px] font-bold uppercase tracking-wider',
              formFieldInput: 'bg-slate-50 border border-slate-250/50 text-slate-900 text-xs rounded-xl focus:border-emerald-500 focus:bg-white transition-all',
              formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl py-3 border-none shadow-md shadow-emerald-500/10 transition-all active:scale-[0.99]',
              footerActionLink: 'text-emerald-500 hover:text-emerald-600 font-bold',
              footer: 'hidden',
              footerPages: 'hidden',
              badge: 'hidden',
              developmentModeBadge: 'hidden',
            }
          }}
        />
      </div>
    </div>
  );
}
