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
  ShieldAlert,
  ShieldCheck,
  Package,
  Lock,
  ArrowRight
} from "lucide-react";
import { getCurrentUser, setLocalUser, AppUser } from "@/utils/auth";
import { createClient } from "@/utils/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Real RBAC State
  const [isVerifying, setIsVerifying] = useState(true);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    verifyAdminRole();
    const handleAuthChange = () => verifyAdminRole();
    window.addEventListener("arenguade_auth_change", handleAuthChange);
    return () => window.removeEventListener("arenguade_auth_change", handleAuthChange);
  }, []);

  const verifyAdminRole = async () => {
    setIsVerifying(true);
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);

      if (!user) {
        // Not signed in: redirect to login
        router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
        return;
      }
    } catch (err) {
      console.warn("RBAC verification check exception:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    setLocalUser(null);
    router.push("/login");
  };

  // 1. Loading State
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#1E3B2E] flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 rounded-2xl bg-[#E0B382]/20 border border-[#E0B382]/40 flex items-center justify-center mb-4 animate-spin">
          <ShieldCheck className="text-[#E0B382]" size={24} />
        </div>
        <p className="font-serif text-lg font-bold tracking-wide text-[#E0B382]">Verifying Administrator Clearance...</p>
        <span className="text-xs text-stone-400 mt-1">Validating database role and permissions</span>
      </div>
    );
  }

  // 2. Unauthenticated: Waiting for redirect
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] flex flex-col items-center justify-center p-6">
        <p className="text-sm font-semibold text-stone-600">Redirecting to login portal...</p>
      </div>
    );
  }

  // 3. Strict 403 Access Denied: User is signed in, but their real role is NOT admin
  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-950/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#8C4B31]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10 text-center">
          
          <div className="w-16 h-16 rounded-2xl bg-red-950 border border-red-800/80 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/40">
            <ShieldAlert className="text-red-400" size={32} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-red-300 text-[11px] font-bold uppercase tracking-wider mb-3">
            <span>403 — Access Restricted</span>
          </div>

          <h1 className="font-serif text-2xl font-bold text-white tracking-tight mb-2">
            Executive Clearance Required
          </h1>

          <p className="text-xs text-stone-400 leading-relaxed mb-6">
            You are currently signed in as <strong className="text-white">{currentUser.full_name}</strong> with the account role{" "}
            <span className="inline-block px-2 py-0.5 rounded bg-stone-800 text-stone-200 uppercase font-bold text-[10px]">
              {currentUser.role === "student" ? "Academy Student" : "Packaging Buyer"}
            </span>.
            Access to manufacturing queues, user accounts, and factory controls is restricted to verified Plant Administrators.
          </p>

          <div className="space-y-3">
            <Link
              href={currentUser.role === "student" ? "/dashboard?tab=classes" : "/dashboard?tab=orders"}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#1E3B2E] hover:bg-[#8C4B31] text-[#E0B382] hover:text-white font-bold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>Go to My {currentUser.role === "student" ? "Student Academy" : "Customer Portal"}</span>
              <ArrowRight size={15} />
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full py-3 px-4 rounded-2xl border border-stone-800 hover:bg-stone-800/80 text-stone-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Sign Out & Switch Account
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-800/80">
            <Link 
              href="/" 
              className="text-xs text-stone-500 hover:text-stone-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Return to Public Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authenticated Admin Console Layout
  const navLinks = [
    { href: "/admin", label: "Dashboard Overview", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders & Verification", icon: ShoppingBag },
    { href: "/admin/products", label: "Product Catalog", icon: Package },
    { href: "/admin/classes", label: "Classrooms & Workshops", icon: Users },
    { href: "/admin/users", label: "Users & Accounts", icon: Users },
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
            <span className="text-[10px] text-stone-500">{currentUser.full_name}</span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-stone-700 bg-stone-100 hover:bg-stone-200 cursor-pointer"
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
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-[#8C4B31] uppercase tracking-wider">
                  Executive Suite
                </span>
              </div>
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
          <div className="px-3 py-2 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] text-stone-400 font-medium">Logged in as</span>
              <span className="text-xs font-bold text-stone-800 truncate max-w-[130px]">{currentUser.full_name}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[9px] font-bold uppercase tracking-wider">
              Admin
            </span>
          </div>

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
            <span>Sign Out of Console</span>
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
