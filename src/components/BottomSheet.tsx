"use client";

import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
}: BottomSheetProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* Sheet / Modal Container */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "sheet-title" : undefined}
        className={`relative w-full ${maxWidth} max-w-full bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border-t md:border border-stone-200 max-h-[92vh] md:max-h-[85vh] flex flex-col z-10 transition-transform duration-200 animate-in slide-in-from-bottom md:zoom-in-95 overflow-hidden`}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 shrink-0">
            <div>
              {title && (
                <h2 id="sheet-title" className="font-serif text-lg font-bold text-stone-900">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-stone-500 mt-0.5">{description}</p>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 -mr-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 touch-target flex items-center justify-center transition-colors"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 px-4 sm:px-5 py-4 pb-[max(env(safe-area-inset-bottom),20px)] md:pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
