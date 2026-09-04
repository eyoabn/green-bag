"use client";

import { useState } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  X,
  Sparkles
} from "lucide-react";

interface AdminProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  gsm: number;
  bundleSize: number;
  inStock: boolean;
  inventoryBundles: number;
}

const INITIAL_CATALOG: AdminProduct[] = [
  { id: "1", name: "Specialty Coffee Degassing Pouch", category: "Coffee & Food", price: 180, gsm: 250, bundleSize: 100, inStock: true, inventoryBundles: 420 },
  { id: "2", name: "Bole Luxury Boutique Shopper", category: "Luxury Retail", price: 240, gsm: 220, bundleSize: 100, inStock: true, inventoryBundles: 280 },
  { id: "3", name: "Arenguade Forest Heritage Tote", category: "Event & Gifts", price: 210, gsm: 200, bundleSize: 100, inStock: true, inventoryBundles: 190 },
  { id: "4", name: "Classic Natural Kraft Grocery Bag", category: "Standard Retail", price: 150, gsm: 180, bundleSize: 100, inStock: true, inventoryBundles: 850 },
  { id: "5", name: "Addis Artisan Bakery Pouch", category: "Coffee & Food", price: 110, gsm: 80, bundleSize: 100, inStock: true, inventoryBundles: 510 },
  { id: "6", name: "Heavy-Duty Wholesale Cargo Sack", category: "Industrial", price: 320, gsm: 280, bundleSize: 50, inStock: false, inventoryBundles: 0 },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>(INITIAL_CATALOG);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  
  // New Product Form
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Standard Retail");
  const [newPrice, setNewPrice] = useState(160);
  const [newGsm, setNewGsm] = useState(180);

  const toggleStock = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p))
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this product from the public catalog?")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: AdminProduct = {
      id: String(products.length + 1),
      name: newName,
      category: newCategory,
      price: Number(newPrice),
      gsm: Number(newGsm),
      bundleSize: 100,
      inStock: true,
      inventoryBundles: 100
    };
    setProducts([newEntry, ...products]);
    setModalOpen(false);
    setNewName("");
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
            Manufacturing Product Lines
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Configure wholesale specifications, GSM weights, inventory reserves, and pricing.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-3 rounded-full transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          <span>Add New Product Line</span>
        </button>
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
          <span>Active Lines: <strong className="text-stone-900">{products.filter((p) => p.inStock).length}</strong></span>
          <span>•</span>
          <span>Total Catalog: <strong className="text-stone-900">{products.length}</strong></span>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-stone-200">
              <tr>
                <th className="p-4 font-bold text-stone-700 uppercase">Product Name</th>
                <th className="p-4 font-bold text-stone-700 uppercase">Category</th>
                <th className="p-4 font-bold text-stone-700 uppercase">GSM Weight</th>
                <th className="p-4 font-bold text-stone-700 uppercase">Price / Bundle (100)</th>
                <th className="p-4 font-bold text-stone-700 uppercase">Inventory</th>
                <th className="p-4 font-bold text-stone-700 uppercase">Availability</th>
                <th className="p-4 font-bold text-stone-700 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-4 font-bold text-stone-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
                        <Package size={16} />
                      </div>
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-stone-600">{product.category}</td>
                  <td className="p-4 font-mono font-semibold text-stone-800">{product.gsm} GSM</td>
                  <td className="p-4 font-serif font-bold text-stone-900 text-sm">
                    {product.price} ETB
                  </td>
                  <td className="p-4 font-mono text-stone-600">
                    {product.inventoryBundles} bundles ({product.inventoryBundles * 100} pcs)
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleStock(product.id)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                        product.inStock 
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                          : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                      }`}
                    >
                      {product.inStock ? "Active & In Stock" : "Temporarily Sold Out"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-800"
            >
              <X size={20} />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">
              Catalog Expansion
            </span>
            <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1 mb-4">
              Add New Packaging Line
            </h3>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Harar Coffee Valve Sack"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
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
                  <option value="Industrial">Industrial</option>
                  <option value="Event & Gifts">Event & Gifts</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Price / Bundle (ETB)</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Grammage (GSM)</label>
                  <input
                    type="number"
                    required
                    value={newGsm}
                    onChange={(e) => setNewGsm(Number(e.target.value))}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold tracking-wider uppercase transition-all shadow-md"
                >
                  Publish to Public Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
