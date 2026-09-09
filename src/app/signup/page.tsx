"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "admin">("customer");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

    try {
      const supabase = createClient();
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

      if (isPlaceholder) {
        // Fallback demo user session
        if (typeof window !== "undefined") {
          localStorage.setItem("arenguade_user", JSON.stringify({
            id: `usr_${Date.now()}`,
            email,
            full_name: fullName,
            phone,
            role,
          }));
        }
        setSuccessMessage("Account created successfully! Redirecting to portal...");
        setTimeout(() => {
          router.push(role === "admin" ? "/admin" : "/dashboard");
        }, 1200);
        return;
      }

      // Real Supabase Auth Call
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: role,
          }
        }
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      // Also insert profile into profiles table
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          phone: phone,
          role: role,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("arenguade_user", JSON.stringify({
            id: data.user.id,
            email,
            full_name: fullName,
            phone,
            role,
          }));
        }
      }

      setSuccessMessage("Account created successfully! Redirecting to portal...");
      setTimeout(() => {
        router.push(role === "admin" ? "/admin" : "/dashboard");
      }, 1200);

    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-16 bg-[#F9F6F0] items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl border border-stone-200 shadow-xl relative overflow-hidden">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#8C4B31]/5 rounded-bl-full pointer-events-none" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={13} />
            <span>Arenguade Guild</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Create Account</h1>
          <p className="text-xs text-stone-500">
            Join to order custom packaging, attend LiveKit masterclasses, and manage orders.
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
        
        <form onSubmit={handleSignup} className="flex flex-col gap-4 text-xs">
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

          <div>
            <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                  role === "customer"
                    ? "bg-[#1E3B2E] text-white border-[#1E3B2E] shadow-sm"
                    : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                Customer / Student
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                  role === "admin"
                    ? "bg-[#8C4B31] text-white border-[#8C4B31] shadow-sm"
                    : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                Factory Owner / Admin
              </button>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white py-3.5 mt-2 rounded-full font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Sign Up for Arenguade</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs text-stone-500">
          Already have an account?{" "}
          <Link href="/login" className="text-[#8C4B31] font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
