'use client';

import { signInAction } from '@/app/actions/auth';
import { createClient } from '@/src/lib/supabase-client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Shield, Sparkles, CheckCircle2, ChevronRight, Lock } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [systemTime, setSystemTime] = useState('');

  useEffect(() => {
    setSystemTime(new Date().toISOString().slice(11, 19));
    const interval = setInterval(() => {
      setSystemTime(new Date().toISOString().slice(11, 19));
    }, 1000);

    // Parse URL error parameter
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'registration_disabled') {
      setError('Public registration is disabled. Access is limited to authorized enterprise nodes.');
    } else if (err === 'unauthorized_admin') {
      setError('Unauthorized access. Administrative privileges required.');
    }

    return () => clearInterval(interval);
  }, []);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Fill in all credential fields.');
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
        // Force hard redirect to reload app context fully
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Connection refused.');
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#fafbfe] relative overflow-hidden flex items-center justify-center p-3 md:p-6 font-sans selection:bg-indigo-100 selection:text-indigo-600">
      
      {/* Premium Dribbble-style blurred glowing background meshes */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-200/25 to-violet-200/25 blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-100/25 to-blue-200/25 blur-[110px] pointer-events-none"></div>

      {/* Compact Main Container */}
      <div className="w-full max-w-[390px] relative z-10 space-y-4">
        
        {/* Top Logo & Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/60 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-800 tracking-wide font-mono">VELOX LEDGER LINK</span>
          </div>
          <p className="text-slate-400 text-[9px] font-bold font-mono uppercase tracking-widest">
            
          </p>
        </div>

        {/* Elevated Dribbble-Style Compact Card */}
        <div 
          style={{
            border: '1px solid rgba(0, 0, 0, 0.04)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.02), 0 30px 50px -10px rgba(94, 92, 230, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)'
          }}
          className="rounded-2xl p-5 md:p-7 space-y-4"
        >
          
          {/* Card Header */}
          <div className="text-center space-y-1">
            <h2 
              style={{ color: '#0f172a' }} 
              className="text-2xl font-black tracking-tight"
            >
              Access your ledger
            </h2>
            <p 
              style={{ color: '#64748b' }} 
              className="text-[11px] leading-relaxed max-w-[280px] mx-auto"
            >
              Enter credentials or use Google OAuth to securely sync node logs.
            </p>
          </div>

          {error && (
            <div 
              style={{ border: '1px solid rgba(239, 68, 68, 0.1)', background: '#fef2f2' }}
              className="p-2.5 text-rose-600 rounded-lg text-[11px] font-semibold text-center flex items-center justify-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              {error}
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-3.5">
            
            {/* Center Email Input */}
            <div className="space-y-1 text-center">
              <label 
                style={{ color: '#94a3b8' }} 
                className="text-[9px] font-bold uppercase tracking-wider font-mono block text-center"
              >
                Enterprise Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@velox.com"
                style={{
                  textAlign: 'center',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0'
                }}
                className="block w-full px-3 py-2.5 rounded-xl placeholder-slate-400 text-xs focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-sans font-medium"
              />
            </div>

            {/* Center Password Input */}
            <div className="space-y-1 text-center">
              <label 
                style={{ color: '#94a3b8' }} 
                className="text-[9px] font-bold uppercase tracking-wider font-mono block text-center w-full"
              >
                System Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  textAlign: 'center',
                  color: '#0f172a',
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0'
                }}
                className="block w-full px-3 py-2.5 rounded-xl placeholder-slate-400 text-xs focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all font-sans"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                height: '42px',
                width: '100%',
                borderRadius: '10px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 10px rgba(15, 23, 42, 0.1)',
                transition: 'all 0.15s ease-in-out'
              }}
              className="hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign in to Velox'
              )}
            </button>

          </form>

          {/* Account Enrollment Link */}
          <div className="text-center pt-0.5 text-[11px] text-slate-400 font-medium">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
              Request enrollment
            </Link>
          </div>

        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[10px] font-medium">
          <Shield className="w-3.5 h-3.5 text-slate-300" />
          <span>Secured by multi-party protocols</span>
        </div>

      </div>

    </div>
  );
}
