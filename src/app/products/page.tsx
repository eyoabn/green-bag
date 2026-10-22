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
  ShoppingBag,
  Package,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { useCurrency } from "@/components/CurrencyContext";
import { useCart } from "@/context/CartContext";

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
  stock_quantity?: number | null;
}

export default function ProductsPage() {
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high">("featured");
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
            client: p.client || "Arenguade Standard Catalog",
            category: p.category || "Packaging",
            price: Number(p.price),
            bundleSize: p.bundle_size || 100,
            gsm: p.gsm || 200,
            handleType: p.handle_type || "Twisted Kraft Cord",
            image: gallery[0],
            gallery,
            badge: p.is_featured ? "Featured Selection" : (p.is_available ? "In Stock" : "Made-to-Order"),
            description: p.description || "",
            dimensions: p.dimensions || "Standard Retail Dimensions",
            material: p.material || "100% Ethiopian Virgin Kraft",
            is_available: p.is_available,
            is_featured: p.is_featured,
            stock_quantity: p.stock_quantity,
          };
        });

        // Client sort within the page if needed
        if (sortBy === "price-low") {
          mappedProducts.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-high") {
          mappedProducts.sort((a, b) => b.price - a.price);
        }

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
  }, [page, pageSize, selectedCategory, searchQuery, sortBy]);

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
              <Sparkles size={14} /> 100% Real Production Batches • Made in Ethiopia
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 tracking-tight">
              Our Packaging Catalog & Factory Portfolio
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

          {/* Search Input & Sort Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-white border border-stone-200 rounded-full pl-9 pr-4 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]/20"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-stone-200 rounded-full px-4 py-2 text-xs font-semibold text-stone-700 cursor-pointer focus:outline-none"
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="py-4 text-xs font-medium text-stone-500 flex items-center justify-between">
          <span>
            Showing <strong className="text-stone-900">{productsList.length}</strong> of{" "}
            <strong className="text-stone-900">{totalCount}</strong> products in catalog
          </span>
          {selectedCategory !== "All" && (
            <span className="text-[11px] bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full font-bold">
              Filtered by: {selectedCategory}
            </span>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-2">
          {loading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 border border-stone-200 animate-pulse flex flex-col justify-between">
                <div>
                  <div className="h-64 bg-stone-200 rounded-2xl mb-5" />
                  <div className="h-4 bg-stone-200 rounded w-1/3 mb-2" />
                  <div className="h-6 bg-stone-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-stone-200 rounded w-full mb-1" />
                  <div className="h-4 bg-stone-200 rounded w-2/3" />
                </div>
                <div className="pt-6 mt-6 border-t border-stone-100 flex justify-between items-center">
                  <div className="h-6 bg-stone-200 rounded w-20" />
                  <div className="h-8 bg-stone-200 rounded-full w-24" />
                </div>
              </div>
            ))
          ) : productsList.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-stone-200 p-8">
              <Package size={40} className="mx-auto text-stone-300 mb-3" />
              <h3 className="font-serif text-xl font-bold text-stone-800 mb-1">No products found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                We couldn&apos;t find any packaging matching your filters. Try selecting &ldquo;All&rdquo; or clearing your search term.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="px-5 py-2 rounded-full bg-[#1E3B2E] text-[#E0B382] text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            productsList.map((product) => (
              <div 
                key={product.id}
                className="group bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  {/* Image Container with Preview Button */}
                  <div className="h-64 rounded-2xl bg-stone-100 relative overflow-hidden mb-5 group-hover:scale-[1.01] transition-transform duration-300">
                    <img 
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                    
                    {/* Badge */}
                    <span className="absolute top-3 left-3 bg-[#1E3B2E] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                      {product.badge}
                    </span>

                    {/* Quick Lightbox Preview Trigger */}
                    <button
                      onClick={() => setLightboxProduct(product)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-stone-800 hover:bg-white hover:text-[#8C4B31] transition-all opacity-0 group-hover:opacity-100 shadow-md cursor-pointer"
                      title="Inspect Product Gallery"
                    >
                      <Eye size={15} />
                    </button>

                    <span className="absolute bottom-3 left-3 text-white text-xs font-semibold drop-shadow-sm truncate max-w-[85%]">
                      {product.client || product.category}
                    </span>
                  </div>

                  {/* Specifications & Title */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      {product.category}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {product.is_available ? "In Stock" : "Unavailable"}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-[#8C4B31] transition-colors line-clamp-1">
                    {product.name}
                  </h3>

                  <p className="text-stone-600 text-xs mt-2 line-clamp-2 leading-relaxed">
                    {product.description || "Premium Ethiopian recycled kraft packaging crafted with durability and precision."}
                  </p>
                </div>

                {/* Card Action Footer */}
                <div className="pt-5 mt-5 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-stone-500 block">Single Batch</span>
                    <span className="text-lg font-bold text-[#8C4B31] font-mono">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!product.is_available}
                      onClick={(e) => {
                        e.preventDefault();
                        addItem({
                          id: product.id,
                          productId: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                          category: product.category,
                          bundleSize: product.bundleSize,
                        }, 1);
                      }}
                      className="p-2.5 rounded-full border border-stone-300 hover:border-[#1E3B2E] text-stone-700 hover:text-[#1E3B2E] bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Add to Cart"
                      aria-label="Add to Cart"
                    >
                      <ShoppingBag size={14} />
                    </button>

                    <Link 
                      href={`/products/${product.id}`}
                      className="px-4 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <span>View & Order</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
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

      </section>

      {/* Lightbox Modal */}
      {lightboxProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 relative animate-in zoom-in-95">
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
                  <p className="text-stone-600 text-xs mt-3 leading-relaxed">
                    {lightboxProduct.description || "Manufactured with pride in Addis Ababa, Ethiopia using heavy-duty biodegradable kraft."}
                  </p>
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <span className="text-xl font-bold text-[#8C4B31] font-mono">
                      {formatPrice(lightboxProduct.price)}
                    </span>
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
                    Go to Full Order Flow
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
