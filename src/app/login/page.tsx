import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen pt-24 bg-background items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-3xl border border-border shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to manage your orders and classes</p>
        </div>
        
        <form className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input 
              type="email" 
              className="w-full border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-[#F9F6F0]"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-foreground">Password</label>
              <Link href="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
            </div>
            <input 
              type="password" 
              className="w-full border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-[#F9F6F0]"
              placeholder="••••••••"
            />
          </div>
          
          <button className="w-full bg-primary text-white py-3 mt-4 rounded-xl font-semibold hover:bg-secondary transition-all flex items-center justify-center gap-2">
            Sign In <ArrowRight size={16} />
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account? <Link href="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
