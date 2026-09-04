"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Package, 
  Search, 
  Filter, 
  ArrowRight, 
  Sparkles, 
  Check, 
  SlidersHorizontal, 
  ShieldCheck,
  Tag,
  Eye,
  X,
  ShoppingBag,
  ExternalLink
} from "lucide-react";

export interface Product {
  id: string;
  name: string;
  client: string;
  category: string;
  price: number;
  bundleSize: number;
  gsm: number;
  handleType: string;
  image: string;
  gallery: string[];
  badge?: string;
  description: string;
  dimensions: string;
  material: string;
}

export const PRODUCTS_CATALOG: Product[] = [
  {
    id: "1",
    name: "Rare Specialty Coffee Roasters Bag",
    client: "Rare Coffee Roastery (Roasted in Ethiopia)",
    category: "Coffee & Food",
    price: 180,
    bundleSize: 100,
    gsm: 220,
    handleType: "Twisted Black Cord",
    image: "/images/photo_6_2026-09-05_00-36-03.jpg",
    gallery: [
      "/images/photo_6_2026-09-05_00-36-03.jpg",
      "/images/photo_13_2026-09-05_00-36-03.jpg"
    ],
    badge: "Coffee Roasters Choice",
    description: "Signature unbleached kraft carrier bag crafted for Ethiopian specialty coffee roasters. Features custom typography, aroma seal capability, and high-tensile black twisted cord handles.",
    dimensions: "24cm × 28cm + 10cm gusset",
    material: "100% Ethiopian Virgin Kraft",
  },
  {
    id: "2",
    name: "Richo's Luxury Boutique Tote with Tibeb Border",
    client: "Richo's Clothing Boutique",
    category: "Luxury Retail",
    price: 260,
    bundleSize: 100,
    gsm: 250,
    handleType: "Woven Cotton Rope",
    image: "/images/photo_3_2026-09-05_00-36-02.jpg",
    gallery: [
      "/images/photo_3_2026-09-05_00-36-02.jpg",
      "/images/photo_4_2026-09-05_00-36-02.jpg"
    ],
    badge: "Bestseller",
    description: "Premium white coated luxury retail bag featuring traditional Ethiopian Tibeb geometric pattern border, reinforced bottom card, and durable black braided rope handles for fashion boutiques.",
    dimensions: "32cm × 36cm + 12cm gusset",
    material: "250 GSM Bleached Matte Kraft",
  },
  {
    id: "3",
    name: "Hassan Adama Luxury Fashion Shopper",
    client: "Hassan Adama Boutique",
    category: "Luxury Retail",
    price: 250,
    bundleSize: 100,
    gsm: 240,
    handleType: "Braided Black Cord",
    image: "/images/photo_4_2026-09-05_00-36-02.jpg",
    gallery: [
      "/images/photo_4_2026-09-05_00-36-02.jpg",
      "/images/photo_3_2026-09-05_00-36-02.jpg"
    ],
    badge: "VIP Boutique",
    description: "Clean, elegant typography with custom monogram emblem. Manufactured with rigid sidewalls and reinforced handle eyelets for suits, dresses, and footwear.",
    dimensions: "30cm × 34cm + 12cm gusset",
    material: "240 GSM Coated White Kraft",
  },
  {
    id: "4",
    name: "Liora Fashion Store Carrier",
    client: "Liora Fashion Store",
    category: "Standard Retail",
    price: 160,
    bundleSize: 100,
    gsm: 180,
    handleType: "Twisted Black Cord",
    image: "/images/photo_13_2026-09-05_00-36-03.jpg",
    gallery: [
      "/images/photo_13_2026-09-05_00-36-03.jpg",
      "/images/photo_6_2026-09-05_00-36-03.jpg"
    ],
    badge: "High Durability",
    description: "Natural earth brown kraft bag printed with clean modern branding and social tags. Perfect for everyday retail, cosmetics, and lifestyle brands.",
    dimensions: "22cm × 28cm + 10cm gusset",
    material: "180 GSM Recycled Earth Kraft",
  },
  {
    id: "5",
    name: "Family Dental Clinic Medical Luxury Carrier",
    client: "Family Specialized Dental Clinic",
    category: "Healthcare & Corporate",
    price: 220,
    bundleSize: 100,
    gsm: 200,
    handleType: "Twisted Black Rope",
    image: "/images/photo_10_2026-09-05_00-36-03.jpg",
    gallery: [
      "/images/photo_10_2026-09-05_00-36-03.jpg",
      "/images/photo_7_2026-09-05_00-36-03.jpg"
    ],
    badge: "Medical & Gift",
    description: "Crisp white clinic presentation bag with two-tone cyan and navy corporate print. Used for patient care kits, pharmaceutical giveaways, and executive gifts.",
    dimensions: "25cm × 25cm + 10cm gusset",
    material: "200 GSM Heavy Bleached Kraft",
  },
  {
    id: "6",
    name: "Véro Tiramisù Artisan Sleeve Box",
    client: "Véro Tiramisù & Confectionery",
    category: "Confectionery & Bakery",
    price: 190,
    bundleSize: 50,
    gsm: 320,
    handleType: "Slide-Out Rigid Sleeve",
    image: "/images/photo_16_2026-09-05_00-36-03.jpg",
    gallery: [
      "/images/photo_16_2026-09-05_00-36-03.jpg",
      "/images/photo_14_2026-09-05_00-36-03.jpg",
      "/images/photo_18_2026-09-05_00-36-03.jpg"
    ],
    badge: "Custom Rigid Box",
    description: "Luxury confectionery matchbox-style slide sleeve with rich cocoa brown and gold ink printing. Engineered for refrigerated Italian desserts, pastries, and chocolates.",
    dimensions: "18cm × 8cm × 5cm sleeve",
    material: "320 GSM Food-Safe Rigid Boxboard",
  },
  {
    id: "7",
    name: "Véro Artisan Tall Pastry Pouch",
    client: "Véro Tiramisù & Bakery",
    category: "Coffee & Food",
    price: 120,
    bundleSize: 100,
    gsm: 90,
    handleType: "Gusset Flat Fold",
    image: "/images/photo_9_2026-09-05_00-36-03.jpg",
    gallery: [
      "/images/photo_9_2026-09-05_00-36-03.jpg",
      "/images/photo_11_2026-09-05_00-36-03.jpg"
    ],
    badge: "Greaseproof Food Safe",
    description: "Tall stand-up white bakery pouch with gold foil lettering. Breathable and oil-resistant for fresh sourdough, brioche, and Ethiopian pastries.",
    dimensions: "15cm × 32cm + 8cm gusset",
    material: "90 GSM Grease-Resistant Virgin Paper",
  },
  {
    id: "8",
    name: "Caneth Hotel Hospitality Carrier",
    client: "Caneth Hotel / Rift Valley Hotel PLC",
    category: "Hotels & Hospitality",
    price: 170,
    bundleSize: 100,
    gsm: 190,
    handleType: "Knotted Charcoal Cord",
    image: "/images/photo_5_2026-09-05_00-36-02.jpg",
    gallery: [
      "/images/photo_5_2026-09-05_00-36-02.jpg",
      "/images/photo_8_2026-09-05_00-36-03.jpg"
    ],
    badge: "Hospitality Standard",
    description: "Custom hotel amenity and laundry bag manufactured for Rift Valley Hotel PLC with bilingual English and Amharic screen printing.",
    dimensions: "26cm × 30cm + 10cm gusset",
    material: "190 GSM Unbleached Virgin Kraft",
  },
  {
    id: "9",
    name: "Laaguujii Taarikee Lounge Bulk Sacks",
    client: "Laaguujii Taarikee Hotel & Lounge",
    category: "Hotels & Hospitality",
    price: 150,
    bundleSize: 100,
    gsm: 180,
    handleType: "Gray Twisted Cord",
    image: "/images/photo_8_2026-09-05_00-36-03.jpg",
    gallery: [
      "/images/photo_8_2026-09-05_00-36-03.jpg",
      "/images/photo_5_2026-09-05_00-36-02.jpg"
    ],
    badge: "Bulk Order Tier",
    description: "Produced in large factory volumes for restaurant takeaway, hotel lounges, and events. Reinforced side gussets and uniform screen printed branding.",
    dimensions: "24cm × 30cm + 11cm gusset",
    material: "180 GSM Ethiopian Kraft",
  },
  {
    id: "10",
    name: "Cheru Medhanealem Grocery Carrier with Red Handles",
    client: "Cheru Medhanealem Butchery & Grocery",
    category: "Standard Retail",
    price: 165,
    bundleSize: 100,
    gsm: 200,
    handleType: "Vibrant Red Twisted Cord",
    image: "/images/photo_1_2026-09-05_00-36-02.jpg",
    gallery: [
      "/images/photo_1_2026-09-05_00-36-02.jpg",
      "/images/photo_2_2026-09-05_00-36-02.jpg"
    ],
    badge: "Heavy Tensile",
    description: "Heavy-duty shopping bag tested for meat, provisions, and dry goods. Features eye-catching red twisted handles and Amharic brand typography.",
    dimensions: "26cm × 32cm + 12cm gusset",
    material: "200 GSM Reinforced Kraft",
  },
];

const CATEGORIES = [
  "All", 
  "Coffee & Food", 
  "Luxury Retail", 
  "Standard Retail", 
  "Confectionery & Bakery", 
  "Hotels & Hospitality",
  "Healthcare & Corporate"
];

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high">("featured");
  const [lightboxProduct, setLightboxProduct] = useState<Product | null>(null);

  const filteredProducts = PRODUCTS_CATALOG.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    return 0;
  });

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[#F9F6F0]">
      
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#F2ECE1] to-[#F9F6F0] border-b border-stone-200/80 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold tracking-widest text-[#8C4B31] uppercase flex items-center gap-1.5 mb-2">
              <Sparkles size={14} /> 100% Real Production Batches • Made in Ethiopia
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight">
              Our Products & Manufacturing Catalog
            </h1>
            <p className="text-stone-600 text-lg mt-4 leading-relaxed">
              Explore authentic paper bags and packaging manufactured at our Addis Ababa facility for top Ethiopian coffee roasters, boutique fashion houses, hotels, and bakeries.
            </p>
          </div>

          {/* Wholesale & Custom Notice Banner */}
          <div className="mt-8 bg-white p-5 rounded-2xl border border-stone-300/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1E3B2E]/10 text-[#1E3B2E]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#1E3B2E]">Custom Brand Printing Available</p>
                <p className="text-xs text-stone-600">Want your own logo and colors? Use our interactive Design Studio or upload your vector artwork.</p>
              </div>
            </div>
            <Link 
              href="/design-submission" 
              className="bg-[#1E3B2E] text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-[#8C4B31] transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>Design Your Own Bag</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-8 w-full">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          
          {/* Categories Pill Nav */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? "bg-[#1E3B2E] text-white shadow-sm"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search bags, clients, GSM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-stone-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 focus:border-[#8C4B31]"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-stone-300 rounded-full focus:outline-none text-stone-700 cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

        </div>

        {/* Results Counter */}
        <div className="pt-4 pb-8 flex items-center justify-between text-xs text-stone-500 font-medium">
          <span>Showing {filteredProducts.length} authentic Ethiopian packaging models</span>
          <span className="text-[#8C4B31] font-semibold">Click &ldquo;Quick View&rdquo; to see full-resolution photo</span>
        </div>

        {/* Products Grid with REAL PHOTOGRAPHS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="group bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Real Photograph Thumbnail */}
                <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Badge */}
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-[#1E3B2E] text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.8 rounded-full shadow-sm">
                      {product.badge}
                    </span>
                  )}

                  {/* Quick View Button on Hover */}
                  <button
                    onClick={() => setLightboxProduct(product)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-[2px]"
                  >
                    <Eye size={16} />
                    <span>Quick View Photo</span>
                  </button>

                  <span className="absolute bottom-2 right-2 text-[10px] text-stone-900 font-mono font-bold bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
                    {product.gsm} GSM
                  </span>
                </div>

                {/* Card Details */}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">
                      {product.category}
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      {product.handleType}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-[#8C4B31] transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  
                  <p className="text-xs font-semibold text-stone-700 mt-0.5">
                    Client: {product.client}
                  </p>

                  <p className="text-stone-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 flex justify-between items-center">
                    <span>Size: {product.dimensions}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Price and Order Link */}
              <div className="px-5 pb-5 pt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 block">Bundle of {product.bundleSize}</span>
                  <p className="font-serif text-xl font-bold text-[#8C4B31]">
                    {product.price} <span className="text-xs font-sans text-stone-600 font-semibold">ETB</span>
                  </p>
                </div>
                
                <Link
                  href={`/products/${product.id}`}
                  className="px-4 py-2 rounded-full bg-[#1E3B2E] text-white hover:bg-[#8C4B31] transition-colors text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <span>Order</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* Lightbox / High-Resolution "Nice View" Modal */}
      {lightboxProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative animate-in fade-in zoom-in-95">
            
            <button
              onClick={() => setLightboxProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700"
            >
              <X size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Large Photograph */}
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-stone-100 relative shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxProduct.image}
                  alt={lightboxProduct.name}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold">
                  Verified Arenguade Production
                </div>
              </div>

              {/* Product Info & Order CTA */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">
                    {lightboxProduct.category}
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                    {lightboxProduct.name}
                  </h2>
                  <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md inline-block mt-2">
                    Client: {lightboxProduct.client}
                  </p>
                </div>

                <p className="text-stone-600 text-xs leading-relaxed">
                  {lightboxProduct.description}
                </p>

                <div className="space-y-2 p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Dimensions:</span>
                    <span className="font-bold text-stone-900">{lightboxProduct.dimensions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Material & Grammage:</span>
                    <span className="font-bold text-stone-900">{lightboxProduct.gsm} GSM • {lightboxProduct.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Handle Specification:</span>
                    <span className="font-bold text-stone-900">{lightboxProduct.handleType}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-stone-200 text-sm">
                    <span className="font-bold text-stone-800">Price per Bundle (100):</span>
                    <span className="font-serif font-bold text-[#8C4B31]">{lightboxProduct.price} ETB</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link
                    href={`/products/${lightboxProduct.id}`}
                    className="flex-1 bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <ShoppingBag size={15} />
                    <span>Order This Model</span>
                  </Link>

                  <Link
                    href="/design-submission"
                    className="px-5 py-3.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors text-center"
                  >
                    Customize Design
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
