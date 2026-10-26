"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  CheckCheck, 
  ExternalLink, 
  Clock, 
  Sparkles, 
  Filter, 
  ArrowLeft,
  ShoppingBag,
  GraduationCap,
  PenTool,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.warn("Failed to load notifications:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const supabase = createClient();
    let channel: any = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        loadNotifications();

        // Subscribe to Realtime notifications for this user with unique channel identifier
        channel = supabase
          .channel(`page-notifications-${user.id}-${Math.random().toString(36).substring(2, 8)}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const raw = payload.new as any;
              const newNotif: NotificationItem = {
                id: raw.id,
                user_id: raw.user_id,
                title: raw.title,
                message: raw.body || raw.message,
                link: raw.link,
                is_read: Boolean(raw.is_read),
                created_at: raw.created_at,
              };
              setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== raw.id)]);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const raw = payload.new as any;
              setNotifications((prev) =>
                prev.map((n) =>
                  n.id === raw.id
                    ? { ...n, is_read: Boolean(raw.is_read), message: raw.body || n.message }
                    : n
                )
              );
            }
          )
          .subscribe();
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      if (link) {
        router.push(link);
      }
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filtered = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  const getIconForNotification = (title: string, link?: string) => {
    const t = (title + " " + (link || "")).toLowerCase();
    if (t.includes("order") || t.includes("receipt") || t.includes("payment")) {
      return <ShoppingBag size={18} className="text-[#8C4B31]" />;
    }
    if (t.includes("class") || t.includes("workshop") || t.includes("live") || t.includes("session")) {
      return <GraduationCap size={18} className="text-[#1E3B2E]" />;
    }
    if (t.includes("design") || t.includes("quote")) {
      return <PenTool size={18} className="text-purple-700" />;
    }
    return <Bell size={18} className="text-stone-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
              Live Realtime Feed
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            Notifications & System Alerts
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Realtime activity on your packaging orders, workshop admissions, and custom quotes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              data-testid="mark-all-read-btn"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <CheckCheck size={14} />
              <span>Mark All as Read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-[#1E3B2E] text-white shadow-xs"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filter === "unread"
                ? "bg-[#1E3B2E] text-white shadow-xs"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <span className="text-[11px] text-stone-400 font-mono">
          Live real-time sync active
        </span>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#1E3B2E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-500 font-medium">Checking notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Bell size={24} />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-800">
            {filter === "unread" ? "No unread alerts" : "No notifications yet"}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {filter === "unread"
              ? "All your notifications are marked as read. You are fully up to date."
              : "When your orders advance, classes go live, or our engineers reply, you will receive real-time notifications here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="notifications-page-list">
          {filtered.map((n) => (
            <div
              key={n.id}
              data-testid="notification-card"
              onClick={() => handleMarkAsRead(n.id, n.link)}
              className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex items-start gap-4 ${
                !n.is_read
                  ? "bg-amber-50/70 border-amber-200/80 shadow-xs hover:border-[#8C4B31]/40"
                  : "bg-white border-stone-200/80 hover:border-stone-300 hover:shadow-xs"
              }`}
            >
              <div className="p-2.5 rounded-2xl bg-white border border-stone-200 shadow-2xs shrink-0 mt-0.5">
                {getIconForNotification(n.title, n.link)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm ${!n.is_read ? "font-bold text-stone-900" : "font-semibold text-stone-800"}`}>
                    {n.title}
                  </h4>
                  {!n.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8C4B31] shrink-0" title="Unread" />
                  )}
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">{n.message}</p>

                <div className="flex items-center gap-3 pt-1 text-[11px] text-stone-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                  {n.link && (
                    <span className="text-[#1E3B2E] font-sans font-bold hover:underline inline-flex items-center gap-1">
                      <span>Open Link</span>
                      <ExternalLink size={11} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
