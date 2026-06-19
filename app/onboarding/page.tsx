"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Briefcase, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/app/context/AuthContext";

export default function OnboardingPage() {
  const { user } = useUser();
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"freelancer" | "employer" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If they already have a role set that isn't null, we could redirect them.
  }, [session, router]);

  const handleSubmit = async () => {
    if (!selectedRole || !user?.id) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (response.ok) {
        if (selectedRole === "employer") {
          window.location.href = "/employer";
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-black tracking-tight" style={{ color: "#1e293b" }}>
          Who are you?
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: "#475569" }}>
          Choose your role to get started with Kavio.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-3xl sm:px-10">
          <div className="space-y-4">
            {/* Freelancer Option */}
            <button
              onClick={() => setSelectedRole("freelancer")}
              className={`w-full flex items-center p-4 border-2 rounded-2xl transition-all duration-200 ${
                selectedRole === "freelancer"
                  ? "border-[#00B140] bg-[#00B140]/10 shadow-md"
                  : "border-slate-200 bg-white hover:border-[#00B140]/50 hover:bg-slate-50"
              }`}
            >
              <div className={`p-3 rounded-xl ${selectedRole === "freelancer" ? "bg-[#00B140] text-white" : "bg-slate-100 text-slate-500"}`}>
                <User className="w-6 h-6" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-sm font-bold" style={{ color: selectedRole === "freelancer" ? "#00B140" : "#1e293b" }}>Freelancer</h3>
                <p className="text-xs mt-1" style={{ color: selectedRole === "freelancer" ? "#00B140" : "#64748b" }}>
                  I want to invoice clients and get paid.
                </p>
              </div>
            </button>

            {/* Employer Option */}
            <button
              onClick={() => setSelectedRole("employer")}
              className={`w-full flex items-center p-4 border-2 rounded-2xl transition-all duration-200 ${
                selectedRole === "employer"
                  ? "border-[#00B140] bg-[#00B140]/10 shadow-md"
                  : "border-slate-200 bg-white hover:border-[#00B140]/50 hover:bg-slate-50"
              }`}
            >
              <div className={`p-3 rounded-xl ${selectedRole === "employer" ? "bg-[#00B140] text-white" : "bg-slate-100 text-slate-500"}`}>
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-sm font-bold" style={{ color: selectedRole === "employer" ? "#00B140" : "#1e293b" }}>Employer</h3>
                <p className="text-xs mt-1" style={{ color: selectedRole === "employer" ? "#00B140" : "#64748b" }}>
                  I want to manage and pay my workers.
                </p>
              </div>
            </button>
          </div>

          <div className="mt-8">
            <button
              onClick={handleSubmit}
              disabled={!selectedRole || isSubmitting}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#00B140] hover:bg-[#008f33] focus:outline-none transition-colors ${
                (!selectedRole || isSubmitting) ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Saving..." : "Continue to Dashboard"}
              {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2 text-white" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
