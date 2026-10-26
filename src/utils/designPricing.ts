export interface GsmTierConfig {
  baseCost: number;
  label: string;
  maxKg: number;
  feel: string;
  gauge: string;
  bestFor: string;
}

export interface HandleTierConfig {
  costDelta: number;
  name: string;
  gripFeel: string;
  maxKg: number;
  bestFor: string;
}

export interface PrintTierConfig {
  costDelta: number;
  name: string;
  finishType: string;
  tactileBadge: string;
  bestFor: string;
}

export interface DesignPricingConfig {
  gsm_rates: Record<string, GsmTierConfig>;
  handle_rates: Record<string, HandleTierConfig>;
  print_rates: Record<string, PrintTierConfig>;
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
    },
    "180": {
      baseCost: 17.5,
      label: "180 GSM Standard Kraft",
      maxKg: 5.0,
      feel: "Balanced Everyday Retail",
      gauge: "0.22 mm (3-Ply Fiber)",
      bestFor: "Boutique apparel, cosmetics, takeaway & souvenir bags",
    },
    "220": {
      baseCost: 20.0,
      label: "220 GSM Reinforced Kraft",
      maxKg: 8.5,
      feel: "Substantial & Rigid Upright",
      gauge: "0.28 mm (4-Ply Heavyweight)",
      bestFor: "Coffee roasters, wine bottles, heavier garments & gift boxes",
    },
    "250": {
      baseCost: 24.0,
      label: "250 GSM Luxury Cardboard",
      maxKg: 12.0,
      feel: "Rigid Luxury Matte Board",
      gauge: "0.35 mm (Dense Solid Board)",
      bestFor: "High-end luxury jewelry, watches, corporate gifts & VIP sets",
    },
    "280": {
      baseCost: 27.5,
      label: "280 GSM Industrial Extra-Duty",
      maxKg: 16.0,
      feel: "Maximum Tensile Tear-Proof",
      gauge: "0.42 mm (Reinforced Multi-Ply)",
      bestFor: "Heavy gourmet honey/spice jars, export freight & hardware",
    },
  },
  handle_rates: {
    "Twisted Kraft Cord": {
      costDelta: 0.0,
      name: "Twisted Kraft Paper Cord",
      gripFeel: "Firm 3-Ply Twisted Kraft",
      maxKg: 8.0,
      bestFor: "Classic sustainable retail, coffee shops & organic brands",
    },
    "Woven Cotton Rope": {
      costDelta: 3.5,
      name: "Woven Cotton Rope + Brass Eyelets",
      gripFeel: "Cushioned Tubular Cotton",
      maxKg: 12.0,
      bestFor: "Luxury fashion, VIP events & heavy executive shopping",
    },
    "Flat-Fold Kraft": {
      costDelta: -0.5,
      name: "Flat-Fold Kraft Handle",
      gripFeel: "Wide Flat Fold-In Tape",
      maxKg: 6.0,
      bestFor: "Traditional grocery, supermarkets & takeaway food containers",
    },
    "Die-Cut Oval Handle": {
      costDelta: -1.0,
      name: "Die-Cut Reinforced Handle (J-Cut)",
      gripFeel: "Integrated Punch-Hole Grip",
      maxKg: 4.5,
      bestFor: "Modern minimalist fashion, exhibitions & flat-pack storage",
    },
    "Luxury Satin Ribbon": {
      costDelta: 4.5,
      name: "Luxury Satin Ribbon",
      gripFeel: "Silky Luster Smooth Tape",
      maxKg: 7.0,
      bestFor: "Cosmetics, perfumes, bridal gifts & confectionery boutiques",
    },
    "No Handles (Fold-Over)": {
      costDelta: -2.0,
      name: "No Handle / Fold-Over Sack",
      gripFeel: "Handless Roll-Down & Sticker",
      maxKg: 3.5,
      bestFor: "Roasted coffee bean bags, grain sacks & artisan bread loafs",
    },
  },
  print_rates: {
    "1-Color Soy Screenprint": {
      costDelta: 0.0,
      name: "1-Color Soy Screenprint",
      finishType: "Matte Organic Earth Ink",
      tactileBadge: "Eco-Friendly Water-Based",
      bestFor: "Clean minimalist typography, single logos & natural aesthetic",
    },
    "2-Color Traditional Tibeb": {
      costDelta: 2.5,
      name: "2-Color Traditional Ethiopian Tibeb",
      finishType: "Heritage Geometric Border",
      tactileBadge: "Dual-Pigment Cultural Accent",
      bestFor: "Ethiopian coffee roasters, traditional souvenirs & export packs",
    },
    "Full-Color Process (CMYK)": {
      costDelta: 4.0,
      name: "Full-Color CMYK Process",
      finishType: "High-Resolution Offset Print",
      tactileBadge: "Photographic Multi-Tone",
      bestFor: "Complex illustrations, promotional campaigns & vivid imagery",
    },
    "Gold / Copper Foil Stamping": {
      costDelta: 5.5,
      name: "Hot Metallic Foil Stamping (Gold/Bronze)",
      finishType: "Mirror Reflective Hot Foil",
      tactileBadge: "High-End Metallic Shimmer",
      bestFor: "Luxury boutiques, premium brand seals & exclusive packaging",
    },
    "Debossed / Embossed 3D Logo": {
      costDelta: 3.5,
      name: "Tactile Blind Debossing / Embossing",
      finishType: "3D Hydraulic Pressed Relief",
      tactileBadge: "Subtle Tactile 3D Impression",
      bestFor: "Sophisticated tactile branding, watermarks & understated luxury",
    },
    "Spot UV Gloss Coating": {
      costDelta: 3.0,
      name: "Spot UV Gloss Highlight",
      finishType: "Selective Liquid Gloss Lacquer",
      tactileBadge: "High-Gloss Contrast on Matte",
      bestFor: "Making brand logos pop with reflective sheen on dark kraft",
    },
  },
};
