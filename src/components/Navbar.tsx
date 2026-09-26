"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShoppingBag, 
  Sparkles, 
  BookOpen, 
  Menu, 
  X, 
  ArrowRight, 
  User, 
  Award,
  ShieldCheck
} from "lucide-react";
import { getCurrentUser, AppUser } from "@/utils/auth";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currency, setCurrency] = useState<"ETB" | "USD">("ETB");
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const updateUser = () => {
      getCurrentUser().then((u) => setUser(u));
    };
    updateUser();
    window.addEventListener("arenguade_auth_change", updateUser);
    return () => window.removeEventListener("arenguade_auth_change", updateUser);
  }, [pathname]);

  // Hide on admin and dashboard internal pages to prevent double navigation
  const isAdminOrDashboard = pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard");

  if (isAdminOrDashboard) {
    return null;
  }

  const navLinks = [
    { href: "/products", label: "Catalog", icon: ShoppingBag },
    { href: "/portfolio", label: "Client Works", icon: Award },
    { href: "/design-submission", label: "Design Studio", icon: Sparkles },
    { href: "/learn", label: "Craft Academy", icon: BookOpen },
    { href: "/learn/schedule", label: "Workshops", badge: "LiveKit" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 pt-4 transition-all">
      <div className="max-w-7xl mx-auto">
        <nav className="bg-[#FAF7F2]/90 backdrop-blur-xl border border-stone-300/60 shadow-lg shadow-stone-900/5 rounded-full px-6 py-3.5 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#1E3B2E] flex items-center justify-center text-[#E0B382] shadow-sm group-hover:bg-[#8C4B31] transition-colors">
              <span className="font-serif font-black text-lg">አ</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-[#1E3B2E] group-hover:text-[#8C4B31] transition-colors leading-none">
                Arenguade
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-stone-500 uppercase mt-0.5">
                Eco Paper • Addis Ababa
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 bg-stone-200/40 p-1 rounded-full border border-stone-300/40">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#1E3B2E] text-white shadow-sm"
                      : "text-stone-700 hover:text-stone-950 hover:bg-white/70"
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="bg-[#8C4B31] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full tracking-wider">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Currency Switcher */}
            <button
              onClick={() => setCurrency(currency === "ETB" ? "USD" : "ETB")}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-200/60 hover:bg-stone-300/70 text-stone-700 border border-stone-300/40 transition-all flex items-center gap-1"
              title="Toggle ETB / USD currency display"
            >
              <span className="text-[10px] text-stone-500">Cur:</span>
              <span className="font-bold text-[#1E3B2E]">{currency}</span>
            </button>

            {/* Role-Based Account Link */}
            {user ? (
              user.role === "student" ? (
                <Link
                  href="/dashboard?tab=classes"
                  className="text-xs font-semibold text-amber-950 px-3.5 py-1.5 rounded-full bg-amber-100/70 hover:bg-amber-200 transition-colors flex items-center gap-1.5 border border-amber-200"
                >
                  <BookOpen size={13} className="text-[#8C4B31]" />
                  <span>My Academy</span>
                </Link>
              ) : (
                <Link
                  href="/dashboard?tab=orders"
                  className="text-xs font-semibold text-stone-800 hover:text-[#1E3B2E] px-3.5 py-1.5 rounded-full bg-stone-200/60 hover:bg-stone-200 transition-colors flex items-center gap-1.5 border border-stone-300/50"
                >
                  <ShoppingBag size={13} className="text-[#1E3B2E]" />
                  <span>My Orders</span>
                </Link>
              )
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold text-stone-700 hover:text-[#1E3B2E] px-3 py-1.5 rounded-full hover:bg-stone-200/40 transition-colors"
              >
                Log In
              </Link>
            )}

            {/* Primary CTA */}
            <Link
              href="/products"
              className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 group"
            >
              <span>Order Bags</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-stone-700 hover:bg-stone-200/60 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 bg-[#FAF7F2] border border-stone-300 shadow-xl rounded-3xl p-5 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-1 pb-3 border-b border-stone-200">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-800 hover:bg-stone-100 flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="bg-[#8C4B31] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              {user ? (
                user.role === "student" ? (
                  <Link
                    href="/dashboard?tab=classes"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold text-amber-950 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 flex items-center gap-1.5"
                  >
                    <BookOpen size={13} className="text-[#8C4B31]" />
                    <span>My Workshops ({user.full_name.split(" ")[0]})</span>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard?tab=orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold text-[#1E3B2E] px-4 py-2 rounded-xl bg-stone-200/60 hover:bg-stone-200 flex items-center gap-1.5"
                  >
                    <ShoppingBag size={13} className="text-[#1E3B2E]" />
                    <span>My Orders ({user.full_name.split(" ")[0]})</span>
                  </Link>
                )
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold text-stone-800 px-4 py-2 rounded-xl bg-stone-200/60 hover:bg-stone-200"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold text-[#8C4B31] px-4 py-2 rounded-xl bg-[#8C4B31]/10 hover:bg-[#8C4B31]/20"
                  >
                    Register
                  </Link>
                </div>
              )}

              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#1E3B2E] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Order Bags
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
