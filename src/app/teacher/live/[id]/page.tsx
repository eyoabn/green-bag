"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  ScreenShare, 
  PhoneOff, 
  Users, 
  Hand, 
  VolumeX, 
  ShieldAlert, 
  Check, 
  X, 
  Sparkles, 
  ArrowLeft,
  MessageSquare,
  Send,
  MoreVertical
} from "lucide-react";
import { 
  LiveKitRoom, 
  useTracks, 
  useParticipants, 
  useRoomContext,
  VideoTrack,
  AudioTrack,
  RoomAudioRenderer,
  StartAudio
} from "@livekit/components-react";
import { Track, RoomEvent, Participant, RemoteParticipant } from "livekit-client";

interface RaiseHandItem {
  identity: string;
  name: string;
  timestamp: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isHost: boolean;
}

function HostClassroomInner({ sessionId, sessionTitle }: { sessionId: string; sessionTitle: string }) {
  const router = useRouter();
  const room = useRoomContext();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<"participants" | "raiseHand" | "chat">("participants");
  const [raiseHandQueue, setRaiseHandQueue] = useState<RaiseHandItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isEnding, setIsEnding] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Listen to DataChannel events (raise-hand, chat)
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant?: Participant, kind?: any, topic?: string) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);

        if (topic === "raise-hand" || data.type === "raise-hand") {
          const item: RaiseHandItem = {
            identity: participant?.identity || data.identity,
            name: participant?.name || data.name || "Student",
            timestamp: Date.now(),
          };
          setRaiseHandQueue((prev) => {
            if (prev.some((p) => p.identity === item.identity)) return prev;
            return [...prev, item];
          });
          showNotice(`✋ ${item.name} raised their hand`);
        } else if (topic === "lower-hand" || data.type === "lower-hand") {
          setRaiseHandQueue((prev) => prev.filter((p) => p.identity !== (participant?.identity || data.identity)));
        } else if (topic === "chat" || data.type === "chat") {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              sender: participant?.name || data.sender || "Student",
              text: data.text,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isHost: false,
            },
          ]);
        }
      } catch (e) {
        console.warn("Data parse error:", e);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  // Toggle local mic
  const handleToggleMic = async () => {
    if (!room.localParticipant) return;
    const newState = !micEnabled;
    await room.localParticipant.setMicrophoneEnabled(newState);
    setMicEnabled(newState);
  };

  // Toggle local camera
  const handleToggleCamera = async () => {
    if (!room.localParticipant) return;
    const newState = !cameraEnabled;
    await room.localParticipant.setCameraEnabled(newState);
    setCameraEnabled(newState);
  };

  // Toggle Screen share
  const handleToggleScreenShare = async () => {
    if (!room.localParticipant) return;
    try {
      const newState = !screenShareEnabled;
      await room.localParticipant.setScreenShareEnabled(newState);
      setScreenShareEnabled(newState);
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  // Send Host Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !room.localParticipant) return;

    const text = chatInput.trim();
    const payload = JSON.stringify({ type: "chat", sender: room.localParticipant.name || "Instructor (Host)", text });
    await room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true, topic: "chat" });

    setChatMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        sender: "You (Instructor)",
        text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isHost: true,
      },
    ]);
    setChatInput("");
  };

  // Mute All Participants
  const handleMuteAll = async () => {
    const remoteParticipants = participants.filter((p) => p !== room.localParticipant);
    for (const p of remoteParticipants) {
      // Find audio tracks
      for (const trackPub of p.audioTrackPublications.values()) {
        if (trackPub.trackSid) {
          try {
            await fetch(`/api/live/${sessionId}/participants/${p.identity}/mute`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackSid: trackPub.trackSid, muted: true }),
            });
          } catch {}
        }
      }
    }
    showNotice("Muted all participants in room");
  };

  // Mute Individual Participant
  const handleMuteParticipant = async (p: Participant) => {
    for (const trackPub of p.audioTrackPublications.values()) {
      if (trackPub.trackSid) {
        try {
          await fetch(`/api/live/${sessionId}/participants/${p.identity}/mute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trackSid: trackPub.trackSid, muted: true }),
          });
          showNotice(`Muted ${p.name || p.identity}`);
        } catch (err: any) {
          alert("Mute error: " + err.message);
        }
      }
    }
  };

  // Grant Speaking Permission
  const handleGrantSpeaking = async (identity: string) => {
    try {
      const res = await fetch(`/api/live/${sessionId}/participants/${identity}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canPublish: true }),
      });
      if (res.ok) {
        setRaiseHandQueue((prev) => prev.filter((item) => item.identity !== identity));
        showNotice(`Granted speaking permission to ${identity}`);
      }
    } catch (err: any) {
      alert("Error granting permission: " + err.message);
    }
  };

  // Revoke Speaking Permission
  const handleRevokeSpeaking = async (identity: string) => {
    try {
      const res = await fetch(`/api/live/${sessionId}/participants/${identity}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canPublish: false }),
      });
      if (res.ok) {
        showNotice(`Revoked speaking permission for ${identity}`);
      }
    } catch (err: any) {
      alert("Error revoking permission: " + err.message);
    }
  };

  // Kick Participant
  const handleKickParticipant = async (identity: string) => {
    if (!confirm(`Are you sure you want to remove this participant from the room?`)) return;
    try {
      const res = await fetch(`/api/live/${sessionId}/participants/${identity}/remove`, {
        method: "POST",
      });
      if (res.ok) {
        showNotice(`Removed participant from room`);
      }
    } catch (err: any) {
      alert("Error removing participant: " + err.message);
    }
  };

  // End Session
  const handleEndSession = async () => {
    if (!confirm("Are you sure you want to end this live masterclass for all participants?")) return;
    setIsEnding(true);
    try {
      await fetch(`/api/live/${sessionId}/end`, { method: "POST" });
      router.push("/teacher");
    } catch (err: any) {
      alert("Failed to end session: " + err.message);
      setIsEnding(false);
    }
  };

  const remoteParticipants = participants.filter((p) => p !== room.localParticipant);

  return (
    <div className="flex flex-col h-screen bg-[#141517] text-stone-100 overflow-hidden">
      
      {/* Top Bar */}
      <header className="h-16 border-b border-stone-800 bg-[#1A1C1E] px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher"
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Leave Room"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h1 className="font-serif text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-md">
                {sessionTitle}
              </h1>
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                Host Broadcast
              </span>
            </div>
          </div>
        </div>

        {actionNotice && (
          <div className="bg-emerald-950/90 border border-emerald-600/50 text-emerald-200 text-xs px-3.5 py-1.5 rounded-full animate-fade-in shadow-lg">
            {actionNotice}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleEndSession}
            disabled={isEnding}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-md shadow-red-900/30"
          >
            <PhoneOff size={14} />
            <span>{isEnding ? "Ending Room..." : "End Session for All"}</span>
          </button>
        </div>
      </header>

      {/* Main Studio Work Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Video Stage */}
        <div className="flex-1 flex flex-col p-4 bg-[#0F1012] relative overflow-hidden">
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center overflow-auto rounded-3xl bg-black/40 p-4 border border-stone-800/80">
            {tracks.length === 0 ? (
              <div className="col-span-full h-full flex flex-col items-center justify-center text-stone-500">
                <VideoOff size={48} className="mb-2 text-stone-600" />
                <p className="text-sm font-medium">Camera is disabled</p>
                <p className="text-xs text-stone-600 mt-1">Enable camera using the bottom control bar to start streaming video.</p>
              </div>
            ) : (
              tracks.map((trackRef) => (
                <div 
                  key={trackRef.publication.trackSid || trackRef.participant.identity}
                  className="relative aspect-video rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 shadow-xl flex items-center justify-center"
                >
                  <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{trackRef.participant.name || trackRef.participant.identity}</span>
                    {trackRef.participant === room.localParticipant && <span className="text-[10px] text-stone-400">(Host)</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Floating Control Bar */}
          <div className="h-20 flex items-center justify-center gap-3 shrink-0 pt-4">
            <div className="bg-[#1F2124] border border-stone-700/80 rounded-full px-5 py-2.5 flex items-center gap-3 shadow-2xl">
              
              {/* Mic Toggle */}
              <button
                onClick={handleToggleMic}
                className={`p-3 rounded-full transition-all ${
                  micEnabled 
                    ? "bg-stone-800 hover:bg-stone-700 text-white" 
                    : "bg-red-500/20 text-red-400 border border-red-500/40"
                }`}
                title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
              >
                {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              {/* Camera Toggle */}
              <button
                onClick={handleToggleCamera}
                className={`p-3 rounded-full transition-all ${
                  cameraEnabled 
                    ? "bg-stone-800 hover:bg-stone-700 text-white" 
                    : "bg-red-500/20 text-red-400 border border-red-500/40"
                }`}
                title={cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
              >
                {cameraEnabled ? <VideoIcon size={18} /> : <VideoOff size={18} />}
              </button>

              {/* Screen Share */}
              <button
                onClick={handleToggleScreenShare}
                className={`p-3 rounded-full transition-all ${
                  screenShareEnabled 
                    ? "bg-[#1E3B2E] text-white border border-emerald-500/40" 
                    : "bg-stone-800 hover:bg-stone-700 text-white"
                }`}
                title={screenShareEnabled ? "Stop Screen Share" : "Share Screen"}
              >
                <ScreenShare size={18} />
              </button>

              <div className="h-6 w-px bg-stone-700 mx-1" />

              {/* Raise Hand Indicator */}
              <button
                onClick={() => setActiveTab("raiseHand")}
                className={`relative p-3 rounded-full transition-all ${
                  raiseHandQueue.length > 0 
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-bounce" 
                    : "bg-stone-800 hover:bg-stone-700 text-stone-300"
                }`}
                title="Raised Hands Queue"
              >
                <Hand size={18} />
                {raiseHandQueue.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-black font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                    {raiseHandQueue.length}
                  </span>
                )}
              </button>

              {/* Mute All */}
              <button
                onClick={handleMuteAll}
                className="p-3 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition-all"
                title="Mute All Remote Students"
              >
                <VolumeX size={18} />
              </button>

            </div>
          </div>

        </div>

        {/* Right: Moderation, Hand Queue, and Chat Sidebar */}
        <aside className="w-80 sm:w-96 border-l border-stone-800 bg-[#1A1C1E] flex flex-col shrink-0">
          
          {/* Tabs Header */}
          <div className="grid grid-cols-3 border-b border-stone-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab("participants")}
              className={`py-3.5 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === "participants"
                  ? "border-[#1E3B2E] text-white bg-stone-800/40"
                  : "border-transparent text-stone-400 hover:text-white"
              }`}
            >
              <Users size={14} />
              <span>Artisans ({participants.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("raiseHand")}
              className={`py-3.5 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 relative ${
                activeTab === "raiseHand"
                  ? "border-amber-500 text-amber-400 bg-amber-500/10"
                  : "border-transparent text-stone-400 hover:text-white"
              }`}
            >
              <Hand size={14} />
              <span>Queue ({raiseHandQueue.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`py-3.5 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === "chat"
                  ? "border-[#1E3B2E] text-white bg-stone-800/40"
                  : "border-transparent text-stone-400 hover:text-white"
              }`}
            >
              <MessageSquare size={14} />
              <span>Q&A Chat</span>
            </button>
          </div>

          {/* Tab 1: Participants List & Moderation */}
          {activeTab === "participants" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 bg-stone-900/60 border-b border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400 font-medium">Room Moderation</span>
                <button
                  onClick={handleMuteAll}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/60 border border-amber-800/50 px-2.5 py-1 rounded-full"
                >
                  Mute All Students
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-stone-800/60 p-2">
                {/* Host row */}
                <div className="p-2.5 rounded-xl bg-stone-800/40 flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#1E3B2E] text-white font-bold text-xs flex items-center justify-center">
                      H
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{room.localParticipant?.name || "Instructor (You)"}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">(Host)</span>
                      </p>
                      <p className="text-[10px] text-stone-500">Instructor Broadcast</p>
                    </div>
                  </div>
                </div>

                {/* Remote Participants */}
                {remoteParticipants.length === 0 ? (
                  <div className="p-8 text-center text-stone-500 text-xs">
                    No students currently connected to the live stream.
                  </div>
                ) : (
                  remoteParticipants.map((p) => (
                    <div key={p.identity} className="p-2.5 flex items-center justify-between hover:bg-stone-800/30 rounded-xl transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center">
                          {p.name ? p.name.charAt(0).toUpperCase() : "S"}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                            <span>{p.name || p.identity}</span>
                            {p.isSpeaking && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Speaking
                              </span>
                            )}
                            {p.isMicrophoneEnabled && !p.isSpeaking && (
                              <span className="text-[9px] text-emerald-400 font-mono">Mic Ready</span>
                            )}
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono">{p.identity.substring(0, 8)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Grant Speaking */}
                        <button
                          onClick={() => handleGrantSpeaking(p.identity)}
                          className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/50 text-emerald-300 text-[10px] font-bold"
                          title="Grant Speaking Mic"
                        >
                          Mic On
                        </button>

                        {/* Revoke Speaking */}
                        <button
                          onClick={() => handleRevokeSpeaking(p.identity)}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 text-[10px]"
                          title="Revoke Speaking"
                        >
                          Mic Off
                        </button>

                        {/* Mute track */}
                        <button
                          onClick={() => handleMuteParticipant(p)}
                          className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-800/50 text-amber-300"
                          title="Mute Participant Audio Track"
                        >
                          <VolumeX size={12} />
                        </button>

                        {/* Kick */}
                        <button
                          onClick={() => handleKickParticipant(p.identity)}
                          className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/50 text-red-400"
                          title="Kick Participant"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Raise Hand Queue */}
          {activeTab === "raiseHand" && (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">
                Student Speaking Requests ({raiseHandQueue.length})
              </span>
              <p className="text-xs text-stone-400 mb-4">
                Students request permission to speak. Granting mic gives publishing privileges to their audio track.
              </p>

              {raiseHandQueue.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-500 text-xs text-center p-6">
                  <Hand size={32} className="text-stone-600 mb-2" />
                  <p>No raised hands right now.</p>
                  <p className="text-[11px] text-stone-600 mt-1">When students click &quot;Raise Hand&quot;, they appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {raiseHandQueue.map((item, idx) => (
                    <div key={item.identity} className="p-3 rounded-2xl bg-stone-800/80 border border-amber-500/30 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-extrabold text-[10px] flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white">{item.name}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono ml-6.5">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleGrantSpeaking(item.identity)}
                          className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1"
                        >
                          <Check size={12} />
                          <span>Grant Mic</span>
                        </button>
                        <button
                          onClick={() => setRaiseHandQueue((prev) => prev.filter((p) => p.identity !== item.identity))}
                          className="p-1.5 rounded-full bg-stone-700 hover:bg-stone-600 text-stone-300"
                          title="Dismiss"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Q&A Chat */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-500 text-xs text-center">
                    <MessageSquare size={32} className="text-stone-600 mb-2" />
                    <p>Live Q&A Chat is open.</p>
                    <p className="text-[11px] text-stone-600 mt-1">Post announcements or answer student questions.</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                        msg.isHost 
                          ? "bg-[#1E3B2E] text-white ml-auto border border-emerald-500/30" 
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
                  placeholder="Send announcement or response..."
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
            </div>
          )}

        </aside>

      </div>

    </div>
  );
}

export default function TeacherLiveRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("Live Masterclass Studio");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      setLoading(true);
      setErrorMsg(null);
      try {
        // 1. Mark session as 'live' and initialize LiveKit room
        try {
          await fetch(`/api/live/${sessionId}/start`, {
            method: "POST",
          });
        } catch (startErr) {
          console.warn("LiveKit start session ping notice:", startErr);
        }

        // 2. Fetch Host Token
        const res = await fetch(`/api/live/${sessionId}/token`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to obtain live room token.");
        }

        setToken(data.token);
        setLivekitUrl(data.livekitUrl);
        if (data.sessionTitle) setSessionTitle(data.sessionTitle);
      } catch (err: any) {
        console.error("Token error:", err);
        setErrorMsg(err.message || "Failed to connect to LiveKit Cloud.");
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
          <p className="font-serif text-lg font-bold">Connecting to LiveKit Studio Room...</p>
          <p className="text-xs text-stone-400">Verifying host credentials and room status</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !token || !livekitUrl) {
    return (
      <div className="flex h-screen bg-[#141517] items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 p-8 rounded-3xl text-center space-y-4">
          <ShieldAlert size={36} className="text-red-500 mx-auto" />
          <h2 className="font-serif text-xl font-bold">Unable to Join Studio</h2>
          <p className="text-xs text-stone-400 leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => router.push("/teacher")}
            className="w-full py-3 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors"
          >
            Return to Teacher Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={livekitUrl}
      token={token}
      connect={true}
      video={true}
      audio={true}
    >
      <RoomAudioRenderer />
      <StartAudio label="Click to allow student audio playback" />
      <HostClassroomInner sessionId={sessionId} sessionTitle={sessionTitle} />
    </LiveKitRoom>
  );
}
