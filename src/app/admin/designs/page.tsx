"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PenTool, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Eye, 
  EyeOff,
  Download, 
  ArrowRight,
  Sparkles,
  Check,
  X,
  ShoppingBag,
  AlertCircle,
  MessageSquare,
  DollarSign,
  Filter
} from "lucide-react";

interface DesignItem {
  id: string;
  submitted_by: string;
  title: string;
  file_path: string;
  description: string;
  admin_reply?: string | null;
  quoted_price: number | null;
  status: "new" | "reviewing" | "quoted" | "accepted" | "declined";
  linked_order_id?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
}

const STATUS_FILTERS = [
  { id: "all", label: "All Designs" },
  { id: "new", label: "New Submissions" },
  { id: "reviewing", label: "In Review" },
  { id: "quoted", label: "Quoted" },
  { id: "accepted", label: "Accepted by Client" },
  { id: "declined", label: "Declined" },
] as const;

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Local edit state per design
  const [quotePrices, setQuotePrices] = useState<Record<string, string>>({});
  const [adminReplies, setAdminReplies] = useState<Record<string, string>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Inline file viewer state: map of designId -> signedUrl
  const [inlineFiles, setInlineFiles] = useState<Record<string, string>>({});
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);

  const loadDesigns = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const url = selectedFilter === "all" ? "/api/designs" : `/api/designs?status=${selectedFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load custom designs.");

      const loadedDesigns: DesignItem[] = data.designs || [];
      setDesigns(loadedDesigns);

      // Initialize inputs
      const quotes: Record<string, string> = {};
      const replies: Record<string, string> = {};
      loadedDesigns.forEach((d) => {
        if (d.quoted_price) quotes[d.id] = String(d.quoted_price);
        if (d.admin_reply) replies[d.id] = d.admin_reply;
      });
      setQuotePrices(quotes);
      setAdminReplies(replies);
    } catch (err: any) {
      console.error("Load designs error:", err);
      setErrorMsg(err.message || "Failed to load designs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDesigns();
  }, [selectedFilter]);

  const handleUpdateStatusAndQuote = async (id: string, newStatus?: string) => {
    setActionLoadingId(id);
    try {
      const payload: Record<string, any> = {};
      if (newStatus) payload.status = newStatus;
      
      const rawPrice = quotePrices[id];
      if (rawPrice !== undefined && rawPrice !== "") {
        payload.quoted_price = Number(rawPrice);
      }

      const reply = adminReplies[id];
      if (reply !== undefined) {
        payload.admin_reply = reply;
      }

      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update design.");

      setDesigns((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...data.design } : d))
      );
      alert("Design updated and customer notified!");
    } catch (err: any) {
      alert(err.message || "Could not update design.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateOrderFromDesign = async (id: string) => {
    if (!confirm("Create a pre-filled factory manufacturing order from this design quote?")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_order" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order from design.");

      setDesigns((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...data.design } : d))
      );
      alert(`Success! Created Order #${data.order?.order_number || data.order?.id}. Customer notified to upload payment proof.`);
    } catch (err: any) {
      alert(err.message || "Failed to create order from design.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleInlineFile = async (designId: string, path: string) => {
    if (inlineFiles[designId]) {
      // Toggle off
      setInlineFiles((prev) => {
        const next = { ...prev };
        delete next[designId];
        return next;
      });
      return;
    }

    setLoadingFileId(designId);
    try {
      const res = await fetch(`/api/storage/signed-url?bucket=designs&path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (res.ok && data.signedUrl) {
        setInlineFiles((prev) => ({ ...prev, [designId]: data.signedUrl }));
      } else {
        alert(data.error || "Could not retrieve file signed link.");
      }
    } catch (err: any) {
      alert("Error loading file: " + err.message);
    } finally {
      setLoadingFileId(null);
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
          Inspect client dielines inline, provide quotes, communicate technical notes, and convert approved designs into active factory orders.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              selectedFilter === f.id
                ? "bg-[#1E3B2E] text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center text-stone-500 py-16 flex flex-col items-center justify-center">
          <Sparkles size={28} className="animate-spin text-[#1E3B2E] mb-2" />
          <p className="text-xs font-semibold">Loading custom designs from PostgreSQL...</p>
        </div>
      ) : designs.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center text-stone-500">
          <FileText size={36} className="mx-auto text-stone-400 mb-2" />
          <h4 className="font-serif text-lg font-bold text-stone-800">No Custom Dieline Submissions Found</h4>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {selectedFilter === "all"
              ? "Client requests submitted via the custom packaging studio (/design-submission) will appear here."
              : `No designs currently matched status "${selectedFilter}".`}
          </p>
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

            const isPdf = design.file_path?.toLowerCase().endsWith(".pdf");
            const fileUrl = inlineFiles[design.id];

            return (
              <div
                key={design.id}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-6"
              >
                {/* Header Information */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="font-mono text-xs font-bold text-stone-500">
                        Design #{design.id.substring(0, 8)}
                      </span>
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          design.status === "new"
                            ? "bg-amber-100 text-amber-800 animate-pulse font-extrabold"
                            : design.status === "reviewing"
                            ? "bg-blue-100 text-blue-800"
                            : design.status === "quoted"
                            ? "bg-purple-100 text-purple-800 font-bold"
                            : design.status === "accepted"
                            ? "bg-emerald-100 text-emerald-800 font-extrabold"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {design.status}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-stone-900">
                      {design.title || parsedSpec.clientCompany || "Custom Packaging Request"}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Customer: <strong>{design.profiles?.full_name || "Valued Client"}</strong> ({design.profiles?.email} • {design.profiles?.phone || "No phone"})
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">Target Quantity</span>
                    <span className="font-serif text-2xl font-bold text-[#8C4B31]">
                      {parsedSpec.quantity ? Number(parsedSpec.quantity).toLocaleString() : "Custom"} Units
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">
                      Submitted on {new Date(design.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Technical Specifications */}
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

                {/* Client Notes & File Actions */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-stone-900 mb-0.5">Customer Instructions:</p>
                    <p className="text-stone-600 italic leading-relaxed">&ldquo;{parsedSpec.notes || design.description}&rdquo;</p>
                  </div>

                  {design.file_path && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleInlineFile(design.id, design.file_path)}
                        disabled={loadingFileId === design.id}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        {fileUrl ? <EyeOff size={14} className="text-stone-600" /> : <Eye size={14} className="text-[#1E3B2E]" />}
                        <span>{fileUrl ? "Hide Inline File" : "Show File Inline"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline File Viewer */}
                {fileUrl && (
                  <div className="p-4 bg-stone-900 rounded-2xl border border-stone-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-300">
                      <span className="font-bold flex items-center gap-1.5">
                        <FileText size={14} className="text-amber-400" />
                        <span>Preflight Dieline File Preview ({design.file_path})</span>
                      </span>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        <Download size={13} />
                        <span>Open Raw File</span>
                      </a>
                    </div>

                    <div className="w-full max-h-[500px] rounded-xl overflow-hidden bg-black/60 flex items-center justify-center p-2">
                      {isPdf ? (
                        <iframe
                          src={fileUrl}
                          className="w-full h-[460px] rounded-lg border-0 bg-white"
                          title="Dieline PDF Preview"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={fileUrl}
                          alt="Dieline Design"
                          className="max-h-[460px] w-auto object-contain rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Quotation, Feedback, and Status Controls */}
                <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-stone-200 space-y-4">
                  
                  {/* Top row: Quote Price & Status Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                        Quoted Price (ETB):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="e.g. 45000"
                          value={quotePrices[design.id] ?? ""}
                          onChange={(e) => setQuotePrices({ ...quotePrices, [design.id]: e.target.value })}
                          className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                        Change Workflow Status:
                      </label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(["new", "reviewing", "quoted", "accepted", "declined"] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateStatusAndQuote(design.id, st)}
                            disabled={actionLoadingId === design.id}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all uppercase ${
                              design.status === st
                                ? "bg-stone-900 text-white shadow-xs"
                                : "bg-white text-stone-700 border border-stone-300 hover:bg-stone-100"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Admin Reply Note to Customer */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                      Factory Technical Reply / Quotation Note (Customer Notified):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="E.g. We can produce 5,000 units on 220 GSM kraft with hot gold foil stamping. Estimated dispatch 10 business days."
                      value={adminReplies[design.id] ?? ""}
                      onChange={(e) => setAdminReplies({ ...adminReplies, [design.id]: e.target.value })}
                      className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200">
                    <button
                      onClick={() => handleUpdateStatusAndQuote(design.id)}
                      disabled={actionLoadingId === design.id}
                      className="px-5 py-2.5 rounded-xl bg-[#8C4B31] hover:bg-[#6D3823] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Check size={14} />
                      <span>Save Quote & Notify Customer</span>
                    </button>

                    {/* Create Order From Design Button */}
                    <div className="flex items-center gap-2">
                      {design.linked_order_id ? (
                        <Link
                          href="/admin/orders"
                          className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5 border border-stone-300"
                        >
                          <ShoppingBag size={14} className="text-emerald-700" />
                          <span>View Converted Order (#{design.linked_order_id.substring(0, 8)})</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleCreateOrderFromDesign(design.id)}
                          disabled={actionLoadingId === design.id || !design.quoted_price}
                          className="px-5 py-2.5 rounded-xl bg-[#1E3B2E] hover:bg-emerald-900 disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                          title={!design.quoted_price ? "Enter a quoted price before converting to order" : ""}
                        >
                          <ShoppingBag size={14} />
                          <span>Create Order from Design</span>
                        </button>
                      )}
                    </div>
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
