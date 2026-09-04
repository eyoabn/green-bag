"use client";

import { use, useEffect, useState } from "react";
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
  PhoneOff
} from "lucide-react";

export default function LiveSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const [token, setToken] = useState("");
  const [isDemo, setIsDemo] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { user: "Sara Haile (Instructor)", text: "Welcome everyone to today's Origami Fold masterclass! Please ensure you have your bone folder ready.", time: "3:02 PM" },
    { user: "Yonas B.", text: "Audio and video are crystal clear from Hawassa!", time: "3:03 PM" },
    { user: "Bethlehem M.", text: "Can we review the triangular base fold once more?", time: "3:05 PM" },
  ]);
  const [messageInput, setMessageInput] = useState("");

  const room = `session_${sessionId}`;
  const username = "John Doe";

  useEffect(() => {
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
  }, [room, username]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { user: "You", text: messageInput.trim(), time: "Just now" }
    ]);
    setMessageInput("");
  };

  return (
    <div className="h-screen w-full bg-stone-950 text-white flex flex-col overflow-hidden">
      
      {/* Top Session Header */}
      <header className="h-16 px-6 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">Live Broadcast</span>
              <span className="text-stone-500">•</span>
              <h1 className="text-sm font-bold text-white tracking-wide">
                Virtual: Advanced Origami Folds & Gusset Dynamics
              </h1>
            </div>
            <span className="text-[11px] text-stone-400">
              Instructor: Sara Haile • LiveKit WebRTC Session #{sessionId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-xs font-semibold">
            <Users size={13} />
            <span>28 Students Active</span>
          </span>

          <button
            onClick={() => alert("Downloading Session PDF Blueprints & Dielines...")}
            className="px-3.5 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300 transition-colors flex items-center gap-1.5"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Blueprints</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body: Video Stage + Interactive Chat */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Video Stage */}
        <div className="flex-1 flex flex-col p-4 relative bg-black">
          
          {/* Main Instructor Feed Mockup */}
          <div className="flex-1 rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 relative flex items-center justify-center">
            
            {/* Visual Classroom Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-[#1E2922] to-stone-950 opacity-90 flex items-center justify-center">
              
              {/* Center Presentation Graphic */}
              <div className="text-center p-8 max-w-lg">
                <div className="w-20 h-20 rounded-full bg-[#1E3B2E] border-2 border-[#E0B382] flex items-center justify-center text-white mx-auto mb-4 shadow-xl">
                  <Video size={36} className="text-[#E0B382]" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-white mb-2">
                  Masterclass Live Feed
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Demonstrating live precision score lines on 220 GSM Ethiopian unbleached virgin kraft. Follow along with your materials kit.
                </p>

                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-800/80 border border-stone-700 text-xs text-emerald-400">
                  <ShieldCheck size={14} />
                  <span>Encrypted 1080p WebRTC Multi-Track Stream</span>
                </div>
              </div>

            </div>

            {/* Instructor Tag */}
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-white">Sara Haile (Addis Ababa Studio)</span>
            </div>

            {/* Student PiP Preview */}
            <div className="absolute top-4 right-4 w-40 sm:w-48 aspect-video rounded-xl bg-stone-950 border border-stone-700 shadow-2xl overflow-hidden flex flex-col justify-between p-2.5">
              <div className="flex justify-between items-center text-[10px] text-stone-400">
                <span>You (Student)</span>
                {videoOn ? <span className="text-emerald-400">Cam Active</span> : <span className="text-stone-500">Muted</span>}
              </div>

              <div className="flex items-center justify-center flex-1">
                {videoOn ? (
                  <div className="w-8 h-8 rounded-full bg-[#8C4B31] text-white flex items-center justify-center font-bold text-xs">
                    JD
                  </div>
                ) : (
                  <VideoOff size={18} className="text-stone-600" />
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {micOn ? <Mic size={11} className="text-emerald-400" /> : <MicOff size={11} className="text-red-400" />}
                <span className="text-[9px] text-stone-500">{micOn ? "Unmuted" : "Muted"}</span>
              </div>
            </div>

          </div>

          {/* Bottom Call Action Bar */}
          <div className="h-16 mt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`p-3.5 rounded-full transition-all ${
                micOn ? "bg-stone-800 hover:bg-stone-700 text-white" : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40"
              }`}
              title={micOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            <button
              onClick={() => setVideoOn(!videoOn)}
              className={`p-3.5 rounded-full transition-all ${
                videoOn ? "bg-stone-800 hover:bg-stone-700 text-white" : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40"
              }`}
              title={videoOn ? "Turn off Camera" : "Turn on Camera"}
            >
              {videoOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>

            <button
              onClick={() => setHandRaised(!handRaised)}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                handRaised ? "bg-amber-500 text-stone-950" : "bg-stone-800 hover:bg-stone-700 text-stone-300"
              }`}
            >
              <Hand size={16} />
              <span>{handRaised ? "Hand Raised" : "Raise Hand"}</span>
            </button>

            <Link
              href="/dashboard"
              className="p-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
              title="Leave Session"
            >
              <PhoneOff size={18} />
            </Link>
          </div>

        </div>

        {/* Right: Live Classroom Chat */}
        <div className="w-80 sm:w-96 bg-stone-900 border-l border-stone-800 flex flex-col">
          
          <div className="p-4 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#E0B382]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Classroom Chat</h4>
            </div>
            <span className="text-[10px] text-stone-500 font-mono">Live Sync</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {chatMessages.map((msg, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${msg.user.includes("Instructor") ? "text-[#E0B382]" : msg.user === "You" ? "text-emerald-400" : "text-stone-300"}`}>
                    {msg.user}
                  </span>
                  <span className="text-[10px] text-stone-500">{msg.time}</span>
                </div>
                <p className="text-stone-300 leading-relaxed bg-stone-800/60 p-2.5 rounded-xl border border-stone-700/50">
                  {msg.text}
                </p>
              </div>
            ))}
          </div>

          {/* Send Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-800 flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Ask instructor a question..."
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

      </div>

    </div>
  );
}
