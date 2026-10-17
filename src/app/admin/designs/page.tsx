"use client";

import { useState, useEffect } from "react";
import { 
  PenTool, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Download, 
  ArrowRight,
  Sparkles,
  Check,
  X,
  ShoppingBag,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface DesignItem {
  id: string;
  submitted_by: string;
  file_path: string;
  description: string;
  quoted_price: number | null;
  status: "submitted" | "reviewing" | "quoted" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
}

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quotePrices, setQuotePrices] = useState<Record<string, string>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeFileUrl, setActiveFileUrl] = useState<string | null>(null);

  const loadDesigns = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/designs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load custom designs.");

      setDesigns(data.designs || []);
      // Initialize quote input prices
      const quotes: Record<string, string> = {};
      (data.designs || []).forEach((d: DesignItem) => {
        if (d.quoted_price) quotes[d.id] = String(d.quoted_price);
      });
      setQuotePrices(quotes);
    } catch (err: any) {
      console.error("Load designs error:", err);
      setErrorMsg(err.message || "Failed to load designs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update design status.");

      setDesigns((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: data.design.status } : d))
      );
    } catch (err: any) {
      alert(err.message || "Could not update status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendQuote = async (id: string) => {
    const rawPrice = quotePrices[id];
    const numPrice = Number(rawPrice);
    if (!numPrice || numPrice <= 0) {
      alert("Please enter a valid quoted price (ETB) before submitting quote.");
      return;
    }

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "quoted",
          quoted_price: numPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send quotation.");

      setDesigns((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "quoted", quoted_price: numPrice } : d))
      );
      alert(`Quote of ${numPrice} ETB sent to customer!`);
    } catch (err: any) {
      alert(err.message || "Could not submit quotation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConvertToOrder = async (id: string) => {
    if (!confirm("Convert this custom design into an active production Order?")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to convert design to order.");

      setDesigns((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "accepted" } : d))
      );
      alert(`Successfully converted design to Order #${data.order?.order_number || data.order?.id}!`);
    } catch (err: any) {
      alert(err.message || "Failed to convert design to order.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const viewFile = async (path: string) => {
    try {
      const res = await fetch(`/api/storage/signed-url?bucket=designs&path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (res.ok && data.url) {
        setActiveFileUrl(data.url);
      } else {
        alert(data.error || "Could not get file download link.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
          Bespoke Production & Quotations
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
          Customer Design Submissions
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Review uploaded dieline files, send pricing quotes, and convert accepted designs into factory manufacturing orders.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center text-stone-500 py-12 flex flex-col items-center justify-center">
          <Sparkles size={28} className="animate-spin text-[#1E3B2E] mb-2" />
          <p className="text-xs font-semibold">Loading custom designs from PostgreSQL...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {designs.map((design) => {
            let parsedSpec: any = {};
            try {
              parsedSpec = JSON.parse(design.description || "{}");
            } catch {
              parsedSpec = { notes: design.description };
            }

            return (
              <div
                key={design.id}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-stone-900">{design.id.substring(0, 8)}</span>
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          design.status === "submitted"
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : design.status === "reviewing"
                            ? "bg-blue-100 text-blue-800"
                            : design.status === "quoted"
                            ? "bg-purple-100 text-purple-800"
                            : design.status === "accepted"
                            ? "bg-emerald-100 text-emerald-800 font-bold"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {design.status}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                      {parsedSpec.clientCompany || design.profiles?.full_name || "Bespoke Packaging Client"}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {design.profiles?.email} • {design.profiles?.phone || "No phone provided"}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">Requested Volume</span>
                    <span className="font-serif text-2xl font-bold text-[#8C4B31]">
                      {parsedSpec.quantity ? Number(parsedSpec.quantity).toLocaleString() : "Custom Run"} Units
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      Submitted {new Date(design.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Dimensions</span>
                    <span className="font-bold text-stone-900">{parsedSpec.dimensions || "Standard"}</span>
                  </div>
                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Paper Weight</span>
                    <span className="font-bold text-stone-900">{parsedSpec.paperWeight || "220 GSM"}</span>
                  </div>
                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Paper Shade</span>
                    <span className="font-bold text-stone-900">{parsedSpec.paperShade || "Artisan Kraft"}</span>
                  </div>
                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Handle Type</span>
                    <span className="font-bold text-stone-900">{parsedSpec.handleType || "Twisted Cord"}</span>
                  </div>
                </div>

                {/* Notes & File Download */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-stone-900 mb-0.5">Client Artwork Notes:</p>
                    <p className="text-stone-600 italic leading-relaxed">&ldquo;{parsedSpec.notes || "No extra notes"}&rdquo;</p>
                  </div>

                  {design.file_path && (
                    <button
                      onClick={() => viewFile(design.file_path)}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Download size={14} className="text-[#8C4B31]" />
                      <span>Download Dieline Asset</span>
                    </button>
                  )}
                </div>

                {/* Quotation & One-Click Convert Panel */}
                <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700 whitespace-nowrap">
                      Quote Price (ETB):
                    </span>
                    <input
                      type="number"
                      placeholder="e.g. 85000"
                      value={quotePrices[design.id] || ""}
                      onChange={(e) => setQuotePrices({ ...quotePrices, [design.id]: e.target.value })}
                      className="p-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 w-36 font-mono font-bold"
                    />
                    <button
                      onClick={() => handleSendQuote(design.id)}
                      disabled={actionLoadingId === design.id}
                      className="px-4 py-2.5 rounded-xl bg-[#8C4B31] hover:bg-[#6D3823] text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      Send Quotation
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConvertToOrder(design.id)}
                      disabled={actionLoadingId === design.id || !design.quoted_price}
                      className="px-5 py-2.5 rounded-xl bg-[#1E3B2E] hover:bg-emerald-900 disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <ShoppingBag size={14} />
                      <span>Convert to Factory Order</span>
                    </button>
                  </div>
                </div>

                {/* Status Advancement Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <span className="text-xs text-stone-500 font-medium">Advance Workflow Status:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {(["submitted", "reviewing", "quoted", "accepted", "declined"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(design.id, st)}
                        disabled={actionLoadingId === design.id}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors uppercase ${
                          design.status === st
                            ? "bg-stone-900 text-white"
                            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {designs.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center text-stone-500">
              <FileText size={36} className="mx-auto text-stone-400 mb-2" />
              <h4 className="font-serif text-lg font-bold text-stone-800">No Custom Dieline Submissions Yet</h4>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Client requests submitted via the custom packaging studio (/design-submission) will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Asset Preview Modal */}
      {activeFileUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-stone-200 shadow-2xl relative">
            <button
              onClick={() => setActiveFileUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100"
            >
              ✕
            </button>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">Customer Dieline Asset</h3>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 flex items-center justify-center border border-stone-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeFileUrl} alt="Dieline" className="w-full h-full object-contain" />
            </div>
            <div className="mt-4 text-center">
              <a
                href={activeFileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors"
              >
                <Download size={14} />
                <span>Open / Download Asset</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
