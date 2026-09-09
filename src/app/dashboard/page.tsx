"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ShoppingBag, 
  BookOpen, 
  Clock, 
  PlayCircle, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  FileText,
  ExternalLink,
  Receipt,
  Download,
  Layers
} from "lucide-react";
import { DataStore, StoredOrder, StoredRegistration, StoredDesign } from "@/utils/dataStore";

function CustomerDashboardContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as "orders" | "classes" | "designs" | null;
  const [activeTab, setActiveTab] = useState<"orders" | "classes" | "designs">(urlTab || "orders");
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [registrations, setRegistrations] = useState<StoredRegistration[]>([]);
  const [designs, setDesigns] = useState<StoredDesign[]>([]);
  const [customerName, setCustomerName] = useState("Dawit Haile");

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const loadData = () => {
    setOrders(DataStore.getOrders());
    setRegistrations(DataStore.getRegistrations());
    setDesigns(DataStore.getDesigns());

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("arenguade_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.full_name) setCustomerName(parsed.full_name);
        } catch {}
      }
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("arenguade_datastore_change", handleUpdate);
    return () => window.removeEventListener("arenguade_datastore_change", handleUpdate);
  }, []);

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1E3B2E] via-[#244737] to-[#1E3B2E] text-white p-8 rounded-3xl border border-stone-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Verified Customer & Student Portal
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">
            Welcome back, {customerName}!
          </h1>
          <p className="text-sm text-stone-300 mt-1 max-w-lg">
            Track your custom Ethiopian kraft bag manufacturing batches, view verified CBE / Telebirr payments, and access your live LiveKit masterclasses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="bg-[#8C4B31] hover:bg-[#A3593B] text-white text-xs font-bold px-5 py-3 rounded-full transition-all shadow-md flex items-center gap-1.5"
          >
            <ShoppingBag size={15} />
            <span>New Order</span>
          </Link>
          <Link
            href="/learn/schedule"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-5 py-3 rounded-full transition-all"
          >
            Book Class
          </Link>
        </div>
      </div>

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-[#8C4B31]">
            <ShoppingBag size={24} />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Active Orders</span>
            <p className="font-serif text-2xl font-bold text-stone-900">{orders.length} Batches</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-[#1E3B2E]">
            <BookOpen size={24} />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Academy Registrations</span>
            <p className="font-serif text-2xl font-bold text-stone-900">{registrations.length} Workshops</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-stone-100 text-stone-700">
            <Sparkles size={24} />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Bespoke Design Tickets</span>
            <p className="font-serif text-2xl font-bold text-stone-900">
              {designs.length > 0 ? `${designs.length} Submitted` : "1 In Review"}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        {[
          { id: "orders", label: "My Orders & Receipts", count: orders.length },
          { id: "classes", label: "My Academy Workshops", count: registrations.length },
          { id: "designs", label: "Custom 3D Designs", count: designs.length || 1 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#1E3B2E] text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-stone-200 text-stone-700"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content: ORDERS */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
              <Package size={40} className="text-stone-300 mx-auto mb-3" />
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-1">No Orders Yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
                Browse our bespoke Ethiopian virgin kraft packaging models and place your first wholesale or retail order.
              </p>
              <Link 
                href="/products" 
                className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-6 py-3 rounded-full transition-colors"
              >
                Browse Catalog
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <div 
                key={order.id}
                className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-stone-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-stone-200 flex items-center justify-center shrink-0">
                    <Package size={28} className="text-[#8C4B31]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-xs text-stone-900">Order #{order.id}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        order.status === "approved" 
                          ? "bg-emerald-100 text-emerald-800" 
                          : order.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {order.status === "approved" ? "Approved & In Manufacturing" : order.status === "rejected" ? "Verification Rejected" : "Pending Verification"}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-stone-900 mt-1">
                      {order.productName}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Paid via {order.bankName}: {order.totalEtb} ETB • {order.timestamp} • Addis Ababa Plant
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
                  <span className="font-serif text-xl font-bold text-[#8C4B31]">{order.totalEtb} ETB</span>
                  <button 
                    onClick={() => alert(`Order ${order.id}: Status is ${order.status.replace("_", " ")}. Batch processing in Bole Industrial Zone.`)}
                    className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800 transition-colors cursor-pointer"
                  >
                    View Status
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: ACADEMY WORKSHOPS */}
      {activeTab === "classes" && (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div 
              key={reg.id}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    reg.sessionType === "live" ? "bg-[#1E3B2E] text-white" : "bg-[#8C4B31] text-white"
                  }`}>
                    {reg.sessionType === "live" ? <PlayCircle size={11} /> : null}
                    {reg.sessionType === "live" ? "LiveKit Online Classroom" : "In-Person Studio"}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    reg.status === "approved" ? "text-emerald-700 bg-emerald-50" : "text-amber-800 bg-amber-50"
                  }`}>
                    {reg.status === "approved" ? "Seat Confirmed" : "Payment Pending Check"}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-stone-900">
                  {reg.sessionTitle}
                </h3>
                <p className="text-xs text-stone-600 mt-1 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1"><Calendar size={13} /> {reg.sessionDate} • {reg.sessionTime}</span>
                  <span>•</span>
                  <span><MapPin size={13} className="inline mr-0.5" />{reg.location}</span>
                </p>
              </div>

              {reg.sessionType === "live" ? (
                <Link
                  href={`/dashboard/sessions/${reg.sessionId}`}
                  className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-7 py-3.5 rounded-full transition-all shadow-md flex items-center gap-2"
                >
                  <PlayCircle size={16} />
                  <span>Enter LiveKit Classroom</span>
                </Link>
              ) : (
                <button
                  onClick={() => alert(`Admission Pass #${reg.id} generated for ${reg.studentName}. Show this ticket at Bole Studio entrance.`)}
                  className="px-6 py-3 rounded-full bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-800 transition-colors"
                >
                  Download Studio Pass (PDF)
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: DESIGNS */}
      {activeTab === "designs" && (
        <div className="space-y-4">
          {designs.length > 0 ? (
            designs.map((d) => (
              <div key={d.id} className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">Ticket #{d.id}</span>
                    <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                      {d.clientCompany} • {d.clientName}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Submitted on {d.submittedDate} • {d.dimensions} • {d.paperWeight} • {d.paperShade}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                    Engineering Review in Progress
                  </span>
                </div>

                <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1 mb-6">
                  <p className="font-bold text-stone-900">Submitted Notes & Specs:</p>
                  <p>{d.notes}</p>
                </div>

                <Link
                  href="/design-submission"
                  className="text-xs font-bold text-[#1E3B2E] hover:underline flex items-center gap-1"
                >
                  Submit Another Custom Specification <ArrowRight size={13} />
                </Link>
              </div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">Ticket #DSG-2026-9102</span>
                  <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                    Custom Degassing Pouch with Gold Hot Foil Monogram
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Submitted on Sept 04, 2026 • 24cm × 32cm + 10cm • 220 GSM Ethiopian Virgin Kraft
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                  Engineering Review in Progress
                </span>
              </div>

              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1 mb-6">
                <p className="font-bold text-stone-900">Engineer Notes from Addis Ababa Factory:</p>
                <p>
                  &ldquo;Vector dieline verified. Hot stamping plate has been scheduled on the flatbed cylinder press. Pre-production sample will be ready for review within 24 hours.&rdquo;
                </p>
              </div>

              <Link
                href="/design-submission"
                className="text-xs font-bold text-[#1E3B2E] hover:underline flex items-center gap-1"
              >
                Submit Another Custom Specification <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-12 text-center text-stone-500 font-serif">Loading Customer & Student Portal...</div>}>
      <CustomerDashboardContent />
    </Suspense>
  );
}
