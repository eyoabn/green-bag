"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Video, 
  ArrowRight, 
  Upload, 
  CheckCircle2, 
  Clock, 
  Users, 
  ShieldCheck, 
  X,
  Sparkles,
  Copy,
  Check
} from "lucide-react";

interface Session {
  id: string;
  type: "in_person" | "live";
  title: string;
  date: string;
  time: string;
  location: string;
  price: number;
  capacity: number;
  enrolled: number;
  instructor: string;
  description: string;
  materialsIncluded: string[];
}

const SESSIONS: Session[] = [
  { 
    id: "1", 
    type: "in_person", 
    title: "Beginner Paper Bag Workshop & Structural Folds", 
    date: "Oct 15, 2026", 
    time: "10:00 AM - 2:00 PM", 
    location: "Addis Ababa Studio (Bole Subcity)", 
    price: 500, 
    capacity: 12, 
    enrolled: 8,
    instructor: "Master Craftsman Abebe Kebede",
    description: "Learn paper selection, precise bone-folder creasing, gusset calculations, and manual handle installation with heavy kraft paper.",
    materialsIncluded: ["100% Ethiopian Virgin Kraft sheets", "Adhesives & bone folders", "Twisted cords & eyelets", "Take-home portfolio"]
  },
  { 
    id: "2", 
    type: "live", 
    title: "Virtual: Advanced Origami Folds & Gusset Dynamics", 
    date: "Oct 18, 2026", 
    time: "3:00 PM - 5:00 PM", 
    location: "LiveKit Interactive Video Room", 
    price: 300, 
    capacity: 40, 
    enrolled: 26,
    instructor: "Sara Haile (Design Lead)",
    description: "Multi-angle HD camera stream demonstrating complex hexagonal bases, luxury ribbon closures, and high-tensile paper packaging.",
    materialsIncluded: ["Live interactive Q&A with instructor", "Downloadable PDF blueprints", "Permanent session replay recording", "Digital Certificate"]
  },
  { 
    id: "3", 
    type: "in_person", 
    title: "Commercial B2B Gift Bag & Screen Printing Masterclass", 
    date: "Oct 22, 2026", 
    time: "9:00 AM - 4:00 PM", 
    location: "Addis Ababa Studio (Bole Subcity)", 
    price: 1000, 
    capacity: 10, 
    enrolled: 7,
    instructor: "Abebe Kebede & Technical Team",
    description: "Full-day comprehensive training on operating manual die cutters, screen printing with eco inks, and bulk packaging economics.",
    materialsIncluded: ["Full-day studio equipment access", "Screen print inks & squeegees", "Lunch & refreshments", "Supplier contacts directory"]
  },
  { 
    id: "4", 
    type: "live", 
    title: "Virtual: Sustainable Packaging Economics & Pricing", 
    date: "Oct 25, 2026", 
    time: "4:00 PM - 6:00 PM", 
    location: "LiveKit Interactive Video Room", 
    price: 350, 
    capacity: 50, 
    enrolled: 18,
    instructor: "Yared Tadesse (Operations Director)",
    description: "Financial modeling for aspiring packaging entrepreneurs: machinery capex, raw material margins, and corporate sales strategy.",
    materialsIncluded: ["Excel Financial Model template", "LiveKit interactive breakout rooms", "B2B client contract templates"]
  },
];

import { DataStore } from "@/utils/dataStore";

export default function SchedulePage() {
  const [sessionsList, setSessionsList] = useState<Session[]>(SESSIONS);
  const [filterType, setFilterType] = useState<"all" | "in_person" | "live">("all");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeBanks, setActiveBanks] = useState(DataStore.getActiveBanks());

  useEffect(() => {
    setActiveBanks(DataStore.getActiveBanks());
  }, []);

  useEffect(() => {
    const loadSessions = () => {
      const stored = DataStore.getClasses();
      if (stored && stored.length > 0) {
        setSessionsList(stored.map((s) => ({
          id: s.id,
          type: s.type,
          title: s.title,
          date: s.date,
          time: s.time,
          location: s.location,
          price: s.price,
          capacity: s.capacity,
          enrolled: s.enrolled || 0,
          instructor: s.instructor,
          description: s.description || "",
          materialsIncluded: s.materialsIncluded || ["Workshop handbook & certificate"]
        })));
      }
    };
    loadSessions();
    window.addEventListener("arenguade_datastore_change", loadSessions);
    return () => window.removeEventListener("arenguade_datastore_change", loadSessions);
  }, []);

  const filteredSessions = sessionsList.filter((s) => {
    if (filterType === "all") return true;
    return s.type === filterType;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompleteBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptUploaded) {
      alert("Please upload your transaction screenshot to confirm your registration.");
      return;
    }
    if (selectedSession) {
      DataStore.addRegistration({
        sessionId: selectedSession.id,
        sessionTitle: selectedSession.title,
        sessionType: selectedSession.type,
        sessionDate: selectedSession.date,
        sessionTime: selectedSession.time,
        location: selectedSession.location,
        studentName: bookingName || "Student",
        studentPhone: bookingPhone || "0911000000",
        priceEtb: selectedSession.price,
      });
    }
    setBookingSuccess(true);
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20 bg-[#F9F6F0]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 w-full">
        
        {/* Header Section */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold tracking-widest text-[#8C4B31] uppercase block mb-2">
            Arenguade Craft Academy
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight mb-4">
            Workshop Calendar & Registration
          </h1>
          <p className="text-stone-600 text-lg leading-relaxed">
            Reserve your seat in our Addis Ababa hands-on studio or join our interactive global masterclasses streaming live via LiveKit WebRTC.
          </p>
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { id: "all", label: "All Workshops" },
            { id: "in_person", label: "In-Person Studio (Addis Ababa)" },
            { id: "live", label: "LiveKit Virtual Online" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                filterType === tab.id
                  ? "bg-[#1E3B2E] text-white shadow-sm"
                  : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sessions & Process Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sessions List */}
          <div className="lg:col-span-8 space-y-6">
            {filteredSessions.map((session) => (
              <div 
                key={session.id} 
                className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                        session.type === 'live' 
                          ? 'bg-[#1E3B2E]/10 text-[#1E3B2E] border border-[#1E3B2E]/20' 
                          : 'bg-[#8C4B31]/10 text-[#8C4B31] border border-[#8C4B31]/20'
                      }`}>
                        {session.type === 'live' ? 'LiveKit Online Classroom' : 'In-Person Studio'}
                      </span>
                      <span className="text-xs text-stone-500 font-medium">Instructor: {session.instructor}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-serif text-2xl font-bold text-[#8C4B31]">{session.price} ETB</span>
                    </div>
                  </div>

                  <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">
                    {session.title}
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed mb-4">
                    {session.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs text-stone-600 font-medium mb-4">
                    <span className="flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-stone-200">
                      <CalendarIcon size={14} className="text-[#8C4B31]" /> {session.date} • {session.time}
                    </span>
                    <span className="flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-stone-200">
                      {session.type === 'in_person' ? <MapPin size={14} className="text-[#1E3B2E]" /> : <Video size={14} className="text-[#1E3B2E]" />} 
                      {session.location}
                    </span>
                  </div>

                  {/* Materials list */}
                  <div className="flex flex-wrap gap-1.5">
                    {session.materialsIncluded.map((mat, idx) => (
                      <span key={idx} className="text-[10px] bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md">
                        ✓ {mat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-stone-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#1E3B2E] h-full"
                        style={{ width: `${(session.enrolled / session.capacity) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone-500">
                      {session.capacity - session.enrolled} seats remaining
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedSession(session);
                      setBookingSuccess(false);
                      setReceiptUploaded(false);
                    }}
                    className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-6 py-3 rounded-full transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <span>Register Seat</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Sidebar: Step-by-Step Info & Certification */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm sticky top-28">
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">How Registration Works</h3>
              <p className="text-xs text-stone-500 mb-6">4 Simple steps to secure your workshop certification.</p>

              <ol className="relative border-l border-stone-200 ml-3 space-y-6">
                <li className="pl-6 relative">
                  <div className="absolute w-5 h-5 bg-[#1E3B2E] rounded-full -left-[11px] top-0 text-white text-[10px] flex items-center justify-center font-bold">1</div>
                  <h4 className="text-xs font-bold text-stone-900">Select Your Workshop</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Choose an in-person studio seat or LiveKit virtual broadcast.</p>
                </li>
                <li className="pl-6 relative">
                  <div className="absolute w-5 h-5 bg-[#1E3B2E] rounded-full -left-[11px] top-0 text-white text-[10px] flex items-center justify-center font-bold">2</div>
                  <h4 className="text-xs font-bold text-stone-900">Transfer via CBE or Telebirr</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Send tuition to CBE 1000123456789 or Telebirr 0911234567.</p>
                </li>
                <li className="pl-6 relative">
                  <div className="absolute w-5 h-5 bg-[#1E3B2E] rounded-full -left-[11px] top-0 text-white text-[10px] flex items-center justify-center font-bold">3</div>
                  <h4 className="text-xs font-bold text-stone-900">Upload Transaction Screenshot</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Upload receipt image to instantly reserve your seat.</p>
                </li>
                <li className="pl-6 relative">
                  <div className="absolute w-5 h-5 bg-stone-300 rounded-full -left-[11px] top-0 text-stone-700 text-[10px] flex items-center justify-center font-bold">4</div>
                  <h4 className="text-xs font-bold text-stone-900">Instant Access & Admission</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Get physical admission pass or one-click LiveKit streaming link.</p>
                </li>
              </ol>

              <div className="mt-8 pt-6 border-t border-stone-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">Official Vocational Certificate</p>
                    <p className="text-[11px] text-stone-500">Issued upon completion by Arenguade Guild.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Booking Checkout Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-stone-200 shadow-2xl relative animate-in fade-in zoom-in-95">
            
            <button
              onClick={() => setSelectedSession(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100"
            >
              <X size={20} />
            </button>

            {bookingSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">Registration Confirmed!</h3>
                <p className="text-stone-600 text-xs leading-relaxed max-w-sm mx-auto mb-6">
                  You are registered for <span className="font-semibold text-stone-900">{selectedSession.title}</span>. Payment is being verified.
                </p>

                {selectedSession.type === "live" ? (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 mb-6 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Video size={16} className="text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-900">LiveKit Virtual Room Reserved</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Your session token has been generated. You can join the interactive stream from your dashboard when class starts.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 mb-6 text-left text-xs">
                    <p className="font-bold text-stone-900">Studio Location:</p>
                    <p className="text-stone-600">Bole Subcity, Woreda 03, Industrial Eco Park, Addis Ababa</p>
                    <p className="text-stone-500 mt-1">Please arrive 15 minutes early on {selectedSession.date}.</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Link
                    href="/dashboard"
                    className="flex-1 bg-[#1E3B2E] text-white text-xs font-bold py-3 rounded-full hover:bg-[#8C4B31] transition-colors"
                  >
                    View My Registrations
                  </Link>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="px-5 py-3 rounded-full bg-stone-100 text-stone-700 text-xs font-bold hover:bg-stone-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCompleteBooking}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C4B31]">
                  Register for Class
                </span>
                <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1 mb-2">
                  {selectedSession.title}
                </h3>
                <p className="text-xs text-stone-500 mb-6">
                  {selectedSession.date} • {selectedSession.time} • Fee: <strong className="text-[#8C4B31] font-serif text-sm">{selectedSession.price} ETB</strong>
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                      Student Full Name
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Almaz Tadesse" 
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      className="w-full p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                      Phone Number (for SMS confirmation)
                    </label>
                    <input 
                      type="tel" 
                      required
                      placeholder="0911234567" 
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      className="w-full p-3 text-xs bg-[#FAF7F2] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8C4B31]/30"
                    />
                  </div>

                  {/* Bank Details */}
                  <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 space-y-2">
                    <span className="text-[10px] font-bold text-stone-500 uppercase block">
                      Transfer {selectedSession.price} ETB to Official Plant Settlement:
                    </span>
                    <div className="space-y-2">
                      {activeBanks.map((bank) => (
                        <div key={bank.id} className="flex items-center justify-between text-xs py-1 border-b border-stone-200/60 last:border-0">
                          <div>
                            <span className="font-semibold text-stone-800">{bank.name}</span>
                            <p className="font-mono font-bold text-stone-900">{bank.accountNumber}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(bank.accountNumber)}
                            className="p-1.5 rounded-lg bg-white border border-stone-300 text-[11px] font-bold text-stone-700 hover:bg-stone-100 flex items-center gap-1 cursor-pointer"
                          >
                            <Copy size={11} />
                            <span>Copy</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Receipt upload */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                      Upload Bank Screenshot
                    </label>
                    <label className="border-2 border-dashed border-stone-300 hover:border-[#8C4B31] bg-[#FAF7F2] p-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={() => setReceiptUploaded(true)}
                      />
                      <Upload size={18} className="text-[#8C4B31]" />
                      <span className="text-xs font-medium text-stone-700">
                        {receiptUploaded ? "✓ Receipt Attached (Click to change)" : "Click to attach payment receipt"}
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md"
                >
                  Confirm Registration ({selectedSession.price} ETB)
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
