"use client";

import WorksPortfolioSection from "@/components/WorksPortfolioSection";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, PenTool, Upload, Award } from "lucide-react";

export default function PortfolioPage() {
  return (
    <div className="flex flex-col min-h-screen pt-24 pb-16">
      
      {/* Portfolio Header Banner */}
      <section className="relative py-16 bg-[#1E3B2E] text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E0B382]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700/60 text-[#E0B382] text-xs font-bold uppercase tracking-wider mb-4">
              <Award size={14} />
              <span>Proven Industrial Track Record • Addis Ababa</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">
              Delivered Works & <br />
              <span className="italic font-normal text-[#E0B382]">Client Portfolio</span>
            </h1>

            <p className="text-emerald-100 text-lg sm:text-xl leading-relaxed max-w-2xl mb-8">
              Every bag represents authentic Ethiopian paper craft, eliminating plastics while elevating brand recognition for roasters, luxury boutiques, hotels, and retail chains.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/design-submission"
                className="bg-[#8C4B31] hover:bg-[#A3593B] text-white px-8 py-4 rounded-full text-xs font-bold tracking-wider uppercase transition-all shadow-lg flex items-center gap-2"
              >
                <PenTool size={15} />
                <span>Open Custom Design Studio</span>
                <ArrowRight size={14} />
              </Link>
              
              <Link
                href="/products"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-7 py-4 rounded-full text-xs font-bold tracking-wider uppercase transition-all"
              >
                Browse Standard Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Works Portfolio Component (All Projects) */}
      <WorksPortfolioSection showViewAllButton={false} />

      {/* Quality Standards Guarantee Bar */}
      <section className="py-16 bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-stone-800">
            
            <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-stone-200/80">
              <span className="font-serif text-2xl font-bold text-[#8C4B31] block mb-2">01. Heavy Kraft Substrates</span>
              <p className="text-xs text-stone-600 leading-relaxed">
                We use 100% virgin unbleached and coated paper ranging from 120 GSM up to 280 GSM, providing superior burst strength and carrying capacities up to 15 kg.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-stone-200/80">
              <span className="font-serif text-2xl font-bold text-[#1E3B2E] block mb-2">02. Food-Grade & Inks</span>
              <p className="text-xs text-stone-600 leading-relaxed">
                All printing is performed with non-toxic, water-soluble, vegetable-based pigments compliant with international food safety certifications.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-stone-200/80">
              <span className="font-serif text-2xl font-bold text-stone-900 block mb-2">03. Rapid Lead Times</span>
              <p className="text-xs text-stone-600 leading-relaxed">
                Addis Ababa manufacturing facility delivers physical pre-production proof samples within 48 hours, with wholesale batch runs delivered within 7-10 business days.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
