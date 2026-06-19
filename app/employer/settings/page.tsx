"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Briefcase, Zap } from "lucide-react";
import { useSession } from "@/app/context/AuthContext";
import WorkspaceSwitcherModal from "../../components/WorkspaceSwitcherModal";

export default function EmployerSettingsPage() {
  const { data: session } = useSession();
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Workspace Switcher Card */}
      <Card className="border-slate-100 bg-slate-50/50 shadow-sm rounded-3xl">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Current Workspace
            </h3>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Employer Workspace
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Manage workers, payments, reminders, and receipts.
            </p>
          </div>
          <Button 
            onClick={() => setIsWorkspaceModalOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold py-2 px-5 rounded-xl text-xs transition-all hover:shadow-sm shrink-0 flex items-center gap-2"
          >
            Switch Workspace
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm rounded-3xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Company Information</CardTitle>
          <CardDescription>Update your company details and branding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Company Name</label>
            <Input defaultValue="Acme Corp" className="rounded-xl border-slate-200" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Industry</label>
            <Input defaultValue="Technology" className="rounded-xl border-slate-200" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Company Address</label>
            <Input defaultValue="123 Startup Blvd, San Francisco, CA" className="rounded-xl border-slate-200" />
          </div>
          <div className="pt-4 flex justify-end">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 px-6">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <WorkspaceSwitcherModal 
        isOpen={isWorkspaceModalOpen} 
        onClose={() => setIsWorkspaceModalOpen(false)} 
      />
    </div>
  );
}
