"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShoppingBag, 
  BookOpen, 
  Clock, 
  PlayCircle, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  FileText,
  ExternalLink
} from "lucide-react";

export default function CustomerDashboardPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "classes" | "designs">("orders");

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1E3B2E] via-[#244737] to-[#1E3B2E] text-white p-8 rounded-3xl border border-stone-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Verified Customer & Student Portal
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">
            Welcome back, Dawit!
          </h1>
          <p className="text-sm text-stone-300 mt-1 max-w-lg">
            Track your custom Ethiopian kraft bag manufacturing batches, view verified CBE / Telebirr payments, and access your live LiveKit masterclasses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="bg-[#8C4B31] hover:bg-[#A3593B] text-white text-xs font-bold px-5 py-3 rounded-full transition-all shadow-md flex items-center gap-1.5"
          >
            <ShoppingBag size={15} />
            <span>New Order</span>
          </Link>
          <Link
            href="/learn/schedule"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-5 py-3 rounded-full transition-all"
          >
            Book Class
          </Link>
        </div>
      </div>

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-[#8C4B31]">
            <ShoppingBag size={24} />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Active Orders</span>
            <p className="font-serif text-2xl font-bold text-stone-900">3 Batches</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-[#1E3B2E]">
            <BookOpen size={24} />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Academy Registrations</span>
            <p className="font-serif text-2xl font-bold text-stone-900">2 Workshops</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-stone-100 text-stone-700">
            <Sparkles size={24} />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Bespoke Design Tickets</span>
            <p className="font-serif text-2xl font-bold text-stone-900">1 In Review</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        {[
          { id: "orders", label: "My Orders & Receipts", count: 3 },
          { id: "classes", label: "My Academy Workshops", count: 2 },
          { id: "designs", label: "Custom 3D Designs", count: 1 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
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

      {/* Tab Content */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          
          {/* Order 1 */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EFE3CE] flex items-center justify-center shrink-0">
                <Package size={28} className="text-[#8C4B31]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs text-stone-900">Order #ARN-2026-8491</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                    Pending Verification
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-900 mt-1">
                  Specialty Coffee Degassing Pouch (5 Bundles • 500 Bags)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Paid via CBE Birr: 855 ETB • Receipt uploaded • Addis Ababa Delivery
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
              <span className="font-serif text-xl font-bold text-[#8C4B31]">855 ETB</span>
              <button 
                onClick={() => alert("Payment receipt verified by admin. Delivery scheduled for tomorrow.")}
                className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800"
              >
                View Status
              </button>
            </div>
          </div>

          {/* Order 2 */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#E8DDD4] flex items-center justify-center shrink-0">
                <Package size={28} className="text-[#99472A]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-xs text-stone-900">Order #ARN-2026-7732</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                    Approved & In Manufacturing
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-900 mt-1">
                  Bole Boutique Luxury Shopper (10 Bundles • 1,000 Bags)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Paid via Telebirr: 2,112 ETB • Screen printing in progress at Bole Studio
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
              <span className="font-serif text-xl font-bold text-[#8C4B31]">2,112 ETB</span>
              <button 
                onClick={() => alert("Batch #7732 is currently at the handle gluing stage.")}
                className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800"
              >
                Production Log
              </button>
            </div>
          </div>

        </div>
      )}

      {activeTab === "classes" && (
        <div className="space-y-4">
          
          {/* LiveKit Virtual Session with Direct Join Link */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-[#1E3B2E]/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#1E3B2E] text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <PlayCircle size={11} /> LiveKit Online Classroom
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Seat Confirmed
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">
                Virtual: Advanced Origami Folds & Gusset Dynamics
              </h3>
              <p className="text-xs text-stone-600 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><Calendar size={13} /> Oct 18, 2026 • 3:00 PM EAT</span>
                <span>•</span>
                <span>Instructor: Sara Haile</span>
              </p>
            </div>

            <Link
              href="/dashboard/sessions/2"
              className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-7 py-3.5 rounded-full transition-all shadow-md flex items-center gap-2"
            >
              <PlayCircle size={16} />
              <span>Enter LiveKit Classroom</span>
            </Link>
          </div>

          {/* In-Person Studio Workshop */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#8C4B31] text-white px-2.5 py-0.5 rounded-full">
                  In-Person Studio
                </span>
                <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                  Oct 15, 2026
                </span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-stone-900">
                Beginner Paper Bag Workshop & Structural Folds
              </h3>
              <p className="text-xs text-stone-600 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1"><MapPin size={13} className="text-[#8C4B31]" /> Bole Subcity, Woreda 03, Industrial Zone, Addis Ababa</span>
              </p>
            </div>

            <button
              onClick={() => alert("Admission Pass #PBW-015 generated. Please show this to the studio manager.")}
              className="px-6 py-3 rounded-full bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-800 transition-colors"
            >
              Download Studio Pass (PDF)
            </button>
          </div>

        </div>
      )}

      {activeTab === "designs" && (
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">Ticket #DSG-2026-9102</span>
              <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                Custom Degassing Pouch with Gold Hot Foil Monogram
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Submitted on Sept 04, 2026 • 24cm × 32cm + 10cm • 220 GSM Ethiopian Virgin Kraft
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Engineering Review in Progress
            </span>
          </div>

          <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-1 mb-6">
            <p className="font-bold text-stone-900">Engineer Notes from Addis Ababa Factory:</p>
            <p>
              &ldquo;Vector dieline verified. Hot stamping plate has been scheduled on the flatbed cylinder press. Pre-production sample will be ready for review within 24 hours.&rdquo;
            </p>
          </div>

          <Link
            href="/design-submission"
            className="text-xs font-bold text-[#1E3B2E] hover:underline flex items-center gap-1"
          >
            Submit Another Custom Specification <ArrowRight size={13} />
          </Link>
        </div>
      )}

    </div>
  );
}
