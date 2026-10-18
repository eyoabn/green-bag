"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F9F6F0] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-red-200 shadow-xl space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mx-auto border border-red-100">
          <AlertTriangle size={36} />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-red-800">
            System Alert
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Operation Interrupted
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            An unexpected error occurred while processing your manufacturing request. Your session data has been safeguarded.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return Home</span>
          </Link>
        </div>
      </div>

      <p className="text-[11px] text-stone-400 mt-6 font-mono">
        Error Digest: {error.digest || "ERR_APPLICATION_RUNTIME"}
      </p>
    </div>
  );
}
