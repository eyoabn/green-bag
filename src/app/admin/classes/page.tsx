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
  PlayCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Receipt,
  Eye,
  Lock,
  Radio
} from "lucide-react";
import { DataStore, StoredClassSession, StoredRegistration } from "@/utils/dataStore";

export default function AdminClassesPage() {
  const [sessions, setSessions] = useState<StoredClassSession[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Student Roster & QR Verification Modal
  const [selectedRosterSession, setSelectedRosterSession] = useState<StoredClassSession | null>(null);
  const [inspectingQrUrl, setInspectingQrUrl] = useState<string | null>(null);

  // New session form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"in_person" | "live">("live");
  const [instructor, setInstructor] = useState("Factory Lead Craftsman (Admin)");
  const [date, setDate] = useState("Nov 05, 2026");
  const [time, setTime] = useState("2:00 PM - 4:00 PM");
  const [price, setPrice] = useState(350);
  const [capacity, setCapacity] = useState(30);
  const [location, setLocation] = useState("LiveKit Interactive Video Room");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSessions();
    window.addEventListener("arenguade_datastore_change", loadSessions);
    return () => window.removeEventListener("arenguade_datastore_change", loadSessions);
  }, []);

  const loadSessions = () => {
    setSessions(DataStore.getClasses());
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await DataStore.addClass({
        title,
        type,
        instructor,
        date,
        time,
        location: type === "live" ? "LiveKit Interactive Video Room" : (location || "Addis Ababa Studio (Bole Subcity)"),
        price: Number(price),
        capacity: Number(capacity),
        livekitRoom: type === "live" ? `session_${Date.now()}` : undefined,
        description: description || `Professional craft masterclass led by ${instructor}. Full hands-on instruction and certificates.`,
        materialsIncluded: type === "live" 
          ? ["Live WebRTC interactive stream with host controls", "Downloadable CAD dieline outlines", "Permanent session replay recording", "Digital Certificate"]
          : ["100% Ethiopian Virgin Kraft sheets", "Adhesives & bone folders", "Twisted cords & eyelets", "Take-home portfolio"]
      });

      setModalOpen(false);
      setTitle("");
      setDescription("");
      loadSessions();
    } catch (err) {
      console.error("Failed to add session:", err);
      alert("Failed to schedule class.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this workshop from the public curriculum?")) {
      await DataStore.deleteClass(id);
      loadSessions();
    }
  };

  const handleApproveRegistration = (regId: string) => {
    DataStore.updateRegistrationStatus(regId, "approved");
    loadSessions();
  };

  const handleRejectRegistration = (regId: string) => {
    DataStore.updateRegistrationStatus(regId, "rejected");
    loadSessions();
  };

  // Get registrations for currently selected roster session
  const currentRosterStudents = selectedRosterSession 
    ? DataStore.getRegistrationsBySessionId(selectedRosterSession.id)
    : [];

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Arenguade Craft Academy • Teacher & Operations Command
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            Workshops & Live Classrooms
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            The Admin is the Instructor. Verify student payment QR codes, manage enrolled rosters, and broadcast live WebRTC classes.
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
            onClick={() => setModalOpen(true)}
            className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-3 rounded-full transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Schedule New Workshop</span>
          </button>
        </div>
      </div>

      {/* Class Sessions List */}
      <div className="space-y-6">
        {sessions.map((session) => {
          const sessionRegistrations = DataStore.getRegistrationsBySessionId(session.id);
          const verifiedStudents = sessionRegistrations.filter((r) => r.status === "approved").length;
          const pendingStudents = sessionRegistrations.filter((r) => r.status === "pending_verification").length;

          return (
            <div
              key={session.id}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                      session.type === "live"
                        ? "bg-[#1E3B2E]/10 text-[#1E3B2E]"
                        : "bg-[#8C4B31]/10 text-[#8C4B31]"
                    }`}
                  >
                    {session.type === "live" ? "LiveKit WebRTC Classroom" : "In-Person Studio"}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    Instructor: <strong className="text-stone-800">{session.instructor}</strong>
                  </span>
                  {pendingStudents > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                      {pendingStudents} QR Verifications Pending
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-2xl font-bold text-stone-900">
                  {session.title}
                </h3>

                <div className="flex flex-wrap gap-3 text-xs text-stone-600">
                  <span className="flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1 rounded-lg border border-stone-200">
                    <Calendar size={13} className="text-[#8C4B31]" /> {session.date} • {session.time}
                  </span>
                  <span className="flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1 rounded-lg border border-stone-200">
                    {session.type === "live" ? <Video size={13} className="text-[#1E3B2E]" /> : <MapPin size={13} className="text-[#8C4B31]" />}
                    {session.location}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
                <div className="text-right">
                  <span className="font-serif text-2xl font-bold text-[#8C4B31]">
                    {session.price} ETB
                  </span>
                  <p className="text-xs text-stone-500 mt-0.5">
                    <strong>{verifiedStudents} Verified</strong> ({sessionRegistrations.length} Total Registered / {session.capacity} Max)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* View Roster & QR Verification Button */}
                  <button
                    onClick={() => setSelectedRosterSession(session)}
                    className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users size={14} />
                    <span>Enrolled Students ({sessionRegistrations.length})</span>
                  </button>

                  {/* Teach Live Broadcast Button (For live sessions) */}
                  {session.type === "live" && (
                    <Link
                      href={`/dashboard/sessions/${session.id}`}
                      className="px-4 py-2 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Radio size={14} className="text-red-400 animate-pulse" />
                      <span>Teach Live Class (Broadcaster)</span>
                    </Link>
                  )}

                  <button
                    onClick={() => handleDelete(session.id)}
                    className="p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete workshop"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center text-stone-500">
            <Users size={36} className="mx-auto text-stone-400 mb-2" />
            <h4 className="font-serif text-lg font-bold text-stone-800">No Workshops Scheduled Yet</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto mb-4">
              Schedule your first workshop or virtual LiveKit classroom session to accept student enrollments.
            </p>
          </div>
        )}
      </div>

      {/* STUDENT ROSTER & PAYMENT QR VERIFICATION MODAL */}
      {selectedRosterSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedRosterSession(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-800 cursor-pointer"
            >
              <X size={20} />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">
              Student Roster & Verification
            </span>
            <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1">
              {selectedRosterSession.title}
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Verify uploaded CBE / Telebirr payment slips and QR codes before granting classroom or studio admission.
            </p>

            {/* Students List */}
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1 text-xs">
              {currentRosterStudents.map((student) => (
                <div 
                  key={student.id}
                  className="p-4 rounded-2xl bg-[#FAF7F2] border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{student.studentName}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        student.status === "approved" 
                          ? "bg-emerald-100 text-emerald-800"
                          : student.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {student.status === "approved" ? "Verified & Access Granted" : student.status === "rejected" ? "Rejected" : "Pending QR Check"}
                      </span>
                    </div>
                    <p className="text-stone-500 text-xs font-mono">
                      Phone: <strong>{student.studentPhone}</strong> • Registered: {student.timestamp}
                    </p>
                    <p className="text-[#8C4B31] font-serif font-bold text-xs">
                      Tuition Plan: {student.priceEtb} ETB
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* View Uploaded QR Code / Receipt Slip */}
                    {student.receiptUrl ? (
                      <button
                        onClick={() => setInspectingQrUrl(student.receiptUrl || null)}
                        className="px-3 py-2 rounded-xl bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Inspect uploaded payment slip/QR code"
                      >
                        <Eye size={13} />
                        <span>Inspect QR Slip</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone-400 italic">No QR uploaded</span>
                    )}

                    {/* Action: Approve */}
                    {student.status !== "approved" && (
                      <button
                        onClick={() => handleApproveRegistration(student.id)}
                        className="px-3.5 py-2 rounded-xl bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 size={14} />
                        <span>Approve & Grant Access</span>
                      </button>
                    )}

                    {/* Action: Reject */}
                    {student.status !== "rejected" && (
                      <button
                        onClick={() => handleRejectRegistration(student.id)}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer"
                        title="Reject enrollment"
                      >
                        <XCircle size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {currentRosterStudents.length === 0 && (
                <div className="p-8 text-center text-stone-400">
                  <p className="text-xs">No students have enrolled for this session yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR CODE INSPECTION LIGHTBOX MODAL */}
      {inspectingQrUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-lg w-full text-white relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setInspectingQrUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white bg-stone-800 cursor-pointer"
            >
              <X size={18} />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E0B382] block mb-2">
              Payment Verification Lightbox
            </span>
            <h4 className="font-serif text-lg font-bold mb-4">
              Student Uploaded Payment QR Code / Deposit Slip
            </h4>

            <div className="rounded-2xl overflow-hidden border border-stone-700 bg-black flex items-center justify-center p-2 mb-4 max-h-96">
              <img 
                src={inspectingQrUrl} 
                alt="Student Payment QR" 
                className="max-h-80 w-auto object-contain rounded-xl"
              />
            </div>

            <p className="text-xs text-stone-400 text-center">
              Verify CBE Birr or Telebirr merchant transaction ID against official bank records before approving admission.
            </p>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative my-8">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-800 cursor-pointer"
            >
              <X size={20} />
            </button>

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">
              Academy Curriculum
            </span>
            <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1 mb-4">
              Schedule New Workshop
            </h3>

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Workshop Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterclass in Heavy Kraft Handle Attachment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Session Type</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const t = e.target.value as "in_person" | "live";
                      setType(t);
                      if (t === "live") setLocation("LiveKit Interactive Video Room");
                      else setLocation("Addis Ababa Studio (Bole Subcity)");
                    }}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  >
                    <option value="live">LiveKit Virtual Online</option>
                    <option value="in_person">In-Person Studio (Addis)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Lead Instructor (Admin)</label>
                  <input
                    type="text"
                    required
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Calendar Date</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nov 12, 2026"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Session Hours</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2:00 PM - 5:00 PM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Tuition Fee (ETB)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Max Seat Capacity</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {type === "in_person" && (
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Physical Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Addis Ababa Studio (Bole Subcity)"
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-stone-700 block mb-1">Curriculum Highlights</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Techniques covered, paper grades, practical takeaways..."
                  className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold tracking-wider uppercase transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Publishing Workshop..." : "Publish to Academy Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
