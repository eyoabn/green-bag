"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Leaf, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ArrowUpRight, 
  Heart,
  FileText,
  Send
} from "lucide-react";

interface SiteSettings {
  company_name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  social_links?: {
    facebook?: string;
    instagram?: string;
    telegram?: string;
    linkedin?: string;
  };
}

export default function Footer() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SiteSettings>({
    company_name: "Ethiopia Arenguade Paper Product PLC",
    contact_phone: "+251 911 223 344",
    contact_email: "info@arenguadepaper.com",
    address: "Bole Sub-City, Woreda 03, Addis Ababa, Ethiopia",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Hide on admin and dashboard internal pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <footer className="bg-[#1B2720] text-stone-300 pt-20 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-stone-800/80">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#8C4B31] flex items-center justify-center text-[#FAF7F2] font-serif font-black text-lg shadow-sm">
                አ
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-white">
                  {settings.company_name?.includes("Arenguade") ? "Arenguade" : settings.company_name}
                </span>
                <span className="text-[11px] font-semibold tracking-wider text-[#E0B382] uppercase">
                  {settings.company_name}
                </span>
              </div>
            </div>

            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              Pioneering circular eco-packaging in East Africa. We manufacture 100% biodegradable kraft bags and empower Ethiopian youth and women through vocational paper-crafting academies.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/40 text-emerald-300 text-xs font-medium">
                <Leaf size={12} className="text-emerald-400" />
                Zero Plastic Initiative
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/40 text-amber-200 text-xs font-medium">
                <ShieldCheck size={12} className="text-amber-400" />
                ISO 14001 Compliant
              </span>
            </div>

            {/* Social Links */}
            {settings.social_links && (settings.social_links.telegram || settings.social_links.instagram || settings.social_links.facebook || settings.social_links.linkedin) && (
              <div className="flex items-center gap-3 pt-1">
                {settings.social_links.telegram && (
                  <a
                    href={settings.social_links.telegram.startsWith("http") ? settings.social_links.telegram : `https://t.me/${settings.social_links.telegram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-stone-800 hover:bg-[#8C4B31] text-stone-300 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
                    title="Telegram"
                  >
                    <Send size={14} />
                  </a>
                )}
                {settings.social_links.instagram && (
                  <a
                    href={settings.social_links.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-stone-800 hover:bg-[#8C4B31] text-stone-300 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
                    title="Instagram"
                  >
                    IG
                  </a>
                )}
                {settings.social_links.facebook && (
                  <a
                    href={settings.social_links.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-stone-800 hover:bg-[#8C4B31] text-stone-300 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
                    title="Facebook"
                  >
                    FB
                  </a>
                )}
                {settings.social_links.linkedin && (
                  <a
                    href={settings.social_links.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-stone-800 hover:bg-[#8C4B31] text-stone-300 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
                    title="LinkedIn"
                  >
                    IN
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Catalog Links */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-base font-bold text-white tracking-wide">Catalog & B2B</h4>
            <ul className="space-y-2.5 text-xs font-medium text-stone-400">
              <li><Link href="/products" className="hover:text-[#E0B382] transition-colors">Specialty Coffee Bags</Link></li>
              <li><Link href="/products" className="hover:text-[#E0B382] transition-colors">Luxury Boutique Totes</Link></li>
              <li><Link href="/products" className="hover:text-[#E0B382] transition-colors">Bakery & Food Pouches</Link></li>
              <li><Link href="/products" className="hover:text-[#E0B382] transition-colors">Heavy-Duty Kraft Sacks</Link></li>
              <li><Link href="/design-submission" className="hover:text-[#E0B382] transition-colors flex items-center gap-1">Custom 3D Lab <ArrowUpRight size={12} /></Link></li>
            </ul>
          </div>

          {/* Craft Academy */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-base font-bold text-white tracking-wide">Craft Academy</h4>
            <ul className="space-y-2.5 text-xs font-medium text-stone-400">
              <li><Link href="/learn" className="hover:text-[#E0B382] transition-colors">Curriculum Overview</Link></li>
              <li><Link href="/learn/schedule" className="hover:text-[#E0B382] transition-colors">In-Person Studio (Addis)</Link></li>
              <li><Link href="/learn/schedule" className="hover:text-[#E0B382] transition-colors flex items-center gap-1">LiveKit Online Classes <span className="bg-[#8C4B31] text-white text-[9px] px-1.5 py-0.2 rounded-full">Live</span></Link></li>
              <li><Link href="/learn" className="hover:text-[#E0B382] transition-colors">Corporate Team Workshops</Link></li>
              <li><Link href="/learn" className="hover:text-[#E0B382] transition-colors">Artisan Apprenticeship</Link></li>
            </ul>
          </div>

          {/* Investor & Contact */}
          <div className="flex flex-col gap-3">
            <h4 className="font-serif text-base font-bold text-white tracking-wide">Headquarters & Desk</h4>
            <ul className="space-y-3 text-xs text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="text-[#8C4B31] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{settings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="text-[#8C4B31] shrink-0" />
                <span>{settings.contact_phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="text-[#8C4B31] shrink-0" />
                <span>{settings.contact_email}</span>
              </li>
              <li className="pt-2">
                <a 
                  href={`mailto:${settings.contact_email}?subject=Inquiry%20-%20Arenguade`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#E0B382] hover:underline"
                >
                  <FileText size={13} />
                  Request Investor Deck (Q4 2026)
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar with Banking Partners & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-4 text-[11px]">
            <span>Verified Banking:</span>
            <span className="font-semibold text-stone-400">CBE (Commercial Bank of Ethiopia)</span>
            <span>•</span>
            <span className="font-semibold text-stone-400">Telebirr SuperApp</span>
            <span>•</span>
            <span className="font-semibold text-stone-400">Awash Bank</span>
          </div>

          <div className="flex items-center gap-2 text-stone-400">
            <span>© 2026 {settings.company_name}.</span>
            <span>Crafted with</span>
            <Heart size={12} className="text-[#8C4B31] fill-current" />
            <span>in Addis Ababa</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
