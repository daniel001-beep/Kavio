'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase-client';

const AuthContext = createContext<{
  session: any;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  signOut: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    // 1. Helper to retrieve and parse the local session cookie
    const getLocalUser = () => {
      if (typeof document === 'undefined') return null;
      const match = document.cookie.match(/velox-local-user=([^;]+)/);
      if (!match) return null;
      try {
        let val = decodeURIComponent(match[1]).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        if (val.includes('%')) {
          val = decodeURIComponent(val);
        }
        try {
          const parsed = JSON.parse(val);
          if (typeof parsed === 'string') {
            return JSON.parse(parsed);
          }
          return parsed;
        } catch (inner) {
          const parsedStr = JSON.parse(match[1]);
          return typeof parsedStr === 'string' ? JSON.parse(parsedStr) : parsedStr;
        }
      } catch (e) {
        return null;
      }
    };

    const localUser = getLocalUser();
    if (localUser) {
      setSession({
        user: {
          id: localUser.id,
          email: localUser.email,
          name: localUser.name || localUser.email?.split('@')[0],
          isAdmin: !!localUser.isAdmin
        }
      });
      setStatus('authenticated');
      return;
    }

    const supabase = createClient();

    // Fetch initial cloud session if no local cookie is present
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      if (activeSession) {
        setSession({
          user: {
            id: activeSession.user.id,
            email: activeSession.user.email,
            name: activeSession.user.email?.split('@')[0],
            isAdmin: activeSession.user.email?.toLowerCase().trim() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim(),
          },
        });
        setStatus('authenticated');
      } else {
        setSession(null);
        setStatus('unauthenticated');
      }
    });

    // Listen to changes in authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      const currentLocalUser = getLocalUser();
      if (currentLocalUser) {
        setSession({
          user: {
            id: currentLocalUser.id,
            email: currentLocalUser.email,
            name: currentLocalUser.name || currentLocalUser.email?.split('@')[0],
            isAdmin: !!currentLocalUser.isAdmin
          }
        });
        setStatus('authenticated');
        return;
      }

      if (activeSession) {
        setSession({
          user: {
            id: activeSession.user.id,
            email: activeSession.user.email,
            name: activeSession.user.email?.split('@')[0],
            isAdmin: activeSession.user.email?.toLowerCase().trim() === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim(),
          },
        });
        setStatus('authenticated');
      } else {
        setSession(null);
        setStatus('unauthenticated');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { signOutAction } = await import('@/app/actions/auth');
      await signOutAction();
    } catch (e) {
      console.error('Failed server signout', e);
    }
    // Also try to clear client-side cookies just in case
    document.cookie = "velox-local-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    window.location.href = '/auth/signin';
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
    // Return loading state if context isn't ready
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
