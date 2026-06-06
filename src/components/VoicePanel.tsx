import { useState, useEffect, useRef } from "react";
import { Volume2, Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Users } from "lucide-react";
import type { Channel, Server, User } from "../lib/types";
import { joinVoiceRoom, leaveVoiceRoom, setLocalMuted, setLocalVideo, getLocalStream, getRemoteStreams, getPeerCount, getCurrentChannelId } from "../lib/voice";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Primitives";
import { cn } from "../utils/cn";

interface VoicePanelProps {
  channel: Channel;
  server: Server;
  currentUser: User;
}

export function VoicePanel({ channel, currentUser }: VoicePanelProps) {
  const [inVoice, setInVoice] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Check if already in this channel
  useEffect(() => {
    const current = getCurrentChannelId();
    if (current === channel.id) {
      setInVoice(true);
    }
  }, [channel.id]);

  // Update local video element
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
      await joinVoiceRoom(channel.id, currentUser.id, {
        video: videoOn,
        events: {
          onJoined: () => {
            setInVoice(true);
            setPeerCount(getPeerCount());
          },
          onPeersChanged: () => {
            setPeerCount(getPeerCount());
          },
        },
      });
    } catch (e) {
      console.error("Failed to join voice", e);
      setError("Could not access microphone. Please check permissions.");
    }
  }

  async function handleLeave() {
    await leaveVoiceRoom();
    setInVoice(false);
    setMuted(false);
    setVideoOn(false);
    setPeerCount(0);
  }

  function toggleMute() {
    const next = !muted;
    setLocalMuted(next);
    setMuted(next);
  }

  async function toggleVideo() {
    const next = !videoOn;
    await setLocalVideo(next);
    setVideoOn(next);
  }

  const remoteStreams = inVoice ? getRemoteStreams() : [];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[color:var(--color-bg-1)]">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-[color:var(--color-border)] shadow-sm bg-[color:var(--color-bg-2)]">
        <Volume2 className="h-5 w-5 text-[color:var(--color-text-mute)] mr-2" />
        <h2 className="font-semibold text-[15px]">{channel.name}</h2>
        {inVoice && (
          <div className="ml-auto flex items-center gap-2 text-xs text-[color:var(--color-text-dim)]">
            <Users className="h-3.5 w-3.5" />
            <span>{peerCount + 1} connected</span>
          </div>
        )}
      </div>

      {/* Voice content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!inVoice ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="h-20 w-20 rounded-full bg-[color:var(--color-bg-3)] flex items-center justify-center mb-6">
              <Volume2 className="h-10 w-10 text-[color:var(--color-text-mute)]" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">{channel.name}</h3>
            <p className="text-sm text-[color:var(--color-text-dim)] mb-6 text-center max-w-md">
              Join the voice channel to start talking. Others in this channel will hear you.
            </p>
            {error && (
              <div className="mb-4 px-4 py-2 rounded-md border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 text-sm text-[color:var(--color-danger)]">
                {error}
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <label className="flex items-center gap-2 text-sm text-[color:var(--color-text-dim)]">
                <input
                  type="checkbox"
                  checked={videoOn}
                  onChange={(e) => setVideoOn(e.target.checked)}
                  className="rounded border-[color:var(--color-border)] bg-[color:var(--color-bg-0)] text-[color:var(--color-accent)] focus:ring-[color:var(--color-accent)]"
                />
                Start with video
              </label>
            </div>
            <Button onClick={handleJoin} size="lg">
              <Volume2 className="h-4 w-4" />
              Join Voice
            </Button>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Video grid */}
            <div className="flex-1 grid gap-4 auto-rows-fr" style={{ gridTemplateColumns: peerCount > 0 ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr" }}>
              {/* Local video */}
              <div className="relative bg-[color:var(--color-bg-3)] rounded-lg overflow-hidden flex items-center justify-center aspect-video">
                {videoOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <Avatar user={currentUser} size="xl" />
                    <p className="mt-3 text-sm font-medium">{currentUser.username}</p>
                    <p className="text-xs text-[color:var(--color-text-mute)]">(You)</p>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs font-medium">
                  {currentUser.username} (You)
                </div>
                {muted && (
                  <div className="absolute top-2 right-2 p-1.5 bg-[color:var(--color-danger)]/20 rounded-full">
                    <MicOff className="h-4 w-4 text-[color:var(--color-danger)]" />
                  </div>
                )}
              </div>

              {/* Remote videos */}
              {remoteStreams.map(({ peerId, stream }) => {
                return (
                  <div key={peerId} className="relative bg-[color:var(--color-bg-3)] rounded-lg overflow-hidden flex items-center justify-center aspect-video">
                    {stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled ? (
                      <video
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover"
                        ref={(el) => {
                          if (el && el.srcObject !== stream) el.srcObject = stream;
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="h-24 w-24 rounded-full bg-[color:var(--color-bg-4)] flex items-center justify-center text-2xl font-semibold">
                          ?
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs font-medium">
                      Peer
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <ControlButton
                icon={muted ? <MicOff /> : <Mic />}
                label={muted ? "Unmute" : "Mute"}
                onClick={toggleMute}
                active={muted}
                danger={muted}
              />
              <ControlButton
                icon={videoOn ? <Video /> : <VideoOff />}
                label={videoOn ? "Stop Video" : "Start Video"}
                onClick={toggleVideo}
                active={videoOn}
              />
              <ControlButton
                icon={<Monitor />}
                label="Share Screen"
                onClick={() => {
                  // Screen share not implemented in this demo
                }}
                disabled
              />
              <ControlButton
                icon={<PhoneOff />}
                label="Disconnect"
                onClick={handleLeave}
                danger
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ControlButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

function ControlButton({ icon, label, onClick, active, danger, disabled }: ControlButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg transition-all group",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        danger
          ? "bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/20"
          : active
          ? "bg-[color:var(--color-bg-4)] text-[color:var(--color-text)]"
          : "bg-[color:var(--color-bg-3)] text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)]",
      )}
      title={label}
    >
      <div className="h-5 w-5">{icon}</div>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
