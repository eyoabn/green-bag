"use client";

import { useState, useEffect } from "react";
import { Settings, Building2, Phone, Mail, MapPin, Check, AlertCircle } from "lucide-react";

export default function AdminSettingsPage() {
  const [companyName, setCompanyName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [address, setAddress] = useState("");
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
        setCompanyName(resJson.settings.company_name || "");
        setContactPhone(resJson.settings.contact_phone || "");
        setContactEmail(resJson.settings.contact_email || "");
        setAddress(resJson.settings.address || "");
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
          company_name: companyName,
          contact_phone: contactPhone,
          contact_email: contactEmail,
          address,
        }),
      });
      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setSuccessMsg("Settings updated successfully! Changes are live across the site.");
        setTimeout(() => setSuccessMsg(""), 4000);
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
            Global Plant Profile
          </span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
          Factory & Company Settings
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          These details are read directly by the public landing page, contact sections, and official receipt footers.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium animate-fadeIn">
          <Check size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading company configuration...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 size={14} className="text-[#1E3B2E]" />
                Company Legal Name
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Phone size={14} className="text-[#1E3B2E]" />
                  Contact Phone Number
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
                  <Mail size={14} className="text-[#1E3B2E]" />
                  Public Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-[#1E3B2E]" />
                Plant & Office Physical Address
              </label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
              />
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
