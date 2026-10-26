"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Language = "en" | "am";

/** Comprehensive translatable strings for the entire platform */
export interface Translations {
  // Navbar & Global
  nav_portfolio: string;
  nav_design_studio: string;
  nav_academy: string;
  nav_workshops: string;
  nav_login: string;
  nav_signup: string;
  nav_my_account: string;
  nav_sign_out: string;
  nav_admin_console: string;
  nav_teacher_portal: string;
  nav_dashboard: string;
  nav_language_toggle: string;
  nav_call_desk: string;

  // Hero Section
  hero_badge: string;
  hero_headline: string;
  hero_subline: string;
  hero_cta_portfolio: string;
  hero_cta_design: string;
  hero_trust_1: string;
  hero_trust_2: string;
  hero_trust_3: string;
  hero_stat_1_val: string;
  hero_stat_1_label: string;
  hero_stat_2_val: string;
  hero_stat_2_label: string;
  hero_stat_3_val: string;
  hero_stat_3_label: string;

  // Showcase / Portfolio Section
  products_heading: string;
  products_subheading: string;
  products_view_all: string;
  products_view_details: string;
  products_gsm: string;
  products_client_badge: string;
  products_commission_similar: string;

  // Catalog / Showcase Page
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
  catalog_filter_all: string;
  catalog_filter_boutique: string;
  catalog_filter_retail: string;
  catalog_filter_coffee: string;
  catalog_filter_bakery: string;

  // Single Showcase Item
  showcase_back: string;
  showcase_client_label: string;
  showcase_exclusivity_title: string;
  showcase_exclusivity_desc: string;
  showcase_specs_title: string;
  showcase_commission_box_title: string;
  showcase_commission_box_desc: string;
  showcase_commission_btn: string;
  showcase_desk_title: string;
  showcase_desk_sub: string;

  // Design Studio
  studio_badge: string;
  studio_heading: string;
  studio_subheading: string;
  studio_opt1_title: string;
  studio_opt1_desc: string;
  studio_opt2_title: string;
  studio_opt2_desc: string;
  studio_selected: string;
  studio_step1_title: string;
  studio_step1_desc: string;
  studio_step2_title: string;
  studio_step2_desc: string;
  studio_step3_title: string;
  studio_step3_desc: string;
  studio_step4_title: string;
  studio_step4_desc: string;
  studio_step5_title: string;
  studio_step5_desc: string;
  studio_step6_title: string;
  studio_step6_desc: string;
  studio_visualizer_title: string;
  studio_unit_cost: string;
  studio_total_cost: string;
  studio_submit_btn: string;

  // Academy & Classes
  academy_badge: string;
  academy_heading: string;
  academy_subheading: string;
  academy_live_title: string;
  academy_live_desc: string;
  academy_upcoming_title: string;
  academy_upcoming_sub: string;
  academy_register_btn: string;
  academy_seats_left: string;
  academy_in_person: string;
  academy_live_stream: string;
  academy_waiting_room: string;
  academy_waiting_desc: string;

  // Lightbox & Common
  lightbox_close: string;
  lightbox_full: string;
  lightbox_made_for: string;

  // Footer
  footer_tagline: string;
  footer_navigate: string;
  footer_contact: string;
  footer_rights: string;
  footer_addis: string;
}

const EN: Translations = {
  nav_portfolio: "Packaging Catalog",
  nav_design_studio: "Design Studio",
  nav_academy: "Craft Academy",
  nav_workshops: "Workshops",
  nav_login: "Sign In",
  nav_signup: "Register",
  nav_my_account: "My Account",
  nav_sign_out: "Sign Out",
  nav_admin_console: "Admin Console",
  nav_teacher_portal: "Teacher Portal",
  nav_dashboard: "My Dashboard",
  nav_language_toggle: "አማ",
  nav_call_desk: "Addis Ababa Factory Desk",

  hero_badge: "100% Biodegradable · Made in Ethiopia",
  hero_headline: "Artisan Paper Packaging,\nCrafted in Addis Ababa",
  hero_subline:
    "We manufacture premium kraft bags and custom packaging for Ethiopia's finest cafés, hotels, and boutiques. Commission your own branded batch.",
  hero_cta_portfolio: "View Our Portfolio",
  hero_cta_design: "Design Your Bag",
  hero_trust_1: "100% Recycled Kraft",
  hero_trust_2: "Custom Branding",
  hero_trust_3: "Made in Ethiopia",
  hero_stat_1_val: "1.2M+",
  hero_stat_1_label: "Bags Manufactured",
  hero_stat_2_val: "50+",
  hero_stat_2_label: "Enterprise Clients",
  hero_stat_3_val: "100%",
  hero_stat_3_label: "Biodegradable Kraft",

  products_heading: "Our Packaging Portfolio",
  products_subheading: "Real production batches for real Ethiopian brands.",
  products_view_all: "View Full Portfolio",
  products_view_details: "View Details",
  products_gsm: "GSM",
  products_client_badge: "Client Deliverable Showcase",
  products_commission_similar: "Commission Similar Design",

  catalog_badge: "Real Production Batches · Made in Addis Ababa",
  catalog_heading: "Packaging Catalog & Factory Portfolio",
  catalog_subheading:
    "Authentic paper bags manufactured at our Addis Ababa facility for Ethiopian coffee roasters, boutique fashion houses, hotels, and bakeries.",
  catalog_cta_label: "Commission Your Own Branded Packaging",
  catalog_cta_btn: "Start Your Design",
  catalog_search_placeholder: "Search catalog...",
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
  catalog_filter_all: "All Showcases",
  catalog_filter_boutique: "Boutique & Retail",
  catalog_filter_retail: "Department & Apparel",
  catalog_filter_coffee: "Specialty Coffee",
  catalog_filter_bakery: "Bakery & Takeaway",

  showcase_back: "Back to Packaging Showcase",
  showcase_client_label: "Manufactured for",
  showcase_exclusivity_title: "Client Case Study (Showcase Only — Not for Direct Retail Sale)",
  showcase_exclusivity_desc:
    "This packaging was custom-manufactured exclusively for our partner client. To protect brand trademarks, arbitrary retail sales cannot be placed for this branded packaging. You can commission this exact structural profile custom-manufactured with your own company logo.",
  showcase_specs_title: "Engineering Specifications",
  showcase_commission_box_title: "Commission Your Brand's Custom Batch",
  showcase_commission_box_desc:
    "Want this exact packaging structure custom-branded with your company logo, pantone colors, and tailored dimensions? We manufacture custom production runs for roasters, fashion boutiques, hotels, and retail brands across Ethiopia.",
  showcase_commission_btn: "Commission Similar Custom Design →",
  showcase_desk_title: "Addis Ababa Plant Engineering Desk",
  showcase_desk_sub: "Bole Subcity, Industrial Zone • Direct WhatsApp / Phone Inquiries",

  studio_badge: "Interactive Packaging Studio",
  studio_heading: "Custom Paper Bag Design Studio",
  studio_subheading:
    "Select your exact manufacturing quantity, custom dimensions, paper grammage, handle style, and print finishes. Our Addis Ababa packaging engineers deliver free dielines and binding quotes within 24 hours.",
  studio_opt1_title: "Option 1: Design Bag Online",
  studio_opt1_desc: "Design right here in your browser! Pick bag size, paper color, handle style, enter your brand title, and visually preview your bag in real-time.",
  studio_opt2_title: "Option 2: Upload Ready Artwork & CAD Dieline",
  studio_opt2_desc: "Already have a vector dieline or completed artwork? Upload your .AI, .PDF, .EPS or .CDR file for fast-track prepress inspection and factory quotation.",
  studio_selected: "Selected",
  studio_step1_title: "Step 1: Brand Title & Manufacturing Run Name",
  studio_step1_desc: "Identify your production batch for our factory line.",
  studio_step2_title: "Step 2: Bag Format & Structural Dimensions",
  studio_step2_desc: "Choose from industry standard sizes or specify your bespoke millimeter dimensions.",
  studio_step3_title: "Step 3: Paper Grammage & Heavy-Duty Grade",
  studio_step3_desc: "Higher GSM provides elevated durability and rigid hand-feel.",
  studio_step4_title: "Step 4: Artisan Kraft Paper Shade",
  studio_step4_desc: "Natural earth-toned kraft or bleached pure white paper.",
  studio_step5_title: "Step 5: Handle Construction & Attachment",
  studio_step5_desc: "Select how customers will carry your bag.",
  studio_step6_title: "Step 6: Brand Print Technique & Embellishments",
  studio_step6_desc: "Elevate your packaging with sustainable soy flexo or metallic foil stamping.",
  studio_visualizer_title: "Live Bag Visualizer",
  studio_unit_cost: "Estimated Unit Cost:",
  studio_total_cost: "Total Investment:",
  studio_submit_btn: "Request Dieline & Quotation",

  academy_badge: "Arenguade Craft Academy",
  academy_heading: "Vocational Craft Academy & Guild",
  academy_subheading: "Learn the art and engineering of sustainable packaging, luxury box-making, and flexographic print finishing.",
  academy_live_title: "Real-Time Global Masterclasses",
  academy_live_desc: "Interactive video classrooms powered by low-latency LiveKit WebRTC. Ask questions in real time, unmute to speak with the teacher, and receive digital certification upon completion.",
  academy_upcoming_title: "Upcoming Classes Ready for Registration",
  academy_upcoming_sub: "Join our hands-on packaging and artisan print workshops",
  academy_register_btn: "Register",
  academy_seats_left: "seats left",
  academy_in_person: "In-Person Studio",
  academy_live_stream: "LiveKit Online Stream",
  academy_waiting_room: "Waiting for Instructor to Go Live",
  academy_waiting_desc: "The classroom will automatically open as soon as the teacher starts broadcasting.",

  lightbox_close: "Close",
  lightbox_full: "Full Details",
  lightbox_made_for: "Made for",

  footer_tagline: "Sustainable artisan paper packaging, manufactured with pride in Addis Ababa, Ethiopia.",
  footer_navigate: "Navigation",
  footer_contact: "Contact Information",
  footer_rights: "All rights reserved.",
  footer_addis: "Addis Ababa, Ethiopia",
};

const AM: Translations = {
  nav_portfolio: "የማሸጊያ ካታሎግ",
  nav_design_studio: "ዲዛይን ስቱዲዮ",
  nav_academy: "የዕደ ጥበብ አካዳሚ",
  nav_workshops: "ስልጠናዎች",
  nav_login: "ግባ",
  nav_signup: "ተመዝገብ",
  nav_my_account: "መለያዬ",
  nav_sign_out: "ውጣ",
  nav_admin_console: "አስተዳዳሪ ኮንሶል",
  nav_teacher_portal: "የመምህር ፖርታል",
  nav_dashboard: "የእኔ ዳሽቦርድ",
  nav_language_toggle: "EN",
  nav_call_desk: "የአዲስ አበባ ፋብሪካ ዴስክ",

  hero_badge: "100% ኤኮ-ምቹ · በኢትዮጵያ የተሰራ",
  hero_headline: "የዕደ ጥበብ ወረቀት ማሸጊያ፣\nበአዲስ አበባ የተሰራ",
  hero_subline:
    "ለኢትዮጵያ ምርጥ ካፌዎች፣ ሆቴሎች እና ቡቲኮች ልዩ ክራፍት ቦርሳ እና ብጁ ማሸጊያ እናመርታለን። የራስዎን ብጁ ባች ይዘዙ።",
  hero_cta_portfolio: "ፖርትፎሊዮ ይመልከቱ",
  hero_cta_design: "ቦርሳዎን ይቅረጹ",
  hero_trust_1: "100% ዳግም ጥቅም ላይ የዋለ",
  hero_trust_2: "ብጁ የብራንድ ማተሚያ",
  hero_trust_3: "በኢትዮጵያ የተሰራ",
  hero_stat_1_val: "1.2ሚ+",
  hero_stat_1_label: "የተመረቱ ቦርሳዎች",
  hero_stat_2_val: "50+",
  hero_stat_2_label: "የድርጅት ደንበኞች",
  hero_stat_3_val: "100%",
  hero_stat_3_label: "ኤኮ-ምቹ ክራፍት",

  products_heading: "የማሸጊያ ፖርትፎሊዮ",
  products_subheading: "ለኢትዮጵያ ምርጥ ብራንዶች በልዩ ትዕዛዝ የተሰሩ ማሸጊያዎች።",
  products_view_all: "ሙሉ ፖርትፎሊዮ ይመልከቱ",
  products_view_details: "ዝርዝር ይመልከቱ",
  products_gsm: "ግራም (GSM)",
  products_client_badge: "የደንበኛ ማሸጊያ ሾውኬዝ",
  products_commission_similar: "ተመሳሳይ ዲዛይን እዘዝ",

  catalog_badge: "ዕውነተኛ የምርት ባቾች · በአዲስ አበባ",
  catalog_heading: "የማሸጊያ ካታሎግ እና የፋብሪካ ፖርትፎሊዮ",
  catalog_subheading:
    "በአዲስ አበባ ፋብሪካችን ለኢትዮጵያ ቡና ቆዪዎች፣ ቡቲኮች፣ ሆቴሎች እና ቤክሪዎች የተመረቱ የከፍተኛ ጥራት ወረቀት ቦርሳዎች።",
  catalog_cta_label: "የራስዎን ብጁ ማሸጊያ በብራንድዎ ያመርቱ",
  catalog_cta_btn: "ዲዛይንዎን ይጀምሩ",
  catalog_search_placeholder: "በፖርትፎሊዮ ውስጥ ይፈልጉ...",
  catalog_results: "ዕቃዎች",
  catalog_portfolio_pieces: "ዕቃዎች",
  catalog_empty: "ምንም የማሸጊያ ዕቃ አልተገኘም",
  catalog_reset: "ማጣሪያውን አጽዳ",
  catalog_view_details: "ዝርዝር ይመልከቱ",
  catalog_bottom_heading: "የራስዎን ብጁ ማሸጊያ ያግኙ",
  catalog_bottom_sub:
    "ከላይ የሚያዩት ሁሉ ለተወሰነ ደንበኛ የተሰሩ ናቸው። ተመሳሳይ ጥራት ያለው ማሸጊያ — ከራስዎ ብራንድ፣ ሎጎ እና መጠን ጋር — ማምረት እንችላለን።",
  catalog_submit_design: "ዲዛይንዎን ያስገቡ",
  catalog_workshops: "ስልጠናዎችን ያስሱ",
  catalog_filter_all: "ሁሉም ሾውኬዞች",
  catalog_filter_boutique: "ቡቲክ እና ፋሽን",
  catalog_filter_retail: "የሱቅ እና አልባሳት",
  catalog_filter_coffee: "ልዩ የቡና ማሸጊያ",
  catalog_filter_bakery: "ኬክ እና ምግብ ማሸጊያ",

  showcase_back: "ወደ ማሸጊያ ሾውኬዝ ተመለስ",
  showcase_client_label: "የተመረተው ለ",
  showcase_exclusivity_title: "የደንበኛ ማሸጊያ ሾውኬዝ (ለቀጥታ ሽያጭ የቀረበ አይደለም)",
  showcase_exclusivity_desc:
    "ይህ ማሸጊያ ለተወሰነ የኢትዮጵያ ደንበኛ በልዩ ትዕዛዝ የተመረተ ነው። የደንበኛውን የብራንድ ጥበቃ በመከተል በሌላ ሰው ሎጎ የተሰራ ቦርሳ ለቀጥታ ሽያጭ አይቀርብም። ይልቁንስ ይህንን ተመሳሳይ መዋቅር በራስዎ ሎጎ እና መጠን ማዘዝ ይችላሉ።",
  showcase_specs_title: "የቴክኒክ መዋቅር ዝርዝሮች",
  showcase_commission_box_title: "የራስዎን ብጁ ባች በብራንድዎ ያመርቱ",
  showcase_commission_box_desc:
    "ይህንን ተመሳሳይ ጥራት እና መጠን በራስዎ የድርጅት ሎጎ፣ ቀለሞች እና አሻራ ማምረት ይፈልጋሉ? በዲዛይን ስቱዲዮአችን ውስጥ ወዲያውኑ መጠን ይምረጡ፣ ሎጎዎን ይጫኑ እና የዋጋ ግምት ያግኙ።",
  showcase_commission_btn: "ይህንን ዲዛይን በራስዎ ሎጎ ይዘዙ →",
  showcase_desk_title: "የአዲስ አበባ ፋብሪካ ኢንጂነሪንግ ዴስክ",
  showcase_desk_sub: "ቦሌ ክፍለ ከተማ፣ የኢንዱስትሪ ዞን • ቀጥታ የስልክ እና የዋትስአፕ ጥሪ",

  studio_badge: "ኢንተራክቲቭ የማሸጊያ ስቱዲዮ",
  studio_heading: "የብጁ ወረቀት ቦርሳ ዲዛይን ስቱዲዮ",
  studio_subheading:
    "የማምረቻ ብዛትዎን፣ መጠኖችዎን፣ የወረቀት ክብደትዎን፣ የእጅ መያዣ ስታይልዎን እና የማተሚያ ፊኒሾችን ይምረጡ። በአዲስ አበባ ያሉ የፋብሪካ መሃንዲሶቻችን በ24 ሰዓት ውስጥ ነፃ ዳይላይን እና ዋጋ ያቀርቡልዎታል።",
  studio_opt1_title: "አማራጭ 1፡ ቦርሳዎን በኦንላይን ይቅረጹ",
  studio_opt1_desc: "እዚሁ በብሮውዘርዎ ላይ ቦርሳዎን ይቅረጹ! የመጠን ምርጫ፣ የወረቀት ቀለም፣ የእጅ መያዣ ይምረጡ እና በቅጽበት ቦርሳዎን በምስል ይመልከቱ።",
  studio_opt2_title: "አማራጭ 2፡ የተዘጋጀ አርትዎርክ እና CAD ፋይል ይጫኑ",
  studio_opt2_desc: "ቀድመው ያዘጋጁት የቬክተር ዳይላይን ወይም አርትዎርክ አለዎት? የ .AI, .PDF, .EPS ወይም .CDR ፋይልዎን ለፈጣን ምርመራ እና የፋብሪካ ዋጋ ይጫኑ።",
  studio_selected: "የተመረጠ",
  studio_step1_title: "ደረጃ 1፡ የብራንድ ስም እና የምርት ባች ርዕስ",
  studio_step1_desc: "ለፋብሪካ መስመራችን የትዕዛዝዎን ስም ያስገቡ።",
  studio_step2_title: "ደረጃ 2፡ የቦርሳ ቅርጽ እና መዋቅራዊ መጠኖች",
  studio_step2_desc: "ከተለመዱ የኢንዱስትሪ መጠኖች ይምረጡ ወይም የራስዎን ሚሊሜትር መጠን ያስገቡ።",
  studio_step3_title: "ደረጃ 3፡ የወረቀት ውፍረት እና ክብደት (GSM)",
  studio_step3_desc: "ከፍ ያለ GSM ጠንካራ እና የመቀደድ መቋቋም ያለው ጥንካሬ ይሰጣል።",
  studio_step4_title: "ደረጃ 4፡ የዕደ ጥበብ ክራፍት ወረቀት ቀለም",
  studio_step4_desc: "ተፈጥሯዊ ቡናማ ክራፍት ወይም ንጹህ ነጭ ወረቀት።",
  studio_step5_title: "ደረጃ 5፡ የእጅ መያዣ ግንባታ እና አሰራር",
  studio_step5_desc: "ደንበኞች ቦርሳዎን እንዴት እንደሚይዙ ይምረጡ።",
  studio_step6_title: "ደረጃ 6፡ የብራንድ ማተሚያ ቴክኒክ እና ማስዋቢያ",
  studio_step6_desc: "በዘላቂ የአኩሪ አተር ቀለም ወይም በሚያንጸባርቅ የወርቅ ፎይል ማህተም ቦርሳዎን ያሳምሩ።",
  studio_visualizer_title: "የቀጥታ ቦርሳ እይታ",
  studio_unit_cost: "የአንዱ ቦርሳ ግምት ዋጋ፡",
  studio_total_cost: "አጠቃላይ ኢንቨስትመንት፡",
  studio_submit_btn: "ዳይላይን እና የፋብሪካ ዋጋ ጠይቅ",

  academy_badge: "አረንጓዴ የዕደ ጥበብ አካዳሚ",
  academy_heading: "የሙያ ዕደ ጥበብ አካዳሚ እና ማህበር",
  academy_subheading: "የዘላቂ ወረቀት ማሸጊያ፣ የቅንጦት ሳጥን አሰራር እና የፍሌክሶግራፊክ ማተሚያ ጥበብን በአዲስ አበባ ከዋና ባለሙያዎች ይማሩ።",
  academy_live_title: "በቀጥታ ስርጭት የሚሰጡ ዓለም አቀፍ ማስተርክላሶች",
  academy_live_desc: "በዝቅተኛ መዘግየት LiveKit WebRTC የሚሰራ የቀጥታ ቪዲዮ ክፍል። በቀጥታ ጥያቄ ይጠይቁ፣ ከመምህሩ ጋር ይነጋገሩ እና ስልጠናውን ሲያጠናቅቁ ዲጂታል ሰርተፍኬት ይቀበሉ።",
  academy_upcoming_title: "ለመመዝገብ የተዘጋጁ መጪ ስልጠናዎች",
  academy_upcoming_sub: "በተግባራዊ የማሸጊያ እና የዕደ ጥበብ ስልጠናዎቻችን ላይ ይሳተፉ",
  academy_register_btn: "ይመዝገቡ",
  academy_seats_left: "ክፍት ቦታዎች",
  academy_in_person: "በስቱዲዮ በአካል",
  academy_live_stream: "በቀጥታ ኦንላይን ስርጭት",
  academy_waiting_room: "መምህሩ የቀጥታ ስርጭት እስኪጀምሩ በመጠበቅ ላይ",
  academy_waiting_desc: "መምህሩ ስርጭቱን ሲከፍቱ የክፍሉ በር በራሱ ይከፈታል...",

  lightbox_close: "ዝጋ",
  lightbox_full: "ሙሉ ዝርዝር",
  lightbox_made_for: "የተሰራው ለ",

  footer_tagline: "ዘላቂ የዕደ ጥበብ ወረቀት ማሸጊያ፣ በኩራት በአዲስ አበባ፣ ኢትዮጵያ የተመረተ።",
  footer_navigate: "አሰሳ",
  footer_contact: "የመገኛ አድራሻ",
  footer_rights: "መብቱ በህግ የተጠበቀ ነው።",
  footer_addis: "አዲስ አበባ፣ ኢትዮጵያ",
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
