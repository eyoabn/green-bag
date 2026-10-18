"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/components/CurrencyContext";
import { getCurrentUser, AppUser } from "@/utils/auth";
import { uploadFileSafely } from "@/utils/fileUpload";
import { 
  ShoppingBag, 
  ArrowLeft, 
  Building2, 
  Copy, 
  Check, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Truck, 
  ShieldCheck, 
  FileText,
  Clock,
  ArrowRight
} from "lucide-react";

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  instructions?: string;
  is_active: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, subtotal, updateQuantity, removeItem } = useCart();
  const { formatPrice } = useCurrency();

  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("Bole Subcity, Addis Ababa");
  const [phone, setPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [copiedBank, setCopiedBank] = useState(false);

  // Flow & Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  // Proof Upload State
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofError, setProofError] = useState("");
  const [proofSuccess, setProofSuccess] = useState(false);

  // 1. Load active bank accounts and current user
  useEffect(() => {
    async function initCheckout() {
      try {
        const u = await getCurrentUser();
        if (u) {
          setCurrentUser(u);
          if (u.phone) setPhone(u.phone);
        }

        // Fetch active bank accounts from API
        const res = await fetch("/api/bank-accounts");
        const data = await res.json();
        if (res.ok && data.bankAccounts) {
          const activeOnly = data.bankAccounts.filter((b: BankAccount) => b.is_active);
          setBanks(activeOnly);
          if (activeOnly.length > 0) {
            setSelectedBankId(activeOnly[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to initialize checkout:", err);
      }
    }
    initCheckout();
  }, []);

  const selectedBank = banks.find((b) => b.id === selectedBankId);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // 2. Handle Order Placement
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentUser) {
      alert("Please log in to complete checkout.");
      router.push("/login?returnTo=/checkout");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty. Please add packaging items first.");
      return;
    }

    if (!selectedBankId) {
      setError("Please select an active settlement bank account.");
      return;
    }

    if (!deliveryAddress || deliveryAddress.trim().length < 5) {
      setError("Please provide a valid delivery address (at least 5 characters).");
      return;
    }

    if (!phone || phone.trim().length < 6) {
      setError("Please enter a valid phone number (at least 6 digits).");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        bankAccountId: selectedBankId,
        deliveryAddress: deliveryAddress.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to place order.");
      }

      setCreatedOrder(resJson.order);
      clearCart();
    } catch (err: any) {
      setError(err.message || "An error occurred while creating your order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Payment Proof Upload
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder || !proofFile) return;

    setProofError("");

    // Validate size & type on client
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(proofFile.type)) {
      setProofError("Invalid file type. Only JPG, PNG, WEBP, and PDF files are accepted.");
      return;
    }

    if (proofFile.size > 5 * 1024 * 1024) {
      setProofError("File exceeds maximum allowed size of 5 MB.");
      return;
    }

    setIsUploadingProof(true);
    try {
      // Step A: Upload to private bucket safely with auto compression
      const uploadResult = await uploadFileSafely(proofFile, "payment-proofs");

      // Step B: Update order to pending_verification
      const patchRes = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: createdOrder.id,
          action: "upload_proof",
          paymentProofPath: uploadResult.filePath,
        }),
      });

      const patchText = await patchRes.text();
      let patchJson: any = {};
      try {
        patchJson = JSON.parse(patchText);
      } catch {
        throw new Error(patchText || `Server returned error (${patchRes.status})`);
      }

      if (!patchRes.ok) {
        throw new Error(patchJson.error || "Failed to link receipt to order.");
      }

      setProofSuccess(true);
      setCreatedOrder(patchJson.order);
    } catch (err: any) {
      setProofError(err.message || "Failed to submit payment proof.");
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Case 1: Post-Order Created State (Show Reference & Proof Upload)
  if (createdOrder) {
    return (
      <div className="flex flex-col min-h-screen pt-28 pb-20 bg-[#F9F6F0]">
        <div className="max-w-3xl mx-auto px-6 w-full">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-xl space-y-8">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#1E3B2E]">
                Order Confirmed
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                {proofSuccess ? "Payment Proof Submitted" : "Awaiting Bank Settlement"}
              </h1>
              <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto">
                {proofSuccess
                  ? "Your receipt has been submitted. Plant administrators will verify your transaction shortly."
                  : "Please complete your bank transfer using the generated order reference code."}
              </p>
            </div>

            {/* Crucial Order Reference Box */}
            <div className="bg-[#FAF7F2] p-6 rounded-2xl border-2 border-dashed border-[#1E3B2E]/30 text-center space-y-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                Official Payment Reference Note
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-black text-[#8C4B31] tracking-wider">
                  {createdOrder.order_number}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdOrder.order_number)}
                  className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors shadow-2xs"
                  title="Copy Order Reference"
                >
                  {copiedBank ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-stone-500 max-w-md mx-auto">
                IMPORTANT: Enter <strong className="text-stone-800">{createdOrder.order_number}</strong> into your mobile banking transfer description so our account managers can match your payment.
              </p>
            </div>

            {/* Bank Details Card */}
            {selectedBank && (
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
                  <span className="font-bold text-stone-700 flex items-center gap-2">
                    <Building2 size={16} className="text-[#8C4B31]" />
                    Settlement Bank:
                  </span>
                  <span className="font-bold text-stone-900 text-sm">{selectedBank.bank_name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Account Name:</span>
                  <span className="font-semibold text-stone-800">{selectedBank.account_name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Account Number:</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-stone-900 text-sm">
                    <span>{selectedBank.account_number}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedBank.account_number)}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200/80">
                  <span className="text-stone-500">Total Payable:</span>
                  <span className="font-serif text-lg font-bold text-[#8C4B31]">
                    {formatPrice(createdOrder.total_price)}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Proof Section */}
            {!proofSuccess ? (
              <form onSubmit={handleUploadProof} className="space-y-4 pt-2">
                <div className="border-t border-stone-200 pt-6">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-1">
                    <Upload size={16} className="text-[#1E3B2E]" />
                    <span>Upload Bank Transfer Receipt (Proof of Payment)</span>
                  </h3>
                  <p className="text-xs text-stone-500 mb-4">
                    Attach a screenshot or PDF of your CBE Birr, Telebirr, or Mobile Banking transfer receipt (max 5 MB).
                  </p>

                  {proofError && (
                    <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                      <AlertCircle size={15} className="text-red-600 shrink-0" />
                      <span>{proofError}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
                      className="text-xs text-stone-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1E3B2E] file:text-white hover:file:bg-[#8C4B31] file:cursor-pointer w-full"
                    />

                    <button
                      type="submit"
                      disabled={!proofFile || isUploadingProof}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#8C4B31] text-white text-xs font-bold hover:bg-[#6e3925] disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer shadow-xs"
                    >
                      {isUploadingProof ? "Uploading..." : "Submit Receipt"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>
                  Receipt uploaded! Your order status has transitioned to <strong>Under Verification</strong>.
                </span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-stone-200">
              <Link
                href={`/dashboard/orders/${createdOrder.id}`}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors text-center shadow-xs flex items-center justify-center gap-2"
              >
                <span>View Order Status & Timeline</span>
                <ArrowRight size={14} />
              </Link>

              <Link
                href="/dashboard/orders"
                className="text-xs text-stone-500 hover:text-stone-900 font-medium"
              >
                Go to My Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Cart is Empty
  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen pt-28 pb-20 bg-[#F9F6F0]">
        <div className="max-w-2xl mx-auto px-6 w-full text-center py-20">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-4">
            <ShoppingBag size={28} />
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Your Cart is Empty</h1>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-2 mb-8">
            You don&apos;t have any packaging items in your cart to checkout.
          </p>
          <Link
            href="/products"
            className="px-6 py-3 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors shadow-sm inline-flex items-center gap-2"
          >
            <span>Browse Product Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // Case 3: Standard Checkout Form
  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[#F9F6F0]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 w-full">
        
        {/* Navigation */}
        <Link 
          href="/products" 
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#8C4B31] transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Catalog</span>
        </Link>

        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Direct Manufacturer Checkout
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            Order Settlement & Delivery
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Official bank transfer checkout for Ethiopia Arenguade Paper Product PLC.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Delivery Address & Phone */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                <Truck size={18} className="text-[#1E3B2E]" />
                <h2 className="font-serif text-lg font-bold text-stone-900">1. Delivery Destination</h2>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Bole Subcity, Atlas Area, House #402, Addis Ababa"
                  className="w-full bg-[#FAF7F2] border border-stone-300 rounded-2xl px-4 py-3 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 transition-all"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Addis Ababa industrial zone & commercial dispatch directly from our plant.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 911 000 000"
                    className="w-full bg-[#FAF7F2] border border-stone-300 rounded-2xl px-4 py-3 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">
                    Special Packaging Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Delivery before 3 PM"
                    className="w-full bg-[#FAF7F2] border border-stone-300 rounded-2xl px-4 py-3 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Bank Account Selection */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                <Building2 size={18} className="text-[#8C4B31]" />
                <h2 className="font-serif text-lg font-bold text-stone-900">2. Select Settlement Bank</h2>
              </div>

              <p className="text-xs text-stone-500">
                Choose the official Ethiopia Arenguade corporate bank account you will transfer funds to:
              </p>

              {banks.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50 text-amber-800 text-xs">
                  Loading active settlement accounts...
                </div>
              ) : (
                <div className="space-y-3">
                  {banks.map((b) => {
                    const isSelected = selectedBankId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBankId(b.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? "border-[#1E3B2E] bg-[#1E3B2E]/5"
                            : "border-stone-200 hover:border-stone-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="bankAccount"
                            checked={isSelected}
                            onChange={() => setSelectedBankId(b.id)}
                            className="mt-1 text-[#1E3B2E] focus:ring-[#1E3B2E]"
                          />
                          <div>
                            <span className="font-bold text-xs text-stone-900 block">{b.bank_name}</span>
                            <span className="text-[11px] text-stone-500 block">{b.account_name}</span>
                            {b.instructions && (
                              <span className="text-[10px] text-stone-400 mt-1 block italic">
                                {b.instructions}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto pl-6 sm:pl-0">
                          <span className="font-mono text-xs font-bold text-stone-800 bg-white px-3 py-1 rounded-lg border border-stone-200">
                            {b.account_number}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(b.account_number);
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                            title="Copy Account Number"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm space-y-6 sticky top-28">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
                <ShoppingBag size={18} className="text-[#1E3B2E]" />
                <h2 className="font-serif text-lg font-bold text-stone-900">Order Summary</h2>
              </div>

              {/* Items List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-3 text-xs py-2 border-b border-stone-100 last:border-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                        <img src={item.image || "/images/photo_6_2026-09-05_00-36-03.jpg"} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-stone-900 truncate block">{item.name}</span>
                        <span className="text-[10px] text-stone-400">Qty: {item.quantity} bundle ({item.quantity * (item.bundleSize || 100)} pcs)</span>
                      </div>
                    </div>
                    <span className="font-bold text-stone-800 shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotal & Delivery Total */}
              <div className="space-y-2 pt-3 border-t border-stone-200/80 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Cart Subtotal</span>
                  <span className="font-semibold text-stone-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Addis Ababa Delivery</span>
                  <span className="font-semibold text-emerald-700">Included (Free)</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>VAT / Eco Tax</span>
                  <span className="font-semibold text-stone-800">Included in Price</span>
                </div>

                <div className="flex justify-between items-baseline pt-3 border-t border-stone-200">
                  <span className="font-bold text-stone-900 text-sm">Total Payable</span>
                  <span className="font-serif text-2xl font-bold text-[#8C4B31]">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>

              {/* Guarantee */}
              <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-stone-200/80 flex items-start gap-2 text-[11px] text-stone-600">
                <ShieldCheck size={16} className="text-[#1E3B2E] shrink-0 mt-0.5" />
                <span>
                  After clicking &ldquo;Place Order&rdquo;, your unique payment reference will be generated and settlement instructions presented.
                </span>
              </div>

              {/* Place Order CTA Button */}
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full py-4 rounded-full bg-[#1E3B2E] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#8C4B31] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
              >
                {isSubmitting ? (
                  <span>Generating Reference & Creating Order...</span>
                ) : (
                  <>
                    <span>Place Order & Generate Reference</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
