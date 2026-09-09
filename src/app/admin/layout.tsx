"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  PenTool, 
  CreditCard, 
  LogOut,
  Menu,
  X,
  ArrowLeft,
  ShieldCheck,
  Package
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState("Factory Admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("arenguade_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.full_name) setAdminName(parsed.full_name);
        } catch {}
      }
    }
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("arenguade_user");
    }
    router.push("/login");
  };

  const navLinks = [
    { href: "/admin", label: "Dashboard Overview", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders & Verification", icon: ShoppingBag },
    { href: "/admin/products", label: "Product Catalog", icon: Package },
    { href: "/admin/classes", label: "Classrooms & Workshops", icon: Users },
    { href: "/admin/designs", label: "Design Submissions", icon: PenTool },
    { href: "/admin/bank-accounts", label: "Banking & Settlement", icon: CreditCard },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F9F6F0]">
      
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white px-6 py-4 border-b border-stone-200 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1E3B2E] text-[#E0B382] flex items-center justify-center font-serif font-black text-sm">
            አ
          </div>
          <div>
            <span className="font-serif font-bold text-stone-900 text-sm block leading-tight">Arenguade Admin</span>
            <span className="text-[10px] text-stone-500">{adminName}</span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200"
          aria-label="Toggle Admin Navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar: Fixed on Desktop, Slide-over on Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-200 flex flex-col transition-transform duration-300
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E3B2E] text-[#E0B382] flex items-center justify-center font-serif font-bold text-lg shadow-sm">
              አ
            </div>
            <div>
              <div className="font-serif text-lg font-bold tracking-tight text-[#1E3B2E] leading-none">
                Arenguade
              </div>
              <span className="text-[10px] font-bold text-[#8C4B31] uppercase tracking-wider block mt-0.5">
                Executive Command
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation Links with Active Highlighting */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 text-xs overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                  isActive 
                    ? "bg-[#1E3B2E] text-white shadow-sm" 
                    : "text-stone-700 hover:bg-stone-100 hover:text-stone-950"
                }`}
              >
                <Icon size={17} className={isActive ? "text-[#E0B382]" : "text-stone-500"} />
                <span>{link.label}</span>
              </Link>
            );
          })}
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

      {/* Main Admin Content Stage */}
      <main className="flex-1 md:ml-64 p-6 sm:p-8">
        {children}
      </main>
    </div>
  );
}
