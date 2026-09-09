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
  ShieldAlert,
  Package,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminName, setAdminName] = useState("Factory Executive");
  
  // Security Gate State
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"passcode" | "credentials">("passcode");
  const [authError, setAuthError] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    setIsChecking(true);
    try {
      // 1. Check direct session token
      if (typeof window !== "undefined") {
        const adminSession = sessionStorage.getItem("arenguade_admin_authenticated");
        if (adminSession === "true") {
          const stored = localStorage.getItem("arenguade_user");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.full_name) setAdminName(parsed.full_name);
            } catch {}
          }
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        }

        // 2. Check local user role
        const storedUser = localStorage.getItem("arenguade_user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed.role === "admin") {
              sessionStorage.setItem("arenguade_admin_authenticated", "true");
              if (parsed.full_name) setAdminName(parsed.full_name);
              setIsAuthenticated(true);
              setIsChecking(false);
              return;
            }
          } catch {}
        }
      }

      // 3. Check Supabase server session
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", data.user.id)
          .single();

        if (profile && profile.role === "admin") {
          sessionStorage.setItem("arenguade_admin_authenticated", "true");
          setAdminName(profile.full_name || "Factory Administrator");
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Admin verification check exception:", err);
    }
    
    setIsAuthenticated(false);
    setIsChecking(false);
  };

  const handlePasscodeUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthorizing(true);

    const cleanInput = passwordInput.trim();
    // Accept the project master keys
    const validPasscodes = ["2122Eyoab2122", "ArenguadeAdmin2026", "greenwork2026", "admin123"];

    setTimeout(() => {
      if (validPasscodes.includes(cleanInput)) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("arenguade_admin_authenticated", "true");
          const userObj = {
            id: "admin_super",
            email: "admin@arenguade.et",
            full_name: "Eyoab (Lead Administrator)",
            role: "admin"
          };
          localStorage.setItem("arenguade_user", JSON.stringify(userObj));
          setAdminName(userObj.full_name);
        }
        setIsAuthenticated(true);
        setPasswordInput("");
        setIsAuthorizing(false);
      } else {
        setAuthError("Incorrect Admin Security Password. Access Denied.");
        setIsAuthorizing(false);
      }
    }, 400);
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthorizing(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput,
      });

      if (error) {
        // Check if matching the admin master passcode directly
        if (["2122Eyoab2122", "ArenguadeAdmin2026"].includes(passwordInput.trim())) {
          sessionStorage.setItem("arenguade_admin_authenticated", "true");
          const userObj = {
            id: "admin_super",
            email: emailInput.trim() || "admin@arenguade.et",
            full_name: "Executive Administrator",
            role: "admin"
          };
          localStorage.setItem("arenguade_user", JSON.stringify(userObj));
          setAdminName(userObj.full_name);
          setIsAuthenticated(true);
          setIsAuthorizing(false);
          return;
        }
        setAuthError(error.message || "Failed to authenticate administrator.");
        setIsAuthorizing(false);
        return;
      }

      if (data?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", data.user.id)
          .single();

        if (profile && profile.role === "admin") {
          sessionStorage.setItem("arenguade_admin_authenticated", "true");
          localStorage.setItem("arenguade_user", JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            full_name: profile.full_name || "Administrator",
            role: "admin"
          }));
          setAdminName(profile.full_name || "Administrator");
          setIsAuthenticated(true);
        } else {
          setAuthError("Access Restricted: This account does not possess Factory Admin privileges.");
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || "An unexpected error occurred during admin authorization.");
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("arenguade_admin_authenticated");
      localStorage.removeItem("arenguade_user");
    }
    setIsAuthenticated(false);
    router.push("/login");
  };

  // --- LOADING SCREEN ---
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#1E3B2E] flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 rounded-2xl bg-[#E0B382]/20 border border-[#E0B382]/40 flex items-center justify-center mb-4 animate-spin">
          <ShieldCheck className="text-[#E0B382]" size={24} />
        </div>
        <p className="font-serif text-lg font-bold tracking-wide text-[#E0B382]">Verifying Executive Clearance...</p>
        <span className="text-xs text-stone-400 mt-1">Checking encryption tokens & admin role privileges</span>
      </div>
    );
  }

  // --- ACCESS RESTRICTED / SECURITY GATE SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#1E3B2E]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#8C4B31]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
          
          {/* Top Brand Lock Badge */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#1E3B2E] border border-[#E0B382]/40 flex items-center justify-center mb-3 shadow-lg shadow-black/40">
              <Lock className="text-[#E0B382]" size={28} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-red-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <ShieldAlert size={13} />
              <span>Restricted Command Zone</span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-white tracking-tight">
              Arenguade Executive Terminal
            </h1>
            <p className="text-xs text-stone-400 mt-1">
              Authentication required to access production queues, banking settlement, and catalog controls.
            </p>
          </div>

          {/* Toggle Login Mode */}
          <div className="flex bg-stone-950/80 p-1 rounded-2xl mb-6 border border-stone-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setLoginMethod("passcode"); setAuthError(""); }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                loginMethod === "passcode" 
                  ? "bg-[#1E3B2E] text-white shadow-sm" 
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Master Passcode
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod("credentials"); setAuthError(""); }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                loginMethod === "credentials" 
                  ? "bg-[#1E3B2E] text-white shadow-sm" 
                  : "text-stone-400 hover:text-white"
              }`}
            >
              Admin Email & Password
            </button>
          </div>

          {/* Form: Passcode Mode */}
          {loginMethod === "passcode" ? (
            <form onSubmit={handlePasscodeUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
                  Enter Admin Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter security key..."
                    required
                    autoFocus
                    className="w-full px-4 py-3.5 rounded-2xl bg-stone-950 border border-stone-700 text-white text-sm focus:outline-none focus:border-[#E0B382] transition-colors pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5">
                  Authorized for plant managers & executive administrators.
                </p>
              </div>

              {authError && (
                <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
                  <ShieldAlert size={16} className="text-red-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthorizing}
                className="w-full py-3.5 rounded-2xl bg-[#1E3B2E] hover:bg-[#8C4B31] text-[#E0B382] hover:text-white font-bold text-sm tracking-wide transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <KeyRound size={17} />
                <span>{isAuthorizing ? "Authorizing Key..." : "Unlock Command Suite"}</span>
              </button>
            </form>
          ) : (
            /* Form: Email & Password Mode */
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@arenguade.et"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-stone-950 border border-stone-700 text-white text-sm focus:outline-none focus:border-[#E0B382]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-stone-950 border border-stone-700 text-white text-sm focus:outline-none focus:border-[#E0B382] pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
                  <ShieldAlert size={16} className="text-red-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthorizing}
                className="w-full py-3.5 rounded-2xl bg-[#1E3B2E] hover:bg-[#8C4B31] text-[#E0B382] hover:text-white font-bold text-sm tracking-wide transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldCheck size={17} />
                <span>{isAuthorizing ? "Verifying Credentials..." : "Authenticate Admin"}</span>
              </button>
            </form>
          )}

          {/* Return to Public Site */}
          <div className="mt-6 pt-4 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-500">
            <Link 
              href="/" 
              className="hover:text-stone-300 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Public Store</span>
            </Link>
            <Link
              href="/login"
              className="text-[#E0B382] hover:underline"
            >
              Regular Customer Login &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED ADMIN LAYOUT ---
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
                  Live Terminal
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
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 font-medium">Logged in as</span>
              <span className="text-xs font-bold text-stone-800 truncate max-w-[130px]">{adminName}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase">
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
            <span>Lock Console & Sign Out</span>
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
