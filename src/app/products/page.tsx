"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck,
  Eye,
  X,
  Package,
  ChevronLeft,
  ChevronRight,
  PenTool,
  ImageOff
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface Product {
  id: string;
  name: string;
  client?: string;
  category: string;
  price: number;
  bundleSize?: number;
  gsm?: number;
  handleType?: string;
  image: string;
  gallery: string[];
  badge?: string;
  description: string;
  dimensions?: string;
  material?: string;
  is_available?: boolean;
  is_featured?: boolean;
  is_client_work?: boolean;
  stock_quantity?: number | null;
}

export default function ProductsPage() {
  const { t } = useLanguage();
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxProduct, setLightboxProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/products?${params.toString()}`);
      const resJson = await res.json();
      if (res.ok && resJson.products) {
        const mappedProducts: Product[] = (resJson.products as any[]).map((p) => {
          const gallery = p.images && p.images.length > 0 ? p.images : (p.image_urls || ["/images/photo_6_2026-09-05_00-36-03.jpg"]);
          return {
            id: p.id,
            name: p.name,
            client: p.client || undefined,
            category: p.category || "Packaging",
            price: Number(p.price),
            bundleSize: p.bundle_size || 100,
            gsm: p.gsm || 200,
            handleType: p.handle_type || "Twisted Kraft Cord",
            image: gallery[0],
            gallery,
            badge: p.is_client_work ? "Client Portfolio" : (p.is_featured ? "Featured" : "Catalog"),
            description: p.description || "",
            dimensions: p.dimensions || "Standard Dimensions",
            material: p.material || "100% Ethiopian Virgin Kraft",
            is_available: p.is_available,
            is_featured: p.is_featured,
            is_client_work: Boolean(p.is_client_work),
            stock_quantity: p.stock_quantity,
          };
        });

        if (resJson.categories && Array.isArray(resJson.categories) && resJson.categories.length > 0) {
          setCategories(resJson.categories);
        }

        setProductsList(mappedProducts);
        setTotalCount(resJson.totalCount ?? mappedProducts.length);
      } else {
        setProductsList([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Failed to load products from API:", err);
      setProductsList([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[#F9F6F0]">
      
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#F2ECE1] to-[#F9F6F0] border-b border-stone-200/80 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold tracking-widest text-[#8C4B31] uppercase flex items-center gap-1.5 mb-2">
              <Sparkles size={14} /> {t.catalog_badge}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight">
              {t.catalog_heading}
            </h1>
            <p className="text-stone-600 text-lg mt-4 leading-relaxed">
              {t.catalog_subheading}
            </p>
          </div>

          {/* Custom Order CTA */}
          <div className="mt-8 bg-white p-5 rounded-2xl border border-stone-300/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#1E3B2E]/10 text-[#1E3B2E]">
                <PenTool size={22} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#1E3B2E]">{t.catalog_cta_label}</p>
                <p className="text-xs text-stone-600">Inspired by what you see? Submit your design or describe your vision — we manufacture your custom batch.</p>
              </div>
            </div>
            <Link 
              href="/design-submission" 
              className="bg-[#1E3B2E] text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-[#8C4B31] transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>{t.catalog_cta_btn}</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-8 w-full">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#1E3B2E] text-[#E0B382] shadow-sm"
                    : "bg-white text-stone-600 hover:bg-stone-200/70 border border-stone-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-64 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
            <input
              type="text"
              placeholder={t.catalog_search_placeholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-stone-200 rounded-full pl-9 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]/20"
            />
          </div>
        </div>

        {/* Results Counter */}
        <div className="py-4 text-xs font-medium text-stone-500 flex items-center justify-between">
          <span>
            Showing <strong className="text-stone-900">{productsList.length}</strong> of{" "}
            <strong className="text-stone-900">{totalCount}</strong> portfolio pieces
          </span>
          {selectedCategory !== "All" && (
            <span className="text-[11px] bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full font-bold">
              {selectedCategory}
            </span>
          )}
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-2">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 border border-stone-200 animate-pulse flex flex-col">
                <div className="h-64 bg-stone-200 rounded-2xl mb-5" />
                <div className="h-4 bg-stone-200 rounded w-1/3 mb-2" />
                <div className="h-6 bg-stone-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-stone-200 rounded w-full mb-1" />
                <div className="h-4 bg-stone-200 rounded w-2/3" />
              </div>
            ))
          ) : productsList.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-stone-200 p-8">
              <Package size={40} className="mx-auto text-stone-300 mb-3" />
              <h3 className="font-serif text-xl font-bold text-stone-800 mb-1">{t.catalog_empty}</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                Try selecting &ldquo;All&rdquo; or clearing your search term.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="px-5 py-2 rounded-full bg-[#1E3B2E] text-[#E0B382] text-xs font-bold cursor-pointer"
              >
                {t.catalog_reset}
              </button>
            </div>
          ) : (
            productsList.map((product) => (
              <div 
                key={product.id}
                className="group bg-white rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Image */}
                <div className="h-64 bg-stone-100 relative overflow-hidden">
                  {product.image ? (
                    <img 
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff size={40} className="text-stone-300" />
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  
                  {/* Badge */}
                  <span className={`absolute top-3 left-3 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm ${
                    product.is_client_work ? "bg-[#8C4B31]" : "bg-[#1E3B2E]"
                  }`}>
                    {product.badge}
                  </span>

                  {/* Quick Preview */}
                  <button
                    onClick={() => setLightboxProduct(product)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-stone-800 hover:bg-white hover:text-[#8C4B31] transition-all opacity-0 group-hover:opacity-100 shadow-md cursor-pointer"
                    title="Quick preview"
                  >
                    <Eye size={15} />
                  </button>

                  {/* Client name at bottom */}
                  {product.client && (
                    <span className="absolute bottom-3 left-3 text-white text-xs font-semibold drop-shadow-sm truncate max-w-[85%]">
                      {product.client}
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      {product.category}
                    </span>
                    {product.gsm && (
                      <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                        {product.gsm} GSM
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-[#8C4B31] transition-colors line-clamp-1 mb-2">
                    {product.name}
                  </h3>

                  <p className="text-stone-600 text-xs line-clamp-2 leading-relaxed flex-1">
                    {product.description || "Premium Ethiopian recycled kraft packaging crafted with durability and precision."}
                  </p>

                  {/* Specs row */}
                  <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <ShieldCheck size={13} className="text-[#1E3B2E]" />
                      <span>{product.material?.split(" ").slice(0, 3).join(" ") || "Ethiopian Kraft"}</span>
                    </div>

                    <Link 
                      href={`/products/${product.id}`}
                      className="px-4 py-2 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <span>View Details</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 pt-6 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
            <div>
              Page <strong className="text-stone-900">{page}</strong> of <strong className="text-stone-900">{totalPages}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 disabled:opacity-40 disabled:cursor-not-allowed font-semibold cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 bg-[#1E3B2E] rounded-3xl p-8 sm:p-10 text-center">
          <span className="text-xs font-bold tracking-widest text-[#E0B382] uppercase">Ready to Order?</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-2 mb-3">
            {t.catalog_bottom_heading}
          </h2>
          <p className="text-stone-400 text-sm max-w-xl mx-auto mb-6 leading-relaxed">
            {t.catalog_bottom_sub}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/design-submission"
              className="px-8 py-3.5 rounded-full bg-[#8C4B31] hover:bg-[#A3593B] text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2"
            >
              <PenTool size={15} />
              <span>{t.catalog_submit_design}</span>
            </Link>
            <Link
              href="/learn/schedule"
              className="px-8 py-3.5 rounded-full border border-stone-600 hover:border-stone-400 text-stone-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2"
            >
              <span>{t.catalog_workshops}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setLightboxProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-1/2 h-72 rounded-2xl overflow-hidden bg-stone-100">
                <img
                  src={lightboxProduct.image}
                  alt={lightboxProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full sm:w-1/2 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31] bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-2">
                    {lightboxProduct.category}
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-stone-900 leading-tight">
                    {lightboxProduct.name}
                  </h3>
                  {lightboxProduct.client && (
                    <p className="text-xs text-stone-500 mt-1">Made for: <strong className="text-stone-700">{lightboxProduct.client}</strong></p>
                  )}
                  <p className="text-stone-600 text-xs mt-3 leading-relaxed">
                    {lightboxProduct.description || "Manufactured with pride in Addis Ababa, Ethiopia using heavy-duty biodegradable kraft."}
                  </p>

                  {/* Quick specs */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                    {lightboxProduct.gsm && (
                      <div className="bg-stone-50 rounded-lg p-2 border border-stone-100">
                        <span className="text-stone-400 block">Paper weight</span>
                        <span className="font-bold text-stone-800">{lightboxProduct.gsm} GSM</span>
                      </div>
                    )}
                    {lightboxProduct.handleType && (
                      <div className="bg-stone-50 rounded-lg p-2 border border-stone-100">
                        <span className="text-stone-400 block">Handle</span>
                        <span className="font-bold text-stone-800">{lightboxProduct.handleType}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3 mt-4">
                  <button
                    onClick={() => setLightboxProduct(null)}
                    className="px-4 py-2 rounded-full text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Close
                  </button>
                  <Link
                    href={`/products/${lightboxProduct.id}`}
                    className="px-5 py-2.5 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors"
                  >
                    Full Details →
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
