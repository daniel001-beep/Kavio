"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, DollarSign, Calendar, UploadCloud, CheckCircle2, Clock, AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPayments, createPayment, markPaymentPaid, getWorkers } from "@/app/actions/employer";

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    workerId: "",
    amount: "",
    dueDate: "",
  });

  const loadData = async () => {
    try {
      const [paymentsData, workersData] = await Promise.all([
        getPayments(),
        getWorkers()
      ]);
      setPayments(paymentsData);
      setWorkers(workersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workerId) return;

    setIsSubmitting(true);
    
    // Optimistic UI update
    const selectedWorker = workers.find(w => w.id === formData.workerId);
    const optimisticPayment = {
      id: Math.random().toString(),
      workerName: selectedWorker?.name || "Unknown",
      amount: parseFloat(formData.amount) || 0,
      dueDate: new Date(formData.dueDate).toISOString(),
      status: "PENDING"
    };

    setPayments(prev => [optimisticPayment, ...prev]);
    setIsModalOpen(false);
    setFormData({ workerId: "", amount: "", dueDate: "" });

    try {
      await createPayment({
        workerId: formData.workerId,
        amount: parseFloat(formData.amount) || 0,
        dueDate: new Date(formData.dueDate),
      });
      await loadData();
    } catch (err) {
      console.error("Failed to create payment", err);
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async (paymentId: string) => {
    try {
      await markPaymentPaid(paymentId);
      await loadData();
    } catch (err) {
      console.error("Failed to mark payment paid", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "OVERDUE":
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0"><AlertTriangle className="w-3 h-3 mr-1" /> Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredPayments = payments.filter(p => 
    p.workerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payments</h1>
          <p className="text-slate-500 mt-2 font-medium">Track and manage upcoming payroll and expenses.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-6 shadow-sm shadow-emerald-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-3xl p-6 min-h-[400px]">
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

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-48 text-slate-500">
            <p>No payments recorded yet.</p>
          </div>
        ) : (
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
                {filteredPayments.map((payment) => (
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
                          <>
                            <button 
                              onClick={() => handleMarkPaid(payment.id)}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Mark Paid
                            </button>
                            <button className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors flex items-center">
                              <UploadCloud className="w-3 h-3 mr-1" />
                              Receipt
                            </button>
                          </>
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
        )}
      </Card>

      {/* Modal for recording a payment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <Card className="w-full max-w-md p-6 rounded-3xl shadow-xl border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Worker</label>
                <select 
                  required
                  value={formData.workerId}
                  onChange={e => setFormData({...formData, workerId: e.target.value})}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Select a worker</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                {workers.length === 0 && (
                  <p className="text-xs text-rose-500 mt-1">Please add a worker first before recording a payment.</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Amount ($)</label>
                <Input 
                  required 
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="rounded-xl"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Due Date</label>
                <Input 
                  required 
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                  className="rounded-xl"
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || workers.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Payment"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
