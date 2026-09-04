"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Video, 
  Calendar, 
  Plus, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  X,
  PlayCircle
} from "lucide-react";

interface AdminClassSession {
  id: string;
  type: "in_person" | "live";
  title: string;
  instructor: string;
  date: string;
  time: string;
  location: string;
  price: number;
  capacity: number;
  enrolled: number;
  livekitRoom?: string;
}

const INITIAL_SESSIONS: AdminClassSession[] = [
  {
    id: "1",
    type: "in_person",
    title: "Beginner Paper Bag Workshop & Structural Folds",
    instructor: "Master Craftsman Abebe Kebede",
    date: "Oct 15, 2026",
    time: "10:00 AM - 2:00 PM",
    location: "Addis Ababa Studio (Bole Subcity)",
    price: 500,
    capacity: 12,
    enrolled: 8,
  },
  {
    id: "2",
    type: "live",
    title: "Virtual: Advanced Origami Folds & Gusset Dynamics",
    instructor: "Sara Haile (Design Lead)",
    date: "Oct 18, 2026",
    time: "3:00 PM - 5:00 PM",
    location: "LiveKit Online Classroom",
    price: 300,
    capacity: 40,
    enrolled: 26,
    livekitRoom: "session_2",
  },
  {
    id: "3",
    type: "in_person",
    title: "Corporate Gift Bag & Screen Printing Masterclass",
    instructor: "Abebe Kebede & Technical Team",
    date: "Oct 22, 2026",
    time: "9:00 AM - 4:00 PM",
    location: "Addis Ababa Studio (Bole Subcity)",
    price: 1000,
    capacity: 10,
    enrolled: 7,
  },
];

export default function AdminClassesPage() {
  const [sessions, setSessions] = useState<AdminClassSession[]>(INITIAL_SESSIONS);
  const [modalOpen, setModalOpen] = useState(false);
  
  // New session form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"in_person" | "live">("live");
  const [instructor, setInstructor] = useState("Sara Haile");
  const [date, setDate] = useState("Nov 05, 2026");
  const [time, setTime] = useState("2:00 PM - 4:00 PM");
  const [price, setPrice] = useState(350);
  const [capacity, setCapacity] = useState(30);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: AdminClassSession = {
      id: String(sessions.length + 1),
      title,
      type,
      instructor,
      date,
      time,
      location: type === "live" ? "LiveKit Online Classroom" : "Addis Ababa Studio",
      price: Number(price),
      capacity: Number(capacity),
      enrolled: 0,
      livekitRoom: type === "live" ? `session_${sessions.length + 1}` : undefined
    };
    setSessions([...sessions, newSession]);
    setModalOpen(false);
    setTitle("");
  };

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8C4B31]">
            Arenguade Craft Academy
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
            Workshops & LiveKit Classrooms
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Schedule hands-on studio sessions in Addis Ababa and broadcast live streaming WebRTC classes.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-5 py-3 rounded-full transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          <span>Schedule New Workshop</span>
        </button>
      </div>

      {/* Class Sessions List */}
      <div className="space-y-6">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="space-y-2">
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

              <div className="flex flex-wrap gap-4 text-xs text-stone-600">
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
                  {session.enrolled} / {session.capacity} Students Registered
                </p>
              </div>

              <div className="flex items-center gap-2">
                {session.type === "live" && (
                  <Link
                    href={`/dashboard/sessions/${session.id}`}
                    className="px-4 py-2 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <PlayCircle size={14} />
                    <span>Launch LiveKit Room</span>
                  </Link>
                )}
                <button
                  onClick={() => alert(`Enrolled roster for ${session.title}: 8 active students with confirmed receipts.`)}
                  className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
                >
                  View Student Roster
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-800"
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
                  placeholder="e.g. Masterclass in Handle Tensile Strength"
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
                    onChange={(e) => setType(e.target.value as any)}
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
                  <label className="font-bold text-stone-700 block mb-1">Date</label>
                  <input
                    type="text"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Time</label>
                  <input
                    type="text"
                    required
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
                  <label className="font-bold text-stone-700 block mb-1">Max Capacity</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full p-3 bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold tracking-wider uppercase transition-all shadow-md"
                >
                  Publish Workshop to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
