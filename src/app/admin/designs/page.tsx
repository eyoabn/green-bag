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
  Sliders,
  Image as ImageIcon
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  const loadDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from("designs")
        .select(`
          *,
          profiles:submitted_by (full_name, email, phone)
        `)
        .order("created_at", { ascending: false });
        
      if (data) setDesigns(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("designs")
        .update({ status: newStatus })
        .eq("id", id);
        
      if (error) throw error;
      loadDesigns();
    } catch (e: any) {
      alert("Error updating status: " + e.message);
    }
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
          Bespoke 3D Studio & Dielines
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
          Customer Design Submissions
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Review uploaded dieline files, verify payments, and push designs to the factory floor.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-stone-500 py-12">Loading designs securely from Supabase...</div>
      ) : (
        <div className="space-y-6">
          {designs.map((design) => {
            let parsedNote: any = {};
            try {
              parsedNote = JSON.parse(design.note || "{}");
            } catch (e) {}

            return (
              <div
                key={design.id}
                className={`bg-white p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col justify-between space-y-6 transition-colors ${
                  design.status === "payment_review" ? "border-amber-300 ring-2 ring-amber-100" : "border-stone-200"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-stone-900">{design.id.substring(0,8)}</span>
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          design.status === "new"
                            ? "bg-amber-100 text-amber-800 animate-pulse"
                            : design.status === "engineering_review"
                            ? "bg-blue-100 text-blue-800"
                            : design.status === "approved_pending_payment"
                            ? "bg-purple-100 text-purple-800"
                            : design.status === "payment_review"
                            ? "bg-orange-100 text-orange-800 animate-bounce"
                            : design.status === "in_production"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {design.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                      {parsedNote.clientCompany || design.profiles?.full_name || "Unknown Client"}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {design.profiles?.email} • {design.profiles?.phone}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">Target Production</span>
                    <span className="font-serif text-2xl font-bold text-[#8C4B31]">
                      {parsedNote.quantity ? parsedNote.quantity.toLocaleString() : "-"} Units
                    </span>
                    <span className="text-[10px] text-stone-400 block mt-0.5">Submitted {new Date(design.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Specifications Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Dimensions</span>
                    <span className="font-bold text-stone-900">{parsedNote.dimensions || "-"}</span>
                  </div>
                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Paper Weight</span>
                    <span className="font-bold text-stone-900">{parsedNote.paperWeight || "-"}</span>
                  </div>
                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Paper Shade</span>
                    <span className="font-bold text-stone-900">{parsedNote.paperShade || "-"}</span>
                  </div>
                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Handle Type</span>
                    <span className="font-bold text-stone-900">{parsedNote.handleType || "-"}</span>
                  </div>
                </div>

                {/* Notes & File Download */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-stone-900 mb-0.5">Client Production Notes:</p>
                    <p className="text-stone-600 italic leading-relaxed">&ldquo;{parsedNote.notes || "No additional notes"}&rdquo;</p>
                  </div>

                  <button
                    onClick={() => alert(`Downloading dieline file: ${design.file_url}`)}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Download size={14} className="text-[#8C4B31]" />
                    <span>{design.file_url}</span>
                  </button>
                </div>

                {/* Payment Review Section */}
                {design.status === "payment_review" && design.payment_screenshot_url && (
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                        <ImageIcon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-orange-900">Payment Screenshot Submitted</p>
                        <a href={design.payment_screenshot_url} target="_blank" rel="noreferrer" className="text-xs text-orange-700 underline">
                          View Screenshot Image
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => updateStatus(design.id, "in_production")}
                      className="px-5 py-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-700 text-xs font-bold transition-colors shadow-sm"
                    >
                      Verify Payment & Push to Production
                    </button>
                  </div>
                )}

                {/* Workflow Status Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <span className="text-xs text-stone-500 font-medium">Update Manufacturing Stage:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => updateStatus(design.id, "engineering_review")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        design.status === "engineering_review" ? "bg-blue-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      Engineering Review
                    </button>
                    <button
                      onClick={() => updateStatus(design.id, "approved_pending_payment")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        design.status === "approved_pending_payment" ? "bg-purple-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      Approve (Request Payment)
                    </button>
                    <button
                      onClick={() => updateStatus(design.id, "in_production")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        design.status === "in_production" ? "bg-indigo-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      In Production
                    </button>
                    <button
                      onClick={() => updateStatus(design.id, "shipped")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        design.status === "shipped" ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      Mark Shipped
                    </button>
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
                Client requests submitted via the custom packaging form (/design-submission) will appear here.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
