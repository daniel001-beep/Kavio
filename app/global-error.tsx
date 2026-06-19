"use client";

import * as Sentry from "@sentry/nextjs";
import Error from "next/error";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-center p-8">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">
            Something went wrong
          </h1>
          
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            We've been notified about this issue and are looking into it. Please try refreshing the page or navigating back to safety.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            
            <a
              href="/"
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              <Home className="w-4 h-4" />
              Return Home
            </a>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              Error ID: {error.digest || "Unknown"}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
