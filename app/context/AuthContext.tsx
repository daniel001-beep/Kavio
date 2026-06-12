'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

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
    await clerkSignOut({ redirectUrl: '/auth/signin' });
  };

  return (
    <AuthContext.Provider value={{ session, status, signOut }}>
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
