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
import { createClient } from "@/utils/supabase/client";
import { PRODUCTS_CATALOG } from "@/app/products/page";
import { DataStore, StoredBankAccount } from "@/utils/dataStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, isValidUUID } from "@/utils/auth";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

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
    async function loadProductAndBanks() {
      const supabase = createClient();

      // 1. Fetch real active banks from Supabase
      try {
        const { data: dbBanks } = await supabase.from("bank_accounts").select("*").eq("is_active", true);
        if (dbBanks && dbBanks.length > 0) {
          const mappedBanks: StoredBankAccount[] = dbBanks.map((b: any) => ({
            id: b.id,
            name: b.bank_name,
            accountNumber: b.account_number,
            accountHolder: b.account_name,
            accountName: b.account_name,
            type: "bank",
            isActive: true,
          }));
          setBanks(mappedBanks);
          setSelectedBank(mappedBanks[0]);
        }
      } catch {}

      // 2. Fetch product from Supabase if valid UUID
      if (isValidUUID(productId)) {
        try {
          const { data: p } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();
          if (p) {
            setProduct({
              id: p.id,
              name: p.name,
              client: p.client || "Arenguade Standard Catalog",
              category: p.category || "Standard Retail",
              price: p.price,
              bundleSize: p.bundle_size || 100,
              gsm: p.gsm || 200,
              handleType: p.handle_type || "Twisted Kraft Cord",
              image: p.image_urls && p.image_urls.length > 0 ? p.image_urls[0] : "/images/photo_6_2026-09-05_00-36-03.jpg",
              gallery: p.image_urls && p.image_urls.length > 0 ? p.image_urls : ["/images/photo_6_2026-09-05_00-36-03.jpg"],
              badge: p.badge || "Verified Production Batch",
              description: p.description || "",
              dimensions: p.dimensions || "24cm × 30cm + 10cm gusset",
              material: p.material || "100% Ethiopian Virgin Kraft",
            });
            if (p.image_urls && p.image_urls.length > 0) {
              setSelectedImage(p.image_urls[0]);
            }
          }
        } catch {}
      } else {
        // Fallback for numeric IDs: map to Supabase products if possible
        const catProd = PRODUCTS_CATALOG.find((p) => p.id === productId);
        if (catProd) {
          try {
            const { data: dbProds } = await supabase.from("products").select("id, name");
            if (dbProds && dbProds.length > 0) {
              const match = dbProds.find((dbp) => dbp.name.toLowerCase().includes(catProd.name.toLowerCase().slice(0, 10)));
              if (match) {
                setProduct((prev) => ({ ...prev, id: match.id }));
              }
            }
          } catch {}
        }
      }

      // 3. Auto-populate logged-in user information
      try {
        const u = await getCurrentUser();
        if (u) {
          setCurrentUser(u);
          if (u.full_name) setCustomerName(u.full_name);
          if (u.phone) setCustomerPhone(u.phone);
        } else {
          setCurrentUser(null);
        }
      } catch {}
    }

    loadProductAndBanks();
  }, [productId]);

  const [currentUser, setCurrentUser] = useState<any>(null);

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
      // 1. Verify user is logged in
      const user = await getCurrentUser();
      if (!user) {
        alert("Please sign in or create an account to complete your order.");
        router.push(`/login?returnTo=/products/${productId}`);
        return;
      }

      // 2. Prepare receipt image (upload to Supabase storage or convert to persistent DataURL)
      const fileDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(uploadedFile);
      });

      let receiptUrl = "";
      try {
        const supabase = createClient();
        const fileExt = uploadedFile.name.split('.').pop() || "jpg";
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `retail-orders/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, uploadedFile);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(filePath);
          receiptUrl = publicUrlData.publicUrl;
        }
      } catch (storageErr) {
        console.warn("Storage upload note:", storageErr);
      }

      if (!receiptUrl) {
        receiptUrl = fileDataUrl;
      }

      // 3. Post order to Server API endpoint
      let orderId = "";
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            productName: product.name,
            buyerId: user.id,
            customerName: customerName || user.full_name,
            customerPhone: customerPhone || user.phone,
            customerEmail: user.email,
            quantity,
            totalPrice,
            bankAccountId: selectedBank.id,
            receiptUrl,
          }),
        });
        const resData = await res.json();
        if (resData?.orderId) {
          orderId = resData.orderId;
        }
      } catch (apiErr) {
        console.warn("Server order API fallback:", apiErr);
      }

      // 4. Also register order in DataStore so dashboard updates immediately
      const savedOrder = await DataStore.addOrder({
        id: orderId || undefined,
        customerName: customerName || user.full_name || "Valued Customer",
        customerPhone: customerPhone || user.phone || "0911000000",
        customerEmail: user.email,
        productId: product.id,
        productName: `${product.name} (${quantity} Bundles)`,
        quantityBundles: quantity,
        totalEtb: totalPrice,
        bankName: selectedBank.name,
        receiptUrl: receiptUrl,
      });

      setOrderRef(orderId || savedOrder.id);
      setOrderConfirmed(true);
    } catch (err: any) {
      console.error("Order submission failed:", err);
      alert(err.message || "Something went wrong during checkout.");
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
                href="/dashboard?tab=orders" 
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

                {/* Checkout Form or Login Prompt */}
                {!currentUser ? (
                  <div className="mt-6 p-8 bg-stone-100 rounded-3xl border border-stone-200 text-center">
                    <ShieldCheck size={32} className="text-stone-400 mx-auto mb-3" />
                    <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">Sign in to Request Custom Bags</h3>
                    <p className="text-sm text-stone-600 mb-6">
                      Create an account or log in to customize this style with your brand logo and place an order.
                    </p>
                    <Link
                      href={`/login?returnTo=/products/${productId}`}
                      className="bg-[#1E3B2E] text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-[#8C4B31] transition-colors inline-flex items-center gap-2"
                    >
                      Log In to Customize <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : (
                <form onSubmit={handleSubmitOrder} className="mt-6 space-y-6">
                  
                  {/* Step 1: Customization Request */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1E3B2E] text-white text-[10px] flex items-center justify-center">1</span>
                      Your Brand Customization
                    </h4>
                    <div className="p-4 bg-[#FAF7F2] border border-stone-200 rounded-xl mb-6">
                      <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                        You are requesting a custom production run based on the <span className="font-bold text-stone-900">{product.name}</span> style. Please describe the branding (logo, text) you want printed instead of the current client's design.
                      </p>
                      <textarea
                        placeholder="E.g., Please print our logo 'Addis Cafe' in black ink centered on the bag. We will email the vector logo."
                        className="w-full p-3 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 min-h-[80px]"
                        required
                      />
                    </div>
                  </div>

                  {/* Step 2: Contact Details */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1E3B2E] text-white text-[10px] flex items-center justify-center">2</span>
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
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || !uploadedFile}
                      className="w-full py-4 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Sparkles size={16} className="animate-spin" />
                          <span>Processing Request...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={16} />
                          <span>Request Custom Production ({totalPrice} ETB)</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-stone-500 mt-3 font-medium mb-4">
                      By submitting, you agree to our Custom Manufacturing Terms. Our team will verify your payment and contact you for artwork approval before production begins.
                    </p>
                  </div>
                </form>
                )}

                <div className="text-center pt-2">
                  <Link
                    href="/design-submission"
                    className="text-xs font-bold text-[#8C4B31] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Need your own custom dimensions and logo? Use our Custom Studio</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
