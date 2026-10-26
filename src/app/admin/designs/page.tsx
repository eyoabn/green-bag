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
  Filter,
  ShieldCheck,
  Layers,
  Truck,
  Building2,
  User,
  Phone,
  MapPin,
  QrCode
} from "lucide-react";

interface DesignItem {
  id: string;
  submitted_by: string;
  title: string;
  file_path: string;
  description: string;
  quantity?: string;
  dimensions?: string;
  gsm?: number;
  handle_type?: string;
  print_finish?: string;
  specs_json?: any;
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

const MANUFACTURING_STAGES = [
  { id: "payment_verified", label: "1. Deposit Verified", badge: "Payment Confirmed" },
  { id: "plate_engraving", label: "2. Platemaking & Inks", badge: "Engraving Plates" },
  { id: "printing_and_cutting", label: "3. Printing & Die-Cut", badge: "Rotary Press" },
  { id: "assembly_and_qc", label: "4. Assembly & QC", badge: "Bag Stringing & QC" },
  { id: "ready_for_delivery", label: "5. Ready / Dispatched", badge: "Ready for Delivery" },
  { id: "delivered", label: "6. Consignment Delivered", badge: "Fulfillment Complete" },
];

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Local edit state per design
  const [quotePrices, setQuotePrices] = useState<Record<string, string>>({});
  const [adminReplies, setAdminReplies] = useState<Record<string, string>>({});
  const [selectedBankAccounts, setSelectedBankAccounts] = useState<Record<string, string>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Inline file viewer state: map of designId -> signedUrl
  const [inlineFiles, setInlineFiles] = useState<Record<string, string>>({});
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);

  // Payment proof viewer state
  const [paymentProofUrls, setPaymentProofUrls] = useState<Record<string, string>>({});

  const loadDesigns = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const url = selectedFilter === "all" ? "/api/designs" : `/api/designs?status=${selectedFilter}`;
      const [res, banksRes] = await Promise.all([
        fetch(url),
        fetch("/api/bank-accounts").catch(() => null),
      ]);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load custom designs.");

      const loadedDesigns: DesignItem[] = data.designs || [];
      setDesigns(loadedDesigns);

      if (banksRes && banksRes.ok) {
        const banksData = await banksRes.json();
        const accs = banksData.accounts || banksData.bankAccounts || [];
        setBankAccounts(accs.length > 0 ? accs : [
          { id: "cbe-1", bank_name: "Commercial Bank of Ethiopia (CBE)", account_name: "Ethiopia Arenguade Paper Products PLC", account_number: "1000 1234 5678 9" },
          { id: "telebirr-1", bank_name: "Telebirr Enterprise QR & Till", account_name: "Arenguade Packaging Merchant", account_number: "+251 911 741618 (Till: 893201)" },
          { id: "awash-1", bank_name: "Awash International Bank", account_name: "Arenguade Packaging Factory", account_number: "0132 0876 5432 00" },
        ]);
      }

      const quotes: Record<string, string> = {};
      const replies: Record<string, string> = {};
      const designatedBanks: Record<string, string> = {};

      loadedDesigns.forEach((d) => {
        if (d.quoted_price) quotes[d.id] = String(d.quoted_price);
        if (d.admin_reply) replies[d.id] = d.admin_reply;
        let specs: any = {};
        try {
          specs = typeof d.specs_json === "string" ? JSON.parse(d.specs_json) : (d.specs_json || {});
        } catch {}
        if (specs.designated_bank_account_id) {
          designatedBanks[d.id] = specs.designated_bank_account_id;
        }
      });
      setQuotePrices(quotes);
      setAdminReplies(replies);
      setSelectedBankAccounts(designatedBanks);
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

  const handleAcceptAndQuote = async (id: string) => {
    const rawPrice = quotePrices[id];
    if (!rawPrice || isNaN(Number(rawPrice)) || Number(rawPrice) <= 0) {
      alert("Please enter a valid binding quoted price in ETB before accepting.");
      return;
    }

    const targetBankId = selectedBankAccounts[id] || (bankAccounts[0]?.id ?? null);

    if (!confirm(`Accept this packaging request with "We Can Do It!" and send quotation of ${Number(rawPrice).toLocaleString()} ETB to the customer?`)) return;

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept_and_quote",
          quoted_price: Number(rawPrice),
          admin_reply: adminReplies[id] || "We can do it! Custom dieline approved by our plant engineering desk.",
          bank_account_id: targetBankId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept and quote design.");

      await loadDesigns();
      alert("Design accepted ('We Can Do It!') and notification dispatched to customer to send payment to the designated account!");
    } catch (err: any) {
      alert(err.message || "Failed to accept design.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleVerifyPayment = async (id: string) => {
    if (!confirm("Confirm and verify this customer bank deposit & QR code proof? This will dispatch confirmation to the client: 'It Is On Doing'.")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_payment" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify deposit.");

      await loadDesigns();
      alert("Payment & QR code confirmed! Customer notified: 'It is on doing / now in active production'.");
    } catch (err: any) {
      alert(err.message || "Failed to verify payment deposit.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkFinished = async (id: string) => {
    if (!confirm("Mark this custom packaging order as Finished & QC Approved? This will notify the customer to select their delivery option.")) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_finished" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark as finished.");

      await loadDesigns();
      alert("Order marked finished! Customer notified to select plant pickup or direct address delivery.");
    } catch (err: any) {
      alert(err.message || "Failed to mark finished.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAdvanceStage = async (id: string, stage: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance_stage", stage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to advance stage.");

      await loadDesigns();
      alert(`Manufacturing stage advanced to "${stage}"! Customer notified.`);
    } catch (err: any) {
      alert(err.message || "Failed to advance manufacturing stage.");
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

  const togglePaymentProof = async (designId: string, path: string) => {
    if (paymentProofUrls[designId]) {
      setPaymentProofUrls((prev) => {
        const next = { ...prev };
        delete next[designId];
        return next;
      });
      return;
    }

    try {
      const res = await fetch(`/api/storage/signed-url?bucket=payment-proofs&path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (res.ok && data.signedUrl) {
        setPaymentProofUrls((prev) => ({ ...prev, [designId]: data.signedUrl }));
      } else {
        alert(data.error || "Could not retrieve payment proof screenshot.");
      }
    } catch (err: any) {
      alert("Error loading payment slip: " + err.message);
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
          Customer Design Submissions & B2B Orders
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Inspect client CAD artwork, quote binding prices in ETB, verify bank deposit screenshots, and advance live factory manufacturing stages.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
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

            let specsObj: any = {};
            if (design.specs_json) {
              specsObj = typeof design.specs_json === "string" ? JSON.parse(design.specs_json) : design.specs_json;
            }

            const isPdf = design.file_path?.toLowerCase().endsWith(".pdf");
            const fileUrl = inlineFiles[design.id];
            const paymentProofUrl = paymentProofUrls[design.id];
            const isPaymentSubmitted = Boolean(specsObj.payment_submitted);
            const isPaymentVerified = Boolean(specsObj.payment_verified);
            const currentStage = specsObj.production_stage || (design.status === "accepted" ? "quote_accepted" : "new");

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
                      {isPaymentVerified && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1E3B2E] text-white flex items-center gap-1">
                          <ShieldCheck size={11} />
                          <span>Deposit Confirmed</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-stone-900">
                      {design.title || parsedSpec.clientCompany || "Custom Packaging Request"}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Customer: <strong>{specsObj.customerName || design.profiles?.full_name || "Valued Client"}</strong> ({design.profiles?.email} • {specsObj.contactPhone || design.profiles?.phone || "No phone"})
                    </p>

                    {/* Customer Contact & Delivery Destination Pills */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-semibold border border-stone-200">
                        <User size={13} className="text-[#1E3B2E]" />
                        <span>Contact: <strong>{specsObj.customerName || design.profiles?.full_name || "Client"}</strong></span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-semibold border border-stone-200">
                        <Phone size={13} className="text-[#1E3B2E]" />
                        <a href={`tel:${specsObj.contactPhone || design.profiles?.phone || ""}`} className="font-mono hover:underline font-bold">
                          {specsObj.contactPhone || design.profiles?.phone || "No phone"}
                        </a>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-800 font-semibold border border-stone-200">
                        <MapPin size={13} className="text-[#8C4B31]" />
                        <span>Destination: <strong>{specsObj.deliveryAddress || "Addis Ababa Plant Collection"}</strong></span>
                      </span>
                      {specsObj.companyBrand && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3B2E]/10 text-[#1E3B2E] font-bold">
                          <Building2 size={13} />
                          <span>Brand: {specsObj.companyBrand}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">Target Quantity</span>
                    <span className="font-serif text-2xl font-bold text-[#8C4B31]">
                      {design.quantity || (parsedSpec.quantity ? Number(parsedSpec.quantity).toLocaleString() : "Custom")} Units
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
                    <span className="font-bold text-stone-900">{design.dimensions || parsedSpec.dimensions || "Standard"}</span>
                  </div>
                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Paper Weight</span>
                    <span className="font-bold text-stone-900">{design.gsm ? `${design.gsm} GSM` : parsedSpec.paperWeight || "220 GSM"}</span>
                  </div>
                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Handle Type</span>
                    <span className="font-bold text-stone-900">{design.handle_type || parsedSpec.handleType || "Twisted Cord"}</span>
                  </div>
                  <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-stone-200">
                    <span className="text-stone-400 text-[10px] uppercase font-bold block">Print Finish</span>
                    <span className="font-bold text-stone-900">{design.print_finish || parsedSpec.printFinish || "Soy Screenprint"}</span>
                  </div>
                </div>

                {/* Client Notes & File Actions */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-stone-900 mb-0.5">Customer Instructions:</p>
                    <p className="text-stone-600 italic leading-relaxed">&ldquo;{parsedSpec.notes || design.description || "Specifications provided."}&rdquo;</p>
                  </div>

                  {design.file_path && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleInlineFile(design.id, design.file_path)}
                        disabled={loadingFileId === design.id}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {fileUrl ? <EyeOff size={14} className="text-stone-600" /> : <Eye size={14} className="text-[#1E3B2E]" />}
                        <span>{fileUrl ? "Hide Dieline File" : "Inspect Dieline"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Dieline File Viewer */}
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
                        <span>Open Raw Asset</span>
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

                {/* B2B BANK PAYMENT VERIFICATION MODULE */}
                {isPaymentSubmitted && (
                  <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-300 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-[#8C4B31]" />
                          <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
                            Customer Bank Transfer Payment Slip
                          </h4>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isPaymentVerified ? "bg-emerald-600 text-white" : "bg-amber-200 text-amber-900 animate-pulse"
                          }`}>
                            {isPaymentVerified ? "Deposit & QR Verified" : "QR & Deposit Verification Required"}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900 mt-1 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-bold">
                            <QrCode size={13} className="text-[#1E3B2E]" />
                            <span>QR / Slip Reference:</span>
                          </span>
                          <strong className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300">
                            {specsObj.qr_code_ref || specsObj.payment_ref || "None specified"}
                          </strong>
                          <span>• Submitted: {specsObj.payment_submitted_at ? new Date(specsObj.payment_submitted_at).toLocaleString() : "Recently"}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {specsObj.payment_proof_url && (
                          <button
                            type="button"
                            onClick={() => togglePaymentProof(design.id, specsObj.payment_proof_url)}
                            className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 border border-amber-300 text-xs font-bold text-stone-800 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye size={13} className="text-[#8C4B31]" />
                            <span>{paymentProofUrl ? "Hide Slip" : "View Bank / QR Slip"}</span>
                          </button>
                        )}

                        {!isPaymentVerified && (
                          <button
                            type="button"
                            disabled={actionLoadingId === design.id}
                            onClick={() => handleVerifyPayment(design.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                            <span>Confirm QR & Start Production (&ldquo;It Is On Doing&rdquo;)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Payment Screenshot Preview */}
                    {paymentProofUrl && (
                      <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-stone-300">
                          <span className="font-bold">Bank Payment Confirmation Slip</span>
                          <a href={paymentProofUrl} target="_blank" rel="noreferrer" download className="text-emerald-400 hover:underline">
                            Open Full Resolution
                          </a>
                        </div>
                        <div className="max-h-72 overflow-hidden flex items-center justify-center bg-black/60 rounded-lg p-2">
                          <img src={paymentProofUrl} alt="Bank Deposit Slip" className="max-h-68 w-auto object-contain rounded" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MANUFACTURING STAGES ADVANCEMENT CONTROLS */}
                {design.status === "accepted" && (
                  <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers size={16} className="text-[#1E3B2E]" />
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                          Advance Live Factory Production Stage
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-[#8C4B31] bg-[#8C4B31]/10 px-2.5 py-0.5 rounded-full">
                        Current: {currentStage}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {MANUFACTURING_STAGES.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => handleAdvanceStage(design.id, st.id)}
                          disabled={actionLoadingId === design.id}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            currentStage === st.id
                              ? "bg-[#1E3B2E] text-white shadow-xs"
                              : "bg-[#FAF7F2] text-stone-700 hover:bg-stone-200 border border-stone-300"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100">
                      {currentStage !== "ready_for_delivery" && currentStage !== "delivered" && (
                        <button
                          type="button"
                          onClick={() => handleMarkFinished(design.id)}
                          disabled={actionLoadingId === design.id}
                          className="px-4 py-2 rounded-xl bg-[#8C4B31] hover:bg-[#6D3823] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Truck size={14} />
                          <span>Mark Finished & Request Delivery Option</span>
                        </button>
                      )}

                      {specsObj.delivery_preference && (
                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex flex-wrap items-center gap-2">
                          <Truck size={14} className="text-emerald-700" />
                          <span>
                            Client Delivery Preference: <strong>{specsObj.delivery_preference.option === "pickup" ? "Factory Pickup at Bole Showroom" : `Direct Van Delivery to ${specsObj.delivery_preference.address}`}</strong> (Phone: {specsObj.delivery_preference.phone})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Quotation, Feedback, and Status Controls */}
                <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-stone-200 space-y-4">
                  
                  {/* Top row: Quote Price, Designated Bank, & Status Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                        Binding Quoted Price (ETB):
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
                        Designated Bank Account for Deposit:
                      </label>
                      <select
                        value={selectedBankAccounts[design.id] || (bankAccounts[0]?.id ?? "")}
                        onChange={(e) => setSelectedBankAccounts({ ...selectedBankAccounts, [design.id]: e.target.value })}
                        className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 font-semibold text-stone-900"
                      >
                        {bankAccounts.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bank_name} — {b.account_number}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                        Workflow State:
                      </label>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(["new", "reviewing", "quoted", "accepted", "declined"] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateStatusAndQuote(design.id, st)}
                            disabled={actionLoadingId === design.id}
                            className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all uppercase cursor-pointer ${
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                        Factory Technical Reply / Quotation Note (Customer Notified):
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const priceVal = quotePrices[design.id] || "25000";
                          const targetBank = bankAccounts.find(b => b.id === (selectedBankAccounts[design.id] || bankAccounts[0]?.id)) || bankAccounts[0];
                          const bankText = targetBank ? ` to our official ${targetBank.bank_name} (Acc: ${targetBank.account_number})` : "";
                          const autoText = `We can do it! We have analyzed your custom design dieline and can manufacture your run (${design.dimensions || "Bespoke Size"}, ${design.gsm || 220} GSM kraft, ${design.handle_type || "Twisted Kraft Cord"}, ${design.print_finish || "1-Color Soy"}). Binding quoted price: ${Number(priceVal).toLocaleString()} ETB. Please accept quote and transfer deposit${bankText} to initiate plate engraving.`;
                          setAdminReplies({ ...adminReplies, [design.id]: autoText });
                        }}
                        className="text-[10px] font-bold text-[#8C4B31] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles size={11} />
                        <span>Auto-Fill &quot;We Can Do It!&quot; Proposal</span>
                      </button>
                    </div>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleAcceptAndQuote(design.id)}
                        disabled={actionLoadingId === design.id || !quotePrices[design.id]}
                        className="px-5 py-2.5 rounded-xl bg-[#1E3B2E] hover:bg-[#152a21] disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 size={14} />
                        <span>Accept Design (&ldquo;We Can Do It!&rdquo;) & Send Quote</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatusAndQuote(design.id)}
                        disabled={actionLoadingId === design.id}
                        className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} />
                        <span>Save Status / Reply Only</span>
                      </button>
                    </div>

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
                          className="px-5 py-2.5 rounded-xl bg-[#1E3B2E] hover:bg-emerald-900 disabled:opacity-40 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
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
