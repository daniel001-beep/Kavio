'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { Zap } from 'lucide-react';

const AuthContext = createContext<{
  session: any;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  signOut: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      setStatus('loading');
      return;
    }

    if (isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress || '';
      const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();
      const isUserAdmin = adminEmail && email.toLowerCase().trim() === adminEmail;

      setSession({
        user: {
          id: user.id,
          email: email,
          name: user.fullName || user.firstName || email.split('@')[0],
          isAdmin: !!isUserAdmin
        }
      });
      setStatus('authenticated');
    } else {
      setSession(null);
      setStatus('unauthenticated');
    }
  }, [isLoaded, isSignedIn, user]);

  const signOut = async () => {
    setIsSigningOut(true);
    // Yield to the browser so the green logout screen paints instantly before Clerk blocks the thread
    await new Promise(r => setTimeout(r, 10));
    await clerkSignOut();
    window.location.href = '/auth/signin';
  };

  return (
    <AuthContext.Provider value={{ session, status, signOut }}>
      {isSigningOut && (
        <div className="fixed inset-0 z-[99999] bg-[#fafbfe] overflow-hidden flex items-center justify-center p-4 font-sans">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-200/20 to-teal-200/20 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-100/20 to-blue-200/20 blur-[110px] pointer-events-none" />
          <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Zap className="w-5 h-5 text-white animate-pulse" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
              Signing out securely...
            </p>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const context = useContext(AuthContext);
  if (!context) {
    return { data: null, status: 'loading' as const };
  }
  return {
    data: context.session,
    status: context.status,
  };
}

export function useSignOut() {
  const context = useContext(AuthContext);
  if (!context) {
    return async () => {};
  }
  return context.signOut;
}
