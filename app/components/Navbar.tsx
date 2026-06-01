"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  ArrowLeftRight, 
  BookOpen, 
  TrendingUp, 
  ShieldCheck, 
  Database, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Settings
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useSession, useSignOut } from "@/app/context/AuthContext";

export default function Navbar() {
  const { data: session } = useSession();
  const signOut = useSignOut();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync collapsed state with localStorage for persistent state across pages
  useEffect(() => {
    const saved = localStorage.getItem("kavio_sidebar_collapsed");
    if (saved) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem("kavio_sidebar_collapsed", String(newVal));
  };

  // Nav Groups with correct permissions and styling
  const navGroups = [
    {
      label: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/invoices", label: "Invoices", icon: FileSpreadsheet },
        { href: "/dashboard/clients", label: "Clients", icon: Users },
        { href: "/fintech/financial-documents", label: "Reports", icon: TrendingUp },
        { href: "/dashboard/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-slate-200/80 shrink-0 h-screen sticky top-0 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header Area */}
      <div className="flex items-center justify-between px-6 pt-7 pb-5">
        {!isCollapsed && (
          <Link
            href="/dashboard"
            className="no-underline flex items-center hover:opacity-85 transition-opacity shrink-0"
          >
            <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight">
              Kavio
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full ml-2">
              Pro
            </span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="mx-auto text-xl font-black text-emerald-600">
            K
          </Link>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-2">
            {!isCollapsed && (
              <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {group.label}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-150 relative group ${
                        isActive
                          ? "bg-emerald-50 text-emerald-600 border-l-2 border-emerald-500 pl-[14px]"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-700"
                        }`}
                      />
                      {!isCollapsed && <span className="flex-1 truncate">{link.label}</span>}
                      
                      {/* Tooltip for collapsed mode */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap">
                          {link.label}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / Account / Collapse Toggle */}
      <div className="p-4 border-t border-slate-100 space-y-4">
        {/* User Info when expanded */}
        {!isCollapsed && session?.user && (
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold uppercase">
              {session.user.name ? session.user.name[0] : (session.user.email ? session.user.email[0] : "U")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">
                {session.user.name || "Freelancer"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          {/* Logout Button */}
          <button
            onClick={() => signOut()}
            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[13px] font-extrabold text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 border border-slate-150 hover:border-rose-100 transition-all duration-200 shadow-sm ${
              isCollapsed ? "mx-auto justify-center w-full" : "w-full"
            }`}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0 text-slate-400 group-hover:text-rose-500 transition-colors" />
            {!isCollapsed && <span>Log Out</span>}
          </button>

          {/* Collapse Toggle Arrow (Desktop Only) */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-800 rounded-lg transition-colors ml-auto border border-slate-200"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}