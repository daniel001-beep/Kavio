"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  MessageSquare,
  Settings,
  ShieldCheck
} from "lucide-react";
import { useSession } from "@/app/context/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const tabs = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/invoices", label: "Invoices", icon: FileSpreadsheet },
    { href: "/dashboard/clients", label: "Clients", icon: Users },
    { href: "/dashboard/collections", label: "Collections", icon: MessageSquare },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100/80 z-50 pb-[env(safe-area-inset-bottom,12px)] pt-2 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] flex items-center justify-around w-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="flex flex-col items-center justify-center gap-0.5 transition-all no-underline group relative py-1.5 px-1 min-w-0"
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isActive 
                  ? "bg-emerald-50 text-emerald-600" 
                  : "text-slate-400 group-hover:text-slate-700"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
            </div>
            
            <span
              className={`text-[9px] font-bold tracking-tight transition-colors text-center w-full truncate ${
                isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-700"
              }`}
            >
              {tab.label}
            </span>

            {/* Active Indicator dot */}
            {isActive && (
              <span className="absolute top-1 w-1 h-1 bg-emerald-500 rounded-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
