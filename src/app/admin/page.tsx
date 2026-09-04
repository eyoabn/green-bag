"use client";

import Link from "next/link";
import { 
  ArrowUpRight, 
  DollarSign, 
  Package, 
  Users, 
  Activity, 
  Receipt, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Clock
} from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Executive Command Center
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            Manufacturing & Academy Operations
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Addis Ababa Main Plant • Live verified CBE/Telebirr payment streams & production batches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-1.5"
          >
            <Receipt size={14} />
            <span>Process Verifications (3)</span>
          </Link>
          <Link
            href="/admin/classes"
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-4 py-2.5 rounded-full transition-colors"
          >
            Manage Classes
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-2xl bg-[#8C4B31]/10 text-[#8C4B31]">
              <DollarSign size={22} />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              +18.4% MoM <ArrowUpRight size={13} />
            </span>
          </div>
          <span className="text-xs text-stone-500 font-medium">Monthly Revenue (ETB)</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
            184,500 <span className="text-xs font-sans font-normal text-stone-500">ETB</span>
          </h3>
          <p className="text-[10px] text-stone-400 mt-2">Verified via CBE & Telebirr</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-800">
              <Package size={22} />
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
              Action Required
            </span>
          </div>
          <span className="text-xs text-stone-500 font-medium">Pending Verifications</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
            3 <span className="text-xs font-sans font-normal text-stone-500">Batches</span>
          </h3>
          <p className="text-[10px] text-stone-400 mt-2">Awaiting bank slip approval</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-2xl bg-[#1E3B2E]/10 text-[#1E3B2E]">
              <Users size={22} />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              72% Occupancy
            </span>
          </div>
          <span className="text-xs text-stone-500 font-medium">Academy Registrations</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
            68 <span className="text-xs font-sans font-normal text-stone-500">Students</span>
          </h3>
          <p className="text-[10px] text-stone-400 mt-2">In-person & LiveKit streams</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-700">
              <Activity size={22} />
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
              Active Plant
            </span>
          </div>
          <span className="text-xs text-stone-500 font-medium">Monthly Bag Output</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
            210,000 <span className="text-xs font-sans font-normal text-stone-500">Bags</span>
          </h3>
          <p className="text-[10px] text-stone-400 mt-2">Bole Subcity Manufacturing Line</p>
        </div>

      </div>

      {/* Action Queue & Live Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Pending Payments Queue */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Pending Payment Verifications
              </h3>
              <p className="text-xs text-stone-500">Click inspect to compare CBE transaction ID with receipt slip.</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#1E3B2E] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {[
              {
                id: "ARN-2026-8491",
                customer: "Dawit Haile (Oromia Coffee Roasters)",
                amount: "855 ETB",
                channel: "CBE Birr",
                time: "10m ago",
                item: "Specialty Coffee Degassing Pouch (x500)"
              },
              {
                id: "ARN-2026-6120",
                customer: "Yonas Birhanu (Addis Artisan Bakery)",
                amount: "330 ETB",
                channel: "Awash Bank",
                time: "3h ago",
                item: "Addis Artisan Bakery Pouch (x300)"
              },
              {
                id: "ARN-2026-9102",
                customer: "Bole Luxury Fashion Boutique",
                amount: "2,400 ETB",
                channel: "Telebirr",
                time: "5h ago",
                item: "Luxury Boutique Shopper (x1,000)"
              }
            ].map((queueItem) => (
              <div key={queueItem.id} className="p-5 flex items-center justify-between hover:bg-stone-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-stone-900 text-xs">{queueItem.customer}</p>
                      <span className="text-[10px] font-mono text-stone-400">{queueItem.id}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">{queueItem.item}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-serif font-bold text-stone-900 text-sm">{queueItem.amount}</p>
                    <span className="text-[10px] text-stone-400">{queueItem.channel} • {queueItem.time}</span>
                  </div>
                  <Link
                    href="/admin/orders"
                    className="px-3.5 py-1.5 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors"
                  >
                    Verify
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick Operational Modules */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">
              Quick Management Tools
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <Link
                href="/admin/products"
                className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-stone-100 border border-stone-200 flex items-center justify-between transition-colors font-bold text-stone-800"
              >
                <span>Manage Product Catalog (24)</span>
                <ArrowRight size={14} className="text-stone-400" />
              </Link>
              
              <Link
                href="/admin/classes"
                className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-stone-100 border border-stone-200 flex items-center justify-between transition-colors font-bold text-stone-800"
              >
                <span>LiveKit & Studio Workshops (4)</span>
                <ArrowRight size={14} className="text-stone-400" />
              </Link>

              <Link
                href="/admin/designs"
                className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-stone-100 border border-stone-200 flex items-center justify-between transition-colors font-bold text-stone-800"
              >
                <span>Custom Design Tickets (6)</span>
                <ArrowRight size={14} className="text-stone-400" />
              </Link>

              <Link
                href="/admin/bank-accounts"
                className="p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-stone-100 border border-stone-200 flex items-center justify-between transition-colors font-bold text-stone-800"
              >
                <span>Configure Banking Accounts (3)</span>
                <ArrowRight size={14} className="text-stone-400" />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1E3B2E] to-[#12251D] text-white shadow-lg">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#E0B382]">
              Investor Pitch Metric
            </span>
            <h4 className="font-serif text-xl font-bold mt-1 mb-2">
              Carbon Offset Ledger
            </h4>
            <p className="text-xs text-emerald-200 leading-relaxed">
              850 tons of single-use polyethylene replaced by Ethiopian virgin kraft in 2026. Audit certified for ESG compliance.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
