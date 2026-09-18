"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  BookOpen, 
  Package, 
  Sparkles,
  ArrowRight,
  Upload,
  CheckCircle2,
  Clock,
  MapPin,
  Camera,
  LogOut
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getCurrentUser, setLocalUser } from "@/utils/auth";
import { DataStore } from "@/utils/dataStore";

function CustomerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as "orders" | "classes" | "designs" | null;
  const [activeTab, setActiveTab] = useState<"orders" | "classes" | "designs">(urlTab || "orders");
  
  const [designs, setDesigns] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("Valued Customer");
  const [loading, setLoading] = useState(true);
  const [uploadingPaymentId, setUploadingPaymentId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);

  const supabase = createClient();

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/login?returnTo=/dashboard");
        return;
      }

      setCustomerName(user.full_name || user.email.split('@')[0] || "Valued Customer");
      
      // 1. Fetch designs from Supabase
      let dbDesigns: any[] = [];
      try {
        const { data } = await supabase
          .from("designs")
          .select("*")
          .eq("submitted_by", user.id)
          .order("created_at", { ascending: false });
        if (data) dbDesigns = data;
      } catch (err) {}

      // 2. Fetch designs from local DataStore
      const localDesigns = DataStore.getDesigns().map((d) => ({
        id: d.id,
        submitted_by: user.id,
        file_url: d.fileName,
        note: JSON.stringify({
          clientCompany: d.clientCompany,
          clientContact: d.clientContact,
          dimensions: d.dimensions,
          paperWeight: d.paperWeight,
          paperShade: d.paperShade,
          quantity: d.quantity,
          handleType: d.handleType,
          notes: d.notes,
        }),
        status: d.status === "reviewing" ? "engineering_review" : d.status === "proof_ready" ? "approved_pending_payment" : d.status,
        created_at: d.submittedDate,
      }));

      // Merge and deduplicate designs
      const seenDesignIds = new Set();
      const combinedDesigns: any[] = [];
      for (const d of [...dbDesigns, ...localDesigns]) {
        if (!seenDesignIds.has(d.id)) {
          seenDesignIds.add(d.id);
          combinedDesigns.push(d);
        }
      }
      setDesigns(combinedDesigns);

      // 3. Fetch retail orders from Supabase
      let dbOrders: any[] = [];
      try {
        const { data } = await supabase
          .from("orders")
          .select("*, products(name)")
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false });
        if (data) {
          dbOrders = data.map((o: any) => ({
            id: o.id,
            product_id: o.product_id,
            productName: o.products?.name || "Premium Bag Bundle",
            quantity: o.quantity,
            total_price: o.total_price,
            status: o.status,
            payment_screenshot_url: o.payment_screenshot_url,
            created_at: o.created_at,
          }));
        }
      } catch (err) {}

      // 4. Fetch retail orders from local DataStore
      const localOrders = DataStore.getOrders()
        .filter((o) => !o.customerEmail || o.customerEmail === user.email || !user.email)
        .map((o) => ({
          id: o.id,
          product_id: o.productId,
          productName: o.productName,
          quantity: o.quantityBundles,
          total_price: o.totalEtb,
          status: o.status,
          payment_screenshot_url: o.receiptUrl,
          created_at: o.timestamp,
        }));

      // Merge and deduplicate orders
      const seenOrderIds = new Set();
      const combinedOrders: any[] = [];
      for (const o of [...dbOrders, ...localOrders]) {
        if (!seenOrderIds.has(o.id)) {
          seenOrderIds.add(o.id);
          combinedOrders.push(o);
        }
      }
      setOrders(combinedOrders);

      // 5. Fetch workshop registrations from Supabase
      let dbRegistrations: any[] = [];
      try {
        const { data } = await supabase
          .from("session_registrations")
          .select("*, class_sessions(*)")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });
        if (data) {
          dbRegistrations = data.map((r: any) => ({
            id: r.id,
            sessionId: r.session_id,
            sessionTitle: r.class_sessions?.title || "Craft Academy Masterclass",
            sessionType: r.class_sessions?.type || "live",
            sessionDate: r.class_sessions?.start_time ? new Date(r.class_sessions.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Upcoming",
            sessionTime: r.class_sessions?.start_time ? new Date(r.class_sessions.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "2:00 PM",
            location: r.class_sessions?.location || "LiveKit Interactive Classroom",
            livekitRoom: r.class_sessions?.livekit_room_name,
            status: r.status,
            priceEtb: r.class_sessions?.price || 300,
            receiptUrl: r.payment_screenshot_url,
          }));
        }
      } catch (err) {}

      // 6. Fetch workshop registrations from local DataStore
      const localRegs = DataStore.getRegistrations()
        .filter((r) => !r.studentEmail || r.studentEmail === user.email || r.studentId === user.id)
        .map((r) => ({
          id: r.id,
          sessionId: r.sessionId,
          sessionTitle: r.sessionTitle,
          sessionType: r.sessionType,
          sessionDate: r.sessionDate,
          sessionTime: r.sessionTime,
          location: r.location,
          status: r.status,
          priceEtb: r.priceEtb,
          receiptUrl: r.receiptUrl,
        }));

      // Merge and deduplicate registrations
      const seenRegIds = new Set();
      const combinedRegs: any[] = [];
      for (const r of [...dbRegistrations, ...localRegs]) {
        if (!seenRegIds.has(r.id)) {
          seenRegIds.add(r.id);
          combinedRegs.push(r);
        }
      }
      setRegistrations(combinedRegs);

    } catch (e) {
      console.error("Dashboard loadData error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("arenguade_datastore_change", handleUpdate);
    window.addEventListener("arenguade_auth_change", handleUpdate);
    return () => {
      window.removeEventListener("arenguade_datastore_change", handleUpdate);
      window.removeEventListener("arenguade_auth_change", handleUpdate);
    };
  }, [urlTab]);

  const submitPaymentScreenshot = async (designId: string) => {
    if (!paymentUrl) return alert("Please enter a screenshot URL or file");
    try {
      try {
        await supabase
          .from("designs")
          .update({ 
            payment_screenshot_url: paymentUrl,
            status: "payment_review" 
          })
          .eq("id", designId);
      } catch {}

      DataStore.updateDesignStatus(designId, "approved");
        
      alert("Payment screenshot submitted! Factory staff will verify within 2-4 hours.");
      setPaymentUrl("");
      setUploadingPaymentId(null);
      loadData();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const getWorkflowStep = (status: string) => {
    const steps = ["new", "engineering_review", "approved_pending_payment", "payment_review", "in_production", "shipped"];
    const index = steps.indexOf(status);
    return index === -1 ? 0 : index;
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setLocalUser(null);
    router.push("/login");
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8 pb-12 pt-8">
      
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
          <button
            onClick={handleSignOut}
            className="bg-stone-800 hover:bg-stone-900 text-stone-200 text-xs font-bold px-4 py-3 rounded-full transition-all shadow-md flex items-center gap-1.5"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
          <Link
            href="/design-submission"
            className="bg-[#8C4B31] hover:bg-[#A3593B] text-white text-xs font-bold px-5 py-3 rounded-full transition-all shadow-md flex items-center gap-1.5"
          >
            <Sparkles size={15} />
            <span>New Custom Design</span>
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        {[
          { id: "orders", label: "My Orders & Receipts", count: orders.length },
          { id: "classes", label: "My Academy Workshops", count: registrations.length },
          { id: "designs", label: "Custom 3D Designs & Map", count: designs.length },
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

      {loading ? (
        <div className="text-center text-stone-500 py-12">Loading data securely from Supabase...</div>
      ) : (
        <>
          {/* Tab Content: DESIGNS (Main Workflow) */}
          {activeTab === "designs" && (
            <div className="space-y-6">
              {designs.length > 0 ? (
                designs.map((d) => {
                  const currentStep = getWorkflowStep(d.status);
                  let parsedNote: any = {};
                  try {
                    parsedNote = JSON.parse(d.note || "{}");
                  } catch (e) {}

                  return (
                    <div key={d.id} className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">Design Ticket #{d.id.substring(0,8)}</span>
                          <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                            {parsedNote.clientCompany || "Custom Packaging Order"}
                          </h3>
                          <p className="text-xs text-stone-500 mt-1">
                            Submitted on {new Date(d.created_at).toLocaleDateString()} • {parsedNote.dimensions || "Custom Specs"}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#1E3B2E] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">
                          {d.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      {/* WORKFLOW TRACKER MAP */}
                      <div className="relative pt-6 pb-2">
                        {/* Connecting Line */}
                        <div className="absolute top-10 left-8 right-8 h-1 bg-stone-100 -z-10 rounded-full" />
                        <div 
                          className="absolute top-10 left-8 h-1 bg-[#8C4B31] -z-10 rounded-full transition-all duration-1000" 
                          style={{ width: `calc(${Math.min(currentStep / 5 * 100, 100)}% - 2rem)` }} 
                        />
                        
                        <div className="flex justify-between relative">
                          {/* Step 0: Submitted */}
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${currentStep >= 0 ? "bg-[#8C4B31]" : "bg-stone-200 text-stone-400"}`}>
                              {currentStep > 0 ? <CheckCircle2 size={16} /> : "1"}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-stone-600 text-center">Submitted</span>
                          </div>

                          {/* Step 1: Eng Review */}
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${currentStep >= 1 ? "bg-[#8C4B31]" : "bg-stone-200 text-stone-400"}`}>
                              {currentStep > 1 ? <CheckCircle2 size={16} /> : "2"}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-stone-600 text-center">Engineering<br/>Review</span>
                          </div>

                          {/* Step 2: Payment */}
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${currentStep >= 2 ? "bg-[#8C4B31]" : "bg-stone-200 text-stone-400"}`}>
                              {currentStep > 3 ? <CheckCircle2 size={16} /> : "3"}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-stone-600 text-center">Payment &<br/>Approval</span>
                          </div>

                          {/* Step 3: Production */}
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${currentStep >= 4 ? "bg-[#8C4B31]" : "bg-stone-200 text-stone-400"}`}>
                              {currentStep > 4 ? <CheckCircle2 size={16} /> : "4"}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-stone-600 text-center">In<br/>Production</span>
                          </div>

                          {/* Step 4: Shipped */}
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${currentStep >= 5 ? "bg-[#8C4B31]" : "bg-stone-200 text-stone-400"}`}>
                              {currentStep >= 5 ? <CheckCircle2 size={16} /> : "5"}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-stone-600 text-center">Shipped</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Action Box */}
                      {d.status === "approved_pending_payment" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div>
                            <h4 className="text-amber-900 font-bold text-sm flex items-center gap-2">
                              <CheckCircle2 size={16} /> Design Approved! Payment Required
                            </h4>
                            <p className="text-xs text-amber-700 mt-1 max-w-md">
                              Your 3D design has been approved by the factory. Please pay {parsedNote.totalEstEtb ? `${parsedNote.totalEstEtb} ETB` : "the quoted amount"} to CBE Account: 1000123456789 and upload the screenshot.
                            </p>
                          </div>
                          
                          {uploadingPaymentId === d.id ? (
                            <div className="flex items-center gap-2 w-full md:w-auto">
                              <input 
                                type="text" 
                                placeholder="Paste image URL here..."
                                value={paymentUrl}
                                onChange={(e) => setPaymentUrl(e.target.value)}
                                className="border border-amber-300 rounded-xl px-3 py-2 text-xs w-full md:w-48 bg-white"
                              />
                              <button 
                                onClick={() => submitPaymentScreenshot(d.id)}
                                className="bg-[#8C4B31] text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap"
                              >
                                Submit
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setUploadingPaymentId(d.id)}
                              className="bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-colors"
                            >
                              <Camera size={14} /> Upload Screenshot
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })
              ) : (
                <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
                  <Sparkles size={40} className="text-stone-300 mx-auto mb-3" />
                  <h3 className="font-serif text-xl font-bold text-stone-900 mb-1">No Custom Designs Yet</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6">
                    Use our 3D interactive studio to build your bespoke packaging and submit it directly to our Addis Ababa factory.
                  </p>
                  <Link 
                    href="/design-submission" 
                    className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-6 py-3 rounded-full transition-colors"
                  >
                    Open 3D Studio
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: ORDERS (Retail) */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {orders.length > 0 ? (
                orders.map((o) => {
                  const currentStep = ["pending_verification", "approved", "fulfilled"].indexOf(o.status);
                  
                  return (
                    <div key={o.id} className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Retail Order #{o.id.substring(0,8)}</span>
                          <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                            {o.productName || o.products?.name || "Premium Bag Bundle"}
                          </h3>
                          <p className="text-xs text-stone-500 mt-1">
                            {o.quantity} Bundles • {o.total_price} ETB
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#1E3B2E] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest">
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      {/* WORKFLOW TRACKER MAP */}
                      <div className="relative pt-6 pb-2 max-w-xl mx-auto w-full">
                        <div className="absolute top-10 left-8 right-8 h-1 bg-stone-100 -z-10 rounded-full" />
                        <div 
                          className="absolute top-10 left-8 h-1 bg-emerald-700 -z-10 rounded-full transition-all duration-1000" 
                          style={{ width: `calc(${Math.min(currentStep / 2 * 100, 100)}% - 2rem)` }} 
                        />
                        
                        <div className="flex justify-between relative">
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${currentStep >= 0 ? "bg-emerald-700" : "bg-stone-200 text-stone-400"}`}>
                              {currentStep > 0 ? <CheckCircle2 size={16} /> : "1"}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-stone-600 text-center">Verifying</span>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${currentStep >= 1 ? "bg-emerald-700" : "bg-stone-200 text-stone-400"}`}>
                              {currentStep > 1 ? <CheckCircle2 size={16} /> : "2"}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-stone-600 text-center">Approved &<br/>Processing</span>
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${currentStep >= 2 ? "bg-emerald-700" : "bg-stone-200 text-stone-400"}`}>
                              {currentStep >= 2 ? <CheckCircle2 size={16} /> : "3"}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-stone-600 text-center">Fulfilled</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-3xl p-12 border border-stone-200 shadow-sm text-center">
                  <ShoppingBag size={48} className="mx-auto text-stone-300 mb-4" />
                  <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">No Retail Orders Yet</h3>
                  <p className="text-stone-500 mb-6 max-w-md mx-auto">
                    You haven&apos;t placed any standard bag orders from our catalog.
                  </p>
                  <Link href="/products" className="inline-block bg-[#1E3B2E] text-white px-6 py-3 rounded-full text-sm font-bold shadow-md hover:bg-[#8C4B31] transition-all">
                    Browse Catalog
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: ACADEMY WORKSHOPS */}
          {activeTab === "classes" && (
            <div className="space-y-6">
              {registrations.length > 0 ? (
                registrations.map((r) => (
                  <div key={r.id} className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            r.sessionType === "live" ? "bg-[#1E3B2E]/10 text-[#1E3B2E]" : "bg-[#8C4B31]/10 text-[#8C4B31]"
                          }`}>
                            {r.sessionType === "live" ? "LiveKit WebRTC Class" : "Studio In-Person"}
                          </span>
                          <span className="text-stone-400 text-xs">•</span>
                          <span className="text-xs text-stone-500 font-mono">Reg #{r.id.substring(0,8)}</span>
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-stone-900">{r.sessionTitle}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mt-2">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock size={14} className="text-[#8C4B31]" />
                            {r.sessionDate} • {r.sessionTime}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-[#1E3B2E]" />
                            {r.location}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider ${
                          r.status === "approved"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : r.status === "rejected"
                            ? "bg-red-50 text-red-800 border border-red-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}>
                          {r.status === "approved" ? "Seat Confirmed" : r.status.replace(/_/g, " ")}
                        </span>

                        {r.sessionType === "live" && (
                          <Link
                            href={`/dashboard/sessions/${r.sessionId}`}
                            className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-2 rounded-full transition-all shadow-sm flex items-center gap-1.5"
                          >
                            <span>Join Classroom</span>
                            <ArrowRight size={13} />
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-100 flex items-center justify-between text-xs text-stone-600">
                      <span>Tuition Fee: <strong className="text-stone-900">{r.priceEtb} ETB</strong></span>
                      <span className="text-emerald-700 font-medium">Payment Screenshot Received</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
                  <BookOpen size={40} className="text-stone-300 mx-auto mb-3" />
                  <h3 className="font-serif text-xl font-bold text-stone-900 mb-1">No Academy Bookings Yet</h3>
                  <p className="text-xs text-stone-500 mb-6">Explore our craft paper bag masterclasses and interactive live sessions.</p>
                  <Link
                    href="/learn/schedule"
                    className="inline-block bg-[#1E3B2E] text-white text-xs font-bold px-6 py-3 rounded-full hover:bg-[#8C4B31] transition-colors"
                  >
                    View Workshop Schedule
                  </Link>
                </div>
              )}
            </div>
          )}
        </>
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
