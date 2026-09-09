"use client";

import { useState } from "react";
import { 
  PenTool, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Download, 
  ArrowRight,
  Sparkles,
  Sliders
} from "lucide-react";

interface SubmittedDesign {
  id: string;
  clientName: string;
  clientCompany: string;
  clientContact: string;
  dimensions: string;
  paperWeight: string;
  paperShade: string;
  quantity: number;
  handleType: string;
  status: "new" | "reviewing" | "proof_ready" | "approved";
  submittedDate: string;
  fileName: string;
  notes: string;
}

import { useEffect } from "react";
import { DataStore } from "@/utils/dataStore";

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<SubmittedDesign[]>([]);

  const loadDesigns = () => {
    setDesigns(DataStore.getDesigns() as any);
  };

  useEffect(() => {
    loadDesigns();
    const handleUpdate = () => loadDesigns();
    window.addEventListener("arenguade_datastore_change", handleUpdate);
    return () => window.removeEventListener("arenguade_datastore_change", handleUpdate);
  }, []);

  const updateStatus = (id: string, newStatus: SubmittedDesign["status"]) => {
    DataStore.updateDesignStatus(id, newStatus);
    setDesigns((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
    );
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
          Bespoke 3D Studio & Dielines
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
          Customer Design Submissions
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Review uploaded dieline files, technical tolerances, and send digital 3D proofs.
        </p>
      </div>

      {/* Designs Grid */}
      <div className="space-y-6">
        {designs.map((design) => (
          <div
            key={design.id}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-stone-900">{design.id}</span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      design.status === "proof_ready"
                        ? "bg-purple-100 text-purple-800"
                        : design.status === "reviewing"
                        ? "bg-blue-100 text-blue-800"
                        : design.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800 animate-pulse"
                    }`}
                  >
                    {design.status === "proof_ready" ? "3D Proof Ready" : design.status === "reviewing" ? "Engineering Review" : design.status}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                  {design.clientCompany} • {design.clientName}
                </h3>
                <p className="text-xs text-stone-500">{design.clientContact}</p>
              </div>

              <div className="text-right">
                <span className="text-xs text-stone-500 block">Target Production</span>
                <span className="font-serif text-2xl font-bold text-[#8C4B31]">
                  {design.quantity.toLocaleString()} Units
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Submitted {design.submittedDate}</span>
              </div>
            </div>

            {/* Specifications Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Dimensions</span>
                <span className="font-bold text-stone-900">{design.dimensions}</span>
              </div>
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Paper Weight</span>
                <span className="font-bold text-stone-900">{design.paperWeight}</span>
              </div>
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Paper Shade</span>
                <span className="font-bold text-stone-900">{design.paperShade}</span>
              </div>
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Handle Type</span>
                <span className="font-bold text-stone-900">{design.handleType}</span>
              </div>
            </div>

            {/* Notes & File Download */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-stone-900 mb-0.5">Client Production Notes:</p>
                <p className="text-stone-600 italic leading-relaxed">&ldquo;{design.notes}&rdquo;</p>
              </div>

              <button
                onClick={() => alert(`Downloading dieline file: ${design.fileName}`)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Download size={14} className="text-[#8C4B31]" />
                <span>{design.fileName}</span>
              </button>
            </div>

            {/* Workflow Status Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <span className="text-xs text-stone-500 font-medium">Update Engineering Stage:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateStatus(design.id, "reviewing")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    design.status === "reviewing" ? "bg-blue-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  Mark In Review
                </button>
                <button
                  onClick={() => updateStatus(design.id, "proof_ready")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    design.status === "proof_ready" ? "bg-purple-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  Send 3D Proof
                </button>
                <button
                  onClick={() => updateStatus(design.id, "approved")}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    design.status === "approved" ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  Approve for Plant
                </button>
              </div>
            </div>
          </div>
        ))}
        {designs.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center text-stone-500">
            <FileText size={36} className="mx-auto text-stone-400 mb-2" />
            <h4 className="font-serif text-lg font-bold text-stone-800">No Custom Dieline Submissions Yet</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Client requests submitted via the custom packaging form (/design-submission) will appear here for engineering inspection and 3D proofing.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
