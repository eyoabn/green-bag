"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  PenTool, 
  Sparkles, 
  Check, 
  X, 
  Download, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  MessageSquare,
  FileText,
  Upload,
  Building2,
  Copy,
  Layers,
  Truck,
  ShieldCheck,
  CheckCircle,
  Eye
} from "lucide-react";

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  instructions?: string;
}

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
}

const MANUFACTURING_STEPS = [
  { id: "dieline_approved", title: "Dieline Approved", desc: "CAD specifications verified by plant engineers" },
  { id: "payment_verified", title: "Deposit Verified", desc: "Bank settlement verified by plant finance desk" },
  { id: "plate_engraving", title: "Plate Engraving & Pigments", desc: "Laser flexo platemaking & food-grade ink formulation" },
  { id: "printing_and_cutting", title: "Die-Cutting & Assembly", desc: "Rotary die-cutting, folding & handle reinforcement" },
  { id: "ready_for_delivery", title: "QC & Dispatched", desc: "Optical tensile testing complete; packaged for delivery" },
];

export default function CustomerDesignsPage() {
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Payment upload state per design
  const [paymentFiles, setPaymentFiles] = useState<Record<string, File>>({});
  const [paymentRefs, setPaymentRefs] = useState<Record<string, string>>({});
  const [selectedBanks, setSelectedBanks] = useState<Record<string, string>>({});
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [designsRes, banksRes] = await Promise.all([
        fetch("/api/designs"),
        fetch("/api/bank-accounts").catch(() => null),
      ]);

      const designsData = await designsRes.json();
      if (!designsRes.ok) throw new Error(designsData.error || "Failed to load custom designs.");
      setDesigns(designsData.designs || []);

      if (banksRes && banksRes.ok) {
        const banksData = await banksRes.json();
        const accs = banksData.accounts || banksData.bankAccounts || [];
        if (accs.length > 0) {
          setBankAccounts(accs);
        } else {
          // Default official accounts if database has none
          setBankAccounts([
            { id: "cbe-1", bank_name: "Commercial Bank of Ethiopia (CBE)", account_name: "Ethiopia Arenguade Paper Products PLC", account_number: "1000 1234 5678 9" },
            { id: "telebirr-1", bank_name: "Telebirr Enterprise", account_name: "Arenguade Packaging Merchant", account_number: "+251 911 741618" },
            { id: "awash-1", bank_name: "Awash International Bank", account_name: "Arenguade Packaging Factory", account_number: "0132 0876 5432 00" },
          ]);
        }
      }
    } catch (err: any) {
      console.error("Load designs error:", err);
      setErrorMsg(err.message || "Failed to load designs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

      await loadData();
      alert(
        action === "accept"
          ? "Quote accepted! You can now transfer your deposit using the bank details below and upload your screenshot."
          : "Quote declined."
      );
    } catch (err: any) {
      alert(err.message || "Could not respond to quotation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePaymentSubmit = async (designId: string) => {
    const file = paymentFiles[designId];
    if (!file) {
      alert("Please select your bank transfer payment screenshot first.");
      return;
    }

    setUploadingId(designId);
    try {
      // 1. Upload screenshot to payment-proofs bucket
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "payment-proofs");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.filePath) {
        throw new Error(uploadData.error || "Failed to upload payment receipt screenshot.");
      }

      // 2. Patch design with payment details
      const patchRes = await fetch(`/api/designs/${designId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_payment",
          payment_proof_url: uploadData.filePath,
          payment_ref: paymentRefs[designId] || "",
          bank_account_id: selectedBanks[designId] || (bankAccounts[0]?.id ?? null),
        }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        throw new Error(patchData.error || "Failed to register payment proof.");
      }

      await loadData();
      alert("Payment proof uploaded successfully! Our Addis Ababa finance team has been notified to verify your deposit.");
    } catch (err: any) {
      alert(err.message || "Error submitting payment proof.");
    } finally {
      setUploadingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  const openSignedFile = async (path: string, bucket = "designs") => {
    try {
      const res = await fetch(`/api/storage/signed-url?bucket=${bucket}&path=${encodeURIComponent(path)}`);
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

  const getStageStepIndex = (stage?: string) => {
    if (!stage) return 0;
    switch (stage) {
      case "quote_accepted":
      case "dieline_approved":
        return 0;
      case "payment_submitted":
        return 0;
      case "payment_verified":
        return 1;
      case "plate_engraving":
        return 2;
      case "printing_and_cutting":
        return 3;
      case "assembly_and_qc":
      case "ready_for_delivery":
      case "delivered":
        return 4;
      default:
        return 0;
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
              <span>B2B Bespoke Packaging Pipeline</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              My Custom Designs & Orders
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Submit brand dielines, review factory quotes in ETB, upload transfer screenshots, and monitor live manufacturing progress.
            </p>
          </div>

          <Link
            href="/design-submission"
            className="px-6 py-3 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <PenTool size={14} />
            <span>Submit New Custom Bag</span>
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
              Have a custom brand logo, dimensions, or dieline for your paper packaging? Submit your artwork to our Addis Ababa plant for instant engineering preflight and a binding quotation.
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
          <div className="space-y-8">
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

              const isAccepted = design.status === "accepted";
              const isPaymentSubmitted = Boolean(specsObj.payment_submitted);
              const isPaymentVerified = Boolean(specsObj.payment_verified);
              const currentStage = specsObj.production_stage || (isAccepted ? "quote_accepted" : "new");
              const activeStepIdx = getStageStepIndex(currentStage);

              return (
                <div
                  key={design.id}
                  className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-md space-y-6"
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
                        {isPaymentVerified && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1E3B2E] text-white flex items-center gap-1">
                            <ShieldCheck size={11} />
                            <span>In Production</span>
                          </span>
                        )}
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
                      <span className="font-bold text-stone-900">{design.dimensions || parsedSpec.dimensions || "Bespoke Size"}</span>
                    </div>
                    <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-stone-200">
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Paper Grammage</span>
                      <span className="font-bold text-stone-900">{design.gsm ? `${design.gsm} GSM Kraft` : parsedSpec.paperWeight || "220 GSM"}</span>
                    </div>
                    <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-stone-200">
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Handle Type</span>
                      <span className="font-bold text-stone-900">{design.handle_type || parsedSpec.handleType || "Twisted Paper Cord"}</span>
                    </div>
                    <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-stone-200">
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Target Volume</span>
                      <span className="font-bold text-stone-900">
                        {design.quantity || (parsedSpec.quantity ? `${Number(parsedSpec.quantity).toLocaleString()} Units` : "Custom Run")}
                      </span>
                    </div>
                  </div>

                  {/* Customer Description / Notes & File Download */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-stone-900 mb-0.5">Design Description & Notes:</p>
                      <p className="text-stone-600 italic leading-relaxed">
                        &ldquo;{parsedSpec.notes || design.description || "Custom specifications provided."}&rdquo;
                      </p>
                    </div>

                    {design.file_path && (
                      <button
                        onClick={() => openSignedFile(design.file_path, "designs")}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Download size={14} className="text-[#8C4B31]" />
                        <span>View Design Asset</span>
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
                          <strong>{Number(design.quoted_price).toLocaleString()} ETB</strong>. Accept to proceed to deposit settlement.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRespondToQuote(design.id, "accept")}
                          disabled={actionLoadingId === design.id}
                          className="px-5 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Accept Quote</span>
                        </button>
                        <button
                          onClick={() => handleRespondToQuote(design.id, "decline")}
                          disabled={actionLoadingId === design.id}
                          className="px-4 py-2.5 rounded-full bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold border border-stone-300 transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {/* WORKFLOW PHASE 1: ACCEPTED BUT PAYMENT NOT YET SUBMITTED */}
                  {isAccepted && !isPaymentSubmitted && (
                    <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-amber-300 shadow-xs space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-stone-900">
                          <Building2 size={18} className="text-[#8C4B31]" />
                          <div>
                            <h4 className="font-serif text-base font-bold">Step 2: Bank Deposit & Settlement</h4>
                            <p className="text-[11px] text-stone-500">
                              Please deposit the order total ({Number(design.quoted_price).toLocaleString()} ETB) into one of our official factory accounts and upload your transfer screenshot below.
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">
                          Payment Pending
                        </span>
                      </div>

                      {/* Official Bank Account Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {bankAccounts.map((b) => (
                          <div key={b.id} className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3B2E] block">
                                {b.bank_name}
                              </span>
                              <p className="text-xs font-mono font-bold text-stone-900 mt-1 select-all">
                                {b.account_number}
                              </p>
                              <p className="text-[10px] text-stone-500 mt-0.5 truncate">{b.account_name}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(b.account_number, b.id)}
                              className="text-[11px] font-bold text-stone-700 hover:text-[#8C4B31] flex items-center gap-1 self-start cursor-pointer"
                            >
                              {copiedAccount === b.id ? (
                                <>
                                  <Check size={12} className="text-emerald-600" />
                                  <span className="text-emerald-700">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Copy Account</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Upload Screenshot Dropzone & Form */}
                      <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                              Payment Screenshot / Deposit Slip (JPG, PNG, PDF)
                            </label>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) setPaymentFiles((prev) => ({ ...prev, [design.id]: f }));
                              }}
                              className="w-full text-xs text-stone-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1E3B2E] file:text-white hover:file:bg-[#8C4B31] cursor-pointer"
                            />
                            {paymentFiles[design.id] && (
                              <p className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                                <CheckCircle size={12} />
                                <span>Selected: {paymentFiles[design.id].name} ({(paymentFiles[design.id].size / 1024).toFixed(1)} KB)</span>
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                              Transaction Reference / Slip No. (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. CBE-TXN-984712 or Telebirr ID"
                              value={paymentRefs[design.id] || ""}
                              onChange={(e) => setPaymentRefs((prev) => ({ ...prev, [design.id]: e.target.value }))}
                              className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-stone-100">
                          <button
                            type="button"
                            disabled={uploadingId === design.id || !paymentFiles[design.id]}
                            onClick={() => handlePaymentSubmit(design.id)}
                            className="px-6 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                          >
                            <Upload size={14} />
                            <span>{uploadingId === design.id ? "Uploading Screenshot..." : "Submit Bank Payment Proof"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WORKFLOW PHASE 2: PAYMENT SUBMITTED, AWAITING ADMIN VERIFICATION */}
                  {isPaymentSubmitted && !isPaymentVerified && (
                    <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2 text-amber-950 font-bold">
                          <Clock size={16} className="text-amber-700 animate-spin" />
                          <span>Bank Payment Proof Submitted — Awaiting Finance Verification</span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1">
                          Our Addis Ababa finance desk is verifying your deposit slip. Once approved, the production line will immediately begin engraving your printing plates.
                        </p>
                      </div>

                      {specsObj.payment_proof_url && (
                        <button
                          type="button"
                          onClick={() => openSignedFile(specsObj.payment_proof_url, "payment-proofs")}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 border border-amber-300 text-stone-800 font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Eye size={13} className="text-[#8C4B31]" />
                          <span>View Uploaded Slip</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* WORKFLOW PHASE 3: LIVE MANUFACTURING PROGRESS STEPPER */}
                  {isAccepted && isPaymentSubmitted && (
                    <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <Layers size={18} className="text-[#1E3B2E]" />
                          <h4 className="font-serif text-sm font-bold text-stone-900">
                            Live Factory Manufacturing Status
                          </h4>
                        </div>
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                          Addis Ababa Production Plant
                        </span>
                      </div>

                      {/* Stepper Pipeline */}
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                        {MANUFACTURING_STEPS.map((step, idx) => {
                          const isDone = isPaymentVerified ? idx <= activeStepIdx : idx === 0;
                          const isCurrent = isPaymentVerified ? idx === activeStepIdx : idx === 1;

                          return (
                            <div
                              key={step.id}
                              className={`p-3.5 rounded-2xl border transition-all ${
                                isDone
                                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                                  : isCurrent
                                  ? "bg-amber-50/70 border-amber-300 text-amber-950 animate-pulse ring-1 ring-amber-300"
                                  : "bg-[#FAF7F2] border-stone-200 text-stone-400"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider">
                                  Step 0{idx + 1}
                                </span>
                                {isDone ? (
                                  <CheckCircle2 size={14} className="text-emerald-600" />
                                ) : isCurrent ? (
                                  <Clock size={14} className="text-amber-600" />
                                ) : (
                                  <div className="w-2.5 h-2.5 rounded-full border border-stone-300" />
                                )}
                              </div>
                              <h5 className="font-bold text-xs">{step.title}</h5>
                              <p className="text-[10px] mt-0.5 leading-tight opacity-80">{step.desc}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Latest Engineer Update Note */}
                      <div className="pt-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100">
                        <span className="flex items-center gap-1.5">
                          <Truck size={14} className="text-[#1E3B2E]" />
                          <span>Dispatch Facility: Bole Industrial Zone, Addis Ababa</span>
                        </span>
                        {design.linked_order_id && (
                          <Link
                            href={`/dashboard/orders/${design.linked_order_id}`}
                            className="text-[#8C4B31] font-bold hover:underline flex items-center gap-1"
                          >
                            <span>View Associated Order #{design.linked_order_id.substring(0, 8)}</span>
                            <ArrowRight size={12} />
                          </Link>
                        )}
                      </div>
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
