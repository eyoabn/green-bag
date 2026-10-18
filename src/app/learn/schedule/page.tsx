"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Check,
  AlertCircle
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { uploadFileSafely } from "@/utils/fileUpload";

interface ClassSessionItem {
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
  enrolledCount: number;
  spotsLeft: number;
  isFull: boolean;
  teacher?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  accountHolder: string;
}

export default function SchedulePage() {
  const router = useRouter();
  const [sessionsList, setSessionsList] = useState<ClassSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "in_person" | "live">("all");
  const [selectedSession, setSelectedSession] = useState<ClassSessionItem | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmedEnrollment, setConfirmedEnrollment] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [activeBanks, setActiveBanks] = useState<BankAccount[]>([
    {
      id: "cbe",
      name: "Commercial Bank of Ethiopia (CBE)",
      accountNumber: "1000123456789",
      accountHolder: "Ethiopia Arenguade Paper Product PLC",
    },
    {
      id: "telebirr",
      name: "Telebirr Merchant",
      accountNumber: "0911234567",
      accountHolder: "Arenguade Packaging Official",
    },
  ]);

  // Load User, Classes, and Banks
  useEffect(() => {
    async function loadInitialData() {
      const supabase = createClient();

      // 1. Check user
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
          const u = { ...user, ...profile };
          setCurrentUser(u);
          if (u.full_name) setBookingName(u.full_name);
          if (u.phone) setBookingPhone(u.phone);
        }
      } catch (err) {
        console.warn("Auth check error:", err);
      }

      // 2. Fetch Active Banks
      try {
        const { data: dbBanks } = await supabase
          .from("bank_accounts")
          .select("id, bank_name, account_number, account_name")
          .eq("is_active", true);

        if (dbBanks && dbBanks.length > 0) {
          setActiveBanks(dbBanks.map((b) => ({
            id: b.id,
            name: b.bank_name,
            accountNumber: b.account_number,
            accountHolder: b.account_name,
          })));
        }
      } catch (err) {
        console.warn("Bank fetch error:", err);
      }

      // 3. Fetch Classes from API
      try {
        setLoading(true);
        const res = await fetch("/api/classes?upcoming=true");
        const resData = await res.json();
        if (res.ok && resData.classes) {
          setSessionsList(resData.classes);
        }
      } catch (err) {
        console.error("Classes fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
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

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const formatScheduleDate = (startsAt: string) => {
    try {
      const d = new Date(startsAt);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return startsAt;
    }
  };

  const formatScheduleTime = (startsAt: string, endsAt: string) => {
    try {
      const s = new Date(startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const e = new Date(endsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      return `${s} - ${e}`;
    } catch {
      return "";
    }
  };

  const handleCompleteBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSession) return;

    if (!currentUser) {
      router.push(`/login?returnTo=/learn/schedule`);
      return;
    }

    if (selectedSession.price > 0 && !receiptFile) {
      setErrorMessage("Please upload your bank transaction receipt screenshot to complete registration.");
      return;
    }

    setIsSubmitting(true);
    try {
      let paymentProofPath = "";

      // 1. Upload receipt to storage bucket 'payment-proofs' if provided
      if (receiptFile) {
        const uploadResult = await uploadFileSafely(receiptFile, "payment-proofs");
        paymentProofPath = uploadResult.filePath;
      }

      // 2. Call atomic capacity enrollment API (POST /api/enrollments)
      const enrollRes = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          paymentProofPath,
        }),
      });

      const enrollText = await enrollRes.text();
      let enrollData: any = {};
      try {
        enrollData = JSON.parse(enrollText);
      } catch {
        throw new Error(enrollText || `Server responded with status ${enrollRes.status}`);
      }

      if (!enrollRes.ok) {
        throw new Error(enrollData.error || "Failed to register for workshop.");
      }

      setConfirmedEnrollment(enrollData.enrollment);
      setBookingSuccess(true);

      // Refresh list to update spotsLeft
      const refreshRes = await fetch("/api/classes?upcoming=true");
      const refreshData = await refreshRes.json();
      if (refreshRes.ok && refreshData.classes) {
        setSessionsList(refreshData.classes);
      }
    } catch (err: any) {
      console.error("Enrollment error:", err);
      setErrorMessage(err.message || "An unexpected error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
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
            {loading ? (
              <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
                <Sparkles size={28} className="animate-spin text-[#8C4B31] mx-auto mb-3" />
                <p className="text-sm font-semibold text-stone-700">Loading live workshop schedule from database...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center">
                <CalendarIcon size={32} className="text-stone-400 mx-auto mb-3" />
                <h3 className="font-serif text-xl font-bold text-stone-800">No sessions currently scheduled</h3>
                <p className="text-xs text-stone-500 mt-1">Please check back soon for our upcoming craft workshop batch.</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
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
                        <span className="text-xs text-stone-500 font-medium">
                          Instructor: {session.teacher?.full_name || "Guild Master Artisan"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-serif text-2xl font-bold text-[#8C4B31]">{session.price} ETB</span>
                      </div>
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">
                      {session.title}
                    </h3>
                    <p className="text-stone-600 text-sm leading-relaxed mb-4">
                      {session.description || "Hands-on vocational kraft paper folding, die-cut assembly, and sustainable packaging production masterclass."}
                    </p>

                    <div className="flex flex-wrap gap-4 text-xs text-stone-600 font-medium mb-4">
                      <span className="flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-stone-200">
                        <CalendarIcon size={14} className="text-[#8C4B31]" /> 
                        {formatScheduleDate(session.starts_at)} • {formatScheduleTime(session.starts_at, session.ends_at)}
                      </span>
                      <span className="flex items-center gap-1.5 bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-stone-200">
                        {session.type === 'in_person' ? <MapPin size={14} className="text-[#1E3B2E]" /> : <Video size={14} className="text-[#1E3B2E]" />} 
                        {session.location}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md">✓ Official Vocational Certificate</span>
                      <span className="text-[10px] bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md">✓ 100% Virgin Kraft Paper Materials Included</span>
                      {session.type === 'live' && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-semibold">✓ Permanent HD Session Replay</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${session.isFull ? "bg-red-500" : "bg-[#1E3B2E]"}`}
                          style={{ width: `${Math.min(100, (session.enrolledCount / session.capacity) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-stone-500">
                        {session.isFull ? "Session Full" : `${session.spotsLeft} seats remaining`}
                      </span>
                    </div>

                    <button
                      disabled={session.isFull}
                      onClick={() => {
                        setSelectedSession(session);
                        setBookingSuccess(false);
                        setReceiptFile(null);
                        setErrorMessage(null);
                      }}
                      className="bg-[#1E3B2E] hover:bg-[#8C4B31] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-3 rounded-full transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <span>{session.isFull ? "Fully Booked" : "Register Seat"}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
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
                  <h4 className="text-xs font-bold text-stone-900">Transfer Tuition</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Send tuition directly to CBE, Telebirr, or Awash Bank account.</p>
                </li>
                <li className="pl-6 relative">
                  <div className="absolute w-5 h-5 bg-[#1E3B2E] rounded-full -left-[11px] top-0 text-white text-[10px] flex items-center justify-center font-bold">3</div>
                  <h4 className="text-xs font-bold text-stone-900">Upload Transaction Screenshot</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Atomic capacity RPC locks your seat pending verification.</p>
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
                <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">Registration Submitted!</h3>
                <p className="text-stone-600 text-xs leading-relaxed max-w-sm mx-auto mb-6">
                  You have registered for <span className="font-semibold text-stone-900">{selectedSession.title}</span>. Your seat is reserved while plant management verifies your payment.
                </p>

                {selectedSession.type === "live" ? (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 mb-6 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Video size={16} className="text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-900">LiveKit Virtual Room Reserved</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Room: <code className="font-mono bg-emerald-100/80 px-1 py-0.5 rounded text-[10px]">{selectedSession.livekit_room_name || selectedSession.id}</code>. You will receive real-time updates and can enter the live session from your dashboard once payment is verified.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-stone-200 mb-6 text-left text-xs">
                    <p className="font-bold text-stone-900">Studio Location:</p>
                    <p className="text-stone-600">{selectedSession.location || "Bole Subcity, Woreda 03, Industrial Eco Park, Addis Ababa"}</p>
                    <p className="text-stone-500 mt-1">Please arrive 15 minutes before {formatScheduleTime(selectedSession.starts_at, selectedSession.ends_at)} on {formatScheduleDate(selectedSession.starts_at)}.</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Link
                    href="/dashboard?tab=classes"
                    className="flex-1 bg-[#1E3B2E] text-white text-xs font-bold py-3 rounded-full hover:bg-[#8C4B31] transition-colors text-center"
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
                <p className="text-xs text-stone-500 mb-4">
                  {formatScheduleDate(selectedSession.starts_at)} • {formatScheduleTime(selectedSession.starts_at, selectedSession.ends_at)} • Fee: <strong className="text-[#8C4B31] font-serif text-sm">{selectedSession.price} ETB</strong>
                </p>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4 flex items-center gap-2 text-red-700 text-xs">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {!currentUser ? (
                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 text-center mb-6">
                    <p className="text-xs text-stone-600 mb-3">Please sign in or create an account to register for workshops.</p>
                    <Link
                      href={`/login?returnTo=/learn/schedule`}
                      className="bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold px-6 py-2.5 rounded-full inline-block transition-colors"
                    >
                      Sign In to Continue
                    </Link>
                  </div>
                ) : (
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
                        Phone Number (for SMS & Verification)
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
                    {selectedSession.price > 0 && (
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
                                {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                <span>{copied ? "Copied" : "Copy"}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Receipt upload */}
                    {selectedSession.price > 0 && (
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                          Upload Transaction Screenshot / Receipt
                        </label>
                        <label className="border-2 border-dashed border-stone-300 hover:border-[#8C4B31] bg-[#FAF7F2] p-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors">
                          <input 
                            type="file" 
                            accept="image/*,application/pdf" 
                            className="hidden" 
                            onChange={handleReceiptUpload}
                          />
                          <Upload size={18} className="text-[#8C4B31]" />
                          <span className="text-xs font-medium text-stone-700">
                            {receiptFile ? `✓ ${receiptFile.name}` : "Click to attach payment receipt"}
                          </span>
                        </label>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || (selectedSession.price > 0 && !receiptFile)}
                      className="w-full py-3.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] disabled:opacity-50 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Sparkles size={16} className="animate-spin" />
                          <span>Reserving Seat...</span>
                        </>
                      ) : (
                        <span>Confirm Registration ({selectedSession.price} ETB)</span>
                      )}
                    </button>
                  </div>
                )}
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
