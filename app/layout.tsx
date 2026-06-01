import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./components/Providers";
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
  title: "Kavio | Production-Ready Ledger Infrastructure",
  description: "Enterprise-grade double-entry ledger engine, multi-tenant wallet nesting, and high-frequency real-time event streams built for B2B financial operators.",
  keywords: "fintech, ledger, double-entry accounting, B2B payments, financial infrastructure, multi-tenant wallets, realtime APIs",
  openGraph: {
    title: "Kavio",
    description: "Enterprise-grade double-entry ledger engine built for B2B financial operators.",
    url: "https://kavio.vercel.app",
    siteName: "Kavio",
    images: [
      {
        url: "https://kavio.vercel.app/cdn.png",
        width: 1200,
        height: 630,
        alt: "Kavio Architecture",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kavio | Production-Ready Ledger Infrastructure",
    description: "Enterprise-grade double-entry ledger engine, multi-tenant wallet nesting, and high-frequency real-time event streams.",
    images: ["https://kavio.vercel.app/cdn.png"],
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-[#f4f5f7] text-[#1e293b]">
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
