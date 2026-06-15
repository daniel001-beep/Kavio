"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowRight, Smartphone } from "lucide-react";
import CopyButton from "./CopyButton";

interface OpayButtonProps {
  invoiceAmount: number;
  freelancerAccount: string;
  freelancerBank?: string;
  freelancerName?: string;
}

export default function OpayButton({
  invoiceAmount,
  freelancerAccount,
  freelancerBank = "OPay",
  freelancerName = "the freelancer"
}: OpayButtonProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const ua = navigator.userAgent;
    setIsMobile(/Android|iPhone|iPad/i.test(ua));
    setIsIOS(/iPhone|iPad/i.test(ua));
  }, []);

  if (!isClient) {
    // Show a skeleton while loading to avoid SSR mismatches
    return (
      <div className="w-full h-12 bg-slate-200 animate-pulse rounded-xl" />
    );
  }

  const formattedAmount = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0
  }).format(invoiceAmount);

  const handlePayClick = () => {
    const deepLink = `opay://transfer?accountNumber=${freelancerAccount}&amount=${invoiceAmount}&bankCode=999992`;

    if (isMobile) {
      if (isIOS) {
        // iOS hidden iframe trick
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = deepLink;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2500);
      } else {
        // Android redirect
        window.location.href = deepLink;
      }
    }
  };

  if (!isMobile) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="space-y-2">
        <button
          type="button"
          onClick={handlePayClick}
          style={{ backgroundColor: "#00B140" }}
          className="w-full h-14 text-white text-lg font-bold rounded-xl shadow-lg transition-all duration-150 flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.99] cursor-pointer animate-pulse"
        >
          Pay ₦{formattedAmount} with OPay 💚
        </button>
        <p className="text-xs italic text-slate-500 text-center font-medium leading-relaxed mt-1.5">
          Once paid, upload your OPay receipt below to confirm instantly ⬇️
        </p>
      </div>
    </div>
  );
}
