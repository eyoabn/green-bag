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
  Eye,
  PenTool
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { uploadFileSafely } from "@/utils/fileUpload";
import { StickyBottomBar } from "@/components/StickyBottomBar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, isValidUUID, AppUser } from "@/utils/auth";
import { useCart } from "@/context/CartContext";

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  accountHolder: string;
  accountName?: string;
  type?: string;
  isActive: boolean;
}

export interface ProductDetail {
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
  is_client_work?: boolean;
  stock_quantity?: number | null;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string>("/images/photo_6_2026-09-05_00-36-03.jpg");
  const [copied, setCopied] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("Bole, Addis Ababa");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderConfirmed, setOrderConfirmed] = useState<boolean>(false);
  const [orderRef, setOrderRef] = useState<string>("");
  const [createdOrderId, setCreatedOrderId] = useState<string>("");

  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);

  useEffect(() => {
    async function loadProductAndBanks() {
      setLoading(true);
      const supabase = createClient();

      // 1. Fetch real active banks from Supabase
      try {
        const { data: dbBanks } = await supabase.from("bank_accounts").select("*").eq("is_active", true);
        if (dbBanks && dbBanks.length > 0) {
          const mappedBanks: BankAccount[] = (dbBanks as Array<{
            id: string;
            bank_name: string;
            account_number: string;
            account_name: string;
          }>).map((b) => ({
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

      // 2. Fetch product from API
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (data.product) {
          const p = data.product;
          const gallery = (p.images && p.images.length > 0) ? p.images : ((p.image_urls && p.image_urls.length > 0) ? p.image_urls : ["/images/photo_6_2026-09-05_00-36-03.jpg"]);
          setProduct({
            id: p.id,
            name: p.name,
            client: p.client || "Arenguade Standard Catalog",
            category: p.category || "Standard Retail",
            price: Number(p.price),
            bundleSize: p.bundle_size || p.bundleSize || 100,
            gsm: p.gsm || 200,
            handleType: p.handle_type || p.handleType || "Twisted Kraft Cord",
            image: gallery[0],
            gallery,
            badge: p.badge || "Verified Production Batch",
            description: p.description || "",
            dimensions: p.dimensions || "24cm × 30cm + 10cm gusset",
            material: p.material || "100% Ethiopian Virgin Kraft",
            is_available: p.is_available !== false,
            is_client_work: Boolean(p.is_client_work),
            stock_quantity: p.stock_quantity ?? 500,
          });
          setSelectedImage(gallery[0]);
        }
      } catch (err) {
        console.error("Error loading product detail:", err);
      } finally {
        setLoading(false);
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

  const basePrice = product ? product.price : 0;
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
    if (!product || product.is_available === false) {
      alert("This product is currently marked unavailable and cannot be ordered.");
      return;
    }
    if (!uploadedFile) {
      alert("Please upload your bank transaction receipt / screenshot to complete your order.");
      return;
    }
    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      alert("Please enter a valid delivery address (at least 5 characters).");
      return;
    }
    if (!customerPhone || customerPhone.trim().length < 6) {
      alert("Please enter a valid phone number (at least 6 characters).");
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

      // 2. Ensure product ID is a valid UUID
      let targetProductId = product.id;
      if (!isValidUUID(targetProductId)) {
        const supabase = createClient();
        const { data: dbP } = await supabase.from("products").select("id").eq("is_available", true).limit(1).maybeSingle();
        if (dbP?.id) {
          targetProductId = dbP.id;
        } else {
          throw new Error("Unable to identify product in database. Please choose an active product from the catalog.");
        }
      }

      // 3. Upload receipt screenshot using safe upload with auto-compression
      const uploadResult = await uploadFileSafely(uploadedFile, "payment-proofs");

      // 4. Place real order in PostgreSQL
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: targetProductId, quantity }],
          bankAccountId: selectedBank?.id || banks[0]?.id || "",
          deliveryAddress: deliveryAddress.trim(),
          phone: customerPhone.trim(),
          notes: notes.trim() || undefined,
          paymentProofPath: uploadResult.filePath,
        }),
      });

      const orderText = await orderRes.text();
      let orderData: any = {};
      try {
        orderData = JSON.parse(orderText);
      } catch {
        throw new Error(orderText || `Server returned error (${orderRes.status})`);
      }

      if (!orderRes.ok || !orderData.order) {
        throw new Error(orderData.error || "Failed to record order.");
      }

      const confirmedOrder = orderData.order;
      setCreatedOrderId(confirmedOrder.id);
      setOrderRef(confirmedOrder.order_number || confirmedOrder.id);
      setOrderConfirmed(true);
    } catch (err: unknown) {
      console.error("Order submission failed:", err);
      const message = err instanceof Error ? err.message : "Something went wrong during checkout.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[#F9F6F0]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 w-full animate-pulse">
          <div className="h-6 w-32 bg-stone-200 rounded-full mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 h-[480px] bg-stone-200 rounded-3xl" />
            <div className="lg:col-span-5 space-y-4">
              <div className="h-8 bg-stone-200 rounded w-3/4" />
              <div className="h-4 bg-stone-200 rounded w-1/2" />
              <div className="h-24 bg-stone-100 rounded-2xl" />
              <div className="h-40 bg-stone-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[#F9F6F0] items-center justify-center text-center px-4">
        <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">Packaging Item Not Found</h1>
        <p className="text-stone-600 text-sm mb-6 max-w-md">The requested packaging item could not be retrieved from the database.</p>
        <Link href="/products" className="bg-[#1E3B2E] text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider">
          Return to Catalog
        </Link>
      </div>
    );
  }

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
                <span className="font-semibold text-stone-900">{quantity} Bundles ({quantity * (product.bundleSize || 100)} bags)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Payment Channel:</span>
                <span className="font-semibold text-stone-900">{selectedBank ? selectedBank.name : "Verified Settlement Channel"}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href={createdOrderId ? `/dashboard/orders/${createdOrderId}` : "/dashboard?tab=orders"} 
                className="w-full sm:w-auto bg-[#1E3B2E] hover:bg-[#8C4B31] text-white px-8 py-3.5 rounded-full text-xs font-bold transition-all shadow-md"
              >
                Track Order #{orderRef}
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
              
              {product.is_client_work ? (
                /* Client Portfolio Showcase Card */
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-lg space-y-6">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck size={14} />
                    <span>Portfolio Showcase</span>
                  </div>

                  <div>
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
                      {product.name}
                    </h1>
                    {product.client && (
                      <p className="text-xs text-stone-500 mt-1 font-medium">
                        Designed &amp; manufactured for <strong className="text-[#8C4B31]">{product.client}</strong>
                      </p>
                    )}
                  </div>

                  <p className="text-stone-600 text-sm leading-relaxed">
                    {product.description || "Crafted in Addis Ababa using heavy-duty biodegradable Ethiopian kraft."}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-100">
                      <span className="text-stone-500 block text-[10px]">Paper Weight</span>
                      <span className="font-bold text-stone-900">{product.gsm} GSM Kraft</span>
                    </div>
                    <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-100">
                      <span className="text-stone-500 block text-[10px]">Handle Style</span>
                      <span className="font-bold text-stone-900">{product.handleType}</span>
                    </div>
                    <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-100">
                      <span className="text-stone-500 block text-[10px]">Min. Batch</span>
                      <span className="font-bold text-stone-900">500 pcs</span>
                    </div>
                    <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-100">
                      <span className="text-stone-500 block text-[10px]">Lead Time</span>
                      <span className="font-bold text-stone-900">7-10 Days</span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#1E3B2E] space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-[#E0B382]" />
                      <h3 className="font-serif text-base font-bold text-white">Want a similar design for your brand?</h3>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      We manufacture fully custom packaging batches with your logo, colors, and dimensions.
                    </p>
                    <Link
                      href={`/design-submission?preset=${encodeURIComponent(product.name)}&gsm=${product.gsm}&dimensions=${encodeURIComponent(product.dimensions || "")}&handle=${encodeURIComponent(product.handleType || "")}`}
                      className="w-full py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 bg-[#8C4B31] hover:bg-[#A3593B] text-white rounded-xl transition-all"
                    >
                      <PenTool size={14} />
                      <span>Commission This Style</span>
                    </Link>
                  </div>

                  <Link href="/products" className="hover:text-[#1E3B2E] font-medium flex items-center gap-1 text-xs text-stone-500">
                    <ArrowLeft size={13} />
                    <span>Back to Portfolio</span>
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-lg">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31] block mb-1">
                    Product #{product.id} • Manufactured in Addis Ababa
                  </span>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                      {product.name}
                    </h1>
                    {product.is_available === false ? (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border border-rose-200">
                        Unavailable
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border border-emerald-200">
                        In Stock
                      </span>
                    )}
                  </div>
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
                        for {quantity} bundle ({quantity * (product.bundleSize || 100)} bags)
                      </span>
                      {quantity >= 3 && (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          {quantity >= 10 ? "12% Bulk Discount" : "5% Bundle Discount"}
                        </span>
                      )}
                    </div>

                    {/* Quantity Counter & Add to Cart */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-stone-700 uppercase">Select Bundles:</span>
                        <div className="flex items-center border border-stone-300 rounded-full overflow-hidden bg-white">
                          <button 
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors"
                          >
                            -
                          </button>
                          <span className="px-4 py-1.5 font-bold text-xs text-stone-900">
                            {quantity} ({quantity * (product.bundleSize || 100)} pcs)
                          </span>
                          <button 
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={product.is_available === false}
                        onClick={() => {
                          addItem({
                            id: product.id,
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            image: product.image,
                            category: product.category,
                            bundleSize: product.bundleSize,
                          }, quantity);
                        }}
                        className="px-5 py-2 rounded-full border-2 border-[#1E3B2E] text-[#1E3B2E] hover:bg-[#1E3B2E] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                      >
                        <ShoppingBag size={14} />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkout Form or Unavailable Notification */}
                  {product.is_available === false ? (
                    <div className="mt-6 p-8 bg-rose-50/70 rounded-3xl border border-rose-200 text-center">
                      <ShieldCheck size={32} className="text-rose-400 mx-auto mb-3" />
                      <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">Product Currently Unavailable</h3>
                      <p className="text-sm text-stone-600 mb-6">
                        This paper bag model is currently unavailable for order. Please browse other active items in our catalog.
                      </p>
                      <button
                        disabled
                        className="w-full py-4 rounded-full bg-stone-300 text-stone-500 text-xs font-bold tracking-wider uppercase cursor-not-allowed shadow-none"
                      >
                        Product Currently Unavailable
                      </button>
                    </div>
                  ) : !currentUser ? (
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
                        Your Brand Customization & Notes
                      </h4>
                      <div className="p-4 bg-[#FAF7F2] border border-stone-200 rounded-xl mb-6">
                        <p className="text-xs text-stone-600 mb-3 leading-relaxed">
                          You are requesting a custom production run based on the <span className="font-bold text-stone-900">{product.name}</span> style. Please describe the branding (logo, text) or specific instructions.
                        </p>
                        <textarea
                          placeholder="E.g., Please print our logo 'Addis Cafe' in black ink centered on the bag. We will email the vector logo."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full p-3 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 min-h-[80px]"
                        />
                      </div>
                    </div>

                    {/* Step 2: Contact & Delivery Details */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1E3B2E] text-white text-[10px] flex items-center justify-center">2</span>
                        Contact & Delivery Details
                      </h4>
                      <div className="space-y-3 mb-3">
                        <div>
                          <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                            Full Name or Business Name
                          </label>
                          <input 
                            type="text" 
                            autoComplete="name"
                            placeholder="Your Name"
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full min-h-[44px] p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                            Phone Number (for SMS confirmation)
                          </label>
                          <input 
                            type="tel" 
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="e.g. 0911234567"
                            required
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full min-h-[44px] p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                            Delivery Address in Ethiopia
                          </label>
                          <input 
                            type="text" 
                            autoComplete="street-address"
                            placeholder="e.g. Bole Medhanialem, Addis Ababa"
                            required
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="w-full min-h-[44px] p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3B2E]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Bank Selection */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1E3B2E] text-white text-[10px] flex items-center justify-center">2</span>
                        Transfer {totalPrice} ETB to Official Account
                      </h4>

                      {/* Bank Tabs */}
                      {banks.length === 0 ? (
                        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs text-center">
                          Loading active settlement accounts...
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {banks.map((bank) => (
                              <button
                                key={bank.id}
                                type="button"
                                onClick={() => setSelectedBank(bank)}
                                className={`p-2 rounded-xl text-[11px] font-bold border text-center transition-all ${
                                  selectedBank?.id === bank.id
                                    ? "border-[#1E3B2E] bg-[#1E3B2E] text-white shadow-sm"
                                    : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                                }`}
                              >
                                {bank.name.split(" ")[0].toUpperCase()}
                              </button>
                            ))}
                          </div>

                          {/* Active Bank Card with Copy Action */}
                          {selectedBank && (
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
                          )}
                        </>
                      )}
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
                        className="w-full py-4 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Sparkles size={16} className="animate-spin" />
                            <span>Placing Order...</span>
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
              )}

            </div>

          </div>
        )}

        {/* Mobile Sticky Action Bar */}
        {!orderConfirmed && (
          product.is_client_work ? (
            <StickyBottomBar>
              <div>
                <span className="text-[10px] text-stone-500 block uppercase font-bold">Client Showcase</span>
                <span className="text-xs font-bold text-stone-900 truncate max-w-[180px] block">{product.client}</span>
              </div>
              <Link
                href={`/design-submission?preset=${encodeURIComponent(product.name)}&gsm=${product.gsm}&dimensions=${encodeURIComponent(product.dimensions || '')}&handle=${encodeURIComponent(product.handleType || '')}`}
                className="btn-primary touch-target text-xs px-6 py-2.5 flex items-center gap-1.5"
              >
                <PenTool size={14} />
                <span>Design Yours</span>
              </Link>
            </StickyBottomBar>
          ) : product.is_available !== false ? (
            <StickyBottomBar>
              <div>
                <span className="text-[10px] text-stone-500 block uppercase font-bold">Estimated</span>
                <span className="text-base font-bold text-[#8C4B31]">Total: {totalPrice} ETB</span>
              </div>
              <button
                onClick={() => {
                  const formEl = document.querySelector("form");
                  if (formEl) {
                    formEl.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="btn-primary touch-target text-xs px-6"
              >
                Order Now
              </button>
            </StickyBottomBar>
          ) : null
        )}
      </div>
    </div>
  );
}