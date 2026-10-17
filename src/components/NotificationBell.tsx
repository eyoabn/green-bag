"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, ExternalLink, Sparkles, X } from "lucide-react";
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

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.warn("Notifications fetch error:", e);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    // Check user & load
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        loadNotifications();

        // Subscribe to Supabase Realtime
        const channel = supabase
          .channel(`notifications-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const newNotif = payload.new as NotificationItem;
              setNotifications((prev) => [newNotif, ...prev]);
              setUnreadCount((c) => c + 1);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      setUnreadCount((c) => Math.max(0, c - 1));
      if (link) {
        setIsOpen(false);
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
      setUnreadCount(0);
    } catch {}
  };

  if (!userId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-stone-700 hover:text-[#1E3B2E] hover:bg-stone-200/50 transition-colors"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-stone-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-[#FAF7F2]">
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-bold text-stone-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-[#8C4B31] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id, n.link)}
                  className={`p-3.5 text-xs transition-colors cursor-pointer flex items-start gap-3 ${
                    !n.is_read ? "bg-amber-50/50 hover:bg-amber-100/50" : "hover:bg-stone-50"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? "bg-[#8C4B31]" : "bg-transparent"}`} />
                  <div className="flex-1 space-y-0.5">
                    <p className={`font-semibold ${!n.is_read ? "text-stone-900 font-bold" : "text-stone-700"}`}>
                      {n.title}
                    </p>
                    <p className="text-stone-600 text-[11px] leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-stone-400 font-mono">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  {n.link && <ExternalLink size={12} className="text-stone-400 mt-1 shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
