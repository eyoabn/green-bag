"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Sparkles, CheckCircle2, AlertCircle, ShieldCheck, UserCheck, BookOpen } from "lucide-react";
import { setLocalUser, AppUser } from "@/utils/auth";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("returnTo") || null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const completeLogin = (user: AppUser) => {
    setLocalUser(user);
    const isAdmin = user.role === "admin";
    const isStudent = user.role === "student";

    setSuccessMessage(`Authenticated as ${user.role.toUpperCase()} (${user.full_name}). Loading workspace...`);
    setTimeout(() => {
      if (returnTo) {
        router.push(returnTo);
      } else if (isAdmin) {
        router.push("/admin");
      } else if (isStudent) {
        router.push("/dashboard?tab=classes");
      } else {
        router.push("/dashboard?tab=orders");
      }
    }, 600);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const resJson = await res.json().catch(() => null);

      if (res.ok && resJson?.success && resJson?.user) {
        completeLogin(resJson.user);
        return;
      }

      if (resJson?.error) {
        setErrorMessage(String(resJson.error));
        setIsLoading(false);
        return;
      }

      throw new Error("Unable to authenticate with remote service.");
    } catch (networkErr: any) {
      setErrorMessage(networkErr?.message || "Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPassword: string = "password123") => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLoading(true);
    setErrorMessage("");

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: demoEmail, password: demoPassword }),
    })
      .then((r) => r.json())
      .then((resJson) => {
        if (resJson?.success && resJson?.user) {
          completeLogin(resJson.user);
        } else {
          setErrorMessage(resJson?.error || "Unable to log in with quick account.");
          setIsLoading(false);
        }
      })
      .catch((err) => {
        setErrorMessage(err?.message || "Quick login failed.");
        setIsLoading(false);
      });
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
            Sign in to access your role-specific dashboard and tools.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <div className="flex-1">
              <span className="block font-medium">{errorMessage}</span>
              {errorMessage.includes("No account found") && (
                <Link
                  href="/signup"
                  className="mt-1 text-[11px] underline font-bold text-red-900 hover:text-red-700 block"
                >
                  Create your account here &rarr;
                </Link>
              )}
            </div>
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
                onClick={() => alert("Password reset instructions have been logged to your account.")} 
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
              <span>Verifying Credentials...</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Real Demo Accounts for Easy Testing */}
        <div className="mt-6 pt-4 border-t border-stone-100">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 text-center">
            Role-Based Demo Access
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin("joabniguise@gmail.com")}
              className="py-2 px-2 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-900 hover:text-white transition-all text-red-900 text-center flex flex-col items-center gap-1 cursor-pointer"
            >
              <ShieldCheck size={14} className="text-red-700 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold truncate">Admin</p>
                <p className="text-[8px] opacity-70">Eyoab Niguise</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("tadesse@oromiaroast.et")}
              className="py-2 px-2 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-[#1E3B2E] hover:text-white transition-all text-emerald-950 text-center flex flex-col items-center gap-1 cursor-pointer"
            >
              <UserCheck size={14} className="text-emerald-700 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold truncate">Buyer</p>
                <p className="text-[8px] opacity-70">Tadesse G.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("chala.student@arenguade.et")}
              className="py-2 px-2 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-[#8C4B31] hover:text-white transition-all text-amber-950 text-center flex flex-col items-center gap-1 cursor-pointer"
            >
              <BookOpen size={14} className="text-amber-700 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold truncate">Student</p>
                <p className="text-[8px] opacity-70">Chala D.</p>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-200 flex flex-col items-center gap-2">
          <div className="text-center text-xs text-stone-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#8C4B31] font-bold hover:underline">
              Create customer, student or admin account
            </Link>
          </div>

          <div className="text-center text-[11px] text-stone-400 flex items-center gap-1.5 mt-1">
            <ShieldCheck size={13} className="text-[#1E3B2E]" />
            <span>Plant Administrators: Access is authenticated via your registered admin account.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center text-stone-500 text-xs">Loading portal...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
