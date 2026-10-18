"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PenTool, 
  Sparkles, 
  Check, 
  X, 
  Download, 
  ExternalLink, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  MessageSquare,
  FileText,
  DollarSign
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
}

export default function CustomerDesignsPage() {
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadDesigns = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/designs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load custom designs.");
      setDesigns(data.designs || []);
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

  const handleRespondToQuote = async (id: string, action: "accept" | "decline") => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} quote.`);

      setDesigns((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: data.design.status } : d))
      );
      alert(
        action === "accept"
          ? "Quote accepted! Our factory team has been notified and will create your order."
          : "Quote declined."
      );
    } catch (err: any) {
      alert(err.message || "Could not respond to quotation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openFile = async (path: string) => {
    try {
      const res = await fetch(`/api/storage/signed-url?bucket=designs&path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (res.ok && data.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        alert(data.error || "Could not get file link.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] text-xs font-bold uppercase mb-2">
              <PenTool size={13} />
              <span>Bespoke Packaging Portfolio</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              My Custom Designs
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Track quotation status, review factory technical notes, and approve quotes for manufacturing.
            </p>
          </div>

          <Link
            href="/design-submission"
            className="px-6 py-3 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <PenTool size={14} />
            <span>Submit New Design</span>
          </Link>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center text-stone-500 py-16 flex flex-col items-center justify-center">
            <Sparkles size={32} className="animate-spin text-[#1E3B2E] mb-3" />
            <p className="text-sm font-semibold text-stone-700">Loading custom design submissions...</p>
          </div>
        ) : designs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-4 shadow-sm">
            <FileText size={44} className="mx-auto text-stone-400" />
            <h3 className="font-serif text-xl font-bold text-stone-900">No Custom Designs Submitted Yet</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              Have a custom brand logo, dimensions, or dieline for your paper packaging? Submit your artwork to our plant for instant preflight inspection and a direct quotation.
            </p>
            <div className="pt-2">
              <Link
                href="/design-submission"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-colors"
              >
                <span>Launch 3D Design Studio</span>
                <ArrowRight size={14} />
              </Link>
            </div>
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
                  className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6"
                >
                  {/* Top Bar: Title, ID, Status, and Quoted Price */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="font-mono text-xs font-bold text-stone-500">
                          Ref #{design.id.substring(0, 8)}
                        </span>
                        <span
                          className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            design.status === "quoted"
                              ? "bg-purple-100 text-purple-800 font-extrabold animate-pulse"
                              : design.status === "accepted"
                              ? "bg-emerald-100 text-emerald-800 font-bold"
                              : design.status === "reviewing"
                              ? "bg-blue-100 text-blue-800"
                              : design.status === "declined"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800 font-bold"
                          }`}
                        >
                          {design.status}
                        </span>
                      </div>
                      <h2 className="font-serif text-2xl font-bold text-stone-900">
                        {design.title || parsedSpec.clientCompany || "Custom Paper Bag Design"}
                      </h2>
                      <span className="text-[11px] text-stone-400">
                        Submitted on {new Date(design.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right">
                      {design.quoted_price ? (
                        <div>
                          <span className="text-[10px] text-stone-500 uppercase font-bold block">
                            Quoted Production Total
                          </span>
                          <span className="font-serif text-3xl font-bold text-[#8C4B31]">
                            {Number(design.quoted_price).toLocaleString()} ETB
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                          <Clock size={13} className="animate-spin text-amber-600" />
                          <span>Quotation Under Engineering Review</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specification Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-stone-200">
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Dimensions</span>
                      <span className="font-bold text-stone-900">{parsedSpec.dimensions || "Bespoke Size"}</span>
                    </div>
                    <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-stone-200">
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Paper Grammage</span>
                      <span className="font-bold text-stone-900">{parsedSpec.paperWeight || "220 GSM Kraft"}</span>
                    </div>
                    <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-stone-200">
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Kraft Shade</span>
                      <span className="font-bold text-stone-900">{parsedSpec.paperShade || "Artisan Kraft"}</span>
                    </div>
                    <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-stone-200">
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Target Volume</span>
                      <span className="font-bold text-stone-900">
                        {parsedSpec.quantity ? Number(parsedSpec.quantity).toLocaleString() : "Custom Batch"} Units
                      </span>
                    </div>
                  </div>

                  {/* Customer Description / Notes & File Download */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-stone-900 mb-0.5">Design Description & Notes:</p>
                      <p className="text-stone-600 italic leading-relaxed">
                        &ldquo;{parsedSpec.notes || design.description}&rdquo;
                      </p>
                    </div>

                    {design.file_path && (
                      <button
                        onClick={() => openFile(design.file_path)}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <Download size={14} className="text-[#8C4B31]" />
                        <span>View / Download Design Asset</span>
                      </button>
                    )}
                  </div>

                  {/* Admin Reply Note (If available) */}
                  {design.admin_reply && (
                    <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                        <MessageSquare size={14} />
                        <span>Factory Engineer Feedback:</span>
                      </div>
                      <p className="text-emerald-800 leading-relaxed font-medium">
                        &ldquo;{design.admin_reply}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Quotation Decision Bar (When status is 'quoted') */}
                  {design.status === "quoted" && (
                    <div className="p-5 bg-purple-50 rounded-2xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-purple-950">Quotation Ready for Your Approval</h4>
                        <p className="text-[11px] text-purple-800 mt-0.5">
                          The plant has reviewed your dieline and quoted this production run at{" "}
                          <strong>{Number(design.quoted_price).toLocaleString()} ETB</strong>. Accept to proceed to manufacturing.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRespondToQuote(design.id, "accept")}
                          disabled={actionLoadingId === design.id}
                          className="px-5 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <Check size={14} />
                          <span>Accept Quote</span>
                        </button>
                        <button
                          onClick={() => handleRespondToQuote(design.id, "decline")}
                          disabled={actionLoadingId === design.id}
                          className="px-4 py-2.5 rounded-full bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold border border-stone-300 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {/* When Accepted & Linked Order Exists */}
                  {design.status === "accepted" && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-2 text-emerald-900">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span className="font-bold">
                          Quote Accepted! Manufacturing order is being pre-filled.
                        </span>
                      </div>
                      {design.linked_order_id && (
                        <Link
                          href={`/dashboard/orders/${design.linked_order_id}`}
                          className="px-5 py-2 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
                        >
                          <span>Go to Order & Pay</span>
                          <ArrowRight size={13} />
                        </Link>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
