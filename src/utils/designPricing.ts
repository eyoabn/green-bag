// src/utils/designPricing.ts
// Comprehensive configuration types and defaults for the public Design Studio customizer

export interface GsmTierConfig {
  baseCost: number;
  label: string;
  maxKg: number;
  feel: string;
  gauge: string;
  bestFor: string;
  enabled?: boolean;
}

export interface HandleTierConfig {
  costDelta: number;
  name: string;
  gripFeel: string;
  maxKg: number;
  bestFor: string;
  enabled?: boolean;
}

export interface PrintTierConfig {
  costDelta: number;
  name: string;
  finishType: string;
  tactileBadge: string;
  bestFor: string;
  enabled?: boolean;
}

export interface DesignPricingConfig {
  gsm_rates: Record<string, GsmTierConfig>;
  handle_rates: Record<string, HandleTierConfig>;
  print_rates: Record<string, PrintTierConfig>;
}

export interface SizePresetConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  gusset: number;
  description: string;
  category: string;
  enabled?: boolean;
}

export interface DimensionLimitsConfig {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  minGusset: number;
  maxGusset: number;
}

export interface GsmOptionConfig {
  value: number;
  label: string;
  description: string;
  baseCost: number;
  maxKg: number;
  feel: string;
  gauge: string;
  bestFor: string;
  enabled?: boolean;
}

export interface HandleOptionConfig {
  id: string;
  name: string;
  description: string;
  costDelta: number;
  gripFeel: string;
  maxKg: number;
  bestFor: string;
  enabled?: boolean;
}

export interface PrintOptionConfig {
  id: string;
  name: string;
  description: string;
  costDelta: number;
  finishType: string;
  tactileBadge: string;
  bestFor: string;
  enabled?: boolean;
}

export interface PaperColorConfig {
  id: string;
  name: string;
  bgHex: string;
  borderHex: string;
  textClass?: string;
  surcharge: number;
  enabled?: boolean;
}

export interface QuantityTierConfig {
  value: string;
  count: number;
  label: string;
  discountBadge?: string;
  unitMultiplier: number;
  enabled?: boolean;
}

export interface TurnaroundOptionConfig {
  id: string;
  label: string;
  days: string;
  multiplier: number;
  badge?: string;
  description: string;
  enabled?: boolean;
}

export interface StudioHeadingsConfig {
  badge: string;
  title: string;
  subtitle: string;
  minOrderNotice: string;
  sampleProofNotice: string;
}

export interface StudioConfig {
  headings: StudioHeadingsConfig;
  dimension_limits: DimensionLimitsConfig;
  presets: SizePresetConfig[];
  gsm_options: GsmOptionConfig[];
  handle_options: HandleOptionConfig[];
  print_options: PrintOptionConfig[];
  paper_colors: PaperColorConfig[];
  quantity_tiers: QuantityTierConfig[];
  turnaround_options: TurnaroundOptionConfig[];
}

export const DEFAULT_DESIGN_PRICING: DesignPricingConfig = {
  gsm_rates: {
    "160": {
      baseCost: 15.0,
      label: "160 GSM Light Kraft",
      maxKg: 2.5,
      feel: "Crisp & Flexible",
      gauge: "0.18 mm (2-Ply Fiber)",
      bestFor: "Bakeries, pharmacies, lightweight gift pouches & dry pastry",
      enabled: true,
    },
    "180": {
      baseCost: 17.5,
      label: "180 GSM Standard Kraft",
      maxKg: 5.0,
      feel: "Balanced Everyday Retail",
      gauge: "0.22 mm (3-Ply Fiber)",
      bestFor: "Boutique apparel, cosmetics, takeaway & souvenir bags",
      enabled: true,
    },
    "220": {
      baseCost: 20.0,
      label: "220 GSM Reinforced Kraft",
      maxKg: 8.5,
      feel: "Substantial & Rigid Upright",
      gauge: "0.28 mm (4-Ply Heavyweight)",
      bestFor: "Coffee roasters, wine bottles, heavier garments & gift boxes",
      enabled: true,
    },
    "250": {
      baseCost: 24.0,
      label: "250 GSM Luxury Cardboard",
      maxKg: 12.0,
      feel: "Rigid Luxury Matte Board",
      gauge: "0.35 mm (Dense Solid Board)",
      bestFor: "High-end luxury jewelry, watches, corporate gifts & VIP sets",
      enabled: true,
    },
    "280": {
      baseCost: 27.5,
      label: "280 GSM Industrial Extra-Duty",
      maxKg: 16.0,
      feel: "Maximum Tensile Tear-Proof",
      gauge: "0.42 mm (Reinforced Multi-Ply)",
      bestFor: "Heavy gourmet honey/spice jars, export freight & hardware",
      enabled: true,
    },
  },
  handle_rates: {
    "Twisted Kraft Cord": {
      costDelta: 0.0,
      name: "Twisted Kraft Paper Cord",
      gripFeel: "Firm 3-Ply Twisted Kraft",
      maxKg: 8.0,
      bestFor: "Classic sustainable retail, coffee shops & organic brands",
      enabled: true,
    },
    "Woven Cotton Rope": {
      costDelta: 3.5,
      name: "Woven Cotton Rope + Brass Eyelets",
      gripFeel: "Cushioned Tubular Cotton",
      maxKg: 12.0,
      bestFor: "Luxury fashion, VIP events & heavy executive shopping",
      enabled: true,
    },
    "Flat-Fold Kraft": {
      costDelta: -0.5,
      name: "Flat-Fold Kraft Handle",
      gripFeel: "Wide Flat Fold-In Tape",
      maxKg: 6.0,
      bestFor: "Traditional grocery, supermarkets & takeaway food containers",
      enabled: true,
    },
    "Die-Cut Oval Handle": {
      costDelta: -1.0,
      name: "Die-Cut Reinforced Handle (J-Cut)",
      gripFeel: "Integrated Punch-Hole Grip",
      maxKg: 4.5,
      bestFor: "Modern minimalist fashion, exhibitions & flat-pack storage",
      enabled: true,
    },
    "Luxury Satin Ribbon": {
      costDelta: 4.5,
      name: "Luxury Satin Ribbon",
      gripFeel: "Silky Luster Smooth Tape",
      maxKg: 7.0,
      bestFor: "Cosmetics, perfumes, bridal gifts & confectionery boutiques",
      enabled: true,
    },
    "No Handles (Fold-Over)": {
      costDelta: -2.0,
      name: "No Handle / Fold-Over Sack",
      gripFeel: "Handless Roll-Down & Sticker",
      maxKg: 3.5,
      bestFor: "Roasted coffee bean bags, grain sacks & artisan bread loafs",
      enabled: true,
    },
  },
  print_rates: {
    "1-Color Soy Screenprint": {
      costDelta: 0.0,
      name: "1-Color Soy Screenprint",
      finishType: "Matte Organic Earth Ink",
      tactileBadge: "Eco-Friendly Water-Based",
      bestFor: "Clean minimalist typography, single logos & natural aesthetic",
      enabled: true,
    },
    "2-Color Traditional Tibeb": {
      costDelta: 2.5,
      name: "2-Color Traditional Ethiopian Tibeb",
      finishType: "Heritage Geometric Border",
      tactileBadge: "Dual-Pigment Cultural Accent",
      bestFor: "Ethiopian coffee roasters, traditional souvenirs & export packs",
      enabled: true,
    },
    "Full-Color Process (CMYK)": {
      costDelta: 4.0,
      name: "Full-Color CMYK Process",
      finishType: "High-Resolution Offset Print",
      tactileBadge: "Photographic Multi-Tone",
      bestFor: "Complex illustrations, promotional campaigns & vivid imagery",
      enabled: true,
    },
    "Gold / Copper Foil Stamping": {
      costDelta: 5.5,
      name: "Hot Metallic Foil Stamping (Gold/Bronze)",
      finishType: "Mirror Reflective Hot Foil",
      tactileBadge: "High-End Metallic Shimmer",
      bestFor: "Luxury boutiques, premium brand seals & exclusive packaging",
      enabled: true,
    },
    "Debossed / Embossed 3D Logo": {
      costDelta: 3.5,
      name: "Tactile Blind Debossing / Embossing",
      finishType: "3D Hydraulic Pressed Relief",
      tactileBadge: "Subtle Tactile 3D Impression",
      bestFor: "Sophisticated tactile branding, watermarks & understated luxury",
      enabled: true,
    },
    "Spot UV Gloss Coating": {
      costDelta: 3.0,
      name: "Spot UV Gloss Highlight",
      finishType: "Selective Liquid Gloss Lacquer",
      tactileBadge: "High-Gloss Contrast on Matte",
      bestFor: "Making brand logos pop with reflective sheen on dark kraft",
      enabled: true,
    },
  },
};

export const DEFAULT_STUDIO_CONFIG: StudioConfig = {
  headings: {
    badge: "Industrial Packaging Customizer & Dieline Studio",
    title: "Engineer Your Custom Eco-Kraft Packaging",
    subtitle: "Direct-to-factory specification dielines, ISO-certified tensile strengths, and real-time wholesale pricing for Ethiopian enterprises.",
    minOrderNotice: "Minimum custom production run: 500 pcs.",
    sampleProofNotice: "Physical pre-production dieline proofs available before mass press run.",
  },
  dimension_limits: {
    minWidth: 10,
    maxWidth: 60,
    minHeight: 10,
    maxHeight: 70,
    minGusset: 4,
    maxGusset: 30,
  },
  presets: [
    {
      id: "small-boutique",
      name: "Small Boutique / Gift",
      width: 20,
      height: 24,
      gusset: 8,
      description: "Cosmetics, perfumes, jewelry, pharmacy & accessories",
      category: "Boutique",
      enabled: true,
    },
    {
      id: "medium-retail",
      name: "Medium Retail Standard",
      width: 26,
      height: 32,
      gusset: 10,
      description: "Apparel, books, accessories, retail merchandise & gifts (Most Popular)",
      category: "Retail",
      enabled: true,
    },
    {
      id: "large-department",
      name: "Large Department / Fashion",
      width: 32,
      height: 40,
      gusset: 12,
      description: "Bulky fashion, shoe boxes, winter clothing & department retail",
      category: "Department",
      enabled: true,
    },
    {
      id: "coffee-gusset",
      name: "Specialty Coffee Gusset",
      width: 24,
      height: 28,
      gusset: 10,
      description: "250g / 500g / 1kg roasted coffee beans, tea & dry gourmet goods",
      category: "Coffee",
      enabled: true,
    },
    {
      id: "bakery-flat-bottom",
      name: "Bakery & Food Flat-Bottom",
      width: 26,
      height: 22,
      gusset: 16,
      description: "Pastry boxes, takeaway meal containers, cakes & bakery goods",
      category: "Bakery",
      enabled: true,
    },
  ],
  gsm_options: [
    {
      value: 160,
      label: "160 GSM Light Kraft",
      description: "Eco-lightweight, ideal for bakeries, pharmacies & light gift bags",
      baseCost: 15.0,
      maxKg: 2.5,
      feel: "Crisp & Flexible",
      gauge: "0.18 mm (2-Ply Fiber)",
      bestFor: "Bakeries, pharmacies, lightweight gift pouches & dry pastry",
      enabled: true,
    },
    {
      value: 180,
      label: "180 GSM Standard Kraft",
      description: "Durable everyday retail kraft bag, balanced weight & tear-resistance",
      baseCost: 17.5,
      maxKg: 5.0,
      feel: "Balanced Everyday Retail",
      gauge: "0.22 mm (3-Ply Fiber)",
      bestFor: "Boutique apparel, cosmetics, takeaway & souvenir bags",
      enabled: true,
    },
    {
      value: 220,
      label: "220 GSM Reinforced Kraft",
      description: "Heavyweight kraft for coffee roasters, apparel & premium retail",
      baseCost: 20.0,
      maxKg: 8.5,
      feel: "Substantial & Rigid Upright",
      gauge: "0.28 mm (4-Ply Heavyweight)",
      bestFor: "Coffee roasters, wine bottles, heavier garments & gift boxes",
      enabled: true,
    },
    {
      value: 250,
      label: "250 GSM Luxury Cardboard",
      description: "Rigid luxury matte board for high-end boutique & luxury gifts",
      baseCost: 24.0,
      maxKg: 12.0,
      feel: "Rigid Luxury Matte Board",
      gauge: "0.35 mm (Dense Solid Board)",
      bestFor: "High-end luxury jewelry, watches, corporate gifts & VIP sets",
      enabled: true,
    },
    {
      value: 280,
      label: "280 GSM Industrial Extra-Duty",
      description: "Maximum tensile strength for heavy gourmet goods & industrial items",
      baseCost: 27.5,
      maxKg: 16.0,
      feel: "Maximum Tensile Tear-Proof",
      gauge: "0.42 mm (Reinforced Multi-Ply)",
      bestFor: "Heavy gourmet honey/spice jars, export freight & hardware",
      enabled: true,
    },
  ],
  handle_options: [
    {
      id: "Twisted Kraft Cord",
      name: "Twisted Kraft Paper Cord",
      description: "100% recyclable kraft cord, classic retail look",
      costDelta: 0.0,
      gripFeel: "Firm 3-Ply Twisted Kraft",
      maxKg: 8.0,
      bestFor: "Classic sustainable retail, coffee shops & organic brands",
      enabled: true,
    },
    {
      id: "Woven Cotton Rope",
      name: "Woven Cotton Rope + Eyelets",
      description: "Soft luxurious grip with brass eyelet reinforcement",
      costDelta: 3.5,
      gripFeel: "Cushioned Tubular Cotton",
      maxKg: 12.0,
      bestFor: "Luxury fashion, VIP events & heavy executive shopping",
      enabled: true,
    },
    {
      id: "Flat-Fold Kraft",
      name: "Flat-Fold Kraft Handle",
      description: "Traditional grocery & bakery fold-in handle",
      costDelta: -0.5,
      gripFeel: "Wide Flat Fold-In Tape",
      maxKg: 6.0,
      bestFor: "Traditional grocery, supermarkets & takeaway food containers",
      enabled: true,
    },
    {
      id: "Die-Cut Oval Handle",
      name: "Die-Cut Reinforced Handle",
      description: "Sleek punch-hole handle, modern minimalist profile",
      costDelta: -1.0,
      gripFeel: "Integrated Punch-Hole Grip",
      maxKg: 4.5,
      bestFor: "Modern minimalist fashion, exhibitions & flat-pack storage",
      enabled: true,
    },
    {
      id: "Luxury Satin Ribbon",
      name: "Luxury Satin Ribbon",
      description: "Silky premium ribbon for cosmetics & bridal retail",
      costDelta: 4.5,
      gripFeel: "Silky Luster Smooth Tape",
      maxKg: 7.0,
      bestFor: "Cosmetics, perfumes, bridal gifts & confectionery boutiques",
      enabled: true,
    },
    {
      id: "No Handles (Fold-Over)",
      name: "No Handle / Fold-Over Sack",
      description: "Bakery sack or coffee roll-down pouch",
      costDelta: -2.0,
      gripFeel: "Handless Roll-Down & Sticker",
      maxKg: 3.5,
      bestFor: "Roasted coffee bean bags, grain sacks & artisan bread loafs",
      enabled: true,
    },
  ],
  print_options: [
    {
      id: "1-Color Soy Screenprint",
      name: "1-Color Soy Screenprint",
      description: "Minimalist eco-craft ink, sharp logo placement",
      costDelta: 0.0,
      finishType: "Matte Organic Earth Ink",
      tactileBadge: "Eco-Friendly Water-Based",
      bestFor: "Clean minimalist typography, single logos & natural aesthetic",
      enabled: true,
    },
    {
      id: "2-Color Traditional Tibeb",
      name: "2-Color Traditional Ethiopian Tibeb",
      description: "Heritage border patterns + company logo in dual inks",
      costDelta: 2.5,
      finishType: "Heritage Geometric Border",
      tactileBadge: "Dual-Pigment Cultural Accent",
      bestFor: "Ethiopian coffee roasters, traditional souvenirs & export packs",
      enabled: true,
    },
    {
      id: "Full-Color Process (CMYK)",
      name: "Full-Color CMYK Process",
      description: "Vibrant multi-colored photographic branding",
      costDelta: 4.0,
      finishType: "High-Resolution Offset Print",
      tactileBadge: "Photographic Multi-Tone",
      bestFor: "Complex illustrations, promotional campaigns & vivid imagery",
      enabled: true,
    },
    {
      id: "Gold / Copper Foil Stamping",
      name: "Hot Metallic Foil Stamping (Gold/Bronze)",
      description: "Luxurious reflective metallic foil logo & accents",
      costDelta: 5.5,
      finishType: "Mirror Reflective Hot Foil",
      tactileBadge: "High-End Metallic Shimmer",
      bestFor: "Luxury boutiques, premium brand seals & exclusive packaging",
      enabled: true,
    },
    {
      id: "Debossed / Embossed 3D Logo",
      name: "Tactile Blind Debossing / Embossing",
      description: "3D raised or recessed tactile impression without ink",
      costDelta: 3.5,
      finishType: "3D Hydraulic Pressed Relief",
      tactileBadge: "Subtle Tactile 3D Impression",
      bestFor: "Sophisticated tactile branding, watermarks & understated luxury",
      enabled: true,
    },
    {
      id: "Spot UV Gloss Coating",
      name: "Spot UV Gloss Highlight",
      description: "High-gloss protective coating over matte kraft",
      costDelta: 3.0,
      finishType: "Selective Liquid Gloss Lacquer",
      tactileBadge: "High-Gloss Contrast on Matte",
      bestFor: "Making brand logos pop with reflective sheen on dark kraft",
      enabled: true,
    },
  ],
  paper_colors: [
    {
      id: "Natural Brown Kraft",
      name: "Natural Brown Kraft",
      bgHex: "#C4A57B",
      borderHex: "#9C7E57",
      textClass: "text-[#5A412A]",
      surcharge: 0.0,
      enabled: true,
    },
    {
      id: "Bleached Pure White Kraft",
      name: "Bleached Pure White Kraft",
      bgHex: "#F5F3EF",
      borderHex: "#D8D4CC",
      textClass: "text-stone-800",
      surcharge: 1.5,
      enabled: true,
    },
    {
      id: "Charcoal Black Kraft",
      name: "Charcoal Black Kraft",
      bgHex: "#353432",
      borderHex: "#1E1E1E",
      textClass: "text-stone-100",
      surcharge: 2.0,
      enabled: true,
    },
  ],
  quantity_tiers: [
    {
      value: "500 pcs",
      count: 500,
      label: "500 pcs (Starter Batch)",
      unitMultiplier: 1.15,
      enabled: true,
    },
    {
      value: "1,000 pcs",
      count: 1000,
      label: "1,000 pcs (Standard Run)",
      discountBadge: "Most Popular",
      unitMultiplier: 1.0,
      enabled: true,
    },
    {
      value: "2,500 pcs",
      count: 2500,
      label: "2,500 pcs (Commercial Volume)",
      discountBadge: "8% Savings",
      unitMultiplier: 0.92,
      enabled: true,
    },
    {
      value: "5,000 pcs",
      count: 5000,
      label: "5,000 pcs (Wholesale Enterprise)",
      discountBadge: "15% Savings",
      unitMultiplier: 0.85,
      enabled: true,
    },
    {
      value: "10,000+ pcs",
      count: 10000,
      label: "10,000+ pcs (Industrial Scale)",
      discountBadge: "Direct Factory Tier",
      unitMultiplier: 0.78,
      enabled: true,
    },
  ],
  turnaround_options: [
    {
      id: "standard",
      label: "Standard Production",
      days: "7-10 Days",
      multiplier: 1.0,
      badge: "Standard",
      description: "Standard production & quality assurance cycle",
      enabled: true,
    },
    {
      id: "rush",
      label: "Priority Rush",
      days: "4-6 Days",
      multiplier: 1.15,
      badge: "+15% Rush Surcharge",
      description: "Priority queue placement & expedited finishing",
      enabled: true,
    },
    {
      id: "express",
      label: "Express Guild Fast-Track",
      days: "2-3 Days",
      multiplier: 1.30,
      badge: "+30% VIP Expedited",
      description: "Dedicated press line reservation for urgent events",
      enabled: true,
    },
  ],
};

/**
 * Safely merge user/database studio configuration with defaults, ensuring all keys exist.
 */
export function mergeStudioConfig(savedConfig?: any): StudioConfig {
  if (!savedConfig || typeof savedConfig !== "object") {
    return DEFAULT_STUDIO_CONFIG;
  }

  return {
    headings: {
      ...DEFAULT_STUDIO_CONFIG.headings,
      ...(savedConfig.headings || {}),
    },
    dimension_limits: {
      ...DEFAULT_STUDIO_CONFIG.dimension_limits,
      ...(savedConfig.dimension_limits || {}),
    },
    presets: Array.isArray(savedConfig.presets) && savedConfig.presets.length > 0
      ? savedConfig.presets
      : DEFAULT_STUDIO_CONFIG.presets,
    gsm_options: Array.isArray(savedConfig.gsm_options) && savedConfig.gsm_options.length > 0
      ? savedConfig.gsm_options
      : DEFAULT_STUDIO_CONFIG.gsm_options,
    handle_options: Array.isArray(savedConfig.handle_options) && savedConfig.handle_options.length > 0
      ? savedConfig.handle_options
      : DEFAULT_STUDIO_CONFIG.handle_options,
    print_options: Array.isArray(savedConfig.print_options) && savedConfig.print_options.length > 0
      ? savedConfig.print_options
      : DEFAULT_STUDIO_CONFIG.print_options,
    paper_colors: Array.isArray(savedConfig.paper_colors) && savedConfig.paper_colors.length > 0
      ? savedConfig.paper_colors
      : DEFAULT_STUDIO_CONFIG.paper_colors,
    quantity_tiers: Array.isArray(savedConfig.quantity_tiers) && savedConfig.quantity_tiers.length > 0
      ? savedConfig.quantity_tiers
      : DEFAULT_STUDIO_CONFIG.quantity_tiers,
    turnaround_options: Array.isArray(savedConfig.turnaround_options) && savedConfig.turnaround_options.length > 0
      ? savedConfig.turnaround_options
      : DEFAULT_STUDIO_CONFIG.turnaround_options,
  };
}

/**
 * Derive backward-compatible DesignPricingConfig from StudioConfig.
 */
export function extractDesignPricing(studio: StudioConfig): DesignPricingConfig {
  const gsm_rates: Record<string, GsmTierConfig> = {};
  for (const opt of studio.gsm_options) {
    gsm_rates[String(opt.value)] = {
      baseCost: opt.baseCost,
      label: opt.label,
      maxKg: opt.maxKg,
      feel: opt.feel,
      gauge: opt.gauge,
      bestFor: opt.bestFor,
      enabled: opt.enabled !== false,
    };
  }

  const handle_rates: Record<string, HandleTierConfig> = {};
  for (const opt of studio.handle_options) {
    handle_rates[opt.id] = {
      costDelta: opt.costDelta,
      name: opt.name,
      gripFeel: opt.gripFeel,
      maxKg: opt.maxKg,
      bestFor: opt.bestFor,
      enabled: opt.enabled !== false,
    };
  }

  const print_rates: Record<string, PrintTierConfig> = {};
  for (const opt of studio.print_options) {
    print_rates[opt.id] = {
      costDelta: opt.costDelta,
      name: opt.name,
      finishType: opt.finishType,
      tactileBadge: opt.tactileBadge,
      bestFor: opt.bestFor,
      enabled: opt.enabled !== false,
    };
  }

  return { gsm_rates, handle_rates, print_rates };
}
