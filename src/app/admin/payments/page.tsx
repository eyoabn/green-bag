"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Receipt, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Search, 
  Clock, 
  AlertCircle, 
  Building2, 
  GraduationCap, 
  ShoppingBag,
  ZoomIn,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Calendar,
  FileText
} from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";

interface QueueItem {
  id: string;
  type: "order" | "enrollment";
  ref: string;
  amount: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentProofPath?: string;
  bankName?: string;
  createdAt: string;
  status: string;
  details: string;
}

export default function AdminPaymentsPage() {
  const [filterType, setFilterType] = useState<"all" | "order" | "enrollment">("all");
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [rawEnrollments, setRawEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Current active item index in queue
  const [currentIndex, setCurrentIndex] = useState(0);

  // Signed URL Cache
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingProof, setLoadingProof] = useState(false);

  // Rejection Bottom Sheet
  const [rejectSheetOpen, setRejectSheetOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Lightbox for proof zoom
  const [zoomOpen, setZoomOpen] = useState(false);

  const fetchQueues = async () => {
    setLoading(true);
    setError("");
    try {
      const [orderRes, enrollRes] = await Promise.all([
        fetch("/api/orders?status=pending_verification"),
        fetch("/api/enrollments?status=pending_verification"),
      ]);

      const [orderJson, enrollJson] = await Promise.all([
        orderRes.json(),
        enrollRes.json(),
      ]);

      if (orderRes.ok && orderJson.orders) setRawOrders(orderJson.orders);
      if (enrollRes.ok && enrollJson.enrollments) setRawEnrollments(enrollJson.enrollments);
    } catch (err: any) {
      setError(err.message || "Failed to load payment verification queues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  // Normalize into one unified queue
  const unifiedQueue: QueueItem[] = useMemo(() => {
    const list: QueueItem[] = [];

    rawOrders.forEach((o) => {
      list.push({
        id: o.id,
        type: "order",
        ref: `Order #${o.order_number || o.id.substring(0, 8)}`,
        amount: Number(o.total_price) || 0,
        customerName: o.profiles?.full_name || "Customer",
        customerPhone: o.profiles?.phone || o.phone,
        customerEmail: o.profiles?.email,
        paymentProofPath: o.payment_proof_path,
        bankName: o.bank_accounts?.bank_name || "Bank Transfer",
        createdAt: o.created_at,
        status: o.status,
        details: o.order_items?.map((i: any) => `${i.quantity}x ${i.products?.name || "Bespoke Bag"}`).join(", ") || "Packaging order",
      });
    });

    rawEnrollments.forEach((e) => {
      list.push({
        id: e.id,
        type: "enrollment",
        ref: `Workshop: ${e.class_sessions?.title || "Class"}`,
        amount: Number(e.class_sessions?.price) || 0,
        customerName: e.profiles?.full_name || "Student",
        customerPhone: e.profiles?.phone,
        customerEmail: e.profiles?.email,
        paymentProofPath: e.payment_proof_path,
        bankName: "Tuition Settlement",
        createdAt: e.created_at,
        status: e.status,
        details: `${e.class_sessions?.title || "Class"} (${e.class_sessions?.type === "live" ? "Live Stream" : "Studio In-Person"})`,
      });
    });

    return list.filter((item) => filterType === "all" || item.type === filterType);
  }, [rawOrders, rawEnrollments, filterType]);

  const activeItem = unifiedQueue[currentIndex] || null;

  // Load signed proof url whenever active item changes
  useEffect(() => {
    if (!activeItem || !activeItem.paymentProofPath) return;
    const path = activeItem.paymentProofPath;
    if (signedUrls[path]) return;

    setLoadingProof(true);
    fetch(`/api/storage/signed-url?bucket=payment-proofs&path=${encodeURIComponent(path)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.signedUrl) {
          setSignedUrls((prev) => ({ ...prev, [path]: data.signedUrl }));
        }
      })
      .catch((e) => console.error("Error signing proof URL:", e))
      .finally(() => setLoadingProof(false));
  }, [activeItem, signedUrls]);

  const handleApprove = async () => {
    if (!activeItem) return;
    try {
      const endpoint = activeItem.type === "order" ? "/api/orders" : "/api/enrollments";
      const body = activeItem.type === "order"
        ? { orderId: activeItem.id, action: "approve" }
        : { enrollmentId: activeItem.id, action: "approve" };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setActionSuccess(`Approved payment for ${activeItem.ref}`);
        setTimeout(() => setActionSuccess(""), 4000);
        // Refresh and stay at valid index
        await fetchQueues();
        if (currentIndex >= unifiedQueue.length - 1 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      } else {
        alert(resJson.error || "Approval failed");
      }
    } catch (err: any) {
      alert(err.message || "Error approving payment");
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !rejectionReason.trim()) return;

    setIsSubmittingReject(true);
    try {
      const endpoint = activeItem.type === "order" ? "/api/orders" : "/api/enrollments";
      const body = activeItem.type === "order"
        ? { orderId: activeItem.id, action: "reject", rejectionReason: rejectionReason.trim() }
        : { enrollmentId: activeItem.id, action: "reject", rejectionReason: rejectionReason.trim() };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setRejectSheetOpen(false);
        setRejectionReason("");
        setActionSuccess(`Rejected payment for ${activeItem.ref}. Customer notified.`);
        setTimeout(() => setActionSuccess(""), 4000);
        await fetchQueues();
        if (currentIndex >= unifiedQueue.length - 1 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      } else {
        alert(resJson.error || "Rejection failed");
      }
    } catch (err: any) {
      alert(err.message || "Error rejecting payment");
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const activeSignedUrl = activeItem?.paymentProofPath ? signedUrls[activeItem.paymentProofPath] : null;

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-6 pb-28 md:pb-12">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Financial Settlement Verification
          </span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
          Payment Verification Queue
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Verify banking slips (CBE, Telebirr, Awash) one at a time with instant approval and queue cycling.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
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

      {/* Filter Chips Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar touch-scroll">
          {[
            { id: "all", label: `All Inbound (${rawOrders.length + rawEnrollments.length})` },
            { id: "order", label: `Retail Orders (${rawOrders.length})` },
            { id: "enrollment", label: `Workshop Tuition (${rawEnrollments.length})` },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => {
                setFilterType(chip.id as any);
                setCurrentIndex(0);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors touch-target flex items-center ${
                filterType === chip.id
                  ? "bg-[#1E3B2E] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {unifiedQueue.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-stone-500">
            <span>{currentIndex + 1} of {unifiedQueue.length}</span>
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-30 touch-target flex items-center justify-center"
              title="Previous Receipt"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(unifiedQueue.length - 1, prev + 1))}
              disabled={currentIndex >= unifiedQueue.length - 1}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-30 touch-target flex items-center justify-center"
              title="Next Receipt"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
          <Clock size={28} className="animate-spin text-[#1E3B2E] mx-auto mb-2" />
          <p className="text-xs font-semibold text-stone-600">Loading payment queue...</p>
        </div>
      ) : unifiedQueue.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-2">
          <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
          <h3 className="font-serif text-xl font-bold text-stone-900">Queue is Clear</h3>
          <p className="text-xs text-stone-500">All customer bank settlement proofs have been reviewed.</p>
        </div>
      ) : (
        /* Split view on desktop / Stacked focus on mobile */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Queue List (Desktop only) */}
          <div className="hidden lg:block lg:col-span-4 bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-100">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Pending Verification ({unifiedQueue.length})
              </span>
            </div>
            <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
              {unifiedQueue.map((item, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full text-left p-4 transition-colors flex items-center justify-between ${
                      isSelected ? "bg-stone-100/90 font-bold" : "hover:bg-stone-50"
                    }`}
                  >
                    <div>
                      <span className="text-xs text-stone-900 block truncate max-w-[180px]">
                        {item.ref}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {item.customerName} • {item.amount} ETB
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      item.type === "order" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {item.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right/Main: Single Item Review Focus */}
          <div className="lg:col-span-8 space-y-4">
            {activeItem && (
              <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm">
                
                {/* Item Summary Header */}
                <div className="p-5 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        activeItem.type === "order" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {activeItem.type === "order" ? "Retail Order" : "Workshop Tuition"}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        {new Date(activeItem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="font-serif text-xl font-bold text-stone-900 mt-1">
                      {activeItem.ref}
                    </h2>
                    <p className="text-xs text-stone-600 mt-0.5">
                      {activeItem.details}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-bold">
                      Settlement Amount
                    </span>
                    <span className="font-serif text-2xl font-bold text-stone-900">
                      {activeItem.amount} <span className="text-xs font-sans font-normal text-stone-500">ETB</span>
                    </span>
                  </div>
                </div>

                {/* Customer Details Strip */}
                <div className="px-5 py-3 bg-[#FAF7F2] border-b border-stone-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-bold block">Payer</span>
                    <span className="font-bold text-stone-900">{activeItem.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-bold block">Phone</span>
                    <span className="font-mono text-stone-900">{activeItem.customerPhone || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-bold block">Channel</span>
                    <span className="text-stone-900">{activeItem.bankName}</span>
                  </div>
                </div>

                {/* Receipt Image Area (Large) */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                      Bank Transaction Slip / SMS Screenshot
                    </span>
                    {activeSignedUrl && (
                      <button
                        onClick={() => setZoomOpen(true)}
                        className="text-xs text-[#1E3B2E] font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <ZoomIn size={14} />
                        <span>Enlarge Receipt</span>
                      </button>
                    )}
                  </div>

                  <div className="w-full min-h-[300px] max-h-[460px] bg-stone-950 rounded-2xl flex items-center justify-center overflow-hidden border border-stone-300 relative">
                    {loadingProof ? (
                      <div className="text-stone-400 text-xs flex items-center gap-2">
                        <Clock size={16} className="animate-spin" />
                        <span>Fetching secure preview...</span>
                      </div>
                    ) : activeSignedUrl ? (
                      <img
                        src={activeSignedUrl}
                        alt="Transaction Receipt"
                        onClick={() => setZoomOpen(true)}
                        className="w-full h-full object-contain max-h-[450px] cursor-zoom-in"
                      />
                    ) : (
                      <div className="text-stone-400 text-xs">
                        No receipt image attached to this record.
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop Action Bar */}
                <div className="p-5 border-t border-stone-100 hidden md:flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span>Receipt #{currentIndex + 1} of {unifiedQueue.length}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRejectSheetOpen(true)}
                      className="btn-destructive px-5 py-2.5 text-xs font-bold cursor-pointer"
                    >
                      <XCircle size={15} />
                      <span>Reject Receipt</span>
                    </button>
                    <button
                      onClick={handleApprove}
                      className="btn-primary px-8 py-2.5 text-xs font-bold cursor-pointer"
                    >
                      <CheckCircle2 size={16} />
                      <span>Approve Settlement</span>
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Sticky Action Bar */}
      {activeItem && (
        <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 shadow-lg flex items-center justify-between gap-3">
          <button
            onClick={() => setRejectSheetOpen(true)}
            className="btn-destructive flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <XCircle size={16} />
            <span>Reject</span>
          </button>
          <button
            onClick={handleApprove}
            className="btn-primary flex-[2] py-3 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>Approve</span>
          </button>
        </div>
      )}

      {/* Reject Reason Bottom Sheet */}
      <BottomSheet
        isOpen={rejectSheetOpen}
        onClose={() => setRejectSheetOpen(false)}
        title="Reason for Rejection"
        description="Explain why this transfer slip cannot be verified so the client can re-upload."
      >
        <form onSubmit={handleConfirmReject} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-2">
              Rejection Reason *
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Transaction reference illegible; please upload complete CBE Birr screenshot showing timestamp."
              className="form-input text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectSheetOpen(false)}
              className="btn-secondary px-4 py-2.5 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReject || !rejectionReason.trim()}
              className="btn-destructive px-5 py-2.5 text-xs font-bold"
            >
              {isSubmittingReject ? "Notifying Client..." : "Confirm Rejection"}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Lightbox Zoom Modal */}
      {zoomOpen && activeSignedUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setZoomOpen(false)}
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-stone-800 hover:bg-stone-700 touch-target flex items-center justify-center"
          >
            <X size={24} />
          </button>
          <img
            src={activeSignedUrl}
            alt="Enlarged Receipt"
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
          />
        </div>
      )}

    </div>
  );
}
