"use client";

import { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  X, 
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Check,
  Power,
  Star,
  Edit3,
  ArrowLeft,
  ArrowRight,
  Filter
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  image_urls?: string[];
  category: string;
  stock_quantity: number | null;
  is_available: boolean;
  is_featured: boolean;
  created_at: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Modal State for Create / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Packaging");
  const [formPrice, setFormPrice] = useState(180);
  const [formStock, setFormStock] = useState(500);
  const [formDescription, setFormDescription] = useState("");
  const [formAvailable, setFormAvailable] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products?all=true&limit=100");
      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setProducts(resJson.products || []);
      } else {
        throw new Error(resJson?.error || "Failed to load products");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load catalog products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory("Packaging");
    setFormPrice(180);
    setFormStock(500);
    setFormDescription("");
    setFormAvailable(true);
    setFormFeatured(false);
    setUploadedImages(["/images/photo_6_2026-09-05_00-36-03.jpg"]);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category || "Packaging");
    setFormPrice(product.price);
    setFormStock(product.stock_quantity ?? 500);
    setFormDescription(product.description || "");
    setFormAvailable(product.is_available);
    setFormFeatured(Boolean(product.is_featured));
    setUploadedImages(product.images && product.images.length > 0 ? [...product.images] : ["/images/photo_6_2026-09-05_00-36-03.jpg"]);
    setFormError("");
    setModalOpen(true);
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    setActionSuccess("");
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_available: !currentStatus }),
      });
      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_available: !currentStatus } : p))
        );
        setActionSuccess(`Availability toggled to ${!currentStatus ? "AVAILABLE" : "UNAVAILABLE"}.`);
        setTimeout(() => setActionSuccess(""), 3500);
      } else {
        alert(resJson?.error || "Failed to toggle availability");
      }
    } catch (err: any) {
      alert(err?.message || "Error updating product");
    }
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    setActionSuccess("");
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_featured: !currentFeatured }),
      });
      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_featured: !currentFeatured } : p))
        );
        setActionSuccess(`Product ${!currentFeatured ? "FEATURED on landing page" : "unfeatured"}.`);
        setTimeout(() => setActionSuccess(""), 3500);
      } else {
        alert(resJson?.error || "Failed to toggle featured status");
      }
    } catch (err: any) {
      alert(err?.message || "Error updating featured status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete or soft-delete this product?")) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
      });
      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        fetchProducts();
        setActionSuccess(resJson.message || "Product removed successfully.");
        setTimeout(() => setActionSuccess(""), 3500);
      } else {
        alert(resJson?.error || "Failed to delete product");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to delete product");
    }
  };

  // Image Upload with size/MIME validation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setFormError("");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Client size check (< 5 MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File "${file.name}" exceeds maximum allowed size of 5 MB.`);
          continue;
        }

        // Client format check
        if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
          alert(`File "${file.name}" has invalid format. Please upload JPG, PNG, or WEBP.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("bucket", "product-images");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const resJson = await res.json();
        if (res.ok && resJson?.url) {
          setUploadedImages((prev) => [...prev, resJson.url]);
        } else {
          alert(resJson?.error || `Upload failed for ${file.name}`);
        }
      }
    } catch (err: any) {
      alert(err?.message || "File upload error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveImage = (from: number, to: number) => {
    if (to < 0 || to >= uploadedImages.length) return;
    setUploadedImages((prev) => {
      const copy = [...prev];
      const item = copy.splice(from, 1)[0];
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    if (uploadedImages.length === 0) {
      setFormError("At least one product image is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingProduct) {
        // UPDATE (PATCH)
        const res = await fetch("/api/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            name: formName.trim(),
            category: formCategory.trim(),
            price: Number(formPrice),
            stock_quantity: Number(formStock),
            description: formDescription.trim(),
            is_available: formAvailable,
            is_featured: formFeatured,
            images: uploadedImages,
          }),
        });

        const resJson = await res.json();
        if (res.ok && resJson?.success) {
          setModalOpen(false);
          fetchProducts();
          setActionSuccess("Product updated successfully!");
          setTimeout(() => setActionSuccess(""), 3500);
        } else {
          setFormError(resJson?.error || "Failed to update product");
        }
      } else {
        // CREATE (POST)
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            category: formCategory.trim(),
            price: Number(formPrice),
            stock_quantity: Number(formStock),
            description: formDescription.trim(),
            is_available: formAvailable,
            is_featured: formFeatured,
            images: uploadedImages,
          }),
        });

        const resJson = await res.json();
        if (res.ok && resJson?.success) {
          setModalOpen(false);
          fetchProducts();
          setActionSuccess("New product added to catalog successfully!");
          setTimeout(() => setActionSuccess(""), 3500);
        } else {
          setFormError(resJson?.error || "Failed to create product");
        }
      }
    } catch (err: any) {
      setFormError(err?.message || "Network error saving product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());

    const matchCategory =
      categoryFilter === "All" || p.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchSearch && matchCategory;
  });

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Packaging Catalog & Manufacturing
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            Manufactured Products
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Realtime database inventory. Upload multi-image galleries to Supabase storage, feature items on the landing page, and manage availability.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-[#E0B382] hover:text-white text-xs font-bold px-5 py-2.5 rounded-2xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold animate-in fade-in">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search products by name, category, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-stone-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#FAF7F2] border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-stone-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]/20"
          >
            <option value="All">All Categories</option>
            <option value="Packaging">Packaging</option>
            <option value="Coffee & Food">Coffee & Food</option>
            <option value="Luxury Retail">Luxury Retail</option>
            <option value="Standard Retail">Standard Retail</option>
            <option value="Heavy Duty">Heavy Duty</option>
          </select>
          <span className="text-xs text-stone-400 font-semibold px-2">
            {filtered.length} products
          </span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-stone-400 text-xs">
            <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading live catalog from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-stone-200 p-8">
            <Package size={36} className="mx-auto text-stone-300 mb-2" />
            <h3 className="font-bold text-stone-800 text-base mb-1">No products match your query</h3>
            <p className="text-xs text-stone-500 mb-4">Try clearing your filters or create a new product.</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-[#1E3B2E] text-[#E0B382] text-xs font-bold cursor-pointer"
            >
              Add First Product
            </button>
          </div>
        ) : (
          filtered.map((p) => {
            const mainImg = p.images?.[0] || "/images/photo_6_2026-09-05_00-36-03.jpg";
            return (
              <div
                key={p.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden flex flex-col justify-between ${
                  p.is_available
                    ? "border-stone-200 shadow-sm hover:shadow-md"
                    : "border-dashed border-stone-300 opacity-65 bg-stone-50/50"
                }`}
              >
                <div>
                  <div className="h-48 bg-stone-100 relative overflow-hidden">
                    <img
                      src={mainImg}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Category pill */}
                    <div className="absolute top-3 left-3 flex gap-1">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-xs text-[#1E3B2E] shadow-sm">
                        {p.category}
                      </span>
                    </div>

                    {/* Featured & Stock Badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {p.is_featured && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                          <Star size={11} className="fill-current" />
                          <span>Featured</span>
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.is_available 
                            ? "bg-emerald-600 text-white" 
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {p.is_available ? "In Stock" : "Unavailable"}
                      </span>
                    </div>

                    {p.images?.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        +{p.images.length - 1} images
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-serif text-base font-bold text-stone-900 leading-tight line-clamp-1">
                        {p.name}
                      </h3>
                      <span className="text-sm font-bold text-[#8C4B31] font-mono shrink-0">
                        {p.price} ETB
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                      {p.description || "High-performance Ethiopian kraft packaging."}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-100 pt-2">
                      <span>Stock: <strong>{p.stock_quantity ?? "Made-to-Order"}</strong></span>
                      <span className="font-mono text-[10px] text-stone-400">ID: {p.id.substring(0, 8)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="p-3.5 bg-[#FAF7F2] border-t border-stone-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleAvailability(p.id, p.is_available)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                        p.is_available
                          ? "bg-stone-200 hover:bg-red-100 text-stone-700 hover:text-red-800"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {p.is_available ? "Hide" : "Publish"}
                    </button>

                    <button
                      onClick={() => toggleFeatured(p.id, p.is_featured)}
                      className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                        p.is_featured
                          ? "bg-amber-50 border-amber-300 text-amber-700"
                          : "bg-white border-stone-200 text-stone-400 hover:text-amber-600"
                      }`}
                      title={p.is_featured ? "Remove from Featured Landing" : "Feature on Landing Page"}
                    >
                      <Star size={14} className={p.is_featured ? "fill-amber-500 text-amber-500" : ""} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-xl text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-stone-400 hover:text-red-700 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove Product"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Create / Edit Product */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-stone-400 hover:bg-stone-100 text-stone-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-stone-100">
              <div className="p-2 rounded-xl bg-[#1E3B2E]/10 text-[#1E3B2E]">
                <Package size={18} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <p className="text-[11px] text-stone-500">
                  Configure details, gallery images, and landing page visibility
                </p>
              </div>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-800 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rare Specialty Coffee Roasters Bag"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none cursor-pointer"
                  >
                    <option value="Packaging">Packaging</option>
                    <option value="Coffee & Food">Coffee & Food</option>
                    <option value="Luxury Retail">Luxury Retail</option>
                    <option value="Standard Retail">Standard Retail</option>
                    <option value="Heavy Duty">Heavy Duty</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Price (ETB) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono font-bold focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed specifications (GSM, handles, dimensions, use cases)..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#1E3B2E]/20 focus:border-[#1E3B2E] outline-none"
                />
              </div>

              {/* Multi-Image Upload & Management */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-stone-700 uppercase tracking-wider">
                    Gallery Images (Uploaded to product-images Bucket) *
                  </label>
                  <span className="text-[10px] text-stone-400">Max 5MB each (JPG/PNG/WEBP)</span>
                </div>

                <div className="border border-dashed border-stone-300 rounded-2xl p-4 bg-[#FAF7F2] text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp"
                    id="multiImgUpload"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="multiImgUpload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-bold hover:bg-stone-50 cursor-pointer shadow-xs transition-colors"
                  >
                    <Upload size={14} className="text-[#1E3B2E]" />
                    <span>{isUploading ? "Uploading to Storage..." : "Upload Images"}</span>
                  </label>

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-stone-200">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-stone-200 bg-white">
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-20 object-cover"
                          />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-[#1E3B2E] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                              Cover
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, idx - 1)}
                                className="p-1 rounded bg-white/80 hover:bg-white text-stone-900 cursor-pointer"
                                title="Move Left"
                              >
                                <ArrowLeft size={12} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 rounded bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                              title="Remove"
                            >
                              <X size={12} />
                            </button>
                            {idx < uploadedImages.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, idx + 1)}
                                className="p-1 rounded bg-white/80 hover:bg-white text-stone-900 cursor-pointer"
                                title="Move Right"
                              >
                                <ArrowRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Checkbox Options */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800">
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1E3B2E] focus:ring-[#1E3B2E] border-stone-300"
                  />
                  <span>Active & Available for public ordering</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-800">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                  />
                  <span className="flex items-center gap-1">
                    <Star size={13} className="text-amber-500 fill-amber-500" />
                    <span>Feature on Landing Page</span>
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-5 py-2.5 rounded-xl font-bold bg-[#1E3B2E] text-[#E0B382] hover:bg-[#8C4B31] hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
