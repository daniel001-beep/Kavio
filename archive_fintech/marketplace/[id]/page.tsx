'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { products } from '@/app/components/MarketplaceGrid';
import DashboardLayout from '@/app/components/DashboardLayout';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-2xl font-bold text-slate-100 mb-4">Product Not Found</h1>
          <button onClick={() => router.push('/fintech/marketplace')} className="text-blue-500 hover:text-blue-400">
            Return to Marketplace
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = product.icon;

  return (
    <DashboardLayout>
      <div className="pt-4">
        {/* Back Button */}
        <button 
          onClick={() => router.push('/fintech/marketplace')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back to Marketplace</span>
        </button>

        {/* Header Section */}
        <div className="bg-slate-900 border border-slate-700 rounded-sm p-8 md:p-12 mb-8 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between relative overflow-hidden">
          {/* Background Glow */}
          <div 
            className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3"
            style={{ backgroundColor: product.accentColor }}
          />
          
          <div className="flex-1 z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-sm flex items-center justify-center bg-slate-800 border border-slate-700 shrink-0">
                <Icon className="w-8 h-8" style={{ color: product.accentColor }} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-1">{product.title}</h1>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{product.category}</p>
              </div>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed max-w-3xl">
              {product.description}
            </p>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-sm shrink-0 w-full md:w-auto z-10 text-center md:text-left">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Target Yield</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono mb-2">{product.yieldRate}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Liquidity</p>
            <p className="text-sm font-bold text-slate-100 mb-6">{product.liquidity}</p>
            <button className="w-full py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-sm transition-colors text-base">
              Allocate Capital
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Features */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-700 rounded-sm p-8">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-slate-300 font-medium">{feature}</p>
                </div>
              ))}
              {/* Extra mock features to flesh out the page */}
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-slate-300 font-medium">24/7 dedicated enterprise support</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-slate-300 font-medium">99.99% Guaranteed uptime SLA</p>
              </div>
            </div>
          </div>

          {/* Compliance & Integration */}
          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-700 rounded-sm p-8">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Compliance</h3>
              <div className="flex flex-col gap-3">
                {['SOC 2 Type II', 'ISO 27001', 'PCI DSS'].map((badge) => (
                  <div key={badge} className="flex items-center gap-3 p-3 bg-slate-800 rounded-sm border border-slate-700">
                    <div className="w-2 h-2 bg-emerald-500 rounded-sm"></div>
                    <span className="text-sm font-bold text-slate-200 uppercase tracking-widest">{badge} Certified</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-700 rounded-sm p-8">
              <h3 className="text-lg font-bold text-slate-100 mb-4">API Documentation</h3>
              <p className="text-sm text-slate-400 mb-4">Integration guides, API references, and SDKs are available in the developer portal.</p>
              <button className="text-blue-400 hover:text-blue-300 font-semibold text-sm flex items-center gap-1">
                View Documentation →
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
