"use client";

import React, { useState } from "react";
import { Plus, Search, MoreVertical, DollarSign, Calendar, UploadCloud, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const dummyPayments = [
    {
      id: "1",
      workerName: "Alice Smith",
      amount: 2500,
      dueDate: "2026-06-30",
      status: "PENDING",
    },
    {
      id: "2",
      workerName: "Bob Jones",
      amount: 1200,
      dueDate: "2026-06-15",
      status: "PAID",
      paidDate: "2026-06-15",
    },
    {
      id: "3",
      workerName: "Charlie Brown",
      amount: 800,
      dueDate: "2026-06-01",
      status: "OVERDUE",
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "OVERDUE":
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100"><AlertTriangle className="w-3 h-3 mr-1" /> Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payments</h1>
          <p className="text-slate-500 mt-2 font-medium">Track and manage upcoming payroll and expenses.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-6 shadow-sm shadow-emerald-200">
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-3xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search payments by worker..." 
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
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Due Date</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dummyPayments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900">{payment.workerName}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900">${payment.amount}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center text-slate-600 font-medium">
                      <Calendar className="w-3 h-3 mr-2 text-slate-400" />
                      {new Date(payment.dueDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {payment.status !== "PAID" && (
                        <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center">
                          <UploadCloud className="w-3 h-3 mr-1" />
                          Upload Receipt
                        </button>
                      )}
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
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
