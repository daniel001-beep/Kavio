import React, { useState, useEffect } from "react";
import { X, ArrowRight } from "lucide-react";
import CopyButton from "./CopyButton";

interface OpayButtonProps {
  invoiceAmount: number | null | undefined;
  freelancerAccount: string | null | undefined;
  freelancerBank?: string | null | undefined;
  freelancerName?: string | null | undefined;
}

export default function OpayButton({
  invoiceAmount,
  freelancerAccount,
  freelancerBank = "OPay",
  freelancerName = "the freelancer"
}: OpayButtonProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsMobile(/Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  if (!isClient) return null;

  // Edge Case 8a/8b: invoiceAmount or freelancerAccount is null or undefined -> hide button entirely, show contact text
  if (invoiceAmount === null || invoiceAmount === undefined || freelancerAccount === null || freelancerAccount === undefined) {
    return (
      <div className="text-center py-4 px-6 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-500">
        Contact the freelancer for payment details
      </div>
    );
  }

  const formattedAmount = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0
  }).format(invoiceAmount);

  const handlePayClick = () => {
    if (isMobile) {
      const isIOS = /iPhone|iPad/i.test(navigator.userAgent);
      const deepLinkUrl = `opay://transfer?accountNumber=${freelancerAccount}&amount=${invoiceAmount}&bankCode=999992`;

      if (isIOS) {
        // iOS hidden iframe trick to prevent error pages
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = deepLinkUrl;
        document.body.appendChild(iframe);
        setTimeout(() => {
          document.body.removeChild(iframe);
          window.open("https://opayweb.com", "_blank");
        }, 2500);
      } else {
        // Android deep link location redirect
        window.location.href = deepLinkUrl;
        setTimeout(() => {
          window.open("https://opayweb.com", "_blank");
        }, 2000);
      }
    } else {
      // Desktop behavior: open modal
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handlePayClick}
        disabled={!invoiceAmount || !freelancerAccount}
        className={`w-full ${
          isMobile ? "w-full animate-pulse" : "sm:w-auto px-8"
        } h-12 bg-[#00B140] hover:brightness-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#00B140]/10 cursor-pointer`}
      >
        Pay ₦{formattedAmount} with OPay 💚
      </button>

      {/* Desktop Walkthrough Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#00B140] uppercase tracking-wider block font-mono">OPay Direct Checkout</span>
              <h3 className="text-lg font-bold text-slate-900">Pay with OPay from your phone</h3>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-4 text-xs font-semibold text-slate-700">
              {/* Step 1 */}
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#00B140] font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <p className="mt-0.5 text-slate-800">Open OPay app on your phone</p>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#00B140] font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <p className="mt-0.5 text-slate-800">Go to Transfer</p>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3 items-start border-l-2 border-slate-100 pl-4 py-1">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#00B140] font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                    <p className="mt-0.5 text-slate-500">Enter this account number</p>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span id="opay-account-number" className="font-mono text-sm font-black text-slate-900 tracking-wider">
                      {freelancerAccount}
                    </span>
                    <CopyButton text={freelancerAccount} highlightTargetId="opay-account-number" />
                  </div>
                  <div className="text-[10px] text-slate-400 pl-7">
                    Bank Name: <span className="font-bold">{freelancerBank}</span> | Account Name: <span className="font-bold">{freelancerName}</span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3 items-start border-l-2 border-slate-100 pl-4 py-1">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#00B140] font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                    <p className="mt-0.5 text-slate-500">Enter amount</p>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span id="opay-amount" className="font-mono text-base font-bold text-[#00B140]">
                      ₦{formattedAmount}
                    </span>
                    <CopyButton text={invoiceAmount.toString()} highlightTargetId="opay-amount" />
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-3 items-start">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-[#00B140] font-bold flex items-center justify-center shrink-0 text-[10px]">5</span>
                <p className="mt-0.5 text-slate-800">Upload your receipt below once payment is done</p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                I have opened the app <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
