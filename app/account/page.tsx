"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, Mail } from 'lucide-react';

export default function Account() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ show: false, text: '', type: '' });
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    // If user is logged in, redirect to products after a small delay to ensure session is set
    if (status === 'authenticated' && session?.user) {
      const timer = setTimeout(() => {
        router.push('/products');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status, session, router]);

  const handleSignIn = async () => {
    setLoading(true);
    setMessage({ show: false, text: '', type: '' });
    
    try {
      setMessage({ show: true, text: 'Redirecting to Google authentication...', type: 'info' });
      // Small delay to ensure message is shown
      setTimeout(() => {
        window.location.href = '/api/auth/signin';
      }, 500);
    } catch (error: any) {
      setLoading(false);
      setMessage({ show: true, text: 'Authentication error. Please try again.', type: 'error' });
    }
  };


  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 md:px-0">
      <div className="w-full max-w-md">
        {/* Sign In / Profile Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Account</h1>
            <p className="text-gray-400">Sign in with NextAuth provider</p>
          </div>

          {/* Sign In Redirect Button */}
          {status === 'loading' ? (
            <div className="w-full px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg text-center">
              Checking authentication...
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={loading || status === 'authenticated'}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Redirecting...' : 'Sign In with Google'}
            </button>
          )}

          {/* Message Display */}
          {message.show && (
            <div className={`mt-6 p-4 rounded-lg text-center ${
              message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              message.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {message.text}
            </div>
          )}

          {/* Info Text */}
          <p className="text-xs text-gray-500 text-center mt-6">
            This store uses secure NextAuth authentication. Your account data is private and only accessible to you.
          </p>
        </div>
      </div>
    </div>
  );
}