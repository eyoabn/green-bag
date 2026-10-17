"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  ShoppingBag, 
  Building2, 
  XCircle, 
  FileText,
  Truck,
  Package,
  Layers,
  Copy,
  Check
} from "lucide-react";

const ORDER_STEPS = [
  { key: "pending_payment", label: "Payment Required" },
  { key: "pending_verification", label: "Under Review" },
  { key: "approved", label: "Payment Verified" },
  { key: "in_production", label: "In Production" },
  { key: "ready", label: "Ready for Delivery" },
  { key: "completed", label: "Completed" },
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  // Upload re-submission state
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const resJson = await res.json();
      if (res.ok && resJson?.success && resJson.order) {
        setOrder(resJson.order);
      } else {
        throw new Error(resJson?.error || "Order not found");
      }
    } catch (err: any) {
      setError(err?.message || "Error retrieving order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "cancel" }),
      });
      const resJson = await res.json();
      if (res.ok && resJson?.success) {
        fetchOrder();
        setActionSuccess("Your order has been cancelled.");
        setTimeout(() => setActionSuccess(""), 4000);
      } else {
        alert(resJson?.error || "Failed to cancel order");
      }
    } catch (err: any) {
      alert(err?.message || "Error cancelling order");
    }
  };

  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setIsUploading(true);
    setUploadError("");

    try {
      // 1. Upload proof to private bucket
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("bucket", "payment-proofs");

      const upRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const upJson = await upRes.json();

      if (!upRes.ok || !upJson.filePath) {
        throw new Error(upJson.error || "Failed to upload payment proof");
      }

      // 2. Patch order with path
      const patchRes = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          action: "upload_proof",
          paymentProofPath: upJson.filePath,
        }),
      });
      const patchJson = await patchRes.json();

      if (!patchRes.ok) {
        throw new Error(patchJson.error || "Failed to submit verification request");
      }

      setFileToUpload(null);
      fetchOrder();
      setActionSuccess("Receipt uploaded! Order is now under verification by plant administrators.");
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload receipt");
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-500 text-xs">
        <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading order timeline...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-3xl bg-red-50 border border-red-200 text-center space-y-3">
        <AlertCircle size={32} className="text-red-600 mx-auto" />
        <h3 className="font-serif text-lg font-bold text-red-900">Order Not Found</h3>
        <p className="text-xs text-red-700">{error || "Unable to view requested order"}</p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2 bg-[#1E3B2E] text-white text-xs font-bold rounded-full"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const currentStepIdx = ORDER_STEPS.findIndex(s => s.key === order.status);
  const isRejected = order.status === "rejected";
  const isCancelled = order.status === "cancelled";
  const canCancel = ["pending_payment", "pending_verification"].includes(order.status);
  const needsProof = ["pending_payment", "rejected"].includes(order.status);

  return (
    <div className="flex flex-col max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Back button & Title */}
      <div>
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 mb-2 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
                Order {order.order_number}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                order.status === "completed"
                  ? "bg-emerald-100 text-emerald-800"
                  : order.status === "approved" || order.status === "in_production"
                  ? "bg-blue-100 text-blue-800"
                  : order.status === "rejected" || order.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {order.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {canCancel && (
            <button
              onClick={handleCancel}
              className="text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-full transition-colors self-start sm:self-auto cursor-pointer"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Visual Timeline Stepper */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
        <h3 className="font-serif text-base font-bold text-stone-900 mb-4">
          Production & Fulfillment Status
        </h3>

        {isCancelled ? (
          <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 text-stone-600 text-xs flex items-center gap-2">
            <XCircle size={18} className="text-stone-500 shrink-0" />
            <span>This order was cancelled. No production will take place.</span>
          </div>
        ) : isRejected ? (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Payment Receipt Rejected</p>
              <p className="text-[11px] text-red-700 mt-0.5">
                Reason: &ldquo;{order.rejection_reason || "Receipt illegible or transfer reference mismatch"}&rdquo;
              </p>
              <p className="text-[11px] text-stone-600 mt-1">
                Please review your bank transfer and upload a clear screenshot or PDF receipt below.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
            {ORDER_STEPS.map((step, idx) => {
              const isPassed = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    isPassed
                      ? "bg-[#1E3B2E] text-white"
                      : "bg-stone-100 text-stone-400"
                  } ${isCurrent ? "ring-4 ring-[#8C4B31]/30 font-black" : ""}`}>
                    {isPassed ? <Check size={14} /> : idx + 1}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 ${
                    isCurrent ? "text-[#8C4B31]" : isPassed ? "text-stone-800" : "text-stone-400"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload/Re-upload Payment Proof Area */}
      {needsProof && !isCancelled && (
        <div className="bg-[#FAF7F2] rounded-3xl border border-[#8C4B31]/30 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={18} className="text-[#8C4B31]" />
            <h3 className="font-serif text-base font-bold text-stone-900">
              Payment Transfer Instructions
            </h3>
          </div>

          {order.bank_accounts && (
            <div className="bg-white rounded-2xl p-4 border border-stone-200 mt-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Bank / Channel:</span>
                <span className="font-bold text-stone-900">{order.bank_accounts.bank_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Account Name:</span>
                <span className="font-bold text-stone-900">{order.bank_accounts.account_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Account Number:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-[#1E3B2E]">
                  <span>{order.bank_accounts.account_number}</span>
                  <button
                    onClick={() => copyToClipboard(order.bank_accounts.account_number)}
                    className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-600 cursor-pointer"
                    title="Copy Account Number"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Total Amount Due:</span>
                <span className="font-bold text-[#8C4B31] text-sm font-mono">
                  {Number(order.total_price).toLocaleString()} ETB
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-stone-100 pt-2">
                <span className="text-stone-500">Payment Reference:</span>
                <span className="font-mono font-bold text-stone-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {order.order_number}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleUploadProof} className="mt-4 space-y-3">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Upload Bank Transfer Receipt (Screenshot or PDF)
            </label>

            {uploadError && (
              <p className="text-xs text-red-600">{uploadError}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="file"
                required
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                className="w-full text-xs text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1E3B2E] file:text-white hover:file:bg-[#8C4B31] cursor-pointer"
              />

              <button
                type="submit"
                disabled={!fileToUpload || isUploading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#8C4B31] hover:bg-[#1E3B2E] text-white text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Submit Receipt for Verification"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ordered Items Table */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
        <h3 className="font-serif text-base font-bold text-stone-900 mb-4">
          Ordered Products & Price Snapshots
        </h3>

        <div className="divide-y divide-stone-100 text-xs">
          {(order.order_items || []).map((item: any) => {
            const product = item.products || {};
            const itemTotal = Number(item.unit_price_snapshot) * item.quantity;
            return (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 overflow-hidden shrink-0">
                    <img
                      src={product.images?.[0] || "/images/photo_6_2026-09-05_00-36-03.jpg"}
                      alt={product.name || "Product"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">{product.name || "Custom Kraft Product"}</p>
                    <p className="text-[11px] text-stone-500">
                      {item.quantity} bundles × {item.unit_price_snapshot} ETB (Price Snapshot)
                    </p>
                  </div>
                </div>

                <span className="font-mono font-bold text-stone-900">
                  {itemTotal.toLocaleString()} ETB
                </span>
              </div>
            );
          })}
        </div>

        <div className="border-t border-stone-200 mt-4 pt-3 flex justify-between items-center text-sm">
          <span className="font-bold text-stone-700">Total Order Amount</span>
          <span className="font-mono font-bold text-lg text-[#8C4B31]">
            {Number(order.total_price).toLocaleString()} ETB
          </span>
        </div>
      </div>

      {/* Delivery & Shipping Info */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <span className="block font-bold text-stone-400 uppercase tracking-wider text-[10px] mb-1">
            Delivery Address
          </span>
          <p className="text-stone-800 font-medium leading-relaxed">
            {order.delivery_address}
          </p>
        </div>

        <div>
          <span className="block font-bold text-stone-400 uppercase tracking-wider text-[10px] mb-1">
            Recipient Contact
          </span>
          <p className="text-stone-800 font-medium">
            {order.profiles?.full_name || "Valued Customer"} • {order.phone}
          </p>
          {order.notes && (
            <p className="text-stone-500 text-[11px] mt-1 italic">
              Note: {order.notes}
            </p>
          )}
        </div>
      </div>

      {/* Chronological Status History */}
      {order.order_status_history && order.order_status_history.length > 0 && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
          <h3 className="font-serif text-base font-bold text-stone-900 mb-3">
            Status Audit History
          </h3>
          <div className="space-y-2 text-xs">
            {order.order_status_history.map((h: any) => (
              <div key={h.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between">
                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-[#1E3B2E]">
                    {h.to_status.replace("_", " ")}
                  </span>
                  {h.note && (
                    <p className="text-[11px] text-stone-600 mt-0.5">{h.note}</p>
                  )}
                </div>
                <span className="text-[10px] text-stone-400 font-mono">
                  {new Date(h.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
