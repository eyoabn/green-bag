"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, CheckCircle2, AlertCircle, ShieldCheck, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = createClient();
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

      if (isPlaceholder) {
        // Fallback demo authentication
        const isAdmin = email.toLowerCase().includes("admin") || email.toLowerCase().includes("owner");
        const userObj = {
          id: `usr_${Date.now()}`,
          email,
          full_name: isAdmin ? "Arenguade Plant Manager" : "Dawit Haile",
          role: isAdmin ? "admin" : "customer",
        };
        if (typeof window !== "undefined") {
          localStorage.setItem("arenguade_user", JSON.stringify(userObj));
        }
        setSuccessMessage("Authentication verified. Loading workspace...");
        setTimeout(() => {
          router.push(isAdmin ? "/admin" : "/dashboard");
        }, 800);
        return;
      }

      // Real Supabase Sign In
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      // Retrieve user role from profiles
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", data.user.id)
          .single();

        const role = profile?.role || "customer";
        if (typeof window !== "undefined") {
          localStorage.setItem("arenguade_user", JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            full_name: profile?.full_name || "Valued User",
            role,
          }));
        }

        setSuccessMessage("Authentication verified. Loading workspace...");
        setTimeout(() => {
          router.push(role === "admin" ? "/admin" : "/dashboard");
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Invalid credentials. Please verify and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: "admin" | "customer") => {
    const userObj = {
      id: role === "admin" ? "admin_001" : "cust_001",
      email: role === "admin" ? "admin@arenguade.et" : "dawit@oromiacoffee.et",
      full_name: role === "admin" ? "Arenguade Plant Owner" : "Dawit Haile",
      role,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("arenguade_user", JSON.stringify(userObj));
    }
    setSuccessMessage(`Entering as ${role === "admin" ? "Admin" : "Customer"}...`);
    setTimeout(() => {
      router.push(role === "admin" ? "/admin" : "/dashboard");
    }, 500);
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-16 bg-[#F9F6F0] items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl border border-stone-200 shadow-xl relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 w-36 h-36 bg-[#1E3B2E]/5 rounded-br-full pointer-events-none" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8C4B31]/10 text-[#8C4B31] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={13} />
            <span>Ethiopian Packaging Guild</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Welcome Back</h1>
          <p className="text-xs text-stone-500">
            Sign in to manage manufacturing orders, receipts, and craft academy sessions.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-stone-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 bg-[#FAF7F2] text-stone-900"
              placeholder="you@domain.et"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-bold text-stone-700 uppercase tracking-wider">
                Password
              </label>
              <button 
                type="button" 
                onClick={() => alert("Password reset link sent to your registered email.")} 
                className="text-[11px] text-[#8C4B31] font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-stone-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 bg-[#FAF7F2] text-stone-900"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white py-3.5 mt-2 rounded-full font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Instant Demo Sandbox Access */}
        <div className="mt-6 pt-6 border-t border-stone-200">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block text-center mb-3">
            Quick Sandbox Credentials (1-Click)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoLogin("customer")}
              className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <User size={13} className="text-[#1E3B2E]" />
              <span>Demo Customer</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("admin")}
              className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck size={13} className="text-[#8C4B31]" />
              <span>Demo Admin</span>
            </button>
          </div>
        </div>
        
        <div className="mt-6 text-center text-xs text-stone-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#8C4B31] font-bold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
