"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  Package, 
  Users, 
  Receipt, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  GraduationCap, 
  PenTool, 
  AlertCircle,
  History,
  ChevronRight
} from "lucide-react";

interface RevenueDataPoint {
  date: string;
  rawDate: string;
  orderRevenue: number;
  enrollmentRevenue: number;
  totalRevenue: number;
  orderCount: number;
  enrollmentCount: number;
}

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
  revenueOverTime: RevenueDataPoint[];
  newUsersThisWeek: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entity: string;
    entity_id: string;
    metadata: any;
    created_at: string;
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

  const maxRevenue = stats
    ? Math.max(...stats.revenueOverTime.map((p) => p.totalRevenue), 1000)
    : 1000;

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Executive Action Inbox
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            Manufacturing & Academy Operations
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Triage urgent factory tasks, verify settlements, and monitor production.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/payments"
            className="btn-primary py-2.5 px-5 text-xs font-bold"
          >
            <Receipt size={14} />
            <span>Process Payments {stats?.pendingPayments !== undefined ? `(${stats.pendingPayments})` : ""}</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-stone-100 animate-pulse border border-stone-200" />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-stone-100 animate-pulse border border-stone-200" />
            ))}
          </div>
        </div>
      ) : error || !stats ? (
        <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-200 text-red-800 text-xs">
          <AlertCircle size={28} className="mx-auto mb-2 text-red-600" />
          <p className="font-bold">Failed to load admin operations</p>
          <p className="text-stone-500 mt-1">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-red-800 text-white font-bold rounded-full text-xs"
          >
            Retry
          </button>
        </div>
      ) : (
        <>

      {/* 1. TOP: "Needs Attention Now" Action Cards */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Needs Attention Now
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Payments */}
          <Link
            href="/admin/payments"
            className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
              stats.pendingPayments > 0
                ? "bg-amber-50/80 border-amber-300 hover:bg-amber-100/60"
                : "bg-white border-stone-200 hover:bg-stone-50"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-800">
                <Receipt size={22} />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-stone-900 block leading-tight">
                  {stats.pendingPayments}
                </span>
                <span className="text-xs font-bold text-stone-700">Pending Payments</span>
                <p className="text-[10px] text-stone-500 mt-0.5">Awaiting bank verification</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-stone-400" />
          </Link>

          {/* Card 2: Custom Designs */}
          <Link
            href="/admin/designs"
            className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${
              stats.newDesignsCount > 0
                ? "bg-blue-50/80 border-blue-300 hover:bg-blue-100/60"
                : "bg-white border-stone-200 hover:bg-stone-50"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-800">
                <PenTool size={22} />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-stone-900 block leading-tight">
                  {stats.newDesignsCount}
                </span>
                <span className="text-xs font-bold text-stone-700">New Design Inquiries</span>
                <p className="text-[10px] text-stone-500 mt-0.5">Ready for pricing quote</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-stone-400" />
          </Link>

          {/* Card 3: Upcoming Classes */}
          <Link
            href="/admin/classes"
            className="p-5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-800">
                <GraduationCap size={22} />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-stone-900 block leading-tight">
                  {stats.upcomingSessionsCount}
                </span>
                <span className="text-xs font-bold text-stone-700">Scheduled Workshops</span>
                <p className="text-[10px] text-stone-500 mt-0.5">Assigned craft sessions</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-stone-400" />
          </Link>

        </div>
      </div>

      {/* 2. BELOW: Exactly 4 Simple Numbers Max */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Core Operating Metrics
        </span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div data-testid="stat-pending-payments" className="bg-white p-5 rounded-2xl border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase block">Pending Settlement</span>
            <span data-testid="stat-pending-count" className="font-serif text-2xl font-bold text-stone-900 mt-1 block">
              {stats.pendingPayments}
            </span>
            <span className="text-[10px] text-stone-400 mt-1 block">Orders & enrollments</span>
          </div>

          <div data-testid="stat-total-revenue" className="bg-white p-5 rounded-2xl border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase block">Total Revenue</span>
            <span data-testid="stat-revenue-value" className="font-serif text-2xl font-bold text-stone-900 mt-1 block">
              {stats.totalRevenue.toLocaleString()} <span className="text-xs font-sans font-normal text-stone-500">ETB</span>
            </span>
            <span className="text-[10px] text-emerald-700 mt-1 block font-medium">All cleared payments</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase block">Total Orders</span>
            <span className="font-serif text-2xl font-bold text-stone-900 mt-1 block">
              {stats.totalOrders}
            </span>
            <span className="text-[10px] text-stone-400 mt-1 block">Lifetime batch runs</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase block">New Users (7d)</span>
            <span className="font-serif text-2xl font-bold text-stone-900 mt-1 block">
              {stats.newUsersThisWeek}
            </span>
            <span className="text-[10px] text-stone-400 mt-1 block">Customers & artisans</span>
          </div>

        </div>
      </div>

      {/* 3. Single Small Clean Revenue Chart */}
      {stats.revenueOverTime.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900">
                Revenue Trajectory (Last 14 Days)
              </h3>
              <p className="text-[11px] text-stone-500">Daily bank settlements cleared into CBE and Telebirr</p>
            </div>
          </div>

          <div className="h-32 flex items-end gap-1.5 pt-4">
            {stats.revenueOverTime.map((d, i) => {
              const heightPct = Math.max(8, (d.totalRevenue / maxRevenue) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-[#1E3B2E] hover:bg-[#8C4B31] rounded-t-md transition-colors"
                  />
                  <span className="text-[9px] text-stone-400 font-mono hidden sm:block truncate max-w-full">
                    {d.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Recent Audit Activity Stream */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
            <History size={16} className="text-[#1E3B2E]" />
            <span>Recent System Actions</span>
          </h3>
          <Link href="/admin/audit" className="text-xs font-bold text-[#8C4B31] hover:underline">
            View Full Audit Log
          </Link>
        </div>

        <div className="divide-y divide-stone-100 text-xs">
          {stats.recentActivity.slice(0, 5).map((act) => (
            <div key={act.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-stone-800">{act.action}</span>
                <span className="text-stone-500 ml-2">on {act.entity}</span>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">
                {new Date(act.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </div>
      </>
      )}

    </div>
  );
}
