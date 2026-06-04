'use client';

import { signUpAction } from '@/app/actions/auth';
import Link from 'next/link';
import { useState } from 'react';
import { Zap, Sparkles } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleCredentialsSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!agreed) {
      setError('You must agree to our Terms & Conditions and Privacy Policy to continue.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      const res = await signUpAction(formData);
      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
      } else if (res?.success) {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      setIsLoading(false);
    }
  };

  const canSubmit = email && password && agreed && !isLoading;

  return (
    <div className="min-h-screen bg-[#fafbfe] relative overflow-hidden flex items-center justify-center p-4 font-sans">

      {/* Background glows */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-200/20 to-teal-200/20 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-100/20 to-blue-200/20 blur-[110px] pointer-events-none" />

      <div className="w-full max-w-[400px] relative z-10">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight" style={{ color: '#0f172a' }}>
            Kavio <span style={{ color: '#94a3b8', fontWeight: 600 }}>Finance</span>
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.8) inset',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
          }}
          className="rounded-3xl p-7 space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0f172a' }}>
              Create your account
            </h1>
            <p className="text-xs leading-relaxed font-medium" style={{ color: '#64748b' }}>
              Get started in seconds and take control of your business finances.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{ border: '1px solid rgba(239,68,68,0.12)', background: '#fef2f2' }}
              className="p-3 rounded-xl text-[11px] font-semibold text-rose-600 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              {error}
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div
              style={{ border: '1px solid rgba(16,185,129,0.12)', background: '#ecfdf5' }}
              className="p-3 rounded-xl text-[11px] font-semibold text-emerald-600 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCredentialsSignUp} className="space-y-4">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: '#64748b' }}>
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@kavio.com"
                required
                style={{ color: '#0f172a', backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                className="block w-full px-4 py-3 rounded-xl placeholder-slate-400 text-xs focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: '#64748b' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                style={{ color: '#0f172a', backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                className="block w-full px-4 py-3 rounded-xl placeholder-slate-400 text-xs focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
              />
            </div>

            {/* ── Terms & Privacy Checkbox ── */}
            <label
              htmlFor="agree-terms"
              className="flex items-start gap-3 cursor-pointer group select-none"
            >
              {/* Custom checkbox */}
              <div className="relative mt-0.5 shrink-0">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (error && e.target.checked) setError('');
                  }}
                  className="sr-only"
                />
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '5px',
                    border: agreed ? '2px solid #10b981' : '2px solid #cbd5e1',
                    background: agreed ? '#10b981' : '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: agreed ? '0 0 0 3px rgba(16,185,129,0.12)' : 'none',
                  }}
                >
                  {agreed && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-[11px] leading-relaxed font-medium" style={{ color: '#64748b' }}>
                I agree to Kavio&apos;s{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-bold underline underline-offset-2 transition-colors"
                  style={{ color: '#10b981' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </Link>
                {' '}and{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-bold underline underline-offset-2 transition-colors"
                  style={{ color: '#10b981' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms &amp; Conditions
                </Link>
                . I confirm I am 16 years or older.
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                height: '46px',
                width: '100%',
                borderRadius: '12px',
                backgroundColor: canSubmit ? '#0f172a' : '#94a3b8',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                border: 'none',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: canSubmit ? '0 4px 14px rgba(15,23,42,0.18)' : 'none',
                transition: 'all 0.15s ease-in-out',
              }}
              className="hover:opacity-90 active:scale-[0.99]"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Create Kavio Account'
              )}
            </button>

          </form>

          {/* Sign in link */}
          <div className="text-center pt-1 border-t border-slate-100">
            <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>Already have an account?{' '}</span>
            <Link
              href="/auth/signin"
              className="text-[11px] font-bold transition-colors"
              style={{ color: '#10b981' }}
            >
              Sign In
            </Link>
          </div>

        </div>

        {/* Bottom note */}
        <p className="text-center text-[10px] font-medium mt-4" style={{ color: '#cbd5e1' }}>
          🔒 Your data is encrypted and never shared.
        </p>

      </div>
    </div>
  );
}
