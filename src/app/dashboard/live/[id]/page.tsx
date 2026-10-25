"use client";

import { useState, useEffect, use, useRef } from "react";
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
  CheckCircle2,
  Users,
  WifiOff,
  Volume2,
  HelpCircle,
  Clock,
  ShieldX
} from "lucide-react";
import { 
  LiveKitRoom, 
  useTracks, 
  useParticipants, 
  useRoomContext,
  useConnectionState,
  VideoTrack,
  RoomAudioRenderer,
  StartAudio
} from "@livekit/components-react";
import { Track, RoomEvent, Participant, DisconnectReason, ConnectionState } from "livekit-client";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isHost: boolean;
}

function StudentClassroomInner({ 
  sessionId, 
  sessionTitle 
}: { 
  sessionId: string; 
  sessionTitle: string; 
}) {
  const router = useRouter();
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  const [handRaised, setHandRaised] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [wasRemoved, setWasRemoved] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Monitor room disconnects or permissions
  useEffect(() => {
    if (!room) return;

    // Check local permissions
    const updatePermissions = () => {
      const pubPerm = Boolean(room.localParticipant?.permissions?.canPublish);
      setCanSpeak(pubPerm);

      // If permissions revoked, immediately halt local tracks
      if (!pubPerm) {
        if (micActive) {
          room.localParticipant?.setMicrophoneEnabled(false);
          setMicActive(false);
        }
        if (cameraActive) {
          room.localParticipant?.setCameraEnabled(false);
          setCameraActive(false);
        }
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
    const handleDisconnected = (reason?: DisconnectReason) => {
      if (reason === DisconnectReason.PARTICIPANT_REMOVED) {
        setWasRemoved(true);
      } else {
        setSessionEnded(true);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.ParticipantPermissionsChanged, updatePermissions);
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, micActive, cameraActive]);

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
    try {
      await room.localParticipant.setMicrophoneEnabled(nextMic);
      setMicActive(nextMic);
    } catch (err: any) {
      console.error("Microphone error:", err);
      alert("Unable to access microphone: " + (err.message || "Please ensure your browser has microphone permission enabled."));
    }
  };

  // Toggle Camera (only enabled if host granted speaking permission)
  const handleToggleCamera = async () => {
    if (!canSpeak || !room.localParticipant) return;
    const nextCam = !cameraActive;
    await room.localParticipant.setCameraEnabled(nextCam);
    setCameraActive(nextCam);
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
      {/* Audio Renderer for remote participants */}
      <RoomAudioRenderer />
      <StartAudio label="Click to allow classroom audio playback" />

      {/* Reconnecting Banner */}
      {connectionState === ConnectionState.Reconnecting && (
        <div className="bg-amber-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 animate-pulse z-30 shrink-0">
          <WifiOff size={14} />
          <span>Connection interrupted. Reconnecting to live masterclass stream...</span>
        </div>
      )}

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
              
              {/* Host Speaking Granted Controls: Mic and Camera appear ONLY when permitted */}
              {canSpeak && (
                <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 rounded-full px-3 py-1">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase px-1">Speaking Granted:</span>
                  
                  {/* Mic Toggle */}
                  <button
                    onClick={handleToggleMic}
                    className={`p-2.5 rounded-full transition-all ${
                      micActive 
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                        : "bg-stone-800 hover:bg-stone-700 text-stone-300"
                    }`}
                    title={micActive ? "Mute Microphone" : "Unmute Microphone"}
                  >
                    {micActive ? <Mic size={16} /> : <MicOff size={16} />}
                  </button>

                  {/* Camera Toggle */}
                  <button
                    onClick={handleToggleCamera}
                    className={`p-2.5 rounded-full transition-all ${
                      cameraActive 
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                        : "bg-stone-800 hover:bg-stone-700 text-stone-300"
                    }`}
                    title={cameraActive ? "Turn Off Camera" : "Turn On Camera"}
                  >
                    {cameraActive ? <VideoIcon size={16} /> : <VideoOff size={16} />}
                  </button>
                </div>
              )}

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

      {/* Removed from Room Modal */}
      {wasRemoved && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <ShieldX size={44} className="text-red-500 mx-auto" />
            <h3 className="font-serif text-2xl font-bold text-white">Removed from Live Session</h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              You have been removed from this live session by the session host.
            </p>
            <Link
              href="/dashboard?tab=classes"
              className="block w-full py-3 rounded-full bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

// Pre-join Device Check & Waiting Room Component
function PreJoinScreen({
  sessionTitle,
  sessionStatus,
  startsAt,
  onEnter,
}: {
  sessionTitle: string;
  sessionStatus: string;
  startsAt: string | null;
  onEnter: () => void;
}) {
  const [micTested, setMicTested] = useState(false);
  const [speakerTested, setSpeakerTested] = useState(false);
  const [cameraPreviewActive, setCameraPreviewActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [secondsUntilStart, setSecondsUntilStart] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Calculate countdown
  useEffect(() => {
    if (!startsAt) return;
    const calc = () => {
      const diff = Math.floor((new Date(startsAt).getTime() - Date.now()) / 1000);
      setSecondsUntilStart(diff > 0 ? diff : 0);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [startsAt]);

  // Clean up camera preview on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleTogglePreviewCamera = async () => {
    if (cameraPreviewActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraPreviewActive(false);
    } else {
      try {
        setPermissionError(null);
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraPreviewActive(true);
      } catch (err: any) {
        setPermissionError(
          "Camera access denied. Please click the lock icon in your browser address bar and set Camera to 'Allow'."
        );
      }
    }
  };

  const handleTestSpeaker = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      setSpeakerTested(true);
    } catch {
      setSpeakerTested(true);
    }
  };

  const handleTestMic = async () => {
    try {
      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicTested(true);
    } catch {
      setPermissionError(
        "Microphone access denied. Please check your browser address bar permissions to allow microphone."
      );
    }
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isWaiting = sessionStatus !== "live" && secondsUntilStart !== null && secondsUntilStart > 0;

  return (
    <div className="min-h-screen bg-[#141517] text-white flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="space-y-1 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3B2E] text-emerald-300 text-[11px] font-bold uppercase mb-2">
            <Sparkles size={12} />
            <span>Masterclass Studio Check-in</span>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight">{sessionTitle}</h2>
          <p className="text-xs text-stone-400">
            Verify your audio and video before entering the live session studio.
          </p>
        </div>

        {/* Waiting Room Countdown Banner */}
        {isWaiting && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-amber-400 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-amber-200">Waiting for Broadcast to Start</p>
                <p className="text-[11px] text-stone-400">The instructor will open the studio room shortly.</p>
              </div>
            </div>
            <div className="font-mono text-xl font-extrabold text-amber-400">
              {formatCountdown(secondsUntilStart)}
            </div>
          </div>
        )}

        {/* Video Preview Box */}
        <div className="relative aspect-video rounded-2xl bg-black border border-stone-800 overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraPreviewActive ? "block" : "hidden"}`}
          />
          {!cameraPreviewActive && (
            <div className="text-center space-y-2 p-4">
              <VideoOff size={32} className="text-stone-600 mx-auto" />
              <p className="text-xs text-stone-400 font-medium">Camera is currently off</p>
              <button
                type="button"
                onClick={handleTogglePreviewCamera}
                className="px-3.5 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors"
              >
                Test Camera
              </button>
            </div>
          )}
          {cameraPreviewActive && (
            <button
              type="button"
              onClick={handleTogglePreviewCamera}
              className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white text-[11px] font-bold backdrop-blur-md"
            >
              Turn Off
            </button>
          )}
        </div>

        {/* Device Check Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleTestMic}
            className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
              micTested 
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200" 
                : "bg-stone-800/80 border-stone-700 hover:bg-stone-800 text-stone-300"
            }`}
          >
            <Mic size={18} className={micTested ? "text-emerald-400" : "text-stone-400"} />
            <div>
              <p className="text-xs font-bold">{micTested ? "Microphone Verified" : "Test Microphone"}</p>
              <p className="text-[10px] text-stone-400">Click to check browser audio input</p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleTestSpeaker}
            className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
              speakerTested 
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200" 
                : "bg-stone-800/80 border-stone-700 hover:bg-stone-800 text-stone-300"
            }`}
          >
            <Volume2 size={18} className={speakerTested ? "text-emerald-400" : "text-stone-400"} />
            <div>
              <p className="text-xs font-bold">{speakerTested ? "Speaker Verified" : "Test Speaker"}</p>
              <p className="text-[10px] text-stone-400">Play test chime</p>
            </div>
          </button>
        </div>

        {/* Permission Error Prompt */}
        {permissionError && (
          <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-500/40 flex items-start gap-2.5">
            <HelpCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 leading-relaxed">{permissionError}</p>
          </div>
        )}

        {/* Enter Studio Button */}
        <div className="space-y-2 pt-2">
          {sessionStatus !== "live" ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled
                className="w-full py-3.5 rounded-full bg-stone-800 text-stone-400 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2 border border-stone-700"
              >
                <Clock size={16} className="animate-spin text-amber-400" />
                <span>Waiting for Instructor to Go Live...</span>
              </button>
              <p className="text-[11px] text-center text-stone-400">
                You can test your camera and audio while waiting. The button will activate automatically.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach((t) => t.stop());
                }
                onEnter();
              }}
              className="w-full py-3.5 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white font-bold text-sm transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
            >
              Enter Live Classroom
            </button>
          )}
          <div className="text-center">
            <Link
              href="/dashboard?tab=classes"
              className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
            >
              Cancel and return to dashboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function StudentLiveClassPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState("Live Masterclass");
  const [sessionStatus, setSessionStatus] = useState("scheduled");
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isWaitingForHost, setIsWaitingForHost] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchToken = async (silent = false) => {
    if (!silent) setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/live/${sessionId}/token`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.isWaitingForHost) {
          setIsWaitingForHost(true);
          if (data.sessionTitle) setSessionTitle(data.sessionTitle);
          if (data.sessionStatus) setSessionStatus(data.sessionStatus);
          if (data.startsAt) setStartsAt(data.startsAt);
          return;
        }
        throw new Error(data.error || "Unable to join live session.");
      }

      setIsWaitingForHost(false);
      setToken(data.token);
      setLivekitUrl(data.livekitUrl);
      if (data.sessionTitle) setSessionTitle(data.sessionTitle);
      if (data.sessionStatus) setSessionStatus(data.sessionStatus);
      if (data.startsAt) setStartsAt(data.startsAt);
    } catch (err: any) {
      console.error("Token error:", err);
      setErrorMsg(err.message || "Failed to connect to LiveKit stream.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken(false);
  }, [sessionId]);

  // Automatic Polling while waiting for host to open studio
  useEffect(() => {
    if (!isWaitingForHost) return;

    const interval = setInterval(() => {
      fetchToken(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [isWaitingForHost, sessionId]);

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

  // Waiting for Host Room Lobby
  if (isWaitingForHost && !token) {
    return (
      <div className="flex h-screen bg-[#141517] items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="w-12 h-12 rounded-full bg-[#1E3B2E] border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Clock size={22} className="animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-[#1E3B2E]/60 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
              Enrolled & Verified
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">{sessionTitle}</h2>
            <p className="text-xs text-stone-300 leading-relaxed">
              The instructor has not opened the live studio yet. You will be connected automatically the moment the teacher goes live.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700/60 text-stone-400 text-xs flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Auto-refreshing every 4 seconds...</span>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => fetchToken(false)}
              className="w-full py-3 rounded-full bg-[#1E3B2E] hover:bg-[#8C4B31] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Check Again Now
            </button>
            <Link
              href="/dashboard?tab=classes"
              className="w-full py-3 rounded-full bg-stone-800 text-stone-300 text-xs font-bold hover:bg-stone-700 transition-colors text-center"
            >
              Return to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not-approved or timing error -> Clear No-Access Screen
  if (errorMsg || !token || !livekitUrl) {
    return (
      <div className="flex h-screen bg-[#141517] items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 p-8 rounded-3xl text-center space-y-4 shadow-2xl">
          <AlertCircle size={38} className="text-amber-500 mx-auto" />
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

  // Pre-join Device Check / Waiting Room
  if (!hasEntered) {
    return (
      <PreJoinScreen
        sessionTitle={sessionTitle}
        sessionStatus={sessionStatus}
        startsAt={startsAt}
        onEnter={() => setHasEntered(true)}
      />
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
