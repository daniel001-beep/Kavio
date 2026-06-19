import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import EmployerNavbar from "../components/EmployerNavbar";
import EmployerBottomNav from "../components/EmployerBottomNav";
import HeaderUser from "../components/HeaderUser";
import CreateWorkspaceClient from "../components/CreateWorkspaceClient";
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

  // Verify they have an employer workspace
  const workspace = await db.query.workspaces.findFirst({
    where: (ws, { eq, and }) => and(eq(ws.userId, userId), eq(ws.type, "employer")),
  });

  if (!workspace) {
    return <CreateWorkspaceClient type="employer" />;
  }

  // Set Sentry Context
  const Sentry = await import("@sentry/nextjs");
  Sentry.setUser({
    id: user.id,
    email: user.email || undefined,
    username: user.name || undefined,
  });
  Sentry.setTag("workspace_type", "employer");
  Sentry.setTag("current_plan", user.plan_type || "free");

  return (
    <div className="h-screen w-full bg-[#f4f5f7] p-0 sm:p-4 md:p-6 flex flex-col justify-center overflow-hidden fintech-layout-root font-medium">
      <div className="h-full flex bg-white sm:rounded-[28px] md:rounded-[32px] shadow-sm overflow-hidden relative">
        <EmployerNavbar />
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          <header className="bg-white h-16 px-4 md:px-8 flex items-center justify-between md:justify-end shrink-0 border-b border-slate-100">
            <div className="md:hidden flex items-center">
              <span className="text-xl font-bold text-slate-900 tracking-tight">Kavio</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full ml-2 uppercase tracking-widest">
                Employer
              </span>
            </div>
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
