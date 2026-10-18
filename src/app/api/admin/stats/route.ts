import { NextResponse } from "next/server";
import { requireRole } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    await requireRole(["admin"]);
    const supabase = await createClient();

    // 1. Pending Payments (Orders + Enrollments)
    const { count: pendingOrderPayments } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_verification");

    const { count: pendingEnrollmentPayments } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_verification");

    // 2. Orders by Status & Revenue
    const { data: allOrders } = await supabase
      .from("orders")
      .select("id, status, total_price, created_at");

    const ordersByStatus: Record<string, number> = {
      pending_payment: 0,
      pending_verification: 0,
      approved: 0,
      in_production: 0,
      ready: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0,
    };

    let orderRevenue = 0;
    (allOrders || []).forEach((o) => {
      const st = o.status || "pending_payment";
      ordersByStatus[st] = (ordersByStatus[st] || 0) + 1;
      if (["approved", "in_production", "ready", "completed"].includes(st)) {
        orderRevenue += Number(o.total_price || 0);
      }
    });

    // 3. Approved Enrollments Revenue
    const { data: approvedEnrollments } = await supabase
      .from("enrollments")
      .select("id, session_id, created_at, class_sessions(price)")
      .eq("status", "approved");

    let enrollmentRevenue = 0;
    (approvedEnrollments || []).forEach((e: any) => {
      const price = Number(e.class_sessions?.price || 0);
      enrollmentRevenue += price;
    });

    const totalRevenue = orderRevenue + enrollmentRevenue;

    // 4. Revenue Over Time (Aggregated by day from real verified orders & enrollments)
    // Build 7-day timeline
    const revenueMap: Record<string, { orderRevenue: number; enrollmentRevenue: number; totalRevenue: number; orderCount: number; enrollmentCount: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      revenueMap[key] = { orderRevenue: 0, enrollmentRevenue: 0, totalRevenue: 0, orderCount: 0, enrollmentCount: 0 };
    }

    // Populate approved orders into timeline
    (allOrders || []).forEach((o) => {
      if (["approved", "in_production", "ready", "completed"].includes(o.status)) {
        const key = o.created_at ? o.created_at.split("T")[0] : null;
        if (key) {
          if (!revenueMap[key]) {
            revenueMap[key] = { orderRevenue: 0, enrollmentRevenue: 0, totalRevenue: 0, orderCount: 0, enrollmentCount: 0 };
          }
          const amt = Number(o.total_price || 0);
          revenueMap[key].orderRevenue += amt;
          revenueMap[key].totalRevenue += amt;
          revenueMap[key].orderCount += 1;
        }
      }
    });

    // Populate approved enrollments into timeline
    (approvedEnrollments || []).forEach((e: any) => {
      const key = e.created_at ? e.created_at.split("T")[0] : null;
      if (key) {
        if (!revenueMap[key]) {
          revenueMap[key] = { orderRevenue: 0, enrollmentRevenue: 0, totalRevenue: 0, orderCount: 0, enrollmentCount: 0 };
        }
        const amt = Number(e.class_sessions?.price || 0);
        revenueMap[key].enrollmentRevenue += amt;
        revenueMap[key].totalRevenue += amt;
        revenueMap[key].enrollmentCount += 1;
      }
    });

    const revenueOverTime = Object.keys(revenueMap)
      .sort()
      .map((k) => {
        const dateObj = new Date(k + "T00:00:00Z");
        const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
        return {
          date: formattedDate,
          rawDate: k,
          orderRevenue: revenueMap[k].orderRevenue,
          enrollmentRevenue: revenueMap[k].enrollmentRevenue,
          totalRevenue: revenueMap[k].totalRevenue,
          orderCount: revenueMap[k].orderCount,
          enrollmentCount: revenueMap[k].enrollmentCount,
        };
      });

    // 5. Upcoming Sessions
    const { data: upcomingRaw, count: upcomingSessionsCount } = await supabase
      .from("class_sessions")
      .select("id, title, type, starts_at, ends_at, status, capacity, teacher:teacher_id(full_name)", { count: "exact" })
      .in("status", ["scheduled", "live"])
      .order("starts_at", { ascending: true })
      .limit(5);

    const upcomingSessionsList = (upcomingRaw || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      status: s.status,
      capacity: s.capacity,
      teacher_name: s.teacher?.full_name || "Guild Artisan",
    }));

    // 6. New Designs
    const { count: newDesignsCount } = await supabase
      .from("designs")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");

    // 7. New Users This Week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: newUsersThisWeek } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo);

    // 8. Recent Audit Log Activity with Actor Profiles
    const { data: recentActivity } = await supabase
      .from("audit_log")
      .select(`
        id, actor_id, action, entity, entity_id, metadata, created_at,
        profiles:actor_id(full_name, email, role)
      `)
      .order("created_at", { ascending: false })
      .limit(8);

    // 9. Recent Pending Orders (for immediate action on dashboard)
    const { data: recentPendingOrders } = await supabase
      .from("orders")
      .select("id, order_number, total_price, created_at, profiles:buyer_id(full_name, phone)")
      .eq("status", "pending_verification")
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      pendingPayments: (pendingOrderPayments || 0) + (pendingEnrollmentPayments || 0),
      pendingOrderPayments: pendingOrderPayments || 0,
      pendingEnrollmentPayments: pendingEnrollmentPayments || 0,
      ordersByStatus,
      totalOrders: allOrders?.length || 0,
      upcomingSessionsCount: upcomingSessionsCount || 0,
      upcomingSessionsList: upcomingSessionsList || [],
      newDesignsCount: newDesignsCount || 0,
      orderRevenue,
      enrollmentRevenue,
      totalRevenue,
      revenueOverTime,
      newUsersThisWeek: newUsersThisWeek || 0,
      recentActivity: recentActivity || [],
      recentPendingOrders: recentPendingOrders || [],
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to load dashboard statistics" }, { status });
  }
}
