import { useState, useEffect, useRef, useCallback } from "react";
import { Hash, Send, Reply, Pencil, Trash2, X, CheckCheck, ThumbsUp, Heart, Laugh, Frown, Zap, Star } from "lucide-react";
import type { Channel, Server, User, Message } from "../lib/types";
import { chatBus } from "../lib/chat";
import { Avatar } from "./ui/Avatar";
import { storage } from "../lib/storage";
import { cn } from "../utils/cn";

interface ChatPanelProps { channel: Channel; server: Server; currentUser: User; onBack?: () => void; }

const REACTIONS = [
  { key: "+1",    icon: <ThumbsUp size={12} />, label: "Like"  },
  { key: "heart", icon: <Heart    size={12} />, label: "Love"  },
  { key: "laugh", icon: <Laugh    size={12} />, label: "Haha"  },
  { key: "sad",   icon: <Frown    size={12} />, label: "Sad"   },
  { key: "zap",   icon: <Zap      size={12} />, label: "Wow"   },
  { key: "star",  icon: <Star     size={12} />, label: "Star"  },
];

export function ChatPanel({ channel, server, currentUser, onBack }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  useEffect(() => { setMessages(chatBus.getMessagesForChannel(channel.id)); }, [channel.id]);
  useEffect(() => chatBus.onMessage((msg) => { if (msg.channelId === channel.id) setMessages((p) => [...p, msg]); }), [channel.id]);
  useEffect(() => chatBus.onEdit((msg) => { if (msg.channelId === channel.id) setMessages((p) => p.map((m) => m.id === msg.id ? msg : m)); }), [channel.id]);
  useEffect(() => chatBus.onDelete((id) => setMessages((p) => p.filter((m) => m.id !== id))), []);
  useEffect(() => chatBus.onReaction(({ msgId, key, userId, add }) => {
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      const r = { ...(m.reactions ?? {}) };
      const users = r[key] ?? [];
      r[key] = add ? [...new Set([...users, userId])] : users.filter((u) => u !== userId);
      if (!r[key].length) delete r[key];
      return { ...m, reactions: r };
    }));
  }), []);
  useEffect(() => chatBus.onTyping(({ userId, channelId, typing }) => {
    if (channelId !== channel.id || userId === currentUser.id) return;
    const u = storage.getUsers().find((x) => x.id === userId);
    const name = u?.username ?? "Someone";
    setTypingUsers((p) => typing ? [...new Set([...p, name])] : p.filter((n) => n !== name));
  }), [channel.id, currentUser.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendTypingSignal = useCallback(() => {
    if (!isTyping.current) { isTyping.current = true; chatBus.sendTyping(currentUser.id, channel.id, true); }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { isTyping.current = false; chatBus.sendTyping(currentUser.id, channel.id, false); }, 2000);
  }, [currentUser.id, channel.id]);

  function send() {
    const content = input.trim();
    if (!content) return;
    chatBus.sendMessage(content, currentUser.id, channel.id, server.id, replyTo?.id);
    setInput(""); setReplyTo(null);
    isTyping.current = false; chatBus.sendTyping(currentUser.id, channel.id, false);
    inputRef.current?.focus();
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === "Escape") { setReplyTo(null); setEditingId(null); }
  }

  function saveEdit() {
    if (!editingId) return;
    chatBus.editMessage(editingId, editContent.trim(), currentUser.id);
    setEditingId(null); setEditContent("");
  }

  const allUsers = storage.getUsers();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[color:var(--color-border)] flex-shrink-0 bg-[color:var(--color-bg-2)]">
        {onBack && (
          <button onClick={onBack} className="lg:hidden p-1.5 rounded-lg text-[color:var(--color-text-mute)] hover:bg-[color:var(--color-bg-4)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        <Hash size={18} className="text-[color:var(--color-text-mute)]" />
        <div>
          <h2 className="text-sm font-semibold text-[color:var(--color-text)]">{channel.name}</h2>
          {channel.topic && <p className="text-xs text-[color:var(--color-text-mute)] truncate max-w-[200px] lg:max-w-xs">{channel.topic}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-14 w-14 rounded-full flex items-center justify-center mb-3 bg-[color:var(--color-bg-4)]">
              <Hash size={24} className="text-[color:var(--color-text-mute)]" />
            </div>
            <h3 className="text-base font-semibold text-[color:var(--color-text)] mb-1">Welcome to #{channel.name}</h3>
            <p className="text-sm text-[color:var(--color-text-dim)] max-w-xs">{channel.topic || "This is the start of this channel."}</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const author = allUsers.find((u) => u.id === msg.authorId);
          const prev = messages[idx - 1];
          const grouped = prev && prev.authorId === msg.authorId && msg.timestamp - prev.timestamp < 5 * 60 * 1000;
          const replyMsg = msg.replyTo ? messages.find((m) => m.id === msg.replyTo) : null;
          const replyAuthor = replyMsg ? allUsers.find((u) => u.id === replyMsg.authorId) : null;
          return (
            <MsgBubble key={msg.id} message={msg} author={author} grouped={!!grouped}
              replyMsg={replyMsg} replyAuthor={replyAuthor}
              isOwn={msg.authorId === currentUser.id} currentUserId={currentUser.id}
              isHovered={hoveredId === msg.id} onHover={setHoveredId}
              onReply={() => { setReplyTo(msg); inputRef.current?.focus(); }}
              onEdit={() => { setEditingId(msg.id); setEditContent(msg.content); }}
              onDelete={() => { if (confirm("Delete this message?")) chatBus.deleteMessage(msg.id, currentUser.id); }}
              onReaction={(key) => chatBus.toggleReaction(msg.id, key, currentUser.id)}
              isEditing={editingId === msg.id} editContent={editContent}
              onEditChange={setEditContent} onEditSave={saveEdit}
              onEditCancel={() => { setEditingId(null); setEditContent(""); }} />
          );
        })}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-[color:var(--color-text-mute)]">
            <div className="flex gap-0.5">{[0,1,2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-text-mute)] wave-bar" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
            <span>{typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : "Several people are typing..."}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="mx-4 mb-1 px-3 py-2 rounded-t-lg bg-[color:var(--color-bg-4)] flex items-center gap-2 border-l-2 border-[color:var(--color-accent)]">
          <Reply size={13} className="text-[color:var(--color-accent)] flex-shrink-0" />
          <span className="text-xs text-[color:var(--color-text-dim)] truncate flex-1">
            Replying to <strong>{allUsers.find((u) => u.id === replyTo.authorId)?.username ?? "Unknown"}</strong>: {replyTo.content.slice(0, 50)}{replyTo.content.length > 50 ? "..." : ""}
          </span>
          <button onClick={() => setReplyTo(null)} className="text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] transition-colors"><X size={13} /></button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 safe-bottom flex-shrink-0">
        <div className="flex items-end gap-2 px-3 py-2.5 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-4)] focus-within:border-[color:var(--color-accent)] transition-colors">
          <textarea ref={inputRef} rows={1} value={input}
            onChange={(e) => { setInput(e.target.value); sendTypingSignal(); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
            onKeyDown={onKey} placeholder={`Message #${channel.name}`}
            className="flex-1 bg-transparent text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)] focus:outline-none resize-none overflow-y-auto" style={{ maxHeight: 120 }} />
          <button onClick={send} disabled={!input.trim()}
            className={cn("p-1.5 rounded-lg transition-all flex-shrink-0", input.trim() ? "bg-[color:var(--color-accent)] text-white hover:bg-[color:var(--color-accent-hover)]" : "text-[color:var(--color-text-mute)] cursor-not-allowed")}>
            <Send size={15} />
          </button>
        </div>
        <p className="text-[10px] text-[color:var(--color-text-mute)] mt-1.5 ml-1 hidden lg:block">
          Enter to send &middot; Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ---- Message Bubble ----
function MsgBubble({ message, author, grouped, replyMsg, replyAuthor, isOwn, currentUserId, isHovered, onHover, onReply, onEdit, onDelete, onReaction, isEditing, editContent, onEditChange, onEditSave, onEditCancel }: {
  message: Message; author?: User; grouped: boolean;
  replyMsg?: Message | null; replyAuthor?: User | null;
  isOwn: boolean; currentUserId: string;
  isHovered: boolean; onHover: (id: string | null) => void;
  onReply: () => void; onEdit: () => void; onDelete: () => void; onReaction: (key: string) => void;
  isEditing: boolean; editContent: string; onEditChange: (v: string) => void; onEditSave: () => void; onEditCancel: () => void;
}) {
  const time = new Date(message.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <div className={cn("group relative px-2 py-0.5 rounded-lg", isHovered && "bg-[color:var(--color-bg-4)]")}
      onMouseEnter={() => onHover(message.id)} onMouseLeave={() => onHover(null)}>
      {replyMsg && (
        <div className="flex items-center gap-2 ml-10 mb-0.5 text-xs text-[color:var(--color-text-mute)]">
          <Reply size={10} className="flex-shrink-0" />
          <span className="font-medium text-[color:var(--color-text-dim)]">{replyAuthor?.username ?? "Unknown"}</span>
          <span className="truncate">{replyMsg.content.slice(0, 50)}{replyMsg.content.length > 50 ? "..." : ""}</span>
        </div>
      )}
      <div className="flex gap-2.5">
        {grouped
          ? <div className="w-8 flex-shrink-0 flex items-center justify-end">{isHovered && <span className="text-[10px] text-[color:var(--color-text-mute)]">{timeStr}</span>}</div>
          : <Avatar user={author} size="sm" className="flex-shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          {!grouped && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-sm font-semibold text-[color:var(--color-text)]">{author?.username ?? "Unknown"}</span>
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
              {message.content}{message.edited && <span className="text-[10px] text-[color:var(--color-text-mute)] ml-1">(edited)</span>}
            </p>
          )}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {Object.entries(message.reactions).map(([key, users]) => {
                const r = REACTIONS.find((x) => x.key === key);
                if (!r || !users.length) return null;
                return (
                  <button key={key} onClick={() => onReaction(key)}
                    className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border transition-all",
                      users.includes(currentUserId)
                        ? "bg-[color:var(--color-accent-soft)] border-[color:var(--color-accent)]/40 text-[color:var(--color-accent)]"
                        : "bg-[color:var(--color-bg-5)] border-[color:var(--color-border)] text-[color:var(--color-text-dim)] hover:border-[color:var(--color-border-strong)]")}
                    title={`${r.label} - ${users.length}`}>
                    {r.icon}<span>{users.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {isHovered && !isEditing && (
        <div className="absolute right-2 top-0 -translate-y-1/2 flex items-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-4)] shadow-lg p-0.5 z-10 animate-fade-in">
          {REACTIONS.map((r) => (
            <button key={r.key} onClick={() => onReaction(r.key)} title={r.label}
              className="w-7 h-7 rounded flex items-center justify-center text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-5)] transition-colors">
              {r.icon}
            </button>
          ))}
          <div className="w-px h-4 bg-[color:var(--color-border)] mx-0.5" />
          <MsgBtn icon={<Reply size={13} />} title="Reply" onClick={onReply} />
          {isOwn && <>
            <MsgBtn icon={<Pencil size={13} />} title="Edit" onClick={onEdit} />
            <MsgBtn icon={<Trash2 size={13} />} title="Delete" onClick={onDelete} danger />
          </>}
        </div>
      )}
    </div>
  );
}

function MsgBtn({ icon, title, onClick, danger }: { icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title}
      className={cn("w-7 h-7 rounded flex items-center justify-center transition-colors",
        danger ? "text-[color:var(--color-text-mute)] hover:text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)]"
               : "text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-5)]")}>
      {icon}
    </button>
  );
}
