'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { Zap } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

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
  const pathname = usePathname();

  useEffect(() => {
    // Reset the signing out state the moment we land on the auth page
    if (pathname === '/auth/signin' || pathname === '/auth/signup') {
      setIsSigningOut(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isLoaded) {
      setStatus('loading');
      return;
    }

    if (isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress || '';
      const envAdminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();
      const adminEmail = envAdminEmail || 'idowuisdaniel1@gmail.com';
      const isUserAdmin = email.toLowerCase().trim() === adminEmail;

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

  const router = useRouter();

  const signOut = async () => {
    setIsSigningOut(true);
    clerkSignOut({ redirectUrl: '/auth/signin' });
  };

  return (
    <AuthContext.Provider value={{ session, status, signOut }}>
      {isSigningOut ? (
        <div className="fixed inset-0 z-[99999] bg-[#fafbfe] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
              Signing out...
            </p>
          </div>
        </div>
      ) : children}
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
