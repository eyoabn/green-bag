"use client";

import { useState, useEffect } from "react";
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
  Clock,
  ExternalLink,
  GraduationCap,
  PenTool,
  AlertCircle
} from "lucide-react";

interface AdminStats {
  pendingPayments: number;
  pendingOrderPayments: number;
  pendingEnrollmentPayments: number;
  ordersByStatus: Record<string, number>;
  totalOrders: number;
  upcomingSessionsCount: number;
  upcomingSessionsList: Array<{
    id: string;
    title: string;
    type: string;
    starts_at: string;
    status: string;
    capacity: number;
    teacher_name: string;
  }>;
  newDesignsCount: number;
  orderRevenue: number;
  enrollmentRevenue: number;
  totalRevenue: number;
  newUsersThisWeek: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entity: string;
    entity_id: string;
    metadata: any;
    created_at: string;
  }>;
  recentPendingOrders: Array<{
    id: string;
    order_number: string;
    total_price: number;
    created_at: string;
    profiles?: {
      full_name: string;
      phone: string;
    };
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        throw new Error(`Failed to load data (${res.status})`);
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || "Error loading dashboard metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-500 space-y-3">
        <div className="w-10 h-10 border-3 border-[#1E3B2E] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Loading real-time plant analytics & queues...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 rounded-3xl bg-red-50 border border-red-200 text-center space-y-3">
        <AlertCircle size={32} className="text-red-600 mx-auto" />
        <h3 className="font-serif text-lg font-bold text-red-900">Failed to Load Dashboard</h3>
        <p className="text-xs text-red-700">{error || "Unable to connect to database"}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-full transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Live Executive Command Center
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            Manufacturing & Academy Operations
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time verified Supabase PostgreSQL metrics, payment queues, and audit log.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payments"
            className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-1.5"
          >
            <Receipt size={14} />
            <span>Review Payments ({stats.pendingPayments})</span>
          </Link>
          <Link
            href="/admin/products"
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-4 py-2.5 rounded-full transition-colors"
          >
            Products
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Verified Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-2xl bg-[#8C4B31]/10 text-[#8C4B31]">
              <DollarSign size={22} />
            </div>
            <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <TrendingUp size={13} className="mr-1" /> Realtime
            </span>
          </div>
          <span className="text-xs text-stone-500 font-medium">Verified Revenue</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
            {stats.totalRevenue.toLocaleString()} <span className="text-xs font-sans font-normal text-stone-500">ETB</span>
          </h3>
          <p className="text-[10px] text-stone-400 mt-2">
            Orders ({stats.orderRevenue.toLocaleString()}) + Workshops ({stats.enrollmentRevenue.toLocaleString()})
          </p>
        </div>

        {/* Metric 2: Pending Verifications */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-700">
              <Receipt size={22} />
            </div>
            {stats.pendingPayments > 0 && (
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <span className="text-xs text-stone-500 font-medium">Pending Payments</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
            {stats.pendingPayments}
          </h3>
          <p className="text-[10px] text-stone-400 mt-2">
            {stats.pendingOrderPayments} orders, {stats.pendingEnrollmentPayments} class enrollments
          </p>
        </div>

        {/* Metric 3: Upcoming Workshops */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-2xl bg-[#1E3B2E]/10 text-[#1E3B2E]">
              <GraduationCap size={22} />
            </div>
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
              Active
            </span>
          </div>
          <span className="text-xs text-stone-500 font-medium">Upcoming Sessions</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
            {stats.upcomingSessionsCount}
          </h3>
          <p className="text-[10px] text-stone-400 mt-2">LiveKit & In-Person Masterclasses</p>
        </div>

        {/* Metric 4: New Users & Designs */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-700">
              <Users size={22} />
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
              New This Week
            </span>
          </div>
          <span className="text-xs text-stone-500 font-medium">New Accounts / Designs</span>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-0.5">
            {stats.newUsersThisWeek} <span className="text-xs font-sans font-normal text-stone-500">users / {stats.newDesignsCount} designs</span>
          </h3>
          <p className="text-[10px] text-stone-400 mt-2">Recent client registrations</p>
        </div>

      </div>

      {/* Orders by Status Pipeline */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-bold text-stone-900">Order Fulfillment Pipeline</h3>
          <Link href="/admin/orders" className="text-xs font-bold text-[#8C4B31] hover:underline flex items-center gap-1">
            View All ({stats.totalOrders}) <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Pending Pay", count: stats.ordersByStatus.pending_payment, color: "bg-stone-100 text-stone-700" },
            { label: "Verification", count: stats.ordersByStatus.pending_verification, color: "bg-amber-100 text-amber-800 font-bold" },
            { label: "Approved", count: stats.ordersByStatus.approved, color: "bg-blue-100 text-blue-800" },
            { label: "In Production", count: stats.ordersByStatus.in_production, color: "bg-indigo-100 text-indigo-800" },
            { label: "Ready", count: stats.ordersByStatus.ready, color: "bg-teal-100 text-teal-800" },
            { label: "Completed", count: stats.ordersByStatus.completed, color: "bg-emerald-100 text-emerald-800" },
            { label: "Rejected", count: stats.ordersByStatus.rejected, color: "bg-red-100 text-red-800" },
            { label: "Cancelled", count: stats.ordersByStatus.cancelled, color: "bg-stone-200 text-stone-600" },
          ].map((item, idx) => (
            <div key={idx} className={`p-3 rounded-2xl text-center border border-stone-200/50 ${item.color}`}>
              <span className="block text-xl font-bold">{item.count || 0}</span>
              <span className="text-[10px] uppercase tracking-wider block mt-0.5">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Upcoming Sessions & Recent Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Column 1: Upcoming Sessions */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-[#1E3B2E]" />
                <h3 className="font-serif text-lg font-bold text-stone-900">Upcoming Workshops</h3>
              </div>
              <Link href="/admin/classes" className="text-xs font-bold text-[#8C4B31] hover:underline">
                Manage All
              </Link>
            </div>

            {stats.upcomingSessionsList.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No upcoming sessions scheduled.</p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingSessionsList.map((session) => (
                  <div key={session.id} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          session.type === "live" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {session.type}
                        </span>
                        <span className="text-xs font-bold text-stone-900 truncate max-w-[220px]">
                          {session.title}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-1">
                        Teacher: {session.teacher_name || "Assigned Staff"} • {new Date(session.starts_at).toLocaleDateString()} at {new Date(session.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-stone-700 bg-white px-2.5 py-1 rounded-xl border border-stone-200 shadow-2xs">
                      Cap: {session.capacity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100">
            <Link
              href="/admin/classes"
              className="text-xs font-semibold text-[#1E3B2E] hover:text-[#8C4B31] flex items-center justify-center gap-1.5 py-1"
            >
              <span>Schedule New Workshop</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Column 2: System Audit Log */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[#8C4B31]" />
                <h3 className="font-serif text-lg font-bold text-stone-900">Recent Audit Log</h3>
              </div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Immutable Log
              </span>
            </div>

            {stats.recentActivity.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No system actions logged yet.</p>
            ) : (
              <div className="space-y-2.5">
                {stats.recentActivity.map((log) => (
                  <div key={log.id} className="p-3 rounded-2xl bg-[#FAF7F2] border border-stone-200/60 flex items-start justify-between gap-3 text-xs">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800 uppercase tracking-wider text-[10px] bg-stone-200/80 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                        <span className="text-[11px] text-stone-600 font-medium">
                          Entity: {log.entity}
                        </span>
                      </div>
                      {log.metadata && (
                        <p className="text-[10px] text-stone-500 font-mono mt-1 truncate max-w-sm">
                          {JSON.stringify(log.metadata)}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 shrink-0">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-center">
            <span className="text-[10px] text-stone-400">
              All admin actions are cryptographically recorded with actor ID and metadata snapshot.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
