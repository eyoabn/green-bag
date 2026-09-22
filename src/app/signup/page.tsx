"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Sparkles, CheckCircle2, AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { setLocalUser, AppUser } from "@/utils/auth";

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get("returnTo") || null;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "student" | "admin">("customer");
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const completeSignup = (user: AppUser) => {
    setLocalUser(user);
    setSuccessMessage(`Account registered as ${user.role.toUpperCase()}! Loading workspace...`);
    setTimeout(() => {
      if (returnTo) {
        router.push(returnTo);
      } else if (user.role === "admin") {
        router.push("/admin");
      } else if (user.role === "student") {
        router.push("/dashboard?tab=classes");
      } else {
        router.push("/dashboard?tab=orders");
      }
    }, 600);
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

    if (role === "admin" && !adminKey.trim()) {
      setErrorMessage("Admin Security Passphrase is required to register an administrator account.");
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
          role,
          adminSecurityKey: adminKey.trim(),
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
    } catch (networkErr: any) {
      setErrorMessage(networkErr?.message || "Registration failed. Please check connection.");
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
            <span>Arenguade Guild</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Create Account</h1>
          <p className="text-xs text-stone-500">
            Select your platform role to configure your dedicated workspace.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <div className="flex-1">
              <span className="block font-medium">{errorMessage}</span>
              {errorMessage.includes("already exists") && (
                <Link
                  href={`/login?email=${encodeURIComponent(email)}`}
                  className="mt-1 text-[11px] underline font-bold text-red-900 hover:text-red-700 block"
                >
                  Go to Sign In &rarr;
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
        
        <form onSubmit={handleSignup} className="flex flex-col gap-3.5 text-xs">
          
          {/* Real Role Classification Selector */}
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Select Your Platform Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  role === "customer"
                    ? "bg-[#1E3B2E] text-white border-[#1E3B2E] shadow-sm font-bold"
                    : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                <span className="block text-xs">Buyer</span>
                <span className={`text-[9px] block mt-0.5 ${role === "customer" ? "text-stone-300" : "text-stone-400"}`}>
                  Order Bags
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole("student")}
                className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  role === "student"
                    ? "bg-[#8C4B31] text-white border-[#8C4B31] shadow-sm font-bold"
                    : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                <span className="block text-xs">Student</span>
                <span className={`text-[9px] block mt-0.5 ${role === "student" ? "text-stone-300" : "text-stone-400"}`}>
                  Craft Academy
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  role === "admin"
                    ? "bg-red-900 text-white border-red-950 shadow-sm font-bold"
                    : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                <span className="block text-xs flex items-center justify-center gap-1">
                  <ShieldCheck size={12} />
                  Admin
                </span>
                <span className={`text-[9px] block mt-0.5 ${role === "admin" ? "text-red-200" : "text-stone-400"}`}>
                  Plant Control
                </span>
              </button>
            </div>
          </div>

          {/* Admin Security Key Input if Admin selected */}
          {role === "admin" && (
            <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-200 text-red-950 space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                <ShieldAlert size={14} className="text-red-700" />
                <span>Executive Authorization Required</span>
              </div>
              <p className="text-[11px] text-red-800 leading-tight">
                Enter the factory master passphrase to establish your administrator account.
              </p>
              <input
                type="password"
                required
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter Admin Security Passphrase..."
                className="w-full border border-red-300 rounded-xl p-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-700/30 text-xs mt-1"
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Full Name / Business
            </label>
            <input 
              type="text" 
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-stone-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 bg-[#FAF7F2] text-stone-900"
              placeholder="e.g. Abebe Bikila (Oromia Roastery)"
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
              placeholder="you@domain.et"
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
              placeholder="0911234567"
            />
          </div>
          
          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input 
              type="password" 
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-stone-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 bg-[#FAF7F2] text-stone-900"
              placeholder="At least 6 characters"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white py-3.5 mt-2 rounded-full font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Registering Account...</span>
            ) : (
              <>
                <span>Register as {role === "admin" ? "Plant Administrator" : role === "student" ? "Academy Student" : "Packaging Buyer"}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-stone-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#8C4B31] font-bold hover:underline">
            Sign in
          </Link>
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
