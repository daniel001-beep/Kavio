'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl: '/fintech/dashboard' });
    } catch (err) {
      setError('Failed to sign up. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-100 mb-2">Velox</h1>
          <p className="text-slate-400">Enterprise Financial Platform</p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-slate-900 border border-slate-700 rounded-sm p-8 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Create Account</h2>
            <p className="text-slate-400 text-sm">Join Velox Fintech and start managing your portfolio</p>
          </div>

          {/* Benefits List */}
          <div className="mb-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-sm bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <span className="text-emerald-500 text-xs font-bold">✓</span>
              </div>
              <div>
                <p className="text-slate-100 font-bold text-sm leading-tight">Real-time Portfolio Analytics</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mt-1">Live Market Data</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-sm bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <span className="text-emerald-500 text-xs font-bold">✓</span>
              </div>
              <div>
                <p className="text-slate-100 font-bold text-sm leading-tight">Enterprise-Grade Security</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mt-1">RLS Protected</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-sm bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <span className="text-emerald-500 text-xs font-bold">✓</span>
              </div>
              <div>
                <p className="text-slate-100 font-bold text-sm leading-tight">Secure Transactions</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mt-1">SOC 2 Type II</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-sm text-sm font-medium">
              {error}
            </div>
          )}

          {/* Google Sign Up Button */}
          <button
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="w-full mb-8 flex items-center justify-center gap-3 px-4 py-3 bg-white text-slate-950 font-bold rounded-sm hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          {/* Sign In Link */}
          <p className="text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer Info */}
        <div className="mt-8 space-y-2 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          <p>By signing up, you agree to our Terms of Service</p>
          <p>End-to-End Encryption Enabled</p>
        </div>
      </div>
    </div>
  );
}
