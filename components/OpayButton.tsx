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
          window.open("https://opayweb.com", "_blank");
        }, 2500);
      } else {
        // Android redirect
        window.location.href = deepLink;
        setTimeout(() => {
          window.open("https://opayweb.com", "_blank");
        }, 2000);
      }
    } else {
      // Desktop: Open instructional modal
      setIsModalOpen(true);
    }
  };

  return (
    <div className="w-full">
      {isMobile ? (
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
      ) : (
        <button
          type="button"
          onClick={handlePayClick}
          className="w-full h-12 bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[0.99] active:scale-[0.98] cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          Pay with OPay on your phone
        </button>
      )}

      {/* Desktop Instructional Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block font-mono">OPay Checkout</span>
              <h3 className="text-lg font-bold text-slate-900">Complete payment on your OPay app</h3>
            </div>

            {/* Step instructions */}
            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#00B140] font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <p className="mt-0.5 text-slate-800">Open OPay app on your phone</p>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#00B140] font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <p className="mt-0.5 text-slate-800">Go to Transfer &rarr; Bank Account</p>
              </div>

              <div className="flex gap-3 items-start border-l-2 border-slate-100 pl-4 py-1">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#00B140] font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                    <p className="mt-0.5 text-slate-500">Account Number</p>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span id="opay-modal-acc" className="font-mono text-sm font-black text-slate-900 tracking-wider">
                      {freelancerAccount}
                    </span>
                    <CopyButton text={freelancerAccount} highlightTargetId="opay-modal-acc" />
                  </div>
                  <div className="text-[10px] text-slate-400 pl-7">
                    Bank Name: <span className="font-bold">{freelancerBank}</span> | Account Name: <span className="font-bold">{freelancerName}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-start border-l-2 border-slate-100 pl-4 py-1">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#00B140] font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                    <p className="mt-0.5 text-slate-500">Amount</p>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span id="opay-modal-amt" className="font-mono text-base font-bold text-emerald-600">
                      ₦{formattedAmount}
                    </span>
                    <CopyButton text={invoiceAmount.toString()} highlightTargetId="opay-modal-amt" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#00B140] font-bold flex items-center justify-center shrink-0 text-[10px]">5</span>
                <p className="mt-0.5 text-slate-800">Upload receipt below after paying</p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => window.open("https://opayweb.com", "_blank")}
                className="w-full h-11 bg-[#00B140] hover:bg-[#009933] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                Open OPay Web <ArrowRight className="w-4 h-4 text-emerald-100" />
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                Done (I used my phone app)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
