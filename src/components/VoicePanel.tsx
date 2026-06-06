import { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, Users } from 'lucide-react';
import type { Channel, Server, User } from '../lib/types';
import {
  joinVoiceRoom,
  leaveRoom,
  setMuted,
  setDeafened,
  setVideo,
  shareScreen,
  getLocalStream,
  getRemoteStreams,
  getPeerCount,
  getCurrentRoomId,
} from '../lib/voice';
import { storage } from '../lib/storage';
import { Avatar } from './ui/Avatar';
import { cn } from '../utils/cn';
import { sfx } from '../utils/audio';

interface VoicePanelProps {
  channel: Channel;
  server: Server;
  currentUser: User;
  onBack?: () => void;
}

export function VoicePanel({ channel, server, currentUser, onBack }: VoicePanelProps) {
  const [inVoice, setInVoice] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [deafened, setDeafenedState] = useState(false);
  const [videoOn, setVideoOnState] = useState(false);
  const [sharing, setSharingState] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [showMembers, setShowMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startWithVideo, setStartWithVideo] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (getCurrentRoomId() === channel.id) {
      setInVoice(true);
      setPeerCount(getPeerCount());
    }
  }, [channel.id]);

  useEffect(() => {
    if (!inVoice) return;
    const stream = getLocalStream();
    if (stream && localRef.current) localRef.current.srcObject = stream;
  });

  async function join() {
    setError(null);
    setConnecting(true);
    try {
      await joinVoiceRoom(channel.id, currentUser.id, {
        video: startWithVideo,
        events: {
          onJoined: () => {
            setInVoice(true);
            setConnecting(false);
            setPeerCount(getPeerCount());
            if (currentUser.notifySounds ?? true) {
              sfx.playJoin();
            }
          },
          onPeersChanged: () => {
            setPeerCount(getPeerCount());
            forceUpdate((n) => n + 1);
          },
          onError: (e) => {
            setError(e.message || 'Could not access microphone.');
            setConnecting(false);
          },
        },
      });
      if (startWithVideo) setVideoOnState(true);
    } catch {
      setConnecting(false);
      setError('Could not access microphone. Check your browser permissions.');
    }
  }

  async function leave() {
    await leaveRoom();
    setInVoice(false);
    setMutedState(false);
    setDeafenedState(false);
    setVideoOnState(false);
    setSharingState(false);
    setPeerCount(0);
    if (currentUser.notifySounds ?? true) {
      sfx.playLeave();
    }
  }

  function toggleMute() {
    setMutedState((m) => {
      setMuted(!m);
      if (currentUser.notifySounds ?? true) {
        if (!m) sfx.playMute();
        else sfx.playUnmute();
      }
      return !m;
    });
  }
  function toggleDeafen() {
    setDeafenedState((d) => {
      setDeafened(!d);
      return !d;
    });
  }
  async function toggleVideo() {
    setVideoOnState((v) => {
      setVideo(!v);
      return !v;
    });
  }
  async function toggleShare() {
    if (!sharing) {
      const ok = await shareScreen();
      setSharingState(ok);
    } else setSharingState(false);
  }

  const remoteStreams = inVoice ? getRemoteStreams() : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[color:var(--color-border)] flex-shrink-0 bg-[color:var(--color-bg-2)]">
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-1.5 rounded-lg text-[color:var(--color-text-mute)] hover:bg-[color:var(--color-bg-4)] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <Volume2 size={18} className="text-[color:var(--color-text-mute)]" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-[color:var(--color-text)] truncate">
            {channel.name}
          </h2>
          {inVoice && (
            <p className="text-xs text-[color:var(--color-success)]">{peerCount + 1} connected</p>
          )}
        </div>
        <button
          onClick={() => setShowMembers(!showMembers)}
          className={cn(
            'p-1.5 rounded-lg transition-colors hidden lg:block',
            showMembers
              ? 'bg-[color:var(--color-bg-4)] text-[color:var(--color-text)]'
              : 'text-[color:var(--color-text-mute)] hover:bg-[color:var(--color-bg-4)] hover:text-[color:var(--color-text)]'
          )}
        >
          <Users size={18} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto p-4">
            {!inVoice ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-5">
                <div className="h-16 w-16 rounded-full flex items-center justify-center bg-[color:var(--color-bg-4)]">
                  <Volume2 size={28} className="text-[color:var(--color-text-mute)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-1">
                    {channel.name}
                  </h3>
                  <p className="text-sm text-[color:var(--color-text-dim)] max-w-xs">
                    Join this voice channel to talk with others live.
                  </p>
                </div>
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-[color:var(--color-danger-soft)] border border-[color:var(--color-danger)]/20 text-sm text-[color:var(--color-danger)] max-w-xs text-left">
                    {error}
                  </div>
                )}
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[color:var(--color-bg-4)] border border-[color:var(--color-border)] cursor-pointer hover:border-[color:var(--color-border-strong)] transition-colors">
                    <input
                      type="checkbox"
                      checked={startWithVideo}
                      onChange={(e) => setStartWithVideo(e.target.checked)}
                      className="rounded"
                    />
                    <Video size={15} className="text-[color:var(--color-text-dim)]" />
                    <span className="text-sm text-[color:var(--color-text-dim)]">
                      Start with camera on
                    </span>
                  </label>
                  <button
                    onClick={join}
                    disabled={connecting}
                    className={cn(
                      'h-11 rounded-xl font-semibold text-sm transition-all',
                      connecting
                        ? 'bg-[color:var(--color-bg-4)] text-[color:var(--color-text-mute)] cursor-wait'
                        : 'bg-[color:var(--color-success)] text-white hover:brightness-110'
                    )}
                  >
                    {connecting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </span>
                    ) : (
                      'Join Voice'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full gap-4">
                {/* Video grid */}
                <div
                  className="flex-1 grid gap-3"
                  style={{
                    gridTemplateColumns:
                      remoteStreams.length > 0 ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
                  }}
                >
                  <VideoTile
                    label={`${currentUser.username} (You)`}
                    isLocal
                    muted={muted}
                    videoEnabled={videoOn}
                    videoRef={localRef}
                    user={currentUser}
                  />
                  {remoteStreams.map(({ peerId, stream }) => (
                    <VideoTile
                      key={peerId}
                      label="Peer"
                      isLocal={false}
                      muted={false}
                      videoEnabled={
                        stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled
                      }
                      onVideoRef={(el) => {
                        if (el) {
                          remoteRefs.current.set(peerId, el);
                          if (el.srcObject !== stream) el.srcObject = stream;
                        }
                      }}
                    />
                  ))}
                </div>
                {/* Controls */}
                <div className="flex items-center justify-center gap-3 pb-2 flex-wrap flex-shrink-0">
                  <VoiceBtn
                    icon={muted ? <MicOff size={18} /> : <Mic size={18} />}
                    label={muted ? 'Unmute' : 'Mute'}
                    onClick={toggleMute}
                    active={muted}
                    danger={muted}
                  />
                  <VoiceBtn
                    icon={<Volume2 size={18} />}
                    label={deafened ? 'Undeafen' : 'Deafen'}
                    onClick={toggleDeafen}
                    active={deafened}
                  />
                  <VoiceBtn
                    icon={videoOn ? <VideoOff size={18} /> : <Video size={18} />}
                    label={videoOn ? 'Stop Video' : 'Video'}
                    onClick={toggleVideo}
                    active={videoOn}
                  />
                  <VoiceBtn
                    icon={<Monitor size={18} />}
                    label={sharing ? 'Stop Share' : 'Share'}
                    onClick={toggleShare}
                    active={sharing}
                  />
                  <VoiceBtn
                    icon={<PhoneOff size={18} />}
                    label="Leave"
                    onClick={leave}
                    danger
                    large
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Members */}
        {showMembers && (
          <div className="w-60 border-l border-[color:var(--color-border)] bg-[color:var(--color-bg-1)] flex-shrink-0 flex flex-col hidden lg:flex animate-slide-left">
            <div className="px-4 py-3 border-b border-[color:var(--color-border)] flex-shrink-0">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)]">
                Members &mdash; {server.members.length}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {server.members.map((id) => {
                const allUsers = storage.getUsers();
                const u = allUsers.find((x) => x.id === id);
                if (!u) return null;
                const statusColor =
                  u.status === 'online'
                    ? 'bg-[color:var(--color-success)]'
                    : u.status === 'idle'
                      ? 'bg-[color:var(--color-warn)]'
                      : u.status === 'dnd'
                        ? 'bg-[color:var(--color-danger)]'
                        : 'bg-[color:var(--color-text-mute)]';
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[color:var(--color-bg-3)] transition-colors cursor-pointer mb-0.5 group"
                  >
                    <div className="relative">
                      <Avatar user={u} size="sm" />
                      <div
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-[color:var(--color-bg-1)] rounded-full group-hover:border-[color:var(--color-bg-3)] transition-colors',
                          statusColor
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[color:var(--color-text)] truncate">
                        {u.username}
                      </p>
                      {u.customStatus && (
                        <p className="text-[10px] text-[color:var(--color-text-mute)] truncate">
                          {u.customStatus}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoTile({
  label,
  isLocal,
  muted,
  videoEnabled,
  user,
  videoRef,
  onVideoRef,
}: {
  label: string;
  isLocal: boolean;
  muted: boolean;
  videoEnabled: boolean;
  user?: User;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onVideoRef?: (el: HTMLVideoElement | null) => void;
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex items-center justify-center bg-[color:var(--color-bg-4)]"
      style={{ minHeight: 180 }}
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
        <div className="flex flex-col items-center gap-2 p-4">
          {user ? (
            <Avatar user={user} size="lg" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-[color:var(--color-bg-5)] flex items-center justify-center text-xl font-bold text-[color:var(--color-text-mute)]">
              ?
            </div>
          )}
          <span className="text-xs text-[color:var(--color-text-dim)]">{label}</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-black/50 text-white/80 backdrop-blur-sm">
          {label}
        </span>
        {muted && (
          <span className="p-0.5 rounded bg-[color:var(--color-danger)]/80">
            <MicOff size={9} className="text-white" />
          </span>
        )}
      </div>
    </div>
  );
}

function VoiceBtn({
  icon,
  label,
  onClick,
  active,
  danger,
  disabled,
  large,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  large?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center rounded-xl transition-all',
          large ? 'h-13 w-13' : 'h-11 w-11',
          danger
            ? 'bg-[color:var(--color-danger)] text-white hover:brightness-110'
            : active
              ? 'bg-[color:var(--color-bg-5)] text-[color:var(--color-accent)] border border-[color:var(--color-accent)]/30'
              : 'bg-[color:var(--color-bg-4)] text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-bg-5)] hover:text-[color:var(--color-text)]',
          disabled && 'opacity-40 cursor-not-allowed'
        )}
      >
        {icon}
      </button>
      <span className="text-[10px] text-[color:var(--color-text-mute)]">{label}</span>
    </div>
  );
}
