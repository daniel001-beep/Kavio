import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import HeaderUser from "../components/HeaderUser";
import "../fintech/fintech.css";

export const metadata: Metadata = {
  title: "Kavio - Portfolio Dashboard",
  description: "Enterprise portfolio dashboard and ledger balance statistics.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen bg-[#f4f5f7] p-1.5 xs:p-3 sm:p-4 md:p-6 flex flex-col justify-center overflow-hidden fintech-layout-root">
      <div className="h-full flex bg-white border border-slate-200/60 rounded-[20px] xs:rounded-[24px] sm:rounded-[32px] shadow-sm overflow-hidden relative">
        <Navbar />
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
          <header className="bg-white border-b border-slate-200/60 h-16 px-8 flex items-center justify-end shrink-0 md:flex hidden">
            <HeaderUser />
          </header>
          <main className="grow overflow-y-auto p-3 xs:p-4 sm:p-6 md:p-8 pb-24 md:pb-8 bg-[#f8fafc]">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
