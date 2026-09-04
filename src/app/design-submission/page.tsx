"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  PenTool, 
  Upload, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Sliders, 
  ArrowRight, 
  ShieldCheck,
  FileCheck,
  Type,
  Palette,
  Eye,
  RefreshCw,
  Coffee,
  Crown,
  Leaf,
  Star,
  Check,
  Download,
  Info,
  Building2,
  Phone,
  Mail,
  SlidersHorizontal
} from "lucide-react";

export default function DesignSubmissionPage() {
  // Main Studio Mode: "design" (Design for Yourself) vs "upload" (Upload Existing Artwork)
  const [activeMode, setActiveMode] = useState<"design" | "upload">("design");

  // Visual Customizer State (Mode 1: Design for Yourself)
  const [bagBaseColor, setBagBaseColor] = useState<string>("#C99B6D"); // Artisan Brown Kraft
  const [bagColorName, setBagColorName] = useState<string>("Artisan Brown Kraft");
  const [handleType, setHandleType] = useState<"twisted" | "cotton" | "flat" | "ribbon" | "diecut">("twisted");
  const [handleColor, setHandleColor] = useState<string>("#1A1A1A"); // Black
  
  // Custom Typography State
  const [brandTitle, setBrandTitle] = useState<string>("ABYSSINIA ROASTERS");
  const [brandSubtitle, setBrandSubtitle] = useState<string>("ADDIS ABABA • 100% ORGANIC");
  const [fontFamily, setFontFamily] = useState<"serif" | "sans" | "display" | "ethiopic">("serif");
  const [textColor, setTextColor] = useState<string>("#1A1A1A");
  const [textColorName, setTextColorName] = useState<string>("Charcoal Black");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">("center");

  // Logo / Emblem State
  const [emblemType, setEmblemType] = useState<"coffee" | "crown" | "leaf" | "star" | "none" | "custom">("coffee");
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [customLogoName, setCustomLogoName] = useState<string | null>(null);

  // Structural Dimensions State
  const [bagWidth, setBagWidth] = useState(26);
  const [bagHeight, setBagHeight] = useState(32);
  const [bagGusset, setBagGusset] = useState(10);
  const [paperWeight, setPaperWeight] = useState("220");
  const [printFinish, setPrintFinish] = useState("screen");
  const [quantity, setQuantity] = useState(5000);

  // Upload Existing Design State (Mode 2)
  const [dielineFile, setDielineFile] = useState<File | null>(null);
  const [dielineNotes, setDielineNotes] = useState("");

  // Customer Contact & Submission State
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("Addis Ababa");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Handle Logo Upload for the Visual Customizer
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomLogoUrl(URL.createObjectURL(file));
      setCustomLogoName(file.name);
      setEmblemType("custom");
    }
  };

  // Color Swatches for Bag Body
  const bagColors = [
    { id: "#C99B6D", name: "Artisan Brown Kraft", textDefault: "#1A1A1A", border: "border-amber-800/40" },
    { id: "#FAF7F0", name: "Bleached Pure White", textDefault: "#1A1A1A", border: "border-stone-300" },
    { id: "#1E3B2E", name: "Arenguade Forest", textDefault: "#D4AF37", border: "border-emerald-900" },
    { id: "#1C1B1A", name: "Espresso Matte Black", textDefault: "#D4AF37", border: "border-stone-900" },
    { id: "#A3593B", name: "Terracotta Clay", textDefault: "#FAF7F0", border: "border-orange-800" },
    { id: "#E2D3B8", name: "Recycled Straw", textDefault: "#1A1A1A", border: "border-amber-400/50" },
  ];

  // Handle Colors
  const handleColors = [
    { id: "#1A1A1A", name: "Jet Black" },
    { id: "#8C4B31", name: "Artisan Brown" },
    { id: "#FAF7F0", name: "Pure White" },
    { id: "#1E3B2E", name: "Forest Green" },
    { id: "#C49258", name: "Natural Kraft" },
    { id: "#991B1B", name: "Crimson Red" },
  ];

  // Text Ink / Foil Colors
  const inkColors = [
    { id: "#1A1A1A", name: "Charcoal Black" },
    { id: "#D4AF37", name: "Gold Hot Foil" },
    { id: "#FAF7F0", name: "Pure White" },
    { id: "#1E3B2E", name: "Forest Botanical" },
    { id: "#8C4B31", name: "Deep Earth Brown" },
    { id: "#B87333", name: "Copper Foil" },
  ];

  // Dimension Presets
  const applyPreset = (preset: "coffee" | "boutique" | "bakery" | "luxury") => {
    if (preset === "coffee") {
      setBagWidth(24);
      setBagHeight(28);
      setBagGusset(10);
      setPaperWeight("220");
      setBagBaseColor("#C99B6D");
      setBagColorName("Artisan Brown Kraft");
      setHandleType("twisted");
      setHandleColor("#1A1A1A");
      setBrandTitle("SIDAMA ROAST");
      setBrandSubtitle("WHOLE BEAN COFFEE • ETHIOPIA");
      setEmblemType("coffee");
      setTextColor("#1A1A1A");
      setFontFamily("serif");
    } else if (preset === "boutique") {
      setBagWidth(32);
      setBagHeight(36);
      setBagGusset(12);
      setPaperWeight("250");
      setBagBaseColor("#FAF7F0");
      setBagColorName("Bleached Pure White");
      setHandleType("cotton");
      setHandleColor("#1A1A1A");
      setBrandTitle("BOLE BOUTIQUE");
      setBrandSubtitle("HAUTE COUTURE & TAILORING");
      setEmblemType("crown");
      setTextColor("#1A1A1A");
      setFontFamily("serif");
    } else if (preset === "bakery") {
      setBagWidth(26);
      setBagHeight(22);
      setBagGusset(16);
      setPaperWeight("180");
      setBagBaseColor("#C99B6D");
      setBagColorName("Artisan Brown Kraft");
      setHandleType("flat");
      setHandleColor("#C49258");
      setBrandTitle("KAZANCHIS PATISSERIE");
      setBrandSubtitle("FRESH ARTISAN PASTRY");
      setEmblemType("leaf");
      setTextColor("#1E3B2E");
      setFontFamily("sans");
    } else if (preset === "luxury") {
      setBagWidth(28);
      setBagHeight(34);
      setBagGusset(11);
      setPaperWeight("280");
      setBagBaseColor("#1E3B2E");
      setBagColorName("Arenguade Forest");
      setHandleType("ribbon");
      setHandleColor("#1A1A1A");
      setBrandTitle("HABESHA LUXURY");
      setBrandSubtitle("ADDIS ABABA • CELEBRATION");
      setEmblemType("star");
      setTextColor("#D4AF37");
      setFontFamily("display");
    }
  };

  // Live Unit Price & Total Calculation in ETB
  const baseRate = paperWeight === "120" ? 11 : paperWeight === "180" ? 13.5 : paperWeight === "220" ? 16.5 : 21;
  const handleRate = handleType === "cotton" ? 3.5 : handleType === "ribbon" ? 3.0 : handleType === "diecut" ? 1.0 : 2.0;
  const sizeMultiplier = (bagWidth * bagHeight) / (24 * 30);
  const finishMultiplier = printFinish === "gold" || textColor === "#D4AF37" || textColor === "#B87333" ? 1.3 : 1.0;
  const volumeDiscount = quantity >= 50000 ? 0.75 : quantity >= 20000 ? 0.85 : quantity >= 5000 ? 0.92 : 1.0;
  
  const estUnitPrice = ((baseRate * sizeMultiplier + handleRate) * finishMultiplier * volumeDiscount).toFixed(2);
  const totalEstEtb = Math.round(Number(estUnitPrice) * quantity).toLocaleString();
  const plasticDivertedKg = Math.round(quantity * 0.045);
  const co2AvoidedKg = Math.round(quantity * 0.082);

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const randomTicket = `AR-${activeMode === "design" ? "DSG" : "UPL"}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedRef(randomTicket);
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[#F9F6F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
        
        {/* Studio Banner & Title */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8C4B31]/10 text-[#8C4B31] border border-[#8C4B31]/20 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} />
            <span>Ethiopian Bespoke Packaging Studio</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight mb-3">
            Custom Bag Studio & Quotation
          </h1>
          <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
            Create and visualize your custom branded kraft bag with live 2D preview, or upload your agency&apos;s finished dieline for instant manufacturing review.
          </p>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2 bg-stone-200/60 rounded-3xl border border-stone-300 max-w-2xl mb-10 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveMode("design")}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeMode === "design"
                ? "bg-[#1E3B2E] text-white shadow-md scale-[1.01]"
                : "text-stone-700 hover:text-stone-950 hover:bg-white/60"
            }`}
          >
            <PenTool size={16} />
            <span>1. Design for Yourself (Visual Customizer)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("upload")}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeMode === "upload"
                ? "bg-[#1E3B2E] text-white shadow-md scale-[1.01]"
                : "text-stone-700 hover:text-stone-950 hover:bg-white/60"
            }`}
          >
            <Upload size={16} />
            <span>2. Upload Finished Artwork / Dieline</span>
          </button>
        </div>

        {/* Submission Confirmation Screen */}
        {submittedRef ? (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-stone-300/80 shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} />
            </div>
            
            <span className="text-xs font-bold uppercase tracking-widest text-[#1E3B2E]">
              Custom Order Ticket Logged
            </span>
            <h2 className="font-serif text-3xl font-bold text-stone-900 mt-2 mb-3">
              Order #{submittedRef}
            </h2>
            <p className="text-stone-600 text-sm max-w-md mx-auto leading-relaxed mb-6">
              Thank you, <span className="font-bold text-stone-900">{companyName || "Valued Client"}</span>. Our Addis Ababa packaging engineers have received your specifications. A physical 3D proof sample will be prepped in our Bole converting workshop.
            </p>

            <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-stone-200 text-left max-w-md mx-auto mb-8 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-stone-500">Mode:</span>
                <span className="font-bold text-stone-900 capitalize">{activeMode === "design" ? "Self-Designed Visual Spec" : "Uploaded Vector Dieline"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Dimensions:</span>
                <span className="font-bold text-stone-900">{bagWidth}cm × {bagHeight}cm + {bagGusset}cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Material & Grade:</span>
                <span className="font-bold text-stone-900">{paperWeight} GSM {bagColorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Handle Architecture:</span>
                <span className="font-bold text-stone-900 capitalize">{handleType} Handle</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Order Quantity:</span>
                <span className="font-bold text-stone-900">{quantity.toLocaleString()} Bags</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2 text-sm">
                <span className="font-semibold text-stone-700">Estimated Total:</span>
                <span className="font-bold text-[#8C4B31]">{totalEstEtb} ETB</span>
              </div>
            </div>

            {/* Bank Transfer Information for Ethiopia */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left max-w-md mx-auto mb-8">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">
                Preferred Ethiopian Payment Channels
              </span>
              <p className="text-xs text-emerald-900">
                • Commercial Bank of Ethiopia (CBE): <strong>1000234891024</strong> (Arenguade Packaging)<br />
                • Telebirr Merchant Code: <strong>889201</strong> (Instant Confirmation)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/products"
                className="w-full sm:w-auto bg-[#1E3B2E] hover:bg-[#8C4B31] text-white px-8 py-3.5 rounded-full text-xs font-bold transition-all shadow-md"
              >
                Return to Catalog
              </Link>
              <button
                type="button"
                onClick={() => setSubmittedRef(null)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all"
              >
                Create Another Design
              </button>
            </div>
          </div>
        ) : (
          /* Studio Work Area */
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left/Main Column: Designer or Uploader */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* ========================================================================= */}
              {/* MODE 1: VISUAL BAG DESIGNER (DESIGN FOR YOURSELF)                        */}
              {/* ========================================================================= */}
              {activeMode === "design" && (
                <div className="space-y-8">
                  
                  {/* Visual Preview Canvas */}
                  <div className="bg-gradient-to-b from-[#EFE8DC] to-[#E3D6C3] rounded-3xl p-6 sm:p-8 border border-stone-300 shadow-xl flex flex-col items-center justify-center relative overflow-hidden min-h-[460px]">
                    
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-800 shadow-sm">
                        Live 2D Bag Mockup
                      </span>
                      <span className="bg-[#1E3B2E]/90 text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {bagWidth} × {bagHeight} + {bagGusset} cm
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyPreset("coffee")}
                        className="bg-white/80 hover:bg-white text-stone-700 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-stone-200 transition-all"
                        title="Specialty Coffee Pouch"
                      >
                        Coffee
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("boutique")}
                        className="bg-white/80 hover:bg-white text-stone-700 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-stone-200 transition-all"
                        title="Fashion Boutique Tote"
                      >
                        Boutique
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset("bakery")}
                        className="bg-white/80 hover:bg-white text-stone-700 text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-stone-200 transition-all"
                        title="Bakery Wide Gusset"
                      >
                        Bakery
                      </button>
                    </div>

                    {/* =================================================================== */}
                    {/* DYNAMIC BAG VISUAL CONTAINER                                       */}
                    {/* =================================================================== */}
                    <div className="flex flex-col items-center pt-8 pb-4 relative select-none">
                      
                      {/* Top Handle Representation */}
                      <div className="relative flex justify-center -mb-2 z-20">
                        {handleType === "twisted" && (
                          <div 
                            className="w-24 sm:w-28 h-20 rounded-t-full border-4 shadow-sm transition-all duration-300"
                            style={{ borderColor: handleColor }}
                          />
                        )}

                        {handleType === "cotton" && (
                          <div className="relative">
                            <div 
                              className="w-28 sm:w-32 h-24 rounded-t-full border-[6px] shadow-md transition-all duration-300"
                              style={{ borderColor: handleColor }}
                            />
                            {/* Eyelet Rings */}
                            <div className="absolute -bottom-2 left-1 w-3 h-3 rounded-full bg-amber-400 border border-amber-600 shadow-sm" />
                            <div className="absolute -bottom-2 right-1 w-3 h-3 rounded-full bg-amber-400 border border-amber-600 shadow-sm" />
                          </div>
                        )}

                        {handleType === "flat" && (
                          <div 
                            className="w-20 sm:w-24 h-16 rounded-t-md border-t-8 border-x-4 shadow-sm transition-all duration-300"
                            style={{ borderColor: handleColor }}
                          />
                        )}

                        {handleType === "ribbon" && (
                          <div 
                            className="w-24 sm:w-28 h-20 rounded-t-full border-[5px] opacity-90 shadow-sm transition-all duration-300"
                            style={{ borderColor: handleColor }}
                          />
                        )}

                        {handleType === "diecut" && (
                          <div className="h-6" /> /* Spacing placeholder for handle cut in bag */
                        )}
                      </div>

                      {/* Main Bag Body */}
                      <div 
                        className="w-64 sm:w-80 h-72 sm:h-84 rounded-t-sm shadow-2xl relative flex flex-col items-center justify-between p-6 transition-all duration-300 border-t-2 border-stone-400/30 overflow-hidden"
                        style={{ backgroundColor: bagBaseColor }}
                      >
                        {/* Realistic Side Gusset Creases */}
                        <div className="absolute top-0 bottom-0 left-4 w-px bg-black/10 shadow-sm" />
                        <div className="absolute top-0 bottom-0 right-4 w-px bg-black/10 shadow-sm" />
                        <div className="absolute top-0 left-0 right-0 h-4 bg-black/5 border-b border-black/10" />

                        {/* If Diecut Handle: cut out an oval near the top */}
                        {handleType === "diecut" && (
                          <div className="w-20 h-7 rounded-full bg-[#EFE8DC] border-2 border-black/20 shadow-inner mt-2 mb-2" />
                        )}

                        {/* Top Collar / Spacer */}
                        <div className="w-full flex justify-between items-center opacity-40 text-[9px] uppercase tracking-widest text-stone-700 px-2 pt-1">
                          <span>{bagColorName}</span>
                          <span>{paperWeight} GSM</span>
                        </div>

                        {/* Central Brand Artwork Layout */}
                        <div className={`flex flex-col items-center text-center max-w-[85%] transition-all duration-300 my-auto ${
                          textPosition === "top" ? "mb-auto mt-4" : textPosition === "bottom" ? "mt-auto mb-4" : "my-auto"
                        }`}>
                          
                          {/* Logo / Emblem Rendering */}
                          {emblemType === "custom" && customLogoUrl ? (
                            <div className="w-16 h-16 relative mb-3">
                              <Image 
                                src={customLogoUrl} 
                                alt="Custom Logo" 
                                fill 
                                className="object-contain" 
                              />
                            </div>
                          ) : emblemType === "coffee" ? (
                            <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 shadow-sm transition-all" style={{ borderColor: textColor, color: textColor }}>
                              <Coffee size={22} />
                            </div>
                          ) : emblemType === "crown" ? (
                            <div className="w-12 h-12 flex items-center justify-center mb-2 transition-all" style={{ color: textColor }}>
                              <Crown size={28} />
                            </div>
                          ) : emblemType === "leaf" ? (
                            <div className="w-12 h-12 flex items-center justify-center mb-2 transition-all" style={{ color: textColor }}>
                              <Leaf size={28} />
                            </div>
                          ) : emblemType === "star" ? (
                            <div className="w-12 h-12 flex items-center justify-center mb-2 transition-all" style={{ color: textColor }}>
                              <Star size={28} />
                            </div>
                          ) : null}

                          {/* Brand Title */}
                          <h3 
                            className={`font-bold tracking-tight uppercase transition-all duration-200 drop-shadow-sm ${
                              fontFamily === "serif" 
                                ? "font-serif" 
                                : fontFamily === "sans" 
                                ? "font-sans font-black" 
                                : fontFamily === "display" 
                                ? "font-serif tracking-widest font-black" 
                                : "font-serif italic"
                            } ${
                              fontSize === "sm" ? "text-lg sm:text-xl" : fontSize === "md" ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
                            }`}
                            style={{ 
                              color: textColor,
                              textShadow: textColor === "#D4AF37" ? "0 1px 2px rgba(212,175,55,0.4)" : undefined
                            }}
                          >
                            {brandTitle || "YOUR BRAND NAME"}
                          </h3>

                          {/* Brand Subtitle / Slogan */}
                          {brandSubtitle && (
                            <p 
                              className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase mt-1 opacity-90"
                              style={{ color: textColor }}
                            >
                              {brandSubtitle}
                            </p>
                          )}

                        </div>

                        {/* Bottom Fold Crease & Eco Badge */}
                        <div className="w-full flex justify-between items-center text-[8px] uppercase tracking-wider opacity-50 border-t border-black/10 pt-2 px-2">
                          <span>100% Biodegradable</span>
                          <span>Arenguade • Addis Ababa</span>
                        </div>

                      </div>

                      {/* Bottom Shadow */}
                      <div className="w-60 sm:w-72 h-4 bg-stone-900/20 rounded-full blur-md -mt-2 -z-10" />

                    </div>

                    <p className="text-[11px] text-stone-500 text-center mt-2">
                      Live interactive preview • Changes below update your packaging in real time
                    </p>

                  </div>

                  {/* Design Controls Section */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-8">
                    
                    {/* Control 1: Brand Typography */}
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-900 mb-1 flex items-center gap-2">
                        <Type size={18} className="text-[#8C4B31]" />
                        1. Brand Name & Typography
                      </h3>
                      <p className="text-xs text-stone-500 mb-4">Input your brand text and select typographic style.</p>

                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">Brand Name / Headline</label>
                          <input 
                            type="text"
                            value={brandTitle}
                            onChange={(e) => setBrandTitle(e.target.value)}
                            placeholder="E.g. ABYSSINIA COFFEE"
                            className="w-full p-3 text-sm font-bold bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">Tagline / Subtext (Optional)</label>
                          <input 
                            type="text"
                            value={brandSubtitle}
                            onChange={(e) => setBrandSubtitle(e.target.value)}
                            placeholder="E.g. ADDIS ABABA • 100% ORGANIC"
                            className="w-full p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                          />
                        </div>
                      </div>

                      {/* Font Style & Size Selectors */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        {[
                          { id: "serif", label: "Classic Serif" },
                          { id: "sans", label: "Modern Sans" },
                          { id: "display", label: "Bold Display" },
                          { id: "ethiopic", label: "Heritage Script" },
                        ].map((font) => (
                          <button
                            key={font.id}
                            type="button"
                            onClick={() => setFontFamily(font.id as any)}
                            className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                              fontFamily === font.id
                                ? "bg-[#1E3B2E] text-white border-[#1E3B2E] shadow-sm"
                                : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>

                      {/* Text Ink / Foil Color Selection */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-stone-700 uppercase mr-2">Foil / Ink:</span>
                        {inkColors.map((color) => (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => {
                              setTextColor(color.id);
                              setTextColorName(color.name);
                            }}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-all ${
                              textColor === color.id
                                ? "border-[#8C4B31] bg-stone-100 shadow-sm"
                                : "border-stone-200 bg-white"
                            }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-inner" style={{ backgroundColor: color.id }} />
                            <span>{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Control 2: Logo or Cultural Emblem */}
                    <div className="pt-6 border-t border-stone-200">
                      <h3 className="font-serif text-lg font-bold text-stone-900 mb-1 flex items-center gap-2">
                        <Sparkles size={18} className="text-[#8C4B31]" />
                        2. Brand Logo or Cultural Emblem
                      </h3>
                      <p className="text-xs text-stone-500 mb-4">Choose a curated stamp or upload your brand logo PNG.</p>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
                        {[
                          { id: "coffee", label: "Coffee Jebena", icon: Coffee },
                          { id: "crown", label: "Crown Crest", icon: Crown },
                          { id: "leaf", label: "Eco Leaf", icon: Leaf },
                          { id: "star", label: "Tibeb Star", icon: Star },
                          { id: "none", label: "Text Only", icon: Type },
                        ].map((emb) => {
                          const IconComp = emb.icon;
                          return (
                            <button
                              key={emb.id}
                              type="button"
                              onClick={() => setEmblemType(emb.id as any)}
                              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                                emblemType === emb.id
                                  ? "border-[#1E3B2E] bg-[#1E3B2E] text-white shadow-sm"
                                  : "border-stone-200 bg-[#FAF7F2] text-stone-700 hover:bg-stone-100"
                              }`}
                            >
                              <IconComp size={18} />
                              <span className="text-[10px] font-bold">{emb.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Upload Your Own Custom Logo */}
                      <label className="border-2 border-dashed border-stone-300 hover:border-[#8C4B31] bg-[#FAF7F2] hover:bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all">
                        <input 
                          type="file" 
                          accept="image/png,image/svg+xml,image/jpeg" 
                          className="hidden" 
                          onChange={handleLogoUpload} 
                        />
                        <div className="flex items-center gap-3">
                          <Upload size={20} className="text-[#8C4B31]" />
                          <div>
                            <span className="text-xs font-bold text-stone-900 block">
                              {customLogoName ? `Custom Logo: ${customLogoName}` : "Upload Your Own Brand Logo PNG"}
                            </span>
                            <span className="text-[10px] text-stone-500">
                              Transparent PNG or SVG looks best on kraft
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-[#8C4B31] bg-white border border-stone-200 px-3 py-1.5 rounded-full shadow-sm">
                          Browse File
                        </span>
                      </label>
                    </div>

                    {/* Control 3: Bag Color & Handles */}
                    <div className="pt-6 border-t border-stone-200">
                      <h3 className="font-serif text-lg font-bold text-stone-900 mb-1 flex items-center gap-2">
                        <Palette size={18} className="text-[#8C4B31]" />
                        3. Bag Base Color & Handles
                      </h3>
                      <p className="text-xs text-stone-500 mb-4">Select paper color shade and reinforced handle architecture.</p>

                      {/* Bag Color Swatches */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
                        {bagColors.map((color) => (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => {
                              setBagBaseColor(color.id);
                              setBagColorName(color.name);
                            }}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                              bagBaseColor === color.id
                                ? "border-[#8C4B31] bg-stone-50 font-bold shadow-sm"
                                : "border-stone-200 bg-white"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full border shadow-inner ${color.border}`} style={{ backgroundColor: color.id }} />
                            <span className="text-[11px] text-stone-800 truncate">{color.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Handle Type */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                        {[
                          { id: "twisted", label: "Twisted Cord" },
                          { id: "cotton", label: "Cotton + Eyelets" },
                          { id: "flat", label: "Flat Fold" },
                          { id: "ribbon", label: "Satin Ribbon" },
                          { id: "diecut", label: "Die-Cut Punch" },
                        ].map((h) => (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => setHandleType(h.id as any)}
                            className={`p-2.5 rounded-xl text-center border transition-all ${
                              handleType === h.id
                                ? "bg-[#1E3B2E] text-white border-[#1E3B2E] shadow-sm font-bold text-xs"
                                : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 text-xs"
                            }`}
                          >
                            {h.label}
                          </button>
                        ))}
                      </div>

                      {/* Handle Color Swatches */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-stone-700 uppercase mr-2">Handle Color:</span>
                        {handleColors.map((hc) => (
                          <button
                            key={hc.id}
                            type="button"
                            onClick={() => setHandleColor(hc.id)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-all ${
                              handleColor === hc.id
                                ? "border-[#8C4B31] bg-stone-100 shadow-sm"
                                : "border-stone-200 bg-white"
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full border border-stone-300" style={{ backgroundColor: hc.id }} />
                            <span>{hc.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Control 4: Bag Dimensions & Grammage */}
                    <div className="pt-6 border-t border-stone-200">
                      <h3 className="font-serif text-lg font-bold text-stone-900 mb-1 flex items-center gap-2">
                        <Sliders size={18} className="text-[#8C4B31]" />
                        4. Custom Dimensions & Paper Density
                      </h3>
                      <p className="text-xs text-stone-500 mb-4">Set exact centimeters and virgin paper weight.</p>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">Width (cm)</label>
                          <input 
                            type="number"
                            min="10"
                            max="60"
                            value={bagWidth}
                            onChange={(e) => setBagWidth(Number(e.target.value))}
                            className="w-full p-3 text-sm font-bold bg-[#FAF7F2] border border-stone-300 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">Height (cm)</label>
                          <input 
                            type="number"
                            min="15"
                            max="80"
                            value={bagHeight}
                            onChange={(e) => setBagHeight(Number(e.target.value))}
                            className="w-full p-3 text-sm font-bold bg-[#FAF7F2] border border-stone-300 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">Gusset (cm)</label>
                          <input 
                            type="number"
                            min="5"
                            max="30"
                            value={bagGusset}
                            onChange={(e) => setBagGusset(Number(e.target.value))}
                            className="w-full p-3 text-sm font-bold bg-[#FAF7F2] border border-stone-300 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Paper Density */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { gsm: "120", label: "120 GSM", desc: "Light Retail" },
                          { gsm: "180", label: "180 GSM", desc: "Standard Kraft" },
                          { gsm: "220", label: "220 GSM", desc: "Heavy Boutique" },
                          { gsm: "280", label: "280 GSM", desc: "Industrial Sack" },
                        ].map((item) => (
                          <button
                            key={item.gsm}
                            type="button"
                            onClick={() => setPaperWeight(item.gsm)}
                            className={`p-3 rounded-2xl text-left border transition-all ${
                              paperWeight === item.gsm
                                ? "border-[#1E3B2E] bg-[#1E3B2E] text-white shadow-sm"
                                : "border-stone-200 bg-[#FAF7F2] text-stone-800 hover:bg-stone-100"
                            }`}
                          >
                            <span className="font-bold text-xs block">{item.label}</span>
                            <span className={`text-[10px] block mt-0.5 ${paperWeight === item.gsm ? "text-emerald-200" : "text-stone-500"}`}>
                              {item.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* MODE 2: UPLOAD FINISHED ARTWORK / DIELINE                                */}
              {/* ========================================================================= */}
              {activeMode === "upload" && (
                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-sm space-y-8 animate-in fade-in duration-200">
                  
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2 flex items-center gap-2">
                      <Upload size={22} className="text-[#8C4B31]" />
                      Upload Finished Vector Artwork / Dieline
                    </h3>
                    <p className="text-stone-600 text-sm leading-relaxed mb-6">
                      For brands, agencies, and packaging designers who already have an approved dieline. Upload your print-ready file for automated bleed check and manufacturing preflight.
                    </p>

                    {/* Drag & Drop File Box */}
                    <label className="border-2 border-dashed border-stone-300 hover:border-[#8C4B31] bg-[#FAF7F2] hover:bg-white rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all">
                      <input 
                        type="file" 
                        accept=".pdf,.ai,.eps,.svg,.png,.psd" 
                        className="hidden" 
                        onChange={(e) => e.target.files && setDielineFile(e.target.files[0])}
                      />
                      <Upload size={40} className="text-[#8C4B31] mb-3" />
                      {dielineFile ? (
                        <div className="text-center">
                          <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 justify-center">
                            <FileCheck size={18} /> {dielineFile.name}
                          </p>
                          <p className="text-xs text-stone-500 mt-1">
                            {(dielineFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for preflight inspection
                          </p>
                          <span className="mt-3 inline-block text-[11px] font-bold text-[#8C4B31] underline">
                            Click to replace file
                          </span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm font-bold text-stone-900">
                            Drag & drop your dieline file here, or click to browse
                          </p>
                          <p className="text-xs text-stone-500 mt-1">
                            Supported: PDF (Preferred), AI, EPS, SVG, PNG (Up to 50MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Artwork Technical Specifications Checklist */}
                  <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                    <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-2">
                      Preflight Dieline Checklist
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700">
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-[#1E3B2E]" />
                        <span>3mm Bleed margin included</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-[#1E3B2E]" />
                        <span>Text converted to vector outlines</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-[#1E3B2E]" />
                        <span>CMYK / Pantone spot colors</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check size={14} className="text-[#1E3B2E]" />
                        <span>Separate layer for hot foil stamping</span>
                      </div>
                    </div>
                  </div>

                  {/* Physical Dimensions for Upload */}
                  <div>
                    <h4 className="font-serif text-lg font-bold text-stone-900 mb-3">
                      Specify Target Bag Dimensions & Material
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">Width (cm)</label>
                        <input 
                          type="number"
                          value={bagWidth}
                          onChange={(e) => setBagWidth(Number(e.target.value))}
                          className="w-full p-3 text-sm font-bold bg-[#FAF7F2] border border-stone-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">Height (cm)</label>
                        <input 
                          type="number"
                          value={bagHeight}
                          onChange={(e) => setBagHeight(Number(e.target.value))}
                          className="w-full p-3 text-sm font-bold bg-[#FAF7F2] border border-stone-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">Gusset (cm)</label>
                        <input 
                          type="number"
                          value={bagGusset}
                          onChange={(e) => setBagGusset(Number(e.target.value))}
                          className="w-full p-3 text-sm font-bold bg-[#FAF7F2] border border-stone-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">Paper Grammage</label>
                        <select 
                          value={paperWeight}
                          onChange={(e) => setPaperWeight(e.target.value)}
                          className="w-full p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl"
                        >
                          <option value="120">120 GSM (Light Retail)</option>
                          <option value="180">180 GSM (Standard Kraft)</option>
                          <option value="220">220 GSM (Heavy Boutique)</option>
                          <option value="280">280 GSM (Industrial Sack)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">Handle Construction</label>
                        <select 
                          value={handleType}
                          onChange={(e) => setHandleType(e.target.value as any)}
                          className="w-full p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl"
                        >
                          <option value="twisted">Twisted Kraft Paper Cord</option>
                          <option value="cotton">Braided Cotton Rope + Metal Eyelets</option>
                          <option value="flat">Flat Fold Paper Strap</option>
                          <option value="ribbon">Satin VIP Gift Ribbon</option>
                          <option value="diecut">Die-Cut Oval Punch</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Special Finishes */}
                  <div>
                    <label className="text-[11px] font-bold text-stone-700 uppercase block mb-1">
                      Technical Finishing Instructions / Target Deadlines
                    </label>
                    <textarea 
                      rows={3}
                      value={dielineNotes}
                      onChange={(e) => setDielineNotes(e.target.value)}
                      placeholder="E.g. We require matte gold foil on the front logo and spot UV on the side gussets. Delivery required to Bole Industrial Park by end of month..."
                      className="w-full p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                    />
                  </div>

                </div>
              )}

            </div>

            {/* Right Column: Live Quotation, ESG Metrics & Submission */}
            <div className="lg:col-span-5 space-y-6 sticky top-28">
              
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1E3B2E]">
                    Commercial Estimation
                  </span>
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                    Ethiopian Birr (ETB)
                  </span>
                </div>
                
                <h3 className="font-serif text-2xl font-bold text-stone-900 mb-6">
                  Live Technical Quotation
                </h3>

                {/* Target Volume Slider */}
                <div className="mb-6 pb-6 border-b border-stone-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-stone-700 uppercase">Production Volume:</span>
                    <span className="font-mono text-base font-bold text-[#1E3B2E]">
                      {quantity.toLocaleString()} units
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full accent-[#8C4B31] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span>1,000 min</span>
                    <span>20,000 bulk rate</span>
                    <span>100,000+</span>
                  </div>
                </div>

                {/* Specification Breakdown */}
                <div className="space-y-2 text-xs mb-6">
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Dimensions:</span>
                    <span className="font-bold text-stone-900">{bagWidth} × {bagHeight} + {bagGusset} cm</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Material Grade:</span>
                    <span className="font-bold text-stone-900">{paperWeight} GSM Kraft</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Paper Shade:</span>
                    <span className="font-bold text-stone-900 capitalize">{bagColorName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Handle Style:</span>
                    <span className="font-bold text-stone-900 capitalize">{handleType} Handle</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-100">
                    <span className="text-stone-500">Branding Finish:</span>
                    <span className="font-bold text-stone-900 capitalize">{textColorName}</span>
                  </div>
                </div>

                {/* Live Price Box */}
                <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 mb-6">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-stone-600 font-medium">Estimated Unit Rate:</span>
                    <span className="font-serif text-2xl font-bold text-[#8C4B31]">
                      {estUnitPrice} ETB
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Estimated Order Total:</span>
                    <span className="font-semibold text-stone-900">{totalEstEtb} ETB</span>
                  </div>
                </div>

                {/* ESG Impact Bar */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 mb-6 text-center">
                  <div>
                    <span className="text-[10px] text-emerald-800 font-medium block">Plastic Avoided</span>
                    <span className="font-bold text-emerald-900 text-xs">{plasticDivertedKg.toLocaleString()} kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-800 font-medium block">CO2 Offset</span>
                    <span className="font-bold text-emerald-900 text-xs">{co2AvoidedKg.toLocaleString()} kg</span>
                  </div>
                </div>

                {/* Contact Information Fields */}
                <div className="space-y-3 mb-6">
                  <input 
                    type="text"
                    required
                    placeholder="Brand / Company Name *"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="email"
                      required
                      placeholder="Contact Email *"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                    />
                    <input 
                      type="tel"
                      required
                      placeholder="Phone (09... / +251) *"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                    />
                  </div>
                  <input 
                    type="text"
                    placeholder="Delivery Location (E.g. Bole, Addis Ababa / Hawassa)"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="w-full p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles size={16} className="animate-spin" />
                      <span>Submitting to Engineering Desk...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Specification For Pre-Production</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-stone-400 mt-3">
                  Physical pre-production proof delivered in Addis Ababa within 48 hours. Verified via CBE / Telebirr.
                </p>
              </div>

            </div>

          </form>
        )}

      </div>
    </div>
  );
}
