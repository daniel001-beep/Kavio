'use client';

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { LayoutGrid, ArrowLeftRight, Shuffle, FileText, BookOpen, Clock, LogOut } from 'lucide-react';
import QuickLogDrawer from '@/app/components/QuickLogDrawer';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [businessName, setBusinessName] = useState('Acme Studio');
  const [userEmail, setUserEmail] = useState('idowuisdaniel1@gmail.com');
  const [userName, setUserName] = useState('Idowu');

  useEffect(() => {
    fetch('/api/business')
      .then(res => res.json())
      .then(data => {
        if (data.business?.name) {
          setBusinessName(data.business.name);
        }
      })
      .catch(err => console.error("Failed to load business profile in layout:", err));

    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        if (session?.user) {
          setUserEmail(session.user.email || 'idowuisdaniel1@gmail.com');
          setUserName(session.user.name || 'Idowu');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsDrawerOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOpenDrawer = () => setIsDrawerOpen(true);
    window.addEventListener('open-quick-log', handleOpenDrawer);
    return () => window.removeEventListener('open-quick-log', handleOpenDrawer);
  }, []);

  const handleTransactionSuccess = () => {
    window.dispatchEvent(new Event('transaction-created'));
  };

  // Exact menu list and icons from your reference screenshot
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { href: '/dashboard/transactions', label: 'Bank Mutation', icon: ArrowLeftRight },
    { href: '/dashboard/reconciliation', label: 'Reconciliation Feed', icon: Shuffle },
    { href: '/dashboard/reports', label: 'Financial Documents', icon: FileText },
    { href: '/dashboard/journals', label: 'Journals', icon: BookOpen },
    { href: '/dashboard/ar-aging', label: 'AR Aging Schedule', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-slate-900 font-sans">
      {/* Sidebar Navigation - Responsive hidden on mobile */}
      <aside className="hidden md:flex w-72 border-r border-slate-200/80 flex flex-col fixed h-full bg-white z-20">
        {/* Right edge decorative blue accent bar exactly like screenshot */}
        <div className="absolute right-0 top-36 w-[4px] h-60 bg-blue-600 z-30 rounded-l"></div>

        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <NextLink href="/dashboard" className="flex items-center gap-2">
            <span className="text-blue-600 font-extrabold text-2.5xl tracking-tight">Velox</span>
            <span className="text-slate-800 font-bold text-2.5xl tracking-tight">Fintech</span>
          </NextLink>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Highlight active if pathname matches (fallback to Dashboard check)
            const isActive = pathname === item.href || (item.label === 'Dashboard' && pathname === '/dashboard');
            return (
              <NextLink 
                key={item.href}
                href={item.href} 
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50/60 text-blue-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </NextLink>
            );
          })}
        </nav>
        
        {/* Log Out aligned exactly at bottom in blue */}
        <div className="p-6 border-t border-slate-100 space-y-2">
          <NextLink 
            href="/auth/signin" 
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-blue-600 hover:bg-blue-50 font-bold text-sm transition-all"
          >
            <LogOut className="w-5 h-5 text-blue-600" />
            Log Out
          </NextLink>
        </div>
      </aside>

      {/* Main Content Area - Responsive margin-left */}
      <div className="flex-1 ml-0 md:ml-72 flex flex-col min-h-screen">
        {/* Top Navbar Profile Bar with Circular Avatar */}
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-100 px-6 md:px-12 flex justify-end items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold text-sm flex items-center justify-center border border-blue-100 relative">
              {userName.substring(0, 2).toUpperCase()}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="text-left leading-tight">
              <div className="text-sm font-extrabold text-slate-800">{userName}</div>
              <div className="text-[10px] text-slate-400 font-mono font-medium">{userEmail}</div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 md:p-12 bg-[#f8fafc] pb-24 md:pb-12">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Global Quick-Log Drawer */}
      <QuickLogDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
}
