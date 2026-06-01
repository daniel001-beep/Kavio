import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./components/Providers";
import { LayoutWrapper } from "./components/LayoutWrapper";
import { BottomNavigation } from "./components/BottomNavigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kavio - Business Finance OS",
  description: "Business Finance Operating System for Freelancers, incorporating natural language transaction logging and real-time ledger accounting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16 md:pb-0">
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <BottomNavigation />
        </Providers>
      </body>
    </html>
  );
}
