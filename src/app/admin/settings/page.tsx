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

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

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
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load factory settings");
    } finally {
      setIsLoading(false);
    }
  };

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
