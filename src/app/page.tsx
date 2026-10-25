"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCurrency } from "@/components/CurrencyContext";
import { createClient } from "@/utils/supabase/client";
import { 
  ShoppingBag, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Video, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard,
  Building2,
  Calendar,
  Sparkles
} from "lucide-react";

// Dynamically import 3D Bag with zero SSR to prevent hydration issues
const ThreeBagScene = dynamic(() => import("@/components/ThreeBag"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[360px] flex flex-col items-center justify-center text-stone-400 bg-stone-100 rounded-2xl animate-pulse">
      <div className="w-12 h-14 border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center mb-3">
        <Sparkles size={20} className="text-[#8C4B31]" />
      </div>
      <p className="text-xs font-semibold text-stone-600">Loading 3D bag...</p>
    </div>
  ),
});

export default function Home() {
  const { formatPrice } = useCurrency();
  
  // Adaptive 3D rendering: only render on desktop/tablet without data saver or reduced motion
  const [canRender3D, setCanRender3D] = useState(false);

  // Dynamic Content States
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<{
    company_name: string;
    contact_email: string;
    contact_phone: string;
  }>({
    company_name: "Ethiopia Arenguade Paper Product PLC",
    contact_email: "orders@arenguade.et",
    contact_phone: "+251 911 223 344",
  });
  const [productsLoading, setProductsLoading] = useState(true);
  const [workshopsLoading, setWorkshopsLoading] = useState(true);

  useEffect(() => {
    // 1. Device check for 3D hero
    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSaveData = (navigator as any).connection?.saveData === true;
    if (!isMobile && !prefersReducedMotion && !isSaveData) {
      setCanRender3D(true);
    }

    // 2. Fetch Featured Products from DB
    async function loadData() {
      try {
        setProductsLoading(true);
        const res = await fetch("/api/products?featured=true&pageSize=6");
        const json = await res.json();
        if (json.products && json.products.length > 0) {
          setFeaturedProducts(json.products);
        } else {
          const fallbackRes = await fetch("/api/products?pageSize=6");
          const fallbackJson = await fallbackRes.json();
          if (fallbackJson.products) setFeaturedProducts(fallbackJson.products);
        }
      } catch (e) {
        console.error("Products fetch error:", e);
      } finally {
        setProductsLoading(false);
      }

      // 3. Fetch Workshops from DB
      try {
        setWorkshopsLoading(true);
        const res = await fetch("/api/classes?upcoming=true&pageSize=2");
        const json = await res.json();
        if (json.classes) setWorkshops(json.classes);
      } catch (e) {
        console.error("Workshops fetch error:", e);
      } finally {
        setWorkshopsLoading(false);
      }

      // 4. Fetch Company Settings from /api/settings (backed by PostgreSQL public.settings)
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (json.settings) {
          setCompanySettings({
            company_name: json.settings.company_name || "Ethiopia Arenguade Paper Product",
            contact_email: json.settings.contact_email || "support@arenguadepaper.com",
            contact_phone: json.settings.contact_phone || "+251 911 741618",
          });
        }
      } catch {
        // Fallback handled safely
      }
    }

    loadData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen pt-16 sm:pt-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full py-12 md:py-20 border-b border-stone-200 bg-[#F9F6F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            
            {/* Left: Value Proposition */}
            <div className="md:col-span-7 flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/70 border border-stone-300 w-fit">
                <span className="w-2 h-2 rounded-full bg-[#1E3B2E]" />
                <span className="text-[11px] font-bold tracking-wider text-stone-700 uppercase">
                  Addis Ababa • Eco-Packaging
                </span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-stone-900 tracking-tight">
                Artisanal Kraft Packaging & Craft Academy
              </h1>

              <p className="text-stone-600 text-base sm:text-lg max-w-xl leading-relaxed">
                100% biodegradable kraft shopping bags, specialty coffee pouches, and luxury boutique carriers. 
                Learn the trade in our Addis Ababa workshops or join live online masterclasses.
              </p>

              {/* One primary action, one secondary */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link 
                  href="/products" 
                  className="btn-primary touch-target text-center"
                >
                  <ShoppingBag size={18} />
                  <span>View Our Portfolio</span>
                  <ArrowRight size={16} />
                </Link>

                <Link 
                  href="/learn/schedule" 
                  className="btn-secondary touch-target text-center"
                >
                  <BookOpen size={18} className="text-[#8C4B31]" />
                  <span>Join a Workshop</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 mt-2 border-t border-stone-200 flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-600">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-[#1E3B2E]" /> 100% Recyclable Kraft
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-[#1E3B2E]" /> CBE, Telebirr & Awash
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-[#1E3B2E]" /> Live WebRTC Video
                </span>
              </div>
            </div>

            {/* Right: 3D Studio Bag (Desktop) or Fast Optimized Static Image (Mobile) */}
            <div className="md:col-span-5">
              <div className="relative aspect-square w-full rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center overflow-hidden">
                {canRender3D ? (
                  <>
                    <ThreeBagScene />
                    <div className="absolute bottom-3 right-3 bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold text-stone-600 border border-stone-200 shadow-xs pointer-events-none">
                      360° Interactive Bag
                    </div>
                  </>
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/photo_3_2026-09-05_00-36-02.jpg"
                      alt="Ethiopia Arenguade Luxury Paper Bag"
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 500px"
                      className="object-cover"
                    />
                    <div className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white px-3 py-1 rounded-full text-[10px] font-medium">
                      Bespoke Ethiopian Kraft
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. SIGNATURE PRODUCTS */}
      <section className="py-16 bg-[#F9F6F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#8C4B31] uppercase">
                Featured Collections
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
                Our Packaging Portfolio
              </h2>
            </div>

            <Link 
              href="/products" 
              className="text-xs font-bold text-[#1E3B2E] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View All Products</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {productsLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="app-card animate-pulse h-80 flex flex-col justify-between">
                  <div className="h-44 bg-stone-100 rounded-xl mb-4" />
                  <div className="h-4 bg-stone-100 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-stone-100 rounded w-full" />
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => {
                const img = (product.images && product.images[0]) || "/images/photo_6_2026-09-05_00-36-03.jpg";
                return (
                  <div key={product.id} className="app-card flex flex-col justify-between hover:border-stone-400 transition-colors">
                    <div>
                      <div className="relative h-48 w-full rounded-xl overflow-hidden mb-4 bg-stone-100">
                        <Image 
                          src={img} 
                          alt={product.name} 
                          fill 
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover" 
                        />
                        <span className="absolute top-2.5 left-2.5 bg-[#1E3B2E] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {product.category || "Kraft"}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-stone-900 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                        {product.description || "Artisanal biodegradable packaging manufactured in Addis Ababa."}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase">Price</span>
                        <span className="text-base font-bold text-[#8C4B31]">{formatPrice(product.price)}</span>
                      </div>
                      <Link 
                        href={`/products/${product.id}`}
                        className="btn-primary touch-target text-xs py-2 px-4"
                      >
                        Order Now
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 text-stone-500 app-card">
                Products catalog updating. Please check back shortly.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. HOW LEARNING WORKS (ACADEMY & WORKSHOPS) */}
      <section className="py-16 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#8C4B31] uppercase">
                Arenguade Craft Academy
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
                How Learning Works
              </h2>
            </div>

            <Link 
              href="/learn/schedule" 
              className="text-xs font-bold text-[#1E3B2E] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Full Schedule & Booking</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* 2 Formats: In-Person vs Live Online */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="app-card border-stone-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8C4B31]/10 text-[#8C4B31] text-xs font-bold mb-3">
                <MapPin size={13} />
                <span>In-Person Addis Ababa Studio</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">Hands-On Apprenticeship</h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                Work alongside master artisans inside our plant in Bole Sub-City. Learn paper cutting, scoring, bottom reinforcement, cord handle attachment, and box die-making. All materials included.
              </p>
              <Link href="/learn/schedule" className="text-xs font-bold text-[#1E3B2E] hover:underline inline-flex items-center gap-1">
                View Studio Dates <ArrowRight size={13} />
              </Link>
            </div>

            <div className="app-card border-stone-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] text-xs font-bold mb-3">
                <Video size={13} />
                <span>LiveKit Interactive Online</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">Real-Time Global Masterclasses</h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                Interactive video classrooms powered by low-latency LiveKit WebRTC. Ask questions in real time, unmute to speak with the teacher, and receive digital certification upon completion.
              </p>
              <Link href="/learn/schedule" className="text-xs font-bold text-[#1E3B2E] hover:underline inline-flex items-center gap-1">
                View Live Streams <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Upcoming Class Sessions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Upcoming Classes Ready for Registration
            </h4>

            {workshopsLoading ? (
              <div className="space-y-3">
                <div className="app-card animate-pulse h-24" />
                <div className="app-card animate-pulse h-24" />
              </div>
            ) : workshops.length > 0 ? (
              workshops.map((session) => {
                const isLive = session.type === "live";
                const dateStr = session.starts_at 
                  ? new Date(session.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Upcoming";

                return (
                  <div key={session.id} className="app-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isLive ? "bg-[#1E3B2E] text-white" : "bg-[#8C4B31] text-white"
                        }`}>
                          {isLive ? "LiveKit Online" : "In-Person Studio"}
                        </span>
                        <span className="text-[11px] text-stone-500 flex items-center gap-1 font-medium">
                          <Calendar size={12} /> {dateStr}
                        </span>
                      </div>
                      <h4 className="font-serif text-base font-bold text-stone-900">{session.title}</h4>
                      <p className="text-xs text-stone-500 mt-0.5">{session.location || "Addis Ababa"}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                      <span className="font-bold text-[#8C4B31] text-sm">{formatPrice(session.price || 0)}</span>
                      <Link 
                        href="/learn/schedule"
                        className="btn-primary touch-target text-xs py-2 px-5"
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="app-card text-center py-6 text-xs text-stone-500">
                New sessions will be announced soon.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. CONTACT & FACTORY SETTLEMENT */}
      <section className="py-14 bg-[#F9F6F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="app-card bg-stone-900 text-stone-200 p-6 sm:p-10 border-stone-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-[#D7A977] uppercase tracking-wider">
                  Contact & Factory Inquiries
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                  {companySettings.company_name}
                </h3>
                <p className="text-xs sm:text-sm text-stone-400 mt-2 leading-relaxed">
                  Plant & Showroom: Bole Sub-City, Kebele 03, Addis Ababa, Ethiopia. 
                  Wholesale orders, bespoke branded packaging, and academy partnerships.
                </p>

                <div className="flex flex-col gap-2 mt-5 text-xs text-stone-300">
                  <span className="inline-flex items-center gap-2">
                    <Phone size={14} className="text-[#D7A977]" /> {companySettings.contact_phone}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Mail size={14} className="text-[#D7A977]" /> {companySettings.contact_email}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Building2 size={14} className="text-[#D7A977]" /> Settlement Banks: CBE, Telebirr, Awash
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 md:justify-end">
                <Link 
                  href="/products" 
                  className="btn-primary bg-[#8C4B31] hover:bg-[#A3593B] touch-target text-center text-xs"
                >
                  <ShoppingBag size={15} />
                  <span>Order Packaging</span>
                </Link>
                <Link 
                  href="/design-submission" 
                  className="btn-secondary bg-stone-800 text-white border-stone-700 hover:bg-stone-700 touch-target text-center text-xs"
                >
                  <Sparkles size={15} />
                  <span>Custom Design Studio</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
