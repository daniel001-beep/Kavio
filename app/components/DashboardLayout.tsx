import React from 'react';
import Navbar from './Navbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <section className="container mx-auto px-2 xs:px-3 sm:px-6 md:px-8 lg:px-12 pt-4 sm:pt-6 md:pt-8 pb-20 sm:pb-24 max-w-7xl">
      <div className="flex flex-col gap-10">
        {children}
      </div>
    </section>
  );
}
