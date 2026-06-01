"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Landmark, User } from "lucide-react";

export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Ledger",
      href: "/dashboard/transactions",
      icon: Receipt,
    },
    {
      label: "Invoices",
      href: "/dashboard/reports",
      icon: Landmark,
    },
    {
      label: "Account",
      href: "/account",
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-lg border-t border-slate-200/80 shadow-lg flex items-center justify-around px-2 pb-safe md:hidden select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center group cursor-pointer"
          >
            <div
              className={`p-1 rounded-xl transition-all duration-200 ${
                isActive 
                  ? "text-blue-600 scale-110 bg-blue-50/50" 
                  : "text-slate-400 group-hover:text-slate-600 group-active:scale-95"
              }`}
            >
              <Icon className="w-5 h-5 stroke-[2.25]" />
            </div>
            <span
              className={`text-[10px] font-extrabold tracking-tight mt-0.5 transition-colors duration-200 ${
                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
export default BottomNavigation;
