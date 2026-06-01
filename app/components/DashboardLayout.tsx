import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <section className="container mx-auto px-4 md:px-8 lg:px-12 pt-32 md:pt-16 pb-24 max-w-7xl">
      <div className="flex flex-col gap-10">
        {children}
      </div>
    </section>
  );
}
