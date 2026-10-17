"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ArrowRight, 
  Upload, 
  Package, 
  Filter, 
  Search,
  Truck,
  RotateCcw
} from "lucide-react";
import { useCurrency } from "@/components/CurrencyContext";

interface OrderRecord {
  id: string;
  order_number: string;
  buyer_id: string;
  status: string;
  total_price: number;
  delivery_address: string;
  phone: string;
  notes?: string;
  payment_proof_path?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  bank_accounts?: {
    bank_name: string;
    account_number: string;
  };
  order_items?: Array<{
    id: string;
    quantity: number;
    unit_price_snapshot: number;
    products?: {
      name: string;
      images?: string[];
      category?: string;
    };
  }>;
}

export default function CustomerOrdersListPage() {
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders?status=${statusFilter}`);
      const data = await res.json();
      if (res.ok && data.orders) {
        setOrders(data.orders);
      } else {
        throw new Error(data.error || "Failed to load orders");
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve your orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to cancel order ${orderNumber}?`)) return;

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "cancel" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionSuccess(`Order ${orderNumber} has been cancelled.`);
        fetchOrders();
        setTimeout(() => setActionSuccess(""), 4000);
      } else {
        alert(data.error || "Failed to cancel order");
      }
    } catch (err: any) {
      alert("Error cancelling order");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.delivery_address.toLowerCase().includes(q) ||
      o.order_items?.some(i => i.products?.name?.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_payment":
        return {
          label: "Payment Required",
          className: "bg-amber-50 text-amber-800 border-amber-200",
          icon: Clock,
        };
      case "pending_verification":
        return {
          label: "Under Verification",
          className: "bg-blue-50 text-blue-800 border-blue-200",
          icon: Clock,
        };
      case "approved":
        return {
          label: "Payment Verified",
          className: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: CheckCircle2,
        };
      case "in_production":
        return {
          label: "In Production",
          className: "bg-purple-50 text-purple-800 border-purple-200",
          icon: Package,
        };
      case "ready":
        return {
          label: "Ready for Delivery",
          className: "bg-indigo-50 text-indigo-800 border-indigo-200",
          icon: Truck,
        };
      case "completed":
        return {
          label: "Completed",
          className: "bg-emerald-100 text-emerald-900 border-emerald-300",
          icon: CheckCircle2,
        };
      case "rejected":
        return {
          label: "Proof Rejected",
          className: "bg-red-50 text-red-800 border-red-200",
          icon: AlertCircle,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          className: "bg-stone-100 text-stone-600 border-stone-200",
          icon: XCircle,
        };
      default:
        return {
          label: status.replace("_", " "),
          className: "bg-stone-100 text-stone-700 border-stone-200",
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Customer Portal
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            My Packaging Orders
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Track your custom print orders, upload bank transfer receipts, and view live production updates.
          </p>
        </div>

        <Link
          href="/products"
          className="px-5 py-2.5 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ShoppingBag size={14} />
          <span>Order More Bags</span>
        </Link>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200/90 shadow-xs">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Orders" },
            { id: "pending_payment", label: "Payment Required" },
            { id: "pending_verification", label: "Under Review" },
            { id: "approved", label: "Approved" },
            { id: "in_production", label: "In Production" },
            { id: "completed", label: "Completed" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[#1E3B2E] text-white shadow-xs"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search order #, items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-stone-200 rounded-full pl-9 pr-4 py-1.5 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-stone-500 bg-white rounded-3xl border border-stone-200 p-8">
          <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading your order history from PostgreSQL...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-3">
            <ShoppingBag size={24} />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-800">No orders found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-6">
            {searchTerm || statusFilter !== "all"
              ? "No orders match your filter criteria."
              : "You have not placed any packaging orders yet. Explore our sustainable paper bag catalog."}
          </p>
          <Link
            href="/products"
            className="px-5 py-2.5 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <span>Browse Products</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const BadgeIcon = badge.icon;
            const canCancel = ["pending_payment", "pending_verification"].includes(order.status);
            const needsProof = order.status === "pending_payment" || order.status === "rejected";

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Top Row: Order # and Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#1E3B2E]/10 text-[#1E3B2E] flex items-center justify-center shrink-0">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-stone-900">
                          {order.order_number}
                        </span>
                        <span className="text-[11px] text-stone-400 font-normal">
                          • {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-xs text-stone-500 block truncate max-w-xs sm:max-w-md">
                        {order.delivery_address || "Addis Ababa Delivery"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.className}`}>
                      <BadgeIcon size={12} />
                      <span>{badge.label}</span>
                    </span>
                    <span className="font-serif text-lg font-bold text-[#8C4B31]">
                      {formatPrice(order.total_price)}
                    </span>
                  </div>
                </div>

                {/* Rejection Alert Banner */}
                {order.status === "rejected" && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Payment Proof Rejected: </strong>
                      <span>{order.rejection_reason || "Receipt illegible or amount mismatched."}</span>
                      <p className="text-[11px] text-red-700 mt-1">
                        Please click below to inspect and re-upload your valid bank transfer receipt.
                      </p>
                    </div>
                  </div>
                )}

                {/* Items Preview */}
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                  {order.order_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200/80 shrink-0 text-xs"
                    >
                      <span className="font-bold text-stone-800">
                        {item.products?.name || "Artisan Kraft Bag"}
                      </span>
                      <span className="text-stone-400">×{item.quantity}</span>
                      <span className="text-[#1E3B2E] font-medium font-mono text-[11px]">
                        ({formatPrice(item.unit_price_snapshot * item.quantity)})
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
                  <div className="flex items-center gap-2 text-stone-500">
                    <span>Settlement: <strong>{order.bank_accounts?.bank_name || "Bank Transfer"}</strong></span>
                    {order.payment_proof_path && (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                        ✓ Proof Uploaded
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order.id, order.order_number)}
                        className="px-3.5 py-1.5 rounded-full border border-stone-300 hover:border-red-300 text-stone-600 hover:text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}

                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                        needsProof
                          ? "bg-[#8C4B31] text-white hover:bg-[#6e3925] shadow-xs"
                          : "bg-[#1E3B2E] text-white hover:bg-[#8C4B31]"
                      }`}
                    >
                      {needsProof ? (
                        <>
                          <Upload size={13} />
                          <span>Upload Receipt</span>
                        </>
                      ) : (
                        <>
                          <span>View Timeline</span>
                          <ArrowRight size={13} />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
