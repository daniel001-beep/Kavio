"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Building, CreditCard, Bell } from "lucide-react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/employer/settings", label: "Company", icon: Building },
    { href: "/employer/settings/profile", label: "Profile", icon: User },
    { href: "/employer/settings/billing", label: "Billing", icon: CreditCard },
    { href: "/employer/settings/notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage your company profile and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`w-full flex items-center px-3 py-2 text-sm font-bold rounded-lg transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="md:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}
