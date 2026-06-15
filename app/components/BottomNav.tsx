"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  MessageSquare,
  Settings
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/invoices", label: "Invoices", icon: FileSpreadsheet },
    { href: "/dashboard/clients", label: "Clients", icon: Users },
    { href: "/dashboard/collections", label: "Collections", icon: MessageSquare },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100/80 z-50 py-2.5 pb-5 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] grid grid-cols-5 justify-items-center w-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="w-full flex flex-col items-center gap-0.5 transition-all no-underline group relative py-0.5 px-0.5"
          >
            <div
              className={`p-1 rounded-full transition-all ${
                isActive 
                  ? "bg-emerald-50 text-emerald-600" 
                  : "text-slate-400 group-hover:text-slate-700"
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
            </div>
            
            <span
              className={`text-[9px] font-bold tracking-tight transition-colors text-center whitespace-nowrap ${
                isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-700"
              }`}
            >
              {tab.label}
            </span>

            {/* Active Indicator dot */}
            {isActive && (
              <span className="absolute top-0 w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
