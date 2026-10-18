"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Video, 
  Users, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Play, 
  ArrowRight, 
  Sparkles, 
  BookOpen,
  AlertCircle,
  User,
  LogOut
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { MobileBottomNav } from "@/components/MobileBottomNav";

interface TeacherSession {
  id: string;
  type: "in_person" | "live";
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  price: number;
  status: "scheduled" | "live" | "ended" | "cancelled";
  livekit_room_name?: string;
  enrolledCount: number;
  confirmedCount: number;
  attendedCount: number;
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [startingSessionId, setStartingSessionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadTeacherData() {
      setLoading(true);
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login?returnTo=/teacher");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setTeacherProfile(profile);

        // Fetch class sessions assigned to this teacher (or all if admin)
        let query = supabase
          .from("class_sessions")
          .select(`
            id, type, title, description, location, starts_at, ends_at,
            capacity, price, status, livekit_room_name,
            enrollments(id, status, attended)
          `)
          .order("starts_at", { ascending: true });

        if (profile?.role === "teacher") {
          query = query.eq("teacher_id", user.id);
        }

        const { data: dbSessions, error } = await query;
        if (error) throw error;

        const mapped: TeacherSession[] = (dbSessions || []).map((s: any) => {
          const enrs = s.enrollments || [];
          const active = enrs.filter((e: any) => e.status === "approved" || e.status === "confirmed" || e.status === "attended");
          const attended = enrs.filter((e: any) => e.attended === true);
          return {
            id: s.id,
            type: s.type,
            title: s.title,
            description: s.description || "",
            location: s.location || "Addis Ababa Studio",
            starts_at: s.starts_at,
            ends_at: s.ends_at,
            capacity: s.capacity,
            price: Number(s.price),
            status: s.status,
            livekit_room_name: s.livekit_room_name,
            enrolledCount: enrs.length,
            confirmedCount: active.length,
            attendedCount: attended.length,
          };
        });

        setSessions(mapped);
      } catch (err: any) {
        console.error("Failed to load teacher dashboard:", err);
        setErrorMsg(err.message || "Could not load sessions");
      } finally {
        setLoading(false);
      }
    }

    loadTeacherData();
  }, [router]);

  const handleStartLiveSession = async (session: TeacherSession) => {
    setStartingSessionId(session.id);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/live/${session.id}/start`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to launch live classroom.");
      }

      router.push(`/teacher/live/${session.id}`);
    } catch (err: any) {
      console.error("Start live session error:", err);
      setErrorMsg(err.message || "Failed to start live session.");
      setStartingSessionId(null);
    }
  };

  const formatSchedule = (startsAt: string, endsAt: string) => {
    try {
      const s = new Date(startsAt);
      const e = new Date(endsAt);
      const dateStr = s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const timeStr = `${s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - ${e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
      return `${dateStr} • ${timeStr}`;
    } catch {
      return startsAt;
    }
  };

  const totalAssigned = sessions.length;
  const liveSessions = sessions.filter(s => s.type === "live").length;
  const totalStudents = sessions.reduce((acc, s) => acc + s.confirmedCount, 0);

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-28 md:pb-20 bg-[#F9F6F0]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 w-full">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3B2E]/10 border border-[#1E3B2E]/20 text-[#1E3B2E] text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen size={13} />
              Guild Artisan Portal
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Instructor Studio Dashboard
            </h1>
            <p className="text-stone-600 text-sm mt-1">
              Welcome, <span className="font-semibold text-stone-900">{teacherProfile?.full_name || "Instructor"}</span>. Manage your hands-on workshops, mark student attendance, and launch LiveKit interactive studio broadcasts.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/profile"
              className="px-4 py-2.5 rounded-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <User size={13} />
              <span>My Profile</span>
            </Link>
            <Link
              href="/learn/schedule"
              className="px-5 py-2.5 rounded-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Public Workshop Catalog</span>
              <ArrowRight size={13} />
            </Link>
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
              }}
              className="px-4 py-2.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-all border border-red-200 flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Assigned Classes</span>
            <p className="font-serif text-3xl font-bold text-stone-900 mt-2">{totalAssigned}</p>
            <p className="text-[11px] text-stone-500 mt-1">Workshops under your leadership</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E3B2E]">LiveKit Streams</span>
            <p className="font-serif text-3xl font-bold text-[#1E3B2E] mt-2">{liveSessions}</p>
            <p className="text-[11px] text-stone-500 mt-1">Interactive WebRTC broadcasts</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">Enrolled Artisans</span>
            <p className="font-serif text-3xl font-bold text-[#8C4B31] mt-2">{totalStudents}</p>
            <p className="text-[11px] text-stone-500 mt-1">Confirmed tuition students</p>
          </div>
        </div>

        {/* Class Sessions List */}
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Your Class Sessions</h2>

          {loading ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
              <Sparkles size={28} className="animate-spin text-[#1E3B2E] mx-auto mb-3" />
              <p className="text-sm font-semibold text-stone-700">Loading your instructor classes from database...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
              <Calendar size={32} className="text-stone-400 mx-auto mb-3" />
              <h3 className="font-serif text-xl font-bold text-stone-800">No classes assigned yet</h3>
              <p className="text-xs text-stone-500 mt-1">Contact an administrator to be assigned to upcoming craft workshops.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.id}
                className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      session.type === "live"
                        ? "bg-[#1E3B2E]/10 text-[#1E3B2E] border border-[#1E3B2E]/20"
                        : "bg-[#8C4B31]/10 text-[#8C4B31] border border-[#8C4B31]/20"
                    }`}>
                      {session.type === "live" ? "LiveKit WebRTC Classroom" : "Studio In-Person"}
                    </span>

                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      session.status === "live"
                        ? "bg-red-50 text-red-700 border border-red-200 animate-pulse font-extrabold"
                        : session.status === "ended"
                        ? "bg-stone-100 text-stone-600"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}>
                      {session.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-stone-900">
                    {session.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#8C4B31]" />
                      {formatSchedule(session.starts_at, session.ends_at)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {session.type === "live" ? <Video size={13} className="text-[#1E3B2E]" /> : <MapPin size={13} className="text-[#1E3B2E]" />}
                      {session.location}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                      <Users size={13} />
                      {session.confirmedCount} / {session.capacity} Confirmed Students
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Link
                    href={`/teacher/classes/${session.id}`}
                    className="px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Users size={14} />
                    <span>View Roster & Attendance ({session.confirmedCount})</span>
                  </Link>

                  {session.type === "live" && (
                    <button
                      onClick={() => handleStartLiveSession(session)}
                      disabled={startingSessionId === session.id}
                      className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                        session.status === "live"
                          ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                          : "bg-[#1E3B2E] hover:bg-[#8C4B31] text-white"
                      }`}
                    >
                      {startingSessionId === session.id ? (
                        <>
                          <Sparkles size={14} className="animate-spin" />
                          <span>Connecting Cloud...</span>
                        </>
                      ) : session.status === "live" ? (
                        <>
                          <Play size={14} />
                          <span>Enter Live Studio</span>
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          <span>Start Live Class</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      <MobileBottomNav role="teacher" />
    </div>
  );
}
