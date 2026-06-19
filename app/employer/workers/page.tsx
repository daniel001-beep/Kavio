"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Briefcase, User, Mail, Phone, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { getWorkers, createWorker } from "@/app/actions/employer";

export default function WorkersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    accountNumber: "",
    role: "Freelancer",
    salaryAmount: "",
    paymentFrequency: "monthly",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadWorkers = async () => {
    try {
      const data = await getWorkers();
      setWorkers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Optimistic UI Update: add it immediately to the local state
    const optimisticWorker = {
      id: Math.random().toString(), // temporary ID
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      accountNumber: formData.accountNumber,
      role: formData.role,
      salaryAmount: parseFloat(formData.salaryAmount) || 0,
      paymentFrequency: formData.paymentFrequency,
    };
    
    setWorkers(prev => [optimisticWorker, ...prev]);
    setIsModalOpen(false);
    setFormData({ name: "", email: "", phone: "", accountNumber: "", role: "Freelancer", salaryAmount: "", paymentFrequency: "monthly" });

    try {
      await createWorker({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        accountNumber: formData.accountNumber,
        role: formData.role,
        salaryAmount: parseFloat(formData.salaryAmount) || 0,
        paymentFrequency: formData.paymentFrequency,
      });
      await loadWorkers(); // Reload the list to get the real DB ID
    } catch (err) {
      console.error("Failed to create worker", err);
      // Revert if failed (optional, simplified here)
      await loadWorkers();
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (w.email && w.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Workers</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your team members and contractors.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-6 shadow-sm shadow-emerald-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Worker
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-3xl p-6 min-h-[400px]">
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

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-48 text-slate-500">
            <p>No workers found.</p>
          </div>
        ) : (
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
                {filteredWorkers.map((worker) => (
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
                        {worker.email && (
                          <div className="flex items-center text-slate-600">
                            <Mail className="w-3 h-3 mr-2 text-slate-400" />
                            {worker.email}
                          </div>
                        )}
                        {worker.phone && (
                          <div className="flex items-center text-slate-600">
                            <Phone className="w-3 h-3 mr-2 text-slate-400" />
                            {worker.phone}
                          </div>
                        )}
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
        )}
      </Card>

      {/* Modal for adding a worker */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <Card className="w-full max-w-md p-6 rounded-3xl shadow-xl border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Add New Worker</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWorker} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                <Input 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="rounded-xl"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="rounded-xl"
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
                  <Input 
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="rounded-xl"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Account Number</label>
                  <Input 
                    type="text"
                    value={formData.accountNumber}
                    onChange={e => setFormData({...formData, accountNumber: e.target.value})}
                    className="rounded-xl"
                    placeholder="e.g. 1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                  <select 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Freelancer">Freelancer</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Employee">Employee</option>
                    <option value="Vendor">Vendor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Pay Rate</label>
                  <Input 
                    required 
                    type="number"
                    step="0.01"
                    value={formData.salaryAmount}
                    onChange={e => setFormData({...formData, salaryAmount: e.target.value})}
                    className="rounded-xl"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Frequency</label>
                  <select 
                    value={formData.paymentFrequency}
                    onChange={e => setFormData({...formData, paymentFrequency: e.target.value})}
                    className="w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="weekly">Weekly</option>
                    <option value="project">Per Project</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Worker"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
