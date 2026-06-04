"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  TrendingUp,
  Settings,
  ArrowLeftRight
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/invoices", label: "Invoices", icon: FileSpreadsheet },
    { href: "/dashboard/clients", label: "Clients", icon: Users },
    { href: "/dashboard/payments", label: "Payments", icon: ArrowLeftRight },
    { href: "/fintech/financial-documents", label: "Reports", icon: TrendingUp },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg z-50 px-6 pt-3 pb-6 shadow-2xl flex items-center justify-between">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="flex flex-col items-center gap-1.5 transition-all no-underline shrink-0 group relative py-1 px-3"
          >
            <div
              className={`p-1.5 rounded-full transition-all ${
                isActive 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "text-slate-400 group-hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            
            <span
              className={`text-[10px] font-bold tracking-tight transition-colors ${
                isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white"
              }`}
            >
              {tab.label}
            </span>

            {/* Active Indicator dot */}
            {isActive && (
              <span className="absolute top-0 w-1 h-1 bg-emerald-400 rounded-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
