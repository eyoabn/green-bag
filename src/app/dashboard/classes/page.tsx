"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Video, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Upload, 
  ArrowRight,
  Sparkles,
  ExternalLink,
  Ban,
  Radio,
  User
} from "lucide-react";

interface EnrollmentItem {
  id: string;
  session_id: string;
  student_id: string;
  status: "pending_verification" | "approved" | "confirmed" | "rejected" | "cancelled";
  payment_proof_path?: string;
  rejection_reason?: string;
  attended: boolean;
  created_at: string;
  class_sessions: {
    id: string;
    title: string;
    type: "in_person" | "live";
    price: number;
    starts_at: string;
    ends_at: string;
    capacity: number;
    location: string;
    status: "scheduled" | "live" | "ended" | "cancelled";
    livekit_room_name?: string;
    teacher?: {
      id: string;
      full_name: string;
      email: string;
    };
  };
}

export default function MyClassesPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Re-upload proof state
  const [reuploadingId, setReuploadingId] = useState<string | null>(null);
  const [reuploadFile, setReuploadFile] = useState<File | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/enrollments");
      const data = await res.json();
      if (res.ok && data.enrollments) {
        setEnrollments(data.enrollments);
      }
    } catch (err) {
      console.error("Failed to load registrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleCancelEnrollment = async (enrollmentId: string, title: string) => {
    if (!confirm(`Are you sure you want to cancel your seat for "${title}"?`)) return;

    setCancellingId(enrollmentId);
    try {
      const res = await fetch("/api/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          action: "cancel",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel registration");

      setStatusMessage("Registration cancelled successfully.");
      setTimeout(() => setStatusMessage(null), 4000);
      fetchEnrollments();
    } catch (err: any) {
      alert(err.message || "Could not cancel registration");
    } finally {
      setCancellingId(null);
    }
  };

  const handleReuploadProof = async (enrollmentId: string) => {
    if (!reuploadFile) {
      alert("Please select a valid receipt image or PDF (max 5 MB).");
      return;
    }

    setIsSubmittingProof(true);
    try {
      const formData = new FormData();
      formData.append("file", reuploadFile);
      formData.append("bucket", "payment-proofs");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.filePath) {
        throw new Error(uploadData.error || "Failed to upload payment receipt.");
      }

      const patchRes = await fetch("/api/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          action: "upload_proof",
          paymentProofPath: uploadData.filePath,
        }),
      });

      const patchData = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchData.error || "Failed to submit new payment receipt.");

      setStatusMessage("Receipt re-uploaded successfully! Status returned to Pending Verification.");
      setReuploadingId(null);
      setReuploadFile(null);
      setTimeout(() => setStatusMessage(null), 4000);
      fetchEnrollments();
    } catch (err: any) {
      alert(err.message || "Failed to re-upload proof");
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const now = new Date();

  const isUpcoming = (e: EnrollmentItem) => {
    if (!e.class_sessions?.starts_at) return true;
    const sessionStart = new Date(e.class_sessions.starts_at);
    return sessionStart >= now || e.class_sessions.status === "scheduled" || e.class_sessions.status === "live";
  };

  const upcomingList = enrollments.filter(isUpcoming);
  const pastList = enrollments.filter(e => !isUpcoming(e));
  const currentList = activeTab === "upcoming" ? upcomingList : pastList;

  const formatSchedule = (startsAt?: string, endsAt?: string) => {
    if (!startsAt) return "TBD";
    try {
      const s = new Date(startsAt);
      const dateStr = s.toLocaleDateString("en-US", {
        timeZone: "Africa/Addis_Ababa",
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const timeStr = s.toLocaleTimeString("en-US", {
        timeZone: "Africa/Addis_Ababa",
        hour: "numeric",
        minute: "2-digit",
      });
      return `${dateStr} • ${timeStr} (EAT)`;
    } catch {
      return startsAt;
    }
  };

  return (
    <div className="flex flex-col max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Arenguade Craft Academy
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">
            My Registered Classes
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Track your workshop seats, join real-time LiveKit streaming sessions, and inspect physical studio locations in Addis Ababa.
          </p>
        </div>

        <Link
          href="/learn/schedule"
          className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-3 rounded-full transition-colors flex items-center gap-2 shadow-xs w-fit"
        >
          <BookOpen size={15} />
          <span>Browse More Classes</span>
        </Link>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === "upcoming"
              ? "bg-[#1E3B2E] text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          Upcoming Workshops ({upcomingList.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            activeTab === "past"
              ? "bg-[#1E3B2E] text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          Past Workshops ({pastList.length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-stone-200">
            <Sparkles size={28} className="animate-spin text-[#8C4B31] mx-auto mb-2" />
            <p className="text-xs font-bold text-stone-600">Loading your workshop registrations...</p>
          </div>
        ) : currentList.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8">
            <BookOpen size={36} className="text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-stone-800">
              {activeTab === "upcoming" ? "No upcoming workshop registrations" : "No past workshops"}
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {activeTab === "upcoming"
                ? "Explore our schedule to reserve studio hands-on classes or interactive LiveKit masterclasses."
                : "Workshops you attend will be preserved here along with your completion records."}
            </p>
            {activeTab === "upcoming" && (
              <Link
                href="/learn/schedule"
                className="inline-block mt-4 text-xs font-bold text-[#8C4B31] hover:underline"
              >
                View Available Schedule →
              </Link>
            )}
          </div>
        ) : (
          currentList.map((enr) => {
            const session = enr.class_sessions;
            const isLive = session?.type === "live";
            const isApproved = enr.status === "approved" || enr.status === "confirmed";
            const isPending = enr.status === "pending_verification";
            const isRejected = enr.status === "rejected";
            const isCancelled = enr.status === "cancelled" || session?.status === "cancelled";
            const isEnded = session?.status === "ended";
            const canCancel = isPending;

            // Live Join Button State:
            // - If not approved: disabled with notice
            // - If approved: enabled if session is live or within 10-minute start window
            const isSessionLive = session?.status === "live";
            const sessionStart = session?.starts_at ? new Date(session.starts_at) : null;
            const diffMinutes = sessionStart ? (sessionStart.getTime() - Date.now()) / (1000 * 60) : 999;
            const canJoinLive = isApproved && (isSessionLive || diffMinutes <= 10) && !isEnded && !isCancelled;

            return (
              <div
                key={enr.id}
                className={`bg-white rounded-3xl p-6 border transition-all shadow-xs ${
                  isCancelled ? "border-stone-200 opacity-60 bg-stone-50" : "border-stone-200"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* Left Column: Workshop Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.8 rounded-full ${
                        isLive ? "bg-[#1E3B2E]/10 text-[#1E3B2E]" : "bg-[#8C4B31]/10 text-[#8C4B31]"
                      }`}>
                        {isLive ? <Video size={12} /> : <MapPin size={12} />}
                        <span>{isLive ? "LiveKit Virtual Online" : "In-Person Addis Studio"}</span>
                      </span>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-0.8 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800"
                          : isPending
                          ? "bg-amber-100 text-amber-800"
                          : isRejected
                          ? "bg-red-100 text-red-800"
                          : "bg-stone-100 text-stone-600"
                      }`}>
                        {enr.status.replace("_", " ")}
                      </span>

                      {enr.attended && (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={11} /> Attended
                        </span>
                      )}
                    </div>

                    <h2 className="font-serif text-xl font-bold text-stone-900">
                      {session?.title || "Artisanal Paper Packaging Masterclass"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-stone-400" />
                        <span>{formatSchedule(session?.starts_at, session?.ends_at)}</span>
                      </span>
                      {session?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-stone-400" />
                          <span>{session.location}</span>
                        </span>
                      )}
                    </div>

                    {/* Rejection Notice & Re-upload Form */}
                    {isRejected && (
                      <div className="mt-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
                        <div className="flex items-center gap-2 text-red-800 text-xs font-bold mb-1">
                          <AlertCircle size={15} />
                          <span>Payment Receipt Rejected</span>
                        </div>
                        <p className="text-xs text-red-700 italic mb-3">
                          Reason: &ldquo;{enr.rejection_reason || "Receipt illegible or reference mismatch."}&rdquo;
                        </p>

                        {reuploadingId === enr.id ? (
                          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-red-200">
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => setReuploadFile(e.target.files?.[0] || null)}
                              className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1E3B2E] file:text-white"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReuploadProof(enr.id)}
                                disabled={isSubmittingProof || !reuploadFile}
                                className="px-4 py-1.5 bg-[#1E3B2E] text-white text-xs font-bold rounded-full hover:bg-[#8C4B31] disabled:opacity-50"
                              >
                                {isSubmittingProof ? "Uploading..." : "Submit New Receipt"}
                              </button>
                              <button
                                onClick={() => { setReuploadingId(null); setReuploadFile(null); }}
                                className="px-3 py-1.5 bg-stone-200 text-stone-700 text-xs font-bold rounded-full"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReuploadingId(enr.id)}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload size={13} />
                            <span>Re-upload Payment Proof</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Live Session Join Button */}
                    {isLive && (
                      <div>
                        {canJoinLive ? (
                          <Link
                            href={`/dashboard/live/${session.id}`}
                            className="px-5 py-2.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm animate-pulse"
                          >
                            <Radio size={14} className="text-emerald-400" />
                            <span>Join Live Room</span>
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="px-4 py-2.5 rounded-full bg-stone-100 text-stone-400 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                            title={
                              isEnded
                                ? "This session has already ended"
                                : !isApproved
                                ? "Join link unlocks once tuition payment is approved"
                                : "Join link activates 10 minutes before scheduled start"
                            }
                          >
                            <Radio size={14} />
                            <span>
                              {isEnded
                                ? "Session Concluded"
                                : !isApproved
                                ? "Verification Pending"
                                : "Opens 10m Before Start"}
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Cancel Registration Button (before approval) */}
                    {canCancel && (
                      <button
                        onClick={() => handleCancelEnrollment(enr.id, session?.title || "Workshop")}
                        disabled={cancellingId === enr.id}
                        className="px-4 py-2 rounded-full border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <Ban size={13} />
                        <span>{cancellingId === enr.id ? "Cancelling..." : "Cancel Seat"}</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
