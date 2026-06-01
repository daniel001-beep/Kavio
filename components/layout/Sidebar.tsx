'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  Cpu
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/fintech/journals', label: 'Transactions', icon: ArrowLeftRight },
    { href: '/fintech/reports', label: 'Reports', icon: BarChart3 },
    { href: '/fintech/master-data', label: 'Settings', icon: Settings },
  ];

  // Exact match for /dashboard, prefix match for all nested fintech/* routes
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Hamburger Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50 text-slate-600 transition-all active:scale-95"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sidebar — Fixed 260px */}
      <aside className="hidden md:flex flex-col bg-white border-r border-slate-200 shrink-0 h-screen w-64 fixed left-0 top-0 z-30">
        
        {/* Brand Header */}
        <div className="px-7 pt-8 pb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
            Baseflow <span className="font-semibold text-slate-400">OS</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <ul className="space-y-1 list-none p-0 m-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold no-underline transition-all ${
                      active
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            System Active
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/25 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative flex flex-col bg-white w-64 h-full shadow-2xl z-10 border-r border-slate-200">
            <div className="px-6 pt-7 pb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-lg font-black text-slate-800 tracking-tight">Baseflow OS</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="space-y-1 list-none p-0 m-0">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold no-underline transition-all ${
                          active
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
