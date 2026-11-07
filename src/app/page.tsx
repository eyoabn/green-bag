"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCurrency } from "@/components/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
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
  const { t, lang } = useLanguage();
  
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
  const [announcement, setAnnouncement] = useState<{ text: string; visible: boolean } | null>(null);
  const [heroContent, setHeroContent] = useState<{ headline?: string; subline?: string }>({});
  const [cmsContent, setCmsContent] = useState<any>({});

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
          if (fallbackJson.products && fallbackJson.products.length > 0) {
            setFeaturedProducts(fallbackJson.products);
          } else {
            setFeaturedProducts([
              {
                id: "p1",
                name: "Addis Corporate Executive Gift Bag",
                description: "Sleek die-cut handle bag with matte black lamination and silver foil stamping. Ideal for corporate events and high-end gifting.",
                images: ["/images/photo_17_2026-09-05_00-36-03.jpg"],
                gsm: 220,
                handle_type: "Twisted Handle",
              },
              {
                id: "p2",
                name: "Eco-Friendly Recycled Grocery Sack",
                description: "Unbranded brown grocery sack for organic markets, zero-waste stores, and delivery services. Our most sustainable carryall.",
                images: ["/images/photo_15_2026-09-05_00-36-03.jpg"],
                gsm: 220,
                handle_type: "Twisted Handle",
              },
              {
                id: "p3",
                name: "Vero Tiramisu Artisan Sleeve Box",
                description: "Food-grade specialty sleeve box for premium tiramisu and pastries. Rigid outer sleeve with grease-resistant inner tray.",
                images: ["/images/photo_16_2026-09-05_00-36-03.jpg"],
                gsm: 220,
                handle_type: "Twisted Handle",
              },
            ]);
          }
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
        if (json.classes && json.classes.length > 0) {
          setWorkshops(json.classes);
        } else {
          setWorkshops([
            {
              id: "ws-1",
              type: "in_person",
              title: "Weekend Paper Craft Intensive",
              location: "Arenguade Workshop, Bole Sub-City, Addis Ababa",
              price: 600,
              starts_at: "2026-11-07T09:00:00Z",
            },
            {
              id: "ws-2",
              type: "live",
              title: "Paper Bag Making — Beginner Live Workshop",
              location: "Addis Ababa",
              price: 450,
              starts_at: "2026-11-09T14:00:00Z",
            },
          ]);
        }
      } catch (e) {
        console.error("Workshops fetch error:", e);
        setWorkshops([
          {
            id: "ws-1",
            type: "in_person",
            title: "Weekend Paper Craft Intensive",
            location: "Arenguade Workshop, Bole Sub-City, Addis Ababa",
            price: 600,
            starts_at: "2026-11-07T09:00:00Z",
          },
          {
            id: "ws-2",
            type: "live",
            title: "Paper Bag Making — Beginner Live Workshop",
            location: "Addis Ababa",
            price: 450,
            starts_at: "2026-11-09T14:00:00Z",
          },
        ]);
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
          // Load admin-controlled homepage content
          const content = json.settings.homepage_content || {};
          setCmsContent(content);
          if (content.announcement_visible && content.announcement_text) {
            setAnnouncement({ text: content.announcement_text, visible: true });
          }
          if (content.hero_headline || content.hero_subline) {
            setHeroContent({
              headline: content.hero_headline || undefined,
              subline: content.hero_subline || undefined,
            });
          }
        }
      } catch {
        // Fallback handled safely
      }
    }

    loadData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen pt-16 sm:pt-20 pb-20 md:pb-0">

      {/* Admin Announcement Banner */}
      {announcement?.visible && announcement.text && (
        <div className="bg-[#1E3B2E] text-[#E0B382] text-center text-xs font-semibold py-2 px-4 tracking-wide">
          {announcement.text}
        </div>
      )}
      
      {/* 1. HERO SECTION */}
      {/* 1A. MOBILE HERO (Reference Design Architecture) */}
      <section className="md:hidden w-full bg-[#F9F6F0]">
        <div className="relative h-[104vw] max-h-[420px] overflow-hidden bg-[#d6c4aa]">
          <Image
            src="/images/photo_3_2026-09-05_00-36-02.jpg"
            alt="Unbleached kraft paper shopping bag in a warm studio setting"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-950/60 pointer-events-none" />
          
          {/* Craft Seal Stamp (AA Addis Ababa) */}
          <div className="craft-seal" aria-hidden="true">
            <span>HANDCRAFTED</span>
            <strong>AA</strong>
            <span>ADDIS ABABA</span>
          </div>

          {/* Status Dot Caption */}
          <div className="image-caption">
            <span className="status-dot" />
            <span>Made to order in Addis</span>
          </div>
        </div>

        <div className="px-5 pt-7 pb-4">
          <div className="eyebrow">Packaging with provenance</div>
          <h1 className="font-serif text-[38px] font-semibold leading-[1.02] tracking-tight text-stone-900 mt-2 mb-3">
            Made by hand.<br />Built for your brand.
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6">
            Biodegradable paper packaging, shaped by Ethiopian craft and engineered for modern retail.
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <Link 
              href="/products" 
              className="btn-primary text-xs py-3 rounded-xl touch-target text-center shadow-md shadow-[#1E3B2E]/10"
            >
              <span>Explore catalog</span>
              <ArrowRight size={15} />
            </Link>
            <Link 
              href="/learn/schedule" 
              className="btn-secondary text-xs py-3 rounded-xl touch-target text-center"
            >
              <span>Book workshop</span>
            </Link>
          </div>
        </div>

        {/* Mobile Trust Strip */}
        <div className="md:hidden">
          <div className="trust-strip hide-scrollbar mt-4">
            <div className="trust-chip">
              <strong>1.2M+</strong>
              <span>Bags produced</span>
            </div>
            <div className="trust-chip">
              <strong>50+</strong>
              <span>Enterprise clients</span>
            </div>
            <div className="trust-chip">
              <strong>100%</strong>
              <span>Recyclable Kraft</span>
            </div>
          </div>
        </div>
      </section>

      {/* 1B. DESKTOP HERO SECTION (Full 12-Column Responsive Layout) */}
      <section className="hidden md:block relative w-full py-12 md:py-20 border-b border-stone-200 bg-[#F9F6F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            
            {/* Left: Value Proposition */}
            <div className="md:col-span-7 flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-200/70 border border-stone-300 w-fit">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-white/90 p-0.5 border border-stone-300/80 shrink-0">
                  <Image
                    src="/images/arenguade-icon-transparent.png"
                    alt="Arenguade Seal"
                    width={20}
                    height={20}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[11px] font-bold tracking-wider text-stone-700 uppercase">
                  {lang === "am" ? t.hero_badge : (cmsContent.hero_badge || "Addis Ababa • Artisanal Kraft Guild")}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.12] text-stone-900 tracking-tight">
                {lang === "am" ? t.hero_headline : (cmsContent.hero_headline || heroContent.headline || "Artisanal Kraft Packaging & Craft Academy")}
              </h1>

              <p className="text-stone-600 text-sm sm:text-lg max-w-xl leading-relaxed">
                {lang === "am" ? t.hero_subline : (cmsContent.hero_subline || heroContent.subline || "100% biodegradable kraft shopping bags, specialty coffee pouches, and luxury boutique carriers. Learn the trade in our Addis Ababa workshops or join live online masterclasses.")}
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link 
                  href="/products" 
                  className="btn-primary touch-target text-center"
                >
                  <ShoppingBag size={18} />
                  <span>{t.hero_cta_portfolio}</span>
                  <ArrowRight size={16} />
                </Link>

                <Link 
                  href="/design-submission" 
                  className="btn-secondary touch-target text-center"
                >
                  <BookOpen size={18} className="text-[#8C4B31]" />
                  <span>{t.hero_cta_design}</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 mt-2 border-t border-stone-200/90 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold text-stone-700">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100/90 border border-stone-200/80 shadow-2xs">
                  <CheckCircle2 size={14} className="text-[#1E3B2E]" /> {lang === "am" ? t.hero_trust_1 : (cmsContent.stat_1_val ? `${cmsContent.stat_1_val} ${cmsContent.stat_1_label}` : "1.2M+ Bags Produced")}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100/90 border border-stone-200/80 shadow-2xs">
                  <CheckCircle2 size={14} className="text-[#1E3B2E]" /> {lang === "am" ? t.hero_trust_2 : (cmsContent.stat_2_val ? `${cmsContent.stat_2_val} ${cmsContent.stat_2_label}` : "50+ Enterprise Clients")}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100/90 border border-stone-200/80 shadow-2xs">
                  <CheckCircle2 size={14} className="text-[#1E3B2E]" /> {lang === "am" ? t.hero_trust_3 : (cmsContent.stat_3_val ? `${cmsContent.stat_3_val} ${cmsContent.stat_3_label}` : "100% Recyclable Kraft")}
                </span>
              </div>
            </div>

            {/* Right: 3D Studio Bag */}
            <div className="md:col-span-5">
              <div className="relative aspect-square w-full rounded-3xl bg-white border border-stone-200/90 shadow-lg flex items-center justify-center overflow-hidden">
                {canRender3D ? (
                  <>
                    <ThreeBagScene />
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-[10px] font-bold text-stone-700 border border-stone-200 shadow-xs pointer-events-none">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-semibold">
                      <span className="bg-stone-900/80 backdrop-blur-md px-3 py-1 rounded-full shadow-xs">
                        Bespoke Ethiopian Kraft
                      </span>
                      <span className="bg-[#8C4B31]/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Addis Ababa
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. FACTORY CLIENT SHOWCASES */}
      <section className="py-12 md:py-16 bg-[#F9F6F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-8 gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#8C4B31] uppercase">
                <span className="md:hidden">{lang === "am" ? "የተመረጡ ሥራዎች • የኢትዮጵያ ምርቶች" : "Selected work • Made for Ethiopia’s originals"}</span>
                <span className="hidden md:inline">{lang === "am" ? "የፋብሪካ ውጤቶች • ልዩ የደንበኞች ሥራዎች" : "Factory Deliverables • Bespoke Client Works"}</span>
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
                {lang === "am" ? t.products_heading : (cmsContent.showcase_title || "Custom Packaging Showcase")}
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl">
                {lang === "am" ? t.products_subheading : (cmsContent.showcase_sub || "Real production runs manufactured exclusively for Ethiopian roasters, boutiques, and corporate clients. Every piece is tailor-made to brand specifications.")}
              </p>
            </div>

            <Link 
              href="/products" 
              className="text-xs font-bold text-[#1E3B2E] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>{t.products_view_all}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* 2A. MOBILE TOUCH CAROUSEL (Mobile Only - Strictly Hidden on Desktop >= 768px) */}
          <div className="block md:hidden" data-mobile-carousel="true">
            <div className="case-carousel hide-scrollbar -mx-4 px-4 pb-2">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((p) => {
                  const img = (p.images && p.images[0]) || "/images/photo_6_2026-09-05_00-36-03.jpg";
                  return (
                    <Link href={`/products/${p.id}`} key={p.id} className="case-card shrink-0 block">
                      <img src={img} alt={p.name} />
                      <div className="case-copy">
                        <span>{p.category || "Specialty Packaging"}</span>
                        <h3>{p.name}</h3>
                        <p>{p.description || "Custom biodegradable packaging manufactured with soy ink in Addis Ababa."}</p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <>
                  <article className="case-card shrink-0">
                    <img src="/images/photo_6_2026-09-05_00-36-03.jpg" alt="Premium coffee pouch" />
                    <div className="case-copy">
                      <span>Specialty coffee</span>
                      <h3>Rare Coffee Roasters</h3>
                      <p>Valve-sealed pouches, screen printed in two earthy tones.</p>
                    </div>
                  </article>
                  <article className="case-card shrink-0">
                    <img src="/images/photo_7_2026-09-05_00-36-03.jpg" alt="Luxury boutique bags" />
                    <div className="case-copy">
                      <span>Luxury retail</span>
                      <h3>Richo Boutique</h3>
                      <p>Cotton handles and a Tibeb-inspired border for a tactile finish.</p>
                    </div>
                  </article>
                </>
              )}
            </div>
          </div>

          {/* 2B. DESKTOP GRID */}
          <div className="hidden md:grid grid-cols-2 md:grid-cols-3 gap-6">
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
                          sizes="33vw"
                          className="object-cover" 
                        />
                        <span className="absolute top-2.5 left-2.5 bg-[#1E3B2E] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Factory Showcase
                        </span>
                        {product.client && (
                          <span className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-stone-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                            Client: {product.client}
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-lg font-bold text-stone-900 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                        {product.description || "Custom biodegradable packaging manufactured for client branding in Addis Ababa."}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-stone-500">
                        <span className="font-bold text-stone-800 block">{product.gsm || 220} GSM Kraft</span>
                        <span>{product.handle_type || product.handleType || "Twisted Handle"}</span>
                      </div>
                      <Link 
                        href={`/products/${product.id}`}
                        className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white transition-all text-xs font-bold py-2 px-4 rounded-xl shadow-xs"
                      >
                        {t.products_view_details}
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

      {/* 2C. OUR PROCESS SECTION (Mobile Reference Feature - Hidden on Desktop) */}
      <section className="md:hidden py-12 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-6">
            <span className="eyebrow">Our process</span>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">
              From your sketch to the street
            </h2>
            <p className="text-stone-600 text-xs mt-1">
              Direct factory production pipeline designed for Ethiopian businesses.
            </p>
          </div>

          <div className="process-list max-w-xl">
            <article className="process-item">
              <span>01</span>
              <div>
                <h3>Share your vision</h3>
                <p>Choose a form, material and print finish in our custom studio.</p>
              </div>
            </article>
            <article className="process-item">
              <span>02</span>
              <div>
                <h3>Prototype in Addis</h3>
                <p>Our makers test structure, ink adherence and handle load capacity.</p>
              </div>
            </article>
            <article className="process-item">
              <span>03</span>
              <div>
                <h3>Approve & produce</h3>
                <p>Track your batch from press to local delivery across Addis Ababa.</p>
              </div>
            </article>
          </div>

          <Link 
            href="/design-submission" 
            className="btn-primary w-full text-xs py-3 px-6 rounded-xl inline-flex items-center justify-center gap-2 shadow-md shadow-[#1E3B2E]/10"
          >
            <span>Start a custom project</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>


      {/* 2D. ACADEMY MOBILE BANNER (Reference Visual Feature) */}
      <div className="md:hidden">
        <section className="academy-banner">
          <img src="/images/photo_2_2026-09-05_00-36-02.jpg" alt="Handmade Ethiopian paper craft artisans" />
          <div className="academy-overlay">
            <div className="eyebrow">Arenguade craft academy</div>
            <h2>Learn the craft.<br />Build a livelihood.</h2>
            <p>Hands-on studio courses and live masterclasses led by working Ethiopian makers.</p>
            <Link 
              href="/learn/schedule" 
              className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-white/40 text-xs py-2.5 px-5 rounded-xl inline-flex items-center gap-2"
            >
              <span>Explore classes</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </div>

      {/* 3. HOW LEARNING WORKS (ACADEMY & WORKSHOPS) */}
      <section className="py-16 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-[#8C4B31] uppercase">
                {t.academy_badge}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
                {t.academy_heading}
              </h2>
            </div>

            <Link 
              href="/learn/schedule" 
              className="text-xs font-bold text-[#1E3B2E] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>{t.catalog_workshops}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* 2 Formats: In-Person vs Live Online */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="app-card border-stone-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8C4B31]/10 text-[#8C4B31] text-xs font-bold mb-3">
                <MapPin size={13} />
                <span>{lang === "am" ? "የአዲስ አበባ ስቱዲዮ (በአካል)" : "In-Person Addis Ababa Studio"}</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                {lang === "am" ? "የእጅ ሙያ ስልጠና" : "Hands-On Apprenticeship"}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                {lang === "am" 
                  ? "በቦሌ ክፍለ ከተማ ከሚገኘው የዕደ-ጥበብ ባለሙያዎቻችን ጋር አብረው ይስሩ። የወረቀት መቁረጥ፣ ማጠፍ፣ የታችኛውን ክፍል ማጠናከር እና የማሸጊያ ሳጥን ዲዛይን ይማሩ። ሁሉም ቁሳቁሶች ተዘጋጅተዋል።" 
                  : "Work alongside master artisans inside our plant in Bole Sub-City. Learn paper cutting, scoring, bottom reinforcement, cord handle attachment, and box die-making. All materials included."}
              </p>
              <Link href="/learn/schedule" className="text-xs font-bold text-[#1E3B2E] hover:underline inline-flex items-center gap-1">
                {lang === "am" ? "የስቱዲዮ ቀናትን ይመልከቱ" : "View Studio Dates"} <ArrowRight size={13} />
              </Link>
            </div>

            <div className="app-card border-stone-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] text-xs font-bold mb-3">
                <Video size={13} />
                <span>{lang === "am" ? "በቀጥታ ስርጭት (LiveKit)" : "LiveKit Interactive Online"}</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                {lang === "am" ? "የቀጥታ ስርጭት ማስተርክላስ" : "Real-Time Global Masterclasses"}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                {lang === "am"
                  ? "በዝቅተኛ መዘግየት ባለው LiveKit WebRTC የሚሰራ የቀጥታ ቪዲዮ ክፍል። ጥያቄዎችን በቅጽበት ይጠይቁ፣ ከአስተማሪው ጋር ይነጋገሩ እና ሲያጠናቅቁ ዲጂታል ሰርተፍኬት ይቀበሉ።"
                  : "Interactive video classrooms powered by low-latency LiveKit WebRTC. Ask questions in real time, unmute to speak with the teacher, and receive digital certification upon completion."}
              </p>
              <Link href="/learn/schedule" className="text-xs font-bold text-[#1E3B2E] hover:underline inline-flex items-center gap-1">
                {lang === "am" ? "የቀጥታ ስርጭቶችን ይመልከቱ" : "View Live Streams"} <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Upcoming Class Sessions (Configurable by Admin in Settings) */}
          {(cmsContent?.classes_section_visible !== false) && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  {lang === "am" ? t.academy_upcoming_title : (cmsContent?.classes_section_title || "Upcoming Classes Ready for Registration")}
                </h4>
                {cmsContent?.classes_section_sub && (
                  <p className="text-xs text-stone-500 mt-1">
                    {cmsContent.classes_section_sub}
                  </p>
                )}
              </div>

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
                            {isLive ? (lang === "am" ? "በቀጥታ ስርጭት" : "LiveKit Online") : (lang === "am" ? "በአካል ስቱዲዮ" : "In-Person Studio")}
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
                          {t.academy_register_btn}
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="app-card text-center py-6 text-xs text-stone-500">
                  {lang === "am" ? "አዳዲስ ስልጠናዎች በቅርቡ ይፋ ይሆናሉ።" : "New sessions will be announced soon."}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. CONTACT & FACTORY SETTLEMENT */}
      <section className="py-14 bg-[#F9F6F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="app-card bg-stone-900 text-stone-200 p-6 sm:p-10 border-stone-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-bold text-[#D7A977] uppercase tracking-wider">
                  {lang === "am" ? "የፋብሪካ አድራሻ እና ግንኙነት" : "Contact & Factory Inquiries"}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                  {companySettings.company_name}
                </h3>
                <p className="text-xs sm:text-sm text-stone-400 mt-2 leading-relaxed">
                  {lang === "am" 
                    ? "ፋብሪካ እና ሾውሩም፦ ቦሌ ክፍለ ከተማ፣ ቀበሌ 03፣ አዲስ አበባ፣ ኢትዮጵያ። የጅምላ ትዕዛዞች፣ የብራንድ ማሸጊያዎች እና የስልጠና አጋርነቶች።"
                    : "Plant & Showroom: Bole Sub-City, Kebele 03, Addis Ababa, Ethiopia. Wholesale orders, bespoke branded packaging, and academy partnerships."}
                </p>

                <div className="flex flex-col gap-2 mt-5 text-xs text-stone-300">
                  <span className="inline-flex items-center gap-2">
                    <Phone size={14} className="text-[#D7A977]" /> {companySettings.contact_phone}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Mail size={14} className="text-[#D7A977]" /> {companySettings.contact_email}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Building2 size={14} className="text-[#D7A977]" /> {lang === "am" ? "የክፍያ ባንኮች፦ ንግድ ባንክ፣ ቴሌብር፣ አዋሽ" : "Settlement Banks: CBE, Telebirr, Awash"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 md:justify-end">
                <Link 
                  href="/products" 
                  className="btn-primary bg-[#8C4B31] hover:bg-[#A3593B] touch-target text-center text-xs"
                >
                  <ShoppingBag size={15} />
                  <span>{lang === "am" ? "ማሸጊያ እዘዝ" : "Order Packaging"}</span>
                </Link>
                <Link 
                  href="/design-submission" 
                  className="btn-secondary bg-stone-800 text-white border-stone-700 hover:bg-stone-700 touch-target text-center text-xs"
                >
                  <Sparkles size={15} />
                  <span>{lang === "am" ? t.nav_design_studio : "Custom Design Studio"}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
