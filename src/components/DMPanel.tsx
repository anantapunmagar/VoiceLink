import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Reply, Pencil, Trash2, X, CheckCheck, Phone, Video, MoreVertical } from "lucide-react";
import type { User, DirectMessage, CallState } from "../lib/types";
import { chatBus } from "../lib/chat";
import { Avatar } from "./ui/Avatar";
import { storage } from "../lib/storage";
import { generateId } from "../lib/storage";
import { startDMCall, leaveRoom, setMuted, setVideo, getLocalStream, getRemoteStreams, getPeerCount } from "../lib/voice";
import { cn } from "../utils/cn";
import { Button } from "./ui/Primitives";

interface DMPanelProps {
  currentUser: User;
  peer: User;
  onBack: () => void;
  callState: CallState;
  onCallStateChange: (s: CallState) => void;
}

export function DMPanel({ currentUser, peer, onBack, callState, onCallStateChange }: DMPanelProps) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<DirectMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  const dmChannelId = [currentUser.id, peer.id].sort().join("_");

  useEffect(() => {
    const msgs = chatBus.getDMThread(currentUser.id, peer.id);
    setMessages(msgs);
    chatBus.markDMsRead(currentUser.id, peer.id);
  }, [currentUser.id, peer.id]);

  useEffect(() => chatBus.onDM((dm) => {
    if ((dm.authorId === peer.id && dm.recipientId === currentUser.id) ||
        (dm.authorId === currentUser.id && dm.recipientId === peer.id)) {
      setMessages((prev) => [...prev, dm]);
      chatBus.markDMsRead(currentUser.id, peer.id);
    }
  }), [currentUser.id, peer.id]);

  useEffect(() => chatBus.onTyping(({ userId, channelId, typing }) => {
    if (channelId !== dmChannelId || userId !== peer.id) return;
    setTypingUsers((prev) => typing ? [...new Set([...prev, peer.username])] : prev.filter((n) => n !== peer.username));
  }), [peer.id, peer.username, dmChannelId]);

  // Call signal listener
  useEffect(() => chatBus.onCallSignal((signal) => {
    if (signal.type === "call-invite") {
      const payload = signal.payload as { callId: string; callerId: string; callerName: string; hasVideo: boolean };
      if (payload.callerId !== peer.id) return;
      onCallStateChange({ status: "ringing", callerId: payload.callerId, callerName: payload.callerName, callId: payload.callId });
    } else if (signal.type === "call-answer") {
      const payload = signal.payload as { callId: string };
      if (callState.status === "calling" && callState.callId === payload.callId) {
        onCallStateChange({ status: "active", peerId: peer.id, peerName: peer.username, callId: payload.callId, startedAt: Date.now() });
      }
    } else if (signal.type === "call-reject" || signal.type === "call-end") {
      const payload = signal.payload as { callId: string };
      if (callState.status !== "idle" && (callState as { callId?: string }).callId === payload.callId) {
        leaveRoom().then(() => onCallStateChange({ status: "idle" }));
      }
    }
  }), [callState, peer.id, peer.username, onCallStateChange]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendTypingSignal = useCallback(() => {
    if (!isTyping.current) { isTyping.current = true; chatBus.sendTyping(currentUser.id, dmChannelId, true); }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { isTyping.current = false; chatBus.sendTyping(currentUser.id, dmChannelId, false); }, 2000);
  }, [currentUser.id, dmChannelId]);

  function send() {
    const content = input.trim();
    if (!content) return;
    chatBus.sendDM(content, currentUser.id, peer.id, replyTo?.id);
    setInput(""); setReplyTo(null);
    isTyping.current = false; chatBus.sendTyping(currentUser.id, dmChannelId, false);
    inputRef.current?.focus();
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === "Escape") { setReplyTo(null); setEditingId(null); }
  }

  function saveEdit() {
    if (!editingId) return;
    const trimmed = editContent.trim();
    if (!trimmed) return;
    const all = storage.getDMs();
    const idx = all.findIndex((d) => d.id === editingId && d.authorId === currentUser.id);
    if (idx >= 0) { all[idx] = { ...all[idx], content: trimmed, edited: true }; storage.setDMs(all); }
    setMessages((prev) => prev.map((m) => m.id === editingId ? { ...m, content: trimmed, edited: true } : m));
    setEditingId(null); setEditContent("");
  }

  function deleteMsg(id: string) {
    if (!confirm("Delete this message?")) return;
    const all = storage.getDMs().filter((d) => d.id !== id);
    storage.setDMs(all);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  async function startCall(withVideo: boolean) {
    const callId = generateId();
    const payload = { callId, callerId: currentUser.id, callerName: currentUser.username, hasVideo: withVideo };
    chatBus.sendCallSignal("call-invite", payload, currentUser.id);
    try {
      await startDMCall(callId, currentUser.id, {
        video: withVideo,
        events: { onPeersChanged: () => {}, onError: () => leaveRoom().then(() => onCallStateChange({ status: "idle" })) },
      });
      onCallStateChange({ status: "calling", peerId: peer.id, peerName: peer.username, callId });
    } catch { onCallStateChange({ status: "idle" }); }
  }

  async function answerCall() {
    if (callState.status !== "ringing") return;
    const { callId } = callState;
    chatBus.sendCallSignal("call-answer", { callId }, currentUser.id);
    try {
      await startDMCall(callId, currentUser.id, {
        video: false,
        events: { onPeersChanged: () => {}, onError: () => leaveRoom().then(() => onCallStateChange({ status: "idle" })) },
      });
      onCallStateChange({ status: "active", peerId: peer.id, peerName: peer.username, callId, startedAt: Date.now() });
    } catch { onCallStateChange({ status: "idle" }); }
  }

  function rejectCall() {
    if (callState.status !== "ringing") return;
    chatBus.sendCallSignal("call-reject", { callId: callState.callId }, currentUser.id);
    onCallStateChange({ status: "idle" });
  }

  function endCall() {
    if (callState.status === "idle") return;
    const callId = (callState as { callId?: string }).callId;
    if (callId) chatBus.sendCallSignal("call-end", { callId }, currentUser.id);
    leaveRoom().then(() => onCallStateChange({ status: "idle" }));
  }

  const isInCall = callState.status === "active";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[color:var(--color-border)] flex-shrink-0 bg-[color:var(--color-bg-2)]">
        <button onClick={onBack} className="lg:hidden p-1.5 rounded-lg text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-4)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <Avatar user={peer} size="sm" showStatus />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[color:var(--color-text)] truncate">{peer.username}</p>
          <p className="text-xs text-[color:var(--color-text-mute)] capitalize">{peer.status}</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => startCall(false)} disabled={callState.status !== "idle"}
            className="p-2 rounded-lg text-[color:var(--color-text-mute)] hover:text-[color:var(--color-success)] hover:bg-[color:var(--color-success)]/10 transition-colors disabled:opacity-40" title="Voice call">
            <Phone size={16} />
          </button>
          <button onClick={() => startCall(true)} disabled={callState.status !== "idle"}
            className="p-2 rounded-lg text-[color:var(--color-text-mute)] hover:text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)] transition-colors disabled:opacity-40" title="Video call">
            <Video size={16} />
          </button>
        </div>
      </div>

      {/* Incoming call banner */}
      {callState.status === "ringing" && (
        <div className="flex items-center justify-between px-4 py-3 bg-[color:var(--color-success)]/10 border-b border-[color:var(--color-success)]/20 animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-success)] pulse-dot" />
            <p className="text-sm font-medium text-[color:var(--color-text)]">Incoming call from <strong>{callState.callerName}</strong></p>
          </div>
          <div className="flex gap-2">
            <Button size="xs" variant="success" onClick={answerCall}>Answer</Button>
            <Button size="xs" variant="danger" onClick={rejectCall}>Decline</Button>
          </div>
        </div>
      )}
      {callState.status === "calling" && (
        <div className="flex items-center justify-between px-4 py-3 bg-[color:var(--color-accent-soft)] border-b border-[color:var(--color-accent)]/20 animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-accent)] pulse-dot" />
            <p className="text-sm font-medium text-[color:var(--color-text)]">Calling <strong>{peer.username}</strong>...</p>
          </div>
          <Button size="xs" variant="danger" onClick={endCall}>Cancel</Button>
        </div>
      )}

      {/* Active call bar */}
      {isInCall && (
        <ActiveCallBar peer={peer} callState={callState} onEnd={endCall} currentUser={currentUser} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-0.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Avatar user={peer} size="xl" className="mb-4" />
            <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-1">{peer.username}</h3>
            <p className="text-sm text-[color:var(--color-text-dim)]">This is the start of your conversation with {peer.username}.</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const prev = messages[idx - 1];
          const grouped = prev && prev.authorId === msg.authorId && msg.timestamp - prev.timestamp < 5 * 60 * 1000;
          const isOwn = msg.authorId === currentUser.id;
          const author = isOwn ? currentUser : peer;
          const replyMsg = msg.replyTo ? messages.find((m) => m.id === msg.replyTo) : null;
          return (
            <DMBubble key={msg.id} msg={msg} author={author} grouped={!!grouped} isOwn={isOwn}
              replyMsg={replyMsg} replyAuthor={replyMsg ? (replyMsg.authorId === currentUser.id ? currentUser : peer) : null}
              isHovered={hoveredId === msg.id} onHover={setHoveredId}
              isEditing={editingId === msg.id} editContent={editContent} onEditChange={setEditContent}
              onEditSave={saveEdit} onEditCancel={() => { setEditingId(null); setEditContent(""); }}
              onReply={() => { setReplyTo(msg); inputRef.current?.focus(); }}
              onEdit={() => { setEditingId(msg.id); setEditContent(msg.content); }}
              onDelete={() => deleteMsg(msg.id)} />
          );
        })}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-[color:var(--color-text-mute)]">
            <div className="flex gap-0.5">{[0,1,2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-text-mute)] wave-bar" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
            <span>{typingUsers[0]} is typing...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      {replyTo && (
        <div className="mx-4 mb-1 px-3 py-2 rounded-t-lg bg-[color:var(--color-bg-4)] flex items-center gap-2 border-l-2 border-[color:var(--color-accent)]">
          <Reply size={13} className="text-[color:var(--color-accent)] flex-shrink-0" />
          <span className="text-xs text-[color:var(--color-text-dim)] truncate flex-1">
            Replying to <strong>{replyTo.authorId === currentUser.id ? "yourself" : peer.username}</strong>: {replyTo.content.slice(0, 55)}{replyTo.content.length > 55 ? "..." : ""}
          </span>
          <button onClick={() => setReplyTo(null)} className="text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] transition-colors"><X size={13} /></button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 safe-bottom flex-shrink-0">
        <div className="flex items-end gap-2 px-3 py-2.5 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-4)] focus-within:border-[color:var(--color-accent)] transition-colors">
          <textarea ref={inputRef} rows={1} value={input}
            onChange={(e) => { setInput(e.target.value); sendTypingSignal(); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
            onKeyDown={onKey} placeholder={`Message ${peer.username}`}
            className="flex-1 bg-transparent text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)] focus:outline-none resize-none overflow-y-auto" style={{ maxHeight: 120 }} />
          <button onClick={send} disabled={!input.trim()}
            className={cn("p-1.5 rounded-lg transition-all flex-shrink-0", input.trim() ? "bg-[color:var(--color-accent)] text-white hover:bg-[color:var(--color-accent-hover)]" : "text-[color:var(--color-text-mute)] cursor-not-allowed")}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- DM Bubble ----
function DMBubble({ msg, author, grouped, isOwn, replyMsg, replyAuthor, isHovered, onHover, isEditing, editContent, onEditChange, onEditSave, onEditCancel, onReply, onEdit, onDelete }: {
  msg: DirectMessage; author: User; grouped: boolean; isOwn: boolean;
  replyMsg?: DirectMessage | null; replyAuthor?: User | null;
  isHovered: boolean; onHover: (id: string | null) => void;
  isEditing: boolean; editContent: string; onEditChange: (v: string) => void;
  onEditSave: () => void; onEditCancel: () => void;
  onReply: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const time = new Date(msg.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <div className={cn("group relative px-2 py-0.5 rounded-lg", isHovered && "bg-[color:var(--color-bg-4)]")}
      onMouseEnter={() => onHover(msg.id)} onMouseLeave={() => onHover(null)}>
      {replyMsg && (
        <div className="flex items-center gap-2 ml-10 mb-0.5 text-xs text-[color:var(--color-text-mute)]">
          <Reply size={10} className="flex-shrink-0" />
          <span className="font-medium text-[color:var(--color-text-dim)]">{replyAuthor?.username ?? "Unknown"}</span>
          <span className="truncate">{replyMsg.content.slice(0, 55)}{replyMsg.content.length > 55 ? "..." : ""}</span>
        </div>
      )}
      <div className="flex gap-3">
        {grouped ? (
          <div className="w-8 flex-shrink-0 flex items-center justify-end">{isHovered && <span className="text-[10px] text-[color:var(--color-text-mute)]">{timeStr}</span>}</div>
        ) : (
          <Avatar user={author} size="sm" className="flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          {!grouped && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-sm font-semibold text-[color:var(--color-text)]">{author.username}</span>
              <span className="text-[11px] text-[color:var(--color-text-mute)]">{dateStr} at {timeStr}</span>
            </div>
          )}
          {isEditing ? (
            <div className="mt-1">
              <textarea value={editContent} onChange={(e) => onEditChange(e.target.value)} rows={2} autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEditSave(); } if (e.key === "Escape") onEditCancel(); }}
                className="w-full text-sm bg-[color:var(--color-bg-2)] border border-[color:var(--color-accent)] rounded-lg p-2 text-[color:var(--color-text)] focus:outline-none resize-none" />
              <div className="flex gap-2 mt-1">
                <button onClick={onEditSave} className="flex items-center gap-1 text-xs text-[color:var(--color-accent)] hover:underline"><CheckCheck size={12} /> Save</button>
                <button onClick={onEditCancel} className="text-xs text-[color:var(--color-text-mute)] hover:underline">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text)] leading-relaxed whitespace-pre-wrap break-words">
              {msg.content}{msg.edited && <span className="text-[10px] text-[color:var(--color-text-mute)] ml-1.5">(edited)</span>}
            </p>
          )}
        </div>
      </div>
      {isHovered && !isEditing && (
        <div className="absolute right-2 top-0 -translate-y-1/2 flex items-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-4)] shadow-lg p-0.5 z-10 animate-fade-in">
          <Btn icon={<Reply size={13} />} title="Reply" onClick={onReply} />
          {isOwn && <>
            <Btn icon={<Pencil size={13} />} title="Edit" onClick={onEdit} />
            <Btn icon={<Trash2 size={13} />} title="Delete" onClick={onDelete} danger />
          </>}
        </div>
      )}
    </div>
  );
}

function Btn({ icon, title, onClick, danger }: { icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title}
      className={cn("w-7 h-7 rounded flex items-center justify-center transition-colors",
        danger ? "text-[color:var(--color-text-mute)] hover:text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)]"
               : "text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-5)]")}>
      {icon}
    </button>
  );
}

// ---- Active Call Bar ----
function ActiveCallBar({ peer, callState, onEnd, currentUser }: { peer: User; callState: CallState; onEnd: () => void; currentUser: User }) {
  const [muted, setMutedState] = useState(false);
  const [videoOn, setVideoOnState] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const stream = getLocalStream();
    if (stream && localVideoRef.current) localVideoRef.current.srcObject = stream;
    const remote = getRemoteStreams()[0];
    if (remote && remoteVideoRef.current) remoteVideoRef.current.srcObject = remote.stream;
  });

  function toggleMute() { setMutedState((m) => { setMuted(!m); return !m; }); }
  async function toggleVideo() { setVideoOnState((v) => { setVideo(!v); return !v; }); }

  const startedAt = callState.status === "active" ? callState.startedAt : Date.now();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="bg-[color:var(--color-bg-1)] border-b border-[color:var(--color-border)] p-3">
      <div className="flex items-center gap-3">
        {/* Video tiles */}
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative rounded-lg overflow-hidden bg-[color:var(--color-bg-4)]" style={{ width: 80, height: 56 }}>
            {videoOn
              ? <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Avatar user={currentUser} size="xs" /></div>}
            <span className="absolute bottom-0.5 left-1 text-[10px] text-white/70">You</span>
          </div>
          <div className="relative rounded-lg overflow-hidden bg-[color:var(--color-bg-4)]" style={{ width: 80, height: 56 }}>
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center" style={{ display: getPeerCount() > 0 ? "none" : "flex" }}>
              <Avatar user={peer} size="xs" />
            </div>
            <span className="absolute bottom-0.5 left-1 text-[10px] text-white/70">{peer.username}</span>
          </div>
        </div>

        {/* Info + controls */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs font-mono text-[color:var(--color-success)]">{fmt(elapsed)}</span>
          <div className="flex items-center gap-1">
            <button onClick={toggleMute}
              className={cn("p-1.5 rounded-lg transition-colors", muted ? "bg-[color:var(--color-danger)] text-white" : "bg-[color:var(--color-bg-4)] text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)]")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {muted ? <><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>
                : <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>}
              </svg>
            </button>
            <button onClick={toggleVideo}
              className={cn("p-1.5 rounded-lg transition-colors", videoOn ? "bg-[color:var(--color-accent)] text-white" : "bg-[color:var(--color-bg-4)] text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)]")}>
              <Video size={14} />
            </button>
            <button onClick={onEnd} className="p-1.5 rounded-lg bg-[color:var(--color-danger)] text-white hover:brightness-110 transition-all">
              <Phone size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
