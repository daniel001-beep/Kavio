"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Settings,
  LogOut, 
  ChevronRight,
  Briefcase,
  ChevronsUpDown,
  ChevronLeft
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useSession, useSignOut } from "@/app/context/AuthContext";
import WorkspaceSwitcherModal from "./WorkspaceSwitcherModal";

export default function EmployerNavbar() {
  const { data: session } = useSession();
  const signOut = useSignOut();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

  // Sync collapsed state with localStorage for persistent state across pages
  useEffect(() => {
    const saved = localStorage.getItem("kavio_employer_sidebar_collapsed");
    if (saved) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem("kavio_employer_sidebar_collapsed", String(newVal));
  };

  // Nav Groups with correct permissions and styling
  const navGroups = [
    {
      label: "Overview",
      items: [
        { href: "/employer", label: "Dashboard", icon: LayoutDashboard },
        { href: "/employer/workers", label: "Workers", icon: Users },
        { href: "/employer/payments", label: "Payments", icon: CreditCard },
        { href: "/employer/calendar", label: "Calendar", icon: Calendar },
        { href: "/employer/analytics", label: "Analytics", icon: TrendingUp },
        { href: "/employer/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-white border-r border-slate-100 h-screen sticky top-0 shrink-0 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header Area */}
      <div className="p-4 border-b border-slate-100 shrink-0 min-h-[73px] flex flex-col justify-center">
        {!isCollapsed ? (
          <button 
            onClick={() => setIsWorkspaceModalOpen(true)}
            className="w-full flex items-center justify-between bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200 p-1.5 rounded-xl transition-all duration-200 group text-left"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider leading-none mb-1">Workspace</span>
                <span className="text-sm font-bold text-slate-900 truncate leading-none">Employer</span>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
          </button>
        ) : (
          <button 
            onClick={() => setIsWorkspaceModalOpen(true)}
            className="mx-auto w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors"
          >
            <Briefcase className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-2">
            {!isCollapsed && (
              <h3 className="px-4 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
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
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 relative group ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 font-semibold text-sm border border-emerald-100 border-l-2 border-l-emerald-500 pl-3"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 text-sm font-medium"
                      }`}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isActive ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-700"
                        }`}
                      />
                      {!isCollapsed && <span className="flex-1 truncate">{link.label}</span>}
                      
                      {/* Tooltip for collapsed mode */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap">
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
      <div className="border-t border-slate-100 p-4 space-y-4">
        {/* User Info when expanded */}
        {!isCollapsed && session?.user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold uppercase shrink-0">
              {session.user.name ? session.user.name[0] : (session.user.email ? session.user.email[0] : "U")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-750 truncate">
                {session.user.name || "Employer"}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                {session.user.email}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => signOut()}
            className={`flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all w-full ${isCollapsed ? "justify-center" : ""}`}
            title="Log Out"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Log out</span>}
          </button>
          
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors ml-1"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="mx-auto flex p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      {/* Modals */}
      <WorkspaceSwitcherModal 
        isOpen={isWorkspaceModalOpen} 
        onClose={() => setIsWorkspaceModalOpen(false)} 
      />
    </aside>
  );
}
