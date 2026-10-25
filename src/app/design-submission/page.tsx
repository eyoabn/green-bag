"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  FileCheck, 
  Sparkles, 
  ArrowLeft,
  PenTool,
  Image as ImageIcon,
  Layers,
  Ruler,
  Scale,
  Palette,
  Clock,
  Check,
  ShieldCheck,
  Package,
  SlidersHorizontal,
  Info,
  RefreshCw,
  Sparkle
} from "lucide-react";
import { uploadFileSafely } from "@/utils/fileUpload";
import { getCurrentUser } from "@/utils/auth";
import StickyBottomBar from "@/components/StickyBottomBar";

// Preset Bag Sizes
interface SizePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  gusset: number;
  description: string;
  category: string;
}

const SIZE_PRESETS: SizePreset[] = [
  {
    id: "small-boutique",
    name: "Small Boutique / Gift",
    width: 20,
    height: 24,
    gusset: 8,
    description: "Cosmetics, perfumes, jewelry, pharmacy & accessories",
    category: "Boutique",
  },
  {
    id: "medium-retail",
    name: "Medium Retail Standard",
    width: 26,
    height: 32,
    gusset: 10,
    description: "Apparel, books, accessories, retail merchandise & gifts (Most Popular)",
    category: "Retail",
  },
  {
    id: "large-department",
    name: "Large Department / Fashion",
    width: 32,
    height: 40,
    gusset: 12,
    description: "Bulky fashion, shoe boxes, winter clothing & department retail",
    category: "Department",
  },
  {
    id: "coffee-gusset",
    name: "Specialty Coffee Gusset",
    width: 24,
    height: 28,
    gusset: 10,
    description: "250g / 500g / 1kg roasted coffee beans, tea & dry gourmet goods",
    category: "Coffee",
  },
  {
    id: "bakery-flat-bottom",
    name: "Bakery & Food Flat-Bottom",
    width: 26,
    height: 22,
    gusset: 16,
    description: "Pastry boxes, takeaway meal containers, cakes & bakery goods",
    category: "Bakery",
  },
];

// Quantity Tiers
interface QuantityOption {
  value: string;
  count: number;
  label: string;
  discountBadge?: string;
  unitMultiplier: number;
}

const QUANTITY_OPTIONS: QuantityOption[] = [
  { value: "500 pcs", count: 500, label: "500 pcs (Starter Batch)", unitMultiplier: 1.15 },
  { value: "1,000 pcs", count: 1000, label: "1,000 pcs (Standard Run)", discountBadge: "Most Popular", unitMultiplier: 1.0 },
  { value: "2,500 pcs", count: 2500, label: "2,500 pcs (Commercial Volume)", discountBadge: "8% Savings", unitMultiplier: 0.92 },
  { value: "5,000 pcs", count: 5000, label: "5,000 pcs (Wholesale Enterprise)", discountBadge: "15% Savings", unitMultiplier: 0.85 },
  { value: "10,000+ pcs", count: 10000, label: "10,000+ pcs (Industrial Scale)", discountBadge: "Direct Factory Tier", unitMultiplier: 0.78 },
];

// Paper GSM Options
interface GsmOption {
  value: number;
  label: string;
  description: string;
  baseCost: number;
}

const GSM_OPTIONS: GsmOption[] = [
  { value: 160, label: "160 GSM Light Kraft", description: "Eco-lightweight, ideal for bakeries, pharmacies & light gift bags", baseCost: 15.0 },
  { value: 180, label: "180 GSM Standard Kraft", description: "Durable everyday retail kraft bag, balanced weight & tear-resistance", baseCost: 17.5 },
  { value: 220, label: "220 GSM Reinforced Kraft", description: "Heavyweight kraft for coffee roasters, apparel & premium retail", baseCost: 20.0 },
  { value: 250, label: "250 GSM Luxury Cardboard", description: "Rigid luxury matte board for high-end boutique & luxury gifts", baseCost: 24.0 },
  { value: 280, label: "280 GSM Industrial Extra-Duty", description: "Maximum tensile strength for heavy gourmet goods & industrial items", baseCost: 27.5 },
];

// Handle Constructions
interface HandleOption {
  id: string;
  name: string;
  description: string;
  costDelta: number;
}

const HANDLE_OPTIONS: HandleOption[] = [
  { id: "Twisted Kraft Cord", name: "Twisted Kraft Paper Cord", description: "100% recyclable kraft cord, classic retail look", costDelta: 0 },
  { id: "Woven Cotton Rope", name: "Woven Cotton Rope + Eyelets", description: "Soft luxurious grip with brass eyelet reinforcement", costDelta: 3.5 },
  { id: "Flat-Fold Kraft", name: "Flat-Fold Kraft Handle", description: "Traditional grocery & bakery fold-in handle", costDelta: -0.5 },
  { id: "Die-Cut Oval Handle", name: "Die-Cut Reinforced Handle", description: "Sleek punch-hole handle, modern minimalist profile", costDelta: -1.0 },
  { id: "Luxury Satin Ribbon", name: "Luxury Satin Ribbon", description: "Silky premium ribbon for cosmetics & bridal retail", costDelta: 4.5 },
  { id: "No Handles (Fold-Over)", name: "No Handle / Fold-Over Sack", description: "Bakery sack or coffee roll-down pouch", costDelta: -2.0 },
];

// Print Finishes
interface PrintOption {
  id: string;
  name: string;
  description: string;
  costDelta: number;
}

const PRINT_OPTIONS: PrintOption[] = [
  { id: "1-Color Soy Screenprint", name: "1-Color Soy Screenprint", description: "Minimalist eco-craft ink, sharp logo placement", costDelta: 0 },
  { id: "2-Color Traditional Tibeb", name: "2-Color Traditional Ethiopian Tibeb", description: "Heritage border patterns + company logo in dual inks", costDelta: 2.5 },
  { id: "Full-Color Process (CMYK)", name: "Full-Color CMYK Process", description: "Vibrant multi-colored photographic branding", costDelta: 4.0 },
  { id: "Gold / Copper Foil Stamping", name: "Hot Metallic Foil Stamping (Gold/Bronze)", description: "Luxurious reflective metallic foil logo & accents", costDelta: 5.5 },
  { id: "Debossed / Embossed 3D Logo", name: "Tactile Blind Debossing / Embossing", description: "3D raised or recessed tactile impression without ink", costDelta: 3.5 },
  { id: "Spot UV Gloss Coating", name: "Spot UV Gloss Highlight", description: "High-gloss protective coating over matte kraft", costDelta: 3.0 },
];

// Paper Colors
const PAPER_COLORS = [
  { id: "Natural Brown Kraft", name: "Natural Brown Kraft", bgHex: "#C4A57B", borderHex: "#9C7E57", textClass: "text-[#5A412A]" },
  { id: "Bleached White Kraft", name: "Bleached Pure White Kraft", bgHex: "#F5F3EF", borderHex: "#D8D4CC", textClass: "text-stone-800" },
  { id: "Charcoal Black Kraft", name: "Charcoal Black Kraft", bgHex: "#353432", borderHex: "#1E1E1E", textClass: "text-stone-100" },
];

function DesignSubmissionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search parameters for pre-filling
  const presetParam = searchParams.get("preset");
  const gsmParam = searchParams.get("gsm");
  const dimensionsParam = searchParams.get("dimensions");
  const handleParam = searchParams.get("handle");

  // Form State
  const [title, setTitle] = useState(presetParam ? `Custom Run — ${presetParam}` : "");
  const [selectedSizePreset, setSelectedSizePreset] = useState<string>("medium-retail");
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [customWidth, setCustomWidth] = useState(26);
  const [customHeight, setCustomHeight] = useState(32);
  const [customGusset, setCustomGusset] = useState(10);

  const [quantity, setQuantity] = useState("1,000 pcs");
  const [isCustomQuantity, setIsCustomQuantity] = useState(false);
  const [customQuantityNum, setCustomQuantityNum] = useState(1000);

  const [gsm, setGsm] = useState<number>(gsmParam ? parseInt(gsmParam, 10) || 220 : 220);
  const [handleType, setHandleType] = useState<string>(handleParam || "Twisted Kraft Cord");
  const [printFinish, setPrintFinish] = useState<string>("1-Color Soy Screenprint");
  const [paperColor, setPaperColor] = useState<string>("Natural Brown Kraft");
  const [hasBottomCard, setHasBottomCard] = useState<boolean>(true);
  const [hasFoodLining, setHasFoodLining] = useState<boolean>(false);
  const [urgency, setUrgency] = useState<string>("Standard (7-10 Days)");

  // Submission Mode: Visual Builder vs Ready Artwork Upload
  const [studioMode, setStudioMode] = useState<"visual_builder" | "ready_upload">("visual_builder");

  // Artwork & File State
  const [artworkMode, setArtworkMode] = useState<"upload" | "need-draft">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check auth and restore local draft if available
  useEffect(() => {
    getCurrentUser().then((u) => {
      setCurrentUser(u);
    }).catch(() => {});

    // Restore draft from localStorage
    try {
      const savedDraft = localStorage.getItem("greenwork_design_draft");
      if (savedDraft && !presetParam) {
        const draft = JSON.parse(savedDraft);
        if (draft.title) setTitle(draft.title);
        if (draft.quantity) setQuantity(draft.quantity);
        if (draft.gsm) setGsm(draft.gsm);
        if (draft.handleType) setHandleType(draft.handleType);
        if (draft.printFinish) setPrintFinish(draft.printFinish);
        if (draft.notes) setNotes(draft.notes);
      }
    } catch {}
  }, [presetParam]);

  // If URL dimensions provided, match or set custom
  useEffect(() => {
    if (dimensionsParam) {
      const matched = SIZE_PRESETS.find(
        (p) => `${p.width}cm × ${p.height}cm + ${p.gusset}cm`.toLowerCase() === dimensionsParam.toLowerCase() ||
               dimensionsParam.toLowerCase().includes(p.name.toLowerCase())
      );
      if (matched) {
        setSelectedSizePreset(matched.id);
        setIsCustomSize(false);
      } else {
        setIsCustomSize(true);
      }
    }
  }, [dimensionsParam]);

  // Save draft whenever key fields change
  useEffect(() => {
    try {
      localStorage.setItem("greenwork_design_draft", JSON.stringify({
        title,
        quantity,
        gsm,
        handleType,
        printFinish,
        notes,
        paperColor,
      }));
    } catch {}
  }, [title, quantity, gsm, handleType, printFinish, notes, paperColor]);

  // Dimensions formatted
  const activeDimensions = useMemo(() => {
    if (isCustomSize) {
      return `Custom: ${customWidth}cm W × ${customHeight}cm H + ${customGusset}cm Gusset`;
    }
    const preset = SIZE_PRESETS.find((p) => p.id === selectedSizePreset) || SIZE_PRESETS[1];
    return `${preset.name} (${preset.width}cm × ${preset.height}cm + ${preset.gusset}cm)`;
  }, [isCustomSize, selectedSizePreset, customWidth, customHeight, customGusset]);

  // Effective count for calculation
  const effectiveCount = useMemo(() => {
    if (isCustomQuantity) return Math.max(250, customQuantityNum);
    const q = QUANTITY_OPTIONS.find((opt) => opt.value === quantity);
    return q ? q.count : 1000;
  }, [isCustomQuantity, customQuantityNum, quantity]);

  // Dynamic price calculation
  const { unitPriceEstimate, totalPriceEstimate } = useMemo(() => {
    const gsmOpt = GSM_OPTIONS.find((g) => g.value === gsm) || GSM_OPTIONS[2];
    const handleOpt = HANDLE_OPTIONS.find((h) => h.id === handleType) || HANDLE_OPTIONS[0];
    const printOpt = PRINT_OPTIONS.find((p) => p.id === printFinish) || PRINT_OPTIONS[0];

    let base = gsmOpt.baseCost + handleOpt.costDelta + printOpt.costDelta;
    if (paperColor === "Bleached White Kraft") base += 1.5;
    if (paperColor === "Charcoal Black Kraft") base += 2.0;
    if (hasBottomCard) base += 0.8;
    if (hasFoodLining) base += 1.2;

    // Quantity multiplier
    let multiplier = 1.0;
    if (effectiveCount < 1000) multiplier = 1.18;
    else if (effectiveCount >= 10000) multiplier = 0.76;
    else if (effectiveCount >= 5000) multiplier = 0.84;
    else if (effectiveCount >= 2500) multiplier = 0.91;
    else multiplier = 1.0;

    // Urgency surcharge
    if (urgency.includes("Express")) {
      base *= 1.15;
    }

    const unit = Math.round(base * multiplier * 10) / 10;
    const total = Math.round(unit * effectiveCount);
    return { unitPriceEstimate: unit, totalPriceEstimate: total };
  }, [gsm, handleType, printFinish, paperColor, hasBottomCard, hasFoodLining, effectiveCount, urgency]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const allowed = [
      "image/jpeg", 
      "image/png", 
      "image/webp", 
      "image/svg+xml", 
      "application/pdf", 
      "application/postscript",
      "application/illustrator"
    ];
    if (!allowed.includes(selected.type) && !selected.name.match(/\.(ai|eps|svg|pdf|png|jpg|jpeg|webp)$/i)) {
      setErrorMsg("Please upload a PDF, AI, EPS, SVG, PNG, JPG, or WEBP design file.");
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      setErrorMsg("File exceeds the 15 MB size limit.");
      return;
    }

    setErrorMsg(null);
    setFile(selected);

    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      router.push("/login?returnTo=/design-submission");
      return;
    }

    if (!title.trim()) {
      setErrorMsg("Please enter a Brand or Project Title for your custom packaging.");
      return;
    }

    if (artworkMode === "upload" && !file) {
      setErrorMsg("Please select your artwork file or switch to 'Request Dieline Drafting' below.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let uploadedFilePath = "spec-draft-pending-artwork";
      if (file) {
        const uploadRes = await uploadFileSafely(file, "designs");
        if (!uploadRes.filePath) {
          throw new Error("Failed to upload artwork file.");
        }
        uploadedFilePath = uploadRes.filePath;
      }

      // Complete structured design specification payload
      const payload = {
        title: title.trim(),
        filePath: uploadedFilePath,
        quantity: isCustomQuantity ? `${effectiveCount.toLocaleString()} pcs (Custom)` : quantity,
        dimensions: activeDimensions,
        gsm,
        handleType,
        printFinish,
        urgency,
        description: notes.trim() || `Custom manufacturing configuration for ${title}.`,
        specsJson: {
          paperColor,
          hasBottomCard,
          hasFoodLining,
          artworkMode,
          unitPriceEstimate,
          totalPriceEstimate,
          estimatedCurrency: "ETB",
          submittedAt: new Date().toISOString(),
        },
      };

      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record design submission.");
      }

      // Clear draft on successful submission
      try {
        localStorage.removeItem("greenwork_design_draft");
      } catch {}

      setSubmittedId(data.design?.id || "submitted");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmation Screen
  if (submittedId) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#F9F6F0] flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-xl text-center animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#1E3B2E] bg-[#1E3B2E]/10 px-3 py-1 rounded-full">
            Engineering Ticket Created
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-3 mb-2">
            Specifications Received
          </h1>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            Our master packaging engineers have received your custom configuration for <strong className="text-stone-900">{title}</strong>. We are generating your official manufacturing dieline proof and binding formal quotation.
          </p>

          <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 text-left mb-6 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-stone-500">Order Quantity:</span>
              <span className="font-bold text-stone-900">{isCustomQuantity ? `${effectiveCount.toLocaleString()} pcs` : quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Bag Format & Size:</span>
              <span className="font-semibold text-stone-900 truncate max-w-[220px]">{activeDimensions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Paper Grade:</span>
              <span className="font-semibold text-stone-900">{gsm} GSM • {paperColor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Handle Construction:</span>
              <span className="font-semibold text-stone-900">{handleType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Print Technique:</span>
              <span className="font-semibold text-stone-900">{printFinish}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-stone-200">
              <span className="text-stone-500 font-bold">Estimated Total:</span>
              <span className="font-bold text-[#8C4B31] text-sm font-mono">{totalPriceEstimate.toLocaleString()} ETB</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/dashboard?tab=designs"
              className="btn-primary w-full py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <span>Track in Account Portal</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/products"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 text-center"
            >
              Explore Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedColorMeta = PAPER_COLORS.find((c) => c.id === paperColor) || PAPER_COLORS[0];

  return (
    <div className="min-h-screen pt-24 pb-32 md:pb-24 bg-[#F9F6F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#8C4B31] transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Products</span>
          </Link>

          {presetParam && (
            <span className="text-[11px] font-bold text-[#8C4B31] bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Configuring from showcase: {presetParam}
            </span>
          )}
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] text-xs font-bold uppercase tracking-wider mb-2">
            <PenTool size={13} />
            <span>Interactive Packaging Studio</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
            Custom Paper Bag Design Studio
          </h1>
          <p className="text-stone-600 text-sm mt-1 max-w-2xl leading-relaxed">
            Select your exact manufacturing quantity, custom dimensions, paper grammage, handle style, and print finishes. Our Addis Ababa packaging engineers deliver free dielines and binding quotes within 24 hours.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <Info size={16} className="shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Two Design Submission Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            onClick={() => {
              setStudioMode("visual_builder");
              setArtworkMode("need-draft");
            }}
            className={`p-6 rounded-3xl border-2 text-left transition-all cursor-pointer flex items-start gap-4 ${
              studioMode === "visual_builder"
                ? "border-[#1E3B2E] bg-white ring-4 ring-[#1E3B2E]/10 shadow-md"
                : "border-stone-200 bg-white/70 hover:bg-white hover:border-stone-300 opacity-80"
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              studioMode === "visual_builder" ? "bg-[#1E3B2E] text-[#E0B382]" : "bg-stone-100 text-stone-600"
            }`}>
              <Palette size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold text-stone-900">
                  Option 1: Design Bag Online
                </span>
                {studioMode === "visual_builder" && (
                  <span className="bg-[#1E3B2E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Design right here in your browser! Pick bag size, paper color, handle style, enter your brand title, and visually preview your bag in real-time.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setStudioMode("ready_upload");
              setArtworkMode("upload");
            }}
            className={`p-6 rounded-3xl border-2 text-left transition-all cursor-pointer flex items-start gap-4 ${
              studioMode === "ready_upload"
                ? "border-[#8C4B31] bg-white ring-4 ring-[#8C4B31]/10 shadow-md"
                : "border-stone-200 bg-white/70 hover:bg-white hover:border-stone-300 opacity-80"
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              studioMode === "ready_upload" ? "bg-[#8C4B31] text-white" : "bg-stone-100 text-stone-600"
            }`}>
              <Upload size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold text-stone-900">
                  Option 2: Upload Ready Artwork & CAD Dieline
                </span>
                {studioMode === "ready_upload" && (
                  <span className="bg-[#8C4B31] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Already have vector files prepared by your graphic designer? Upload your AI, PDF, CDR, or SVG dielines directly for factory verification and fast-track quote.
              </p>
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Options Picker (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Project Title */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-900">
                1. Project / Brand Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rare Specialty Coffee 500g Roaster Bag"
                className="form-input text-sm font-medium"
              />
              <p className="text-[11px] text-stone-500">
                Enter your company or campaign name to identify your production batch.
              </p>
            </div>

            {/* If in Ready Upload Mode, showcase file uploader right up front */}
            {studioMode === "ready_upload" && (
              <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#8C4B31]/30 shadow-sm space-y-4 animate-in fade-in">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C4B31] flex items-center gap-1.5">
                    <Upload size={14} />
                    <span>Upload Ready Artwork / CAD Dieline File *</span>
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Upload your completed artwork or technical dieline file (.AI, .PDF, .CDR, .EPS, .SVG, .PNG, .PSD).
                  </p>
                </div>

                <label className="border-2 border-dashed border-[#8C4B31]/40 hover:border-[#8C4B31] bg-amber-50/20 hover:bg-white rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                  <input
                    type="file"
                    accept="image/*,application/pdf,application/illustrator,application/postscript,.cdr,.ai,.eps,.psd,.zip"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-[#8C4B31]/10 text-[#8C4B31] flex items-center justify-center mb-3">
                    <Upload size={28} />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                        <FileCheck size={18} />
                        <span>{file.name}</span>
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        {(file.size / 1024).toFixed(1)} KB • File loaded for technical verification
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-stone-800">
                        Drag and drop your ready artwork or click to browse
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Supported: Adobe Illustrator (.AI), PDF, CorelDraw (.CDR), Vector EPS, High-Res PNG (up to 50 MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            )}

            {/* 2. Order Quantity ("How much they want") */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    2. Order Quantity (Production Batch) *
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Select how many units you want manufactured. Higher volume unlocks direct factory discounts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomQuantity(!isCustomQuantity)}
                  className="text-xs font-bold text-[#8C4B31] hover:underline"
                >
                  {isCustomQuantity ? "Use Standard Tiers" : "Enter Custom Qty"}
                </button>
              </div>

              {!isCustomQuantity ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QUANTITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setQuantity(opt.value)}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        quantity === opt.value
                          ? "border-[#1E3B2E] bg-[#1E3B2E]/5 ring-2 ring-[#1E3B2E]/20"
                          : "border-stone-200 hover:border-stone-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-stone-900">{opt.value}</span>
                        {opt.discountBadge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            opt.discountBadge.includes("Popular")
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {opt.discountBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 mt-1">{opt.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">Custom Unit Count</span>
                    <span className="font-mono font-bold text-sm text-[#8C4B31]">
                      {customQuantityNum.toLocaleString()} pcs
                    </span>
                  </div>
                  <input
                    type="range"
                    min={250}
                    max={50000}
                    step={250}
                    value={customQuantityNum}
                    onChange={(e) => setCustomQuantityNum(parseInt(e.target.value, 10))}
                    className="w-full accent-[#1E3B2E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>Min: 250 pcs</span>
                    <span>10,000 pcs</span>
                    <span>Max: 50,000 pcs</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Size & Dimensions ("The size they want") */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    3. Bag Dimensions & Packaging Style *
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Choose standard industry dimensions or configure your bespoke Width × Height × Gusset in cm.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomSize(!isCustomSize)}
                  className="text-xs font-bold text-[#8C4B31] hover:underline"
                >
                  {isCustomSize ? "Use Preset Sizes" : "Enter Custom Size"}
                </button>
              </div>

              {!isCustomSize ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedSizePreset(preset.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedSizePreset === preset.id
                          ? "border-[#1E3B2E] bg-[#1E3B2E]/5 ring-2 ring-[#1E3B2E]/20"
                          : "border-stone-200 hover:border-stone-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-stone-900">{preset.name}</span>
                        <span className="text-[10px] font-mono font-bold text-[#8C4B31] bg-amber-50 px-2 py-0.5 rounded">
                          {preset.width}×{preset.height}+{preset.gusset} cm
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-snug">{preset.description}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-stone-200 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">Width (cm)</label>
                      <input
                        type="number"
                        min={10}
                        max={80}
                        value={customWidth}
                        onChange={(e) => setCustomWidth(parseInt(e.target.value, 10) || 10)}
                        className="form-input text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">Height (cm)</label>
                      <input
                        type="number"
                        min={10}
                        max={100}
                        value={customHeight}
                        onChange={(e) => setCustomHeight(parseInt(e.target.value, 10) || 10)}
                        className="form-input text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-700 block mb-1">Gusset Depth (cm)</label>
                      <input
                        type="number"
                        min={4}
                        max={40}
                        value={customGusset}
                        onChange={(e) => setCustomGusset(parseInt(e.target.value, 10) || 4)}
                        className="form-input text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Bespoke dimensions: {customWidth} cm Width × {customHeight} cm Height + {customGusset} cm Bottom Gusset. Our engineers will create custom cutting dies matching these exact specs.
                  </p>
                </div>
              )}
            </div>

            {/* 4. Paper Material & Grammage (GSM) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  4. Paper Weight & Grammage (GSM) *
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Heavier GSM provides greater rigidity, tear resistance, and load capacity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GSM_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGsm(opt.value)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      gsm === opt.value
                        ? "border-[#1E3B2E] bg-[#1E3B2E]/5 ring-2 ring-[#1E3B2E]/20"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-stone-900">{opt.label}</span>
                      {opt.value === 220 && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Handle Construction & Style */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  5. Handle Construction & Grip *
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Select how customers will carry your bag.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HANDLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setHandleType(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      handleType === opt.id
                        ? "border-[#1E3B2E] bg-[#1E3B2E]/5 ring-2 ring-[#1E3B2E]/20"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs text-stone-900">{opt.name}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Print Technique & Finishes */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  6. Print Finishing & Technique *
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Surface application technique for logos, traditional Ethiopian tibeb motifs, or graphics.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRINT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPrintFinish(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      printFinish === opt.id
                        ? "border-[#1E3B2E] bg-[#1E3B2E]/5 ring-2 ring-[#1E3B2E]/20"
                        : "border-stone-200 hover:border-stone-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs text-stone-900">{opt.name}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-snug">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Base Paper Color & Functional Extras */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  7. Paper Base Color & Reinforcements
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Select base paper shade and optional interior barriers.
                </p>
              </div>

              {/* Color Swatches */}
              <div className="grid grid-cols-3 gap-3">
                {PAPER_COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setPaperColor(col.id)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      paperColor === col.id
                        ? "border-[#1E3B2E] ring-2 ring-[#1E3B2E]/20"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-2 shadow-xs border"
                      style={{ backgroundColor: col.bgHex, borderColor: col.borderHex }}
                    />
                    <span className="text-[11px] font-bold text-stone-800 block leading-tight">
                      {col.name.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Reinforcement checkboxes */}
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasBottomCard}
                    onChange={(e) => setHasBottomCard(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#1E3B2E] focus:ring-[#1E3B2E] accent-[#1E3B2E]"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Heavy Base Cardboard Insert</span>
                    <span className="text-[11px] text-stone-500 block">
                      Reinforced 350 GSM cardboard insert at the bottom for heavy bottles, apparel, and structural stability.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasFoodLining}
                    onChange={(e) => setHasFoodLining(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#1E3B2E] focus:ring-[#1E3B2E] accent-[#1E3B2E]"
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Food-Grade Greaseproof Barrier</span>
                    <span className="text-[11px] text-stone-500 block">
                      Internal food-contact coating resistant to bakery butter, oils, and warm pastries.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* 8. Turnaround Urgency */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  8. Production Urgency & Schedule *
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUrgency("Standard (7-10 Days)")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    urgency.includes("Standard")
                      ? "border-[#1E3B2E] bg-[#1E3B2E]/5 ring-2 ring-[#1E3B2E]/20"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={15} className="text-[#1E3B2E]" />
                    <span className="font-bold text-xs text-stone-900">Standard Production (7–10 Days)</span>
                  </div>
                  <p className="text-[11px] text-stone-500">Regular Addis Ababa facility schedule. Standard pricing.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency("Express Rush (3-5 Days)")}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    urgency.includes("Express")
                      ? "border-[#8C4B31] bg-amber-50/50 ring-2 ring-[#8C4B31]/20"
                      : "border-stone-200 hover:border-stone-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={15} className="text-[#8C4B31]" />
                    <span className="font-bold text-xs text-stone-900">Express Rush (3–5 Days)</span>
                  </div>
                  <p className="text-[11px] text-stone-500">Fast-tracked cylinder prep & priority line (+15% expedited surcharge).</p>
                </button>
              </div>
            </div>

            {/* 9. Artwork & Dieline Upload */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    9. Artwork & Brand Assets *
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Upload your vector logo or ask Green Bag engineers to prepare the dieline.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setArtworkMode("upload")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      artworkMode === "upload" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setArtworkMode("need-draft")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      artworkMode === "need-draft" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
                    }`}
                  >
                    Draft For Me
                  </button>
                </div>
              </div>

              {artworkMode === "upload" ? (
                <div>
                  <label className="border-2 border-dashed border-stone-300 hover:border-[#1E3B2E] bg-[#FAF7F2] hover:bg-white rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                    <input
                      type="file"
                      accept="image/*,application/pdf,application/illustrator,application/postscript"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Upload size={28} className="text-[#1E3B2E] mb-2" />
                    {file ? (
                      <div>
                        <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                          <FileCheck size={16} />
                          <span>{file.name}</span>
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1">
                          {(file.size / 1024).toFixed(1)} KB • Click to change file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-stone-800">
                          Click or drag artwork file (PDF, AI, EPS, SVG, PNG, JPG)
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Vector files preferred for highest print sharpness (up to 15 MB)
                        </p>
                      </div>
                    )}
                  </label>

                  {filePreview && (
                    <div className="mt-3 p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3">
                      <img
                        src={filePreview}
                        alt="Artwork preview"
                        className="w-14 h-14 object-contain rounded-xl border border-stone-200 bg-white"
                      />
                      <span className="text-xs text-stone-600 font-medium">Artwork loaded for live dieline placement</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-stone-700 space-y-1">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkle size={14} className="text-[#8C4B31]" />
                    <span>Complimentary Dieline Drafting Service</span>
                  </p>
                  <p>
                    No vector software needed! Describe your branding or email your logo sketch to our Addis Ababa design desk. We will draft full 3D and 2D printable dielines for your review.
                  </p>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Branding Notes & Special Instructions
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Centered logo on both front and back. Traditional Tibeb decorative borders along the top lip. White kraft interior."
                  rows={3}
                  className="form-input text-xs"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Live Bag Mockup & Dynamic Quotation Sticky (5 Cols) */}
          <div className="lg:col-span-5 sticky top-28 space-y-6">
            
            {/* Live Interactive Mockup Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-md space-y-5">
              {/* MODE 1: Live Interactive Mockup Visualizer (Option 1: Design Online ONLY) */}
              {studioMode === "visual_builder" ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31] flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>Live Bag Visualizer</span>
                    </span>
                    <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full">
                      Real-time render
                    </span>
                  </div>

                  {/* Mockup Canvas */}
                  <div className="relative w-full h-96 rounded-2xl bg-gradient-to-b from-stone-100 to-stone-200/70 border border-stone-200/80 flex flex-col items-center justify-center p-6 overflow-hidden shadow-inner">
                    
                    {/* Background Shadow */}
                    <div className="absolute bottom-6 w-52 h-4 bg-black/20 blur-md rounded-full pointer-events-none" />

                    {/* Bag Body Simulation */}
                    <div
                      className="relative w-48 sm:w-52 h-68 rounded-md shadow-2xl border flex flex-col items-center justify-between p-4 transition-all duration-300"
                      style={{
                        backgroundColor: selectedColorMeta.bgHex,
                        borderColor: selectedColorMeta.borderHex,
                      }}
                    >
                      {/* Handle Graphic */}
                      {handleType !== "No Handles (Fold-Over)" && (
                        <div 
                          className="absolute -top-11 left-1/2 -translate-x-1/2 w-24 h-16 border-4 rounded-t-full transition-all pointer-events-none drop-shadow-xs"
                          style={{
                            borderColor: handleType.includes("Cotton")
                              ? "#E8E2D9"
                              : handleType.includes("Satin")
                              ? "#D4AF37"
                              : "#8A6946",
                            borderBottom: "none",
                          }}
                        />
                      )}

                      {/* Top Fold / Gusset Line */}
                      <div className="w-full h-2 border-b border-black/15 opacity-60" />

                      {/* Complete Center Brand & Typography Placement (Logo + Brand Name + Finish) */}
                      <div className="text-center w-full px-2 my-auto flex flex-col items-center justify-center gap-1.5">
                        {filePreview && (
                          <div className="p-1 rounded-md bg-white/40 backdrop-blur-xs border border-white/40 shadow-xs max-w-full">
                            <img
                              src={filePreview}
                              alt="Brand Logo"
                              className="max-h-14 max-w-full mx-auto object-contain drop-shadow-xs"
                            />
                          </div>
                        )}

                        <div className="w-full">
                          <span className={`font-serif text-sm font-black block tracking-wide truncate drop-shadow-xs ${selectedColorMeta.textClass}`}>
                            {title.trim() || "Brand Name Here"}
                          </span>
                          <span className={`text-[10px] uppercase font-bold tracking-widest block opacity-75 mt-0.5 ${selectedColorMeta.textClass}`}>
                            {printFinish.split(" ")[0]} Finish
                          </span>
                        </div>

                        <div className="mt-1 px-2 py-0.5 rounded-full bg-black/10 text-[9px] font-semibold tracking-wider text-black/70 flex items-center gap-1">
                          <span>Addis Ababa Plant</span>
                          <span>•</span>
                          <span>100% Recyclable</span>
                        </div>
                      </div>

                      {/* Bottom Gusset & Technical Specs Indicator */}
                      <div className="w-full flex justify-between items-center text-[10px] text-black/60 font-mono font-bold pt-2 border-t border-black/15">
                        <span>{gsm} GSM</span>
                        <span>{activeDimensions.split(" ")[0]}</span>
                      </div>
                    </div>

                    {/* Technical Floating Badge Details */}
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-stone-500 font-medium px-2">
                      <span className="truncate max-w-[120px]">{selectedColorMeta.name}</span>
                      <span className="truncate max-w-[140px]">{handleType.split(" ")[0]}</span>
                    </div>
                  </div>
                </>
              ) : (
                /* MODE 2: CAD Vector Preflight Inspection (NO Live Bag Visualizer in Option 2) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31] flex items-center gap-1.5">
                      <Upload size={14} />
                      <span>Vector CAD Intake</span>
                    </span>
                    <span className="text-[10px] font-bold bg-[#1E3B2E]/10 text-[#1E3B2E] px-2.5 py-0.5 rounded-full">
                      Fast-Track Dieline
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-stone-200/90 space-y-4">
                    <div>
                      <h4 className="font-serif text-base font-bold text-stone-900">
                        Direct Prepress Dieline Inspection
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Your vector CAD files (.AI, .PDF, .CDR, .EPS, .SVG) are verified directly by our packaging engineering desk at the Addis Ababa plant.
                      </p>
                    </div>

                    {file ? (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <div className="overflow-hidden flex-1">
                          <span className="block text-xs font-bold text-emerald-950 truncate">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-medium">Ready for CAD dieline verification</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                        <Info size={18} className="text-amber-700 shrink-0" />
                        <div className="text-xs text-amber-900">
                          <span className="font-bold block">No file uploaded yet</span>
                          <span className="text-[11px]">Upload your production artwork file in Step 1</span>
                        </div>
                      </div>
                    )}

                    {/* Preflight Checklist */}
                    <div className="space-y-2 pt-2 border-t border-stone-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                        Prepress Engineering Standards:
                      </span>
                      <ul className="space-y-1.5 text-xs text-stone-700 font-medium">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1E3B2E]" />
                          <span>Vector cutlines & crease channels separated</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1E3B2E]" />
                          <span>Minimum 3mm bleed margin outside trim</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1E3B2E]" />
                          <span>All fonts outlined / converted to vector curves</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1E3B2E]" />
                          <span>CMYK or Pantone Spot ink separations</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-2 text-[11px] text-stone-500 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#1E3B2E]" />
                      <span>Free engineering preflight analysis & proof within 24h</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Quotation Card */}
              <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-stone-200/90 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Estimated Unit Cost:</span>
                  <span className="font-mono text-xl font-bold text-[#8C4B31]">
                    ~{unitPriceEstimate.toFixed(2)} ETB <span className="text-xs font-normal text-stone-500">/ bag</span>
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-2 border-t border-stone-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-900">Total Investment:</span>
                  <span className="font-mono text-2xl font-bold text-[#1E3B2E]">
                    {totalPriceEstimate.toLocaleString()} ETB
                  </span>
                </div>
                
                <p className="text-[10px] text-stone-500 leading-snug">
                  * Dynamic estimation for {effectiveCount.toLocaleString()} pcs based on chosen GSM, handles, and print technique. Binding formal proof confirmed upon submission.
                </p>
              </div>

              {/* Submit CTA */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="btn-primary w-full py-4 text-xs font-bold uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles size={16} className="animate-spin" />
                      <span>Submitting Custom Order...</span>
                    </>
                  ) : (
                    <>
                      <Package size={16} />
                      <span>Request Dieline & Quotation</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-stone-500 mt-2.5 font-medium">
                  Free engineering consultation. No upfront commitment required.
                </p>
              </div>

            </div>

          </div>

        </form>

      </div>

      <StickyBottomBar>
        <div className="flex flex-col">
          <span className="text-[10px] text-stone-500 font-bold uppercase">Estimated Quote</span>
          <span className="text-base font-bold text-[#8C4B31] font-mono">
            {totalPriceEstimate.toLocaleString()} ETB
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            const form = document.querySelector("form");
            if (form) form.requestSubmit();
          }}
          disabled={isSubmitting || !title.trim()}
          className="btn-primary touch-target text-xs px-6 py-2.5 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Studio Request"}
        </button>
      </StickyBottomBar>
    </div>
  );
}

export default function DesignSubmissionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-24 pb-20 bg-[#F9F6F0] flex items-center justify-center">
          <div className="flex items-center gap-2 text-stone-600 font-bold text-sm">
            <RefreshCw size={18} className="animate-spin text-[#1E3B2E]" />
            <span>Loading Packaging Design Studio...</span>
          </div>
        </div>
      }
    >
      <DesignSubmissionForm />
    </Suspense>
  );
}
