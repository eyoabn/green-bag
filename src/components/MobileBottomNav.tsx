"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Package, 
  BookOpen, 
  Bell, 
  User, 
  Video, 
  Calendar, 
  LayoutDashboard, 
  CreditCard, 
  ShoppingBag, 
  ShieldCheck 
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  exact?: boolean;
}

interface MobileBottomNavProps {
  role?: "customer" | "student" | "teacher" | "admin";
}

export function MobileBottomNav({ role = "customer" }: MobileBottomNavProps) {
  const pathname = usePathname();

  let items: NavItem[] = [];

  if (role === "admin") {
    items = [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/orders", label: "Orders", icon: Package },
      { href: "/admin/products", label: "Products", icon: ShoppingBag },
      { href: "/admin/audit", label: "Audit", icon: ShieldCheck },
    ];
  } else if (role === "teacher") {
    items = [
      { href: "/teacher", label: "Classes", icon: Video, exact: true },
      { href: "/learn/schedule", label: "Schedule", icon: Calendar },
      { href: "/dashboard/notifications", label: "Alerts", icon: Bell },
      { href: "/profile", label: "Profile", icon: User },
    ];
  } else {
    // Customer / Student
    items = [
      { href: "/dashboard", label: "Home", icon: Home, exact: true },
      { href: "/dashboard?tab=orders", label: "Orders", icon: Package },
      { href: "/dashboard?tab=classes", label: "Classes", icon: BookOpen },
      { href: "/dashboard/notifications", label: "Alerts", icon: Bell },
      { href: "/profile", label: "Profile", icon: User },
    ];
  }

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);

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
  );
}
