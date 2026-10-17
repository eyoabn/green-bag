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

    // 2. Orders by Status
    const { data: allOrders } = await supabase
      .from("orders")
      .select("id, status, total_price");

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
      .select("id, session_id, class_sessions(price)")
      .eq("status", "approved");

    let enrollmentRevenue = 0;
    (approvedEnrollments || []).forEach((e: any) => {
      const price = Number(e.class_sessions?.price || 0);
      enrollmentRevenue += price;
    });

    const totalRevenue = orderRevenue + enrollmentRevenue;

    // 4. Upcoming Sessions
    const { data: upcomingSessionsList, count: upcomingSessionsCount } = await supabase
      .from("class_sessions")
      .select("id, title, type, starts_at, ends_at, status, capacity, teacher_name")
      .in("status", ["scheduled", "live"])
      .order("starts_at", { ascending: true })
      .limit(5);

    // 5. New Designs
    const { count: newDesignsCount } = await supabase
      .from("designs")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");

    // 6. New Users This Week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: newUsersThisWeek } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo);

    // 7. Recent Audit Log Activity
    const { data: recentActivity } = await supabase
      .from("audit_log")
      .select("id, actor_id, action, entity, entity_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    // 8. Recent Pending Orders (for immediate action on dashboard)
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
      newUsersThisWeek: newUsersThisWeek || 0,
      recentActivity: recentActivity || [],
      recentPendingOrders: recentPendingOrders || [],
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to load dashboard statistics" }, { status });
  }
}
