"use client";

import { useState, useEffect, useMemo } from "react";
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
  CheckCircle2,
  Ruler,
  SlidersHorizontal,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  Package,
  RefreshCw,
  Info
} from "lucide-react";
import { 
  DEFAULT_DESIGN_PRICING, 
  DEFAULT_STUDIO_CONFIG, 
  DesignPricingConfig,
  StudioConfig,
  SizePresetConfig,
  GsmOptionConfig,
  HandleOptionConfig,
  PrintOptionConfig,
  PaperColorConfig,
  QuantityTierConfig,
  TurnaroundOptionConfig,
  mergeStudioConfig,
  extractDesignPricing
} from "@/utils/designPricing";

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

  // Full Design Studio Configuration
  const [studioConfig, setStudioConfig] = useState<StudioConfig>(DEFAULT_STUDIO_CONFIG);
  const [studioSubTab, setStudioSubTab] = useState<
    "presets" | "gsm" | "handles" | "finishes" | "colors" | "quantities" | "turnaround" | "headings"
  >("presets");

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

        // Design Studio dynamic configuration
        const rawStudio = s.studio_config || content.studio_config;
        if (rawStudio) {
          setStudioConfig(mergeStudioConfig(rawStudio));
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
      const derivedPricing = extractDesignPricing(studioConfig);

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
        design_pricing: derivedPricing,
        studio_config: studioConfig,
      };

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setSuccessMsg("🎉 Front-end content and studio configuration saved successfully! All customizer presets, dimensions, GSM rates, handles, and print finishes are now live for customers.");
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

  // Live Calculator Simulator for Admin Confidence Testing
  const [testPresetId, setTestPresetId] = useState<string>("medium-retail");
  const [testGsm, setTestGsm] = useState<number>(220);
  const [testHandleId, setTestHandleId] = useState<string>("Twisted Kraft Cord");
  const [testPrintId, setTestPrintId] = useState<string>("1-Color Soy Screenprint");
  const [testColorId, setTestColorId] = useState<string>("Natural Brown Kraft");
  const [testCount, setTestCount] = useState<number>(1000);
  const [testUrgencyId, setTestUrgencyId] = useState<string>("standard");

  const simulatedQuote = useMemo(() => {
    const gsmOpt = studioConfig.gsm_options.find((g) => g.value === testGsm) || studioConfig.gsm_options[0];
    const handleOpt = studioConfig.handle_options.find((h) => h.id === testHandleId) || studioConfig.handle_options[0];
    const printOpt = studioConfig.print_options.find((p) => p.id === testPrintId) || studioConfig.print_options[0];
    const colorOpt = studioConfig.paper_colors.find((c) => c.id === testColorId) || studioConfig.paper_colors[0];
    const urgencyOpt = studioConfig.turnaround_options.find((t) => t.id === testUrgencyId) || studioConfig.turnaround_options[0];

    const base = (gsmOpt?.baseCost ?? 18) + (handleOpt?.costDelta ?? 0) + (printOpt?.costDelta ?? 0) + (colorOpt?.surcharge ?? 0);

    let multiplier = 1.0;
    const tier = studioConfig.quantity_tiers.find((q) => q.count === testCount);
    if (tier) {
      multiplier = tier.unitMultiplier;
    } else if (testCount < 1000) {
      multiplier = 1.18;
    } else if (testCount >= 10000) {
      multiplier = 0.78;
    } else if (testCount >= 5000) {
      multiplier = 0.85;
    } else if (testCount >= 2500) {
      multiplier = 0.92;
    }

    const urgencyMult = urgencyOpt?.multiplier ?? 1.0;
    const unitPrice = Math.round(base * multiplier * urgencyMult * 10) / 10;
    const totalPrice = Math.round(unitPrice * testCount);

    return { unitPrice, totalPrice };
  }, [studioConfig, testGsm, testHandleId, testPrintId, testColorId, testCount, testUrgencyId]);

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Live Front-End CMS & Studio Factory Console
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            Site Control & Design Studio Portal
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-3xl">
            Control the entire public presence in real time: homepage copy, mobile images, and every element of the public Design Studio customizer (bag presets, dimensions, GSM weights, handle grips, print finishes, quantity discounts, and lead times).
          </p>
        </div>

        {/* Action Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="self-start md:self-auto px-6 py-3 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-[#E0B382] hover:text-white font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 text-xs flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Publishing Live...</span>
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
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Top Main Tabs */}
      <div className="flex border-b border-stone-200 gap-2 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("cms")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "cms"
              ? "bg-[#1E3B2E] text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <Monitor size={15} />
          <span>Homepage CMS & Mobile UI/UX</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("company")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "pricing"
              ? "bg-[#1E3B2E] text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <PenTool size={15} />
          <span>Design Studio & Dynamic Pricing (Full Control)</span>
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
          {/* TAB 1: HOMEPAGE CMS & MOBILE UI/UX */}
          {/* ========================================================================= */}
          {activeTab === "cms" && (
            <div className="space-y-6">
              {/* Device Preview Toggle Bar */}
              <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-stone-200 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
                  <span>Customizer Perspective:</span>
                  <span className="text-stone-400 text-[11px] font-normal">
                    (Preview how customers experience these edits)
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      previewDevice === "mobile"
                        ? "bg-white text-stone-900 shadow-2xs"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    <Smartphone size={14} />
                    <span>Mobile Screen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      previewDevice === "desktop"
                        ? "bg-white text-stone-900 shadow-2xs"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    <Monitor size={14} />
                    <span>Desktop View</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Hero Section */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-stone-100 pb-2">
                  <h3 className="font-serif text-base font-bold text-stone-900">
                    1. Hero Section Content & Photography
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Controls what users see in the very first viewport of the website.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Desktop Copy */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Hero Eyebrow / Badge Text
                      </label>
                      <input
                        type="text"
                        value={heroBadge}
                        onChange={(e) => setHeroBadge(e.target.value)}
                        placeholder="e.g. Addis Ababa • Artisanal Kraft Guild"
                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Main Headline (H1)
                      </label>
                      <input
                        type="text"
                        value={heroHeadline}
                        onChange={(e) => setHeroHeadline(e.target.value)}
                        placeholder="e.g. Artisanal Kraft Packaging & Craft Academy"
                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Subline / Mission Statement
                      </label>
                      <textarea
                        rows={3}
                        value={heroSubline}
                        onChange={(e) => setHeroSubline(e.target.value)}
                        placeholder="Description of factory products, craft school, and Addis Ababa operations..."
                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#8C4B31] leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                          Primary CTA Text
                        </label>
                        <input
                          type="text"
                          value={heroCta1Text}
                          onChange={(e) => setHeroCta1Text(e.target.value)}
                          className="w-full border border-stone-200 rounded-xl p-2 bg-[#FAF7F2] text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                          Primary CTA Link
                        </label>
                        <input
                          type="text"
                          value={heroCta1Link}
                          onChange={(e) => setHeroCta1Link(e.target.value)}
                          className="w-full border border-stone-200 rounded-xl p-2 bg-[#FAF7F2] text-xs font-mono text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                          Secondary CTA Text
                        </label>
                        <input
                          type="text"
                          value={heroCta2Text}
                          onChange={(e) => setHeroCta2Text(e.target.value)}
                          className="w-full border border-stone-200 rounded-xl p-2 bg-[#FAF7F2] text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                          Secondary CTA Link
                        </label>
                        <input
                          type="text"
                          value={heroCta2Link}
                          onChange={(e) => setHeroCta2Link(e.target.value)}
                          className="w-full border border-stone-200 rounded-xl p-2 bg-[#FAF7F2] text-xs font-mono text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Desktop Hero Picture Selection */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-stone-700 block">
                      Desktop Hero Picture
                    </label>

                    {/* Live Image Preview Card */}
                    <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-inner group">
                      <Image
                        src={heroImage}
                        alt="Desktop Hero Preview"
                        fill
                        className="object-cover transition-transform group-hover:scale-105 duration-300"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                        <span className="text-[11px] text-white font-medium truncate">
                          Current: {heroImage}
                        </span>
                      </div>
                    </div>

                    {/* Direct Upload & Presets */}
                    <div className="flex items-center gap-3">
                      <label className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 hover:border-[#8C4B31] text-xs font-bold text-stone-700 hover:text-[#8C4B31] flex items-center gap-2 cursor-pointer transition-all shadow-2xs">
                        <Upload size={14} />
                        <span>Upload Custom Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "hero")}
                        />
                      </label>
                      {isUploading && (
                        <span className="text-xs text-amber-700 flex items-center gap-1.5 animate-pulse">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping" />
                          Uploading to storage...
                        </span>
                      )}
                    </div>

                    {/* Presets Grid */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                        Quick Select Factory Presets:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {FACTORY_PRESET_IMAGES.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setHeroImage(img.url)}
                            className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                              heroImage === img.url
                                ? "border-[#8C4B31] bg-amber-50/50 ring-2 ring-[#8C4B31]/30"
                                : "border-stone-200 hover:border-stone-300 bg-[#FAF7F2]"
                            }`}
                          >
                            <div className="relative h-12 w-full rounded-lg overflow-hidden mb-1">
                              <Image src={img.url} alt={img.label} fill className="object-cover" unoptimized />
                            </div>
                            <span className="text-[9px] font-bold text-stone-700 block truncate">
                              {img.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Mobile UI / UX Controls */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div>
                    <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                      <Smartphone size={16} className="text-[#8C4B31]" />
                      <span>2. Mobile Screen UI / UX & Picture Controls</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Fine-tune the mobile layout, front picture, floating craft seal, and mobile-specific headlines.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
                    Mobile Specific
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Mobile Copy Controls */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Mobile Eyebrow Tagline
                      </label>
                      <input
                        type="text"
                        value={mobileEyebrow}
                        onChange={(e) => setMobileEyebrow(e.target.value)}
                        placeholder="e.g. Packaging with provenance"
                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Mobile Headline (Punchy & Concise)
                      </label>
                      <input
                        type="text"
                        value={mobileHeadline}
                        onChange={(e) => setMobileHeadline(e.target.value)}
                        placeholder="e.g. Made by hand. Built for your brand."
                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Mobile Subline / Paragraph
                      </label>
                      <textarea
                        rows={2}
                        value={mobileSubline}
                        onChange={(e) => setMobileSubline(e.target.value)}
                        placeholder="Short explanation optimized for vertical mobile viewport..."
                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#8C4B31] leading-relaxed"
                      />
                    </div>

                    {/* Seal & Picture Caption Controls */}
                    <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3">
                      <span className="text-[11px] font-bold text-stone-900 block">
                        Floating Guild Craft Seal & Picture Badge
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Top Text</label>
                          <input
                            type="text"
                            value={craftSealTop}
                            onChange={(e) => setCraftSealTop(e.target.value)}
                            className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs text-center font-bold text-stone-800"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Center Monogram</label>
                          <input
                            type="text"
                            value={craftSealCenter}
                            onChange={(e) => setCraftSealCenter(e.target.value)}
                            className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs text-center font-bold text-[#8C4B31]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Bottom Text</label>
                          <input
                            type="text"
                            value={craftSealBottom}
                            onChange={(e) => setCraftSealBottom(e.target.value)}
                            className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs text-center font-bold text-stone-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">Image Caption Tag</label>
                        <input
                          type="text"
                          value={imageCaption}
                          onChange={(e) => setImageCaption(e.target.value)}
                          placeholder="e.g. Made to order in Addis"
                          className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-medium text-stone-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Mobile Picture Controls */}
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-stone-700 block">
                      Mobile Front Picture (Portrait Orientation)
                    </label>

                    {/* Phone Mockup Frame Preview */}
                    <div className="w-52 mx-auto rounded-3xl p-2.5 bg-stone-900 shadow-xl border-4 border-stone-800">
                      <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-stone-100 shadow-inner">
                        <Image
                          src={mobileHeroImage}
                          alt="Mobile View Front Picture"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {/* Simulated Mobile Floating Badge */}
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[9px] font-bold text-stone-800 shadow-2xs">
                          {imageCaption}
                        </div>
                        {/* Simulated Seal */}
                        <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#1E3B2E] text-white flex flex-col items-center justify-center text-[7px] font-bold border border-white/50 shadow-md">
                          <span className="text-[6px] tracking-tighter opacity-80">{craftSealTop.slice(0, 5)}</span>
                          <span className="text-[9px] text-[#E0B382] leading-none">{craftSealCenter}</span>
                          <span className="text-[5px] tracking-tighter opacity-80">{craftSealBottom.slice(0, 5)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Direct Upload for Mobile */}
                    <div className="flex items-center justify-center gap-3">
                      <label className="px-3.5 py-2 rounded-xl bg-white border border-stone-300 hover:border-[#8C4B31] text-xs font-bold text-stone-700 hover:text-[#8C4B31] flex items-center gap-2 cursor-pointer transition-all shadow-2xs">
                        <Upload size={14} />
                        <span>Upload Mobile Picture</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "mobile")}
                        />
                      </label>
                    </div>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {FACTORY_PRESET_IMAGES.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMobileHeroImage(img.url)}
                          className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                            mobileHeroImage === img.url
                              ? "border-[#8C4B31] bg-amber-50/50 ring-2 ring-[#8C4B31]/30"
                              : "border-stone-200 hover:border-stone-300 bg-[#FAF7F2]"
                          }`}
                        >
                          <div className="relative h-10 w-full rounded-lg overflow-hidden mb-1">
                            <Image src={img.url} alt={img.label} fill className="object-cover" unoptimized />
                          </div>
                          <span className="text-[8px] font-bold text-stone-700 block truncate">
                            {img.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Trust Counters / Factory Stats */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="border-b border-stone-100 pb-2">
                  <h3 className="font-serif text-base font-bold text-stone-900">
                    3. Factory Performance Counters & Trust Strip
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Metric badges displayed under the hero for social proof and industrial scale.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-2">
                    <label className="text-[11px] font-bold text-stone-600 block">Metric 1</label>
                    <input
                      type="text"
                      value={stat1Val}
                      onChange={(e) => setStat1Val(e.target.value)}
                      placeholder="1.2M+"
                      className="w-full border border-stone-300 rounded-lg p-2 bg-white text-sm font-bold font-mono text-[#8C4B31]"
                    />
                    <input
                      type="text"
                      value={stat1Label}
                      onChange={(e) => setStat1Label(e.target.value)}
                      placeholder="Bags Manufactured"
                      className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs text-stone-700"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-2">
                    <label className="text-[11px] font-bold text-stone-600 block">Metric 2</label>
                    <input
                      type="text"
                      value={stat2Val}
                      onChange={(e) => setStat2Val(e.target.value)}
                      placeholder="50+"
                      className="w-full border border-stone-300 rounded-lg p-2 bg-white text-sm font-bold font-mono text-[#1E3B2E]"
                    />
                    <input
                      type="text"
                      value={stat2Label}
                      onChange={(e) => setStat2Label(e.target.value)}
                      placeholder="Enterprise Clients"
                      className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs text-stone-700"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-2">
                    <label className="text-[11px] font-bold text-stone-600 block">Metric 3</label>
                    <input
                      type="text"
                      value={stat3Val}
                      onChange={(e) => setStat3Val(e.target.value)}
                      placeholder="100%"
                      className="w-full border border-stone-300 rounded-lg p-2 bg-white text-sm font-bold font-mono text-[#8C4B31]"
                    />
                    <input
                      type="text"
                      value={stat3Label}
                      onChange={(e) => setStat3Label(e.target.value)}
                      placeholder="Biodegradable Kraft"
                      className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs text-stone-700"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Public Announcement Banner */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div>
                    <h3 className="font-serif text-base font-bold text-stone-900">
                      4. Top Announcement Notice Bar
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Display an urgent banner at the very top of all pages (e.g., Holiday schedules, trade expos).
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementVisible}
                      onChange={(e) => setAnnouncementVisible(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1E3B2E] focus:ring-[#1E3B2E]"
                    />
                    <span className="text-xs font-bold text-stone-700">Display Bar</span>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Announcement Text
                  </label>
                  <input
                    type="text"
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="e.g. Factory tours open every Saturday in Bole • Book masterclass online"
                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: COMPANY & LEGAL CREDENTIALS */}
          {/* ========================================================================= */}
          {activeTab === "company" && (
            <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="font-serif text-base font-bold text-stone-900">
                  Official Entity & Settlement Settings
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Legal company identity, TIN registration, contact numbers, and payment clearance rules.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Tax ID / TIN Number</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-stone-700 block mb-1">Factory & Office Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Settlement Clearance Window (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settlementDays}
                    onChange={(e) => setSettlementDays(parseInt(e.target.value, 10) || 3)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Telegram Channel / Bot</label>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DESIGN STUDIO & DYNAMIC PRICING (COMPLETE CONTROL) */}
          {/* ========================================================================= */}
          {activeTab === "pricing" && (
            <div className="space-y-6">
              {/* Studio Sub-Navigation Bar */}
              <div className="flex items-center gap-1.5 p-2 bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStudioSubTab("presets")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    studioSubTab === "presets"
                      ? "bg-[#1E3B2E] text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Ruler size={14} />
                  <span>1. Dimensions & Bag Presets</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioSubTab("gsm")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    studioSubTab === "gsm"
                      ? "bg-[#1E3B2E] text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Layers size={14} />
                  <span>2. Paper Weight & GSM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioSubTab("handles")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    studioSubTab === "handles"
                      ? "bg-[#1E3B2E] text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Tag size={14} />
                  <span>3. Handles & Grips</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioSubTab("finishes")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    studioSubTab === "finishes"
                      ? "bg-[#1E3B2E] text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Sparkles size={14} />
                  <span>4. Print & Finishes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioSubTab("colors")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    studioSubTab === "colors"
                      ? "bg-[#1E3B2E] text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Palette size={14} />
                  <span>5. Paper Colors</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioSubTab("quantities")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    studioSubTab === "quantities"
                      ? "bg-[#1E3B2E] text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <ShoppingBag size={14} />
                  <span>6. Quantity Tiers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioSubTab("turnaround")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    studioSubTab === "turnaround"
                      ? "bg-[#1E3B2E] text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Clock size={14} />
                  <span>7. Turnaround Speeds</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudioSubTab("headings")}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    studioSubTab === "headings"
                      ? "bg-[#1E3B2E] text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <PenTool size={14} />
                  <span>8. Studio Headings & Copy</span>
                </button>
              </div>

              {/* Subtab 1: Bag Dimensions & Presets */}
              {studioSubTab === "presets" && (
                <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                        <Ruler size={16} className="text-[#8C4B31]" />
                        <span>Bag Dimensions & Standard Industry Presets</span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Define the preset sizes shown to customers, as well as the allowable min/max bounds for custom dimensions.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newPreset: SizePresetConfig = {
                          id: `preset-${Date.now()}`,
                          name: "New Custom Preset",
                          width: 25,
                          height: 30,
                          gusset: 10,
                          description: "Custom bag profile description for retail or food",
                          category: "Retail",
                          enabled: true,
                        };
                        setStudioConfig((prev) => ({
                          ...prev,
                          presets: [...prev.presets, newPreset],
                        }));
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus size={14} />
                      <span>Add Bag Preset</span>
                    </button>
                  </div>

                  {/* Dimension Boundaries */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-800 block">
                      Custom Dimensions Allowed Sliders (Min / Max in cm)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                          Width Range (cm)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="5"
                            max="50"
                            value={studioConfig.dimension_limits.minWidth}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 5;
                              setStudioConfig((prev) => ({
                                ...prev,
                                dimension_limits: { ...prev.dimension_limits, minWidth: val },
                              }));
                            }}
                            className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-mono font-bold"
                          />
                          <span className="text-xs text-stone-400">to</span>
                          <input
                            type="number"
                            min="20"
                            max="120"
                            value={studioConfig.dimension_limits.maxWidth}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 50;
                              setStudioConfig((prev) => ({
                                ...prev,
                                dimension_limits: { ...prev.dimension_limits, maxWidth: val },
                              }));
                            }}
                            className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                          Height Range (cm)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="5"
                            max="50"
                            value={studioConfig.dimension_limits.minHeight}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 5;
                              setStudioConfig((prev) => ({
                                ...prev,
                                dimension_limits: { ...prev.dimension_limits, minHeight: val },
                              }));
                            }}
                            className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-mono font-bold"
                          />
                          <span className="text-xs text-stone-400">to</span>
                          <input
                            type="number"
                            min="20"
                            max="150"
                            value={studioConfig.dimension_limits.maxHeight}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 70;
                              setStudioConfig((prev) => ({
                                ...prev,
                                dimension_limits: { ...prev.dimension_limits, maxHeight: val },
                              }));
                            }}
                            className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-600 block mb-1">
                          Gusset Depth Range (cm)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="2"
                            max="20"
                            value={studioConfig.dimension_limits.minGusset}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 2;
                              setStudioConfig((prev) => ({
                                ...prev,
                                dimension_limits: { ...prev.dimension_limits, minGusset: val },
                              }));
                            }}
                            className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-mono font-bold"
                          />
                          <span className="text-xs text-stone-400">to</span>
                          <input
                            type="number"
                            min="10"
                            max="50"
                            value={studioConfig.dimension_limits.maxGusset}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 30;
                              setStudioConfig((prev) => ({
                                ...prev,
                                dimension_limits: { ...prev.dimension_limits, maxGusset: val },
                              }));
                            }}
                            className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Presets Cards */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-800 block">
                      Active Size Presets ({studioConfig.presets.length})
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studioConfig.presets.map((preset, index) => (
                        <div
                          key={preset.id}
                          className={`p-4 rounded-2xl border transition-all space-y-3 ${
                            preset.enabled !== false
                              ? "bg-white border-stone-200 shadow-2xs"
                              : "bg-stone-50 border-stone-200/60 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={preset.enabled !== false}
                                onChange={(e) => {
                                  const updated = [...studioConfig.presets];
                                  updated[index] = { ...preset, enabled: e.target.checked };
                                  setStudioConfig((prev) => ({ ...prev, presets: updated }));
                                }}
                                className="w-4 h-4 rounded text-[#1E3B2E] focus:ring-[#1E3B2E]"
                              />
                              <span className="text-xs font-bold text-stone-900">
                                {preset.enabled !== false ? "Visible in Studio" : "Hidden from Studio"}
                              </span>
                            </label>

                            {studioConfig.presets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const filtered = studioConfig.presets.filter((_, i) => i !== index);
                                  setStudioConfig((prev) => ({ ...prev, presets: filtered }));
                                }}
                                className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Delete preset"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-stone-500 block mb-0.5">Preset Name</label>
                              <input
                                type="text"
                                value={preset.name}
                                onChange={(e) => {
                                  const updated = [...studioConfig.presets];
                                  updated[index] = { ...preset, name: e.target.value };
                                  setStudioConfig((prev) => ({ ...prev, presets: updated }));
                                }}
                                className="w-full border border-stone-200 rounded-lg p-2 bg-[#FAF7F2] text-xs font-bold text-stone-900"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-stone-500 block mb-0.5">Category Tag</label>
                              <input
                                type="text"
                                value={preset.category}
                                onChange={(e) => {
                                  const updated = [...studioConfig.presets];
                                  updated[index] = { ...preset, category: e.target.value };
                                  setStudioConfig((prev) => ({ ...prev, presets: updated }));
                                }}
                                className="w-full border border-stone-200 rounded-lg p-2 bg-[#FAF7F2] text-xs font-medium text-stone-800"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-stone-500 block mb-0.5">Width (cm)</label>
                              <input
                                type="number"
                                min="5"
                                value={preset.width}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 10;
                                  const updated = [...studioConfig.presets];
                                  updated[index] = { ...preset, width: val };
                                  setStudioConfig((prev) => ({ ...prev, presets: updated }));
                                }}
                                className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-stone-500 block mb-0.5">Height (cm)</label>
                              <input
                                type="number"
                                min="5"
                                value={preset.height}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 10;
                                  const updated = [...studioConfig.presets];
                                  updated[index] = { ...preset, height: val };
                                  setStudioConfig((prev) => ({ ...prev, presets: updated }));
                                }}
                                className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-stone-500 block mb-0.5">Gusset (cm)</label>
                              <input
                                type="number"
                                min="2"
                                value={preset.gusset}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 4;
                                  const updated = [...studioConfig.presets];
                                  updated[index] = { ...preset, gusset: val };
                                  setStudioConfig((prev) => ({ ...prev, presets: updated }));
                                }}
                                className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Description / Target Products</label>
                            <input
                              type="text"
                              value={preset.description}
                              onChange={(e) => {
                                const updated = [...studioConfig.presets];
                                updated[index] = { ...preset, description: e.target.value };
                                setStudioConfig((prev) => ({ ...prev, presets: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-2 bg-[#FAF7F2] text-xs text-stone-700"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: Paper Weight & GSM */}
              {studioSubTab === "gsm" && (
                <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                        <Layers size={16} className="text-[#1E3B2E]" />
                        <span>Paper Weight & Grammage (GSM) Options & Base Costs</span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Configure base price in ETB, load capacity ratings in kg, and tactile gauge descriptions for each paper stock thickness.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newGsm: GsmOptionConfig = {
                          value: 300,
                          label: "300 GSM Heavy Rigidity Board",
                          description: "Extra heavy industrial rigid packaging board",
                          baseCost: 32.0,
                          maxKg: 20.0,
                          feel: "Rigid Box-Grade Board",
                          gauge: "0.48 mm (Multi-Ply Solid)",
                          bestFor: "Export freight, heavy jar sets, and luxury packaging",
                          enabled: true,
                        };
                        setStudioConfig((prev) => ({
                          ...prev,
                          gsm_options: [...prev.gsm_options, newGsm],
                        }));
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus size={14} />
                      <span>Add GSM Option</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studioConfig.gsm_options.map((opt, index) => (
                      <div
                        key={opt.value}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          opt.enabled !== false
                            ? "bg-white border-stone-200 shadow-2xs"
                            : "bg-stone-50 border-stone-200/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={opt.enabled !== false}
                              onChange={(e) => {
                                const updated = [...studioConfig.gsm_options];
                                updated[index] = { ...opt, enabled: e.target.checked };
                                setStudioConfig((prev) => ({ ...prev, gsm_options: updated }));
                              }}
                              className="w-4 h-4 rounded text-[#1E3B2E] focus:ring-[#1E3B2E]"
                            />
                            <span className="text-xs font-bold text-stone-900">
                              {opt.enabled !== false ? "Active Tier" : "Disabled Tier"}
                            </span>
                          </label>

                          <span className="text-xs font-mono font-bold text-[#8C4B31] bg-amber-50 px-2 py-0.5 rounded">
                            {opt.value} GSM
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Display Label</label>
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) => {
                                const updated = [...studioConfig.gsm_options];
                                updated[index] = { ...opt, label: e.target.value };
                                setStudioConfig((prev) => ({ ...prev, gsm_options: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-2 bg-[#FAF7F2] text-xs font-bold text-stone-900"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Base Cost (ETB / Unit)</label>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono font-bold text-stone-500">ETB</span>
                              <input
                                type="number"
                                step="0.5"
                                min="1"
                                value={opt.baseCost}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 1;
                                  const updated = [...studioConfig.gsm_options];
                                  updated[index] = { ...opt, baseCost: val };
                                  setStudioConfig((prev) => ({ ...prev, gsm_options: updated }));
                                }}
                                className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Load Rating (Max kg)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={opt.maxKg}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                const updated = [...studioConfig.gsm_options];
                                updated[index] = { ...opt, maxKg: val };
                                setStudioConfig((prev) => ({ ...prev, gsm_options: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-800"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Gauge & Ply Layers</label>
                            <input
                              type="text"
                              value={opt.gauge}
                              onChange={(e) => {
                                const updated = [...studioConfig.gsm_options];
                                updated[index] = { ...opt, gauge: e.target.value };
                                setStudioConfig((prev) => ({ ...prev, gsm_options: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs text-stone-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Feel & Tactile Rigidity</label>
                          <input
                            type="text"
                            value={opt.feel}
                            onChange={(e) => {
                              const updated = [...studioConfig.gsm_options];
                              updated[index] = { ...opt, feel: e.target.value };
                              setStudioConfig((prev) => ({ ...prev, gsm_options: updated }));
                            }}
                            className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs text-stone-700"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Recommended Products (Best For)</label>
                          <input
                            type="text"
                            value={opt.bestFor}
                            onChange={(e) => {
                              const updated = [...studioConfig.gsm_options];
                              updated[index] = { ...opt, bestFor: e.target.value };
                              setStudioConfig((prev) => ({ ...prev, gsm_options: updated }));
                            }}
                            className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs text-stone-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 3: Handles & Grips */}
              {studioSubTab === "handles" && (
                <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                        <Tag size={16} className="text-[#8C4B31]" />
                        <span>Handle Grip Constructions & Surcharges (ETB / Unit)</span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Set positive surcharges (e.g. +3.5 ETB for cotton rope) or negative discounts (e.g. -2.0 ETB for no handle).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newHandle: HandleOptionConfig = {
                          id: `handle-${Date.now()}`,
                          name: "Reinforced Grosgrain Tape",
                          description: "Textured woven grosgrain fabric tape for upscale fashion",
                          costDelta: 4.0,
                          gripFeel: "Textured Ribbed Weave",
                          maxKg: 10.0,
                          bestFor: "High-end footwear and fashion retail",
                          enabled: true,
                        };
                        setStudioConfig((prev) => ({
                          ...prev,
                          handle_options: [...prev.handle_options, newHandle],
                        }));
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus size={14} />
                      <span>Add Handle Style</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studioConfig.handle_options.map((handle, index) => (
                      <div
                        key={handle.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          handle.enabled !== false
                            ? "bg-white border-stone-200 shadow-2xs"
                            : "bg-stone-50 border-stone-200/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={handle.enabled !== false}
                              onChange={(e) => {
                                const updated = [...studioConfig.handle_options];
                                updated[index] = { ...handle, enabled: e.target.checked };
                                setStudioConfig((prev) => ({ ...prev, handle_options: updated }));
                              }}
                              className="w-4 h-4 rounded text-[#1E3B2E] focus:ring-[#1E3B2E]"
                            />
                            <span className="text-xs font-bold text-stone-900">
                              {handle.enabled !== false ? "Active Handle" : "Disabled"}
                            </span>
                          </label>

                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              handle.costDelta > 0
                                ? "bg-amber-100 text-[#8C4B31]"
                                : handle.costDelta < 0
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {handle.costDelta > 0 ? `+${handle.costDelta.toFixed(2)} ETB` : handle.costDelta < 0 ? `${handle.costDelta.toFixed(2)} ETB` : "0 ETB (Included)"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Handle Name</label>
                            <input
                              type="text"
                              value={handle.name}
                              onChange={(e) => {
                                const updated = [...studioConfig.handle_options];
                                updated[index] = { ...handle, name: e.target.value };
                                setStudioConfig((prev) => ({ ...prev, handle_options: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-2 bg-[#FAF7F2] text-xs font-bold text-stone-900"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Surcharge Delta (ETB)</label>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono font-bold text-stone-500">ETB</span>
                              <input
                                type="number"
                                step="0.5"
                                value={handle.costDelta}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const updated = [...studioConfig.handle_options];
                                  updated[index] = { ...handle, costDelta: val };
                                  setStudioConfig((prev) => ({ ...prev, handle_options: updated }));
                                }}
                                className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Load Rating (Max kg)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={handle.maxKg}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                const updated = [...studioConfig.handle_options];
                                updated[index] = { ...handle, maxKg: val };
                                setStudioConfig((prev) => ({ ...prev, handle_options: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-800"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Grip Tactile Feel</label>
                            <input
                              type="text"
                              value={handle.gripFeel}
                              onChange={(e) => {
                                const updated = [...studioConfig.handle_options];
                                updated[index] = { ...handle, gripFeel: e.target.value };
                                setStudioConfig((prev) => ({ ...prev, handle_options: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs text-stone-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Best For Note</label>
                          <input
                            type="text"
                            value={handle.bestFor}
                            onChange={(e) => {
                              const updated = [...studioConfig.handle_options];
                              updated[index] = { ...handle, bestFor: e.target.value };
                              setStudioConfig((prev) => ({ ...prev, handle_options: updated }));
                            }}
                            className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs text-stone-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 4: Print & Finishes */}
              {studioSubTab === "finishes" && (
                <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                        <Sparkles size={16} className="text-[#1E3B2E]" />
                        <span>Print Finishing & Branding Techniques (ETB Surcharges)</span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Manage foil stamping, traditional Ethiopian Tibeb patterns, soy screenprinting, debossing, and spot UV options.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newPrint: PrintOptionConfig = {
                          id: `print-${Date.now()}`,
                          name: "Holographic Iridescent Foil",
                          description: "Color-shifting optical prism foil for anti-counterfeit & luxury",
                          costDelta: 6.5,
                          finishType: "Prismatic Foil Refraction",
                          tactileBadge: "Anti-Counterfeit Shimmer",
                          bestFor: "VIP luxury fashion and limited edition releases",
                          enabled: true,
                        };
                        setStudioConfig((prev) => ({
                          ...prev,
                          print_options: [...prev.print_options, newPrint],
                        }));
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus size={14} />
                      <span>Add Print Finish</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studioConfig.print_options.map((print, index) => (
                      <div
                        key={print.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          print.enabled !== false
                            ? "bg-white border-stone-200 shadow-2xs"
                            : "bg-stone-50 border-stone-200/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={print.enabled !== false}
                              onChange={(e) => {
                                const updated = [...studioConfig.print_options];
                                updated[index] = { ...print, enabled: e.target.checked };
                                setStudioConfig((prev) => ({ ...prev, print_options: updated }));
                              }}
                              className="w-4 h-4 rounded text-[#1E3B2E] focus:ring-[#1E3B2E]"
                            />
                            <span className="text-xs font-bold text-stone-900">
                              {print.enabled !== false ? "Active Finish" : "Disabled"}
                            </span>
                          </label>

                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-[#8C4B31]">
                            +{print.costDelta.toFixed(2)} ETB
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Finish Name</label>
                            <input
                              type="text"
                              value={print.name}
                              onChange={(e) => {
                                const updated = [...studioConfig.print_options];
                                updated[index] = { ...print, name: e.target.value };
                                setStudioConfig((prev) => ({ ...prev, print_options: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-2 bg-[#FAF7F2] text-xs font-bold text-stone-900"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Surcharge (ETB / Unit)</label>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono font-bold text-stone-500">ETB</span>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={print.costDelta}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const updated = [...studioConfig.print_options];
                                  updated[index] = { ...print, costDelta: val };
                                  setStudioConfig((prev) => ({ ...prev, print_options: updated }));
                                }}
                                className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Finish Classification</label>
                            <input
                              type="text"
                              value={print.finishType}
                              onChange={(e) => {
                                const updated = [...studioConfig.print_options];
                                updated[index] = { ...print, finishType: e.target.value };
                                setStudioConfig((prev) => ({ ...prev, print_options: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs text-stone-800"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Tactile Badge Tag</label>
                            <input
                              type="text"
                              value={print.tactileBadge}
                              onChange={(e) => {
                                const updated = [...studioConfig.print_options];
                                updated[index] = { ...print, tactileBadge: e.target.value };
                                setStudioConfig((prev) => ({ ...prev, print_options: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs text-stone-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Best For Note</label>
                          <input
                            type="text"
                            value={print.bestFor}
                            onChange={(e) => {
                              const updated = [...studioConfig.print_options];
                              updated[index] = { ...print, bestFor: e.target.value };
                              setStudioConfig((prev) => ({ ...prev, print_options: updated }));
                            }}
                            className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs text-stone-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 5: Paper Colors */}
              {studioSubTab === "colors" && (
                <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                        <Palette size={16} className="text-[#8C4B31]" />
                        <span>Paper Color Stocks & Swatches</span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Configure kraft shades (Brown, Bleached White, Charcoal Black), hex color codes, and bleaching/dyeing surcharges.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newColor: PaperColorConfig = {
                          id: `color-${Date.now()}`,
                          name: "Forest Green Kraft",
                          bgHex: "#2C402E",
                          borderHex: "#1E2B1F",
                          textClass: "text-stone-100",
                          surcharge: 2.5,
                          enabled: true,
                        };
                        setStudioConfig((prev) => ({
                          ...prev,
                          paper_colors: [...prev.paper_colors, newColor],
                        }));
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus size={14} />
                      <span>Add Color Stock</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {studioConfig.paper_colors.map((color, index) => (
                      <div
                        key={color.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          color.enabled !== false
                            ? "bg-white border-stone-200 shadow-2xs"
                            : "bg-stone-50 border-stone-200/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={color.enabled !== false}
                              onChange={(e) => {
                                const updated = [...studioConfig.paper_colors];
                                updated[index] = { ...color, enabled: e.target.checked };
                                setStudioConfig((prev) => ({ ...prev, paper_colors: updated }));
                              }}
                              className="w-4 h-4 rounded text-[#1E3B2E] focus:ring-[#1E3B2E]"
                            />
                            <span className="text-xs font-bold text-stone-900">
                              {color.enabled !== false ? "Active Stock" : "Disabled"}
                            </span>
                          </label>

                          <div
                            className="w-6 h-6 rounded-full border shadow-xs"
                            style={{ backgroundColor: color.bgHex, borderColor: color.borderHex }}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Color Name</label>
                          <input
                            type="text"
                            value={color.name}
                            onChange={(e) => {
                              const updated = [...studioConfig.paper_colors];
                              updated[index] = { ...color, name: e.target.value };
                              setStudioConfig((prev) => ({ ...prev, paper_colors: updated }));
                            }}
                            className="w-full border border-stone-200 rounded-lg p-2 bg-[#FAF7F2] text-xs font-bold text-stone-900"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Surcharge (ETB / Unit)</label>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono font-bold text-stone-500">ETB</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={color.surcharge}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...studioConfig.paper_colors];
                                updated[index] = { ...color, surcharge: val };
                                setStudioConfig((prev) => ({ ...prev, paper_colors: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Background Hex</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="color"
                                value={color.bgHex}
                                onChange={(e) => {
                                  const updated = [...studioConfig.paper_colors];
                                  updated[index] = { ...color, bgHex: e.target.value };
                                  setStudioConfig((prev) => ({ ...prev, paper_colors: updated }));
                                }}
                                className="w-7 h-7 rounded border border-stone-300 cursor-pointer p-0"
                              />
                              <input
                                type="text"
                                value={color.bgHex}
                                onChange={(e) => {
                                  const updated = [...studioConfig.paper_colors];
                                  updated[index] = { ...color, bgHex: e.target.value };
                                  setStudioConfig((prev) => ({ ...prev, paper_colors: updated }));
                                }}
                                className="w-full border border-stone-200 rounded-lg p-1 bg-[#FAF7F2] text-[10px] font-mono text-stone-800"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Border Hex</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="color"
                                value={color.borderHex}
                                onChange={(e) => {
                                  const updated = [...studioConfig.paper_colors];
                                  updated[index] = { ...color, borderHex: e.target.value };
                                  setStudioConfig((prev) => ({ ...prev, paper_colors: updated }));
                                }}
                                className="w-7 h-7 rounded border border-stone-300 cursor-pointer p-0"
                              />
                              <input
                                type="text"
                                value={color.borderHex}
                                onChange={(e) => {
                                  const updated = [...studioConfig.paper_colors];
                                  updated[index] = { ...color, borderHex: e.target.value };
                                  setStudioConfig((prev) => ({ ...prev, paper_colors: updated }));
                                }}
                                className="w-full border border-stone-200 rounded-lg p-1 bg-[#FAF7F2] text-[10px] font-mono text-stone-800"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 6: Quantity Tiers & Wholesale Discounts */}
              {studioSubTab === "quantities" && (
                <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                        <ShoppingBag size={16} className="text-[#1E3B2E]" />
                        <span>Wholesale Quantity Tiers & Volume Multipliers</span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Set volume discount percentages. Multiplier 1.0 = base price, 0.85 = 15% discount, 1.15 = 15% short-run surcharge.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newTier: QuantityTierConfig = {
                          value: "20,000+ pcs",
                          count: 20000,
                          label: "20,000+ pcs (Mega Industrial Export)",
                          discountBadge: "Export Master Tier",
                          unitMultiplier: 0.72,
                          enabled: true,
                        };
                        setStudioConfig((prev) => ({
                          ...prev,
                          quantity_tiers: [...prev.quantity_tiers, newTier],
                        }));
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus size={14} />
                      <span>Add Quantity Tier</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studioConfig.quantity_tiers.map((tier, index) => (
                      <div
                        key={tier.value}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          tier.enabled !== false
                            ? "bg-white border-stone-200 shadow-2xs"
                            : "bg-stone-50 border-stone-200/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tier.enabled !== false}
                              onChange={(e) => {
                                const updated = [...studioConfig.quantity_tiers];
                                updated[index] = { ...tier, enabled: e.target.checked };
                                setStudioConfig((prev) => ({ ...prev, quantity_tiers: updated }));
                              }}
                              className="w-4 h-4 rounded text-[#1E3B2E] focus:ring-[#1E3B2E]"
                            />
                            <span className="text-xs font-bold text-stone-900">
                              {tier.enabled !== false ? "Active Tier" : "Disabled"}
                            </span>
                          </label>

                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Multiplier: ×{tier.unitMultiplier.toFixed(2)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Tier Value</label>
                            <input
                              type="text"
                              value={tier.value}
                              onChange={(e) => {
                                const updated = [...studioConfig.quantity_tiers];
                                updated[index] = { ...tier, value: e.target.value };
                                setStudioConfig((prev) => ({ ...prev, quantity_tiers: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-2 bg-[#FAF7F2] text-xs font-bold text-stone-900"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Quantity Count (Units)</label>
                            <input
                              type="number"
                              min="100"
                              step="100"
                              value={tier.count}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 500;
                                const updated = [...studioConfig.quantity_tiers];
                                updated[index] = { ...tier, count: val };
                                setStudioConfig((prev) => ({ ...prev, quantity_tiers: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-2 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Subline Description Label</label>
                          <input
                            type="text"
                            value={tier.label}
                            onChange={(e) => {
                              const updated = [...studioConfig.quantity_tiers];
                              updated[index] = { ...tier, label: e.target.value };
                              setStudioConfig((prev) => ({ ...prev, quantity_tiers: updated }));
                            }}
                            className="w-full border border-stone-200 rounded-lg p-2 bg-[#FAF7F2] text-xs text-stone-800"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Discount Badge Text</label>
                            <input
                              type="text"
                              value={tier.discountBadge || ""}
                              onChange={(e) => {
                                const updated = [...studioConfig.quantity_tiers];
                                updated[index] = { ...tier, discountBadge: e.target.value };
                                setStudioConfig((prev) => ({ ...prev, quantity_tiers: updated }));
                              }}
                              placeholder="e.g. 15% Savings"
                              className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-semibold text-amber-900"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Unit Multiplier</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.4"
                              max="2.0"
                              value={tier.unitMultiplier}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1.0;
                                const updated = [...studioConfig.quantity_tiers];
                                updated[index] = { ...tier, unitMultiplier: val };
                                setStudioConfig((prev) => ({ ...prev, quantity_tiers: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 7: Turnaround Speeds & Urgency */}
              {studioSubTab === "turnaround" && (
                <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                        <Clock size={16} className="text-[#8C4B31]" />
                        <span>Production Speeds & Urgency Lead Times</span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Configure production lead times and rush multipliers (e.g. +15% rush surcharge for priority line reservation).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newSpeed: TurnaroundOptionConfig = {
                          id: `turnaround-${Date.now()}`,
                          label: "Same-Week Emergency",
                          days: "1-2 Days",
                          multiplier: 1.5,
                          badge: "+50% Emergency Run",
                          description: "Overtime plant shift dedicated to instant launch",
                          enabled: true,
                        };
                        setStudioConfig((prev) => ({
                          ...prev,
                          turnaround_options: [...prev.turnaround_options, newSpeed],
                        }));
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus size={14} />
                      <span>Add Speed Option</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {studioConfig.turnaround_options.map((t, index) => (
                      <div
                        key={t.id}
                        className={`p-4 rounded-2xl border transition-all space-y-3 ${
                          t.enabled !== false
                            ? "bg-white border-stone-200 shadow-2xs"
                            : "bg-stone-50 border-stone-200/60 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={t.enabled !== false}
                              onChange={(e) => {
                                const updated = [...studioConfig.turnaround_options];
                                updated[index] = { ...t, enabled: e.target.checked };
                                setStudioConfig((prev) => ({ ...prev, turnaround_options: updated }));
                              }}
                              className="w-4 h-4 rounded text-[#1E3B2E] focus:ring-[#1E3B2E]"
                            />
                            <span className="text-xs font-bold text-stone-900">
                              {t.enabled !== false ? "Active Option" : "Disabled"}
                            </span>
                          </label>

                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-[#8C4B31]">
                            ×{t.multiplier.toFixed(2)}
                          </span>
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Speed Label</label>
                          <input
                            type="text"
                            value={t.label}
                            onChange={(e) => {
                              const updated = [...studioConfig.turnaround_options];
                              updated[index] = { ...t, label: e.target.value };
                              setStudioConfig((prev) => ({ ...prev, turnaround_options: updated }));
                            }}
                            className="w-full border border-stone-200 rounded-lg p-2 bg-[#FAF7F2] text-xs font-bold text-stone-900"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Days Duration</label>
                            <input
                              type="text"
                              value={t.days}
                              onChange={(e) => {
                                const updated = [...studioConfig.turnaround_options];
                                updated[index] = { ...t, days: e.target.value };
                                setStudioConfig((prev) => ({ ...prev, turnaround_options: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-medium text-stone-800"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-stone-500 block mb-0.5">Price Multiplier</label>
                            <input
                              type="number"
                              step="0.05"
                              min="0.8"
                              max="3.0"
                              value={t.multiplier}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1.0;
                                const updated = [...studioConfig.turnaround_options];
                                updated[index] = { ...t, multiplier: val };
                                setStudioConfig((prev) => ({ ...prev, turnaround_options: updated }));
                              }}
                              className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs font-mono font-bold text-stone-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Badge Text</label>
                          <input
                            type="text"
                            value={t.badge || ""}
                            onChange={(e) => {
                              const updated = [...studioConfig.turnaround_options];
                              updated[index] = { ...t, badge: e.target.value };
                              setStudioConfig((prev) => ({ ...prev, turnaround_options: updated }));
                            }}
                            placeholder="e.g. +15% Rush Surcharge"
                            className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs text-stone-800"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Description</label>
                          <input
                            type="text"
                            value={t.description}
                            onChange={(e) => {
                              const updated = [...studioConfig.turnaround_options];
                              updated[index] = { ...t, description: e.target.value };
                              setStudioConfig((prev) => ({ ...prev, turnaround_options: updated }));
                            }}
                            className="w-full border border-stone-200 rounded-lg p-1.5 bg-[#FAF7F2] text-xs text-stone-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 8: Studio Copy, Headings & Public Banners */}
              {studioSubTab === "headings" && (
                <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="border-b border-stone-100 pb-2">
                    <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
                      <PenTool size={16} className="text-[#1E3B2E]" />
                      <span>Design Studio Public Copy & Guidance Texts</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Change the headline, subtitle, min-order notices, and proofing text displayed on the public Customizer page.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Top Studio Eyebrow Badge
                      </label>
                      <input
                        type="text"
                        value={studioConfig.headings.badge}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudioConfig((prev) => ({
                            ...prev,
                            headings: { ...prev.headings, badge: val },
                          }));
                        }}
                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs font-bold text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Main Studio Title (H1)
                      </label>
                      <input
                        type="text"
                        value={studioConfig.headings.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudioConfig((prev) => ({
                            ...prev,
                            headings: { ...prev.headings, title: val },
                          }));
                        }}
                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs font-serif font-bold text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Subtitle / Value Proposition
                      </label>
                      <textarea
                        rows={3}
                        value={studioConfig.headings.subtitle}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudioConfig((prev) => ({
                            ...prev,
                            headings: { ...prev.headings, subtitle: val },
                          }));
                        }}
                        className="w-full border border-stone-200 rounded-xl p-2.5 bg-[#FAF7F2] text-xs text-stone-800 leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Minimum Production Order Run Notice
                        </label>
                        <input
                          type="text"
                          value={studioConfig.headings.minOrderNotice}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudioConfig((prev) => ({
                              ...prev,
                              headings: { ...prev.headings, minOrderNotice: val },
                            }));
                          }}
                          className="w-full border border-stone-200 rounded-xl p-2 bg-[#FAF7F2] text-xs text-stone-900"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Sample Proof Notice
                        </label>
                        <input
                          type="text"
                          value={studioConfig.headings.sampleProofNotice}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudioConfig((prev) => ({
                              ...prev,
                              headings: { ...prev.headings, sampleProofNotice: val },
                            }));
                          }}
                          className="w-full border border-stone-200 rounded-xl p-2 bg-[#FAF7F2] text-xs text-stone-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Quotation Calculator Simulator Box */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#FAF7F2] to-amber-50/40 border border-stone-300 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h4 className="font-serif text-sm font-bold text-stone-900">
                      Live Studio Pricing Formula Simulator (Admin Test Sandbox)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    Instant Calculation Check
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Bag Preset</label>
                    <select
                      value={testPresetId}
                      onChange={(e) => setTestPresetId(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-medium"
                    >
                      {studioConfig.presets.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Paper GSM</label>
                    <select
                      value={testGsm}
                      onChange={(e) => setTestGsm(parseInt(e.target.value, 10))}
                      className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-medium"
                    >
                      {studioConfig.gsm_options.map((g) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Handle Grip</label>
                    <select
                      value={testHandleId}
                      onChange={(e) => setTestHandleId(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-medium"
                    >
                      {studioConfig.handle_options.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Print Finish</label>
                    <select
                      value={testPrintId}
                      onChange={(e) => setTestPrintId(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-medium"
                    >
                      {studioConfig.print_options.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Paper Color</label>
                    <select
                      value={testColorId}
                      onChange={(e) => setTestColorId(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-medium"
                    >
                      {studioConfig.paper_colors.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">Batch Run</label>
                    <select
                      value={testCount}
                      onChange={(e) => setTestCount(parseInt(e.target.value, 10))}
                      className="w-full border border-stone-300 rounded-lg p-1.5 bg-white text-xs font-medium font-mono"
                    >
                      {studioConfig.quantity_tiers.map((q) => (
                        <option key={q.count} value={q.count}>{q.value}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-stone-200">
                  <div className="text-xs text-stone-600">
                    <span>Testing Formula: </span>
                    <strong className="text-stone-900">{testCount.toLocaleString()} units</strong>
                    <span> • Chosen options update live dynamically.</span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Estimated Unit Cost</span>
                      <span className="text-lg font-mono font-bold text-[#8C4B31]">
                        ~{simulatedQuote.unitPrice.toFixed(2)} ETB
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider block">Batch Total Investment</span>
                      <span className="text-xl font-mono font-bold text-[#1E3B2E]">
                        {simulatedQuote.totalPrice.toLocaleString()} ETB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Sticky Save Bar */}
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
