import React, { useState } from "react";
import { Copy, Check, AlertTriangle } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
  // Optional element ID to select/highlight if copy fails
  highlightTargetId?: string;
}

export default function CopyButton({ text, className = "", highlightTargetId }: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const handleCopy = async () => {
    if (typeof window === "undefined") return;

    const performHighlight = () => {
      if (highlightTargetId) {
        const element = document.getElementById(highlightTargetId);
        if (element) {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(element);
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          return;
        }
      }
      // Fallback: select text in a temp input if element wasn't found/specified
      const input = document.createElement("input");
      input.value = text;
      input.style.position = "absolute";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      input.setSelectionRange(0, 99999); // For mobile devices
      document.execCommand("copy");
      document.body.removeChild(input);
    };

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setStatus("failed");
      performHighlight();
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setStatus("failed");
      performHighlight();
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const getButtonText = () => {
    switch (status) {
      case "copied":
        return "Copied! ✓";
      case "failed":
        return "Unable to copy — please copy manually";
      default:
        return "Copy";
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-155 active:scale-95 shadow-sm cursor-pointer ${className} ${
        status === "copied" ? "border-emerald-250 bg-emerald-50 text-emerald-800" : ""
      } ${
        status === "failed" ? "border-rose-250 bg-rose-50 text-rose-800" : ""
      }`}
    >
      {status === "copied" ? (
        <Check className="w-3.5 h-3.5 text-emerald-600 animate-in fade-in zoom-in duration-200" />
      ) : status === "failed" ? (
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
      )}
      <span>{getButtonText()}</span>
    </button>
  );
}
