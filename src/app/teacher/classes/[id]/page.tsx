"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Video, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  CheckSquare, 
  Square,
  Play
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface EnrollmentItem {
  id: string;
  student_id: string;
  status: "pending_verification" | "approved" | "pending" | "confirmed" | "attended" | "cancelled" | "rejected";
  payment_proof_path?: string;
  attended: boolean;
  created_at: string;
  student?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
}

interface SessionDetail {
  id: string;
  type: "in_person" | "live";
  title: string;
  description: string;
  location: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  price: number;
  status: string;
  livekit_room_name?: string;
}

export default function ClassRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  const router = useRouter();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);

  const loadRoster = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/classes/${sessionId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load class roster.");

      setSession(data.session);
      const enrs = (data.session.enrollments || []).map((e: any) => ({
        id: e.id,
        student_id: e.student_id,
        status: e.status,
        payment_proof_path: e.payment_proof_path,
        attended: Boolean(e.attended),
        created_at: e.created_at,
        student: e.profiles,
      }));
      setEnrollments(enrs);
    } catch (err: any) {
      console.error("Roster load error:", err);
      setErrorMsg(err.message || "Failed to load class roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [sessionId]);

  const toggleAttendance = async (enrollment: EnrollmentItem) => {
    setUpdatingId(enrollment.id);
    try {
      const newAttended = !enrollment.attended;
      const res = await fetch("/api/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          action: "attendance",
          attended: newAttended,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update attendance.");

      // Update local state
      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollment.id ? { ...e, attended: newAttended } : e))
      );
    } catch (err: any) {
      alert(err.message || "Could not toggle attendance status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const approveStudent = async (enrollment: EnrollmentItem) => {
    setUpdatingId(enrollment.id);
    try {
      const res = await fetch("/api/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          action: "approve",
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to approve student registration.");

      setEnrollments((prev) =>
        prev.map((e) => (e.id === enrollment.id ? { ...e, status: "approved" } : e))
      );
    } catch (err: any) {
      alert(err.message || "Could not approve student.");
    } finally {
      setUpdatingId(null);
    }
  };

  const viewProof = async (path?: string) => {
    if (!path) return;
    try {
      const res = await fetch(`/api/storage/signed-url?bucket=payment-proofs&path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (res.ok && data.url) {
        setActiveProofUrl(data.url);
      } else {
        alert(data.error || "Could not generate view link for receipt.");
      }
    } catch (err: any) {
      alert("Error retrieving receipt: " + err.message);
    }
  };

  const formatSchedule = (startsAt?: string, endsAt?: string) => {
    if (!startsAt) return "";
    try {
      const s = new Date(startsAt);
      const e = endsAt ? new Date(endsAt) : null;
      const d = s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const t = e
        ? `${s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} - ${e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
        : s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return `${d} • ${t}`;
    } catch {
      return startsAt;
    }
  };

  const attendedCount = enrollments.filter((e) => e.attended).length;
  const confirmedCount = enrollments.filter((e) => e.status === "approved" || e.status === "confirmed" || e.status === "attended").length;

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[#F9F6F0]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 w-full">
        
        {/* Navigation & Header */}
        <div className="mb-8">
          <Link 
            href="/teacher" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#8C4B31] transition-colors mb-4 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Teacher Dashboard</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  session?.type === "live"
                    ? "bg-[#1E3B2E]/10 text-[#1E3B2E] border border-[#1E3B2E]/20"
                    : "bg-[#8C4B31]/10 text-[#8C4B31] border border-[#8C4B31]/20"
                }`}>
                  {session?.type === "live" ? "LiveKit Classroom" : "Studio In-Person"}
                </span>
                <span className="text-xs text-stone-500 font-medium">Session ID: {sessionId.substring(0, 8)}</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                {session?.title || "Class Session Roster"}
              </h1>
              <p className="text-stone-600 text-xs sm:text-sm mt-1">
                {formatSchedule(session?.starts_at, session?.ends_at)} • {session?.location}
              </p>
            </div>

            {session?.type === "live" && (
              <Link
                href={`/teacher/live/${sessionId}`}
                className="px-6 py-3 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 self-start md:self-auto"
              >
                <Play size={14} />
                <span>Launch Live Studio Room</span>
              </Link>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Stats Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Capacity</span>
            <p className="font-serif text-2xl font-bold text-stone-900 mt-1">{session?.capacity || 0} Seats</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3B2E]">Total Enrolled</span>
            <p className="font-serif text-2xl font-bold text-[#1E3B2E] mt-1">{enrollments.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Confirmed Paid</span>
            <p className="font-serif text-2xl font-bold text-emerald-800 mt-1">{confirmedCount}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">Attended</span>
            <p className="font-serif text-2xl font-bold text-[#8C4B31] mt-1">{attendedCount} / {confirmedCount}</p>
          </div>
        </div>

        {/* Roster Table Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-stone-200/80 flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-stone-900 flex items-center gap-2">
              <Users size={18} className="text-[#1E3B2E]" />
              <span>Student Attendance Roster</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">Click attendance checkbox to mark present</span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Sparkles size={28} className="animate-spin text-[#1E3B2E] mx-auto mb-3" />
              <p className="text-xs font-semibold text-stone-600">Loading student roster...</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="p-12 text-center text-stone-500 text-xs">
              No students enrolled in this session yet.
            </div>
          ) : (
            <div>
              {/* Mobile Attendance Cards (< 768px) */}
              <div className="md:hidden divide-y divide-stone-100">
                {enrollments.map((enr) => (
                  <div key={enr.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-stone-900 text-sm">
                        {enr.student?.full_name || "Enrolled Student"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        enr.status === "approved" || enr.status === "confirmed" || enr.status === "attended"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : enr.status === "pending_verification" || enr.status === "pending"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}>
                        {enr.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <div>
                        {enr.student?.phone ? (
                          <a
                            href={`tel:${enr.student.phone}`}
                            className="font-mono text-[#1E3B2E] font-bold hover:underline flex items-center gap-1"
                          >
                            <span>{enr.student.phone}</span>
                          </a>
                        ) : (
                          <span className="text-stone-400">No phone provided</span>
                        )}
                        <p className="text-[11px] text-stone-500 mt-0.5">{enr.student?.email || ""}</p>
                      </div>

                      {enr.payment_proof_path && (
                        <button
                          onClick={() => viewProof(enr.payment_proof_path)}
                          className="text-[11px] font-bold text-[#8C4B31] hover:underline"
                        >
                          View Receipt
                        </button>
                      )}
                    </div>

                    {/* Touch-friendly attendance button */}
                    <div className="pt-1 space-y-2">
                      {(enr.status === "pending_verification" || enr.status === "pending") && (
                        <button
                          onClick={() => approveStudent(enr)}
                          disabled={updatingId === enr.id}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#1E3B2E] hover:bg-[#8C4B31] text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 size={16} />
                          <span>Accept Student & Confirm Seat</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleAttendance(enr)}
                        disabled={updatingId === enr.id}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer ${
                          enr.attended
                            ? "bg-emerald-700 text-white"
                            : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                        }`}
                      >
                        {enr.attended ? (
                          <>
                            <CheckSquare size={16} />
                            <span>Marked Present</span>
                          </>
                        ) : (
                          <>
                            <Square size={16} />
                            <span>Mark Attendance (Absent)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-6">Attendance</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Contact Details</th>
                      <th className="py-3.5 px-4">Payment Status</th>
                      <th className="py-3.5 px-4">Proof</th>
                      <th className="py-3.5 px-6 text-right">Enrolled At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {enrollments.map((enr) => (
                      <tr key={enr.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <button
                            onClick={() => toggleAttendance(enr)}
                            disabled={updatingId === enr.id}
                            className="flex items-center gap-2 text-stone-800 hover:text-[#1E3B2E] font-semibold transition-colors cursor-pointer min-h-[44px]"
                          >
                            {enr.attended ? (
                              <CheckSquare size={18} className="text-emerald-700" />
                            ) : (
                              <Square size={18} className="text-stone-400" />
                            )}
                            <span className={enr.attended ? "text-emerald-800 font-bold" : "text-stone-600"}>
                              {enr.attended ? "Present" : "Absent"}
                            </span>
                          </button>
                        </td>

                        <td className="py-4 px-4 font-bold text-stone-900">
                          {enr.student?.full_name || "Enrolled Student"}
                        </td>

                        <td className="py-4 px-4 text-stone-600 space-y-0.5">
                          <p>{enr.student?.email || "—"}</p>
                          {enr.student?.phone ? (
                            <a
                              href={`tel:${enr.student.phone}`}
                              className="font-mono text-[11px] text-[#1E3B2E] font-bold hover:underline"
                            >
                              {enr.student.phone}
                            </a>
                          ) : (
                            <span className="font-mono text-[11px] text-stone-400">—</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              enr.status === "approved" || enr.status === "confirmed" || enr.status === "attended"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : enr.status === "pending_verification" || enr.status === "pending"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-red-50 text-red-800 border border-red-200"
                            }`}>
                              {enr.status}
                            </span>
                            {(enr.status === "pending_verification" || enr.status === "pending") && (
                              <button
                                onClick={() => approveStudent(enr)}
                                disabled={updatingId === enr.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                                title="Approve student registration"
                              >
                                <CheckCircle2 size={13} />
                                <span>Accept Student</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {enr.payment_proof_path ? (
                            <button
                              onClick={() => viewProof(enr.payment_proof_path)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8C4B31] hover:underline cursor-pointer min-h-[44px]"
                            >
                              <Eye size={12} />
                              <span>View Slip</span>
                            </button>
                          ) : (
                            <span className="text-stone-400 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right text-stone-500 font-mono text-[11px]">
                          {new Date(enr.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Proof Preview Modal */}
      {activeProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-stone-200 shadow-2xl relative">
            <button
              onClick={() => setActiveProofUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100"
            >
              ✕
            </button>
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">Payment Receipt Screenshot</h3>
            <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 flex items-center justify-center border border-stone-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeProofUrl} alt="Receipt" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
