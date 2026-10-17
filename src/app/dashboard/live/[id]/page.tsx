"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Hand, 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  Lock, 
  CheckCircle2,
  Users
} from "lucide-react";
import { 
  LiveKitRoom, 
  useTracks, 
  useParticipants, 
  useRoomContext,
  VideoTrack
} from "@livekit/components-react";
import { Track, RoomEvent, Participant } from "livekit-client";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isHost: boolean;
}

function StudentClassroomInner({ sessionId, sessionTitle }: { sessionId: string; sessionTitle: string }) {
  const router = useRouter();
  const room = useRoomContext();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  const [handRaised, setHandRaised] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Monitor room disconnects or permissions
  useEffect(() => {
    if (!room) return;

    // Check local permissions
    const updatePermissions = () => {
      const pubPerm = room.localParticipant?.permissions?.canPublish;
      setCanSpeak(Boolean(pubPerm));
      if (!pubPerm && micActive) {
        room.localParticipant?.setMicrophoneEnabled(false);
        setMicActive(false);
      }
    };

    updatePermissions();
    room.on(RoomEvent.ParticipantPermissionsChanged, updatePermissions);

    // Listen to DataChannel
    const handleDataReceived = (payload: Uint8Array, participant?: Participant, kind?: any, topic?: string) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);

        if (topic === "chat" || data.type === "chat") {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              sender: participant?.name || data.sender || "Participant",
              text: data.text,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isHost: Boolean(data.sender?.includes("Instructor")),
            },
          ]);
        }
      } catch (e) {
        console.warn("Data error:", e);
      }
    };

    // When room disconnects
    const handleDisconnected = () => {
      setSessionEnded(true);
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantPermissionsChanged, updatePermissions);
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, micActive]);

  // Handle auto-redirect when session ended
  useEffect(() => {
    if (!sessionEnded) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/dashboard?tab=classes");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionEnded, router]);

  // Toggle Raise Hand
  const handleToggleRaiseHand = async () => {
    if (!room.localParticipant) return;
    const nextState = !handRaised;
    const type = nextState ? "raise-hand" : "lower-hand";
    const payload = JSON.stringify({
      type,
      identity: room.localParticipant.identity,
      name: room.localParticipant.name || "Student",
    });

    try {
      await room.localParticipant.publishData(new TextEncoder().encode(payload), {
        reliable: true,
        topic: type,
      });
      setHandRaised(nextState);
    } catch (err) {
      console.warn("Raise hand error:", err);
    }
  };

  // Toggle Microphone (only enabled if host granted speaking permission)
  const handleToggleMic = async () => {
    if (!canSpeak || !room.localParticipant) return;
    const nextMic = !micActive;
    await room.localParticipant.setMicrophoneEnabled(nextMic);
    setMicActive(nextMic);
  };

  // Send Student Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !room.localParticipant) return;

    const text = chatInput.trim();
    const payload = JSON.stringify({
      type: "chat",
      sender: room.localParticipant.name || "Student",
      text,
    });

    try {
      await room.localParticipant.publishData(new TextEncoder().encode(payload), {
        reliable: true,
        topic: "chat",
      });

      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          sender: "You",
          text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isHost: false,
        },
      ]);
      setChatInput("");
    } catch (err) {
      console.warn("Send chat error:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#141517] text-stone-100 overflow-hidden">
      
      {/* Top Bar */}
      <header className="h-16 border-b border-stone-800 bg-[#1A1C1E] px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard?tab=classes"
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Leave Stream"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="font-serif text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-md">
                {sessionTitle}
              </h1>
              <span className="bg-[#1E3B2E] text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Student Viewer
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-400">
          <Users size={14} />
          <span>{participants.length} in attendance</span>
        </div>
      </header>

      {/* Main Classroom Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Video Stage */}
        <div className="flex-1 flex flex-col p-4 bg-[#0F1012] relative overflow-hidden">
          
          <div className="flex-1 grid grid-cols-1 gap-4 items-center justify-center overflow-auto rounded-3xl bg-black/60 p-4 border border-stone-800/80">
            {tracks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-500">
                <Sparkles size={40} className="mb-3 text-emerald-500 animate-pulse" />
                <p className="text-sm font-semibold text-stone-300">Connected to Live Studio Broadcast</p>
                <p className="text-xs text-stone-500 mt-1">Waiting for instructor video feed to start...</p>
              </div>
            ) : (
              tracks.map((trackRef) => (
                <div 
                  key={trackRef.publication.trackSid || trackRef.participant.identity}
                  className="relative w-full h-full max-h-[75vh] rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 shadow-2xl flex items-center justify-center"
                >
                  <VideoTrack trackRef={trackRef} className="w-full h-full object-contain" />
                  <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-2 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span>{trackRef.participant.name || "Instructor"}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Floating Control Bar */}
          <div className="h-20 flex items-center justify-center gap-3 shrink-0 pt-4">
            <div className="bg-[#1F2124] border border-stone-700/80 rounded-full px-5 py-2.5 flex items-center gap-4 shadow-2xl">
              
              {/* Mic Control */}
              <div className="relative group">
                <button
                  onClick={handleToggleMic}
                  disabled={!canSpeak}
                  className={`p-3 rounded-full transition-all ${
                    !canSpeak 
                      ? "bg-stone-800/50 text-stone-600 cursor-not-allowed border border-stone-800" 
                      : micActive 
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                      : "bg-stone-800 hover:bg-stone-700 text-stone-300"
                  }`}
                >
                  {micActive ? <Mic size={18} /> : <MicOff size={18} />}
                </button>

                {!canSpeak && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-stone-900 text-stone-300 text-[11px] px-3 py-1.5 rounded-lg border border-stone-700 shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1.5">
                    <Lock size={12} className="text-amber-400" />
                    <span>Host has not granted speaking permission</span>
                  </div>
                )}
              </div>

              {/* Raise Hand Button */}
              <button
                onClick={handleToggleRaiseHand}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                  handRaised
                    ? "bg-amber-500 text-black border border-amber-400 shadow-lg shadow-amber-500/20"
                    : "bg-stone-800 hover:bg-stone-700 text-white border border-stone-700"
                }`}
              >
                <Hand size={16} />
                <span>{handRaised ? "Hand Raised (In Queue)" : "Raise Hand to Speak"}</span>
              </button>

              {/* Leave Button */}
              <Link
                href="/dashboard?tab=classes"
                className="px-4 py-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white text-xs font-bold transition-colors"
              >
                Leave Stream
              </Link>

            </div>
          </div>

        </div>

        {/* Right: Q&A Chat */}
        <aside className="w-80 sm:w-96 border-l border-stone-800 bg-[#1A1C1E] flex flex-col shrink-0">
          <div className="p-4 border-b border-stone-800 flex items-center justify-between">
            <h2 className="font-serif text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare size={16} className="text-[#1E3B2E]" />
              <span>Workshop Q&A Chat</span>
            </h2>
            <span className="text-[10px] text-stone-500 uppercase font-mono">Live</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-500 text-xs text-center">
                <MessageSquare size={32} className="text-stone-600 mb-2" />
                <p>Chat is open for Q&A.</p>
                <p className="text-[11px] text-stone-600 mt-1">Ask questions about folds, materials, or equipment.</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                    msg.isHost 
                      ? "bg-[#1E3B2E] text-white mr-auto border border-emerald-500/30" 
                      : msg.sender === "You"
                      ? "bg-[#8C4B31] text-white ml-auto"
                      : "bg-stone-800 text-stone-200 mr-auto border border-stone-700/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 text-[10px] opacity-75 font-semibold">
                    <span>{msg.sender}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChat} className="p-3 border-t border-stone-800 bg-stone-900 flex gap-2">
            <input
              type="text"
              placeholder="Ask instructor a question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-stone-800 text-stone-100 placeholder-stone-500 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#1E3B2E]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2.5 bg-[#1E3B2E] hover:bg-[#8C4B31] disabled:opacity-40 text-white rounded-xl transition-colors"
            >
              <Send size={14} />
            </button>
          </form>
        </aside>

      </div>

      {/* Session Ended Modal */}
      {sessionEnded && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
            <h3 className="font-serif text-2xl font-bold text-white">Session Has Ended</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              The instructor has concluded this masterclass broadcast. Thank you for participating!
            </p>
            <p className="text-[11px] text-stone-500">
              Redirecting to dashboard in {countdown} seconds...
            </p>
            <Link
              href="/dashboard?tab=classes"
              className="block w-full py-3 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-colors"
            >
              Go to Dashboard Now
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

export default function StudentLiveClassPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("Live Masterclass");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`/api/live/${sessionId}/token`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Unable to join live session.");
        }

        setToken(data.token);
        setLivekitUrl(data.livekitUrl);
        if (data.sessionTitle) setSessionTitle(data.sessionTitle);
      } catch (err: any) {
        console.error("Token error:", err);
        setErrorMsg(err.message || "Failed to connect to LiveKit stream.");
      } finally {
        setLoading(false);
      }
    }

    fetchToken();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#141517] items-center justify-center text-white">
        <div className="text-center space-y-3">
          <Sparkles size={32} className="animate-spin text-emerald-400 mx-auto" />
          <p className="font-serif text-lg font-bold">Connecting to Masterclass Stream...</p>
          <p className="text-xs text-stone-400">Verifying your enrollment and subscription token</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !token || !livekitUrl) {
    return (
      <div className="flex h-screen bg-[#141517] items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 p-8 rounded-3xl text-center space-y-4">
          <AlertCircle size={36} className="text-amber-500 mx-auto" />
          <h2 className="font-serif text-xl font-bold">Live Stream Admission</h2>
          <p className="text-xs text-stone-400 leading-relaxed">{errorMsg}</p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/dashboard?tab=classes"
              className="w-full py-3 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors"
            >
              Check Enrollment in Dashboard
            </Link>
            <Link
              href="/learn/schedule"
              className="w-full py-3 rounded-full bg-stone-800 text-stone-300 text-xs font-bold hover:bg-stone-700 transition-colors"
            >
              Browse Workshops Schedule
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={token}
      connect={true}
      video={false}
      audio={false}
    >
      <StudentClassroomInner sessionId={sessionId} sessionTitle={sessionTitle} />
    </LiveKitRoom>
  );
}
