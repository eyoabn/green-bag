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
  Sparkles
} from "lucide-react";
import { DataStore, StoredClassSession } from "@/utils/dataStore";

export default function AdminClassesPage() {
  const [sessions, setSessions] = useState<StoredClassSession[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  
  // New session form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"in_person" | "live">("live");
  const [instructor, setInstructor] = useState("Sara Haile (Design Lead)");
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
        description: description || `Professional craft masterclass led by ${instructor}. Includes hands-on instruction and certificates.`,
        materialsIncluded: type === "live" 
          ? ["Live interactive Q&A with instructor", "Downloadable PDF blueprints", "Permanent session replay recording", "Digital Certificate"]
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

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Arenguade Craft Academy Command
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            Workshops & LiveKit Classrooms
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Schedule studio classes in Addis Ababa and broadcast live streaming WebRTC classes to students worldwide.
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
        {sessions.map((session) => (
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
                  Instructor: {session.instructor}
                </span>
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
                  {session.enrolled} / {session.capacity} Students Enrolled
                </p>
              </div>

              <div className="flex items-center gap-2">
                {session.type === "live" && (
                  <Link
                    href={`/dashboard/sessions/${session.id}`}
                    className="px-4 py-2 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <PlayCircle size={14} />
                    <span>Launch Live Broadcast</span>
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
        ))}

        {sessions.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center text-stone-500">
            <p className="text-sm">No workshops scheduled yet.</p>
          </div>
        )}
      </div>

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
                  <label className="font-bold text-stone-700 block mb-1">Lead Instructor</label>
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
