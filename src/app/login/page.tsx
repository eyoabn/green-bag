"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
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
    const role = user.role;
    let target = "/dashboard";

    if (returnTo) {
      target = returnTo;
    } else if (role === "admin") {
      target = "/admin";
    } else if (role === "teacher") {
      target = "/teacher";
    } else {
      target = "/dashboard";
    }

    if (typeof window !== "undefined") {
      window.location.href = target;
    } else {
      router.push(target);
    }
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


  return (
    <div className="flex flex-col min-h-screen pt-24 pb-16 bg-[#F9F6F0] items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl border border-stone-200 shadow-xl relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 w-36 h-36 bg-[#1E3B2E]/5 rounded-br-full pointer-events-none" />

        <div className="text-center mb-8 flex flex-col items-center">
          <Link href="/" className="mb-4 inline-block hover:opacity-90 transition-opacity">
            <Image
              src="/images/arenguade-logo.png"
              alt="Arenguade Artisanal Kraft Packaging & Craft Academy"
              width={260}
              height={80}
              className="h-13 w-auto object-contain"
              priority
            />
          </Link>
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
              <Link
                href="/forgot-password"
                className="text-[11px] text-[#8C4B31] font-semibold hover:underline"
              >
                Forgot password?
              </Link>
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

        <div className="mt-6 pt-4 border-t border-stone-200 text-center">
          <p className="text-xs text-stone-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#8C4B31] font-bold hover:underline">
              Create an account
            </Link>
          </p>
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
