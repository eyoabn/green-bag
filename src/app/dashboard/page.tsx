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
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  LogOut, 
  AlertCircle, 
  Video, 
  ExternalLink,
  PenTool,
  Check,
  X
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface OrderItem {
  id: string;
  order_number: string;
  total_price: number;
  status: string;
  delivery_address: string;
  phone: string;
  payment_proof_path?: string;
  rejection_reason?: string;
  created_at: string;
  order_items?: Array<{
    id: string;
    quantity: number;
    unit_price_snapshot: number;
    products?: {
      name: string;
      category?: string;
    };
  }>;
}

interface EnrollmentItem {
  id: string;
  status: string;
  attended: boolean;
  payment_proof_path?: string;
  rejection_reason?: string;
  created_at: string;
  class_sessions?: {
    id: string;
    title: string;
    type: "in_person" | "live";
    starts_at: string;
    ends_at: string;
    location: string;
    price: number;
    status: string;
    livekit_room_name?: string;
  };
}

interface DesignItem {
  id: string;
  file_path: string;
  description: string;
  quoted_price: number | null;
  status: "submitted" | "reviewing" | "quoted" | "accepted" | "declined";
  created_at: string;
}

function CustomerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as "orders" | "classes" | "designs" | "profile" | null;
  const [activeTab, setActiveTab] = useState<"orders" | "classes" | "designs" | "profile">(urlTab || "orders");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);

  // Design quotation action
  const [designActionId, setDesignActionId] = useState<string | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?returnTo=/dashboard");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const combinedUser = { ...user, ...profile };
      setCurrentUser(combinedUser);
      setFullName(combinedUser.full_name || "");
      setPhone(combinedUser.phone || "");

      // 1. Fetch own orders
      const ordersRes = await fetch("/api/orders");
      const ordersData = await ordersRes.json();
      if (ordersRes.ok && ordersData.orders) {
        setOrders(ordersData.orders);
      }

      // 2. Fetch own enrollments
      const enrRes = await fetch("/api/enrollments");
      const enrData = await enrRes.json();
      if (enrRes.ok && enrData.enrollments) {
        setEnrollments(enrData.enrollments);
      }

      // 3. Fetch own custom designs
      const desRes = await fetch("/api/designs");
      const desData = await desRes.json();
      if (desRes.ok && desData.designs) {
        setDesigns(desData.designs);
      }
    } catch (err: any) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
    loadAllData();
  }, [urlTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUpdatingProfile(true);
    setProfileNotice(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id);

      if (error) throw error;
      setProfileNotice("Profile updated successfully!");
      setCurrentUser((prev: any) => ({ ...prev, full_name: fullName.trim(), phone: phone.trim() }));
    } catch (err: any) {
      alert(err.message || "Failed to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const handleRespondToQuote = async (designId: string, action: "accept" | "decline") => {
    setDesignActionId(designId);
    try {
      const res = await fetch(`/api/designs/${designId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to respond to quotation.");

      setDesigns((prev) =>
        prev.map((d) => (d.id === designId ? { ...d, status: action === "accept" ? "accepted" : "declined" } : d))
      );
      alert(action === "accept" ? "Quotation accepted! Plant management will schedule factory production." : "Quotation declined.");
    } catch (err: any) {
      alert(err.message || "Failed to respond to quotation.");
    } finally {
      setDesignActionId(null);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Pending Verification</span>;
      case "payment_uploaded":
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Proof Uploaded</span>;
      case "verified":
        return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Payment Verified</span>;
      case "in_production":
        return <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">In Production</span>;
      case "ready":
      case "shipped":
        return <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Dispatched</span>;
      case "delivered":
        return <span className="bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full text-[10px] font-bold uppercase font-extrabold">Delivered</span>;
      case "rejected":
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Payment Rejected</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[#F9F6F0]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 w-full">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3B2E]/10 border border-[#1E3B2E]/20 text-[#1E3B2E] text-xs font-bold uppercase tracking-wider mb-2">
              <User size={13} />
              <span>Customer Account Portal</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Welcome, {currentUser?.full_name || "Valued Client"}
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              Track retail batch orders, join your live craft workshops, and review bespoke custom packaging quotes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-6 py-2.5 rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <ShoppingBag size={14} />
              <span>Order Packaging</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold px-4 py-2.5 rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 border-b border-stone-200">
          {[
            { id: "orders", label: `Retail Orders (${orders.length})`, icon: ShoppingBag },
            { id: "classes", label: `Craft Workshops (${enrollments.length})`, icon: BookOpen },
            { id: "designs", label: `Bespoke Designs (${designs.length})`, icon: PenTool },
            { id: "profile", label: "Profile & Settings", icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? "bg-[#1E3B2E] text-white shadow-sm"
                    : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Tabs */}
        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
            <Sparkles size={28} className="animate-spin text-[#1E3B2E] mx-auto mb-3" />
            <p className="text-xs font-semibold text-stone-700">Loading your account data securely from Supabase...</p>
          </div>
        ) : (
          <div>
            
            {/* Tab 1: Orders */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
                    <Package size={36} className="text-stone-400 mx-auto" />
                    <h3 className="font-serif text-xl font-bold text-stone-800">No Orders Placed Yet</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Explore our 2026 packaging catalog and order high-tensile kraft shopping bags.
                    </p>
                    <Link
                      href="/products"
                      className="inline-block bg-[#1E3B2E] text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-[#8C4B31] transition-colors"
                    >
                      Browse Catalog
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => {
                    const firstItem = order.order_items && order.order_items[0];
                    const itemCount = order.order_items?.length || 1;
                    return (
                      <div
                        key={order.id}
                        className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-xs font-bold text-stone-900">
                              Order #{order.order_number || order.id.substring(0, 8)}
                            </span>
                            {getOrderStatusBadge(order.status)}
                            <span className="text-[11px] text-stone-400 font-mono">
                              {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>

                          <h3 className="font-serif text-xl font-bold text-stone-900">
                            {firstItem?.products?.name || "Artisan Kraft Bag Order"}
                            {itemCount > 1 && <span className="text-xs font-normal text-stone-500 ml-2">(+{itemCount - 1} more items)</span>}
                          </h3>

                          <p className="text-xs text-stone-600">
                            Delivery Address: <span className="font-medium text-stone-800">{order.delivery_address}</span> • Phone: <span className="font-mono text-stone-800">{order.phone}</span>
                          </p>

                          {order.rejection_reason && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
                              <AlertCircle size={14} className="shrink-0" />
                              <span>Rejection Note: {order.rejection_reason}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className="text-[11px] text-stone-400 uppercase font-bold block">Total Amount</span>
                            <span className="font-serif text-2xl font-bold text-[#8C4B31]">
                              {order.total_price} ETB
                            </span>
                          </div>

                          <Link
                            href={`/dashboard/orders/${order.id}`}
                            className="bg-stone-100 hover:bg-[#1E3B2E] text-stone-800 hover:text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all text-center flex items-center gap-1.5"
                          >
                            <span>View Timeline</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Classes */}
            {activeTab === "classes" && (
              <div className="space-y-4">
                {enrollments.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
                    <BookOpen size={36} className="text-stone-400 mx-auto" />
                    <h3 className="font-serif text-xl font-bold text-stone-800">No Workshop Registrations</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Enroll in our studio workshops or global LiveKit online broadcasts.
                    </p>
                    <Link
                      href="/learn/schedule"
                      className="inline-block bg-[#1E3B2E] text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-[#8C4B31] transition-colors"
                    >
                      Browse Workshops Schedule
                    </Link>
                  </div>
                ) : (
                  enrollments.map((enr) => {
                    const session = enr.class_sessions;
                    const isLive = session?.type === "live";
                    const isConfirmed = enr.status === "confirmed" || enr.status === "attended";
                    return (
                      <div
                        key={enr.id}
                        className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              isLive 
                                ? "bg-[#1E3B2E]/10 text-[#1E3B2E] border border-[#1E3B2E]/20" 
                                : "bg-[#8C4B31]/10 text-[#8C4B31] border border-[#8C4B31]/20"
                            }`}>
                              {isLive ? "LiveKit Virtual Masterclass" : "In-Person Studio"}
                            </span>

                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              isConfirmed
                                ? "bg-emerald-100 text-emerald-800 font-bold"
                                : enr.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {enr.status === "confirmed" ? "Admission Confirmed" : enr.status}
                            </span>
                          </div>

                          <h3 className="font-serif text-xl font-bold text-stone-900">
                            {session?.title || "Craft Workshop Session"}
                          </h3>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                            {session?.starts_at && (
                              <span className="flex items-center gap-1">
                                <Clock size={13} className="text-[#8C4B31]" />
                                {new Date(session.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {new Date(session.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              {isLive ? <Video size={13} className="text-[#1E3B2E]" /> : <MapPin size={13} className="text-[#1E3B2E]" />}
                              {session?.location}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isLive && isConfirmed ? (
                            <Link
                              href={`/dashboard/live/${session?.id}`}
                              className="px-6 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                            >
                              <Video size={14} />
                              <span>Join Live Stream</span>
                            </Link>
                          ) : (
                            <span className="text-xs text-stone-500 font-medium italic">
                              {enr.status === "pending" ? "Awaiting Payment Verification" : "Admission Confirmed"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 3: Custom Designs */}
            {activeTab === "designs" && (
              <div className="space-y-4">
                {designs.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
                    <PenTool size={36} className="text-stone-400 mx-auto" />
                    <h3 className="font-serif text-xl font-bold text-stone-800">No Custom Designs Submitted</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Use our bespoke 3D design studio to customize your logo, dimensions, and paper specifications.
                    </p>
                    <Link
                      href="/design-submission"
                      className="inline-block bg-[#1E3B2E] text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-[#8C4B31] transition-colors"
                    >
                      Open Design Studio
                    </Link>
                  </div>
                ) : (
                  designs.map((d) => {
                    let parsed: any = {};
                    try {
                      parsed = JSON.parse(d.description || "{}");
                    } catch {
                      parsed = { notes: d.description };
                    }

                    return (
                      <div
                        key={d.id}
                        className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-stone-100">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-stone-900">
                              Design #{d.id.substring(0, 8)}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              d.status === "quoted"
                                ? "bg-purple-100 text-purple-800 font-bold"
                                : d.status === "accepted"
                                ? "bg-emerald-100 text-emerald-800"
                                : d.status === "reviewing"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-stone-100 text-stone-700"
                            }`}>
                              {d.status}
                            </span>
                          </div>

                          <div className="text-right">
                            {d.quoted_price ? (
                              <div>
                                <span className="text-[10px] text-stone-500 block uppercase font-bold">Official Plant Quote</span>
                                <span className="font-serif text-2xl font-bold text-[#8C4B31]">{d.quoted_price} ETB</span>
                              </div>
                            ) : (
                              <span className="text-xs text-stone-400 italic">Quotation Under Engineering Review</span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-200">
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Dimensions</span>
                            <span className="font-bold text-stone-900">{parsed.dimensions || "Bespoke"}</span>
                          </div>
                          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-200">
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Paper Weight</span>
                            <span className="font-bold text-stone-900">{parsed.paperWeight || "220 GSM"}</span>
                          </div>
                          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-200">
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Paper Shade</span>
                            <span className="font-bold text-stone-900">{parsed.paperShade || "Artisan Kraft"}</span>
                          </div>
                          <div className="p-3 bg-[#FAF7F2] rounded-xl border border-stone-200">
                            <span className="text-[10px] text-stone-400 uppercase font-bold block">Volume</span>
                            <span className="font-bold text-stone-900">{parsed.quantity ? Number(parsed.quantity).toLocaleString() : "Custom"} Units</span>
                          </div>
                        </div>

                        {d.status === "quoted" && (
                          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold text-purple-950">Quotation Ready for Approval</p>
                              <p className="text-[11px] text-purple-800 mt-0.5">
                                Our factory has quoted this custom run at <strong>{d.quoted_price} ETB</strong>. Accept quote to convert into an active order.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRespondToQuote(d.id, "accept")}
                                disabled={designActionId === d.id}
                                className="px-5 py-2 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                              >
                                <Check size={13} />
                                <span>Accept Quote</span>
                              </button>
                              <button
                                onClick={() => handleRespondToQuote(d.id, "decline")}
                                disabled={designActionId === d.id}
                                className="px-4 py-2 rounded-full bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold border border-stone-300 transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 4: Profile & Settings */}
            {activeTab === "profile" && (
              <div className="max-w-xl bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm">
                <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">Personal Profile & Contact</h3>
                <p className="text-xs text-stone-500 mb-6">Keep your contact details up to date for delivery dispatch and workshop notifications.</p>

                {profileNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4 text-emerald-800 text-xs font-bold">
                    {profileNotice}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={currentUser?.email || ""}
                      className="w-full p-3 text-xs bg-stone-100 border border-stone-300 rounded-xl text-stone-500 cursor-not-allowed font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                      Phone Number (for SMS dispatch)
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                      Account Role
                    </label>
                    <input
                      type="text"
                      disabled
                      value={(currentUser?.role || "customer").toUpperCase()}
                      className="w-full p-3 text-xs bg-stone-100 border border-stone-300 rounded-xl text-stone-600 font-bold cursor-not-allowed"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Protected system role. Escalation to teacher or admin is managed exclusively by platform administrators.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="w-full py-3.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] disabled:opacity-50 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md"
                    >
                      {isUpdatingProfile ? "Saving Profile..." : "Save Profile Details"}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-[#F9F6F0]">
        <div className="text-center space-y-3">
          <Sparkles size={28} className="animate-spin text-[#1E3B2E] mx-auto" />
          <p className="font-serif text-lg font-bold text-stone-800">Opening Dashboard...</p>
        </div>
      </div>
    }>
      <CustomerDashboardContent />
    </Suspense>
  );
}
