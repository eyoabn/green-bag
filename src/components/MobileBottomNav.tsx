"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Package, 
  BookOpen, 
  User, 
  Calendar, 
  LayoutDashboard, 
  CreditCard, 
  ShoppingBag, 
  MoreHorizontal,
  PenTool,
  Users,
  History,
  Settings,
  X,
  GraduationCap
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
  isMore?: boolean;
}

interface MobileBottomNavProps {
  role?: "customer" | "student" | "teacher" | "admin";
}

export function MobileBottomNav({ role = "customer" }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  let items: NavItem[] = [];

  if (role === "admin") {
    items = [
      { href: "/admin", label: "Home", icon: LayoutDashboard, exact: true },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/orders", label: "Orders", icon: Package },
      { href: "/admin/classes", label: "Classes", icon: GraduationCap },
      { href: "#more", label: "More", icon: MoreHorizontal, isMore: true },
    ];
  } else if (role === "teacher") {
    items = [
      { href: "/teacher", label: "Today", icon: Calendar, exact: true },
      { href: "/teacher#classes", label: "My Classes", icon: BookOpen },
      { href: "/profile", label: "Account", icon: User },
    ];
  } else {
    // Customer
    items = [
      { href: "/dashboard", label: "Home", icon: Home, exact: true },
      { href: "/products", label: "Shop", icon: ShoppingBag },
      { href: "/learn/schedule", label: "Classes", icon: BookOpen },
      { href: "/dashboard?tab=orders", label: "Orders", icon: Package },
      { href: "/profile", label: "Account", icon: User },
    ];
  }

  const moreLinks = [
    { href: "/admin/products", label: "Product Catalog", icon: ShoppingBag },
    { href: "/admin/designs", label: "Custom Designs", icon: PenTool },
    { href: "/admin/users", label: "Users & Staff", icon: Users },
    { href: "/admin/bank-accounts", label: "Bank Accounts", icon: CreditCard },
    { href: "/admin/audit", label: "Audit Log", icon: History },
    { href: "/admin/settings", label: "Factory Settings", icon: Settings },
  ];

  return (
    <>
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-lg px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = !item.isMore && (item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href));

            if (item.isMore) {
              return (
                <button
                  key="more"
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className={`flex-1 flex flex-col items-center justify-center py-1.5 touch-target transition-colors ${
                    moreOpen ? "text-[#1E3B2E]" : "text-stone-400 hover:text-stone-700"
                  }`}
                >
                  <div className={`p-1 rounded-full ${moreOpen ? "scale-110" : ""}`}>
                    <Icon size={20} className={moreOpen ? "stroke-[2.5]" : "stroke-2"} />
                  </div>
                  <span className={`text-[10px] tracking-tight mt-0.5 ${moreOpen ? "font-bold" : "font-medium"}`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 touch-target transition-colors ${
                  isActive 
                    ? "text-[#1E3B2E]" 
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                <div className={`p-1 rounded-full transition-transform ${isActive ? "scale-110" : ""}`}>
                  <Icon size={20} className={isActive ? "stroke-[2.5]" : "stroke-2"} />
                </div>
                <span className={`text-[10px] tracking-tight mt-0.5 ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Admin More Bottom Sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div 
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 bg-black/60 transition-opacity"
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl border-t border-stone-200 p-6 z-10 animate-in slide-in-from-bottom duration-200 pb-[max(env(safe-area-inset-bottom),24px)]">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
              <span className="font-serif text-lg font-bold text-stone-900">
                Factory Administration
              </span>
              <button 
                onClick={() => setMoreOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 touch-target flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {moreLinks.map((link) => {
                const Icon = link.icon;
                const isSelected = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={`p-3.5 rounded-2xl border flex flex-col items-start gap-2 transition-colors ${
                      isSelected
                        ? "bg-[#1E3B2E]/10 border-[#1E3B2E] text-[#1E3B2E]"
                        : "bg-[#FAF7F2] border-stone-200 text-stone-800 hover:bg-stone-100"
                    }`}
                  >
                    <Icon size={18} className={isSelected ? "text-[#1E3B2E]" : "text-[#8C4B31]"} />
                    <span className="text-xs font-bold leading-tight">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
