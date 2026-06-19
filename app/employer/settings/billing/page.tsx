"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, Rocket, Users, FileText, Receipt, Loader2, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getBillingUsage } from "@/app/actions/billing";
import { UpgradeModal } from "@/app/components/UpgradeModal";

export default function BillingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const usageData = await getBillingUsage();
        setData(usageData);
      } catch (err) {
        console.error("Failed to load billing usage", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const { subscription, usage } = data;
  
  // Calculate percentage for workers. Using 100 as an arbitrary max just for the progress bar visual if it's unlimited
  const workerLimit = subscription.workerLimit > 100 ? 100 : subscription.workerLimit;
  const workerPercentage = Math.min((usage.workersCount / workerLimit) * 100, 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Early Access Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="bg-white/20 p-3 rounded-xl mr-4">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black">Early Access Beta — Free for now!</h2>
            <p className="text-emerald-50 font-medium text-sm mt-1">
              Thank you for being one of our first users. Enjoy full access to Kavio Employer completely free while we're in Beta.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Current Plan Overview */}
        <Card className="md:col-span-2 border-slate-200 shadow-sm rounded-3xl overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Current Plan</p>
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-black text-slate-900">{subscription.planTier} Plan</h3>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                  {subscription.status}
                </span>
              </div>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl h-10">
              View Plans <ArrowUpRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <CardContent className="p-6 md:p-8 space-y-8">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-slate-400" />
                    Workers Quota
                  </h4>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Number of active workers in your account</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">{usage.workersCount}</span>
                  <span className="text-slate-500 font-medium ml-1">
                    / {subscription.workerLimit > 900 ? "Unlimited" : subscription.workerLimit}
                  </span>
                </div>
              </div>
              <Progress value={workerPercentage} className="h-3 bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center">
                <div className="bg-white p-3 rounded-xl shadow-sm mr-4">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500">Payments Recorded</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{usage.paymentsCount}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center">
                <div className="bg-white p-3 rounded-xl shadow-sm mr-4">
                  <Receipt className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500">Receipts Uploaded</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{usage.receiptsCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Stub */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm rounded-3xl h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-slate-400" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 m-4 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <CreditCard className="w-5 h-5 text-slate-400" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">No payment method</h4>
              <p className="text-sm text-slate-500 font-medium mb-4">You won't be charged during the Early Access Beta.</p>
              <Button disabled variant="outline" className="font-bold rounded-xl">
                Add Card (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>

      <UpgradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
