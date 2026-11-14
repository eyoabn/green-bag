"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCurrency } from "@/components/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeHref } from "@/utils/validation";
import { 
  ShoppingBag, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Video, 
  Calendar,
  Clock,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Building2
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

interface HomeClientProps {
  initialProducts?: any[];
  initialWorkshops?: any[];
  initialSettings?: any;
}

export default function HomeClient({
  initialProducts = [],
  initialWorkshops = [],
  initialSettings = null,
}: HomeClientProps) {
  const { formatPrice } = useCurrency();
  const { t, lang } = useLanguage();

  // Adaptive 3D rendering
  const [canRender3D, setCanRender3D] = useState(false);

  // Dynamic Content States initialized directly from Server SSR/ISR props
  const [featuredProducts, setFeaturedProducts] = useState<any[]>(initialProducts);
  const [workshops, setWorkshops] = useState<any[]>(initialWorkshops);
  const [cmsContent, setCmsContent] = useState<any>(initialSettings?.homepage_content || {});
  
  const [companySettings, setCompanySettings] = useState({
    company_name: initialSettings?.company_name || "Ethiopia Arenguade Paper Product PLC",
    contact_email: initialSettings?.contact_email || "orders@arenguade.et",
    contact_phone: initialSettings?.contact_phone || "+251 911 223 344",
  });

  useEffect(() => {
    setFeaturedProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    setWorkshops(initialWorkshops);
  }, [initialWorkshops]);

  useEffect(() => {
    if (initialSettings?.homepage_content) {
      setCmsContent(initialSettings.homepage_content);
    }
    if (initialSettings?.company_name) {
      setCompanySettings({
        company_name: initialSettings.company_name,
        contact_email: initialSettings.contact_email || "orders@arenguade.et",
        contact_phone: initialSettings.contact_phone || "+251 911 223 344",
      });
    }
  }, [initialSettings]);

  useEffect(() => {
    // Client-side instant background revalidation to guarantee real-time reflection of admin modifications
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.settings?.homepage_content) {
          setCmsContent(data.settings.homepage_content);
        }
        if (data?.settings?.company_name) {
          setCompanySettings({
            company_name: data.settings.company_name,
            contact_email: data.settings.contact_email || "orders@arenguade.et",
            contact_phone: data.settings.contact_phone || "+251 911 223 344",
          });
        }
      })
      .catch(() => {});

    fetch("/api/products?pageSize=6", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
          setFeaturedProducts(data.products);
        }
      })
      .catch(() => {});
  }, []);

  const announcement = (cmsContent.announcement_visible && cmsContent.announcement_text)
    ? { text: cmsContent.announcement_text, visible: true }
    : null;

  // Hero section content from CMS (with robust fallbacks)
  const heroBadge = cmsContent.hero_badge || "Addis Ababa • Artisanal Kraft Guild";
  const heroHeadline = cmsContent.hero_headline || "Artisanal Kraft Packaging & Craft Academy";
  const heroSubline = cmsContent.hero_subline || "100% biodegradable kraft shopping bags, specialty coffee pouches, and luxury boutique carriers. Learn the trade in our Addis Ababa workshops or join live online masterclasses.";
  const heroImage = sanitizeHref(cmsContent.hero_image, "/images/photo_3_2026-09-05_00-36-02.jpg");
  const heroCta1Text = cmsContent.hero_cta1_text || "Explore catalog";
  const heroCta1Link = sanitizeHref(cmsContent.hero_cta1_link, "/products");
  const heroCta2Text = cmsContent.hero_cta2_text || "Book workshop";
  const heroCta2Link = sanitizeHref(cmsContent.hero_cta2_link, "/learn/schedule");

  // Mobile-specific UI / UX controls from CMS
  const mobileHeroImage = sanitizeHref(cmsContent.mobile_hero_image, heroImage);
  const mobileEyebrow = cmsContent.mobile_eyebrow || heroBadge;
  const mobileHeadline = cmsContent.mobile_headline || "Made by hand. Built for your brand.";
  const mobileSubline = cmsContent.mobile_subline || "Biodegradable paper packaging, shaped by Ethiopian craft and engineered for modern retail.";
  const craftSealTop = cmsContent.craft_seal_top || "HANDCRAFTED";
  const craftSealCenter = cmsContent.craft_seal_center || "AA";
  const craftSealBottom = cmsContent.craft_seal_bottom || "ADDIS ABABA";
  const imageCaption = cmsContent.image_caption || "Made to order in Addis";

  // Mobile process section from CMS
  const processTitle = cmsContent.process_title || "From your sketch to the street";
  const processSub = cmsContent.process_sub || "Direct factory production pipeline designed for Ethiopian businesses.";

  // Mobile academy banner from CMS
  const academyBannerEyebrow = cmsContent.academy_banner_eyebrow || "Arenguade craft academy";
  const academyBannerHeadline = cmsContent.academy_banner_headline || "Learn the craft. Build a livelihood.";
  const academyBannerSub = cmsContent.academy_banner_sub || "Hands-on studio courses and live masterclasses led by working Ethiopian makers.";
  const academyBannerImage = sanitizeHref(cmsContent.academy_banner_image, "/images/photo_2_2026-09-05_00-36-02.jpg");

  // Trust statistics from CMS
  const stat1Val = cmsContent.stat_1_val || "1.2M+";
  const stat1Label = cmsContent.stat_1_label || "Bags Produced";
  const stat2Val = cmsContent.stat_2_val || "50+";
  const stat2Label = cmsContent.stat_2_label || "Enterprise Clients";
  const stat3Val = cmsContent.stat_3_val || "100%";
  const stat3Label = cmsContent.stat_3_label || "Recyclable Kraft";

  const heroContent = {
    headline: heroHeadline,
    subline: heroSubline,
  };

  useEffect(() => {
    // Device check for 3D hero
    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSaveData = (navigator as any).connection?.saveData === true;
    if (!isMobile && !prefersReducedMotion && !isSaveData) {
      setCanRender3D(true);
    }
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
      {/* 1A. MOBILE HERO */}
      <section className="md:hidden w-full bg-[#F9F6F0]">
        <div className="relative h-[104vw] max-h-[420px] overflow-hidden bg-[#d6c4aa]">
          <Image
            src={mobileHeroImage}
            alt={mobileHeadline}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-950/60 pointer-events-none" />
          
          {/* Craft Seal Stamp (AA Addis Ababa) */}
          <div className="craft-seal" aria-hidden="true">
            <span>{craftSealTop}</span>
            <strong>{craftSealCenter}</strong>
            <span>{craftSealBottom}</span>
          </div>

          {/* Status Dot Caption */}
          <div className="image-caption">
            <span className="status-dot" />
            <span>{imageCaption}</span>
          </div>
        </div>

        <div className="px-5 pt-7 pb-4">
          <div className="eyebrow">{mobileEyebrow}</div>
          <h1 className="font-serif text-[38px] font-semibold leading-[1.02] tracking-tight text-stone-900 mt-2 mb-3 whitespace-pre-line">
            {mobileHeadline}
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-6">
            {mobileSubline}
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <Link 
              href={heroCta1Link} 
              className="btn-primary text-xs py-3 rounded-xl touch-target text-center shadow-md shadow-[#1E3B2E]/10"
            >
              <span>{heroCta1Text}</span>
              <ArrowRight size={15} />
            </Link>
            <Link 
              href={heroCta2Link} 
              className="btn-secondary text-xs py-3 rounded-xl touch-target text-center"
            >
              <span>{heroCta2Text}</span>
            </Link>
          </div>
        </div>

        {/* Mobile Trust Strip */}
        <div className="md:hidden">
          <div className="trust-strip hide-scrollbar mt-4">
            <div className="trust-chip">
              <strong>{stat1Val}</strong>
              <span>{stat1Label}</span>
            </div>
            <div className="trust-chip">
              <strong>{stat2Val}</strong>
              <span>{stat2Label}</span>
            </div>
            <div className="trust-chip">
              <strong>{stat3Val}</strong>
              <span>{stat3Label}</span>
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
                  {cmsContent.hero_badge || (lang === "am" ? t.hero_badge : heroBadge)}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.12] text-stone-900 tracking-tight">
                {cmsContent.hero_headline || (lang === "am" ? t.hero_headline : heroHeadline)}
              </h1>

              <p className="text-stone-600 text-sm sm:text-lg max-w-xl leading-relaxed">
                {cmsContent.hero_subline || (lang === "am" ? t.hero_subline : heroSubline)}
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link 
                  href={heroCta1Link} 
                  className="btn-primary touch-target text-center"
                >
                  <ShoppingBag size={18} />
                  <span>{heroCta1Text || t.hero_cta_portfolio}</span>
                  <ArrowRight size={16} />
                </Link>

                <Link 
                  href={heroCta2Link} 
                  className="btn-secondary touch-target text-center"
                >
                  <BookOpen size={18} className="text-[#8C4B31]" />
                  <span>{heroCta2Text || t.hero_cta_design}</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 mt-2 border-t border-stone-200/90 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold text-stone-700">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100/90 border border-stone-200/80 shadow-2xs">
                  <CheckCircle2 size={14} className="text-[#1E3B2E]" /> {stat1Val} {stat1Label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100/90 border border-stone-200/80 shadow-2xs">
                  <CheckCircle2 size={14} className="text-[#1E3B2E]" /> {stat2Val} {stat2Label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100/90 border border-stone-200/80 shadow-2xs">
                  <CheckCircle2 size={14} className="text-[#1E3B2E]" /> {stat3Val} {stat3Label}
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
                      src={heroImage}
                      alt={heroHeadline}
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

          {/* 2A. MOBILE TOUCH CAROUSEL */}
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
                <div className="col-span-full text-center py-6 text-stone-500">
                  Products catalog updating.
                </div>
              )}
            </div>
          </div>

          {/* 2B. DESKTOP GRID */}
          <div className="hidden md:grid grid-cols-2 md:grid-cols-3 gap-6">
            {featuredProducts.length > 0 ? (
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

      {/* 2C. OUR PROCESS SECTION */}
      <section className="md:hidden py-12 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-6">
            <span className="eyebrow">Our process</span>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">
              {processTitle}
            </h2>
            <p className="text-stone-600 text-xs mt-1">
              {processSub}
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

      {/* 2D. ACADEMY MOBILE BANNER */}
      <div className="md:hidden">
        <section className="academy-banner">
          <img src={academyBannerImage} alt="Ethiopian paper craft artisans" />
          <div className="academy-overlay">
            <div className="eyebrow">{academyBannerEyebrow}</div>
            <h2 className="whitespace-pre-line">{academyBannerHeadline}</h2>
            <p>{academyBannerSub}</p>
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
      <section className="py-20 bg-[#FAF7F2] border-y border-stone-300/80 relative overflow-hidden">
        {/* Subtle decorative background blur */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#8C4B31]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#1E3B2E]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          
          {/* Section Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8C4B31]/10 border border-[#8C4B31]/20 text-[#8C4B31] text-xs font-bold uppercase tracking-widest mb-3">
                <Sparkles size={13} />
                <span>{t.academy_badge}</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 tracking-tight">
                {t.academy_heading}
              </h2>
              <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                {lang === "am" 
                  ? "በአዲስ አበባ ዋናው ፋብሪካችን ውስጥ ከዋና የእጅ ጥበብ ባለሙያዎች ጋር ይስሩ ወይም በዓለም ዙሪያ በሚተላለፍ የቀጥታ ስርጭት ስልጠና ይሳተፉ።"
                  : "Empowering Ethiopian makers, retail entrepreneurs, and global designers with hands-on studio apprenticeships in Addis Ababa and real-time interactive masterclasses streaming worldwide."}
              </p>
            </div>

            <Link 
              href="/learn/schedule" 
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#1E3B2E] hover:bg-[#8C4B31] px-5 py-3 rounded-full transition-all shadow-sm hover:shadow-md self-start md:self-auto shrink-0"
            >
              <span>{t.catalog_workshops}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Desktop Rich Editorial 2-Column Tracks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14">
            
            {/* Track 1: In-Person Addis Ababa Studio */}
            <div className="group rounded-3xl bg-white border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-stone-300 transition-all duration-300 flex flex-col justify-between">
              <div>
                {/* Visual Header with Real Studio Photography */}
                <div className="relative h-60 w-full overflow-hidden bg-stone-200">
                  <Image
                    src="/images/photo_2_2026-09-05_00-36-02.jpg"
                    alt="Artisans at work in Addis Ababa studio"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
                  
                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8C4B31] text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                      <MapPin size={11} />
                      <span>{lang === "am" ? "የአዲስ አበባ ስቱዲዮ" : "Bole Studio • Addis Ababa"}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-stone-900 text-[10px] font-bold shadow-xs">
                      {lang === "am" ? "ሙሉ ቁሳቁስ ተዘጋጅቷል" : "All Materials Included"}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[11px] font-bold text-[#E0B382] uppercase tracking-wider block mb-0.5">
                      {lang === "am" ? "በአካል ስልጠና" : "Physical Studio Apprenticeship"}
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-white drop-shadow-xs">
                      {lang === "am" ? "የእጅ ሙያ ስልጠና" : "Hands-On Craft Apprenticeship"}
                    </h3>
                  </div>
                </div>

                {/* Description & Syllabus Highlights */}
                <div className="p-6 sm:p-8 space-y-4">
                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                    {lang === "am" 
                      ? "በቦሌ ክፍለ ከተማ ከሚገኘው የዕደ-ጥበብ ባለሙያዎቻችን ጋር አብረው ይስሩ። የወረቀት መቁረጥ፣ ማጠፍ፣ የታችኛውን ክፍል ማጠናከር እና የማሸጊያ ሳጥን ዲዛይን ይማሩ።" 
                      : "Work alongside veteran master artisans inside our working plant in Bole Sub-City. Master tactile creasing, rotary scoring, heavy-duty bottom gusset reinforcement, and twisted cord handle attachment."}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <div className="flex items-center gap-2.5 text-xs text-stone-700 font-medium">
                      <CheckCircle2 size={15} className="text-[#8C4B31] shrink-0" />
                      <span>{lang === "am" ? "በእጅዎ የሰሩትን 20 ቦርሳዎች ይዘው ይሄዳሉ" : "Build and take home 20+ custom boutique bags made by your own hands"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-stone-700 font-medium">
                      <CheckCircle2 size={15} className="text-[#8C4B31] shrink-0" />
                      <span>{lang === "am" ? "የወረቀት መቁረጫ እና ማጠፊያ ማሽኖችን መጠቀም" : "Hands-on instruction on industrial rotary slitting and die-cutting tooling"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-stone-700 font-medium">
                      <CheckCircle2 size={15} className="text-[#8C4B31] shrink-0" />
                      <span>{lang === "am" ? "የእደ-ጥበብ ሰርተፍኬት ይሰጣል" : "Official Ethiopian Packaging Guild Certificate of Craftsmanship"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2">
                <Link 
                  href="/learn/schedule" 
                  className="w-full py-3 px-5 rounded-2xl bg-stone-100 hover:bg-[#8C4B31] text-stone-800 hover:text-white text-xs font-bold transition-all flex items-center justify-between group-hover:bg-[#8C4B31] group-hover:text-white"
                >
                  <span>{lang === "am" ? "የስቱዲዮ ቀናትን ይመልከቱ" : "View In-Person Studio Schedule"}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Track 2: LiveKit Interactive WebRTC Masterclass */}
            <div className="group rounded-3xl bg-white border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-stone-300 transition-all duration-300 flex flex-col justify-between">
              <div>
                {/* Visual Header with Real Workshop Setup */}
                <div className="relative h-60 w-full overflow-hidden bg-stone-200">
                  <Image
                    src="/images/photo_1_2026-09-05_00-36-02.jpg"
                    alt="LiveKit interactive workshop broadcast"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
                  
                  {/* Floating Badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3B2E] text-[#E0B382] text-[10px] font-bold uppercase tracking-wider shadow-md border border-[#E0B382]/30">
                      <Video size={11} className="text-emerald-400 animate-pulse" />
                      <span>{lang === "am" ? "በቀጥታ ስርጭት" : "LiveKit WebRTC HD Stream"}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-stone-900 text-[10px] font-bold shadow-xs">
                      {lang === "am" ? "የሁለትዮሽ ድምፅና ምስል" : "Live 2-Way Audio & Video"}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[11px] font-bold text-[#D7A977] uppercase tracking-wider block mb-0.5">
                      {lang === "am" ? "የቀጥታ ስርጭት ማስተርክላስ" : "Global Interactive Video Classroom"}
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-white drop-shadow-xs">
                      {lang === "am" ? "የቀጥታ ስርጭት ማስተርክላስ" : "Real-Time Masterclasses"}
                    </h3>
                  </div>
                </div>

                {/* Description & Syllabus Highlights */}
                <div className="p-6 sm:p-8 space-y-4">
                  <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                    {lang === "am"
                      ? "በዝቅተኛ መዘግየት ባለው LiveKit WebRTC የሚሰራ የቀጥታ ቪዲዮ ክፍል። ጥያቄዎችን በቅጽበት ይጠይቁ፣ ከአስተማሪው ጋር ይነጋገሩ እና ሲያጠናቅቁ ዲጂታል ሰርተፍኬት ይቀበሉ።"
                      : "Interactive digital video masterclasses powered by sub-second latency LiveKit WebRTC. Ask questions in real time, unmute to speak with master instructors, and inspect CAD dieline vector geometry from your laptop."}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-stone-100">
                    <div className="flex items-center gap-2.5 text-xs text-stone-700 font-medium">
                      <CheckCircle2 size={15} className="text-[#1E3B2E] shrink-0" />
                      <span>{lang === "am" ? "የቀጥታ ጥያቄ እና መልስ ከመምህሩ ጋር" : "Live two-way microphone Q&A and multi-angle camera feeds"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-stone-700 font-medium">
                      <CheckCircle2 size={15} className="text-[#1E3B2E] shrink-0" />
                      <span>{lang === "am" ? "የሚወርዱ የዲዛይን ፋይሎች (CAD/PDF)" : "Downloadable production dielines, vector dieline guides, and cutting templates"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-stone-700 font-medium">
                      <CheckCircle2 size={15} className="text-[#1E3B2E] shrink-0" />
                      <span>{lang === "am" ? "የዲጂታል ሰርተፍኬት" : "Digital verification badge & verifiable online completion credential"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2">
                <Link 
                  href="/learn/schedule" 
                  className="w-full py-3 px-5 rounded-2xl bg-stone-100 hover:bg-[#1E3B2E] text-stone-800 hover:text-white text-xs font-bold transition-all flex items-center justify-between group-hover:bg-[#1E3B2E] group-hover:text-white"
                >
                  <span>{lang === "am" ? "የቀጥታ ስርጭቶችን ይመልከቱ" : "View Live Stream Class Dates"}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

          </div>

          {/* Upcoming Class Sessions Schedule Board */}
          {(cmsContent?.classes_section_visible !== false) && (
            <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider font-mono">
                      {lang === "am" ? "የቀን መቁጠሪያ" : "Open Registration Calendar"}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                    {lang === "am" ? t.academy_upcoming_title : (cmsContent?.classes_section_title || "Upcoming Studio & Virtual Masterclasses")}
                  </h3>
                  {cmsContent?.classes_section_sub && (
                    <p className="text-xs text-stone-500 mt-1">
                      {cmsContent.classes_section_sub}
                    </p>
                  )}
                </div>

                <Link
                  href="/learn/schedule"
                  className="text-xs font-bold text-[#8C4B31] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>{lang === "am" ? "ሁሉንም ቀናት ይመልከቱ" : "Full Schedule & Calendar"}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {workshops.length > 0 ? (
                <div className="space-y-3">
                  {workshops.map((session) => {
                    const isLive = session.type === "live";
                    const startDateObj = session.starts_at ? new Date(session.starts_at) : null;
                    const monthStr = startDateObj ? startDateObj.toLocaleDateString("en-US", { month: "short" }) : "TBA";
                    const dayStr = startDateObj ? startDateObj.toLocaleDateString("en-US", { day: "numeric" }) : "--";
                    const timeStr = startDateObj ? startDateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";

                    return (
                      <div 
                        key={session.id} 
                        className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] hover:bg-stone-50 border border-stone-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start sm:items-center gap-4">
                          {/* Calendar date tile */}
                          <div className="w-14 h-14 rounded-2xl bg-white border border-stone-300 shadow-2xs flex flex-col items-center justify-center shrink-0 text-center">
                            <span className="text-[10px] font-bold text-[#8C4B31] uppercase tracking-wider leading-none">
                              {monthStr}
                            </span>
                            <span className="font-serif text-xl font-bold text-stone-900 leading-none mt-0.5">
                              {dayStr}
                            </span>
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                isLive ? "bg-[#1E3B2E] text-[#E0B382]" : "bg-[#8C4B31] text-white"
                              }`}>
                                {isLive ? (lang === "am" ? "በቀጥታ ስርጭት" : "LiveKit Online") : (lang === "am" ? "በአካል ስቱዲዮ" : "Bole Plant Studio")}
                              </span>
                              {timeStr && (
                                <span className="text-[11px] text-stone-500 font-mono flex items-center gap-1">
                                  <Clock size={11} />
                                  <span>{timeStr}</span>
                                </span>
                              )}
                            </div>
                            <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                              {session.title}
                            </h4>
                            <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                              <MapPin size={11} className="text-[#8C4B31]" />
                              <span>{session.location || "Bole Sub-City, Addis Ababa"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0">
                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 block uppercase font-bold">Tuition Fee</span>
                            <span className="font-serif font-bold text-[#8C4B31] text-base sm:text-lg">
                              {formatPrice(session.price || 0)}
                            </span>
                          </div>
                          
                          <Link 
                            href="/learn/schedule"
                            className="btn-primary touch-target text-xs py-2.5 px-6 shadow-sm hover:shadow-md"
                          >
                            <span>{t.academy_register_btn}</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-stone-500 text-xs">
                  {lang === "am" ? "አዳዲስ ስልጠናዎች በቅርቡ ይፋ ይሆናሉ።" : "New masterclasses will be published soon. Contact factory desk for private bookings."}
                </div>
              )}

              {/* Guild Guarantee Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-100 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </div>
                  <span><strong>Guild Certification:</strong> Recognized by Ethiopian packaging guilds</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#8C4B31]/10 text-[#8C4B31] flex items-center justify-center font-bold text-xs shrink-0">
                    🌿
                  </div>
                  <span><strong>100% Eco-Kraft:</strong> Biodegradable materials & soy-based inks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                    🏭
                  </div>
                  <span><strong>Factory Readiness:</strong> Direct pathways to commercial production</span>
                </div>
              </div>
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

