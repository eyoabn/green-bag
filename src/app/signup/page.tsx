"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Sparkles, CheckCircle2, AlertCircle, ShieldCheck, ShoppingBag, BookOpen } from "lucide-react";
import { setLocalUser, AppUser } from "@/utils/auth";

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("returnTo") || null;
  const [accountType, setAccountType] = useState<"buyer" | "student">("buyer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const completeSignup = (user: AppUser) => {
    setLocalUser(user);
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.push("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          fullName: fullName.trim(),
          phone: phone.trim(),
        }),
      });

      const resJson = await res.json().catch(() => null);

      if (res.ok && resJson?.success && resJson?.user) {
        completeSignup(resJson.user);
        return;
      }

      if (resJson?.error) {
        setErrorMessage(String(resJson.error));
        setIsLoading(false);
        return;
      }

      throw new Error("Unable to complete registration. Please try again.");
    } catch (networkErr: unknown) {
      const message = networkErr instanceof Error ? networkErr.message : "Registration failed. Please check connection.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-16 bg-[#F9F6F0] items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl border border-stone-200 shadow-xl relative overflow-hidden">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#8C4B31]/5 rounded-bl-full pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={13} />
            <span>Create Your Account</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Join Arenguade</h1>
          <p className="text-xs text-stone-500">
            Order custom packaging bags, submit bespoke dielines, and register for craft workshops.
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
        
        <form onSubmit={handleSignup} className="flex flex-col gap-3.5 text-xs">
          {/* Account Type Selection: Buyer vs Student */}
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              I Am Registering As
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountType("buyer")}
                className={`py-2.5 px-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                  accountType === "buyer"
                    ? "border-[#1E3B2E] bg-[#1E3B2E] text-white shadow-sm"
                    : "border-stone-200 bg-[#FAF7F2] text-stone-700 hover:bg-stone-100"
                }`}
              >
                <ShoppingBag size={16} className={accountType === "buyer" ? "text-white" : "text-[#1E3B2E]"} />
                <div>
                  <p className="font-bold text-[11px] leading-tight">Packaging Buyer</p>
                  <p className={`text-[9px] ${accountType === "buyer" ? "text-white/80" : "text-stone-400"}`}>Order Bags & Dielines</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType("student")}
                className={`py-2.5 px-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                  accountType === "student"
                    ? "border-[#8C4B31] bg-[#8C4B31] text-white shadow-sm"
                    : "border-stone-200 bg-[#FAF7F2] text-stone-700 hover:bg-stone-100"
                }`}
              >
                <BookOpen size={16} className={accountType === "student" ? "text-white" : "text-[#8C4B31]"} />
                <div>
                  <p className="font-bold text-[11px] leading-tight">Academy Student</p>
                  <p className={`text-[9px] ${accountType === "student" ? "text-white/80" : "text-stone-400"}`}>Attend Workshops</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Full Name / Business Name
            </label>
            <input 
              type="text" 
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-stone-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 bg-[#FAF7F2] text-stone-900"
              placeholder="e.g. Selam Kebede"
            />
          </div>
          
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
              placeholder="you@domain.com"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Phone Number (CBE / Telebirr)
            </label>
            <input 
              type="tel" 
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-stone-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 bg-[#FAF7F2] text-stone-900"
              placeholder="+251 911 000 000"
            />
          </div>
          
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Password (min. 6 characters)
            </label>
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
              <span>Creating Your Account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-200 flex flex-col items-center gap-2">
          <div className="text-center text-xs text-stone-500">
            Already registered?{" "}
            <Link href="/login" className="text-[#8C4B31] font-bold hover:underline">
              Sign in to your account
            </Link>
          </div>

          <div className="text-center text-[11px] text-stone-400 flex items-center gap-1.5 mt-1">
            <ShieldCheck size={13} className="text-[#1E3B2E]" />
            <span>Teachers and staff accounts are provisioned exclusively by Plant Management.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center text-stone-500 text-xs">Loading registration...</div>}>
      <SignupFormContent />
    </Suspense>
  );
}
