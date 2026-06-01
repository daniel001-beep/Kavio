import React from 'react';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mb-4 font-bold text-xl shadow-sm">
            V
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Velox</h1>
          <p className="text-slate-500 text-sm font-medium">Let's set up your business profile</p>
        </div>
        
        {/* Main Content Area */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm shadow-slate-100">
          {children}
        </div>
      </div>
    </div>
  );
}
