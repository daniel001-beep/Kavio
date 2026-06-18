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
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 pb-safe bg-white/95 backdrop-blur-md border-t border-slate-100 z-50 flex items-center justify-around w-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href));

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className="flex flex-col items-center justify-center flex-1 gap-1 min-h-[64px] no-underline relative active:scale-[0.98] transition-transform duration-100"
          >
            {/* Active Indicator dot */}
            {isActive && (
              <span className="absolute top-1 w-1 h-1 bg-[#00B140] rounded-full" />
            )}
            
            <Icon 
              className={`w-[22px] h-[22px] mt-2 transition-colors ${
                isActive ? "text-[#00B140]" : "text-slate-400"
              }`} 
            />
            
            <span
              className={`text-[10px] tracking-tight transition-colors text-center w-full truncate ${
                isActive ? "font-semibold text-[#00B140]" : "font-medium text-slate-400"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
