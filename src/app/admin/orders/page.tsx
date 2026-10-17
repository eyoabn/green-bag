"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShoppingBag, 
  Search, 
  Download, 
  Eye, 
  Clock, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Check, 
  ArrowRight,
  Filter
} from "lucide-react";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_snapshot: number;
  products?: {
    name: string;
    images?: string[];
    category?: string;
  };
}

interface OrderRecord {
  id: string;
  order_number: string;
  buyer_id: string;
  status: string;
  total_price: number;
  delivery_address: string;
  phone: string;
  notes: string;
  bank_account_id: string;
  payment_proof_path: string | null;
  rejection_reason: string | null;
  created_at: string;
  bank_accounts?: {
    bank_name: string;
    account_number: string;
  };
  profiles?: {
    full_name: string;
    email: string;
    phone: string;
  };
  order_items?: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [detailHistory, setDetailHistory] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Status Change State
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders?status=${statusFilter}`);
      const resJson = await res.json();
      if (res.ok && resJson.orders) {
        setOrders(resJson.orders);
      } else {
        throw new Error(resJson.error || "Failed to load orders");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const openOrderDetail = async (order: OrderRecord) => {
    setSelectedOrder(order);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      const resJson = await res.json();
      if (res.ok && resJson.order) {
        setDetailHistory(resJson.order.order_status_history || []);
      }
    } catch {
      setDetailHistory([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatusId(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          note: `Fulfillment status advanced to ${newStatus.replace("_", " ")} by Plant Administrator`,
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        fetchOrders();
        setActionSuccess(`Order status updated to ${newStatus.toUpperCase()}`);
        setTimeout(() => setActionSuccess(""), 3500);
      } else {
        alert(resJson.error || "Failed to update status");
      }
    } catch (err: any) {
      alert(err.message || "Error updating order status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const exportCSV = () => {
    if (orders.length === 0) {
      alert("No orders to export");
      return;
    }

    const headers = [
      "Order Number",
      "Customer Name",
      "Phone",
      "Status",
      "Total Price (ETB)",
      "Bank Account",
      "Delivery Address",
      "Created Date",
    ];

    const rows = orders.map((o) => [
      `"${o.order_number}"`,
      `"${o.profiles?.full_name || "Customer"}"`,
      `"${o.phone}"`,
      `"${o.status}"`,
      o.total_price,
      `"${o.bank_accounts?.bank_name || "CBE"}"`,
      `"${(o.delivery_address || "").replace(/"/g, '""')}"`,
      `"${new Date(o.created_at).toLocaleString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `arenguade_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.profiles?.full_name?.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Plant Fulfillment Operations
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            Manufacturing & Orders Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Track customer orders through printing, die-cutting, assembly, and dispatch with real PostgreSQL status history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <Link
            href="/admin/payments"
            className="px-4 py-2 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Payments Queue</span>
            <ArrowRight size={14} />
          </Link>
        </div>
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-stone-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by order #, client name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-stone-200 rounded-full pl-9 pr-4 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
          />
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { key: "all", label: "All" },
            { key: "pending_verification", label: "Verification" },
            { key: "approved", label: "Approved" },
            { key: "in_production", label: "Production" },
            { key: "ready", label: "Ready" },
            { key: "completed", label: "Completed" },
            { key: "rejected", label: "Rejected" },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st.key
                  ? "bg-[#1E3B2E] text-white shadow-xs"
                  : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-stone-400 text-xs">
            <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading fulfillment orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            <ShoppingBag size={32} className="mx-auto text-stone-300 mb-2" />
            No orders matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-[#FAF7F2] border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">Order Reference</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Fulfillment Status</th>
                  <th className="py-3.5 px-4">Ordered At</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                        {o.order_number}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div>
                        <p className="font-bold text-stone-900 text-xs">
                          {o.profiles?.full_name || "Valued Client"}
                        </p>
                        <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                          {o.phone}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-stone-900">
                      {Number(o.total_price).toLocaleString()} ETB
                    </td>

                    <td className="py-4 px-4">
                      <select
                        value={o.status}
                        disabled={updatingStatusId === o.id}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`text-[10px] font-bold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${
                          o.status === "completed" ? "bg-emerald-50 text-emerald-900 border-emerald-200" :
                          o.status === "approved" || o.status === "in_production" ? "bg-blue-50 text-blue-900 border-blue-200" :
                          o.status === "ready" ? "bg-teal-50 text-teal-900 border-teal-200" :
                          o.status === "rejected" || o.status === "cancelled" ? "bg-red-50 text-red-900 border-red-200" :
                          "bg-amber-50 text-amber-900 border-amber-200"
                        }`}
                      >
                        <option value="pending_payment">Pending Payment</option>
                        <option value="pending_verification">Pending Verification</option>
                        <option value="approved">Approved</option>
                        <option value="in_production">In Production</option>
                        <option value="ready">Ready for Dispatch</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="py-4 px-4 text-stone-400 text-[11px]">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openOrderDetail(o)}
                        className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-stone-200 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fadeIn text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded">
                  {selectedOrder.order_number}
                </span>
                <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-800">
                  {selectedOrder.status.replace("_", " ")}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-stone-400 hover:bg-stone-100 text-stone-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Client & Shipping */}
              <div className="grid grid-cols-2 gap-4 bg-[#FAF7F2] p-4 rounded-2xl border border-stone-200/60">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Customer</span>
                  <p className="font-bold text-stone-800 mt-0.5">{selectedOrder.profiles?.full_name || "Customer"}</p>
                  <p className="text-stone-600 font-mono text-[11px]">{selectedOrder.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Delivery Address</span>
                  <p className="text-stone-800 mt-0.5">{selectedOrder.delivery_address}</p>
                  {selectedOrder.notes && (
                    <p className="text-stone-500 italic mt-0.5 text-[10px]">Note: {selectedOrder.notes}</p>
                  )}
                </div>
              </div>

              {/* Items Breakdown with Snapshots */}
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                  Line Items & Snapshots
                </span>
                <div className="divide-y divide-stone-100 bg-stone-50 rounded-2xl p-3 border border-stone-200/60">
                  {(selectedOrder.order_items || []).map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-stone-900">{item.products?.name || "Catalog Bag"}</p>
                        <p className="text-[10px] text-stone-500">
                          {item.quantity} bundles × {item.unit_price_snapshot} ETB
                        </p>
                      </div>
                      <span className="font-mono font-bold text-stone-900">
                        {(item.quantity * Number(item.unit_price_snapshot)).toLocaleString()} ETB
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-between font-bold text-sm">
                    <span>Total Amount</span>
                    <span className="font-mono text-[#8C4B31]">{Number(selectedOrder.total_price).toLocaleString()} ETB</span>
                  </div>
                </div>
              </div>

              {/* Chronological Status Audit Log */}
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                  Order Status Audit Trail
                </span>
                {loadingDetail ? (
                  <p className="text-stone-400 text-center py-4">Loading history...</p>
                ) : detailHistory.length === 0 ? (
                  <p className="text-stone-400 text-center py-4">No audit history recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {detailHistory.map((h) => (
                      <div key={h.id} className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-[10px] uppercase tracking-wider text-[#1E3B2E]">
                            {h.to_status.replace("_", " ")}
                          </span>
                          {h.note && <p className="text-[11px] text-stone-600 mt-0.5">{h.note}</p>}
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(h.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
