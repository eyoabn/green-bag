"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Camera
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

function CustomerDashboardContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as "orders" | "classes" | "designs" | null;
  const [activeTab, setActiveTab] = useState<"orders" | "classes" | "designs">(urlTab || "designs");
  
  const [designs, setDesigns] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("Valued Customer");
  const [loading, setLoading] = useState(true);
  const [uploadingPaymentId, setUploadingPaymentId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState("");

  const supabase = createClient();

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCustomerName(user.email?.split('@')[0] || "Valued Customer");
        
        // Fetch real designs from Supabase
        const { data: dbDesigns, error } = await supabase
          .from("designs")
          .select("*")
          .eq("submitted_by", user.id)
          .order("created_at", { ascending: false });
          
        if (dbDesigns) {
          setDesigns(dbDesigns);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
    loadData();
  }, [urlTab]);

  const submitPaymentScreenshot = async (designId: string) => {
    if (!paymentUrl) return alert("Please enter a screenshot URL");
    try {
      const { error } = await supabase
        .from("designs")
        .update({ 
          payment_screenshot_url: paymentUrl,
          status: "payment_review" 
        })
        .eq("id", designId);
        
      if (error) throw error;
      alert("Payment screenshot submitted for review!");
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
          { id: "designs", label: "Custom 3D Designs & Map", count: designs.length },
          { id: "orders", label: "My Orders & Receipts", count: 0 },
          { id: "classes", label: "My Academy Workshops", count: 0 },
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

          {/* Fallbacks for removed fake data */}
          {activeTab === "orders" && (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
              <Package size={40} className="text-stone-300 mx-auto mb-3" />
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-1">No Active Retail Orders</h3>
              <p className="text-xs text-stone-500 mb-6">You have no active retail orders in the database.</p>
            </div>
          )}

          {activeTab === "classes" && (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
              <BookOpen size={40} className="text-stone-300 mx-auto mb-3" />
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-1">No Academy Bookings</h3>
              <p className="text-xs text-stone-500 mb-6">You have not booked any LiveKit workshops yet.</p>
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
