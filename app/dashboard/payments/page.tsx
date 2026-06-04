"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeftRight, 
  Search, 
  DollarSign, 
  Calendar, 
  User, 
  FileText, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  datePaid: string;
  reference: string | null;
  notes: string | null;
}

export default function PaymentsPage() {
  const [paymentsList, setPaymentsList] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const invoices = await res.json();
        // Extract paid invoices and map to payments structure
        const paidInvs: Payment[] = invoices
          .filter((inv: any) => inv.status === "PAID")
          .map((inv: any) => ({
            id: inv.id,
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            clientName: inv.client?.name || "Freelance Client",
            amount: inv.amount,
            datePaid: inv.createdAt, // fallback to createdAt if no payment log exists
            reference: inv.metadata?.paymentReference || "Manual Bank Transfer",
            notes: inv.paymentInstructions || "Collections payment settled."
          }));
        setPaymentsList(paidInvs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalCollected = paymentsList.reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = paymentsList.filter(p => {
    return p.clientName.toLowerCase().includes(search.toLowerCase()) || 
           p.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
           (p.reference || "").toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Loading payments history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Payments Ledger</h1>
          <p className="text-slate-600 text-sm font-semibold mt-1">Audit manual collection receipts and paid invoices</p>
        </div>
      </div>

      {/* Aggregate metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Revenue Paid</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 font-mono">₦ {totalCollected.toLocaleString()}</h3>
            <p className="text-[10px] text-emerald-650 font-semibold mt-1">Settled collection receipts</p>
          </CardContent>
        </Card>

        <Card className="border-none rounded-2xl shadow-sm bg-white hover:bg-slate-50/50 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transactions Count</span>
              <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">{paymentsList.length} Payments</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">All-time collection count</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search payments by client, invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 py-5 rounded-xl border-slate-200/50 focus-visible:ring-emerald-500 text-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="py-4 px-6">Client / Tenant</th>
                <th className="py-4 px-6">Invoice details</th>
                <th className="py-4 px-6">Payment Method</th>
                <th className="py-4 px-6">Settlement Date</th>
                <th className="py-4 px-6 text-right">Amount Settled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-655">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-450">
                    No paid transactions matching search.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/20 transition-all">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-800">{pay.clientName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pay.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {pay.reference}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(pay.datePaid).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-black text-emerald-600 font-mono">
                      ₦ {pay.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
