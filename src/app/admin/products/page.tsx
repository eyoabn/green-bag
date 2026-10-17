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
  Power
} from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock_quantity: number | null;
  is_available: boolean;
  created_at: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  
  // New Product Form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Coffee & Food");
  const [newPrice, setNewPrice] = useState(180);
  const [newStock, setNewStock] = useState(500);
  const [newDescription, setNewDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products?all=true");
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
        setActionSuccess(`Product availability updated successfully.`);
        setTimeout(() => setActionSuccess(""), 3500);
      } else {
        alert(resJson?.error || "Failed to toggle availability");
      }
    } catch (err: any) {
      alert(err?.message || "Error updating product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete or deactivate this product?")) return;
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setFormError("");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 5 MB limit.`);
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    const imagesToUse = uploadedImages.length > 0 
      ? uploadedImages 
      : ["/images/photo_6_2026-09-05_00-36-03.jpg"];

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          category: newCategory.trim(),
          price: Number(newPrice),
          stock_quantity: Number(newStock),
          description: newDescription.trim(),
          images: imagesToUse,
          is_available: true,
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        setModalOpen(false);
        setNewName("");
        setNewDescription("");
        setUploadedImages([]);
        fetchProducts();
        setActionSuccess("New product added to catalog successfully.");
        setTimeout(() => setActionSuccess(""), 3500);
      } else {
        setFormError(resJson?.error || "Failed to save product");
      }
    } catch (err: any) {
      setFormError(err?.message || "Network error adding product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Packaging Catalog
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            Manufactured Products
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Realtime PostgreSQL product catalog. Create, edit, upload multi-images to storage, and manage stock availability.
          </p>
        </div>

        <button
          onClick={() => {
            setUploadedImages([]);
            setModalOpen(true);
          }}
          className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium animate-fadeIn">
          <Check size={16} className="text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-stone-200 rounded-full pl-9 pr-4 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
          />
        </div>
        <span className="text-xs text-stone-400 font-semibold hidden sm:inline">
          {filtered.length} products listed
        </span>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-stone-400 text-xs">
            <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading live catalog...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-400 text-xs">
            <Package size={32} className="mx-auto text-stone-300 mb-2" />
            No products match your query.
          </div>
        ) : (
          filtered.map((p) => {
            const mainImg = p.images?.[0] || "/images/photo_6_2026-09-05_00-36-03.jpg";
            return (
              <div
                key={p.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden flex flex-col justify-between ${
                  p.is_available
                    ? "border-stone-200 shadow-sm"
                    : "border-stone-300 opacity-60"
                }`}
              >
                <div>
                  <div className="h-44 bg-stone-100 relative overflow-hidden">
                    <img
                      src={mainImg}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-[#1E3B2E] shadow-xs">
                        {p.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        p.is_available 
                          ? "bg-emerald-600 text-white" 
                          : "bg-red-600 text-white"
                      }`}>
                        {p.is_available ? "In Stock" : "Unavailable"}
                      </span>
                    </div>

                    {p.images?.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        +{p.images.length - 1} images
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-serif text-base font-bold text-stone-900 leading-tight">
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

                <div className="p-4 bg-[#FAF7F2] border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleAvailability(p.id, p.is_available)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                      p.is_available
                        ? "bg-stone-200 hover:bg-red-100 text-stone-700 hover:text-red-800"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {p.is_available ? "Mark Unavailable" : "Set Available"}
                  </button>

                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-stone-400 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove product"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Product Modal with Multi-Image Upload */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fadeIn">
            
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-stone-400 hover:bg-stone-100 text-stone-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-[#1E3B2E]/10 text-[#1E3B2E]">
                <Package size={18} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Add New Product</h3>
                <p className="text-[11px] text-stone-500">Create product in PostgreSQL with multi-image storage upload</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Harar Premium Specialty Coffee Bag"
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 font-semibold"
                  >
                    <option value="Coffee & Food">Coffee & Food</option>
                    <option value="Luxury Retail">Luxury Retail</option>
                    <option value="Standard Retail">Standard Retail</option>
                    <option value="Healthcare & Corporate">Healthcare & Corporate</option>
                    <option value="Confectionery & Bakery">Confectionery & Bakery</option>
                    <option value="Grocery & Market">Grocery & Market</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                    Price (ETB per bundle)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Stock Quantity (leave blank for made-to-order)
                </label>
                <input
                  type="number"
                  min={0}
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value))}
                  placeholder="e.g. 500"
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Bespoke unbleached kraft carrier bag crafted for specialty retail..."
                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                />
              </div>

              {/* Multi-Image Upload Area */}
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Product Images (Storage Bucket: product-images)
                </label>
                
                <div className="border-2 border-dashed border-stone-300 rounded-2xl p-4 text-center bg-[#FAF7F2] hover:bg-stone-50 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload size={20} className="mx-auto text-stone-400 mb-1" />
                  <p className="text-[11px] font-bold text-stone-700">
                    {isUploading ? "Uploading to storage..." : "Click or drag images to upload"}
                  </p>
                  <p className="text-[9px] text-stone-400 mt-0.5">JPG, PNG, WEBP up to 5 MB</p>
                </div>

                {/* Uploaded Thumbnails with Reorder Controls */}
                {uploadedImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-square">
                        <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, idx - 1)}
                              className="text-white bg-black/60 px-1 rounded text-[9px]"
                              title="Move left"
                            >
                              &larr;
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="text-white bg-red-600 px-1 rounded text-[9px]"
                            title="Remove"
                          >
                            &times;
                          </button>
                          {idx < uploadedImages.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, idx + 1)}
                              className="text-white bg-black/60 px-1 rounded text-[9px]"
                              title="Move right"
                            >
                              &rarr;
                            </button>
                          )}
                        </div>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 bg-[#1E3B2E] text-white text-[8px] font-bold px-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-5 py-2 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Publishing..." : "Publish Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
