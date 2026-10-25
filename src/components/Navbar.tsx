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
  LogOut,
  ChevronDown,
  Languages,
  Award,
  Phone,
  Calendar
} from "lucide-react";
import { getCurrentUser, setLocalUser, AppUser } from "@/utils/auth";
import { useCart } from "@/context/CartContext";
import NotificationBell from "@/components/NotificationBell";
import { useLanguage } from "@/context/LanguageContext";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { t, toggleLang, lang } = useLanguage();
  const { setIsCartOpen, totalItems } = useCart();
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const updateUser = () => {
      getCurrentUser().then((u) => setUser(u));
    };
    updateUser();
    window.addEventListener("arenguade_auth_change", updateUser);
    return () => window.removeEventListener("arenguade_auth_change", updateUser);
  }, [pathname]);

  // Hide on admin, teacher, and dashboard internal pages to prevent double navigation
  const isInternalPortal = pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard") || pathname?.startsWith("/teacher");

  if (isInternalPortal) {
    return null;
  }

  interface NavLinkItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }

  const navLinks: NavLinkItem[] = [
    { href: "/products", label: t.nav_portfolio, icon: ShoppingBag },
    { href: "/design-submission", label: t.nav_design_studio, icon: Sparkles },
    { href: "/learn", label: t.nav_academy, icon: BookOpen },
    { href: "/learn/schedule", label: t.nav_workshops, icon: Calendar, badge: "LiveKit" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-8 pt-3 sm:pt-4 transition-all">
      <div className="max-w-7xl mx-auto">
        <nav className="bg-[#FAF7F2]/95 backdrop-blur-xl border border-stone-300/60 shadow-lg shadow-stone-900/5 rounded-full px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1E3B2E] flex items-center justify-center text-[#E0B382] shadow-sm group-hover:bg-[#8C4B31] transition-colors shrink-0">
              <span className="font-serif font-black text-base sm:text-lg">አ</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1E3B2E] group-hover:text-[#8C4B31] transition-colors leading-none">
                Arenguade
              </span>
              <span className="hidden xs:block text-[9px] sm:text-[10px] font-semibold tracking-wider text-stone-500 uppercase mt-0.5">
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
                    <span className="bg-[#8C4B31] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wider">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Action Controls */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Language Switcher: English / Amharic */}
            <button
              onClick={toggleLang}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-stone-200/60 hover:bg-stone-300/70 text-stone-700 border border-stone-300/40 transition-all flex items-center gap-1.5"
              title={lang === "en" ? "Switch to Amharic / አማርኛ" : "Switch to English"}
              aria-label="Toggle language"
            >
              <Languages size={13} className="text-[#1E3B2E]" />
              <span className="font-bold text-[#1E3B2E]">{lang === "en" ? "አማርኛ" : "English"}</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full bg-stone-200/60 hover:bg-stone-300/70 text-stone-700 border border-stone-300/40 transition-all flex items-center justify-center cursor-pointer"
              aria-label="View Cart"
              title="View Packaging Cart"
            >
              <ShoppingBag size={16} className="text-[#1E3B2E]" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#8C4B31] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            {/* Notification Bell for logged-in user */}
            {user && <NotificationBell />}

            {/* Role-Based Account & User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-stone-200/60 hover:bg-stone-200 border border-stone-300/50 text-xs font-semibold text-stone-800 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#1E3B2E] text-[#E0B382] flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      user.full_name?.charAt(0) || "U"
                    )}
                  </div>
                  <span className="max-w-[100px] truncate">{user.full_name}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold bg-[#1E3B2E]/10 text-[#1E3B2E]">
                    {user.role}
                  </span>
                  <ChevronDown size={13} className={`text-stone-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 text-xs flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-3 py-2 border-b border-stone-100 flex flex-col">
                      <span className="font-bold text-stone-900 truncate">{user.full_name}</span>
                      <span className="text-[10px] text-stone-400 truncate font-mono">{user.email}</span>
                      <span className="inline-block mt-1 text-[9px] uppercase font-bold text-stone-500">
                        Access: <span className="text-[#8C4B31]">{user.role}</span>
                      </span>
                    </div>

                    <Link
                      href={user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/dashboard"}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-[#FAF7F2] font-semibold transition-colors"
                    >
                      {user.role === "admin" ? (
                        <Award size={14} className="text-red-700" />
                      ) : user.role === "teacher" ? (
                        <BookOpen size={14} className="text-[#8C4B31]" />
                      ) : (
                        <ShoppingBag size={14} className="text-[#1E3B2E]" />
                      )}
                      <span>
                        {user.role === "admin" ? "Admin Panel" : user.role === "teacher" ? "Teacher Portal" : "My Dashboard"}
                      </span>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 hover:bg-[#FAF7F2] font-semibold transition-colors"
                    >
                      <User size={14} className="text-stone-500" />
                      <span>Edit Profile</span>
                    </Link>

                    <div className="border-t border-stone-100 my-0.5" />

                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await fetch("/api/auth/logout", { method: "POST" });
                        setLocalUser(null);
                        setUser(null);
                        window.location.href = "/login";
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition-colors w-full text-left cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-stone-700 hover:text-[#1E3B2E] px-3 py-1.5 rounded-full hover:bg-stone-200/40 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-semibold text-[#8C4B31] hover:text-[#8C4B31]/80 px-3 py-1.5 rounded-full bg-[#8C4B31]/10 hover:bg-[#8C4B31]/20 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
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

          {/* Mobile Right Controls: Language Toggle + Cart + Hamburger */}
          <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
            {/* Quick Language Toggle on Mobile Header */}
            <button
              onClick={toggleLang}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-stone-200/70 hover:bg-stone-300/80 text-[#1E3B2E] border border-stone-300/50 flex items-center gap-1 transition-colors cursor-pointer"
              title={lang === "en" ? "Switch to Amharic / አማርኛ" : "Switch to English"}
              aria-label="Toggle language"
            >
              <Languages size={13} className="text-[#1E3B2E]" />
              <span>{lang === "en" ? "አማ" : "EN"}</span>
            </button>

            {user && <NotificationBell />}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
              aria-label="View Cart"
            >
              <ShoppingBag size={19} className="text-[#1E3B2E]" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-[#8C4B31] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile Backdrop Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden relative z-50 mt-2 bg-[#FAF7F2] border border-stone-300/90 shadow-2xl rounded-3xl p-5 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
            
            {/* Quick Language Toggle inside Menu */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <span className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
                <Languages size={14} className="text-[#1E3B2E]" />
                <span>Language / ቋንቋ</span>
              </span>
              <button
                onClick={toggleLang}
                className="text-xs font-bold px-3 py-1 rounded-full bg-stone-200/80 hover:bg-stone-300 text-[#1E3B2E] border border-stone-300/60 flex items-center gap-1.5"
              >
                <span>{lang === "en" ? "አማርኛ (Amharic)" : "English"}</span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col gap-1 pb-3 border-b border-stone-200">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors ${
                      isActive 
                        ? "bg-[#1E3B2E] text-white shadow-xs" 
                        : "text-stone-800 hover:bg-stone-100"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {Icon && <Icon size={16} className={isActive ? "text-[#E0B382]" : "text-stone-500"} />}
                      <span>{link.label}</span>
                    </span>
                    {link.badge && (
                      <span className="bg-[#8C4B31] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Factory Hotline Click to Call */}
            <a 
              href="tel:+251911741618" 
              className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-400 text-xs text-stone-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1E3B2E]/10 flex items-center justify-center text-[#1E3B2E] shrink-0">
                  <Phone size={14} />
                </div>
                <div>
                  <span className="block font-bold text-stone-900 leading-tight">Addis Ababa Factory Desk</span>
                  <span className="text-[10px] text-stone-500">+251 911 741618 (Mon-Sat)</span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#8C4B31] bg-[#8C4B31]/10 px-2 py-0.5 rounded-full">Call</span>
            </a>

            {/* User Session Info or Login/Signup */}
            {user ? (
              <div className="flex flex-col gap-2 pt-1 border-t border-stone-200">
                <div className="px-2 py-1 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">{user.full_name}</span>
                    <span className="text-[10px] text-stone-500">{user.email}</span>
                  </div>
                  <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#1E3B2E] text-white">
                    {user.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Link
                    href={user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/dashboard"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold text-center py-2 px-3 rounded-xl bg-stone-200/60 hover:bg-stone-200 text-stone-800"
                  >
                    Portal Home
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-bold text-center py-2 px-3 rounded-xl bg-stone-200/60 hover:bg-stone-200 text-stone-800"
                  >
                    My Profile
                  </Link>
                </div>

                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await fetch("/api/auth/logout", { method: "POST" });
                    setLocalUser(null);
                    setUser(null);
                    window.location.href = "/login";
                  }}
                  className="text-xs font-bold text-red-600 py-2 px-3 rounded-xl hover:bg-red-50 text-left flex items-center gap-2 cursor-pointer mt-1"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold text-stone-800 px-4 py-2 rounded-xl bg-stone-200/60 hover:bg-stone-200 flex-1 text-center"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold text-[#8C4B31] px-4 py-2 rounded-xl bg-[#8C4B31]/10 hover:bg-[#8C4B31]/20 flex-1 text-center"
                >
                  Register
                </Link>
              </div>
            )}

            <div className="pt-1">
              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-4 py-2.5 rounded-xl block text-center transition-colors shadow-sm"
              >
                Order Custom Bags
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
