'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Conditionally hide landing page controls for app screens
  const isAppRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/onboarding') || 
    pathname.startsWith('/auth') || 
    pathname.startsWith('/admin');

  if (isAppRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex grow flex-col bg-slate-950">
      <Navbar />
      <main className="grow pt-16">{children}</main>
      <Footer />
    </div>
  );
}
