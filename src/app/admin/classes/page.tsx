"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Video, 
  Calendar, 
  Plus, 
  MapPin, 
  Trash2,
  ExternalLink,
  X,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  Edit,
  Eye,
  CheckSquare,
  Square,
  Ban
} from "lucide-react";

interface ClassSession {
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
  teacher_id?: string;
  teacher?: {
    id: string;
    full_name: string;
    email: string;
  };
  enrolledCount: number;
  spotsLeft: number;
  isFull: boolean;
}

interface TeacherOption {
  id: string;
  full_name: string;
  email: string;
}

interface StudentEnrollment {
  id: string;
  student_id: string;
  status: string;
  payment_proof_path?: string;
  attended: boolean;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
}

export default function AdminClassesPage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [selectedSessionForRoster, setSelectedSessionForRoster] = useState<ClassSession | null>(null);
  const [rosterEnrollments, setRosterEnrollments] = useState<StudentEnrollment[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    type: "live" as "in_person" | "live",
    teacher_id: "",
    starts_at: "",
    ends_at: "",
    price: 350,
    capacity: 25,
    location: "Addis Ababa Studio (Bole Subcity)",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadClasses = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/classes?status=all");
      const data = await res.json();
      if (res.ok && data.classes) {
        setSessions(data.classes);
      } else {
        throw new Error(data.error || "Failed to load class sessions");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load workshops");
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const res = await fetch("/api/admin/users?role=teacher&pageSize=100");
      const data = await res.json();
      if (res.ok && data.users) {
        setTeachers(data.users);
      }
    } catch (err) {
      console.warn("Failed to load teacher list:", err);
    }
  };

  useEffect(() => {
    loadClasses();
    loadTeachers();
  }, []);

  const openCreateModal = () => {
    // Default dates in ISO format with UTC+3 awareness
    const now = new Date();
    now.setDate(now.getDate() + 3);
    now.setHours(14, 0, 0, 0); // 2:00 PM
    const startStr = now.toISOString().slice(0, 16);
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    const endStr = end.toISOString().slice(0, 16);

    setFormData({
      title: "",
      type: "live",
      teacher_id: teachers[0]?.id || "",
      starts_at: startStr,
      ends_at: endStr,
      price: 350,
      capacity: 25,
      location: "Addis Ababa Studio (Bole Subcity)",
      description: "",
    });
    setCreateModalOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          teacher_id: formData.teacher_id || undefined,
          starts_at: new Date(formData.starts_at).toISOString(),
          ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : undefined,
          location: formData.type === "in_person" ? formData.location : "LiveKit Interactive Video Room",
          price: Number(formData.price),
          capacity: Number(formData.capacity),
          description: formData.description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule class session");

      setCreateModalOpen(false);
      setSuccessMsg(`Class "${formData.title}" scheduled successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadClasses();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to schedule class");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (session: ClassSession) => {
    setEditingSession(session);
    setFormData({
      title: session.title,
      type: session.type,
      teacher_id: session.teacher_id || session.teacher?.id || "",
      starts_at: session.starts_at ? new Date(session.starts_at).toISOString().slice(0, 16) : "",
      ends_at: session.ends_at ? new Date(session.ends_at).toISOString().slice(0, 16) : "",
      price: Number(session.price),
      capacity: session.capacity,
      location: session.location || "",
      description: session.description || "",
    });
    setEditModalOpen(true);
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/classes/${editingSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          teacher_id: formData.teacher_id || null,
          starts_at: new Date(formData.starts_at).toISOString(),
          ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : undefined,
          location: formData.location,
          price: Number(formData.price),
          capacity: Number(formData.capacity),
          description: formData.description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update class session");

      setEditModalOpen(false);
      setEditingSession(null);
      setSuccessMsg(`Class updated successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadClasses();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update class");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSession = async (session: ClassSession) => {
    if (!confirm(`Cancel "${session.title}"? This will notify all enrolled students.`)) return;

    try {
      const res = await fetch(`/api/classes/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel class session");

      setSuccessMsg(`Session cancelled. Enrolled students have been notified.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadClasses();
    } catch (err: any) {
      alert(err.message || "Failed to cancel session");
    }
  };

  const openRosterModal = async (session: ClassSession) => {
    setSelectedSessionForRoster(session);
    setRosterModalOpen(true);
    setRosterLoading(true);

    try {
      const res = await fetch(`/api/classes/${session.id}`);
      const data = await res.json();
      if (res.ok && data.session?.enrollments) {
        setRosterEnrollments(data.session.enrollments);
      } else {
        setRosterEnrollments([]);
      }
    } catch (err) {
      console.error("Failed to load roster:", err);
      setRosterEnrollments([]);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleToggleAttendance = async (enrollmentId: string, currentVal: boolean) => {
    try {
      const res = await fetch("/api/enrollments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          action: "attendance",
          attended: !currentVal,
        }),
      });

      if (res.ok) {
        setRosterEnrollments(prev =>
          prev.map(e => e.id === enrollmentId ? { ...e, attended: !currentVal } : e)
        );
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update attendance");
      }
    } catch (err: any) {
      alert("Error updating attendance: " + err.message);
    }
  };

  const exportRosterCsv = () => {
    if (!selectedSessionForRoster || rosterEnrollments.length === 0) {
      alert("No enrollments to export.");
      return;
    }

    const headers = ["Student Name", "Email", "Phone", "Status", "Attended", "Enrolled Date"];
    const rows = rosterEnrollments.map(e => [
      `"${e.profiles?.full_name || "Unknown"}"`,
      `"${e.profiles?.email || ""}"`,
      `"${e.profiles?.phone || ""}"`,
      `"${e.status}"`,
      `"${e.attended ? "Yes" : "No"}"`,
      `"${new Date(e.created_at).toLocaleDateString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `roster_${selectedSessionForRoster.title.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSchedule = (startsAt?: string, endsAt?: string) => {
    if (!startsAt) return "TBD";
    try {
      const s = new Date(startsAt);
      const dateStr = s.toLocaleDateString("en-US", {
        timeZone: "Africa/Addis_Ababa",
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      const timeStr = s.toLocaleTimeString("en-US", {
        timeZone: "Africa/Addis_Ababa",
        hour: "numeric",
        minute: "2-digit"
      });
      return `${dateStr} at ${timeStr} (EAT)`;
    } catch {
      return startsAt;
    }
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Arenguade Craft Academy • Operations Command
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            Workshops & Class Sessions
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Schedule studio classes in Addis Ababa or LiveKit streaming masterclasses. Assign verified instructors and manage student rosters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/learn/schedule"
            target="_blank"
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-4 py-3 rounded-full transition-colors flex items-center gap-1.5"
          >
            <span>Public Schedule</span>
            <ExternalLink size={13} />
          </Link>
          <button
            onClick={openCreateModal}
            className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-3 rounded-full transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Schedule New Workshop</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Class Sessions List */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
            <Sparkles size={28} className="animate-spin text-[#8C4B31] mx-auto mb-3" />
            <p className="text-xs font-bold text-stone-600">Loading scheduled workshops...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-stone-200">
            <Calendar size={36} className="text-stone-400 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-stone-800">No workshop sessions yet</h3>
            <p className="text-xs text-stone-500 mt-1">Click &quot;Schedule New Workshop&quot; to create your first studio or live session.</p>
          </div>
        ) : (
          sessions.map((session) => {
            const isLive = session.type === "live";
            const isCancelled = session.status === "cancelled";
            const teacherName = session.teacher?.full_name || "Factory Lead Instructor";

            return (
              <div 
                key={session.id}
                className={`bg-white rounded-3xl p-6 border transition-all shadow-xs ${
                  isCancelled ? "border-stone-200 opacity-60 bg-stone-50" : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* Left Column: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.8 rounded-full ${
                        isLive ? "bg-[#1E3B2E]/10 text-[#1E3B2E]" : "bg-[#8C4B31]/10 text-[#8C4B31]"
                      }`}>
                        {isLive ? <Video size={12} /> : <MapPin size={12} />}
                        <span>{isLive ? "LiveKit Virtual Masterclass" : "In-Person Addis Studio"}</span>
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isCancelled 
                          ? "bg-red-100 text-red-700" 
                          : session.status === "live" 
                          ? "bg-emerald-100 text-emerald-800 animate-pulse" 
                          : "bg-stone-100 text-stone-600"
                      }`}>
                        {session.status}
                      </span>
                    </div>

                    <h2 className="font-serif text-xl font-bold text-stone-900">
                      {session.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-stone-400" />
                        <span>{formatSchedule(session.starts_at, session.ends_at)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={13} className="text-stone-400" />
                        <span>Teacher: <strong className="text-stone-800">{teacherName}</strong></span>
                      </span>
                      <span>
                        Location: <strong className="text-stone-800">{session.location}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Metrics */}
                  <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Registration</span>
                      <span className="font-bold text-sm text-stone-900">{session.price} ETB</span>
                    </div>
                    <div className="w-px h-8 bg-stone-200" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Enrolled Seats</span>
                      <span className="font-bold text-sm text-stone-900">
                        {session.enrolledCount} / {session.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openRosterModal(session)}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Roster ({session.enrolledCount})</span>
                    </button>

                    {!isCancelled && (
                      <>
                        <button
                          onClick={() => openEditModal(session)}
                          className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
                          title="Edit Session Details"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleCancelSession(session)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                          title="Cancel Session & Notify Students"
                        >
                          <Ban size={16} />
                        </button>
                      </>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">Academy Operations</span>
                <h3 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">Schedule Workshop</h3>
              </div>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterclass in Heavy Gauge Kraft Folding"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Workshop Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                  >
                    <option value="live">LiveKit Virtual Masterclass</option>
                    <option value="in_person">In-Person Studio (Addis Ababa)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Assigned Teacher *</label>
                  <select
                    required
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                  >
                    <option value="">Select a verified instructor...</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.type === "in_person" && (
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Studio Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Addis Ababa Studio, Bole Subcity"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Starts At (Addis Ababa Local Time) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Ends At (Addis Ababa Local Time)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Capacity (Max Seats) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Price (ETB) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Curriculum & Description</label>
                <textarea
                  rows={3}
                  placeholder="Outline syllabus, materials provided, and take-home certifications..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1E3B2E] hover:bg-[#8C4B31] text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Scheduling..." : "Create Workshop Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">Academy Operations</span>
                <h3 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">Edit Workshop Session</h3>
              </div>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateSession} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Assigned Teacher *</label>
                <select
                  required
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                >
                  <option value="">Select a verified instructor...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Starts At (Addis Ababa Local Time) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Ends At (Addis Ababa Local Time)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Price (ETB) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Curriculum & Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-[#1E3B2E]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1E3B2E] hover:bg-[#8C4B31] text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROSTER MODAL */}
      {rosterModalOpen && selectedSessionForRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">Student Enrollment Roster</span>
                <h3 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">
                  {selectedSessionForRoster.title}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Capacity: {selectedSessionForRoster.capacity} • Enrolled: {rosterEnrollments.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportRosterCsv}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export Roster as CSV"
                >
                  <Download size={14} />
                  <span>CSV Export</span>
                </button>
                <button 
                  onClick={() => setRosterModalOpen(false)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {rosterLoading ? (
              <div className="p-8 text-center">
                <Sparkles size={24} className="animate-spin text-[#8C4B31] mx-auto mb-2" />
                <p className="text-xs text-stone-500">Loading student roster...</p>
              </div>
            ) : rosterEnrollments.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-100">
                <Users size={32} className="text-stone-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-stone-700">No students enrolled yet</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Approved registrations will appear in this checklist.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-center">Attended</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      {rosterEnrollments.map((enr) => (
                        <tr key={enr.id} className="hover:bg-stone-50">
                          <td className="py-3 px-3 font-semibold text-stone-900">
                            {enr.profiles?.full_name || "Enrolled Student"}
                          </td>
                          <td className="py-3 px-3 text-stone-500">
                            <div>{enr.profiles?.email}</div>
                            <div className="text-[10px]">{enr.profiles?.phone}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              enr.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : enr.status === "pending_verification"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-stone-100 text-stone-600"
                            }`}>
                              {enr.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleToggleAttendance(enr.id, enr.attended)}
                              className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer text-stone-700"
                              title={enr.attended ? "Mark as Not Attended" : "Mark as Attended"}
                            >
                              {enr.attended ? (
                                <CheckSquare size={18} className="text-emerald-600" />
                              ) : (
                                <Square size={18} className="text-stone-400" />
                              )}
                            </button>
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
      )}

    </div>
  );
}
