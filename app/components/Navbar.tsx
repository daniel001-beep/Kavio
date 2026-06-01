"use client";

import Link from 'next/link';
import { BarChart3, DollarSign, Lock, Server, User, LogOut, TrendingDown } from 'lucide-react';
import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import VeloxLogo from './VeloxLogo';

const Navbar = () => {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navLinks = [
    { href: '/fintech/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/fintech/runway', label: 'Runway', icon: TrendingDown },
    { href: '/fintech/marketplace', label: 'Marketplace', icon: DollarSign },
    { href: '/fintech/ledger', label: 'Ledger', icon: BarChart3 },
    { href: '/fintech/developer', label: 'Developer API', icon: Server },
    { href: '/fintech/security', label: 'Security', icon: Lock },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/fintech/dashboard" className="shrink-0 no-underline hover:opacity-80 transition-opacity">
          <VeloxLogo size={32} />
        </Link>
        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200 text-sm font-medium"
                aria-label={link.label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden xl:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Mobile Hamburger & Account Menu */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Account Dropdown */}
          {session?.user && (
            <div className="relative">
              <button
                onClick={() => setAccountOpen(!accountOpen)}
                className="relative w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 flex items-center justify-center text-white font-semibold group"
                aria-label="Account menu"
                title={session.user.name || session.user.email || 'Account'}
              >
                <User className="w-5 h-5" />
              </button>

              {/* Dropdown Menu */}
              {accountOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setAccountOpen(false)}
                >
                  {/* User Info */}
                  <div className="mb-4 pb-4 border-b border-slate-700">
                    <p className="text-sm font-semibold text-slate-100">{session.user.name}</p>
                    <p className="text-xs text-slate-400">{session.user.email}</p>
                    {(session.user as any)?.isAdmin && (
                      <p className="text-xs text-amber-400 font-semibold mt-1">👑 Administrator</p>
                    )}
                  </div>

                  {/* Admin Link */}
                  {(session.user as any)?.isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors mb-2"
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  {/* Account Page Link */}
                  <Link
                    href="/account"
                    className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors mb-2"
                  >
                    My Profile
                  </Link>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      signOut({ callbackUrl: '/auth/signin' });
                    }}
                    className="w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2 justify-center font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sign In Link (when not authenticated) */}
          {!session?.user && (
            <Link
              href="/auth/signin"
              className="px-6 py-2.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-sm transition-all duration-200 hidden sm:block"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {menuOpen && (
          <div className="fixed inset-0 top-[76px] z-40 lg:hidden animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            
            {/* Menu Card */}
            <nav
              className="absolute top-4 right-4 left-4 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-3 space-y-1 animate-in slide-in-from-top-4 duration-300 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-4 px-4 py-4 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all duration-200 font-bold"
                    onClick={() => setMenuOpen(false)}
                    aria-label={link.label}
                  >
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-md">
                      <Icon className="w-5 h-5 text-blue-500" />
                    </div>
                    {link.label}
                  </Link>
                );
              })}
              
              {/* Mobile Logout Button (if logged in) */}
              {session?.user && (
                <div className="pt-4 mt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: '/auth/signin' });
                    }}
                    className="w-full flex items-center gap-4 px-4 py-4 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all duration-200 font-bold"
                  >
                    <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-md">
                      <LogOut className="w-5 h-5" />
                    </div>
                    Sign Out
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};


export default Navbar;