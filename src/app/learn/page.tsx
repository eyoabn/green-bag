"use client";

import Link from "next/link";
import { 
  Users, 
  Video, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Layers, 
  BookOpen, 
  Laptop, 
  Compass, 
  ShieldCheck,
  PlayCircle
} from "lucide-react";

export default function LearnPage() {
  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[#F9F6F0]">
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/70 border border-stone-300/60 w-fit mb-4">
            <span className="w-2 h-2 rounded-full bg-[#8C4B31] animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider text-stone-700 uppercase">
              Vocational Paper Craft & Engineering Guild
            </span>
          </div>

          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-stone-900 leading-[1.08] tracking-tight mb-6">
            Master the Art of <br />
            <span className="text-[#8C4B31] italic">Artisanal Paper</span> Packaging.
          </h1>

          <p className="text-stone-600 text-lg sm:text-xl max-w-xl leading-relaxed mb-8">
            Empowering Ethiopian youth, entrepreneurs, and global designers with hands-on studio masterclasses in Addis Ababa and real-time interactive classes streaming worldwide via LiveKit WebRTC.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link 
              href="/learn/schedule" 
              className="inline-flex items-center gap-2 bg-[#1E3B2E] hover:bg-[#8C4B31] text-white px-8 py-4 rounded-full font-bold text-xs tracking-wide uppercase transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 group"
            >
              <Calendar size={16} />
              <span>View Workshop Calendar</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/dashboard/sessions/2"
              className="inline-flex items-center gap-2 bg-white text-stone-800 border border-stone-300 px-6 py-4 rounded-full font-bold text-xs tracking-wide transition-all hover:bg-stone-50"
            >
              <PlayCircle size={16} className="text-[#8C4B31]" />
              <span>Preview LiveKit Stream</span>
            </Link>
          </div>
        </div>

        {/* Studio vs Online Hybrid Card */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#FAF7F2] to-[#F0EAE1] p-8 rounded-3xl border border-stone-300 shadow-xl relative overflow-hidden">
          <div className="space-y-4">
            
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-[#8C4B31]/10 text-[#8C4B31]">
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">In-Person Addis Studio</h3>
                  <span className="text-[10px] font-bold text-stone-500 uppercase">Bole Subcity Industrial Park</span>
                </div>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                4 to 8 hour immersive workshops using industrial bone folders, heavy-gauge paper guillotines, and screen printing equipment.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-[#1E3B2E]/10 text-[#1E3B2E]">
                  <Video size={22} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">LiveKit Interactive Online</h3>
                  <span className="text-[10px] font-bold text-[#1E3B2E] uppercase">Real-Time Global Broadcast</span>
                </div>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Multi-camera high-definition WebRTC video, live interactive folding critiques, downloadable vector dielines, and certification.
              </p>
            </div>

          </div>
        </div>

      </section>

      {/* Curriculum Breakdown */}
      <section className="py-20 bg-white border-y border-stone-200">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest text-[#8C4B31] uppercase">
              Rigorous Vocational Curriculum
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-2">
              The 4 Pillars of Packaging Mastery
            </h2>
            <p className="text-stone-600 text-sm mt-3">
              Designed by Ethiopian master craftsmen to turn raw paper rolls into commercial-grade luxury packaging.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-stone-200/90 flex gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[#8C4B31] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm">
                01
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                  Paper Physics & Raw Sourcing
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Understand grain direction, tensile strength, burst factors, and GSM ratings (70 GSM to 350 GSM). Navigate local Ethiopian paper suppliers and sustainable eucalyptus and bamboo fibers.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-stone-200/90 flex gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[#1E3B2E] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm">
                02
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                  Precision Scoring & Geometric Gussets
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Master the mathematical formulas for accordion side gussets, bottom envelope folds, and hexagonal load-bearing bases without cracking paper fibers.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-stone-200/90 flex gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[#1E3B2E] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm">
                03
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                  Handle Engineering & Reinforcement
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Learn to craft twisted kraft cord handles, embed brass eyelets, insert bottom reinforcement cards, and test pull-force tensile limits up to 15 kilograms.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-stone-200/90 flex gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[#8C4B31] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm">
                04
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                  Commercial Screen Printing & Business
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Manual silk screen printing with eco-friendly soy inks, gold foil stamping, cost estimation formulas, and client quotation strategy for B2B contracts.
                </p>
              </div>
            </div>

          </div>

          <div className="mt-16 text-center">
            <Link
              href="/learn/schedule"
              className="inline-flex items-center gap-2 bg-[#1E3B2E] hover:bg-[#8C4B31] text-white px-8 py-4 rounded-full font-bold text-xs tracking-wide uppercase transition-all shadow-md"
            >
              <span>Explore Upcoming Schedules</span>
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
