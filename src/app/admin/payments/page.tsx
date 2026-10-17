"use client";

import { useState, useEffect } from "react";
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
  ExternalLink
} from "lucide-react";

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "enrollments">("orders");
  const [statusFilter, setStatusFilter] = useState("pending_verification");
  const [orders, setOrders] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Rejection Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<{ id: string; type: "order" | "enrollment"; ref: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Zoomable Proof Lightbox Modal
  const [lightboxProof, setLightboxProof] = useState<{ url: string; title: string } | null>(null);
  const [loadingProofUrl, setLoadingProofUrl] = useState<string | null>(null);

  const fetchQueues = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Orders
      const orderRes = await fetch(`/api/orders?status=${statusFilter}`);
      const orderJson = await orderRes.json();
      if (orderRes.ok && orderJson.orders) {
        setOrders(orderJson.orders);
      }

      // 2. Fetch Enrollments
      const enrollRes = await fetch(`/api/enrollments?status=${statusFilter}`);
      const enrollJson = await enrollRes.json();
      if (enrollRes.ok && enrollJson.enrollments) {
        setEnrollments(enrollJson.enrollments);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load payment verification queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, [statusFilter]);

  const openSignedProof = async (path: string, title: string) => {
    setLoadingProofUrl(path);
    try {
      const res = await fetch(`/api/storage/signed-url?bucket=payment-proofs&path=${encodeURIComponent(path)}`);
      const resJson = await res.json();
      if (res.ok && resJson.signedUrl) {
        setLightboxProof({ url: resJson.signedUrl, title });
      } else {
        alert(resJson.error || "Failed to load signed receipt preview");
      }
    } catch (err: any) {
      alert("Error generating secure signed preview URL");
    } finally {
      setLoadingProofUrl(null);
    }
  };

  const handleApprove = async (id: string, type: "order" | "enrollment", ref: string) => {
    if (!confirm(`Confirm payment approval for ${ref}?`)) return;
    try {
      const endpoint = type === "order" ? "/api/orders" : "/api/enrollments";
      const body = type === "order" 
        ? { orderId: id, action: "approve" }
        : { enrollmentId: id, action: "approve" };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        fetchQueues();
        setActionSuccess(`Payment for ${ref} approved successfully!`);
        setTimeout(() => setActionSuccess(""), 4000);
      } else {
        alert(resJson.error || "Approval failed");
      }
    } catch (err: any) {
      alert(err.message || "Error approving payment");
    }
  };

  const openRejectModal = (id: string, type: "order" | "enrollment", ref: string) => {
    setTargetItem({ id, type, ref });
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItem || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    try {
      const endpoint = targetItem.type === "order" ? "/api/orders" : "/api/enrollments";
      const body = targetItem.type === "order"
        ? { orderId: targetItem.id, action: "reject", rejectionReason: rejectionReason.trim() }
        : { enrollmentId: targetItem.id, action: "reject", rejectionReason: rejectionReason.trim() };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        setRejectModalOpen(false);
        fetchQueues();
        setActionSuccess(`Payment rejected for ${targetItem.ref}. Customer notified with reason.`);
        setTimeout(() => setActionSuccess(""), 4000);
      } else {
        alert(resJson.error || "Rejection failed");
      }
    } catch (err: any) {
      alert(err.message || "Error rejecting payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingOrdersCount = orders.filter(o => o.status === "pending_verification").length;
  const pendingEnrollCount = enrollments.filter(e => e.status === "pending_verification").length;

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-6">
      
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
          Inspect uploaded customer CBE / Telebirr bank receipts with inline zoom, approve settlement, or reject with mandatory rationale.
        </p>
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

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200 shadow-xs">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "orders"
                ? "bg-[#1E3B2E] text-white shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <ShoppingBag size={14} />
            <span>Orders Queue</span>
            {pendingOrdersCount > 0 && (
              <span className="bg-[#8C4B31] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("enrollments")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "enrollments"
                ? "bg-[#1E3B2E] text-white shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <GraduationCap size={14} />
            <span>Class Enrollments</span>
            {pendingEnrollCount > 0 && (
              <span className="bg-[#8C4B31] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingEnrollCount}
              </span>
            )}
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "pending_verification", label: "Needs Verification" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
            { key: "all", label: "All Records" },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st.key
                  ? "bg-[#8C4B31] text-white shadow-xs"
                  : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Queue Body */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-stone-400 text-xs">
            <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading verification queue...
          </div>
        ) : activeTab === "orders" ? (
          /* Orders Queue */
          orders.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs bg-white rounded-3xl border border-stone-200 p-8">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
              <p className="font-serif text-sm font-bold text-stone-800">Queue is Clear</p>
              <p className="text-[11px] text-stone-500 mt-0.5">No orders currently awaiting payment verification.</p>
            </div>
          ) : (
            orders.map((order) => {
              const isPending = order.status === "pending_verification";
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-md">
                        {order.order_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        order.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                        order.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {order.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(order.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs">
                      <span className="font-bold text-stone-800">{order.profiles?.full_name || "Customer"}</span>
                      <span className="text-stone-400 mx-1.5">•</span>
                      <span className="text-stone-600 font-mono">{order.phone}</span>
                      <span className="text-stone-400 mx-1.5">•</span>
                      <span className="text-stone-500">{order.delivery_address}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="font-mono font-bold text-[#8C4B31] text-sm">
                        {Number(order.total_price).toLocaleString()} ETB
                      </span>
                      <span className="text-stone-400">Target Bank:</span>
                      <span className="font-semibold text-stone-700">{order.bank_accounts?.bank_name || "Direct CBE"}</span>
                    </div>

                    {order.rejection_reason && (
                      <p className="text-[11px] text-red-700 italic">
                        Rejection Reason: &ldquo;{order.rejection_reason}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Proof Viewer & Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0">
                    {order.payment_proof_path ? (
                      <button
                        onClick={() => openSignedProof(order.payment_proof_path, `Receipt: ${order.order_number}`)}
                        disabled={loadingProofUrl === order.payment_proof_path}
                        className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ZoomIn size={14} className="text-[#8C4B31]" />
                        <span>{loadingProofUrl === order.payment_proof_path ? "Loading..." : "Inspect Proof"}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone-400 italic">No receipt uploaded</span>
                    )}

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(order.id, "order", order.order_number)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => openRejectModal(order.id, "order", order.order_number)}
                          className="px-3.5 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* Enrollments Queue */
          enrollments.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs bg-white rounded-3xl border border-stone-200 p-8">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
              <p className="font-serif text-sm font-bold text-stone-800">Enrollment Queue is Clear</p>
              <p className="text-[11px] text-stone-500 mt-0.5">No student registrations pending verification.</p>
            </div>
          ) : (
            enrollments.map((enr) => {
              const isPending = enr.status === "pending_verification";
              const classTitle = enr.class_sessions?.title || "Workshop";
              return (
                <div
                  key={enr.id}
                  className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        enr.class_sessions?.type === "live" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {enr.class_sessions?.type || "class"}
                      </span>
                      <h4 className="font-serif text-sm font-bold text-stone-900 truncate max-w-sm">
                        {classTitle}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        enr.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                        enr.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {enr.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="text-xs">
                      <span className="font-bold text-stone-800">{enr.profiles?.full_name || "Student"}</span>
                      <span className="text-stone-400 mx-1.5">•</span>
                      <span className="text-stone-600 font-mono">{enr.profiles?.email}</span>
                      <span className="text-stone-400 mx-1.5">•</span>
                      <span className="text-stone-500">{enr.profiles?.phone || "No phone"}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="font-mono font-bold text-[#8C4B31] text-sm">
                        {Number(enr.class_sessions?.price || 0).toLocaleString()} ETB
                      </span>
                      <span className="text-stone-400">Class Date:</span>
                      <span className="font-semibold text-stone-700">
                        {enr.class_sessions?.starts_at ? new Date(enr.class_sessions.starts_at).toLocaleDateString() : "Scheduled"}
                      </span>
                    </div>

                    {enr.rejection_reason && (
                      <p className="text-[11px] text-red-700 italic">
                        Rejection Reason: &ldquo;{enr.rejection_reason}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Proof Viewer & Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0">
                    {enr.payment_proof_path ? (
                      <button
                        onClick={() => openSignedProof(enr.payment_proof_path, `Student Receipt: ${classTitle}`)}
                        disabled={loadingProofUrl === enr.payment_proof_path}
                        className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ZoomIn size={14} className="text-[#8C4B31]" />
                        <span>{loadingProofUrl === enr.payment_proof_path ? "Loading..." : "Inspect Proof"}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone-400 italic">No receipt uploaded</span>
                    )}

                    {isPending && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(enr.id, "enrollment", `Seat for ${enr.profiles?.full_name}`)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Approve Seat</span>
                        </button>

                        <button
                          onClick={() => openRejectModal(enr.id, "enrollment", `Seat for ${enr.profiles?.full_name}`)}
                          className="px-3.5 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* Reject Modal with Mandatory Reason */}
      {rejectModalOpen && targetItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-stone-200 shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-stone-400 hover:bg-stone-100 text-stone-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-red-100 text-red-800">
                <XCircle size={18} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">Reject Payment Proof</h3>
                <p className="text-[11px] text-stone-500">Specify reason to notify customer for re-upload</p>
              </div>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1 text-[10px]">
                  Reason for Rejection (Mandatory)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Receipt amount does not match order total, or CBE reference number is illegible."
                  className="w-full border border-stone-300 rounded-xl p-3 bg-[#FAF7F2] text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-600/30"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rejectionReason.trim() || isSubmitting}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Inline Zoomable Proof Viewer */}
      {lightboxProof && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 border border-stone-200 shadow-2xl relative max-h-[92vh] flex flex-col animate-fadeIn">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif text-base font-bold text-stone-900">
                {lightboxProof.title}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxProof.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#1E3B2E] hover:underline flex items-center gap-1"
                >
                  <span>Open Fullscreen</span>
                  <ExternalLink size={13} />
                </a>
                <button
                  onClick={() => setLightboxProof(null)}
                  className="p-1 rounded-full text-stone-400 hover:bg-stone-100 text-stone-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto my-4 flex items-center justify-center bg-stone-100 rounded-2xl p-2 min-h-[350px]">
              {lightboxProof.url.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={lightboxProof.url}
                  className="w-full h-[500px] rounded-xl"
                  title="PDF Receipt"
                />
              ) : (
                <img
                  src={lightboxProof.url}
                  alt="Payment Receipt Screenshot"
                  className="max-h-[550px] w-auto object-contain rounded-xl shadow-sm"
                />
              )}
            </div>

            <div className="pt-2 text-center text-[11px] text-stone-400">
              Signed URL protected by 15-minute token TTL.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
