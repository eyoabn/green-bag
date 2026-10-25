"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  AlertCircle, 
  Globe, 
  Share2, 
  ShieldCheck, 
  Clock 
} from "lucide-react";

export default function AdminSettingsPage() {
  const [companyName, setCompanyName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [settlementDays, setSettlementDays] = useState(3);
  
  // Social Links
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");

  // Homepage Content (editable by admin)
  const [heroBadge, setHeroBadge] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubline, setHeroSubline] = useState("");
  const [showcaseTitle, setShowcaseTitle] = useState("");
  const [showcaseSub, setShowcaseSub] = useState("");
  const [stat1Val, setStat1Val] = useState("1.2M+");
  const [stat1Label, setStat1Label] = useState("Bags Manufactured");
  const [stat2Val, setStat2Val] = useState("50+");
  const [stat2Label, setStat2Label] = useState("Enterprise Clients");
  const [stat3Val, setStat3Val] = useState("100%");
  const [stat3Label, setStat3Label] = useState("Biodegradable Kraft");
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementVisible, setAnnouncementVisible] = useState(false);
  const [classesSectionTitle, setClassesSectionTitle] = useState("Upcoming Classes Ready for Registration");
  const [classesSectionSub, setClassesSectionSub] = useState("Join our hands-on packaging and artisan print workshops");
  const [classesSectionVisible, setClassesSectionVisible] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSettings = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/settings");
      const resJson = await res.json();
      if (res.ok && resJson?.success && resJson.settings) {
        const s = resJson.settings;
        setCompanyName(s.company_name || "");
        setContactPhone(s.contact_phone || "");
        setContactEmail(s.contact_email || "");
        setAddress(s.address || "");
        setTaxId(s.tax_id || "");
        setSettlementDays(s.settlement_days || 3);

        const socials = s.social_links || {};
        setFacebook(socials.facebook || "");
        setInstagram(socials.instagram || "");
        setTelegram(socials.telegram || "");
        setLinkedin(socials.linkedin || "");
        setTiktok(socials.tiktok || "");
        setYoutube(socials.youtube || "");

        // Homepage content
        const content = s.homepage_content || {};
        setHeroBadge(content.hero_badge || "");
        setHeroHeadline(content.hero_headline || "");
        setHeroSubline(content.hero_subline || "");
        setShowcaseTitle(content.showcase_title || "");
        setShowcaseSub(content.showcase_sub || "");
        setStat1Val(content.stat_1_val || "1.2M+");
        setStat1Label(content.stat_1_label || "Bags Manufactured");
        setStat2Val(content.stat_2_val || "50+");
        setStat2Label(content.stat_2_label || "Enterprise Clients");
        setStat3Val(content.stat_3_val || "100%");
        setStat3Label(content.stat_3_label || "Biodegradable Kraft");
        setAnnouncementText(content.announcement_text || "");
        setAnnouncementVisible(Boolean(content.announcement_visible));
        setClassesSectionTitle(content.classes_section_title ?? "Upcoming Classes Ready for Registration");
        setClassesSectionSub(content.classes_section_sub ?? "Join our hands-on packaging and artisan print workshops");
        setClassesSectionVisible(content.classes_section_visible !== false);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setSuccessMsg("Factory settings updated successfully! Public footers and contact portals are updated live.");
        setTimeout(() => setSuccessMsg(""), 4500);
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
    <div className="flex flex-col max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Global Manufacturing Identity
          </span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
          Factory & Company Settings
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Configure legal enterprise details, public customer channels, and official social portals. These values sync directly to the public footer and customer touchpoints.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold animate-in fade-in">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading company configuration...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* Section 1: Company Legal Identity */}
            <div className="space-y-4">
              <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                <Building2 size={16} className="text-[#1E3B2E]" />
                <span>Enterprise Credentials</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Company Legal Trade Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-stone-500" />
                    Federal Tax ID / TIN
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ETH-TIN-2024-001"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Clock size={14} className="text-stone-500" />
                    Default Settlement Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={settlementDays}
                    onChange={(e) => setSettlementDays(Number(e.target.value))}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contact Information */}
            <div className="space-y-4 pt-2">
              <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                <Phone size={16} className="text-[#1E3B2E]" />
                <span>Public Communications</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Phone size={13} className="text-stone-500" />
                    Official Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Mail size={13} className="text-stone-500" />
                    Official Inquiry Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <MapPin size={13} className="text-stone-500" />
                    Plant & Headquarters Physical Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Social & Community Channels */}
            <div className="space-y-4 pt-2">
              <h3 className="font-serif text-base font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center gap-2">
                <Share2 size={16} className="text-[#1E3B2E]" />
                <span>Social Links & Digital Footprint</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Telegram Channel / Support Handle
                  </label>
                  <input
                    type="text"
                    placeholder="https://t.me/arenguadepaper or @arenguadepaper"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    TikTok Channel
                  </label>
                  <input
                    type="text"
                    placeholder="https://tiktok.com/@arenguadepaper"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    YouTube Channel
                  </label>
                  <input
                    type="text"
                    placeholder="https://youtube.com/@arenguadepaper"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Instagram Profile
                  </label>
                  <input
                    type="text"
                    placeholder="https://instagram.com/arenguadepaper"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Facebook Page
                  </label>
                  <input
                    type="text"
                    placeholder="https://facebook.com/arenguadepaper"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    LinkedIn Organization
                  </label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/company/arenguade"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Front-End CMS & Content Management */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <h3 className="font-serif text-base font-bold text-stone-900 pb-2 flex items-center gap-2">
                <span className="text-lg">🎨</span>
                <span>Front-End CMS & Homepage Content</span>
              </h3>
              <p className="text-[11px] text-stone-500 -mt-2">
                Control the headlines, announcement banners, showcase descriptions, and statistics on the public website. Changes take effect instantly without needing any coder.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Hero Badge / Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sustainable Paper Packaging • Addis Ababa"
                    value={heroBadge}
                    onChange={(e) => setHeroBadge(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Hero Main Headline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Artisan Paper Packaging, Crafted in Addis Ababa"
                    value={heroHeadline}
                    onChange={(e) => setHeroHeadline(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Hero Subline / Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. We manufacture premium kraft bags and custom packaging for Ethiopia's finest cafés..."
                    value={heroSubline}
                    onChange={(e) => setHeroSubline(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 resize-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Showcase Section Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Custom Packaging Showcase"
                      value={showcaseTitle}
                      onChange={(e) => setShowcaseTitle(e.target.value)}
                      className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Showcase Subtext
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Real production runs manufactured for Ethiopian roasters..."
                      value={showcaseSub}
                      onChange={(e) => setShowcaseSub(e.target.value)}
                      className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 text-xs"
                    />
                  </div>
                </div>

                {/* Factory Statistics Counters */}
                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <span className="block font-bold text-xs uppercase text-stone-700 tracking-wider">
                    Factory Trust Statistics (Homepage Counter Badges)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-200">
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Stat 1 (Value & Label)</label>
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
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Stat 2 (Value & Label)</label>
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
                      <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Stat 3 (Value & Label)</label>
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
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementVisible}
                      onChange={(e) => setAnnouncementVisible(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300"
                    />
                    <span className="font-bold text-amber-900 text-xs">Show Announcement Banner on Homepage</span>
                  </label>
                  {announcementVisible && (
                    <input
                      type="text"
                      placeholder="e.g. 🎉 New: Premium Eucalyptus Collection Now Available"
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      className="w-full border border-amber-300 rounded-xl p-3 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-400/30 text-xs"
                    />
                  )}
                </div>

                {/* Admin Control for "Upcoming Classes Ready for Registration" Section */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        Homepage &quot;Upcoming Classes&quot; Section Control
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Customize or toggle the public masterclasses registration banner on the homepage.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-700">
                      <input
                        type="checkbox"
                        checked={classesSectionVisible}
                        onChange={(e) => setClassesSectionVisible(e.target.checked)}
                        className="w-4 h-4 rounded border-stone-300 text-[#1E3B2E]"
                      />
                      <span>Visible on Home</span>
                    </label>
                  </div>

                  {classesSectionVisible && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                          Section Headline
                        </label>
                        <input
                          type="text"
                          value={classesSectionTitle}
                          onChange={(e) => setClassesSectionTitle(e.target.value)}
                          placeholder="Upcoming Classes Ready for Registration"
                          className="w-full border border-stone-300 rounded-xl p-2.5 bg-white text-xs text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                          Section Subtitle / Description
                        </label>
                        <input
                          type="text"
                          value={classesSectionSub}
                          onChange={(e) => setClassesSectionSub(e.target.value)}
                          placeholder="Join our hands-on packaging and artisan print workshops"
                          className="w-full border border-stone-300 rounded-xl p-2.5 bg-white text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-[#E0B382] hover:text-white font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving Configuration..." : "Save Plant Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
