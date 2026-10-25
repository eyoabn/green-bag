"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  ShoppingBag, 
  Sparkles, 
  BookOpen, 
  User
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PublicMobileNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  // Hide on internal portals and pages with their own sticky action bars
  const shouldHide = 
    !pathname ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname === "/design-submission" ||
    (pathname.startsWith("/products/") && pathname !== "/products");

  if (shouldHide) {
    return null;
  }

  const isHome = pathname === "/";
  const isProducts = pathname === "/products" || pathname.startsWith("/portfolio");
  const isAcademy = pathname.startsWith("/learn");
  const isPortal = pathname.startsWith("/dashboard") || pathname === "/profile" || pathname === "/login";

  return (
    <nav 
      aria-label="Public Mobile Navigation"
      className="md:hidden fixed bottom-3 left-3 right-3 z-30 max-w-lg mx-auto"
    >
      <div className="bg-[#FAF7F2]/95 backdrop-blur-xl border border-stone-300/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full px-2 py-1.5 flex items-center justify-around">
        
        {/* Home */}
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all touch-target active:scale-95 ${
            isHome 
              ? "text-[#1E3B2E] font-bold" 
              : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <div className={`p-1 rounded-full transition-transform ${isHome ? "bg-[#1E3B2E]/10" : ""}`}>
            <Home size={19} className={isHome ? "stroke-[2.5]" : "stroke-2"} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {lang === "am" ? "መነሻ" : "Home"}
          </span>
        </Link>

        {/* Catalog / Portfolio */}
        <Link
          href="/products"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all touch-target active:scale-95 ${
            isProducts 
              ? "text-[#1E3B2E] font-bold" 
              : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <div className={`p-1 rounded-full transition-transform ${isProducts ? "bg-[#1E3B2E]/10" : ""}`}>
            <ShoppingBag size={19} className={isProducts ? "stroke-[2.5]" : "stroke-2"} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {lang === "am" ? "ስብስቦች" : "Bags"}
          </span>
        </Link>

        {/* 3D Custom Studio (Elevated Center Button) */}
        <Link
          href="/design-submission"
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-full touch-target active:scale-95 transition-all"
        >
          <div className="w-10 h-10 -mt-3 rounded-full bg-gradient-to-tr from-[#1E3B2E] to-[#8C4B31] text-[#E0B382] flex items-center justify-center shadow-md shadow-[#8C4B31]/20 border-2 border-[#FAF7F2]">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <span className="text-[10px] font-bold tracking-tight text-[#8C4B31] mt-0.5">
            {lang === "am" ? "ዲዛይን" : "3D Studio"}
          </span>
        </Link>

        {/* Academy */}
        <Link
          href="/learn/schedule"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all touch-target active:scale-95 ${
            isAcademy 
              ? "text-[#1E3B2E] font-bold" 
              : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <div className={`p-1 rounded-full transition-transform ${isAcademy ? "bg-[#1E3B2E]/10" : ""}`}>
            <BookOpen size={19} className={isAcademy ? "stroke-[2.5]" : "stroke-2"} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {lang === "am" ? "ስልጠና" : "Academy"}
          </span>
        </Link>

        {/* Portal / Account */}
        <Link
          href="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all touch-target active:scale-95 ${
            isPortal 
              ? "text-[#1E3B2E] font-bold" 
              : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <div className={`p-1 rounded-full transition-transform ${isPortal ? "bg-[#1E3B2E]/10" : ""}`}>
            <User size={19} className={isPortal ? "stroke-[2.5]" : "stroke-2"} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">
            {lang === "am" ? "መለያ" : "Portal"}
          </span>
        </Link>

      </div>
    </nav>
  );
}
