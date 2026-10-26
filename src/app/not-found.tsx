import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F9F6F0] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-stone-200 shadow-xl space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border border-stone-200 p-2 flex items-center justify-center mx-auto shadow-xs overflow-hidden">
          <Image
            src="/images/arenguade-icon-transparent.png"
            alt="Arenguade Logo"
            width={56}
            height={56}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8C4B31]">
            Error 404
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Page Folded Away
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            The packaging specification, order receipt, or classroom you are looking for does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Return Home</span>
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag size={14} />
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>

      <p className="text-[11px] text-stone-400 mt-6 font-mono">
        Ethiopia Arenguade Paper Product • Addis Ababa
      </p>
    </div>
  );
}
