'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Exclude auth routes and the landing page from sidebar layouts
  const isAuthRoute = pathname?.startsWith('/auth');
  const isLandingRoute = pathname === '/';

  if (isAuthRoute || isLandingRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* 1. Sidebar Panel */}
      <Sidebar />

      {/* 2. Main Content viewport */}
      <div className="flex-1 min-h-screen w-full md:pl-64 flex flex-col">
        <main className="grow p-6 xs:p-8 sm:p-10 w-full max-w-7xl mx-auto min-w-0 bg-[#f8fafc]">
          {children}
        </main>
      </div>
    </div>
  );
}
