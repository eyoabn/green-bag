"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
    tiktok?: string;
    youtube?: string;
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

  // Hide on admin, teacher, and dashboard internal pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/dashboard") || pathname?.startsWith("/teacher")) {
    return null;
  }

  return (
    <footer className="bg-[#1B2720] text-stone-300 pt-16 sm:pt-20 pb-28 md:pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-stone-800/80">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 p-1 backdrop-blur-xs border border-white/15 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                <Image
                  src="/images/arenguade-icon-transparent.png"
                  alt="Arenguade Packaging & Craft Academy"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-bold tracking-tight text-white leading-tight">
                  Arenguade
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-[#E0B382] uppercase mt-0.5">
                  Artisanal Kraft Packaging & Craft Academy
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
            {settings.social_links && (
              (settings.social_links.telegram || settings.social_links.instagram || settings.social_links.facebook || settings.social_links.linkedin || settings.social_links.tiktok || settings.social_links.youtube)
            ) && (
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                {settings.social_links?.telegram && (
                  <a
                    href={settings.social_links.telegram.startsWith("http") ? settings.social_links.telegram : `https://t.me/${settings.social_links.telegram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-stone-800 hover:bg-[#0088cc] text-stone-300 hover:text-white flex items-center justify-center transition-all shadow-xs"
                    title="Telegram Channel"
                  >
                    <Send size={15} />
                  </a>
                )}
                {settings.social_links?.tiktok && (
                  <a
                    href={settings.social_links.tiktok.startsWith("http") ? settings.social_links.tiktok : `https://www.tiktok.com/@${settings.social_links.tiktok.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-stone-800 hover:bg-black text-stone-300 hover:text-white flex items-center justify-center transition-all shadow-xs"
                    title="TikTok"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46v-7.2a8.16 8.16 0 0 0 4.77 1.54V11a4.85 4.85 0 0 1-3.23-1.25 4.85 4.85 0 0 1-1.37-3.06h3.6z" />
                    </svg>
                  </a>
                )}
                {settings.social_links?.youtube && (
                  <a
                    href={settings.social_links.youtube.startsWith("http") ? settings.social_links.youtube : `https://www.youtube.com/@${settings.social_links.youtube.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-stone-800 hover:bg-[#FF0000] text-stone-300 hover:text-white flex items-center justify-center transition-all shadow-xs"
                    title="YouTube Channel"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                )}
                {settings.social_links?.instagram && (
                  <a
                    href={settings.social_links.instagram.startsWith("http") ? settings.social_links.instagram : `https://instagram.com/${settings.social_links.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-stone-800 hover:bg-[#E4405F] text-stone-300 hover:text-white flex items-center justify-center transition-all shadow-xs"
                    title="Instagram"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                {settings.social_links?.facebook && (
                  <a
                    href={settings.social_links.facebook.startsWith("http") ? settings.social_links.facebook : `https://facebook.com/${settings.social_links.facebook.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-stone-800 hover:bg-[#1877F2] text-stone-300 hover:text-white flex items-center justify-center transition-all shadow-xs"
                    title="Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z" />
                    </svg>
                  </a>
                )}
                {settings.social_links?.linkedin && (
                  <a
                    href={settings.social_links.linkedin.startsWith("http") ? settings.social_links.linkedin : `https://linkedin.com/company/${settings.social_links.linkedin.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-stone-800 hover:bg-[#0A66C2] text-stone-300 hover:text-white flex items-center justify-center transition-all shadow-xs"
                    title="LinkedIn"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                    </svg>
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
