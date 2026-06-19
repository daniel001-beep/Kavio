"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Briefcase, Zap, ChevronRight, Loader2, X } from "lucide-react";

interface WorkspaceSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkspaceSwitcherModal({ isOpen, onClose }: WorkspaceSwitcherModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSelectWorkspace = (type: "freelancer" | "employer") => {
    setIsLoading(type);
    // Routing handles checking if the workspace exists or prompts for creation
    if (type === "employer") {
      router.push("/employer");
    } else {
      router.push("/dashboard");
    }
  };

  return createPortal(
    <div className="fintech-layout-root fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-50 w-full max-w-[450px] bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden mx-4 animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pb-4">
          <h2 className="text-xl font-bold tracking-tight" style={{ color: '#0f172a' }}>
            Choose Workspace
          </h2>
          <p className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>
            Select the workspace you want to switch to.
          </p>
        </div>

        <div className="px-4 pb-6 space-y-3">
          {/* Freelancer Workspace Option */}
          <button
            onClick={() => handleSelectWorkspace("freelancer")}
            disabled={!!isLoading}
            className="w-full text-left bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-emerald-200 p-4 rounded-2xl transition-all duration-200 group relative flex items-center justify-between shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold transition-colors" style={{ color: '#0f172a' }}>
                  Freelancer
                </h4>
                <p className="text-[11px] font-semibold" style={{ color: '#64748b' }}>
                  Track clients and incoming payments.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center justify-center">
              {isLoading === "freelancer" ? (
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              )}
            </div>
          </button>

          {/* Employer Workspace Option */}
          <button
            onClick={() => handleSelectWorkspace("employer")}
            disabled={!!isLoading}
            className="w-full text-left bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-blue-200 p-4 rounded-2xl transition-all duration-200 group relative flex items-center justify-between shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold transition-colors" style={{ color: '#0f172a' }}>
                  Employer
                </h4>
                <p className="text-[11px] font-semibold" style={{ color: '#64748b' }}>
                  Manage employees, freelancers, contractors, and vendors.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center justify-center">
              {isLoading === "employer" ? (
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              )}
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
