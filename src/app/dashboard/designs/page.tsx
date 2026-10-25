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
  Eye,
  QrCode,
  MapPin,
  Phone,
  User,
  PackageCheck
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
  { id: "payment_verified", title: "Deposit Verified", desc: "Bank & QR settlement verified by plant finance desk" },
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
  const [qrCodeRefs, setQrCodeRefs] = useState<Record<string, string>>({});
  const [selectedBanks, setSelectedBanks] = useState<Record<string, string>>({});
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Delivery options selection state per design
  const [deliverySelections, setDeliverySelections] = useState<Record<string, {
    option: "pickup" | "direct_delivery";
    address: string;
    phone: string;
    notes: string;
  }>>({});
  const [deliverySubmittingId, setDeliverySubmittingId] = useState<string | null>(null);

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
      const loadedDesigns: DesignItem[] = designsData.designs || [];
      setDesigns(loadedDesigns);

      // Initialize delivery form selections
      const initialDelivery: Record<string, any> = {};
      loadedDesigns.forEach((d) => {
        let specs: any = {};
        try {
          specs = typeof d.specs_json === "string" ? JSON.parse(d.specs_json) : (d.specs_json || {});
        } catch {}
        initialDelivery[d.id] = {
          option: specs.delivery_preference?.option || "direct_delivery",
          address: specs.delivery_preference?.address || specs.deliveryAddress || "",
          phone: specs.delivery_preference?.phone || specs.contactPhone || "",
          notes: specs.delivery_preference?.notes || "",
        };
      });
      setDeliverySelections(initialDelivery);

      if (banksRes && banksRes.ok) {
        const banksData = await banksRes.json();
        const accs = banksData.accounts || banksData.bankAccounts || [];
        if (accs.length > 0) {
          setBankAccounts(accs);
        } else {
          setBankAccounts([
            { id: "cbe-1", bank_name: "Commercial Bank of Ethiopia (CBE)", account_name: "Ethiopia Arenguade Paper Products PLC", account_number: "1000 1234 5678 9" },
            { id: "telebirr-1", bank_name: "Telebirr Enterprise QR & Till", account_name: "Arenguade Packaging Merchant", account_number: "+251 911 741618 (Till: 893201)" },
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
          ? "Quote accepted! Please transfer using Telebirr QR or CBE, enter your QR transaction reference, and upload your payment proof."
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
    const qrRef = qrCodeRefs[designId] || paymentRefs[designId];

    if (!file && !qrRef) {
      alert("Please provide your Telebirr QR Code / CBE Reference or upload your deposit slip.");
      return;
    }

    setUploadingId(designId);
    try {
      let uploadedFilePath = "";
      if (file) {
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
        uploadedFilePath = uploadData.filePath;
      }

      const patchRes = await fetch(`/api/designs/${designId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_payment",
          payment_proof_url: uploadedFilePath || `qr-ref://${qrRef}`,
          payment_ref: qrRef || paymentRefs[designId] || "",
          qr_code_ref: qrRef || "",
          bank_account_id: selectedBanks[designId] || (bankAccounts[0]?.id ?? null),
        }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        throw new Error(patchData.error || "Failed to register payment proof.");
      }

      await loadData();
      alert("Payment proof and QR reference uploaded successfully! Our Addis Ababa finance team has been notified to verify your deposit.");
    } catch (err: any) {
      alert(err.message || "Error submitting payment proof.");
    } finally {
      setUploadingId(null);
    }
  };

  const handleConfirmDelivery = async (designId: string) => {
    const sel = deliverySelections[designId];
    if (!sel || !sel.option) {
      alert("Please choose a delivery option.");
      return;
    }

    if (sel.option === "direct_delivery" && (!sel.address || sel.address.trim().length < 3)) {
      alert("Please enter a direct delivery address in Addis Ababa or destination city.");
      return;
    }

    setDeliverySubmittingId(designId);
    try {
      const res = await fetch(`/api/designs/${designId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_delivery",
          delivery_option: sel.option,
          delivery_address: sel.address,
          delivery_phone: sel.phone,
          delivery_notes: sel.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm delivery option.");

      await loadData();
      alert("Delivery choice confirmed! Our logistics team will fulfill according to your instructions.");
    } catch (err: any) {
      alert(err.message || "Error confirming delivery preference.");
    } finally {
      setDeliverySubmittingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(id);
    setTimeout(() => setCopiedAccount(null), 2500);
  };

  const openSignedFile = async (path: string, bucket = "designs") => {
    if (path.startsWith("qr-ref://")) {
      alert(`Payment Reference: ${path.replace("qr-ref://", "")}`);
      return;
    }
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
              Submit brand dielines, review factory quotes in ETB, upload QR code / transfer receipts, and track live manufacturing through delivery.
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

        {/* 5-Stage Customer Journey Stepper Banner */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-stone-900 flex items-center gap-2">
              <PackageCheck size={16} className="text-[#1E3B2E]" />
              <span>Transparent 5-Stage Packaging Workflow</span>
            </h3>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Always Know Where Your Order Is
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1 text-xs">
            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-stone-200">
              <div className="flex items-center gap-1.5 text-[#1E3B2E] font-bold text-[11px] mb-1">
                <span className="w-4 h-4 rounded-full bg-[#1E3B2E] text-white flex items-center justify-center text-[10px]">1</span>
                <span>Design Intake</span>
              </div>
              <p className="text-[10px] text-stone-500 leading-snug">
                Submit dieline, company brand, phone, and delivery address.
              </p>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-stone-200">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold text-[11px] mb-1">
                <span className="w-4 h-4 rounded-full bg-purple-800 text-white flex items-center justify-center text-[10px]">2</span>
                <span>"We Can Do It!" Quote</span>
              </div>
              <p className="text-[10px] text-stone-500 leading-snug">
                Factory reviews tolerance & sends binding quote in ETB.
              </p>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-stone-200">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px] mb-1">
                <span className="w-4 h-4 rounded-full bg-blue-800 text-white flex items-center justify-center text-[10px]">3</span>
                <span>QR Code Payment</span>
              </div>
              <p className="text-[10px] text-stone-500 leading-snug">
                Pay via Telebirr QR or CBE bank transfer and input QR reference.
              </p>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-stone-200">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-[11px] mb-1">
                <span className="w-4 h-4 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">4</span>
                <span>"It Is On Doing"</span>
              </div>
              <p className="text-[10px] text-stone-500 leading-snug">
                QR verified: plates engraved, rotary printing & cutting starts.
              </p>
            </div>

            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-stone-200">
              <div className="flex items-center gap-1.5 text-[#8C4B31] font-bold text-[11px] mb-1">
                <span className="w-4 h-4 rounded-full bg-[#8C4B31] text-white flex items-center justify-center text-[10px]">5</span>
                <span>Finished & Delivery</span>
              </div>
              <p className="text-[10px] text-stone-500 leading-snug">
                QC approved: select Bole Showroom pickup or direct delivery.
              </p>
            </div>
          </div>
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
              const isFinished = specsObj.workflow_stage === "finished" || specsObj.production_stage === "ready_for_delivery" || specsObj.workflow_stage === "delivery_confirmed";
              const currentStage = specsObj.production_stage || (isAccepted ? "quote_accepted" : "new");
              const activeStepIdx = getStageStepIndex(currentStage);

              // Delivery preference
              const deliveryPref = specsObj.delivery_preference;

              return (
                <div
                  key={design.id}
                  className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-md space-y-6"
                >
                  {/* Top Bar: Title, ID, Status, and Quoted Price */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
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

                        {isPaymentVerified && !isFinished && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1E3B2E] text-white flex items-center gap-1">
                            <ShieldCheck size={11} />
                            <span>It Is On Doing</span>
                          </span>
                        )}

                        {isFinished && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8C4B31] text-white flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            <span>Run Finished</span>
                          </span>
                        )}
                      </div>

                      <h2 className="font-serif text-2xl font-bold text-stone-900">
                        {design.title || specsObj.companyBrand || parsedSpec.clientCompany || "Custom Paper Bag Design"}
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

                  {/* Customer Contact & Delivery Target Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {(specsObj.customerName || parsedSpec.customerName) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full text-stone-700 font-medium">
                        <User size={12} className="text-[#1E3B2E]" />
                        <span>Contact: <strong>{specsObj.customerName || parsedSpec.customerName}</strong></span>
                      </span>
                    )}

                    {(specsObj.contactPhone || parsedSpec.contactPhone) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full text-stone-700 font-medium">
                        <Phone size={12} className="text-[#1E3B2E]" />
                        <span>Phone: <strong>{specsObj.contactPhone || parsedSpec.contactPhone}</strong></span>
                      </span>
                    )}

                    {(specsObj.deliveryAddress || parsedSpec.deliveryAddress) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#1E3B2E]/10 rounded-full text-[#1E3B2E] font-medium">
                        <MapPin size={12} />
                        <span>Destination: <strong>{specsObj.deliveryAddress || parsedSpec.deliveryAddress}</strong></span>
                      </span>
                    )}

                    {specsObj.qr_code_ref && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 rounded-full text-purple-900 font-mono font-bold">
                        <QrCode size={12} />
                        <span>QR Ref: {specsObj.qr_code_ref}</span>
                      </span>
                    )}
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
                    <div className="p-5 bg-gradient-to-r from-purple-50 to-emerald-50 rounded-2xl border-2 border-purple-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold uppercase mb-1">
                          <CheckCircle2 size={12} />
                          <span>We Can Do It! Factory Accepted Your Design</span>
                        </div>
                        <h4 className="text-sm font-bold text-purple-950">
                          Quotation Ready: {Number(design.quoted_price).toLocaleString()} ETB
                        </h4>
                        <p className="text-[11px] text-stone-700 mt-0.5 leading-relaxed">
                          Our Addis Ababa engineering team verified your dielines and confirmed manufacturing capability. Accept this quote to receive official payment details and begin your production run.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRespondToQuote(design.id, "accept")}
                          disabled={actionLoadingId === design.id}
                          className="px-5 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Accept Quote & Pay</span>
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
                    <div className="p-6 bg-[#FAF7F2] rounded-3xl border-2 border-amber-300 shadow-sm space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-stone-900">
                          <Building2 size={20} className="text-[#8C4B31]" />
                          <div>
                            <h4 className="font-serif text-base font-bold">Step 3: Telebirr QR & CBE Bank Settlement</h4>
                            <p className="text-[11px] text-stone-500">
                              Please transfer the order total ({Number(design.quoted_price).toLocaleString()} ETB) via Telebirr QR or CBE bank transfer, enter the QR reference below, and upload your payment proof.
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          Payment Pending
                        </span>
                      </div>

                      {/* Official Bank & Telebirr QR Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {bankAccounts.map((b) => (
                          <div key={b.id} className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-2">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3B2E] flex items-center gap-1">
                                {b.bank_name.toLowerCase().includes("telebirr") && <QrCode size={13} className="text-[#8C4B31]" />}
                                <span>{b.bank_name}</span>
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
                                  <span>Copy Account / Till</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Upload Screenshot & QR Ref Form */}
                      <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <QrCode size={13} className="text-[#1E3B2E]" />
                              <span>Telebirr QR Transaction ID / Bank Ref *</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. TB-QR-984712 or CBE-FT24109"
                              value={qrCodeRefs[design.id] || paymentRefs[design.id] || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setQrCodeRefs((prev) => ({ ...prev, [design.id]: val }));
                                setPaymentRefs((prev) => ({ ...prev, [design.id]: val }));
                              }}
                              className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                            />
                            <span className="text-[10px] text-stone-400 mt-0.5 block">
                              Enter the Telebirr transaction ID or CBE slip confirmation number.
                            </span>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                              Payment Screenshot / QR Receipt (JPG, PNG, PDF)
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
                        </div>

                        <div className="flex justify-end pt-2 border-t border-stone-100">
                          <button
                            type="button"
                            disabled={uploadingId === design.id || (!paymentFiles[design.id] && !qrCodeRefs[design.id])}
                            onClick={() => handlePaymentSubmit(design.id)}
                            className="px-6 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                          >
                            <Upload size={14} />
                            <span>{uploadingId === design.id ? "Submitting Payment Proof..." : "Submit QR Code & Payment Proof"}</span>
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
                          <span>QR Code & Payment Proof Submitted — Awaiting Plant Verification</span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1">
                          Our Addis Ababa finance desk is analyzing your QR code transaction ({specsObj.qr_code_ref || "Recorded"}). Once confirmed, you will receive our "It Is On Doing" production confirmation and laser platemaking will initiate.
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

                  {/* WORKFLOW PHASE 3: "IT IS ON DOING" BANNER & LIVE MANUFACTURING PIPELINE */}
                  {isPaymentVerified && (
                    <div className="space-y-4">
                      {/* Prominent "It Is On Doing" Confirmation Banner */}
                      <div className="p-5 bg-gradient-to-r from-emerald-900 to-[#1E3B2E] rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                            <Sparkles size={22} className="text-amber-300" />
                          </div>
                          <div>
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                              <ShieldCheck size={11} />
                              <span>Confirmation Verified</span>
                            </div>
                            <h3 className="font-serif text-lg font-bold">
                              It Is On Doing! Active Factory Production
                            </h3>
                            <p className="text-xs text-emerald-100 max-w-xl leading-relaxed mt-0.5">
                              Our plant desk analyzed and confirmed your QR code payment. Your packaging run is actively on doing — plates are engraved and rotary die-cutting is running at our Addis Ababa facility.
                            </p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="text-[10px] text-emerald-200 block uppercase font-bold">Plant Location</span>
                          <span className="text-xs font-bold text-white flex items-center gap-1 sm:justify-end">
                            <MapPin size={12} className="text-amber-300" />
                            <span>Bole Plant #2, Addis Ababa</span>
                          </span>
                        </div>
                      </div>

                      {/* Stepper Pipeline */}
                      <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Layers size={18} className="text-[#1E3B2E]" />
                            <h4 className="font-serif text-sm font-bold text-stone-900">
                              Live Manufacturing Progress
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                            Addis Ababa Plant
                          </span>
                        </div>

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
                      </div>
                    </div>
                  )}

                  {/* WORKFLOW PHASE 4: FINISHED & DELIVERY OPTION SELECTOR */}
                  {isFinished && (
                    <div className="p-6 bg-gradient-to-br from-[#FAF7F2] to-amber-50/40 rounded-3xl border-2 border-[#1E3B2E]/30 shadow-sm space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={20} className="text-emerald-700" />
                          <div>
                            <h4 className="font-serif text-base font-bold text-stone-900">
                              Packaging Run Finished & Quality Inspected!
                            </h4>
                            <p className="text-[11px] text-stone-600">
                              Your bags passed optical tensile and adhesive tests. Please confirm how you would like to receive your shipment.
                            </p>
                          </div>
                        </div>

                        {deliveryPref ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1 self-start sm:self-auto">
                            <Check size={12} />
                            <span>Delivery Preference Confirmed</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold animate-pulse self-start sm:self-auto">
                            Action Required: Select Delivery Option
                          </span>
                        )}
                      </div>

                      {deliveryPref ? (
                        /* Delivery Preference Already Confirmed */
                        <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900 flex items-center gap-1.5">
                              {deliveryPref.option === "pickup" ? (
                                <>
                                  <Building2 size={14} className="text-[#8C4B31]" />
                                  <span>Plant Pickup at Bole Showroom</span>
                                </>
                              ) : (
                                <>
                                  <Truck size={14} className="text-[#1E3B2E]" />
                                  <span>Direct Van Delivery to Your Destination</span>
                                </>
                              )}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              Confirmed on {new Date(deliveryPref.confirmed_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-600 pt-1">
                            {deliveryPref.option === "pickup" ? (
                              <p className="text-[11px]">
                                <strong>Pickup Location:</strong> Bole Sub-City, Arenguade Logistics Center, Addis Ababa (Monday - Saturday 8:30 AM - 5:30 PM). Bring Reference #{design.id.substring(0, 8)}.
                              </p>
                            ) : (
                              <>
                                <p className="text-[11px]">
                                  <strong>Delivery Address:</strong> {deliveryPref.address}
                                </p>
                                <p className="text-[11px]">
                                  <strong>Contact Phone:</strong> {deliveryPref.phone || "Provided at submission"}
                                </p>
                              </>
                            )}
                          </div>

                          {deliveryPref.notes && (
                            <p className="text-[11px] text-stone-500 italic pt-1 border-t border-stone-100">
                              Delivery Notes: &ldquo;{deliveryPref.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      ) : (
                        /* Interactive Delivery Option Form */
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Option A: Pickup */}
                            <div
                              onClick={() => {
                                setDeliverySelections((prev) => ({
                                  ...prev,
                                  [design.id]: {
                                    ...(prev[design.id] || {}),
                                    option: "pickup",
                                  },
                                }));
                              }}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                deliverySelections[design.id]?.option === "pickup"
                                  ? "bg-white border-[#1E3B2E] shadow-sm ring-1 ring-[#1E3B2E]"
                                  : "bg-white/60 border-stone-200 hover:border-stone-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                                  <Building2 size={14} className="text-[#8C4B31]" />
                                  <span>Factory Pickup (Free)</span>
                                </span>
                                <input
                                  type="radio"
                                  name={`deliv-opt-${design.id}`}
                                  checked={deliverySelections[design.id]?.option === "pickup"}
                                  onChange={() => {}}
                                  className="accent-[#1E3B2E]"
                                />
                              </div>
                              <p className="text-[11px] text-stone-500 leading-snug">
                                Collect from our Bole Showroom & Logistics Hub (Addis Ababa). Mon-Sat 8:30 AM - 5:30 PM.
                              </p>
                            </div>

                            {/* Option B: Direct Delivery */}
                            <div
                              onClick={() => {
                                setDeliverySelections((prev) => ({
                                  ...prev,
                                  [design.id]: {
                                    ...(prev[design.id] || {}),
                                    option: "direct_delivery",
                                  },
                                }));
                              }}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                deliverySelections[design.id]?.option === "direct_delivery"
                                  ? "bg-white border-[#1E3B2E] shadow-sm ring-1 ring-[#1E3B2E]"
                                  : "bg-white/60 border-stone-200 hover:border-stone-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                                  <Truck size={14} className="text-[#1E3B2E]" />
                                  <span>Direct Van Delivery</span>
                                </span>
                                <input
                                  type="radio"
                                  name={`deliv-opt-${design.id}`}
                                  checked={deliverySelections[design.id]?.option === "direct_delivery"}
                                  onChange={() => {}}
                                  className="accent-[#1E3B2E]"
                                />
                              </div>
                              <p className="text-[11px] text-stone-500 leading-snug">
                                Palletized dispatch directly to your warehouse, store, or office in Addis Ababa or region.
                              </p>
                            </div>
                          </div>

                          {/* Conditional Fields for Direct Delivery */}
                          {deliverySelections[design.id]?.option === "direct_delivery" && (
                            <div className="p-4 bg-white rounded-2xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                                  Delivery Destination Address *
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Bole Medhanialem, Building 4, Addis Ababa"
                                  value={deliverySelections[design.id]?.address || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDeliverySelections((prev) => ({
                                      ...prev,
                                      [design.id]: { ...prev[design.id], address: val },
                                    }));
                                  }}
                                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-xs focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                                  Receiving Contact Phone *
                                </label>
                                <input
                                  type="tel"
                                  placeholder="e.g. 0911234567"
                                  value={deliverySelections[design.id]?.phone || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDeliverySelections((prev) => ({
                                      ...prev,
                                      [design.id]: { ...prev[design.id], phone: val },
                                    }));
                                  }}
                                  className="w-full border border-stone-300 rounded-xl p-2.5 bg-[#FAF7F2] text-xs focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                                  Delivery Instructions / Gate Notes (Optional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Call 30 mins before arrival; loading dock in rear."
                                  value={deliverySelections[design.id]?.notes || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDeliverySelections((prev) => ({
                                      ...prev,
                                      [design.id]: { ...prev[design.id], notes: val },
                                    }));
                                  }}
                                  className="w-full border border-stone-300 rounded-xl p-2 bg-[#FAF7F2] text-xs focus:outline-none"
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={deliverySubmittingId === design.id}
                              onClick={() => handleConfirmDelivery(design.id)}
                              className="px-6 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 size={14} />
                              <span>{deliverySubmittingId === design.id ? "Saving Preference..." : "Confirm Delivery Preference"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dispatch facility note & order link */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-500 border-t border-stone-100 gap-2">
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
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
