"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, Image as ImageIcon, Trash2, Loader2, FileUp } from "lucide-react";

interface ReceiptUploadProps {
  onFileSelect: (file: File | null) => void;
  onVerify: () => void;
  isVerifying: boolean;
  selectedFile: File | null;
}

export default function ReceiptUpload({
  onFileSelect,
  onVerify,
  isVerifying,
  selectedFile
}: ReceiptUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-800">Confirm your payment</h4>
        <p className="text-xs text-slate-500 font-medium">
          Upload your bank transfer receipt and our AI will verify it instantly
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative cursor-pointer ${
          dragActive
            ? "border-emerald-500 bg-emerald-50/50"
            : "border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50"
        } ${selectedFile ? "border-emerald-200 bg-white" : ""}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isVerifying}
        />

        {selectedFile ? (
          <div className="flex items-center gap-4 text-left p-2" onClick={(e) => e.stopPropagation()}>
            {/* Thumbnail Preview or PDF File Icon */}
            <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="w-full h-full object-cover"
                />
              ) : selectedFile.type === "application/pdf" ? (
                <FileText className="w-8 h-8 text-rose-500" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-400" />
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {formatSize(selectedFile.size)} &middot; {selectedFile.type.split("/")[1].toUpperCase()}
              </p>
            </div>

            {/* Remove file button */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={isVerifying}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2.5 py-2">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 shadow-sm">
              <UploadCloud className="w-6 h-6 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">
                Drag & drop your transfer receipt, or <span className="text-emerald-600 hover:text-emerald-700">browse</span>
              </p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                PNG, JPG, WEBP, or PDF &middot; Max 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Verify Trigger Button */}
      <button
        type="button"
        disabled={isVerifying || !selectedFile}
        onClick={onVerify}
        className={`w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border-0 cursor-pointer shadow-md transition-all duration-150 ${
          isVerifying || !selectedFile
            ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            : "bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-[0.99] active:scale-[0.98] shadow-emerald-600/10"
        }`}
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            AI is verifying your receipt...
          </>
        ) : (
          <>
            <FileUp className="w-4 h-4" />
            Verify Payment with AI 🤖
          </>
        )}
      </button>
    </div>
  );
}
