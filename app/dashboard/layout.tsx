import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import HeaderUser from "../components/HeaderUser";
import CreateWorkspaceClient from "../components/CreateWorkspaceClient";
import "../fintech/fintech.css";

import VerificationGate from "./VerificationGate";
import { Suspense } from "react";
import DashboardSkeleton from "./loading";

export const metadata: Metadata = {
  title: "Kavio - Portfolio Dashboard",
  description: "Kavio Freelancer Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full bg-[#f4f5f7] p-0 sm:p-4 md:p-6 flex flex-col justify-center overflow-hidden fintech-layout-root">
      <div className="h-full flex bg-white sm:rounded-[28px] md:rounded-[32px] shadow-sm overflow-hidden relative">
        <Navbar />
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          <header className="bg-white h-16 px-8 flex items-center justify-end shrink-0 hidden md:flex">
            <HeaderUser />
          </header>
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 pb-24 md:pb-8 bg-white">
            <Suspense fallback={<DashboardSkeleton />}>
              <VerificationGate>{children}</VerificationGate>
            </Suspense>
          </main>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
