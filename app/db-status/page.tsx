"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, AlertCircle, Loader } from "lucide-react";

export default function DBStatusPage() {
  const [status, setStatus] = useState<"loading" | "connected" | "failed">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const res = await fetch("/api/db-health");
        const data = await res.json();

        if (res.ok && data.status === "connected") {
          setStatus("connected");
          setMessage(
            data.productsExist
              ? "✅ Database is connected and has products!"
              : "✅ Database connected but no products. Visit /api/seed to populate."
          );
        } else {
          setStatus("failed");
          setMessage(`❌ Database Error: ${data.error}`);
        }
      } catch (err: any) {
        setStatus("failed");
        setMessage(`❌ Connection failed: ${err.message}`);
      }
    };

    checkDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Database Status</h1>

            {status === "loading" && (
              <div className="flex justify-center">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}

            {status === "connected" && (
              <div className="flex justify-center mb-4">
                <Check className="w-12 h-12 text-green-500" />
              </div>
            )}

            {status === "failed" && (
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
            )}
          </div>

          <p className="text-gray-300 text-center mb-8 text-lg">{message}</p>

          {status === "failed" && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
              <h2 className="text-red-400 font-bold mb-4">⚠️ Troubleshooting</h2>
              <ul className="text-red-300 space-y-2 text-sm">
                <li>✓ Verify that POSTGRES_URL is set in .env.local</li>
                <li>✓ Check that Supabase/database server is running</li>
                <li>✓ Ensure network connectivity to the database host</li>
                <li>✓ Verify database credentials are correct</li>
                <li>✓ Check if DNS can resolve the database hostname</li>
              </ul>
            </div>
          )}

          {status === "connected" && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-8">
              <h2 className="text-green-400 font-bold mb-4">✅ You're All Set!</h2>
              <p className="text-green-300 text-sm mb-4">
                Your application is connected to the database and ready to use.
              </p>
              <Link
                href="/api/seed"
                className="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
              >
                Seed Sample Data
              </Link>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/products"
              className="block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-center"
            >
              Go to Products
            </Link>
            <Link
              href="/"
              className="block px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition text-center border border-white/20"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* System Info */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-bold mb-4">System Information</h3>
          <div className="space-y-2 text-gray-400 text-sm font-mono">
            <p>
              <span className="text-gray-500">NODE_ENV:</span>{" "}
              {process.env.NODE_ENV || "development"}
            </p>
            <p>
              <span className="text-gray-500">App URL:</span> {process.env.NEXTAUTH_URL}
            </p>
            <p>
              <span className="text-gray-500">Timestamp:</span> {new Date().toISOString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
