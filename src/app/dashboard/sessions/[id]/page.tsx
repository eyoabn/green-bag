"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  MessageSquare, 
  Users, 
  Download, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Share2,
  Hand,
  PhoneOff,
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  ExternalLink,
  MonitorUp,
  RefreshCw,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import { DataStore, StoredClass, StoredRegistration } from "@/utils/dataStore";

export default function LiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  // Session & Classroom State
  const [sessionClass, setSessionClass] = useState<StoredClass | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<StoredRegistration[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [currentStudentReg, setCurrentStudentReg] = useState<StoredRegistration | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Live Media State
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // UI Panels State
  const [activeTab, setActiveTab] = useState<"chat" | "roster">("chat");
  const [chatMessages, setChatMessages] = useState<Array<{ user: string; role: "admin" | "student" | "system"; text: string; time: string }>>([]);
  const [messageInput, setMessageInput] = useState("");
  const [inspectReceipt, setInspectReceipt] = useState<{ url: string; studentName: string; plan: string } | null>(null);

  // LiveKit Token State
  const [token, setToken] = useState("");
  const [isDemo, setIsDemo] = useState(true);

  // Load Session Data and Check Authentication / Payment QR Approval
  const loadClassroomData = () => {
    // 1. Check if user is logged in as Admin (Teacher Host)
    const adminAuth = typeof window !== "undefined" && (
      localStorage.getItem("arenguade_admin_authenticated") === "true" ||
      sessionStorage.getItem("arenguade_admin_authenticated") === "true" ||
      (() => {
        try {
          const userStr = localStorage.getItem("arenguade_user");
          return userStr ? JSON.parse(userStr).role === "admin" : false;
        } catch {
          return false;
        }
      })()
    );
    setIsAdmin(adminAuth);

    // 2. Fetch class info
    const allClasses = DataStore.getClasses();
    const foundClass = allClasses.find((c) => c.id === sessionId) || null;
    setSessionClass(foundClass);

    // 3. Fetch real registrations for this session
    const regs = DataStore.getRegistrationsBySessionId(sessionId);
    setEnrolledStudents(regs);

    // 4. Evaluate access permission
    if (adminAuth) {
      // Admin is the teacher: automatically granted host broadcaster access
      setHasAccess(true);
    } else {
      // Student: check if there is an approved registration
      // Look for any registration for this session
      const approvedReg = regs.find((r) => r.status === "approved");
      const pendingReg = regs.find((r) => r.status === "pending_verification");

      if (approvedReg) {
        setHasAccess(true);
        setCurrentStudentReg(approvedReg);
      } else if (pendingReg) {
        setHasAccess(false);
        setCurrentStudentReg(pendingReg);
      } else {
        setHasAccess(false);
        setCurrentStudentReg(null);
      }
    }

    setIsLoadingAuth(false);
  };

  useEffect(() => {
    loadClassroomData();
    window.addEventListener("arenguade_datastore_change", loadClassroomData);
    return () => window.removeEventListener("arenguade_datastore_change", loadClassroomData);
  }, [sessionId]);

  // Initialize Welcome Message
  useEffect(() => {
    if (sessionClass) {
      setChatMessages([
        {
          user: "System Guild",
          role: "system",
          text: `Welcome to "${sessionClass.title}". Encrypted WebRTC broadcast is ready. ${isAdmin ? "You are hosting as Lead Instructor." : "You are connected as an enrolled student."}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  }, [sessionClass?.id, isAdmin]);

  // LiveKit Token Fetch
  useEffect(() => {
    const room = `session_${sessionId}`;
    const username = isAdmin ? "Admin (Instructor)" : currentStudentReg?.studentName || "Student";
    (async () => {
      try {
        const resp = await fetch(`/api/livekit/token?room=${room}&username=${encodeURIComponent(username)}`);
        const data = await resp.json();
        setToken(data.token || "demo_token");
        setIsDemo(data.isDemo !== false);
      } catch (e) {
        console.warn("Using demo session mode", e);
        setToken("demo_token");
        setIsDemo(true);
      }
    })();
  }, [sessionId, isAdmin, currentStudentReg]);

  // Webcam & Audio Stream Handling
  useEffect(() => {
    if (!hasAccess) return;

    if (videoOn) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.log("Webcam preview access info:", err.message);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoOn, hasAccess]);

  // Screen Sharing
  const handleToggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
        setScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setScreenSharing(false);
          if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
          }
        };
      } catch (e) {
        console.warn("Screen share cancelled or not permitted", e);
      }
    } else {
      setScreenSharing(false);
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    }
  };

  // Chat message sending
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const senderName = isAdmin 
      ? "Admin (Lead Instructor)" 
      : currentStudentReg?.studentName || "Student";

    const newMsg = {
      user: senderName,
      role: isAdmin ? ("admin" as const) : ("student" as const),
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setMessageInput("");
  };

  // Admin QR Approval in Classroom
  const handleApproveStudent = (regId: string) => {
    DataStore.updateRegistrationStatus(regId, "approved");
    loadClassroomData();
  };

  const handleRejectStudent = (regId: string) => {
    DataStore.updateRegistrationStatus(regId, "rejected");
    loadClassroomData();
  };

  // Download real class dieline blueprint
  const handleDownloadBlueprint = () => {
    const blueprintData = `ARENGUADE CRAFT ACADEMY - OFFICIAL WORKSHOP BLUEPRINT
Session ID: ${sessionId}
Title: ${sessionClass?.title || "Masterclass"}
Date: ${sessionClass?.date || "Current Season"}
Instructor: Arenguade Master Craftsman (Admin)
Materials: 220-250 GSM Ethiopian Virgin Kraft, Bone Folder, Organic Adhesive

FOLD SPECIFICATIONS:
1. Parallel Crease Line: Score at 45mm from bottom fold
2. Gusset Depth Ratio: 1:2.4 expansion angle
3. Structural Hem: 25mm double-ply reinforced top turn-in
4. Handle Anchoring: 2x punched eyelets with cotton cord knotting

Certified by Arenguade Paper Product, Addis Ababa.`;

    const blob = new Blob([blueprintData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Arenguade_Session_${sessionId}_Blueprint.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ----------------------------------------------------
  // RENDER: LOADING STATE
  // ----------------------------------------------------
  if (isLoadingAuth) {
    return (
      <div className="h-screen w-full bg-stone-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-[#E0B382]" size={32} />
          <p className="text-sm text-stone-400 font-mono">Verifying credentials and admission status...</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: ACCESS LOCKED SCREEN (When QR Code is unverified)
  // ----------------------------------------------------
  if (!hasAccess) {
    return (
      <div className="min-h-screen w-full bg-stone-950 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between z-10">
          <Link 
            href="/dashboard?tab=classes"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-stone-500 font-mono">
            <span>Session ID: #{sessionId}</span>
          </div>
        </div>

        {/* Center Lock Card */}
        <div className="max-w-xl mx-auto w-full bg-stone-900/90 border border-stone-800 rounded-3xl p-8 sm:p-10 text-center shadow-2xl backdrop-blur-xl z-10">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock size={36} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Clock size={13} className="animate-spin" />
            <span>Payment QR Verification Required</span>
          </div>

          <h2 className="font-serif text-3xl font-bold text-white mb-3">
            Classroom Admission Locked
          </h2>

          <p className="text-stone-300 text-sm leading-relaxed mb-6">
            The Live Masterclass is taught directly by the <strong className="text-[#E0B382]">Admin Lead Instructor</strong>. To ensure class integrity, all student payment QR codes and deposit receipts must be inspected and approved by the Admin before entry is granted.
          </p>

          {/* Registration Details Card */}
          {currentStudentReg ? (
            <div className="bg-stone-950/80 rounded-2xl p-5 border border-stone-800 text-left text-xs mb-6 space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                <span className="text-stone-400">Student Name:</span>
                <span className="font-bold text-white">{currentStudentReg.studentName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                <span className="text-stone-400">Enrolled Workshop:</span>
                <span className="font-bold text-[#E0B382]">{currentStudentReg.sessionTitle}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                <span className="text-stone-400">Chosen Plan Fee:</span>
                <span className="font-bold text-white font-mono">{currentStudentReg.priceEtb} ETB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Current Status:</span>
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px] bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  <Clock size={10} />
                  <span>Pending Admin Verification</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-stone-950/80 rounded-2xl p-5 border border-stone-800 text-left text-xs mb-6 space-y-2">
              <p className="text-stone-400">
                You do not have an active enrollment record for Session #{sessionId}.
              </p>
              <Link 
                href="/learn/schedule"
                className="text-[#E0B382] font-bold inline-flex items-center gap-1 hover:underline"
              >
                <span>Register for this class on the calendar</span>
                <ExternalLink size={12} />
              </Link>
            </div>
          )}

          {/* Refresh and Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                loadClassroomData();
              }}
              className="flex-1 py-3 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Check Verification Status</span>
            </button>
            <Link
              href="/dashboard?tab=classes"
              className="py-3 px-6 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors text-center"
            >
              Return to Dashboard
            </Link>
          </div>

          {/* Quick Admin Access Hint */}
          <div className="mt-6 pt-5 border-t border-stone-800/80 text-[11px] text-stone-500 flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Are you the Instructor? <Link href="/admin/login" className="text-[#E0B382] font-bold hover:underline">Log in as Admin</Link> to broadcast.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-stone-600 z-10">
          Arenguade Craft Academy • LiveKit WebRTC Multi-Track Studio
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: LIVE CLASSROOM (Broadcaster / Approved Student)
  // ----------------------------------------------------
  return (
    <div className="h-screen w-full bg-stone-950 text-white flex flex-col overflow-hidden select-none">
      
      {/* Top Studio Header */}
      <header className="h-16 px-6 bg-stone-900/95 border-b border-stone-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link 
            href={isAdmin ? "/admin/classes" : "/dashboard?tab=classes"} 
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
            title="Return"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                {isAdmin ? "Teacher Broadcaster (Admin)" : "Live Masterclass"}
              </span>
              <span className="text-stone-600">•</span>
              <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-xs sm:max-w-md">
                {sessionClass?.title || `Session #${sessionId}`}
              </h1>
            </div>
            <span className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <span>Teacher: Admin Lead Craftsman</span>
              <span>•</span>
              <span className="text-[#E0B382] font-medium">{sessionClass?.date || "Today"}</span>
              <span>•</span>
              <span className="font-mono text-stone-500">LiveKit WebRTC</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Enrolled Students Badge / Button */}
          <button
            onClick={() => setActiveTab(activeTab === "roster" ? "chat" : "roster")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "roster"
                ? "bg-[#8C4B31] text-white shadow-md"
                : "bg-stone-800 text-stone-300 hover:bg-stone-700"
            }`}
          >
            <Users size={14} />
            <span>{enrolledStudents.length} Students</span>
            {enrolledStudents.some((s) => s.status === "pending_verification") && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          {/* Download Blueprint Button */}
          <button
            onClick={handleDownloadBlueprint}
            className="px-3.5 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300 transition-colors flex items-center gap-1.5"
            title="Download Vector Blueprint & Dieline Notes"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Blueprint</span>
          </button>

          {isAdmin && (
            <span className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-bold">
              <ShieldCheck size={13} />
              <span>Host Mode</span>
            </span>
          )}
        </div>
      </header>

      {/* Main Studio Body: Video Stage + Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Video Stage */}
        <div className="flex-1 flex flex-col p-4 relative bg-black">
          
          {/* Main Stage Video Player */}
          <div className="flex-1 rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 relative flex items-center justify-center">
            
            {/* Live Camera Feed */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted={isAdmin} // Mute instructor locally to prevent feedback echo
              className={`w-full h-full object-cover ${videoOn ? "block" : "hidden"}`}
            />

            {/* Offline / Placeholder Graphic if Video is Toggled Off */}
            {!videoOn && (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-[#1E2922] to-stone-950 flex items-center justify-center p-8 text-center">
                <div className="max-w-md">
                  <div className="w-20 h-20 rounded-full bg-[#1E3B2E] border-2 border-[#E0B382] flex items-center justify-center text-white mx-auto mb-4 shadow-xl">
                    <VideoOff size={32} className="text-[#E0B382]" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white mb-2">
                    Camera Feed Muted
                  </h3>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {isAdmin 
                      ? "Your camera is currently stopped. Click 'Turn on Camera' below to broadcast your craft demonstration."
                      : "The instructor's primary video feed is active on the audio channel."}
                  </p>
                </div>
              </div>
            )}

            {/* Broadcaster Info Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 z-10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-white">
                {isAdmin ? "You (Broadcaster / Admin)" : "Teacher: Admin Lead Craftsman"}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">1080p WebRTC</span>
            </div>

            {/* Student Self Preview (PiP) */}
            {!isAdmin && (
              <div className="absolute top-4 right-4 w-40 sm:w-48 aspect-video rounded-xl bg-stone-950 border border-stone-700 shadow-2xl overflow-hidden flex flex-col justify-between p-2.5 z-10">
                <div className="flex justify-between items-center text-[10px] text-stone-400">
                  <span className="font-bold text-white truncate max-w-[100px]">
                    {currentStudentReg?.studentName || "You"}
                  </span>
                  {videoOn ? <span className="text-emerald-400">Cam Active</span> : <span className="text-stone-500">Muted</span>}
                </div>

                <div className="flex items-center justify-center flex-1">
                  <div className="w-8 h-8 rounded-full bg-[#8C4B31] text-white flex items-center justify-center font-bold text-xs">
                    {(currentStudentReg?.studentName || "ST").slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] text-stone-500">
                  <span className="text-[#E0B382]">Plan: {currentStudentReg?.priceEtb} ETB</span>
                  <span className="text-emerald-400 font-semibold">Verified</span>
                </div>
              </div>
            )}

            {/* Screen Share Active Banner */}
            {screenSharing && (
              <div className="absolute top-4 left-4 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 z-10">
                <MonitorUp size={13} />
                <span>Screen Sharing Active</span>
              </div>
            )}

          </div>

          {/* Bottom Call Action Bar */}
          <div className="h-16 mt-3 flex items-center justify-center gap-3">
            {/* Mic Toggle */}
            <button
              onClick={() => setMicOn(!micOn)}
              className={`p-3.5 rounded-full transition-all ${
                micOn ? "bg-stone-800 hover:bg-stone-700 text-white" : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40"
              }`}
              title={micOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={() => setVideoOn(!videoOn)}
              className={`p-3.5 rounded-full transition-all ${
                videoOn ? "bg-stone-800 hover:bg-stone-700 text-white" : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40"
              }`}
              title={videoOn ? "Turn off Camera" : "Turn on Camera"}
            >
              {videoOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>

            {/* Admin Host: Screen Sharing */}
            {isAdmin && (
              <button
                onClick={handleToggleScreenShare}
                className={`p-3.5 rounded-full transition-all ${
                  screenSharing ? "bg-emerald-600 text-white" : "bg-stone-800 hover:bg-stone-700 text-stone-300"
                }`}
                title={screenSharing ? "Stop Screen Share" : "Share Dieline Screen / CAD"}
              >
                <MonitorUp size={18} />
              </button>
            )}

            {/* Student: Raise Hand */}
            {!isAdmin && (
              <button
                onClick={() => setHandRaised(!handRaised)}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  handRaised ? "bg-amber-500 text-stone-950" : "bg-stone-800 hover:bg-stone-700 text-stone-300"
                }`}
              >
                <Hand size={16} />
                <span>{handRaised ? "Hand Raised" : "Raise Hand"}</span>
              </button>
            )}

            {/* Leave / End Session */}
            <Link
              href={isAdmin ? "/admin/classes" : "/dashboard?tab=classes"}
              className="p-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
              title="Leave Classroom"
            >
              <PhoneOff size={18} />
            </Link>
          </div>

        </div>

        {/* Right Sidebar: Chat OR Student Attendance Roster */}
        <div className="w-80 sm:w-96 bg-stone-900 border-l border-stone-800 flex flex-col">
          
          {/* Sidebar Header Tabs */}
          <div className="p-3 border-b border-stone-800 flex items-center justify-between bg-stone-900/80">
            <div className="flex gap-1 bg-stone-800/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === "chat" ? "bg-stone-700 text-white shadow-sm" : "text-stone-400 hover:text-white"
                }`}
              >
                <MessageSquare size={13} />
                <span>Class Chat</span>
              </button>
              <button
                onClick={() => setActiveTab("roster")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === "roster" ? "bg-stone-700 text-white shadow-sm" : "text-stone-400 hover:text-white"
                }`}
              >
                <Users size={13} />
                <span>Students ({enrolledStudents.length})</span>
              </button>
            </div>

            <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>

          {/* TAB 1: REAL-TIME CHAT */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages list */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
                    <MessageSquare size={28} className="mb-2 opacity-40" />
                    <p>No messages yet. Send a question or say hello to the instructor.</p>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-[11px] ${
                          msg.role === "admin" 
                            ? "text-[#E0B382]" 
                            : msg.role === "system"
                            ? "text-stone-400"
                            : "text-emerald-400"
                        }`}>
                          {msg.user}
                        </span>
                        <span className="text-[9px] text-stone-500">{msg.time}</span>
                      </div>
                      <p className={`p-2.5 rounded-xl border leading-relaxed ${
                        msg.role === "system"
                          ? "bg-stone-950/60 border-stone-800 text-stone-400 italic text-[11px]"
                          : msg.role === "admin"
                          ? "bg-[#1E3B2E]/50 border-emerald-800/40 text-stone-200"
                          : "bg-stone-800/80 border-stone-700/50 text-stone-300"
                      }`}>
                        {msg.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-800 flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={isAdmin ? "Broadcast note to students..." : "Ask instructor a question..."}
                  className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-[#8C4B31]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8C4B31] hover:bg-[#A3593B] text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: ENROLLED STUDENTS & PLAN ROSTER (WITH ADMIN QR VERIFICATION) */}
          {activeTab === "roster" && (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Registered Students
                </span>
                <span className="text-xs text-[#E0B382] font-mono">
                  {enrolledStudents.filter((s) => s.status === "approved").length} Admitted
                </span>
              </div>

              {enrolledStudents.length === 0 ? (
                <div className="py-12 text-center text-stone-500 text-xs">
                  <Users size={24} className="mx-auto mb-2 opacity-40" />
                  <p>No students have enrolled in this class yet.</p>
                </div>
              ) : (
                enrolledStudents.map((student) => (
                  <div 
                    key={student.id}
                    className="p-3 bg-stone-950/80 border border-stone-800 rounded-2xl flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-bold text-white text-xs">{student.studentName}</h5>
                        <p className="text-[10px] text-stone-400">{student.studentPhone}</p>
                      </div>

                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        student.status === "approved"
                          ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                          : student.status === "rejected"
                          ? "bg-red-950 text-red-400 border-red-800"
                          : "bg-amber-950 text-amber-400 border-amber-800"
                      }`}>
                        {student.status === "approved" ? "Admitted" : student.status === "rejected" ? "Rejected" : "Pending QR"}
                      </span>
                    </div>

                    {/* Chosen Plan and Price */}
                    <div className="flex items-center justify-between text-[11px] bg-stone-900/90 px-2.5 py-1.5 rounded-xl border border-stone-800/80">
                      <span className="text-stone-400">Chosen Plan:</span>
                      <span className="font-semibold text-[#E0B382] font-mono">{student.priceEtb} ETB</span>
                    </div>

                    {/* Payment Receipt / QR Code Inspection */}
                    {student.receiptUrl ? (
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setInspectReceipt({
                            url: student.receiptUrl!,
                            studentName: student.studentName,
                            plan: `${student.priceEtb} ETB`
                          })}
                          className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                        >
                          <Eye size={12} />
                          <span>View QR / Deposit Slip</span>
                        </button>

                        {/* Admin Action Buttons */}
                        {isAdmin && student.status === "pending_verification" && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleApproveStudent(student.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors"
                              title="Approve QR Code and admit to class"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectStudent(student.id)}
                              className="px-2 py-1 rounded-lg bg-red-600/30 text-red-300 hover:bg-red-600/50 text-[10px] font-bold transition-colors"
                              title="Reject registration"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-stone-500 italic">No receipt slip attached</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>

      {/* LIGHTBOX MODAL FOR ADMIN TO INSPECT PAYMENT QR / RECEIPT */}
      {inspectReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setInspectReceipt(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold tracking-widest text-[#E0B382] uppercase block mb-1">
                Student Payment Inspection
              </span>
              <h4 className="font-serif text-xl font-bold text-white">
                {inspectReceipt.studentName}
              </h4>
              <p className="text-xs text-stone-400">
                Plan Fee: <strong className="text-white font-mono">{inspectReceipt.plan}</strong>
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black border border-stone-800 max-h-[60vh] flex items-center justify-center p-2 mb-4">
              <img 
                src={inspectReceipt.url} 
                alt="Payment QR or Deposit Slip" 
                className="max-h-[55vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex gap-2">
              <a
                href={inspectReceipt.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5"
              >
                <ExternalLink size={13} />
                <span>Open Full Original Image</span>
              </a>
              <button
                onClick={() => setInspectReceipt(null)}
                className="px-5 py-2.5 rounded-xl bg-[#8C4B31] hover:bg-[#A3593B] text-white text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
