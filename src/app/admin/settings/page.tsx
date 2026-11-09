"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  AlertCircle, 
  Share2, 
  Clock,
  PenTool,
  Layers,
  Sparkles,
  Tag,
  Smartphone,
  Monitor,
  Upload,
  Palette,
  ArrowRight,
  ShoppingBag,
  BookOpen,
  CheckCircle2
} from "lucide-react";
import { DEFAULT_DESIGN_PRICING, DesignPricingConfig } from "@/utils/designPricing";

const FACTORY_PRESET_IMAGES = [
  { label: "Studio Kraft Bag (Default)", url: "/images/photo_3_2026-09-05_00-36-02.jpg" },
  { label: "Luxury Boutique Tote", url: "/images/photo_6_2026-09-05_00-36-03.jpg" },
  { label: "Coffee Roaster Carrier", url: "/images/photo_13_2026-09-05_00-36-03.jpg" },
  { label: "Workshop Dieline", url: "/images/photo_1_2026-09-05_00-36-02.jpg" },
  { label: "Artisans at Work", url: "/images/photo_2_2026-09-05_00-36-02.jpg" },
  { label: "Ribbon & Paper Rolls", url: "/images/photo_11_2026-09-05_00-36-03.jpg" },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"cms" | "company" | "pricing">("cms");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");

  // Company Legal Credentials
  const [companyName, setCompanyName] = useState("Ethiopia Arenguade Paper Product");
  const [contactPhone, setContactPhone] = useState("+251 911 223 344");
  const [contactEmail, setContactEmail] = useState("info@arenguadepaper.com");
  const [address, setAddress] = useState("Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia");
  const [taxId, setTaxId] = useState("ETH-TIN-2024-001");
  const [settlementDays, setSettlementDays] = useState(3);
  
  // Social Links
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("https://t.me/arenguadepaper");
  const [linkedin, setLinkedin] = useState("");
  const [tiktok, setTiktok] = useState("https://www.tiktok.com/@arenguadepaper");
  const [youtube, setYoutube] = useState("https://www.youtube.com/@arenguadepaper");

  // 1. Hero Content (Desktop & Global)
  const [heroBadge, setHeroBadge] = useState("Addis Ababa • Artisanal Kraft Guild");
  const [heroHeadline, setHeroHeadline] = useState("Artisanal Kraft Packaging & Craft Academy");
  const [heroSubline, setHeroSubline] = useState("100% biodegradable kraft shopping bags, specialty coffee pouches, and luxury boutique carriers. Learn the trade in our Addis Ababa workshops or join live online masterclasses.");
  const [heroImage, setHeroImage] = useState("/images/photo_3_2026-09-05_00-36-02.jpg");
  const [heroCta1Text, setHeroCta1Text] = useState("Explore catalog");
  const [heroCta1Link, setHeroCta1Link] = useState("/products");
  const [heroCta2Text, setHeroCta2Text] = useState("Book workshop");
  const [heroCta2Link, setHeroCta2Link] = useState("/learn/schedule");

  // 2. Mobile-Specific UI/UX
  const [mobileHeroImage, setMobileHeroImage] = useState("/images/photo_3_2026-09-05_00-36-02.jpg");
  const [mobileEyebrow, setMobileEyebrow] = useState("Packaging with provenance");
  const [mobileHeadline, setMobileHeadline] = useState("Made by hand. Built for your brand.");
  const [mobileSubline, setMobileSubline] = useState("Biodegradable paper packaging, shaped by Ethiopian craft and engineered for modern retail.");
  const [craftSealTop, setCraftSealTop] = useState("HANDCRAFTED");
  const [craftSealCenter, setCraftSealCenter] = useState("AA");
  const [craftSealBottom, setCraftSealBottom] = useState("ADDIS ABABA");
  const [imageCaption, setImageCaption] = useState("Made to order in Addis");

  // 3. Mobile Process & Academy Sections
  const [processTitle, setProcessTitle] = useState("From your sketch to the street");
  const [processSub, setProcessSub] = useState("Direct factory production pipeline designed for Ethiopian businesses.");
  const [academyBannerEyebrow, setAcademyBannerEyebrow] = useState("Arenguade craft academy");
  const [academyBannerHeadline, setAcademyBannerHeadline] = useState("Learn the craft. Build a livelihood.");
  const [academyBannerSub, setAcademyBannerSub] = useState("Hands-on studio courses and live masterclasses led by working Ethiopian makers.");
  const [academyBannerImage, setAcademyBannerImage] = useState("/images/photo_2_2026-09-05_00-36-02.jpg");

  // 4. Showcase & Trust Counters
  const [showcaseTitle, setShowcaseTitle] = useState("Engineered for Ethiopian Commerce");
  const [showcaseSub, setShowcaseSub] = useState("From boutique coffee roasters in Bole to pharmaceutical packaging across East Africa.");
  const [stat1Val, setStat1Val] = useState("1.2M+");
  const [stat1Label, setStat1Label] = useState("Bags Manufactured");
  const [stat2Val, setStat2Val] = useState("50+");
  const [stat2Label, setStat2Label] = useState("Enterprise Clients");
  const [stat3Val, setStat3Val] = useState("100%");
  const [stat3Label, setStat3Label] = useState("Biodegradable Kraft");

  // 5. Announcements & Classes
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementVisible, setAnnouncementVisible] = useState(false);
  const [classesSectionTitle, setClassesSectionTitle] = useState("Upcoming Classes Ready for Registration");
  const [classesSectionSub, setClassesSectionSub] = useState("Join our hands-on packaging and artisan print workshops");
  const [classesSectionVisible, setClassesSectionVisible] = useState(true);

  // Design Studio Dynamic Pricing Configuration
  const [pricingConfig, setPricingConfig] = useState<DesignPricingConfig>(DEFAULT_DESIGN_PRICING);

  // Async States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSettings = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/settings?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const resJson = await res.json();
      if (res.ok && resJson?.success && resJson.settings) {
        const s = resJson.settings;
        if (s.company_name) setCompanyName(s.company_name);
        if (s.contact_phone) setContactPhone(s.contact_phone);
        if (s.contact_email) setContactEmail(s.contact_email);
        if (s.address) setAddress(s.address);
        if (s.tax_id) setTaxId(s.tax_id);
        if (s.settlement_days !== undefined) setSettlementDays(s.settlement_days);

        const socials = s.social_links || {};
        if (socials.facebook !== undefined) setFacebook(socials.facebook);
        if (socials.instagram !== undefined) setInstagram(socials.instagram);
        if (socials.telegram !== undefined) setTelegram(socials.telegram);
        if (socials.linkedin !== undefined) setLinkedin(socials.linkedin);
        if (socials.tiktok !== undefined) setTiktok(socials.tiktok);
        if (socials.youtube !== undefined) setYoutube(socials.youtube);

        // Homepage CMS
        const content = s.homepage_content || {};
        if (content.hero_badge !== undefined && content.hero_badge !== null) setHeroBadge(content.hero_badge);
        if (content.hero_headline !== undefined && content.hero_headline !== null) setHeroHeadline(content.hero_headline);
        if (content.hero_subline !== undefined && content.hero_subline !== null) setHeroSubline(content.hero_subline);
        if (content.hero_image !== undefined && content.hero_image !== null) setHeroImage(content.hero_image);
        if (content.hero_cta1_text !== undefined && content.hero_cta1_text !== null) setHeroCta1Text(content.hero_cta1_text);
        if (content.hero_cta1_link !== undefined && content.hero_cta1_link !== null) setHeroCta1Link(content.hero_cta1_link);
        if (content.hero_cta2_text !== undefined && content.hero_cta2_text !== null) setHeroCta2Text(content.hero_cta2_text);
        if (content.hero_cta2_link !== undefined && content.hero_cta2_link !== null) setHeroCta2Link(content.hero_cta2_link);

        if (content.mobile_hero_image !== undefined && content.mobile_hero_image !== null) setMobileHeroImage(content.mobile_hero_image);
        if (content.mobile_eyebrow !== undefined && content.mobile_eyebrow !== null) setMobileEyebrow(content.mobile_eyebrow);
        if (content.mobile_headline !== undefined && content.mobile_headline !== null) setMobileHeadline(content.mobile_headline);
        if (content.mobile_subline !== undefined && content.mobile_subline !== null) setMobileSubline(content.mobile_subline);
        if (content.craft_seal_top !== undefined && content.craft_seal_top !== null) setCraftSealTop(content.craft_seal_top);
        if (content.craft_seal_center !== undefined && content.craft_seal_center !== null) setCraftSealCenter(content.craft_seal_center);
        if (content.craft_seal_bottom !== undefined && content.craft_seal_bottom !== null) setCraftSealBottom(content.craft_seal_bottom);
        if (content.image_caption !== undefined && content.image_caption !== null) setImageCaption(content.image_caption);

        if (content.process_title !== undefined && content.process_title !== null) setProcessTitle(content.process_title);
        if (content.process_sub !== undefined && content.process_sub !== null) setProcessSub(content.process_sub);
        if (content.academy_banner_eyebrow !== undefined && content.academy_banner_eyebrow !== null) setAcademyBannerEyebrow(content.academy_banner_eyebrow);
        if (content.academy_banner_headline !== undefined && content.academy_banner_headline !== null) setAcademyBannerHeadline(content.academy_banner_headline);
        if (content.academy_banner_sub !== undefined && content.academy_banner_sub !== null) setAcademyBannerSub(content.academy_banner_sub);
        if (content.academy_banner_image !== undefined && content.academy_banner_image !== null) setAcademyBannerImage(content.academy_banner_image);

        if (content.showcase_title !== undefined && content.showcase_title !== null) setShowcaseTitle(content.showcase_title);
        if (content.showcase_sub !== undefined && content.showcase_sub !== null) setShowcaseSub(content.showcase_sub);
        if (content.stat_1_val !== undefined && content.stat_1_val !== null) setStat1Val(content.stat_1_val);
        if (content.stat_1_label !== undefined && content.stat_1_label !== null) setStat1Label(content.stat_1_label);
        if (content.stat_2_val !== undefined && content.stat_2_val !== null) setStat2Val(content.stat_2_val);
        if (content.stat_2_label !== undefined && content.stat_2_label !== null) setStat2Label(content.stat_2_label);
        if (content.stat_3_val !== undefined && content.stat_3_val !== null) setStat3Val(content.stat_3_val);
        if (content.stat_3_label !== undefined && content.stat_3_label !== null) setStat3Label(content.stat_3_label);

        if (content.announcement_text !== undefined) setAnnouncementText(content.announcement_text);
        if (content.announcement_visible !== undefined) setAnnouncementVisible(Boolean(content.announcement_visible));
        if (content.classes_section_title !== undefined) setClassesSectionTitle(content.classes_section_title);
        if (content.classes_section_sub !== undefined) setClassesSectionSub(content.classes_section_sub);
        if (content.classes_section_visible !== undefined) setClassesSectionVisible(Boolean(content.classes_section_visible));

        // Design Studio dynamic pricing
        const p = s.design_pricing || content.design_pricing;
        if (p) {
          setPricingConfig({
            gsm_rates: { ...DEFAULT_DESIGN_PRICING.gsm_rates, ...(p.gsm_rates || {}) },
            handle_rates: { ...DEFAULT_DESIGN_PRICING.handle_rates, ...(p.handle_rates || {}) },
            print_rates: { ...DEFAULT_DESIGN_PRICING.print_rates, ...(p.print_rates || {}) },
          });
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load factory settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "hero" | "mobile" | "academy") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "product-images");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.url) {
        throw new Error(resJson.error || "Image upload failed");
      }

      if (target === "hero") {
        setHeroImage(resJson.url);
        if (mobileHeroImage === heroImage) {
          setMobileHeroImage(resJson.url);
        }
      } else if (target === "mobile") {
        setMobileHeroImage(resJson.url);
      } else if (target === "academy") {
        setAcademyBannerImage(resJson.url);
      }

      setSuccessMsg("Image uploaded & updated successfully! Click 'Save All Changes' to commit.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const payload = {
        company_name: companyName.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        address: address.trim(),
        tax_id: taxId.trim(),
        settlement_days: Number(settlementDays),
        social_links: {
          facebook: facebook.trim(),
          instagram: instagram.trim(),
          telegram: telegram.trim(),
          linkedin: linkedin.trim(),
          tiktok: tiktok.trim(),
          youtube: youtube.trim(),
        },
        homepage_content: {
          hero_badge: heroBadge.trim(),
          hero_headline: heroHeadline.trim(),
          hero_subline: heroSubline.trim(),
          hero_image: heroImage.trim(),
          hero_cta1_text: heroCta1Text.trim(),
          hero_cta1_link: heroCta1Link.trim(),
          hero_cta2_text: heroCta2Text.trim(),
          hero_cta2_link: heroCta2Link.trim(),

          mobile_hero_image: mobileHeroImage.trim(),
          mobile_eyebrow: mobileEyebrow.trim(),
          mobile_headline: mobileHeadline.trim(),
          mobile_subline: mobileSubline.trim(),
          craft_seal_top: craftSealTop.trim(),
          craft_seal_center: craftSealCenter.trim(),
          craft_seal_bottom: craftSealBottom.trim(),
          image_caption: imageCaption.trim(),

          process_title: processTitle.trim(),
          process_sub: processSub.trim(),
          academy_banner_eyebrow: academyBannerEyebrow.trim(),
          academy_banner_headline: academyBannerHeadline.trim(),
          academy_banner_sub: academyBannerSub.trim(),
          academy_banner_image: academyBannerImage.trim(),

          showcase_title: showcaseTitle.trim(),
          showcase_sub: showcaseSub.trim(),
          stat_1_val: stat1Val.trim(),
          stat_1_label: stat1Label.trim(),
          stat_2_val: stat2Val.trim(),
          stat_2_label: stat2Label.trim(),
          stat_3_val: stat3Val.trim(),
          stat_3_label: stat3Label.trim(),

          announcement_text: announcementText.trim(),
          announcement_visible: announcementVisible,
          classes_section_title: classesSectionTitle.trim(),
          classes_section_sub: classesSectionSub.trim(),
          classes_section_visible: classesSectionVisible,
        },
        design_pricing: pricingConfig,
      };

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setSuccessMsg("🎉 Front-end content and factory settings saved successfully! Changes are live immediately on the website and mobile views.");
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setErrorMsg(resJson?.error || "Failed to save settings");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Connection error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Live Front-End CMS & Factory Console
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            Site Control & Front-End Customizer
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Change what customers see on the homepage, hero badges, headlines, mobile pictures, and call-to-actions in real time.
          </p>
        </div>

        {/* Action Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="px-6 py-3 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-[#E0B382] hover:text-white font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs shrink-0"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>Save & Publish Live</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 font-semibold animate-in fade-in">
          <Check size={18} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 font-semibold">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2 overflow-x-auto hide-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("cms")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "cms"
              ? "bg-[#1E3B2E] text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <Palette size={15} />
          <span>Front-End & Mobile UI/UX</span>
          <span className="text-[10px] bg-amber-400 text-stone-900 font-bold px-1.5 py-0.2 rounded-full">
            Full Control
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("company")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "company"
              ? "bg-[#1E3B2E] text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <Building2 size={15} />
          <span>Company & Legal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pricing")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "pricing"
              ? "bg-[#1E3B2E] text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <PenTool size={15} />
          <span>Packaging Dynamic Pricing</span>
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-16 text-center text-stone-400 text-xs">
          <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading factory configuration...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">

          {/* ========================================================================= */}
          {/* TAB 1: FRONT-END & MOBILE UI/UX (CMS) */}
          {/* ========================================================================= */}
          {activeTab === "cms" && (
            <div className="space-y-8">
              
              {/* TOP SPLIT: FORM ON LEFT, REAL-TIME INTERACTIVE PREVIEW ON RIGHT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT: EDITING CONTROLS (7 COLS) */}
                <div className="lg:col-span-7 space-y-6">

                  {/* 1. HERO VISUAL & PICTURES */}
                  <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div>
                        <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                          <Smartphone size={18} className="text-[#8C4B31]" />
                          <span>Hero Visual & Mobile Front Picture</span>
                        </h3>
                        <p className="text-[11px] text-stone-500">
                          Controls the large showcase bag photograph shown at the very top of customer phones and desktop screens.
                        </p>
                      </div>
                    </div>

                    {/* Image Preview & Upload Row */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-stone-100 border border-stone-300 shrink-0 shadow-xs">
                        <Image
                          src={mobileHeroImage || heroImage || "/images/photo_3_2026-09-05_00-36-02.jpg"}
                          alt="Hero Preview"
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="space-y-2 flex-1">
                        <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                          Front Picture URL
                        </label>
                        <input
                          type="text"
                          value={mobileHeroImage}
                          onChange={(e) => {
                            setMobileHeroImage(e.target.value);
                            setHeroImage(e.target.value);
                          }}
                          placeholder="/images/photo_3_2026-09-05_00-36-02.jpg or https://..."
                          className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                        />

                        <div className="flex items-center gap-2 pt-1">
                          <label className="px-3 py-1.5 rounded-xl bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-xs">
                            <Upload size={13} />
                            <span>{isUploading ? "Uploading..." : "Upload New Picture"}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => handleFileUpload(e, "mobile")}
                            />
                          </label>
                          <span className="text-[10px] text-stone-400">PNG, JPG, WEBP (Max 5MB)</span>
                        </div>
                      </div>
                    </div>

                    {/* Factory Presets Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                        Quick Preset: Pick Factory Showcase Photo
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {FACTORY_PRESET_IMAGES.map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => {
                              setMobileHeroImage(preset.url);
                              setHeroImage(preset.url);
                            }}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 text-xs transition-all cursor-pointer ${
                              mobileHeroImage === preset.url
                                ? "border-[#8C4B31] bg-[#FAF7F2] text-[#8C4B31] font-bold"
                                : "border-stone-200 hover:bg-stone-50 text-stone-700"
                            }`}
                          >
                            <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                              <Image src={preset.url} alt={preset.label} fill className="object-cover" />
                            </div>
                            <span className="truncate text-[11px]">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. HERO HEADLINE & BADGE */}
                  <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-4">
                    <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                      <span className="text-lg">✍️</span>
                      <span>Hero Titles, Eyebrow & Badges</span>
                    </h3>

                    <div>
                      <label className="block font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1">
                        Top Badge / Tagline (Desktop Pill & Mobile Eyebrow)
                      </label>
                      <p className="text-[10px] text-stone-400 mb-1.5">
                        Currently on site: <em>&quot;{heroBadge}&quot;</em>. You can erase this and write your own.
                      </p>
                      <input
                        type="text"
                        value={heroBadge}
                        onChange={(e) => {
                          setHeroBadge(e.target.value);
                          setMobileEyebrow(e.target.value);
                        }}
                        placeholder="e.g. Addis Ababa • Artisanal Kraft Guild"
                        className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1">
                        Hero Main Headline (Large Display Title)
                      </label>
                      <p className="text-[10px] text-stone-400 mb-1.5">
                        Currently on site: <em>&quot;{heroHeadline}&quot;</em>. Erase and type your new heading.
                      </p>
                      <input
                        type="text"
                        value={heroHeadline}
                        onChange={(e) => {
                          setHeroHeadline(e.target.value);
                          setMobileHeadline(e.target.value);
                        }}
                        placeholder="e.g. Artisanal Kraft Packaging & Craft Academy"
                        className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-xs sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1">
                        Hero Subline / Description Paragraph
                      </label>
                      <textarea
                        rows={3}
                        value={heroSubline}
                        onChange={(e) => {
                          setHeroSubline(e.target.value);
                          setMobileSubline(e.target.value);
                        }}
                        placeholder="e.g. 100% biodegradable kraft shopping bags, specialty coffee pouches..."
                        className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-xs leading-relaxed"
                      />
                    </div>

                    {/* Mobile Stamp Details */}
                    <div className="pt-3 border-t border-stone-100">
                      <span className="block font-bold text-[11px] uppercase tracking-wider text-stone-700 mb-2">
                        Mobile Craft Stamp & Photo Caption
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase">Seal Top</label>
                          <input
                            type="text"
                            value={craftSealTop}
                            onChange={(e) => setCraftSealTop(e.target.value)}
                            className="w-full border border-stone-200 rounded-lg p-1.5 bg-white text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase">Seal Initials</label>
                          <input
                            type="text"
                            value={craftSealCenter}
                            onChange={(e) => setCraftSealCenter(e.target.value)}
                            className="w-full border border-stone-200 rounded-lg p-1.5 bg-white text-xs font-bold text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase">Seal Bottom</label>
                          <input
                            type="text"
                            value={craftSealBottom}
                            onChange={(e) => setCraftSealBottom(e.target.value)}
                            className="w-full border border-stone-200 rounded-lg p-1.5 bg-white text-xs font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-400 uppercase">Status Dot Caption</label>
                          <input
                            type="text"
                            value={imageCaption}
                            onChange={(e) => setImageCaption(e.target.value)}
                            className="w-full border border-stone-200 rounded-lg p-1.5 bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. CALL TO ACTION BUTTONS */}
                  <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-4">
                    <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                      <ArrowRight size={16} className="text-[#1E3B2E]" />
                      <span>Call to Action (CTA) Buttons</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-stone-200 space-y-2">
                        <span className="block font-bold text-xs text-stone-800">Primary Button (Solid Green)</span>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase">Button Text</label>
                          <input
                            type="text"
                            value={heroCta1Text}
                            onChange={(e) => setHeroCta1Text(e.target.value)}
                            className="w-full border border-stone-300 rounded-lg p-2 bg-white text-xs font-bold text-stone-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase">Destination Link</label>
                          <input
                            type="text"
                            value={heroCta1Link}
                            onChange={(e) => setHeroCta1Link(e.target.value)}
                            className="w-full border border-stone-300 rounded-lg p-2 bg-white text-xs font-mono text-stone-700"
                          />
                        </div>
                      </div>

                      <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-stone-200 space-y-2">
                        <span className="block font-bold text-xs text-stone-800">Secondary Button (Outlined)</span>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase">Button Text</label>
                          <input
                            type="text"
                            value={heroCta2Text}
                            onChange={(e) => setHeroCta2Text(e.target.value)}
                            className="w-full border border-stone-300 rounded-lg p-2 bg-white text-xs font-bold text-stone-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-500 uppercase">Destination Link</label>
                          <input
                            type="text"
                            value={heroCta2Link}
                            onChange={(e) => setHeroCta2Link(e.target.value)}
                            className="w-full border border-stone-300 rounded-lg p-2 bg-white text-xs font-mono text-stone-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. TRUST COUNTERS & SHOWCASE */}
                  <div className="bg-white rounded-3xl border border-stone-200/90 p-6 shadow-xs space-y-4">
                    <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2">
                      Factory Trust Statistics & Showcase
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-200">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Stat 1</label>
                        <input
                          type="text"
                          value={stat1Val}
                          onChange={(e) => setStat1Val(e.target.value)}
                          className="w-full border border-stone-200 rounded-lg p-1.5 bg-white text-xs font-bold text-stone-900 mb-1"
                        />
                        <input
                          type="text"
                          value={stat1Label}
                          onChange={(e) => setStat1Label(e.target.value)}
                          className="w-full border border-stone-200 rounded-lg p-1.5 bg-white text-[11px] text-stone-600"
                        />
                      </div>

                      <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-200">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Stat 2</label>
                        <input
                          type="text"
                          value={stat2Val}
                          onChange={(e) => setStat2Val(e.target.value)}
                          className="w-full border border-stone-200 rounded-lg p-1.5 bg-white text-xs font-bold text-stone-900 mb-1"
                        />
                        <input
                          type="text"
                          value={stat2Label}
                          onChange={(e) => setStat2Label(e.target.value)}
                          className="w-full border border-stone-200 rounded-lg p-1.5 bg-white text-[11px] text-stone-600"
                        />
                      </div>

                      <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-200">
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Stat 3</label>
                        <input
                          type="text"
                          value={stat3Val}
                          onChange={(e) => setStat3Val(e.target.value)}
                          className="w-full border border-stone-200 rounded-lg p-1.5 bg-white text-xs font-bold text-stone-900 mb-1"
                        />
                        <input
                          type="text"
                          value={stat3Label}
                          onChange={(e) => setStat3Label(e.target.value)}
                          className="w-full border border-stone-200 rounded-lg p-1.5 bg-white text-[11px] text-stone-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                      <div>
                        <label className="block font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1">
                          Showcase Section Heading
                        </label>
                        <input
                          type="text"
                          value={showcaseTitle}
                          onChange={(e) => setShowcaseTitle(e.target.value)}
                          className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-stone-700 uppercase tracking-wider text-[11px] mb-1">
                          Showcase Subtitle
                        </label>
                        <input
                          type="text"
                          value={showcaseSub}
                          onChange={(e) => setShowcaseSub(e.target.value)}
                          className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. ANNOUNCEMENT & WORKSHOPS TOGGLES */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementVisible}
                        onChange={(e) => setAnnouncementVisible(e.target.checked)}
                        className="w-4 h-4 rounded border-stone-300 text-[#1E3B2E]"
                      />
                      <span className="font-bold text-amber-900 text-xs">Show Top Announcement Banner Across Website</span>
                    </label>
                    {announcementVisible && (
                      <input
                        type="text"
                        placeholder="e.g. 🎉 New: Specialty Coffee Roaster Pouches Now Available in 500g and 1kg"
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        className="w-full border border-amber-300 rounded-xl p-3 bg-white text-stone-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                      />
                    )}
                  </div>

                </div>

                {/* RIGHT: INTERACTIVE LIVE FRONT-END PREVIEW (5 COLS STICKY) */}
                <div className="lg:col-span-5 sticky top-24 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#8C4B31]" />
                      <span>Live Customer View</span>
                    </span>

                    {/* Device Switcher */}
                    <div className="flex items-center bg-stone-200/80 p-0.5 rounded-xl border border-stone-300/80">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("mobile")}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          previewDevice === "mobile"
                            ? "bg-white text-stone-900 shadow-2xs"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        <Smartphone size={13} />
                        <span>Phone</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice("desktop")}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          previewDevice === "desktop"
                            ? "bg-white text-stone-900 shadow-2xs"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        <Monitor size={13} />
                        <span>Desktop</span>
                      </button>
                    </div>
                  </div>

                  {/* PREVIEW CONTAINER */}
                  {previewDevice === "mobile" ? (
                    /* PHONE FRAME PREVIEW */
                    <div className="mx-auto max-w-[320px] rounded-[36px] border-4 border-stone-800 bg-[#F9F6F0] p-1 shadow-2xl overflow-hidden">
                      {/* Notch */}
                      <div className="h-4 bg-stone-800 rounded-t-[30px] flex items-center justify-center">
                        <div className="w-16 h-2 bg-stone-900 rounded-full" />
                      </div>

                      {/* Phone Screen */}
                      <div className="bg-[#F9F6F0] overflow-hidden text-left">
                        {/* Top Announcement if active */}
                        {announcementVisible && announcementText && (
                          <div className="bg-[#1E3B2E] text-[#E0B382] text-[10px] font-bold py-1 px-2 text-center truncate">
                            {announcementText}
                          </div>
                        )}

                        {/* Hero Image */}
                        <div className="relative h-48 w-full bg-stone-200 overflow-hidden">
                          <Image
                            src={mobileHeroImage || "/images/photo_3_2026-09-05_00-36-02.jpg"}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-950/60 pointer-events-none" />
                          
                          {/* Craft Seal */}
                          <div className="absolute top-3 left-3 bg-[#1E3B2E]/90 text-white rounded-full w-12 h-12 border border-[#E0B382]/60 flex flex-col items-center justify-center text-[7px] font-bold shadow-md">
                            <span>{craftSealTop}</span>
                            <span className="text-[10px] text-[#E0B382]">{craftSealCenter}</span>
                            <span>{craftSealBottom}</span>
                          </div>

                          {/* Caption */}
                          <div className="absolute bottom-2 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{imageCaption}</span>
                          </div>
                        </div>

                        {/* Copy */}
                        <div className="p-4 space-y-2">
                          <div className="text-[10px] font-bold text-[#8C4B31] uppercase tracking-wider">
                            {mobileEyebrow || heroBadge}
                          </div>
                          <h4 className="font-serif text-lg font-bold text-stone-900 leading-tight">
                            {mobileHeadline || heroHeadline}
                          </h4>
                          <p className="text-[11px] text-stone-600 line-clamp-3">
                            {mobileSubline || heroSubline}
                          </p>

                          {/* Buttons */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="bg-[#1E3B2E] text-white text-[10px] font-bold py-2 rounded-xl text-center truncate px-1">
                              {heroCta1Text}
                            </div>
                            <div className="border border-stone-300 text-stone-800 text-[10px] font-bold py-2 rounded-xl text-center truncate px-1">
                              {heroCta2Text}
                            </div>
                          </div>

                          {/* Trust strip */}
                          <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[9px] text-stone-600 font-bold">
                            <span>{stat1Val} Bags</span>
                            <span>{stat2Val} Clients</span>
                            <span>{stat3Val} Kraft</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* DESKTOP FRAME PREVIEW */
                    <div className="rounded-2xl border border-stone-300 bg-white shadow-lg overflow-hidden text-left">
                      {/* Browser Bar */}
                      <div className="bg-stone-100 border-b border-stone-200 px-3 py-1.5 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-mono text-stone-500 ml-2 truncate">
                          arenguade.et
                        </span>
                      </div>

                      {/* Desktop Hero Mockup */}
                      <div className="p-5 bg-[#F9F6F0] space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-200 border border-stone-300 text-[10px] font-bold text-stone-700 uppercase">
                          <span>{heroBadge}</span>
                        </div>

                        <h3 className="font-serif text-xl font-bold text-stone-900 leading-tight">
                          {heroHeadline}
                        </h3>

                        <p className="text-xs text-stone-600 line-clamp-2">
                          {heroSubline}
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <span className="px-3 py-1.5 rounded-lg bg-[#1E3B2E] text-white text-[11px] font-bold">
                            {heroCta1Text}
                          </span>
                          <span className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-800 text-[11px] font-bold">
                            {heroCta2Text}
                          </span>
                        </div>

                        <div className="relative h-28 w-full rounded-xl overflow-hidden mt-3 border border-stone-200">
                          <Image src={heroImage || "/images/photo_3_2026-09-05_00-36-02.jpg"} alt="Preview" fill className="object-cover" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-[11px] text-stone-400">
                      💡 Click <strong>Save & Publish Live</strong> at the top right to push all changes to your live customers.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: COMPANY LEGAL & CONTACTS */}
          {/* ========================================================================= */}
          {activeTab === "company" && (
            <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                <Building2 size={16} className="text-[#1E3B2E]" />
                <span>Enterprise Credentials & Public Channels</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[11px]">
                    Company Legal Trade Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[11px] flex items-center gap-1.5">
                    <Phone size={13} className="text-[#8C4B31]" />
                    <span>Official Phone / Hotline *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[11px] flex items-center gap-1.5">
                    <Mail size={13} className="text-[#8C4B31]" />
                    <span>Inquiry & Orders Email *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[11px] flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#8C4B31]" />
                    <span>Factory & Workshop Physical Address *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[11px]">
                    Tax Identification Number (TIN)
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[11px] flex items-center gap-1.5">
                    <Clock size={13} className="text-[#1E3B2E]" />
                    <span>Bank Transfer Hold Window (Days)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={settlementDays}
                    onChange={(e) => setSettlementDays(Number(e.target.value))}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-xs"
                  />
                </div>
              </div>

              {/* Social Channels */}
              <div className="space-y-4 pt-4 border-t border-stone-100">
                <h4 className="font-serif text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Share2 size={15} className="text-[#8C4B31]" />
                  <span>Public Social & Community Channels</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-stone-700 uppercase text-[10px] mb-1">Telegram Channel</label>
                    <input
                      type="text"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 uppercase text-[10px] mb-1">TikTok Channel</label>
                    <input
                      type="text"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 uppercase text-[10px] mb-1">Instagram Profile</label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 uppercase text-[10px] mb-1">YouTube Channel</label>
                    <input
                      type="text"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PACKAGING DYNAMIC PRICING */}
          {/* ========================================================================= */}
          {activeTab === "pricing" && (
            <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                  <PenTool size={16} className="text-[#8C4B31]" />
                  <span>Custom Studio Pricing & Surcharges (ETB)</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Live Calculator Sync
                </span>
              </div>

              {/* Subsection A: GSM Base Costs */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-[#1E3B2E]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    A. Paper Weight & Grammage Base Rates (ETB / Unit)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(pricingConfig.gsm_rates).map(([gsmKey, gsmData]) => (
                    <div key={gsmKey} className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-stone-800 block">
                          {gsmData.label}
                        </label>
                        <span className="text-[9px] font-mono text-stone-400">Max {gsmData.maxKg}kg</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-stone-500">ETB</span>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={gsmData.baseCost}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPricingConfig((prev) => ({
                              ...prev,
                              gsm_rates: {
                                ...prev.gsm_rates,
                                [gsmKey]: { ...gsmData, baseCost: val },
                              },
                            }));
                          }}
                          className="w-full border border-stone-300 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subsection B: Handle Grip Construction */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-[#8C4B31]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    B. Handle Grip Construction Surcharges (ETB / Unit Delta)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(pricingConfig.handle_rates).map(([handleKey, handleData]) => (
                    <div key={handleKey} className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-stone-800 block truncate" title={handleData.name}>
                          {handleData.name}
                        </label>
                        <span className="text-[9px] font-mono text-stone-400">Max {handleData.maxKg}kg</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-stone-500">ETB</span>
                        <input
                          type="number"
                          step="0.5"
                          value={handleData.costDelta}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPricingConfig((prev) => ({
                              ...prev,
                              handle_rates: {
                                ...prev.handle_rates,
                                [handleKey]: { ...handleData, costDelta: val },
                              },
                            }));
                          }}
                          className="w-full border border-stone-300 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subsection C: Print Finishing */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-[#1E3B2E]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    C. Print Finishing Surcharges (ETB / Unit Surcharge)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(pricingConfig.print_rates).map(([printKey, printData]) => (
                    <div key={printKey} className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                      <label className="text-[11px] font-bold text-stone-800 block truncate" title={printData.name}>
                        {printData.name}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-stone-500">ETB</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={printData.costDelta}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPricingConfig((prev) => ({
                              ...prev,
                              print_rates: {
                                ...prev.print_rates,
                                [printKey]: { ...printData, costDelta: val },
                              },
                            }));
                          }}
                          className="w-full border border-stone-300 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            <span className="text-xs text-stone-500">
              Ethiopia Arenguade Paper Product • Executive Console
            </span>
            <button
              type="submit"
              disabled={isSaving}
              className="px-7 py-3 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-[#E0B382] hover:text-white font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 text-xs flex items-center gap-2"
            >
              {isSaving ? "Publishing Changes..." : "Save & Publish Live"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
