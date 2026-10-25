"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Language = "en" | "am";

/** All translatable strings for the public site */
export interface Translations {
  // Navbar
  nav_portfolio: string;
  nav_design_studio: string;
  nav_academy: string;
  nav_workshops: string;
  nav_login: string;
  nav_my_account: string;
  nav_sign_out: string;
  nav_admin_console: string;
  nav_language_toggle: string;

  // Hero
  hero_badge: string;
  hero_headline: string;
  hero_subline: string;
  hero_cta_portfolio: string;
  hero_cta_design: string;
  hero_trust_1: string;
  hero_trust_2: string;
  hero_trust_3: string;

  // Products section
  products_heading: string;
  products_subheading: string;
  products_view_all: string;
  products_view_details: string;
  products_gsm: string;

  // Catalog / Portfolio page
  catalog_badge: string;
  catalog_heading: string;
  catalog_subheading: string;
  catalog_cta_label: string;
  catalog_cta_btn: string;
  catalog_search_placeholder: string;
  catalog_results: string;
  catalog_portfolio_pieces: string;
  catalog_empty: string;
  catalog_reset: string;
  catalog_view_details: string;
  catalog_bottom_heading: string;
  catalog_bottom_sub: string;
  catalog_submit_design: string;
  catalog_workshops: string;

  // Lightbox
  lightbox_close: string;
  lightbox_full: string;
  lightbox_made_for: string;

  // Footer
  footer_tagline: string;
  footer_navigate: string;
  footer_contact: string;
  footer_rights: string;
}

const EN: Translations = {
  nav_portfolio: "Packaging Catalog",
  nav_design_studio: "Design Studio",
  nav_academy: "Craft Academy",
  nav_workshops: "Workshops",
  nav_login: "Sign In",
  nav_my_account: "My Account",
  nav_sign_out: "Sign Out",
  nav_admin_console: "Admin Console",
  nav_language_toggle: "አማ",
  hero_badge: "100% Biodegradable · Made in Ethiopia",
  hero_headline: "Artisan Paper Packaging,\nCrafted in Addis Ababa",
  hero_subline:
    "We manufacture premium kraft bags and custom packaging for Ethiopia's finest cafés, hotels, and boutiques. Commission your own branded batch.",
  hero_cta_portfolio: "View Our Portfolio",
  hero_cta_design: "Design Your Bag",
  hero_trust_1: "100% Recycled Kraft",
  hero_trust_2: "Custom Branding",
  hero_trust_3: "Made in Ethiopia",
  products_heading: "Our Packaging Portfolio",
  products_subheading: "Real production batches for real Ethiopian brands.",
  products_view_all: "View Full Portfolio",
  products_view_details: "View Details",
  products_gsm: "GSM",
  catalog_badge: "Real Production Batches · Made in Addis Ababa",
  catalog_heading: "Packaging Catalog & Factory Portfolio",
  catalog_subheading:
    "Authentic paper bags manufactured at our Addis Ababa facility for Ethiopian coffee roasters, boutique fashion houses, hotels, and bakeries.",
  catalog_cta_label: "Commission Your Own Branded Packaging",
  catalog_cta_btn: "Start Your Design",
  catalog_search_placeholder: "Search portfolio...",
  catalog_results: "portfolio pieces",
  catalog_portfolio_pieces: "portfolio pieces",
  catalog_empty: "No portfolio items found",
  catalog_reset: "Reset Filters",
  catalog_view_details: "View Details",
  catalog_bottom_heading: "Get Your Own Custom Packaging",
  catalog_bottom_sub:
    "Every piece you see above was made for a specific client. We can manufacture the same quality — with your own brand, logo, and specifications.",
  catalog_submit_design: "Submit Your Design",
  catalog_workshops: "Explore Workshops",
  lightbox_close: "Close",
  lightbox_full: "Full Details",
  lightbox_made_for: "Made for",
  footer_tagline: "Sustainable artisan paper packaging, manufactured with pride in Addis Ababa, Ethiopia.",
  footer_navigate: "Navigate",
  footer_contact: "Contact",
  footer_rights: "All rights reserved.",
};

const AM: Translations = {
  nav_portfolio: "የማሸጊያ ካታሎግ",
  nav_design_studio: "ዲዛይን ስቱዲዮ",
  nav_academy: "የዕደ ጥበብ አካዳሚ",
  nav_workshops: "ወርክሾፖች",
  nav_login: "ግባ",
  nav_my_account: "መለያዬ",
  nav_sign_out: "ውጣ",
  nav_admin_console: "አስተዳዳሪ ኮንሶል",
  nav_language_toggle: "EN",
  hero_badge: "100% ኤኮ-ምቹ · በኢትዮጵያ የተሰራ",
  hero_headline: "የዕደ ጥበብ ወረቀት ማሸጊያ፣\nበአዲስ አበባ የተሰራ",
  hero_subline:
    "ለኢትዮጵያ ምርጥ ካፌዎች፣ ሆቴሎች እና ቡቲኮች ልዩ ክራፍት ቦርሳ እና ብጁ ማሸጊያ እናመርታለን። የራስዎን ብጁ ባች ይዘዙ።",
  hero_cta_portfolio: "ፖርትፎሊዮ ይመልከቱ",
  hero_cta_design: "ቦርሳዎን ይቅረጹ",
  hero_trust_1: "100% ዳግም ጥቅም ላይ የዋለ",
  hero_trust_2: "ብጁ አሻራ",
  hero_trust_3: "በኢትዮጵያ የተሰራ",
  products_heading: "የማሸጊያ ፖርትፎሊዮ",
  products_subheading: "ለኢትዮጵያ ምርጥ ብራንዶች የተሰሩ ዕቃዎች።",
  products_view_all: "ሙሉ ፖርትፎሊዮ ይመልከቱ",
  products_view_details: "ዝርዝር ይመልከቱ",
  products_gsm: "ግራም",
  catalog_badge: "ዕውነተኛ የምርት ባቾች · በአዲስ አበባ",
  catalog_heading: "የማሸጊያ ፖርትፎሊዮ",
  catalog_subheading:
    "በአዲስ አበባ ፋብሪካችን ለኢትዮጵያ ቡና ቤቶች፣ ቡቲኮች፣ ሆቴሎች እና ቤክሪዎች የተሰሩ ወረቀት ቦርሶች።",
  catalog_cta_label: "የራስዎን ብጁ ማሸጊያ ይዘዙ",
  catalog_cta_btn: "ዲዛይን ይጀምሩ",
  catalog_search_placeholder: "ፖርትፎሊዮ ውስጥ ይፈልጉ...",
  catalog_results: "ዕቃዎች",
  catalog_portfolio_pieces: "ዕቃዎች",
  catalog_empty: "ምንም ዕቃ አልተገኘም",
  catalog_reset: "ማጣሪያ ዳግም ያስጀምሩ",
  catalog_view_details: "ዝርዝር ይመልከቱ",
  catalog_bottom_heading: "የራስዎን ብጁ ማሸጊያ ያግኙ",
  catalog_bottom_sub:
    "ከላይ የሚያዩት ሁሉ ለተወሰነ ደንበኛ የተሰሩ ናቸው። ተመሳሳይ ጥራት ያለው — ከራስዎ ብራንድ፣ ሎጎ እና ዝርዝሮች ጋር — ማምረት እንችላለን።",
  catalog_submit_design: "ዲዛይንዎን ያስገቡ",
  catalog_workshops: "ወርክሾፖችን ያስሱ",
  lightbox_close: "ዝጋ",
  lightbox_full: "ሙሉ ዝርዝር",
  lightbox_made_for: "ለ",
  footer_tagline: "ዘላቂ የዕደ ጥበብ ወረቀት ማሸጊያ፣ በኩራት በአዲስ አበባ የተሰራ።",
  footer_navigate: "ክፍሎች",
  footer_contact: "ያግኙን",
  footer_rights: "መብቱ በህግ የተጠበቀ ነው።",
};

const TRANSLATIONS: Record<Language, Translations> = { en: EN, am: AM };

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: EN,
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    if (typeof document !== "undefined") {
      document.documentElement.lang = l === "am" ? "am" : "en";
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "am" : "en");
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang], toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
