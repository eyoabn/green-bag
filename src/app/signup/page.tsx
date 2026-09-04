import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="flex flex-col min-h-screen pt-24 bg-background items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-3xl border border-border shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join us to order custom bags and attend classes</p>
        </div>
        
        <form className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
            <input 
              type="text" 
              className="w-full border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-[#F9F6F0]"
              placeholder="Abebe Bikila"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <input 
              type="email" 
              className="w-full border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-[#F9F6F0]"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input 
              type="password" 
              className="w-full border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-[#F9F6F0]"
              placeholder="••••••••"
            />
          </div>
          
          <button className="w-full bg-primary text-white py-3 mt-4 rounded-xl font-semibold hover:bg-secondary transition-all flex items-center justify-center gap-2">
            Sign Up <ArrowRight size={16} />
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
