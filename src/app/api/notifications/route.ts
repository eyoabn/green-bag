import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/utils/roles";
import { createClient } from "@/utils/supabase/server";

// GET /api/notifications - List user notifications
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, user_id, title, message, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to load notifications" }, { status });
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => ({}));
    const { id, markAllRead } = body;
    const supabase = await createClient();

    if (markAllRead) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);

      if (error) throw error;
      return NextResponse.json({ success: true, allRead: true });
    }

    if (id) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      return NextResponse.json({ success: true, id });
    }

    return NextResponse.json({ error: "Missing notification id or markAllRead flag" }, { status: 400 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Failed to update notification" }, { status });
  }
}
