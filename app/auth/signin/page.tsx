'use client';

import { useState, useTransition } from 'react';
import { Zap, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { signInAction } from '@/app/actions/auth';

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signInAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        window.location.href = '/dashboard';
      }
    });
  };

  return (
    <div
      data-page="auth"
      style={{ minHeight: '100vh', background: '#fafbfe', fontFamily: 'inherit' }}
      className="relative overflow-hidden flex items-center justify-center p-4"
    >
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

        {/* Sign In Card */}
        <div className="w-full bg-white border border-slate-100 shadow-2xl shadow-slate-200/60 rounded-3xl p-8 space-y-6">

          <div className="space-y-1">
            <h1 style={{ color: '#0f172a', fontSize: '20px', fontWeight: 900, letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>
              Sign in to your Kavio account
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p style={{ color: '#be123c', fontSize: '12px', fontWeight: 600, lineHeight: '1.5' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                style={{ color: '#475569', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.background = '#fff'; }}
                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
              />
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                style={{ color: '#475569', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 44px 12px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.background = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" style={{ color: '#94a3b8' }} />
                    : <Eye className="w-4 h-4" style={{ color: '#94a3b8' }} />
                  }
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isPending}
              style={{
                width: '100%',
                background: isPending ? '#6ee7b7' : '#10b981',
                color: '#ffffff',
                WebkitTextFillColor: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: isPending ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
              }}
            >
              {isPending ? 'Signing in...' : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

          </form>

          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: 500 }}>
            Don&apos;t have an account?{' '}
            <a href="/auth/signup" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>
              Create one
            </a>
          </p>

        </div>

        {/* Demo navigation buttons */}
        <div className="mt-5 flex flex-col gap-2.5 w-full">
          <button
            onClick={() => window.location.href = '/founder-demo'}
            style={{
              width: '100%',
              border: '1.5px solid #e2e8f0',
              background: '#ffffff',
              color: '#1e293b',
              WebkitTextFillColor: '#1e293b',
              fontWeight: 700,
              fontSize: '12px',
              padding: '13px',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.15s',
            }}
          >
            📊 Explore Founder Dashboard (No Login)
          </button>
          <button
            onClick={() => window.location.href = '/demo'}
            style={{
              width: '100%',
              background: '#0f172a',
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              fontWeight: 700,
              fontSize: '12px',
              padding: '13px',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 'none',
              transition: 'background 0.15s',
            }}
          >
            🚀 Launch Kavio Demo Console
          </button>
          <a
            href="/pitch"
            style={{
              width: '100%',
              color: '#64748b',
              fontWeight: 600,
              fontSize: '11px',
              textAlign: 'center',
              textDecoration: 'none',
              paddingTop: '4px',
              display: 'block',
            }}
          >
            View Pitch Deck →
          </a>
        </div>

      </div>
    </div>
  );
}
