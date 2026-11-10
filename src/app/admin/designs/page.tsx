"use client";

import { useState, useEffect, useMemo } from "react";
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
  QrCode, 
  Search, 
  RefreshCw, 
  Inbox
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
  { id: "all", label: "All Requests" },
  { id: "new", label: "New Needs Quote" },
  { id: "reviewing", label: "In Review" },
  { id: "quoted", label: "Awaiting Client Payment" },
  { id: "accepted", label: "In Production" },
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
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Local edit state per design
  const [quotePrices, setQuotePrices] = useState<Record<string, string>>({});
  const [adminReplies, setAdminReplies] = useState<Record<string, string>>({});
  const [selectedBankAccounts, setSelectedBankAccounts] = useState<Record<string, string>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Active expanded tabs per card ("overview" | "quote" | "production")
  const [activeCardTabs, setActiveCardTabs] = useState<Record<string, "overview" | "quote" | "production">>({});

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
        fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } }),
        fetch("/api/bank-accounts", { cache: "no-store", headers: { "Cache-Control": "no-cache" } }).catch(() => null),
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
      const defaultTabs: Record<string, "overview" | "quote" | "production"> = {};

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

        // Set default intelligent tab depending on state
        if (d.status === "accepted") {
          defaultTabs[d.id] = "production";
        } else if (d.status === "new" || d.status === "reviewing") {
          defaultTabs[d.id] = "quote";
        } else {
          defaultTabs[d.id] = "overview";
        }
      });

      setQuotePrices(quotes);
      setAdminReplies(replies);
      setSelectedBankAccounts(designatedBanks);
      setActiveCardTabs(defaultTabs);
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

  // Executive Metrics
  const metrics = useMemo(() => {
    let total = designs.length;
    let needsQuote = 0;
    let paymentPending = 0;
    let inProduction = 0;
    let finished = 0;

    designs.forEach((d) => {
      let s: any = {};
      try {
        s = typeof d.specs_json === "string" ? JSON.parse(d.specs_json) : (d.specs_json || {});
      } catch {}

      if (d.status === "new" || d.status === "reviewing") {
        needsQuote++;
      } else if (d.status === "quoted") {
        if (s.payment_submitted && !s.payment_verified) {
          paymentPending++;
        }
      } else if (d.status === "accepted") {
        if (s.production_stage === "ready_for_delivery" || s.production_stage === "delivered") {
          finished++;
        } else {
          inProduction++;
        }
      }
    });

    return { total, needsQuote, paymentPending, inProduction, finished };
  }, [designs]);

  // Filtered designs by search query
  const filteredDesigns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return designs;

    return designs.filter((d) => {
      let specs: any = {};
      try {
        specs = typeof d.specs_json === "string" ? JSON.parse(d.specs_json) : (d.specs_json || {});
      } catch {}

      const titleMatch = (d.title || "").toLowerCase().includes(q);
      const idMatch = d.id.toLowerCase().includes(q);
      const nameMatch = (specs.customerName || d.profiles?.full_name || "").toLowerCase().includes(q);
      const emailMatch = (d.profiles?.email || "").toLowerCase().includes(q);
      const phoneMatch = (specs.contactPhone || d.profiles?.phone || "").toLowerCase().includes(q);
      const brandMatch = (specs.companyBrand || "").toLowerCase().includes(q);

      return titleMatch || idMatch || nameMatch || emailMatch || phoneMatch || brandMatch;
    });
  }, [designs, searchQuery]);

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
    <div className="flex flex-col max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* 1. Header & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Custom Manufacturing & Design Studio Desk
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            Customer Design Submissions & B2B Orders
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-3xl">
            Review client CAD dielines, issue binding price proposals in ETB, verify bank deposit slips (CBE, Telebirr, Awash), and track active rotary press runs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadDesigns}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh Submissions</span>
          </button>

          <Link
            href="/admin/orders"
            className="px-4 py-2.5 rounded-xl bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <ShoppingBag size={14} />
            <span>Factory Orders</span>
          </Link>
        </div>
      </div>

      {/* 2. Executive Status Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Submissions</span>
          <span className="font-serif text-2xl font-bold text-stone-900 mt-1 block">{metrics.total}</span>
          <span className="text-[10px] text-stone-500 block mt-0.5">All customer dielines</span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs transition-all ${
          metrics.needsQuote > 0 ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-300" : "bg-white border-stone-200/90"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Needs Quote</span>
            {metrics.needsQuote > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </div>
          <span className="font-serif text-2xl font-bold text-amber-950 mt-1 block">{metrics.needsQuote}</span>
          <span className="text-[10px] text-amber-800/80 block mt-0.5">Awaiting engineering review</span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs transition-all ${
          metrics.paymentPending > 0 ? "bg-blue-50/70 border-blue-300 ring-1 ring-blue-300" : "bg-white border-stone-200/90"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Deposit Uploaded</span>
            {metrics.paymentPending > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
          </div>
          <span className="font-serif text-2xl font-bold text-blue-950 mt-1 block">{metrics.paymentPending}</span>
          <span className="text-[10px] text-blue-800/80 block mt-0.5">Bank slip verify required</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">In Production</span>
          <span className="font-serif text-2xl font-bold text-emerald-950 mt-1 block">{metrics.inProduction}</span>
          <span className="text-[10px] text-emerald-700/80 block mt-0.5">Platemaking & press run</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Ready / Delivered</span>
          <span className="font-serif text-2xl font-bold text-stone-900 mt-1 block">{metrics.finished}</span>
          <span className="text-[10px] text-stone-500 block mt-0.5">Completed runs</span>
        </div>
      </div>

      {/* 3. Search Bar and Status Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by client name, brand, dieline title, phone, email, or #ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-300 text-xs bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Bank Accounts pill info */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 text-xs shrink-0">
            <Building2 size={13} className="text-[#1E3B2E]" />
            <span className="font-bold">{bankAccounts.length} Settlement Banks Active</span>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFilter === f.id
                  ? "bg-[#1E3B2E] text-white shadow-xs"
                  : "bg-[#FAF7F2] text-stone-700 hover:bg-stone-200/70 border border-stone-300/80"
              }`}
            >
              <span>{f.label}</span>
              {f.id === "new" && metrics.needsQuote > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-stone-900 text-[10px] font-bold flex items-center justify-center">
                  {metrics.needsQuote}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 font-semibold">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4. Submissions List View */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-16 text-center text-stone-400 text-xs">
          <div className="w-8 h-8 border-2 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading custom design submissions from database...
        </div>
      ) : filteredDesigns.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-16 text-center text-stone-500 space-y-2">
          <Inbox size={36} className="mx-auto text-stone-300 mb-1" />
          <h3 className="font-serif text-lg font-bold text-stone-800">No Design Submissions Found</h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            {searchQuery 
              ? `No requests match "${searchQuery}". Try clearing search keywords.`
              : selectedFilter === "all"
              ? "When clients submit custom bag requests from /design-submission, they will appear here ready for engineering review."
              : `No custom requests currently in status "${selectedFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredDesigns.map((design) => {
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
            const activeTab = activeCardTabs[design.id] || "overview";

            // Status color helper
            const getStatusBadge = (status: string) => {
              switch (status) {
                case "new":
                  return "bg-amber-100 text-amber-900 border-amber-300 animate-pulse";
                case "reviewing":
                  return "bg-blue-100 text-blue-900 border-blue-300";
                case "quoted":
                  return "bg-purple-100 text-purple-900 border-purple-300";
                case "accepted":
                  return "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold";
                case "declined":
                  return "bg-stone-200 text-stone-700 border-stone-300";
                default:
                  return "bg-stone-100 text-stone-800 border-stone-200";
              }
            };

            return (
              <div
                key={design.id}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-xs hover:border-stone-300 transition-all overflow-hidden"
              >
                {/* A. Top Urgent Notification Strip if Action Needed */}
                {design.status === "new" && (
                  <div className="bg-amber-500/15 border-b border-amber-300/80 px-6 py-2 flex items-center justify-between text-xs text-amber-950 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-700" />
                      <span><strong>Action Required:</strong> New customer submission. Inspect dieline and propose binding ETB quote.</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-900">Step 1 of 4</span>
                  </div>
                )}

                {isPaymentSubmitted && !isPaymentVerified && (
                  <div className="bg-blue-500/15 border-b border-blue-300/80 px-6 py-2 flex items-center justify-between text-xs text-blue-950 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <QrCode size={14} className="text-blue-700 animate-pulse" />
                      <span><strong>Deposit Slip Uploaded:</strong> Customer transferred funds. Verify slip below to start production (&ldquo;It Is On Doing&rdquo;).</span>
                    </span>
                    <button
                      onClick={() => handleVerifyPayment(design.id)}
                      disabled={actionLoadingId === design.id}
                      className="px-3 py-1 rounded-full bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Verify Now
                    </button>
                  </div>
                )}

                {/* B. Main Card Header */}
                <div className="p-6 sm:p-7 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                          #{design.id.substring(0, 8)}
                        </span>
                        <span className={`px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(design.status)}`}>
                          {design.status === "accepted" ? "In Production" : design.status}
                        </span>
                        {isPaymentVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1E3B2E] text-white text-[10px] font-bold">
                            <ShieldCheck size={11} className="text-emerald-400" />
                            <span>Deposit Confirmed</span>
                          </span>
                        )}
                        {design.linked_order_id && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            Order Linked
                          </span>
                        )}
                      </div>

                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
                        {design.title || parsedSpec.clientCompany || "Custom Paper Packaging Commission"}
                      </h2>

                      {/* Customer Info Row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-stone-600 pt-0.5">
                        <span className="inline-flex items-center gap-1 font-bold text-stone-900">
                          <User size={13} className="text-[#1E3B2E]" />
                          <span>{specsObj.customerName || design.profiles?.full_name || "Valued Client"}</span>
                        </span>
                        {specsObj.companyBrand && (
                          <span className="inline-flex items-center gap-1 font-bold text-[#8C4B31]">
                            <Building2 size={13} />
                            <span>{specsObj.companyBrand}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Phone size={13} className="text-stone-400" />
                          <a href={`tel:${specsObj.contactPhone || design.profiles?.phone || ""}`} className="font-mono hover:underline text-stone-800">
                            {specsObj.contactPhone || design.profiles?.phone || "No phone"}
                          </a>
                        </span>
                        <span className="text-stone-400 font-mono">
                          {design.profiles?.email}
                        </span>
                        <span className="inline-flex items-center gap-1 text-stone-500">
                          <MapPin size={13} className="text-stone-400" />
                          <span>{specsObj.deliveryAddress || "Addis Ababa Plant Collection"}</span>
                        </span>
                      </div>
                    </div>

                    {/* Right summary: Quantity & Quoted Price */}
                    <div className="text-left md:text-right bg-[#FAF7F2] md:bg-transparent p-4 md:p-0 rounded-2xl border md:border-0 border-stone-200/80 shrink-0 space-y-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Target Quantity</span>
                      <span className="font-serif text-2xl font-bold text-[#8C4B31] block">
                        {design.quantity || (parsedSpec.quantity ? Number(parsedSpec.quantity).toLocaleString() : "Custom")} Units
                      </span>
                      {design.quoted_price ? (
                        <div className="pt-1">
                          <span className="text-[10px] text-stone-400 block uppercase font-bold">Binding Quoted Price</span>
                          <span className="font-mono font-bold text-stone-900 text-lg">
                            {Number(design.quoted_price).toLocaleString()} ETB
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mt-1">
                          Awaiting Quote
                        </span>
                      )}
                      <span className="text-[10px] text-stone-400 block mt-1 font-mono">
                        Submitted {new Date(design.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* C. Specifications Grid (4 High-Contrast Clean Chips) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Dimensions</span>
                      <span className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5 block truncate">
                        {design.dimensions || parsedSpec.dimensions || "Standard Size"}
                      </span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Paper Weight</span>
                      <span className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5 block">
                        {design.gsm ? `${design.gsm} GSM Kraft` : parsedSpec.paperWeight || "220 GSM Kraft"}
                      </span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Handle Construction</span>
                      <span className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5 block truncate">
                        {design.handle_type || parsedSpec.handleType || "Twisted Kraft Cord"}
                      </span>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Print Finish</span>
                      <span className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5 block truncate">
                        {design.print_finish || parsedSpec.printFinish || "Precision Soy Screenprint"}
                      </span>
                    </div>
                  </div>

                  {/* D. Segmented Section Selector (Focus Switcher) */}
                  <div className="flex items-center gap-2 border-b border-stone-200 pb-2 pt-2 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setActiveCardTabs((prev) => ({ ...prev, [design.id]: "overview" }))}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "overview"
                          ? "bg-[#1E3B2E] text-white shadow-xs"
                          : "text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      <FileText size={13} />
                      <span>1. Dieline Artwork & Notes</span>
                      {design.file_path && (
                        <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded-full">
                          Asset Attached
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCardTabs((prev) => ({ ...prev, [design.id]: "quote" }))}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "quote"
                          ? "bg-[#1E3B2E] text-white shadow-xs"
                          : "text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      <DollarSign size={13} />
                      <span>2. Pricing & Quotation Desk</span>
                      {!design.quoted_price && (
                        <span className="text-[10px] bg-amber-400 text-stone-900 font-bold px-1.5 py-0.2 rounded-full">
                          Action
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCardTabs((prev) => ({ ...prev, [design.id]: "production" }))}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "production"
                          ? "bg-[#1E3B2E] text-white shadow-xs"
                          : "text-stone-600 hover:bg-stone-100"
                      }`}
                    >
                      <Layers size={13} />
                      <span>3. Payment Verification & Factory Stages</span>
                      {isPaymentSubmitted && !isPaymentVerified && (
                        <span className="text-[10px] bg-blue-500 text-white font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                          Deposit Slip
                        </span>
                      )}
                    </button>
                  </div>

                  {/* ========================================================= */}
                  {/* TAB 1: DIELINE ARTWORK & CUSTOMER INSTRUCTIONS */}
                  {/* ========================================================= */}
                  {activeTab === "overview" && (
                    <div className="space-y-4 pt-1 animate-in fade-in">
                      <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Customer Instructions & Specifications</span>
                          <p className="text-xs text-stone-800 italic leading-relaxed">
                            &ldquo;{parsedSpec.notes || design.description || "No additional custom instructions provided by customer."}&rdquo;
                          </p>
                        </div>

                        {design.file_path && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleInlineFile(design.id, design.file_path)}
                              disabled={loadingFileId === design.id}
                              className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-900 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              {fileUrl ? <EyeOff size={14} className="text-stone-500" /> : <Eye size={14} className="text-[#1E3B2E]" />}
                              <span>{fileUrl ? "Collapse Viewer" : "Inspect Dieline File"}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Embedded Preflight Dieline File Viewer */}
                      {fileUrl && (
                        <div className="p-4 bg-stone-900 rounded-3xl border border-stone-800 space-y-3">
                          <div className="flex items-center justify-between text-xs text-stone-300">
                            <span className="font-bold flex items-center gap-1.5">
                              <FileText size={15} className="text-[#E0B382]" />
                              <span>Preflight Artwork File ({design.file_path})</span>
                            </span>
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-bold text-xs"
                            >
                              <Download size={13} />
                              <span>Download Original Artwork</span>
                            </a>
                          </div>

                          <div className="w-full max-h-[520px] rounded-2xl overflow-hidden bg-black/70 flex items-center justify-center p-2 border border-stone-800">
                            {isPdf ? (
                              <iframe
                                src={fileUrl}
                                className="w-full h-[480px] rounded-xl border-0 bg-white"
                                title="CAD Dieline PDF Preview"
                              />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={fileUrl}
                                alt="CAD Dieline Preview"
                                className="max-h-[480px] w-auto object-contain rounded-xl"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* TAB 2: PRICING & QUOTATION DESK */}
                  {/* ========================================================= */}
                  {activeTab === "quote" && (
                    <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-stone-200/90 space-y-5 pt-4 animate-in fade-in">
                      
                      {/* Price, Bank Selector, and Workflow Status Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                            Binding Quoted Price (ETB):
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="e.g. 45000"
                              value={quotePrices[design.id] ?? ""}
                              onChange={(e) => setQuotePrices({ ...quotePrices, [design.id]: e.target.value })}
                              className="w-full p-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 font-mono font-bold text-stone-900"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">
                              ETB
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400 mt-1 block">Full run total price including die-plate</span>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                            Designated Bank for Customer Deposit:
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
                          <span className="text-[10px] text-stone-400 mt-1 block">Included in customer quotation notification</span>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block mb-1">
                            Manual Workflow Override:
                          </label>
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {(["new", "reviewing", "quoted", "accepted", "declined"] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleUpdateStatusAndQuote(design.id, st)}
                                disabled={actionLoadingId === design.id}
                                className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all uppercase cursor-pointer ${
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

                      {/* Technical Proposal Message to Customer */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-stone-700 block">
                            Factory Engineering Proposal Note (Customer Sees This):
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
                            <Sparkles size={12} />
                            <span>Auto-Fill &quot;We Can Do It!&quot; Proposal</span>
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="E.g. We can produce 5,000 units on 220 GSM kraft with hot gold foil stamping. Estimated dispatch 10 business days."
                          value={adminReplies[design.id] ?? ""}
                          onChange={(e) => setAdminReplies({ ...adminReplies, [design.id]: e.target.value })}
                          className="w-full p-3 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30 font-medium"
                        />
                      </div>

                      {/* Action Submission Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            onClick={() => handleAcceptAndQuote(design.id)}
                            disabled={actionLoadingId === design.id || !quotePrices[design.id]}
                            className="px-5 py-2.5 rounded-xl bg-[#1E3B2E] hover:bg-[#8C4B31] disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                          >
                            <CheckCircle2 size={15} />
                            <span>Accept Design (&ldquo;We Can Do It!&rdquo;) & Send Quote</span>
                          </button>

                          <button
                            onClick={() => handleUpdateStatusAndQuote(design.id)}
                            disabled={actionLoadingId === design.id}
                            className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check size={14} />
                            <span>Save Reply & Price Only</span>
                          </button>
                        </div>

                        {/* Order Conversion Button */}
                        <div>
                          {design.linked_order_id ? (
                            <Link
                              href="/admin/orders"
                              className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <ShoppingBag size={14} className="text-emerald-700" />
                              <span>View Converted Order (#{design.linked_order_id.substring(0, 8)})</span>
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleCreateOrderFromDesign(design.id)}
                              disabled={actionLoadingId === design.id || !design.quoted_price}
                              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              title={!design.quoted_price ? "Enter a quoted price before converting to order" : ""}
                            >
                              <ShoppingBag size={14} />
                              <span>Generate Factory Order</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* TAB 3: PAYMENT VERIFICATION & PRODUCTION TELEMETRY */}
                  {/* ========================================================= */}
                  {activeTab === "production" && (
                    <div className="space-y-5 pt-1 animate-in fade-in">
                      
                      {/* B2B Customer Bank Transfer Proof Module */}
                      <div className={`p-5 rounded-2xl border space-y-4 ${
                        isPaymentSubmitted ? "bg-amber-50/70 border-amber-300" : "bg-stone-50 border-stone-200"
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className="text-[#8C4B31]" />
                              <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                                Customer Bank Transfer & QR Deposit Slip
                              </h4>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                isPaymentVerified 
                                  ? "bg-emerald-600 text-white" 
                                  : isPaymentSubmitted 
                                  ? "bg-amber-400 text-stone-900 animate-pulse font-extrabold"
                                  : "bg-stone-200 text-stone-600"
                              }`}>
                                {isPaymentVerified 
                                  ? "Deposit & QR Confirmed" 
                                  : isPaymentSubmitted 
                                  ? "Deposit Verification Required" 
                                  : "Awaiting Customer Deposit"}
                              </span>
                            </div>

                            <p className="text-xs text-stone-600 mt-1 flex flex-wrap items-center gap-2">
                              <span className="font-bold">Slip / QR Reference:</span>
                              <strong className="font-mono bg-white px-2 py-0.5 rounded border border-stone-300 text-stone-900">
                                {specsObj.qr_code_ref || specsObj.payment_ref || "None entered"}
                              </strong>
                              <span>• Submitted: {specsObj.payment_submitted_at ? new Date(specsObj.payment_submitted_at).toLocaleString() : "Pending"}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {specsObj.payment_proof_url && (
                              <button
                                type="button"
                                onClick={() => togglePaymentProof(design.id, specsObj.payment_proof_url)}
                                className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-xs font-bold text-stone-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <Eye size={13} className="text-[#8C4B31]" />
                                <span>{paymentProofUrl ? "Collapse Slip" : "Inspect Slip Image"}</span>
                              </button>
                            )}

                            {!isPaymentVerified && isPaymentSubmitted && (
                              <button
                                type="button"
                                disabled={actionLoadingId === design.id}
                                onClick={() => handleVerifyPayment(design.id)}
                                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 size={14} />
                                <span>Confirm Payment & Start (&ldquo;It Is On Doing&rdquo;)</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Payment Screenshot Preview */}
                        {paymentProofUrl && (
                          <div className="p-3 bg-stone-900 rounded-2xl border border-stone-800 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-stone-300">
                              <span className="font-bold">Bank Deposit Screenshot / QR Receipt</span>
                              <a href={paymentProofUrl} target="_blank" rel="noreferrer" download className="text-emerald-400 hover:underline">
                                Open Original File
                              </a>
                            </div>
                            <div className="max-h-80 overflow-hidden flex items-center justify-center bg-black/60 rounded-xl p-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={paymentProofUrl} alt="Bank Deposit Slip" className="max-h-76 w-auto object-contain rounded-lg" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 6-Stage Live Manufacturing Stepper */}
                      <div className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Layers size={16} className="text-[#1E3B2E]" />
                            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                              Live Factory Production Stage Tracker
                            </h4>
                          </div>
                          <span className="text-[11px] font-bold text-[#8C4B31] bg-[#8C4B31]/10 px-3 py-0.5 rounded-full">
                            Current Stage: {currentStage}
                          </span>
                        </div>

                        {/* Interactive Stage Stepper Chips */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                          {MANUFACTURING_STAGES.map((st, idx) => {
                            const isCurrent = currentStage === st.id;
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleAdvanceStage(design.id, st.id)}
                                disabled={actionLoadingId === design.id}
                                className={`p-2.5 rounded-2xl text-left border text-xs transition-all cursor-pointer flex flex-col justify-between ${
                                  isCurrent
                                    ? "bg-[#1E3B2E] text-white border-[#1E3B2E] shadow-sm font-bold ring-2 ring-[#1E3B2E]/20"
                                    : "bg-[#FAF7F2] hover:bg-stone-100 text-stone-700 border-stone-200"
                                }`}
                              >
                                <span className="text-[10px] font-mono opacity-60 block">Phase {idx + 1}</span>
                                <span className="font-bold text-[11px] leading-tight mt-1">{st.label.replace(/^\d+\.\s*/, "")}</span>
                                {isCurrent && (
                                  <span className="text-[9px] bg-emerald-500 text-white font-bold px-1.5 py-0.2 rounded mt-2 self-start">
                                    Active Now
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Completion and Delivery Preference */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                          {currentStage !== "ready_for_delivery" && currentStage !== "delivered" && (
                            <button
                              type="button"
                              onClick={() => handleMarkFinished(design.id)}
                              disabled={actionLoadingId === design.id}
                              className="px-4 py-2.5 rounded-xl bg-[#8C4B31] hover:bg-[#6D3823] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              <Truck size={14} />
                              <span>Mark Finished & QC Approved</span>
                            </button>
                          )}

                          {specsObj.delivery_preference ? (
                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex flex-wrap items-center gap-2">
                              <Truck size={14} className="text-emerald-700" />
                              <span>
                                Client Delivery Choice: <strong>{specsObj.delivery_preference.option === "pickup" ? "Factory Pickup at Bole Showroom" : `Direct Van Delivery to ${specsObj.delivery_preference.address}`}</strong> (Phone: {specsObj.delivery_preference.phone})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-stone-400">
                              Customer will choose delivery option once QC approved.
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
