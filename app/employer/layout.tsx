import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import EmployerNavbar from "../components/EmployerNavbar";
import EmployerBottomNav from "../components/EmployerBottomNav";
import HeaderUser from "../components/HeaderUser";
import "../fintech/fintech.css";

export const metadata: Metadata = {
  title: "Kavio - Employer Dashboard",
  description: "Kavio Employer Dashboard",
};

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/auth/signin");
  }

  // Verify they are an employer
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    redirect("/auth/signin");
  }

  if (user.role !== "employer") {
    if (!user.role) {
      redirect("/onboarding");
    }
    redirect("/dashboard");
  }

  return (
    <div className="h-screen w-full bg-[#f4f5f7] p-0 sm:p-4 md:p-6 flex flex-col justify-center overflow-hidden fintech-layout-root font-medium">
      <div className="h-full flex bg-white sm:rounded-[28px] md:rounded-[32px] shadow-sm overflow-hidden relative">
        <EmployerNavbar />
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          <header className="bg-white h-16 px-8 flex items-center justify-end shrink-0 hidden md:flex border-b border-slate-100">
            <HeaderUser />
          </header>
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 pb-24 md:pb-8 bg-white font-medium">
            {children}
          </main>
        </div>
        <EmployerBottomNav />
      </div>
    </div>
  );
}
