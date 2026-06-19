"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Briefcase, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateWorkspaceClientProps {
  type: "freelancer" | "employer";
}

export default function CreateWorkspaceClient({ type }: CreateWorkspaceClientProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setIsCreating(true);
    setError("");
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create workspace");
        setIsCreating(false);
      }
    } catch (e) {
      setError("Network error occurred.");
      setIsCreating(false);
    }
  };

  const isFreelancer = type === "freelancer";
  const Icon = isFreelancer ? Zap : Briefcase;
  const colorClass = isFreelancer ? "text-emerald-600 bg-emerald-50" : "text-blue-600 bg-blue-50";
  const buttonClass = isFreelancer ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700";

  return (
    <div className="min-h-screen w-full bg-[#f4f5f7] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-slate-100 max-w-md w-full">
        <div className={`w-16 h-16 ${colorClass} rounded-2xl flex items-center justify-center mb-8`}>
          <Icon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          Create {isFreelancer ? "Freelancer" : "Employer"} Workspace
        </h1>
        <p className="text-slate-500 font-medium mb-8">
          {isFreelancer 
            ? "Your central hub to track clients, manage invoices, and view earnings."
            : "Your central hub to manage workers, track payments, and store receipts."}
        </p>

        <div className="space-y-4 mb-8">
          {isFreelancer ? (
            <>
              <FeatureItem text="Track clients" />
              <FeatureItem text="Manage invoices" />
              <FeatureItem text="View earnings" />
            </>
          ) : (
            <>
              <FeatureItem text="Manage workers" />
              <FeatureItem text="Track payments" />
              <FeatureItem text="Receive reminders" />
              <FeatureItem text="Store receipts" />
            </>
          )}
        </div>

        {error && <p className="text-sm font-bold text-rose-500 mb-4">{error}</p>}

        <Button 
          onClick={handleCreate} 
          disabled={isCreating}
          className={`w-full py-6 rounded-xl font-bold text-white transition-all shadow-md ${buttonClass}`}
        >
          {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Workspace"}
        </Button>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-4 h-4 text-slate-700" />
      </div>
      <span className="text-sm font-semibold text-slate-700">{text}</span>
    </div>
  );
}
