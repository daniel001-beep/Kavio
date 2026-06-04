'use client';

import { signInAction } from '@/app/actions/auth';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Zap, Sparkles } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'registration_disabled') {
      setError('Public registration is disabled. Access is limited to authorized users.');
    } else if (err === 'unauthorized_admin') {
      setError('Unauthorized access. Administrative privileges required.');
    }
  }, []);

  const handleDemoSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    setEmail('demo@velox.com');
    setPassword('demo1234');
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      const res = await signInAction(formData);
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
              Welcome back
            </h1>
            <p className="text-xs leading-relaxed font-medium" style={{ color: '#64748b' }}>
              Sign in to manage your invoices, clients, and collections.
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

          {/* Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">

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
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Password
                </label>
                {/* Placeholder for future forgot password */}
                <span className="text-[10px] font-semibold" style={{ color: '#cbd5e1' }}>
                  Forgot password?
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ color: '#0f172a', backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0' }}
                className="block w-full px-4 py-3 rounded-xl placeholder-slate-400 text-xs focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all"
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                height: '46px',
                width: '100%',
                borderRadius: '12px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(15,23,42,0.18)',
                transition: 'all 0.15s ease-in-out',
              }}
              className="hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Launch Kavio Dashboard'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#cbd5e1' }}>or</span>
              <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
            </div>

            {/* Demo Button */}
            <button
              type="button"
              onClick={handleDemoSignIn}
              style={{
                height: '44px',
                width: '100%',
                borderRadius: '12px',
                backgroundColor: 'transparent',
                color: '#64748b',
                fontWeight: '700',
                fontSize: '12px',
                border: '1.5px dashed #cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease-in-out',
              }}
              className="hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700 active:scale-[0.99]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Try the Live Demo
            </button>

          </form>

          {/* Sign up link */}
          <div className="text-center pt-1 border-t border-slate-100">
            <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>Don&apos;t have an account?{' '}</span>
            <Link
              href="/auth/signup"
              className="text-[11px] font-bold transition-colors"
              style={{ color: '#10b981' }}
            >
              Create account
            </Link>
          </div>

        </div>

        {/* Bottom note */}
        <p className="text-center text-[10px] font-medium mt-4" style={{ color: '#cbd5e1' }}>
          🔒 256-bit encrypted. Your data stays private.
        </p>

      </div>
    </div>
  );
}
