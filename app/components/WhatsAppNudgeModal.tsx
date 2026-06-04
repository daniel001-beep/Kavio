"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface WhatsAppNudgePayload {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientPhone: string;
  amount: number;
  templateType: string;
  messageText: string;
}

interface WhatsAppNudgeModalProps {
  payload: WhatsAppNudgePayload | null;
  onClose: () => void;
  onConfirm: (phone: string, payload: WhatsAppNudgePayload) => void;
}

const TEMPLATE_LABELS: Record<string, string> = {
  DUE_TOMORROW: "Due Tomorrow",
  DUE_TODAY: "Due Today",
  OVERDUE_3D: "3 Days Overdue",
  OVERDUE_7D: "Past Due Follow-up",
};

export default function WhatsAppNudgeModal({
  payload,
  onClose,
  onConfirm,
}: WhatsAppNudgeModalProps) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-fill with client phone when modal opens
  useEffect(() => {
    if (payload) {
      setPhone(payload.clientPhone || "+234");
      setError("");
      // Focus input after mount
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [payload]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!payload) return null;

  const handleSend = () => {
    const cleaned = phone.trim();
    if (!cleaned) {
      setError("Please enter a WhatsApp number to continue.");
      return;
    }
    // Basic validation: must contain digits
    if (!/^\+?[0-9\s\-()]{7,20}$/.test(cleaned)) {
      setError("Please enter a valid phone number (e.g. +2348012345678).");
      return;
    }
    setError("");
    onConfirm(cleaned, payload);
    onClose();
  };

  const templateLabel = TEMPLATE_LABELS[payload.templateType] || payload.templateType;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nudge-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 id="nudge-modal-title" className="text-white font-black text-base tracking-tight">
                  WhatsApp Nudge
                </h2>
                <p className="text-emerald-100/80 text-[11px] font-semibold mt-0.5">
                  {templateLabel} · {payload.invoiceNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">

            {/* Client Info Row */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-xs shrink-0">
                {payload.clientName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-xs truncate">{payload.clientName}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  NGN {payload.amount.toLocaleString()} · {templateLabel}
                </p>
              </div>
              <div className="shrink-0">
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 uppercase tracking-wider">
                  Active Nudge
                </span>
              </div>
            </div>

            {/* Message Preview */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Message Preview
              </span>
              <div className="bg-[#121b22] rounded-2xl rounded-tl-none p-4 text-[#e9edef] text-[11px] leading-relaxed max-h-28 overflow-y-auto font-sans">
                {payload.messageText}
              </div>
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <label
                htmlFor="nudge-phone-input"
                className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block"
              >
                WhatsApp Number for {payload.clientName} *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="nudge-phone-input"
                  ref={inputRef}
                  type="tel"
                  placeholder="+2348012345678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  className="pl-10 py-5 rounded-xl border-slate-200/50 focus-visible:ring-emerald-500 text-xs font-mono font-bold"
                />
              </div>
              {error && (
                <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Include your country code. This opens WhatsApp Web with the message pre-filled. Kavio does not store or send this number automatically.
              </p>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 py-5 rounded-xl text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              className="flex-1 py-5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-450 hover:to-emerald-550 text-white border-none shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Open WhatsApp
            </Button>
          </div>

        </div>
      </div>
    </>
  );
}
