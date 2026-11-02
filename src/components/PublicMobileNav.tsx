"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  ShoppingBag, 
  Palette, 
  GraduationCap, 
  CircleUserRound 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function PublicMobileNav() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  // Hide on internal admin/teacher pages and checkout to prevent overlap
  const shouldHide = 
    !pathname ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname === "/checkout" ||
    (pathname.startsWith("/products/") && pathname !== "/products");

  if (shouldHide) {
    return null;
  }

  const isHome = pathname === "/";
  const isProducts = pathname === "/products" || pathname.startsWith("/portfolio");
  const isDesign = pathname === "/design-submission";
  const isAcademy = pathname.startsWith("/learn");
  const isPortal = pathname.startsWith("/dashboard") || pathname === "/profile" || pathname === "/login";

  return (
    <nav 
      aria-label="Primary navigation"
      className="bottom-nav md:hidden max-w-md mx-auto"
    >
      {/* 1. Home */}
      <Link
        href="/"
        className={`touch-target ${isHome ? "active" : ""}`}
      >
        <Home size={19} />
        <span>{lang === "am" ? "መነሻ" : "Home"}</span>
      </Link>

      {/* 2. Bags */}
      <Link
        href="/products"
        className={`touch-target ${isProducts ? "active" : ""}`}
      >
        <ShoppingBag size={19} />
        <span>{lang === "am" ? "ስብስቦች" : "Bags"}</span>
      </Link>

      {/* 3. Studio */}
      <Link
        href="/design-submission"
        className={`touch-target ${isDesign ? "active" : ""}`}
      >
        <Palette size={19} />
        <span>{lang === "am" ? "ስቱዲዮ" : "Studio"}</span>
      </Link>

      {/* 4. Academy */}
      <Link
        href="/learn/schedule"
        className={`touch-target ${isAcademy ? "active" : ""}`}
      >
        <GraduationCap size={19} />
        <span>{lang === "am" ? "አካዳሚ" : "Academy"}</span>
      </Link>

      {/* 5. Portal */}
      <Link
        href="/dashboard"
        className={`touch-target ${isPortal ? "active" : ""}`}
      >
        <CircleUserRound size={19} />
        <span>{lang === "am" ? "መለያ" : "Portal"}</span>
      </Link>
    </nav>
  );
}

