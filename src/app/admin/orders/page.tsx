"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Eye, 
  X, 
  ShieldCheck, 
  Receipt, 
  Calendar,
  DollarSign,
  User,
  ArrowRight
} from "lucide-react";

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  productName: string;
  quantityBundles: number;
  totalEtb: number;
  bank: string;
  status: "pending_verification" | "approved" | "rejected";
  timestamp: string;
  receiptDetails: {
    transactionId: string;
    payerAccount: string;
    date: string;
    amount: string;
  };
}

const INITIAL_ORDERS: Order[] = [
  {
    id: "ARN-2026-8491",
    customerName: "Dawit Haile",
    customerPhone: "0911234567",
    customerEmail: "dawit@oromiacoffee.et",
    productName: "Specialty Coffee Degassing Pouch (500 Bags)",
    quantityBundles: 5,
    totalEtb: 855,
    bank: "CBE Birr",
    status: "pending_verification",
    timestamp: "10 mins ago",
    receiptDetails: {
      transactionId: "CBE-TXN-99882314",
      payerAccount: "1000234891024",
      date: "04/09/2026 14:32",
      amount: "855.00 ETB"
    }
  },
  {
    id: "ARN-2026-7732",
    customerName: "Bethlehem Mengistu",
    customerPhone: "0922456789",
    customerEmail: "bethlehem@bolecouture.com",
    productName: "Bole Boutique Luxury Shopper (1,000 Bags)",
    quantityBundles: 10,
    totalEtb: 2112,
    bank: "Telebirr SuperApp",
    status: "approved",
    timestamp: "2 hours ago",
    receiptDetails: {
      transactionId: "TB-8834910294",
      payerAccount: "0922456789",
      date: "04/09/2026 12:15",
      amount: "2,112.00 ETB"
    }
  },
  {
    id: "ARN-2026-6120",
    customerName: "Yonas Birhanu",
    customerPhone: "0933789012",
    customerEmail: "yonas@addisbakery.et",
    productName: "Addis Artisan Bakery Pouch (300 Bags)",
    quantityBundles: 3,
    totalEtb: 330,
    bank: "Awash Bank",
    status: "pending_verification",
    timestamp: "3 hours ago",
    receiptDetails: {
      transactionId: "AW-REF-7749102",
      payerAccount: "013209847190",
      date: "04/09/2026 11:04",
      amount: "330.00 ETB"
    }
  },
  {
    id: "ARN-2026-5501",
    customerName: "Solomon Kassa",
    customerPhone: "0944123456",
    customerEmail: "solomon@ethiopiahotel.et",
    productName: "Arenguade Forest Heritage Tote (800 Bags)",
    quantityBundles: 8,
    totalEtb: 1680,
    bank: "CBE Birr",
    status: "approved",
    timestamp: "Yesterday",
    receiptDetails: {
      transactionId: "CBE-TXN-11029481",
      payerAccount: "100055918234",
      date: "03/09/2026 16:40",
      amount: "1,680.00 ETB"
    }
  }
];

import { useEffect } from "react";
import { DataStore, StoredOrder } from "@/utils/dataStore";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<StoredOrder | null>(null);

  const loadOrders = () => {
    setOrders(DataStore.getOrders());
  };

  useEffect(() => {
    loadOrders();
    const handleUpdate = () => loadOrders();
    window.addEventListener("arenguade_datastore_change", handleUpdate);
    return () => window.removeEventListener("arenguade_datastore_change", handleUpdate);
  }, []);

  const handleApprove = (id: string) => {
    DataStore.updateOrderStatus(id, "approved");
    loadOrders();
  };

  const handleReject = (id: string) => {
    DataStore.updateOrderStatus(id, "rejected");
    loadOrders();
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filterStatus === "all" || o.status === filterStatus;
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = orders.filter((o) => o.status === "pending_verification").length;

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Admin Verification Desk
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            Manage Orders & Receipts
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Verify Ethiopian bank transfer slips (CBE, Telebirr, Awash) and dispatch manufacturing batches.
          </p>
        </div>

        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>{pendingCount} Orders Awaiting Verification</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: "all", label: "All Orders" },
            { id: "pending_verification", label: "Pending Verification" },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === tab.id
                  ? "bg-[#1E3B2E] text-white shadow-sm"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search order ref, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF7F2] border border-stone-300 rounded-full focus:outline-none"
          />
        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-stone-200">
              <tr>
                <th className="p-4 font-bold text-stone-700 uppercase tracking-wider">Order Ref</th>
                <th className="p-4 font-bold text-stone-700 uppercase tracking-wider">Customer</th>
                <th className="p-4 font-bold text-stone-700 uppercase tracking-wider">Product & Qty</th>
                <th className="p-4 font-bold text-stone-700 uppercase tracking-wider">Total (ETB)</th>
                <th className="p-4 font-bold text-stone-700 uppercase tracking-wider">Channel</th>
                <th className="p-4 font-bold text-stone-700 uppercase tracking-wider">Status</th>
                <th className="p-4 font-bold text-stone-700 uppercase tracking-wider">Receipt</th>
                <th className="p-4 font-bold text-stone-700 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-stone-900">
                    {order.id}
                    <span className="block text-[10px] text-stone-400 font-normal font-sans">{order.timestamp}</span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-stone-900">{order.customerName}</p>
                    <p className="text-[11px] text-stone-500">{order.customerPhone}</p>
                  </td>
                  <td className="p-4 max-w-xs">
                    <p className="font-medium text-stone-800 line-clamp-1">{order.productName}</p>
                    <p className="text-[10px] text-stone-500">{order.quantityBundles} bundles ({order.quantityBundles * 100} pcs)</p>
                  </td>
                  <td className="p-4 font-serif font-bold text-stone-900 text-sm">
                    {order.totalEtb} ETB
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                      {order.bankName}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800 animate-pulse"
                      }`}
                    >
                      {order.status === "pending_verification" ? "Pending Check" : order.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setViewingReceiptOrder(order)}
                      className="inline-flex items-center gap-1 text-[#8C4B31] font-bold hover:underline"
                    >
                      <Receipt size={14} />
                      <span>Inspect</span>
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.status !== "approved" && (
                        <button
                          onClick={() => handleApprove(order.id)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors"
                          title="Approve & Send to Manufacturing"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      {order.status !== "rejected" && (
                        <button
                          onClick={() => handleReject(order.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold transition-colors"
                          title="Reject Payment"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Receipt Inspection Modal */}
      {viewingReceiptOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative animate-in fade-in zoom-in-95">
            
            <button
              onClick={() => setViewingReceiptOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-800"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#1E3B2E] text-[#E0B382] flex items-center justify-center font-bold">
                <ShieldCheck size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">Bank Confirmation Slip</span>
                <h3 className="font-serif text-xl font-bold text-stone-900">
                  {viewingReceiptOrder.bankName} Slip
                </h3>
              </div>
            </div>

            {/* Stylized Digital Receipt Graphic */}
            <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-stone-200 text-xs space-y-3 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#1E3B2E]/5 rounded-bl-full pointer-events-none" />
              
              <div className="flex justify-between pb-2 border-b border-stone-200">
                <span className="text-stone-500">Transaction ID:</span>
                <span className="font-mono font-bold text-stone-900">{viewingReceiptOrder.receiptDetails?.transactionId || "TXN-VERIFIED"}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-stone-200">
                <span className="text-stone-500">Transfer Date:</span>
                <span className="font-medium text-stone-800">{viewingReceiptOrder.receiptDetails?.date || viewingReceiptOrder.timestamp}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-stone-200">
                <span className="text-stone-500">Payer Account / Phone:</span>
                <span className="font-mono font-bold text-stone-900">{viewingReceiptOrder.receiptDetails?.payerAccount || viewingReceiptOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-stone-200">
                <span className="text-stone-500">Recipient:</span>
                <span className="font-medium text-stone-800">Ethiopia Arenguade Paper Product</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold">
                <span className="text-stone-700">Verified Amount:</span>
                <span className="text-[#8C4B31] font-serif text-base">{viewingReceiptOrder.receiptDetails?.amount || `${viewingReceiptOrder.totalEtb}.00 ETB`}</span>
              </div>
            </div>

            {/* Quick Actions inside Modal */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  handleApprove(viewingReceiptOrder.id);
                  setViewingReceiptOrder(null);
                }}
                className="flex-1 py-3 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>Approve Order</span>
              </button>
              <button
                onClick={() => {
                  handleReject(viewingReceiptOrder.id);
                  setViewingReceiptOrder(null);
                }}
                className="px-5 py-3 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all"
              >
                Reject
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
