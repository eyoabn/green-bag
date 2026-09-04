"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import WorksPortfolioSection from "@/components/WorksPortfolioSection";
import { 
  ShoppingBag, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Leaf, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Video, 
  Calculator,
  Download,
  Calendar,
  ExternalLink,
  ChevronRight,
  Clock,
  Layers,
  Award
} from "lucide-react";

// Dynamically import ThreeBag with zero SSR to prevent hydration issues
const ThreeBagScene = dynamic(() => import("@/components/ThreeBag"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[520px] flex flex-col items-center justify-center text-stone-400 bg-stone-100/60 rounded-3xl animate-pulse">
      <div className="w-20 h-24 border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center mb-4">
        <Sparkles size={28} className="text-[#8C4B31] animate-spin" />
      </div>
      <p className="font-serif text-base font-semibold text-stone-600">Initializing 3D Studio Canvas...</p>
      <p className="text-xs text-stone-400 mt-1">100% Offline Procedural Three.js Model</p>
    </div>
  ),
});

export default function Home() {
  // Interactive ESG & Volume Calculator State
  const [bagVolume, setBagVolume] = useState<number>(15000);
  const [selectedBagType, setSelectedBagType] = useState<"standard" | "coffee" | "luxury">("standard");

  // Calculate ESG & Pricing
  const plasticAvoidedKg = Math.round(bagVolume * 0.045);
  const co2AvoidedKg = Math.round(bagVolume * 0.082);
  const unitPrice = selectedBagType === "standard" 
    ? (bagVolume > 20000 ? 12.5 : 14.0) 
    : selectedBagType === "coffee" 
    ? (bagVolume > 20000 ? 16.0 : 18.5) 
    : (bagVolume > 20000 ? 21.0 : 24.0);
  const totalEstimateEtb = Math.round(bagVolume * unitPrice);

  return (
    <div className="flex flex-col min-h-screen pt-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full min-h-[92vh] flex items-center justify-center pt-8 pb-16 overflow-hidden">
        
        {/* Ambient Craft Glow Background */}
        <div className="absolute top-12 right-0 w-[550px] h-[550px] bg-[#D7A977]/20 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[#2C4A3B]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 sm:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Editorial & Value Proposition */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="lg:col-span-6 flex flex-col gap-6"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/70 border border-stone-300/60 w-fit">
                <span className="w-2 h-2 rounded-full bg-[#8C4B31] animate-pulse" />
                <span className="text-[11px] font-bold tracking-wider text-stone-700 uppercase">
                  Ethiopia&apos;s Eco-Packaging Pioneer
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] text-stone-900 tracking-tight">
                Crafted from <br />
                the Earth. <br />
                <span className="italic font-normal text-[#8C4B31]">Engineered</span> for <br />
                Tomorrow.
              </h1>

              {/* Sub-paragraph */}
              <p className="text-stone-600 text-lg sm:text-xl max-w-xl leading-relaxed font-normal">
                Replacing single-use plastic with 100% biodegradable artisanal kraft packaging. 
                Supplying premier Ethiopian coffee roasters, luxury boutiques, and teaching the art of paper making through our interactive academy.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link 
                  href="/products" 
                  className="flex items-center gap-2 bg-[#1E3B2E] text-white px-8 py-4 rounded-full text-sm font-semibold hover:bg-[#8C4B31] transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 group"
                >
                  <ShoppingBag size={18} />
                  <span>Explore 2026 Catalog</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link 
                  href="/learn" 
                  className="flex items-center gap-2 bg-white/90 text-stone-800 border border-stone-300/80 px-7 py-4 rounded-full text-sm font-semibold hover:bg-stone-50 hover:border-stone-400 transition-all shadow-sm"
                >
                  <BookOpen size={18} className="text-[#8C4B31]" />
                  <span>Craft Academy</span>
                </Link>
              </div>

              {/* Investor Trust Indicators */}
              <div className="pt-6 border-t border-stone-300/60 grid grid-cols-3 gap-4">
                <div>
                  <p className="font-serif text-2xl font-bold text-stone-900">100%</p>
                  <p className="text-xs text-stone-500 font-medium">Biodegradable</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold text-[#8C4B31]">CBE / Telebirr</p>
                  <p className="text-xs text-stone-500 font-medium">Instant Verified</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold text-[#1E3B2E]">LiveKit</p>
                  <p className="text-xs text-stone-500 font-medium">Global Classes</p>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Interactive 3D Paper Bag Showcase */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15 }}
              className="lg:col-span-6 relative"
            >
              <div className="relative h-[580px] sm:h-[640px] w-full rounded-3xl bg-gradient-to-b from-[#F2ECE1] to-[#E9DFCF] flex items-center justify-center overflow-hidden border border-stone-300/80 shadow-2xl shadow-stone-900/10">
                
                {/* 3D Scene Component */}
                <ThreeBagScene />

                {/* Live 3D Interaction Hint Badge */}
                <div className="absolute bottom-5 right-5 z-20 bg-white/85 backdrop-blur-md px-4 py-2 rounded-full border border-stone-200 shadow-sm flex items-center gap-2.5 pointer-events-none">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8C4B31] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8C4B31]"></span>
                  </span>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-stone-700">
                    360° Interactive Studio
                  </span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. INVESTOR SCALE & ESG METRICS BAR */}
      <section className="bg-[#1E3B2E] text-white py-14 border-y border-stone-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-emerald-800/60">
            
            <div className="flex flex-col items-center text-center px-4 pt-4 md:pt-0">
              <TrendingUp className="text-[#E0B382] mb-2" size={28} />
              <h3 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">1.25M+</h3>
              <p className="text-xs sm:text-sm text-emerald-200 mt-1 font-medium">Bags Manufactured & Delivered</p>
            </div>

            <div className="flex flex-col items-center text-center px-4 pt-4 md:pt-0">
              <Leaf className="text-[#E0B382] mb-2" size={28} />
              <h3 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">850 Tons</h3>
              <p className="text-xs sm:text-sm text-emerald-200 mt-1 font-medium">Single-Use Plastics Diverted</p>
            </div>

            <div className="flex flex-col items-center text-center px-4 pt-4 md:pt-0">
              <Users className="text-[#E0B382] mb-2" size={28} />
              <h3 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">140+</h3>
              <p className="text-xs sm:text-sm text-emerald-200 mt-1 font-medium">Artisans & Youth Employed</p>
            </div>

            <div className="flex flex-col items-center text-center px-4 pt-4 md:pt-0">
              <Award className="text-[#E0B382] mb-2" size={28} />
              <h3 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">90 Days</h3>
              <p className="text-xs sm:text-sm text-emerald-200 mt-1 font-medium">100% Soil Biodegradation</p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS & PACKAGING SUITE */}
      <section className="py-24 bg-[#F9F6F0]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-[#8C4B31] uppercase mb-2">
                <Sparkles size={14} />
                Bespoke Ethiopian Packaging
              </div>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight">
                Our Signature Collections
              </h2>
              <p className="text-stone-600 text-base sm:text-lg mt-3 max-w-xl">
                Manufactured with heavy Ethiopian virgin kraft, food-safe vegetable inks, and reinforced handles.
              </p>
            </div>

            <Link 
              href="/products" 
              className="inline-flex items-center gap-2 text-[#1E3B2E] font-bold text-sm hover:text-[#8C4B31] transition-colors group self-start md:self-auto"
            >
              <span>View All 24 Products</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Product Cards Grid with Authentic Ethiopian Craft Deliveries */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: Rare Coffee */}
            <div className="group bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="h-64 rounded-2xl bg-stone-100 relative overflow-hidden mb-6 group-hover:scale-[1.02] transition-transform duration-300">
                  <Image 
                    src="/images/photo_6_2026-09-05_00-36-03.jpg"
                    alt="Rare Specialty Coffee Roasters Bag"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                  <span className="absolute top-3 left-3 bg-[#1E3B2E] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                    Coffee Roasters Choice
                  </span>
                  <span className="absolute bottom-3 left-3 text-white text-xs font-semibold drop-shadow-sm">
                    Rare Coffee Roastery • Addis Ababa
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Twisted Black Cord • 220 GSM</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Food Safe</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-stone-900 group-hover:text-[#8C4B31] transition-colors">
                  Specialty Coffee Roasters Bag
                </h3>
                <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                  High-tensile virgin kraft carrier with aroma protection. Custom printed for Ethiopian single-origin specialty coffee roasters.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Bundle of 100</span>
                  <span className="text-xl font-bold text-[#8C4B31]">180 ETB</span>
                </div>
                <Link 
                  href="/products/1" 
                  className="px-5 py-2.5 rounded-full bg-stone-100 hover:bg-[#1E3B2E] hover:text-white text-stone-800 text-xs font-bold transition-all"
                >
                  Order Flow
                </Link>
              </div>
            </div>

            {/* Card 2: Richo's Boutique */}
            <div className="group bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="h-64 rounded-2xl bg-stone-100 relative overflow-hidden mb-6 group-hover:scale-[1.02] transition-transform duration-300">
                  <Image 
                    src="/images/photo_3_2026-09-05_00-36-02.jpg"
                    alt="Richo's Luxury Boutique Tote"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                  <span className="absolute top-3 left-3 bg-[#8C4B31] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                    Luxury Fashion
                  </span>
                  <span className="absolute bottom-3 left-3 text-white text-xs font-semibold drop-shadow-sm">
                    Richo&apos;s Boutique • Bole Medhanealem
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Cotton Rope • 250 GSM</span>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">Tibeb Border</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-stone-900 group-hover:text-[#8C4B31] transition-colors">
                  Boutique Luxury Apparel Tote
                </h3>
                <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                  Heavy 250 GSM white kraft with traditional Ethiopian geometric Tibeb border and soft braided cotton rope handles.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Bundle of 100</span>
                  <span className="text-xl font-bold text-[#8C4B31]">260 ETB</span>
                </div>
                <Link 
                  href="/products/2" 
                  className="px-5 py-2.5 rounded-full bg-stone-100 hover:bg-[#1E3B2E] hover:text-white text-stone-800 text-xs font-bold transition-all"
                >
                  Order Flow
                </Link>
              </div>
            </div>

            {/* Card 3: Véro Tiramisù Bakery */}
            <div className="group bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="h-64 rounded-2xl bg-stone-100 relative overflow-hidden mb-6 group-hover:scale-[1.02] transition-transform duration-300">
                  <Image 
                    src="/images/photo_9_2026-09-05_00-36-03.jpg"
                    alt="Véro Tiramisù Bakery Packaging"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                  <span className="absolute top-3 left-3 bg-[#2C4A3B] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                    Bakery & Dining
                  </span>
                  <span className="absolute bottom-3 left-3 text-white text-xs font-semibold drop-shadow-sm">
                    Véro Tiramisù • Kazanchis
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Extra-Wide Gusset • 200 GSM</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">Flat Base</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-stone-900 group-hover:text-[#8C4B31] transition-colors">
                  Artisan Pastry & Cake Carrier
                </h3>
                <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                  Wide flat-base kraft bag designed for square dessert boxes and pastry packaging with zero tilt during delivery.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Bundle of 100</span>
                  <span className="text-xl font-bold text-[#8C4B31]">220 ETB</span>
                </div>
                <Link 
                  href="/products/6" 
                  className="px-5 py-2.5 rounded-full bg-stone-100 hover:bg-[#1E3B2E] hover:text-white text-stone-800 text-xs font-bold transition-all"
                >
                  Order Flow
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3.5 RECENT WORKS & CLIENT PROJECTS SHOWCASE (NICE VIEW LIGHTBOX) */}
      <WorksPortfolioSection limit={6} showViewAllButton={true} />

      {/* 4. DUAL-REVENUE ENGINE BREAKDOWN (FOR INVESTORS & CLIENTS) */}
      <section className="py-24 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-bold tracking-widest text-[#8C4B31] uppercase">
              The Arenguade Business Architecture
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 mt-2 tracking-tight">
              A High-Margin Dual-Engine Model
            </h2>
            <p className="text-stone-600 text-lg mt-4">
              We combine scalable manufacturing cash flows with recurring vocational academy tuition fees, creating an unshakeable commercial foundation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Engine 1: Manufacturing */}
            <div className="bg-[#FAF7F2] rounded-3xl p-8 sm:p-10 border border-stone-300/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#8C4B31]/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#8C4B31] text-white flex items-center justify-center font-serif font-black text-xl mb-6 shadow-sm">
                  1
                </div>
                <span className="text-xs font-bold tracking-wider text-[#8C4B31] uppercase">Engine 01 • B2B & Wholesale</span>
                <h3 className="font-serif text-3xl font-bold text-stone-900 mt-1 mb-4">
                  Industrial Packaging Manufacturing
                </h3>
                <p className="text-stone-600 text-base leading-relaxed mb-6">
                  High-capacity semi-automated manufacturing facility in Addis Ababa producing up to 250,000 bags monthly. Long-term supply agreements with Ethiopian specialty coffee exporters, pharmacy chains, and supermarket brands.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-stone-700">
                    <CheckCircle2 size={18} className="text-[#1E3B2E] shrink-0" />
                    <span>Custom branded screen printing & hot foil stamping</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-stone-700">
                    <CheckCircle2 size={18} className="text-[#1E3B2E] shrink-0" />
                    <span>High gross margins (42%+) with local raw material sourcing</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-stone-700">
                    <CheckCircle2 size={18} className="text-[#1E3B2E] shrink-0" />
                    <span>Verified bank transfers via CBE & Telebirr</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500">Production Capacity</span>
                  <p className="font-serif text-xl font-bold text-stone-900">250,000 Units / Mo</p>
                </div>
                <Link 
                  href="/design-submission" 
                  className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-semibold px-6 py-3 rounded-full transition-colors flex items-center gap-1.5"
                >
                  <span>Submit Custom Specs</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Engine 2: Craft Academy */}
            <div className="bg-[#FAF7F2] rounded-3xl p-8 sm:p-10 border border-stone-300/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#1E3B2E]/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#1E3B2E] text-white flex items-center justify-center font-serif font-black text-xl mb-6 shadow-sm">
                  2
                </div>
                <span className="text-xs font-bold tracking-wider text-[#1E3B2E] uppercase">Engine 02 • Education & Tech</span>
                <h3 className="font-serif text-3xl font-bold text-stone-900 mt-1 mb-4">
                  Arenguade Craft Academy
                </h3>
                <p className="text-stone-600 text-base leading-relaxed mb-6">
                  Vocational mastery classes teaching youth, artisans, and entrepreneurs the technical trade of paper folding, handle installation, and box making. Delivered in-studio in Addis Ababa and globally via LiveKit interactive video streaming.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm text-stone-700">
                    <CheckCircle2 size={18} className="text-[#8C4B31] shrink-0" />
                    <span>In-person Addis Ababa workshops (500 ETB - 1,000 ETB / student)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-stone-700">
                    <CheckCircle2 size={18} className="text-[#8C4B31] shrink-0" />
                    <span>Live online WebRTC video sessions powered by LiveKit SDK</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-stone-700">
                    <CheckCircle2 size={18} className="text-[#8C4B31] shrink-0" />
                    <span>Job placement pipeline directly into our manufacturing guild</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-500">Next Live Session</span>
                  <p className="font-serif text-xl font-bold text-stone-900">Virtual Origami Folds</p>
                </div>
                <Link 
                  href="/learn/schedule" 
                  className="bg-[#8C4B31] hover:bg-[#1E3B2E] text-white text-xs font-semibold px-6 py-3 rounded-full transition-colors flex items-center gap-1.5"
                >
                  <Video size={14} />
                  <span>Book Class Seat</span>
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE B2B & ESG CALCULATOR (INVESTOR DELIGHT) */}
      <section className="py-24 bg-[#FAF7F2]">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-300 shadow-xl">
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-[#8C4B31]/10 text-[#8C4B31]">
                <Calculator size={24} />
              </div>
              <div>
                <span className="text-xs font-bold tracking-wider text-[#8C4B31] uppercase">Commercial & Impact Estimator</span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                  Calculate Your B2B Volume & Environmental ROI
                </h3>
              </div>
            </div>

            <p className="text-stone-600 text-sm sm:text-base mb-8">
              Adjust the monthly packaging volume below to see your wholesale cost in ETB alongside immediate ESG plastic-avoidance metrics.
            </p>

            {/* Controls */}
            <div className="space-y-6 mb-10">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Monthly Order Volume (Bags)
                  </label>
                  <span className="font-mono text-lg font-bold text-[#1E3B2E]">
                    {bagVolume.toLocaleString()} bags
                  </span>
                </div>
                <input 
                  type="range" 
                  min="2000" 
                  max="100000" 
                  step="1000" 
                  value={bagVolume} 
                  onChange={(e) => setBagVolume(Number(e.target.value))}
                  className="w-full accent-[#8C4B31] cursor-pointer h-2 bg-stone-200 rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-stone-400 mt-1">
                  <span>2,000 (Small Boutique)</span>
                  <span>50,000 (Retail Chain)</span>
                  <span>100,000 (Exporter)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-2">
                  Packaging Specification
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "standard", label: "Standard Kraft (180 GSM)" },
                    { id: "coffee", label: "Degassing Coffee Pouch" },
                    { id: "luxury", label: "Luxury Cotton Shopper" }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedBagType(type.id as any)}
                      className={`p-3 rounded-xl text-xs font-bold transition-all border ${
                        selectedBagType === type.id 
                          ? "bg-[#1E3B2E] text-white border-[#1E3B2E] shadow-sm" 
                          : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-[#FAF7F2] rounded-2xl border border-stone-200/80 mb-8">
              <div className="text-center sm:text-left">
                <span className="text-xs text-stone-500 font-medium">Plastic Waste Avoided</span>
                <p className="font-serif text-2xl font-bold text-[#1E3B2E] mt-1">{plasticAvoidedKg.toLocaleString()} kg</p>
                <span className="text-[11px] text-emerald-700">Zero microplastics</span>
              </div>
              <div className="text-center sm:text-left border-y sm:border-y-0 sm:border-x border-stone-200 py-3 sm:py-0 sm:px-6">
                <span className="text-xs text-stone-500 font-medium">Carbon Footprint Saved</span>
                <p className="font-serif text-2xl font-bold text-[#8C4B31] mt-1">{co2AvoidedKg.toLocaleString()} kg</p>
                <span className="text-[11px] text-amber-700">CO2 equivalent offset</span>
              </div>
              <div className="text-center sm:text-left sm:pl-2">
                <span className="text-xs text-stone-500 font-medium">Estimated Wholesale Rate</span>
                <p className="font-serif text-2xl font-bold text-stone-900 mt-1">{unitPrice.toFixed(2)} ETB / unit</p>
                <span className="text-[11px] text-stone-500">Est. Total: {totalEstimateEtb.toLocaleString()} ETB</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-stone-500">
                Bulk tier discount applied for orders exceeding 20,000 units.
              </span>
              <Link 
                href="/design-submission" 
                className="w-full sm:w-auto bg-[#1E3B2E] hover:bg-[#8C4B31] text-white px-8 py-3.5 rounded-full text-xs font-bold tracking-wide transition-all shadow-md text-center"
              >
                Lock In Wholesale Pricing
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 6. UPCOMING LIVE WORKSHOP TICKER */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#8C4B31] uppercase">
                Interactive Learning Guild
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
                Upcoming Craft Workshops
              </h2>
            </div>
            <Link 
              href="/learn/schedule" 
              className="text-xs font-bold text-[#1E3B2E] hover:underline flex items-center gap-1"
            >
              Full Calendar & Booking Flow <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Workshop 1 */}
            <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-[#8C4B31]/50 transition-colors">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-[#8C4B31] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                    In-Person Studio
                  </span>
                  <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                    <Clock size={12} /> 4 Hours Hands-on
                  </span>
                </div>
                <h4 className="font-serif text-xl font-bold text-stone-900">
                  Beginner Paper Bag Workshop & Structural Folds
                </h4>
                <p className="text-xs text-stone-600">
                  Addis Ababa Studio • Bole Industrial Center • Oct 15, 2026
                </p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                <span className="font-serif text-lg font-bold text-[#8C4B31]">500 ETB</span>
                <Link 
                  href="/learn/schedule" 
                  className="bg-[#1E3B2E] text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-[#8C4B31] transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>

            {/* Workshop 2 */}
            <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-[#8C4B31]/50 transition-colors">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-[#1E3B2E] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <Video size={11} /> LiveKit Online
                  </span>
                  <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                    <Clock size={12} /> 2 Hours Streaming
                  </span>
                </div>
                <h4 className="font-serif text-xl font-bold text-stone-900">
                  Virtual: Advanced Origami Folds & Gusset Dynamics
                </h4>
                <p className="text-xs text-stone-600">
                  Join from anywhere • High-def multi-camera feed • Oct 18, 2026
                </p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0">
                <span className="font-serif text-lg font-bold text-[#8C4B31]">300 ETB</span>
                <Link 
                  href="/learn/schedule" 
                  className="bg-[#1E3B2E] text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-[#8C4B31] transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. INVESTOR CALLOUT BANNER */}
      <section className="bg-stone-900 text-stone-200 py-16 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="bg-gradient-to-r from-stone-950 via-[#1B2720] to-stone-950 p-8 sm:p-12 rounded-3xl border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="max-w-xl">
              <span className="text-[11px] font-bold tracking-widest text-[#E0B382] uppercase">
                Investor Relations & B2B Partnerships
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
                Partner with the Future of East African Packaging
              </h3>
              <p className="text-sm text-stone-400 mt-3 leading-relaxed">
                Arenguade is raising growth capital to expand automated roll-fed production and scale our vocational academies across regional capitals. Request confidential financials and investor memorandum.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <a 
                href="mailto:invest@arenguade.et?subject=Investor%20Pitch%20Deck%20Request"
                className="w-full sm:w-auto bg-[#8C4B31] hover:bg-[#A3593B] text-white text-xs font-bold px-7 py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Download size={15} />
                <span>Request Investor Deck</span>
              </a>
              <Link 
                href="/design-submission" 
                className="w-full sm:w-auto bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold px-6 py-4 rounded-full transition-all text-center border border-stone-700"
              >
                B2B Custom Inquiry
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
