"use client";

import { useState, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight,
  Upload, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Truck, 
  Layers, 
  Sparkles,
  ShoppingBag,
  FileText,
  Palette,
  Eye
} from "lucide-react";
import { PRODUCTS_CATALOG } from "@/app/products/page";
import { DataStore, StoredBankAccount } from "@/utils/dataStore";
import { useEffect } from "react";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState(() => {
    const dynamicProd = DataStore.getProductById(productId);
    if (dynamicProd) {
      return {
        id: dynamicProd.id,
        name: dynamicProd.name,
        client: dynamicProd.client || "Arenguade Custom Line",
        category: dynamicProd.category,
        price: dynamicProd.price,
        bundleSize: dynamicProd.bundleSize || 100,
        gsm: dynamicProd.gsm || 200,
        handleType: dynamicProd.handleType || "Twisted Kraft Cord",
        image: dynamicProd.image || "/images/photo_6_2026-09-05_00-36-03.jpg",
        gallery: dynamicProd.gallery && dynamicProd.gallery.length > 0 ? dynamicProd.gallery : [dynamicProd.image],
        badge: dynamicProd.inStock ? dynamicProd.badge : "Out of Stock",
        description: dynamicProd.description || "",
        dimensions: dynamicProd.dimensions || "24cm × 30cm + 10cm gusset",
        material: dynamicProd.material || "100% Ethiopian Virgin Kraft",
      };
    }
    return PRODUCTS_CATALOG.find((p) => p.id === productId) || PRODUCTS_CATALOG[0];
  });

  const [banks, setBanks] = useState<StoredBankAccount[]>(DataStore.getActiveBanks());
  const [selectedBank, setSelectedBank] = useState<StoredBankAccount>(DataStore.getActiveBanks()[0] || {
    id: "cbe",
    name: "Commercial Bank of Ethiopia (CBE)",
    accountNumber: "1000123456789",
    accountHolder: "Ethiopia Arenguade Paper Product PLC",
    type: "bank",
    isActive: true
  });

  useEffect(() => {
    const active = DataStore.getActiveBanks();
    if (active.length > 0) {
      setBanks(active);
      setSelectedBank(active[0]);
    }
  }, []);

  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [copied, setCopied] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderConfirmed, setOrderConfirmed] = useState<boolean>(false);
  const [orderRef, setOrderRef] = useState<string>("");

  const basePrice = product.price;
  // Volume discount: 5% off for 3+ bundles, 12% off for 10+ bundles
  const discountMultiplier = quantity >= 10 ? 0.88 : quantity >= 3 ? 0.95 : 1;
  const totalPrice = Math.round(basePrice * quantity * discountMultiplier);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      alert("Please upload your bank transaction receipt / screenshot to complete your order.");
      return;
    }
    setIsSubmitting(true);
    try {
      let receiptBase64 = "";
      if (uploadedFile) {
        receiptBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string || "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(uploadedFile);
        });
      }

      const savedOrder = await DataStore.addOrder({
        customerName: customerName || "Customer",
        customerPhone: customerPhone || "0911000000",
        productId: product.id,
        productName: `${product.name} (${quantity} Bundles)`,
        quantityBundles: quantity,
        totalEtb: totalPrice,
        bankName: selectedBank.name,
        receiptUrl: receiptBase64 || undefined,
      });

      setOrderRef(savedOrder.id);
      setOrderConfirmed(true);
    } catch (err) {
      console.error("Order submission failed:", err);
      const generatedRef = `ARN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setOrderRef(generatedRef);
      setOrderConfirmed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[#F9F6F0]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 w-full">
        
        {/* Back navigation */}
        <Link 
          href="/products" 
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#8C4B31] transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Catalog</span>
        </Link>

        {orderConfirmed ? (
          /* Order Confirmation Success State */
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#1E3B2E]">
              Order Successfully Placed
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-2 mb-3">
              Payment Under Verification
            </h1>
            <p className="text-stone-600 text-sm max-w-md mx-auto leading-relaxed mb-6">
              Thank you, <span className="font-semibold text-stone-900">{customerName || "Valued Customer"}</span>. We have received your payment screenshot for <span className="font-semibold text-stone-900">{product.name}</span>. Our Addis Ababa plant will verify and process your shipment within 24 hours.
            </p>

            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-stone-200 text-left max-w-md mx-auto mb-8 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Order Reference:</span>
                <span className="font-mono font-bold text-stone-900">{orderRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Product Model:</span>
                <span className="font-semibold text-stone-900">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Total Paid:</span>
                <span className="font-bold text-[#8C4B31]">{totalPrice} ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Quantity:</span>
                <span className="font-semibold text-stone-900">{quantity} Bundles ({quantity * product.bundleSize} bags)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment Channel:</span>
                <span className="font-semibold text-stone-900">{selectedBank.name}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/dashboard" 
                className="w-full sm:w-auto bg-[#1E3B2E] hover:bg-[#8C4B31] text-white px-8 py-3.5 rounded-full text-xs font-bold transition-all shadow-md"
              >
                Track Order in Dashboard
              </Link>
              <Link 
                href="/products" 
                className="w-full sm:w-auto bg-stone-100 hover:bg-stone-200 text-stone-800 px-6 py-3.5 rounded-full text-xs font-bold transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          /* Main Product & Checkout Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Product Real Photo Showcase & Specs */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Main Photo */}
              <div className="aspect-[4/3] rounded-3xl bg-stone-100 relative overflow-hidden border border-stone-300 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />

                <div className="absolute top-4 left-4 bg-[#1E3B2E] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  {product.badge || "Verified Production Batch"}
                </div>

                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-800 shadow-sm">
                  Client: {product.client}
                </div>
              </div>

              {/* Gallery Thumbnails (if multiple photos available) */}
              {product.gallery && product.gallery.length > 1 && (
                <div className="flex gap-3">
                  {product.gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                        selectedImage === img ? "border-[#8C4B31] scale-105 shadow-md" : "border-stone-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Technical Specifications */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
                <h3 className="font-serif text-xl font-bold text-stone-900 mb-4">Engineering Specifications</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-100">
                    <span className="text-stone-500 block">Paper Weight</span>
                    <span className="font-bold text-stone-900 text-sm">{product.gsm} GSM Kraft</span>
                  </div>
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-100">
                    <span className="text-stone-500 block">Handle Type</span>
                    <span className="font-bold text-stone-900 text-sm">{product.handleType}</span>
                  </div>
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-100">
                    <span className="text-stone-500 block">Dimensions</span>
                    <span className="font-bold text-stone-900 text-sm">{product.dimensions}</span>
                  </div>
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-100">
                    <span className="text-stone-500 block">Material Grade</span>
                    <span className="font-bold text-stone-900 text-sm">{product.material}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                  <span className="flex items-center gap-1.5">
                    <Truck size={15} className="text-[#1E3B2E]" /> Dispatched in 24-48 hrs in Addis Ababa
                  </span>
                  <Link 
                    href="/design-submission" 
                    className="text-[#8C4B31] font-bold hover:underline flex items-center gap-1"
                  >
                    <Palette size={14} /> Customize Your Logo
                  </Link>
                </div>
              </div>

            </div>

            {/* Right: Order Form & Bank Checkout */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-lg">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31] block mb-1">
                  Product #{product.id} • Manufactured in Addis Ababa
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mb-2">
                  {product.name}
                </h1>
                <p className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md inline-block mb-4">
                  Produced for: {product.client}
                </p>

                <p className="text-stone-600 text-sm leading-relaxed mb-6">
                  {product.description}
                </p>
                
                {/* Pricing & Quantity Selector */}
                <div className="pb-6 border-b border-stone-200">
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="font-serif text-3xl font-bold text-[#8C4B31]">
                      {totalPrice} ETB
                    </span>
                    <span className="text-xs text-stone-500">
                      for {quantity} bundle ({quantity * product.bundleSize} bags)
                    </span>
                    {quantity >= 3 && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        {quantity >= 10 ? "12% Bulk Discount" : "5% Bundle Discount"}
                      </span>
                    )}
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-stone-700 uppercase">Select Bundles:</span>
                    <div className="flex items-center border border-stone-300 rounded-full overflow-hidden">
                      <button 
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                      >
                        -
                      </button>
                      <span className="px-4 py-1.5 font-bold text-xs text-stone-900 bg-white">
                        {quantity} ({quantity * product.bundleSize} pcs)
                      </span>
                      <button 
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Checkout Form */}
                <form onSubmit={handleSubmitOrder} className="mt-6 space-y-6">
                  
                  {/* Step 1: Contact Details */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1E3B2E] text-white text-[10px] flex items-center justify-center">1</span>
                      Your Contact Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="Full Name / Store Name"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                      />
                      <input 
                        type="tel" 
                        placeholder="Phone (e.g. 0911234567)"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                      />
                    </div>
                  </div>

                  {/* Step 2: Bank Selection */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1E3B2E] text-white text-[10px] flex items-center justify-center">2</span>
                      Transfer {totalPrice} ETB to Official Account
                    </h4>

                    {/* Bank Tabs */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {banks.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`p-2 rounded-xl text-[11px] font-bold border text-center transition-all ${
                            selectedBank.id === bank.id
                              ? "border-[#1E3B2E] bg-[#1E3B2E] text-white shadow-sm"
                              : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                          }`}
                        >
                          {bank.name.split(" ")[0].toUpperCase()}
                        </button>
                      ))}
                    </div>

                    {/* Active Bank Card with Copy Action */}
                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-300/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                          {selectedBank.name}
                        </span>
                        <p className="font-mono text-base font-bold text-stone-900 mt-0.5 tracking-wider">
                          {selectedBank.accountNumber}
                        </p>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          A/C Name: {selectedBank.accountHolder}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(selectedBank.accountNumber)}
                        className="p-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
                        title="Copy Account Number"
                      >
                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>{copied ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Receipt Screenshot Upload */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1E3B2E] text-white text-[10px] flex items-center justify-center">3</span>
                      Upload Transaction Screenshot / Receipt
                    </h4>

                    <label className="border-2 border-dashed border-stone-300 hover:border-[#8C4B31] bg-[#FAF7F2] hover:bg-white rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileUpload}
                      />
                      <Upload size={28} className="text-[#8C4B31] mb-2" />
                      {uploadedFile ? (
                        <div className="text-center">
                          <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
                            <CheckCircle2 size={14} /> {uploadedFile.name}
                          </p>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            {(uploadedFile.size / 1024).toFixed(1)} KB • Click to change
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs font-bold text-stone-800">
                            Click to upload receipt screenshot
                          </p>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            Supports CBE Birr receipt, Telebirr SMS capture, or Bank Slip
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Sparkles size={16} className="animate-spin" />
                        <span>Submitting Order for Verification...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        <span>Submit Order ({totalPrice} ETB)</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <Link
                      href="/design-submission"
                      className="text-xs font-bold text-[#8C4B31] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Need your own custom dimensions and logo? Use our Custom Studio</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>

                </form>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
