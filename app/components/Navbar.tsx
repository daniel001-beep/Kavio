"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  ArrowLeftRight, 
  FileSpreadsheet, 
  BookOpen, 
  BarChart3, 
  LogOut, 
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import React, { useState } from 'react';
import { useSession, useSignOut } from '@/app/context/AuthContext';

const Navbar = () => {
  const { data: session } = useSession();
  const signOut = useSignOut();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Links grouped by category for mobile
  const navGroups = [
    {
      label: 'OVERVIEW',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      label: 'CORE ACCOUNTING',
      items: [
        { href: '/fintech/bank-mutation', label: 'Bank Mutation', icon: ArrowLeftRight },
        { href: '/fintech/reconciliation', label: 'Reconciliation Feed', icon: ArrowLeftRight },
        { href: '/fintech/financial-documents', label: 'Financial Documents', icon: FileSpreadsheet },
        { href: '/fintech/journals', label: 'Journals', icon: BookOpen },
        { href: '/fintech/ar-aging', label: 'AR Aging Schedule', icon: FileSpreadsheet },
      ]
    },
    {
      label: 'SYSTEM & SECURITY',
      items: [
        { href: '/fintech/master-data', label: 'Master Data', icon: Database },
        { href: '/fintech/security', label: 'Audit Vault Security', icon: ShieldCheck },
      ]
    }
  ];

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();
  const showAdminLink = session?.user?.isAdmin || (adminEmail && session?.user?.email?.toLowerCase().trim() === adminEmail);
  if (showAdminLink) {
    navGroups[2].items.push({ href: '/fintech/admin', label: 'Admin Console', icon: ShieldCheck });
  }

  // Flatten for desktop mapping (since categories are only for mobile)
  const flatNavLinks = navGroups.flatMap(group => group.items);

  return (
    <>
      {/* Mobile Hamburger Toggle Button (Positioned cleanly on the top-left of the header area on mobile) */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden absolute top-3.5 left-6 z-40 p-2 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 text-slate-600 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar (Permanent solid Stripe-style nav panel) */}
      <aside className="hidden md:flex flex-col bg-white border-r border-slate-200/80 shrink-0 h-full w-64">
        {/* Header with blue sure+ Logo */}
        <div className="flex items-center justify-between px-6 pt-7 pb-5">
          <Link
            href="/dashboard"
            className="no-underline flex items-center hover:opacity-85 transition-opacity shrink-0"
          >
            <span className="text-[22px] font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">Velox</span>
            <span className="text-[22px] font-medium text-slate-400 tracking-tight ml-1">Fintech</span>
          </Link>
        </div>

        {/* Nav Links List (Flat for Desktop) */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <ul className="space-y-4">
            {flatNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-[14px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50/80 text-blue-600'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="flex-1">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Area - Log Out at bottom */}
        <div className="py-6 bg-white mt-auto border-t border-slate-100 px-4">
          <div className="space-y-1">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-[14px] font-medium text-blue-600 hover:bg-blue-50/50 transition-all duration-150"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0 text-blue-600" />
              <span className="flex-1 text-left">Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Glass backdrop overlay with tap-to-close handler */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Sidebar Menu sliding in from left */}
          <aside className="relative flex flex-col bg-white w-64 h-full shadow-2xl z-10 transition-transform duration-300 ease-out border-r border-slate-200">
            {/* Header Area */}
            <div className="flex items-center justify-between px-6 pt-7 pb-5">
              <Link
                href="/dashboard"
                onClick={() => setIsMobileOpen(false)}
                className="no-underline flex items-center hover:opacity-85 transition-opacity shrink-0"
              >
                <span className="text-[22px] font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">Velox</span>
                <span className="text-[22px] font-medium text-slate-400 tracking-tight ml-1">Fintech</span>
              </Link>

              {/* Close Button */}
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav Links Grouped for Mobile */}
            <nav className="flex-1 overflow-y-auto py-6 px-4">
              <div className="space-y-6">
                {navGroups.map((group) => (
                  <div key={group.label}>
                    {/* Category Header */}
                    <h3 className="px-4 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      {group.label}
                    </h3>
                    {/* Group Links */}
                    <ul className="space-y-1">
                      {group.items.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;

                        return (
                          <li key={link.label}>
                            <Link
                              href={link.href}
                              onClick={() => setIsMobileOpen(false)}
                              className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-[14px] font-medium transition-all duration-150 ${
                                isActive
                                  ? 'bg-blue-50/80 text-blue-600'
                                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                              }`}
                            >
                              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                              <span className="flex-1">{link.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>

            {/* Footer Area - Log Out at bottom */}
            <div className="py-6 bg-white mt-auto border-t border-slate-100 px-4">
              <div className="space-y-1">
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-[14px] font-medium text-blue-600 hover:bg-blue-50/50 transition-all duration-150"
                >
                  <LogOut className="w-[18px] h-[18px] shrink-0 text-blue-600" />
                  <span className="flex-1 text-left">Log Out</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Navbar;