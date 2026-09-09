"use client";

import { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  X,
  Sparkles,
  DollarSign,
  Tag,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { DataStore, StoredProduct } from "@/utils/dataStore";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<StoredProduct[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  
  // New Product Form
  const [newName, setNewName] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newCategory, setNewCategory] = useState("Standard Retail");
  const [newPrice, setNewPrice] = useState(180);
  const [newGsm, setNewGsm] = useState(200);
  const [newDimensions, setNewDimensions] = useState("24cm × 30cm + 10cm gusset");
  const [newMaterial, setNewMaterial] = useState("100% Ethiopian Virgin Kraft");
  const [newHandle, setNewHandle] = useState("Twisted Black Cord");
  const [newDescription, setNewDescription] = useState("");
  const [newImage, setNewImage] = useState("/images/photo_6_2026-09-05_00-36-03.jpg");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
    window.addEventListener("arenguade_datastore_change", loadProducts);
    return () => window.removeEventListener("arenguade_datastore_change", loadProducts);
  }, []);

  const loadProducts = () => {
    setProducts(DataStore.getProducts());
  };

  const toggleStock = (id: string) => {
    DataStore.toggleProductStock(id);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this product from the live storefront?")) {
      await DataStore.deleteProduct(id);
      loadProducts();
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await DataStore.addProduct({
        name: newName,
        client: newClient || "Arenguade Packaging Client",
        category: newCategory,
        price: Number(newPrice),
        bundleSize: 100,
        gsm: Number(newGsm),
        handleType: newHandle,
        image: newImage,
        gallery: [newImage],
        badge: "New Release",
        description: newDescription || `${newGsm} GSM ${newMaterial} engineered for high-performance wholesale packaging.`,
        dimensions: newDimensions,
        material: newMaterial,
        inStock: true
      });

      setModalOpen(false);
      setNewName("");
      setNewClient("");
      setNewDescription("");
      loadProducts();
    } catch (err) {
      console.error("Failed to add product:", err);
      alert("Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Product Catalog Management
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            Storefront Product Lines
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Full control over the products displayed on the public catalog, prices, GSM, dimensions, and live stock status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products"
            target="_blank"
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-3 rounded-full transition-colors flex items-center gap-1.5"
          >
            <span>View Public Store</span>
            <ExternalLink size={13} />
          </Link>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-3 rounded-full transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Product Line</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search products, GSM, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F2] border border-stone-300 rounded-full focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-stone-600 font-medium">
          <span>Active In Stock: <strong className="text-emerald-700">{products.filter((p) => p.inStock).length}</strong></span>
          <span>•</span>
          <span>Total Public Lines: <strong className="text-stone-900">{products.length}</strong></span>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-stone-200">
              <tr>
                <th className="p-4 font-bold text-stone-700 uppercase">Product Line</th>
                <th className="p-4 font-bold text-stone-700 uppercase">Category</th>
                <th className="p-4 font-bold text-stone-700 uppercase">GSM Weight</th>
                <th className="p-4 font-bold text-stone-700 uppercase">Dimensions</th>
                <th className="p-4 font-bold text-stone-700 uppercase">Price / Bundle</th>
                <th className="p-4 font-bold text-stone-700 uppercase">Availability</th>
                <th className="p-4 font-bold text-stone-700 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-4 font-bold text-stone-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 shrink-0 overflow-hidden border border-stone-200">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} />
                        )}
                      </div>
                      <div>
                        <span className="block font-serif text-sm text-stone-900 leading-tight">{product.name}</span>
                        <span className="text-[10px] text-stone-400 font-sans">{product.client || "Standard Line"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-stone-600">{product.category}</td>
                  <td className="p-4 font-mono font-semibold text-stone-800">{product.gsm} GSM</td>
                  <td className="p-4 text-stone-600">{product.dimensions}</td>
                  <td className="p-4 font-serif font-bold text-stone-900 text-sm">
                    {product.price} ETB
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleStock(product.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        product.inStock 
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                          : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                      }`}
                      title="Click to toggle availability"
                    >
                      {product.inStock ? "Active & In Stock" : "Temporarily Sold Out"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete product from storefront"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400 text-xs">
                    No products found matching "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative my-8">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-800 cursor-pointer"
            >
              <X size={20} />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">
              Live Storefront Publisher
            </span>
            <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1 mb-4">
              Add New Product Line
            </h3>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sidama Specialty Coffee Heavy Degassing Pouch"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Client / Brand Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Sidama Coffee Union"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  >
                    <option value="Coffee & Food">Coffee & Food</option>
                    <option value="Luxury Retail">Luxury Retail</option>
                    <option value="Standard Retail">Standard Retail</option>
                    <option value="Confectionery & Bakery">Confectionery & Bakery</option>
                    <option value="Hotels & Hospitality">Hotels & Hospitality</option>
                    <option value="Healthcare & Corporate">Healthcare & Corporate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Price / Bundle (100 Bags) in ETB</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Paper Weight (GSM)</label>
                  <input
                    type="number"
                    required
                    value={newGsm}
                    onChange={(e) => setNewGsm(Number(e.target.value))}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Dimensions</label>
                  <input
                    type="text"
                    required
                    value={newDimensions}
                    onChange={(e) => setNewDimensions(e.target.value)}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Handle Type</label>
                  <input
                    type="text"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Image Asset URL</label>
                <select
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none mb-1.5"
                >
                  <option value="/images/photo_6_2026-09-05_00-36-03.jpg">Unbleached Kraft Bag (photo_6)</option>
                  <option value="/images/photo_3_2026-09-05_00-36-02.jpg">Tibeb Pattern Border Tote (photo_3)</option>
                  <option value="/images/photo_4_2026-09-05_00-36-02.jpg">Hassan Adama Luxury Shopper (photo_4)</option>
                  <option value="/images/photo_13_2026-09-05_00-36-03.jpg">Liora Fashion Carrier (photo_13)</option>
                  <option value="/images/photo_10_2026-09-05_00-36-03.jpg">Medical Luxury Carrier (photo_10)</option>
                  <option value="/images/photo_16_2026-09-05_00-36-03.jpg">Artisan Slide Sleeve Box (photo_16)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Manufacturing specifications, paper composition, and use cases..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold tracking-wider uppercase transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Publishing Line..." : "Publish to Public Storefront"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
