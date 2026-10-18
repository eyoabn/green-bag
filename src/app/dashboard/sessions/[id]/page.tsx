"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { 
  Video, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  PlayCircle,
  ExternalLink,
  Layers,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface ClassSessionDetail {
  id: string;
  type: "in_person" | "live";
  title: string;
  description: string;
  teacher_name?: string;
  instructor_id?: string;
  location?: string;
  start_time: string;
  end_time?: string;
  capacity: number;
  enrolled_count: number;
  price: number;
  status: string;
}

interface EnrollmentDetail {
  id: string;
  session_id: string;
  status: "pending_verification" | "approved" | "rejected" | "attended";
  payment_proof_path?: string;
  attendance_status?: string;
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const [session, setSession] = useState<ClassSessionDetail | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSessionAndEnrollment() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch class session details from real PostgreSQL API
        const res = await fetch(`/api/classes/${sessionId}`);
        if (!res.ok) {
          throw new Error("Unable to load workshop session details.");
        }
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
        } else {
          throw new Error("Workshop session not found.");
        }

        // 2. If logged in, fetch user's enrollment record
        if (user) {
          const { data: enrollData } = await supabase
            .from("enrollments")
            .select("id, session_id, status, payment_proof_path, attendance_status")
            .eq("session_id", sessionId)
            .eq("student_id", user.id)
            .maybeSingle();

          if (enrollData) {
            setEnrollment(enrollData as EnrollmentDetail);
          }
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load session details.");
      } finally {
        setLoading(false);
      }
    }

    loadSessionAndEnrollment();
  }, [sessionId]);

  const isLive = session?.type === "live";
  const isConfirmed = enrollment?.status === "approved" || enrollment?.status === "attended";
  const isPending = enrollment?.status === "pending_verification";

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#F9F6F0]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/dashboard/classes" 
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#8C4B31] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to My Academy Classes</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center animate-pulse shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#1E3B2E]/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={24} className="text-[#1E3B2E] animate-spin" />
            </div>
            <p className="text-sm font-serif font-bold text-stone-800">Loading workshop information...</p>
          </div>
        ) : error || !session ? (
          <div className="bg-white p-12 rounded-3xl border border-red-200 text-center shadow-sm">
            <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-serif font-bold text-stone-900 mb-2">Workshop Not Found</h2>
            <p className="text-xs text-stone-500 mb-6">{error || "The requested session could not be located."}</p>
            <Link 
              href="/learn/schedule" 
              className="inline-flex items-center gap-2 bg-[#1E3B2E] text-white px-6 py-3 rounded-full text-xs font-bold hover:bg-[#8C4B31] transition-all"
            >
              <span>Explore Workshop Schedule</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Main Header Banner */}
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-stone-200 shadow-md relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#1E3B2E]/10 text-[#1E3B2E]">
                  {isLive ? <Video size={14} /> : <MapPin size={14} />}
                  <span>{isLive ? "Live Online Video Workshop" : "In-Person Addis Studio"}</span>
                </div>

                {isConfirmed && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 size={14} />
                    <span>Seat Confirmed & Verified</span>
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <Clock size={14} />
                    <span>Payment Under Review</span>
                  </span>
                )}
                {!enrollment && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600">
                    <span>Not Enrolled</span>
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
                {session.title}
              </h1>

              <p className="text-stone-600 text-sm leading-relaxed max-w-3xl mb-8">
                {session.description}
              </p>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-100 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Lead Instructor</span>
                    <span className="font-bold text-stone-800">{session.teacher_name || "Guild Senior Artisan"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Date & Schedule</span>
                    <span className="font-bold text-stone-800">
                      {new Date(session.start_time).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Time (East Africa Time)</span>
                    <span className="font-bold text-stone-800">
                      {new Date(session.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {session.end_time ? ` - ${new Date(session.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Cards: Live Studio vs In-Person Details */}
            {isLive ? (
              <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-md">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-stone-900 mb-1 flex items-center gap-2">
                      <PlayCircle size={20} className="text-[#8C4B31]" />
                      <span>LiveKit WebRTC Classroom Stream</span>
                    </h2>
                    <p className="text-xs text-stone-500">
                      High-definition multi-track broadcast with live instructor feed, student hand-raising queue, and live chat.
                    </p>
                  </div>

                  {isConfirmed ? (
                    <Link
                      href={`/dashboard/live/${session.id}`}
                      className="inline-flex items-center gap-2 bg-[#1E3B2E] hover:bg-[#8C4B31] text-white px-7 py-3.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all shadow-md"
                    >
                      <Video size={16} />
                      <span>Join Live Video Studio</span>
                      <ArrowRight size={14} />
                    </Link>
                  ) : isPending ? (
                    <div className="text-right">
                      <span className="inline-block px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-1">
                        Receipt Verification Pending
                      </span>
                      <p className="text-[11px] text-stone-400">Stream unlocks upon admin confirmation.</p>
                    </div>
                  ) : (
                    <Link
                      href="/learn/schedule"
                      className="inline-flex items-center gap-2 bg-[#8C4B31] hover:bg-[#1E3B2E] text-white px-6 py-3 rounded-full text-xs font-bold transition-all shadow-sm"
                    >
                      <span>Enroll in Workshop</span>
                      <ArrowRight size={14} />
                    </Link>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck size={18} className="text-[#1E3B2E] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-stone-900">Encrypted Token Admission</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Role-gated tokens minted by our secure server API ensure only verified students and designated teachers can enter.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Layers size={18} className="text-[#8C4B31] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-stone-900">Equipment & Setup</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Laptop or desktop with Chromium browser recommended. Earphones with microphone recommended for Q&A interaction.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-md">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-stone-900 mb-1 flex items-center gap-2">
                      <MapPin size={20} className="text-[#1E3B2E]" />
                      <span>In-Person Addis Ababa Studio Location</span>
                    </h2>
                    <p className="text-xs text-stone-500">
                      Physical converting facility and artisan workshop.
                    </p>
                  </div>

                  <a
                    href="https://maps.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C4B31] hover:underline"
                  >
                    <span>Open in Maps</span>
                    <ExternalLink size={13} />
                  </a>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-stone-200/80 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Facility Address
                  </span>
                  <p className="font-bold text-stone-900 text-sm mb-1">
                    {session.location || "Ethiopia Arenguade Paper Factory & Guild Academy"}
                  </p>
                  <p className="text-xs text-stone-600">
                    Bole Subcity, Woreda 03, Industrial Converting Zone, Addis Ababa, Ethiopia
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600">
                  <div className="p-4 rounded-xl border border-stone-200 bg-white">
                    <h4 className="font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-[#1E3B2E]" />
                      <span>Included Studio Materials</span>
                    </h4>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      All Ethiopian virgin kraft paper sheets, bone folding tools, high-tensile glues, and twisted cord handles are provided by the factory.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-stone-200 bg-white">
                    <h4 className="font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#8C4B31]" />
                      <span>Artisan Safety & Protocols</span>
                    </h4>
                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Safety aprons and equipment training provided. Please arrive 15 minutes prior to scheduled start time for orientation.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
