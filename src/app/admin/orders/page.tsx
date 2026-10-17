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
  Filter,
  Plus,
  Package,
  Truck,
  RotateCcw,
  UserCheck
} from "lucide-react";
import { useCurrency } from "@/components/CurrencyContext";

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
  const { formatPrice } = useCurrency();
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

  // Create Order on Behalf Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Array<{ id: string; full_name: string; email: string; phone: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number; is_available: boolean }>>([]);
  const [banks, setBanks] = useState<Array<{ id: string; bank_name: string; account_number: string }>>([]);
  
  // Create Order Form Fields
  const [formBuyerId, setFormBuyerId] = useState("");
  const [formProductId, setFormProductId] = useState("");
  const [formQuantity, setFormQuantity] = useState(1);
  const [formBankId, setFormBankId] = useState("");
  const [formAddress, setFormAddress] = useState("Bole Subcity, Addis Ababa");
  const [formPhone, setFormPhone] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [createError, setCreateError] = useState("");

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

  // Load auxiliary data for Create Order on Behalf
  const openCreateModal = async () => {
    setCreateModalOpen(true);
    setCreateError("");
    try {
      // 1. Fetch users with role customer
      const userRes = await fetch("/api/users?role=customer");
      const userData = await userRes.json();
      if (userRes.ok && userData.users) {
        setCustomers(userData.users);
        if (userData.users.length > 0 && !formBuyerId) {
          setFormBuyerId(userData.users[0].id);
          setFormPhone(userData.users[0].phone || "+251 911 000 000");
        }
      }

      // 2. Fetch products
      const prodRes = await fetch("/api/products?pageSize=50");
      const prodData = await prodRes.json();
      if (prodRes.ok && prodData.products) {
        const availableProds = prodData.products.filter((p: any) => p.is_available);
        setProducts(availableProds);
        if (availableProds.length > 0 && !formProductId) {
          setFormProductId(availableProds[0].id);
        }
      }

      // 3. Fetch active bank accounts
      const bankRes = await fetch("/api/bank-accounts");
      const bankData = await bankRes.json();
      if (bankRes.ok && bankData.bankAccounts) {
        const activeBanks = bankData.bankAccounts.filter((b: any) => b.is_active);
        setBanks(activeBanks);
        if (activeBanks.length > 0 && !formBankId) {
          setFormBankId(activeBanks[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading create order metadata:", err);
    }
  };

  const handleCreateOnBehalf = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!formBuyerId) {
      setCreateError("Please select a target customer.");
      return;
    }
    if (!formProductId) {
      setCreateError("Please select a valid product.");
      return;
    }
    if (!formBankId) {
      setCreateError("Please select an active settlement bank account.");
      return;
    }
    if (!formAddress || formAddress.trim().length < 5) {
      setCreateError("Delivery address must be at least 5 characters.");
      return;
    }
    if (!formPhone || formPhone.trim().length < 6) {
      setCreateError("Valid phone number required (min 6 characters).");
      return;
    }

    setIsCreatingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: formBuyerId,
          items: [{ productId: formProductId, quantity: Number(formQuantity) }],
          bankAccountId: formBankId,
          deliveryAddress: formAddress.trim(),
          phone: formPhone.trim(),
          notes: formNotes.trim() || undefined,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to create order on behalf of customer.");
      }

      setCreateModalOpen(false);
      fetchOrders();
      setActionSuccess(`Order ${resJson.orderNumber} successfully created on behalf of customer.`);
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create order.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

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
          note: `Fulfillment status transitioned to ${newStatus.replace("_", " ").toUpperCase()} by Plant Administrator`,
        }),
      });

      const resJson = await res.json();
      if (res.ok && resJson.success) {
        fetchOrders();
        setActionSuccess(`Order transitioned to ${newStatus.toUpperCase()}`);
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
      "Customer Email",
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
      `"${o.profiles?.email || ""}"`,
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
            Track orders through verified payment, in-production printing, assembly, and completed dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Order on Behalf</span>
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <Link
            href="/admin/payments"
            className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all flex items-center gap-1.5"
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

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "All" },
            { id: "pending_payment", label: "Pending Payment" },
            { id: "pending_verification", label: "Pending Verification" },
            { id: "approved", label: "Approved" },
            { id: "in_production", label: "In Production" },
            { id: "ready", label: "Ready" },
            { id: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[#1E3B2E] text-white shadow-xs"
                  : "bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-stone-400 text-xs">
            <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading orders catalog...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-stone-400 text-xs">
            <ShoppingBag size={36} className="mx-auto text-stone-300 mb-2" />
            <p className="font-serif text-base font-bold text-stone-700">No orders matching criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-6">Order Reference</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Status & Next Action</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((o) => {
                  const isUpdating = updatingStatusId === o.id;

                  return (
                    <tr key={o.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-md text-[11px]">
                          {o.order_number}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div>
                          <p className="font-bold text-stone-900 text-xs">
                            {o.profiles?.full_name || "Customer"}
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                            {o.phone}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-stone-900">
                        {formatPrice(o.total_price)}
                      </td>

                      {/* Status & Valid Transition Buttons */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            o.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                            o.status === "ready" ? "bg-indigo-100 text-indigo-800" :
                            o.status === "in_production" ? "bg-purple-100 text-purple-800" :
                            o.status === "approved" ? "bg-blue-100 text-blue-800" :
                            o.status === "rejected" || o.status === "cancelled" ? "bg-red-100 text-red-800" :
                            "bg-amber-100 text-amber-800"
                          }`}>
                            {o.status.replace("_", " ")}
                          </span>

                          {/* Valid Next Transition Controls */}
                          {o.status === "approved" && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(o.id, "in_production")}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Start printing & production"
                            >
                              <Package size={11} />
                              <span>Start Production</span>
                            </button>
                          )}

                          {o.status === "in_production" && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(o.id, "ready")}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Mark ready for delivery dispatch"
                            >
                              <Truck size={11} />
                              <span>Mark Ready</span>
                            </button>
                          )}

                          {o.status === "ready" && (
                            <button
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(o.id, "completed")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Confirm delivery dispatch completed"
                            >
                              <Check size={11} />
                              <span>Complete</span>
                            </button>
                          )}

                          {o.status === "pending_verification" && (
                            <Link
                              href={`/admin/payments`}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                            >
                              <span>Verify</span>
                              <ArrowRight size={11} />
                            </Link>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-stone-400 text-[11px]">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openOrderDetail(o)}
                          className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
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
              {/* Customer & Shipping */}
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
                        <p className="font-bold text-stone-900">{item.products?.name || "Artisan Kraft Bag"}</p>
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

              {/* Chronological Status Audit Trail */}
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
                          <span className="font-bold text-stone-800 capitalize">
                            {h.to_status?.replace("_", " ")}
                          </span>
                          {h.note && (
                            <p className="text-[10px] text-stone-500 mt-0.5">{h.note}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(h.created_at).toLocaleDateString()}
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

      {/* Modal: Create Order on Behalf of Customer */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-fadeIn text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-[#1E3B2E]" />
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Create Order on Behalf of Customer
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:bg-stone-100 text-stone-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="text-red-600 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOnBehalf} className="space-y-4">
              {/* Select Customer */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Target Customer <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formBuyerId}
                  onChange={(e) => {
                    setFormBuyerId(e.target.value);
                    const selectedC = customers.find(c => c.id === e.target.value);
                    if (selectedC?.phone) setFormPhone(selectedC.phone);
                  }}
                  className="w-full bg-[#FAF7F2] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800"
                >
                  <option value="">-- Select Customer Account --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name || "Customer"} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Product & Quantity */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800"
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.price} ETB)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-[#FAF7F2] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 font-bold"
                  />
                </div>
              </div>

              {/* Bank Account */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Settlement Bank <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formBankId}
                  onChange={(e) => setFormBankId(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800"
                >
                  <option value="">-- Select Active Bank Account --</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bank_name} - {b.account_number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery Address & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Bole, Addis Ababa"
                    className="w-full bg-[#FAF7F2] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+251 911 000 000"
                    className="w-full bg-[#FAF7F2] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Order placed by manager on behalf of customer"
                  className="w-full bg-[#FAF7F2] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreatingOrder}
                  className="px-5 py-2 rounded-full bg-[#1E3B2E] text-white font-bold text-xs hover:bg-[#8C4B31] disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isCreatingOrder ? "Creating Order..." : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
