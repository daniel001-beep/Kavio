"use client";

import React, { useState } from "react";
import { Plus, Search, MoreVertical, Briefcase, User, Mail, Phone, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function WorkersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const dummyWorkers = [
    {
      id: "1",
      name: "Alice Smith",
      role: "Freelancer",
      email: "alice@example.com",
      phone: "+1 234 567 8900",
      salaryAmount: 2500,
      paymentFrequency: "monthly",
      status: "ACTIVE",
    },
    {
      id: "2",
      name: "Bob Jones",
      role: "Contractor",
      email: "bob@example.com",
      phone: "+1 987 654 3210",
      salaryAmount: 1200,
      paymentFrequency: "biweekly",
      status: "ACTIVE",
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Workers</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your team members and contractors.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-6 shadow-sm shadow-emerald-200">
          <Plus className="w-4 h-4 mr-2" />
          Add Worker
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-3xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search workers by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl font-medium focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 rounded-lg">
              <tr>
                <th className="px-6 py-4 font-bold rounded-l-xl">Worker</th>
                <th className="px-6 py-4 font-bold">Contact</th>
                <th className="px-6 py-4 font-bold">Role & Type</th>
                <th className="px-6 py-4 font-bold">Pay Rate</th>
                <th className="px-6 py-4 font-bold text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dummyWorkers.map((worker) => (
                <tr key={worker.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        {worker.name.charAt(0)}
                      </div>
                      <div className="font-bold text-slate-900">{worker.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center text-slate-600">
                        <Mail className="w-3 h-3 mr-2 text-slate-400" />
                        {worker.email}
                      </div>
                      <div className="flex items-center text-slate-600">
                        <Phone className="w-3 h-3 mr-2 text-slate-400" />
                        {worker.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      <Briefcase className="w-3 h-3 mr-1.5" />
                      {worker.role}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900">${worker.salaryAmount} <span className="text-slate-400 text-xs font-medium">/{worker.paymentFrequency}</span></div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
