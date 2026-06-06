import { useState, useEffect, useRef } from "react";
import {
  Volume2, Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Users, Wifi,
} from "lucide-react";
import type { Channel, Server, User } from "../lib/types";
import {
  joinVoiceRoom, leaveVoiceRoom, setLocalMuted, setLocalDeafened, setLocalVideo,
  startScreenShare, getLocalStream, getRemoteStreams, getPeerCount, getCurrentChannelId,
} from "../lib/voice";
import { Avatar } from "./ui/Avatar";
import { cn } from "../utils/cn";

interface VoicePanelProps {
  channel: Channel;
  server: Server;
  currentUser: User;
}

export function VoicePanel({ channel, currentUser }: VoicePanelProps) {
  const [inVoice, setInVoice] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [startWithVideo, setStartWithVideo] = useState(false);
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected">("idle");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    const current = getCurrentChannelId();
    if (current === channel.id) {
      setInVoice(true);
      setConnectionState("connected");
    }
  }, [channel.id]);

  useEffect(() => {
    if (inVoice && localVideoRef.current) {
      const stream = getLocalStream();
      if (stream && localVideoRef.current.srcObject !== stream) {
        localVideoRef.current.srcObject = stream;
      }
    }
  }, [inVoice, videoOn, peerCount]);

  async function handleJoin() {
    try {
      setError(null);
      setConnectionState("connecting");
      await joinVoiceRoom(channel.id, currentUser.id, {
        video: startWithVideo,
        events: {
          onJoined: () => {
            setInVoice(true);
            setConnectionState("connected");
            setPeerCount(getPeerCount());
          },
          onPeersChanged: () => setPeerCount(getPeerCount()),
          onError: (e) => {
            setError(e.message || "Could not access microphone. Please check permissions.");
            setConnectionState("idle");
          },
        },
      });
    } catch {
      setConnectionState("idle");
      setError("Could not access microphone. Please check permissions and try again.");
    }
  }

  async function handleLeave() {
    await leaveVoiceRoom();
    setInVoice(false);
    setMuted(false);
    setDeafened(false);
    setVideoOn(false);
    setScreenSharing(false);
    setPeerCount(0);
    setConnectionState("idle");
  }

  function toggleMute() {
    const next = !muted;
    setLocalMuted(next);
    setMuted(next);
  }

  function toggleDeafen() {
    const next = !deafened;
    setLocalDeafened(next);
    setDeafened(next);
  }

  async function toggleVideo() {
    const next = !videoOn;
    await setLocalVideo(next);
    setVideoOn(next);
  }

  async function toggleScreenShare() {
    if (screenSharing) {
      setScreenSharing(false);
      return;
    }
    const ok = await startScreenShare();
    setScreenSharing(ok);
  }

  const remoteStreams = inVoice ? getRemoteStreams() : [];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[color:var(--color-border)] flex-shrink-0">
        <Volume2 size={20} className="text-[color:var(--color-text-mute)]" />
        <div className="flex-1">
          <h2 className="font-semibold text-sm text-[color:var(--color-text)]">{channel.name}</h2>
          {inVoice && (
            <p className="text-xs text-[color:var(--color-success)]">
              ● {peerCount + 1} connected
            </p>
          )}
        </div>
        {inVoice && (
          <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-text-mute)]">
            <Wifi size={12} />
            <span>Connected</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!inVoice ? (
          /* Join screen */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className="h-20 w-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: "var(--color-bg-3)" }}
            >
              <Volume2 size={32} className="text-[color:var(--color-text-mute)]" />
            </div>
            <h3 className="text-xl font-semibold text-[color:var(--color-text)] mb-2">{channel.name}</h3>
            <p className="text-sm text-[color:var(--color-text-dim)] max-w-xs mb-8">
              Join the voice channel to start talking. Others in this channel will hear you live.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-[color:var(--color-danger)]/10 border border-[color:var(--color-danger)]/20 text-sm text-[color:var(--color-danger)] max-w-sm text-left">
                <strong>Oops!</strong> {error}
              </div>
            )}

            <div className="flex flex-col gap-4 w-full max-w-xs">
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[color:var(--color-bg-3)] border border-[color:var(--color-border)] cursor-pointer hover:border-[color:var(--color-border-strong)] transition-colors">
                <input
                  type="checkbox"
                  checked={startWithVideo}
                  onChange={(e) => setStartWithVideo(e.target.checked)}
                  className="rounded"
                />
                <Video size={16} className="text-[color:var(--color-text-dim)]" />
                <span className="text-sm text-[color:var(--color-text-dim)]">Start with camera on</span>
              </label>

              <button
                onClick={handleJoin}
                disabled={connectionState === "connecting"}
                className={cn(
                  "h-12 rounded-xl font-semibold text-sm transition-all",
                  connectionState === "connecting"
                    ? "bg-[color:var(--color-bg-4)] text-[color:var(--color-text-mute)] cursor-wait"
                    : "bg-[color:var(--color-success)] text-white hover:brightness-110",
                )}
              >
                {connectionState === "connecting" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting…
                  </span>
                ) : (
                  "Join Voice"
                )}
              </button>
            </div>
          </div>
        ) : (
          /* In voice */
          <div className="flex flex-col h-full gap-4">
            {/* Video grid */}
            <div
              className="flex-1 grid gap-3"
              style={{ gridTemplateColumns: remoteStreams.length > 0 ? "repeat(auto-fit, minmax(300px, 1fr))" : "1fr" }}
            >
              {/* Local video tile */}
              <VideoTile
                label={`${currentUser.username} (You)`}
                isLocal
                muted={muted}
                videoEnabled={videoOn}
                videoRef={localVideoRef}
                user={currentUser}
              />

              {/* Remote video tiles */}
              {remoteStreams.map(({ peerId, stream }) => {
                const hasVideo = stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;
                return (
                  <VideoTile
                    key={peerId}
                    label={`Peer`}
                    isLocal={false}
                    muted={false}
                    videoEnabled={hasVideo}
                    onVideoRef={(el) => {
                      if (el) {
                        remoteVideoRefs.current.set(peerId, el);
                        if (el.srcObject !== stream) el.srcObject = stream;
                      }
                    }}
                  />
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 py-4">
              <ControlButton
                icon={muted ? <MicOff size={18} /> : <Mic size={18} />}
                label={muted ? "Unmute" : "Mute"}
                onClick={toggleMute}
                active={muted}
                danger={muted}
              />
              <ControlButton
                icon={deafened ? <Volume2 size={18} /> : <Volume2 size={18} />}
                label={deafened ? "Undeafen" : "Deafen"}
                onClick={toggleDeafen}
                active={deafened}
              />
              <ControlButton
                icon={videoOn ? <VideoOff size={18} /> : <Video size={18} />}
                label={videoOn ? "Stop Video" : "Start Video"}
                onClick={toggleVideo}
                active={videoOn}
              />
              <ControlButton
                icon={<Monitor size={18} />}
                label={screenSharing ? "Stop Share" : "Share Screen"}
                onClick={toggleScreenShare}
                active={screenSharing}
              />
              <ControlButton
                icon={<PhoneOff size={18} />}
                label="Disconnect"
                onClick={handleLeave}
                danger
                large
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Video Tile ----

interface VideoTileProps {
  label: string;
  isLocal: boolean;
  muted: boolean;
  videoEnabled: boolean;
  user?: User;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onVideoRef?: (el: HTMLVideoElement | null) => void;
}

function VideoTile({ label, isLocal, muted, videoEnabled, user, videoRef, onVideoRef }: VideoTileProps) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex items-center justify-center"
      style={{ background: "var(--color-bg-3)", minHeight: 200 }}
    >
      {videoEnabled ? (
        <video
          ref={videoRef ?? onVideoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          {user ? (
            <Avatar user={user} size="lg" />
          ) : (
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: "var(--color-bg-4)" }}
            >
              ?
            </div>
          )}
          <span className="text-sm text-[color:var(--color-text-dim)]">{label}</span>
        </div>
      )}

      {/* Label overlay */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
          {label}
        </span>
        {muted && (
          <span className="p-1 rounded bg-[color:var(--color-danger)]/80 backdrop-blur-sm">
            <MicOff size={10} className="text-white" />
          </span>
        )}
      </div>
    </div>
  );
}

// ---- Control Button ----

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  large?: boolean;
}

function ControlButton({ icon, label, onClick, active, danger, disabled, large }: ControlButtonProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center rounded-xl transition-all",
          large ? "h-14 w-14" : "h-12 w-12",
          danger
            ? "bg-[color:var(--color-danger)] text-white hover:brightness-110"
            : active
            ? "bg-[color:var(--color-bg-4)] text-[color:var(--color-accent)] border border-[color:var(--color-accent)]/30"
            : "bg-[color:var(--color-bg-3)] text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-bg-4)] hover:text-[color:var(--color-text)]",
          disabled && "opacity-40 cursor-not-allowed",
        )}
      >
        {icon}
      </button>
      <span className="text-xs text-[color:var(--color-text-mute)]">{label}</span>
    </div>
  );
}
