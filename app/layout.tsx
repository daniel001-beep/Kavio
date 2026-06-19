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
  title: "Kavio | Automated Payment Collection for Freelancers",
  description: "Stop chasing clients. Kavio automates polite, persistent WhatsApp and Email nudges so you get paid on time, without the awkward silence.",
  keywords: "freelancer, invoice automation, payment collection, WhatsApp reminders, auto reminders, client nudges, kavio, bookkeeping",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kavio",
  },
  icons: {
    icon: "/kavio_pwa_icon.png",
    shortcut: "/kavio_pwa_icon.png",
    apple: "/kavio_pwa_icon.png",
  },
  openGraph: {
    title: "Kavio | Automated Payment Collection for Freelancers",
    description: "Stop chasing clients. Kavio automates polite, persistent WhatsApp and Email nudges so you get paid on time, without the awkward silence.",
    url: "https://kavio.vercel.app",
    siteName: "Kavio",
    images: [
      {
        url: "https://kavio.vercel.app/kavio.jpg",
        width: 1024,
        height: 1024,
        alt: "Kavio App Icon",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kavio | Automated Payment Collection for Freelancers",
    description: "Stop chasing clients. Kavio automates polite, persistent WhatsApp and Email nudges so you get paid on time, without the awkward silence.",
    images: ["https://kavio.vercel.app/kavio.jpg"],
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-[#f4f5f7] text-[#1e293b] font-medium">
        <Providers>
          {children}
        </Providers>
        <Analytics />
        <SpeedInsights />
        
        {/* PWA Service Worker Registration */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(function(reg) {
                console.log('SW registered successfully:', reg.scope);
              }).catch(function(err) {
                console.log('SW registration failed:', err);
              });
            });
          }
        `}} />
      </body>
    </html>
  );
}
