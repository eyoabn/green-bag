"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { User, ShoppingBag, BookOpen, LogOut, Menu, X, ArrowLeft, Sparkles, Layers, ShieldCheck, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getCurrentUser, setLocalUser, AppUser } from "@/utils/auth";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get("tab") || "orders";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const updateUser = () => {
      getCurrentUser().then((u) => {
        setUser(u);
      });
    };
    updateUser();
    window.addEventListener("arenguade_auth_change", updateUser);
    return () => window.removeEventListener("arenguade_auth_change", updateUser);
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    setLocalUser(null);
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard?tab=orders", tabId: "orders", label: "My Orders & Receipts", icon: ShoppingBag },
    { href: "/dashboard?tab=classes", tabId: "classes", label: "My Academy Workshops", icon: BookOpen },
    { href: "/dashboard?tab=designs", tabId: "designs", label: "Custom 3D Designs", icon: Sparkles },
  ];

  const userName = user?.full_name || "Valued User";
  const roleLabel =
    user?.role === "admin"
      ? "Plant Administrator"
      : user?.role === "student"
      ? "Craft Academy Student"
      : "Packaging Buyer";

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F9F6F0] pt-20">
      
      {/* Mobile Top App Bar */}
      <div className="md:hidden bg-white px-6 py-3 border-b border-stone-200 flex items-center justify-between sticky top-20 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-xs ${
            user?.role === "admin" ? "bg-red-900 text-white" : user?.role === "student" ? "bg-[#8C4B31] text-white" : "bg-[#1E3B2E] text-[#E0B382]"
          }`}>
            {userName.charAt(0)}
          </div>
          <div>
            <p className="text-xs font-bold text-stone-900">{userName}</p>
            <p className="text-[10px] text-stone-500">{roleLabel}</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 cursor-pointer"
          aria-label="Toggle Portal Menu"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Sidebar (Desktop Fixed + Mobile Collapsible Drawer) */}
      <aside className={`
        fixed md:fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 flex flex-col pt-20 transition-transform duration-300
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* User Card */}
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-serif font-bold text-lg shadow-sm ${
              user?.role === "admin" ? "bg-red-900 text-white" : user?.role === "student" ? "bg-[#8C4B31] text-white" : "bg-[#1E3B2E] text-[#E0B382]"
            }`}>
              {userName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-stone-900 text-sm truncate">{userName}</p>
              <p className="text-[11px] text-[#8C4B31] font-semibold">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Administrator Quick Switch Banner */}
        {user?.role === "admin" && (
          <div className="px-4 pt-3 pb-1">
            <Link
              href="/admin"
              className="p-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-[11px] font-bold flex items-center justify-between hover:bg-red-100 transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-red-700" />
                <span>Admin Console</span>
              </div>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}
        
        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 text-xs">
          {navItems.map((item) => {
            const isActive = pathname === "/dashboard" && currentTab === item.tabId;
            const Icon = item.icon;
            return (
              <Link 
                key={item.tabId} 
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                  isActive 
                    ? "bg-[#1E3B2E] text-white shadow-sm" 
                    : "text-stone-700 hover:bg-stone-100 hover:text-stone-950"
                }`}
              >
                <Icon size={16} className={isActive ? "text-[#E0B382]" : "text-stone-500"} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-stone-100 mt-4 space-y-1.5">
            <Link 
              href="/products" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 font-medium"
            >
              <ShoppingBag size={15} />
              <span>Browse Catalog</span>
            </Link>
            <Link 
              href="/design-submission" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 font-medium"
            >
              <Layers size={15} />
              <span>Design Bag Studio</span>
            </Link>
          </div>
        </nav>
        
        {/* Bottom Actions */}
        <div className="p-4 border-t border-stone-200 mt-auto space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Public Site</span>
          </Link>

          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-4 py-2.5 w-full rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay Backdrop for Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-xs" 
        />
      )}

      {/* Main Content Stage */}
      <main className="flex-1 md:ml-64 p-6 sm:p-8">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F6F0] pt-20 p-8">Loading Portal...</div>}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
