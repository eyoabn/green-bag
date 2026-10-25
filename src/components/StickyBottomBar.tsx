"use client";

import { ReactNode } from "react";

interface StickyBottomBarProps {
  children: ReactNode;
  className?: string;
}

export function StickyBottomBar({ children, className = "" }: StickyBottomBarProps) {
  return (
    <div 
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200 px-4 py-3 pb-[max(env(safe-area-inset-bottom),14px)] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] ${className}`}
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {children}
      </div>
    </div>
  );
}

export default StickyBottomBar;
