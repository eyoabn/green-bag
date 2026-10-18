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
  Award,
  User,
  LogOut,
  ChevronDown
} from "lucide-react";
import { getCurrentUser, setLocalUser, AppUser } from "@/utils/auth";
import { useCurrency } from "@/components/CurrencyContext";
import { useCart } from "@/context/CartContext";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
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
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full font-bold bg-[#1E3B2E]/10 text-[#1E3B2E]">
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

          {/* Mobile Cart & Hamburger Buttons */}
          <div className="flex lg:hidden items-center gap-2">
            {user && <NotificationBell />}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-full text-stone-700 hover:bg-stone-200/60 transition-colors"
              aria-label="View Cart"
            >
              <ShoppingBag size={19} className="text-[#1E3B2E]" />
              {totalItems > 0 && (
                <span className="absolute 0 top-0 right-0 bg-[#8C4B31] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

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

            {user ? (
              <div className="flex flex-col gap-2 pt-1 border-b border-stone-200 pb-3">
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
                className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-4 py-2.5 rounded-xl block text-center transition-colors"
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
