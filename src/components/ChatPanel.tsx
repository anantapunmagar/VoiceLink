import { useState, useEffect, useRef, useCallback } from "react";
import {
  Hash,
  Send,
  Reply,
  Pencil,
  Trash2,
  X,
  CheckCheck,
  ThumbsUp,
  Heart,
  Laugh,
  Frown,
  Zap,
  Star,
} from "lucide-react";
import type { Channel, Server, User, Message } from "../lib/types";
import { chatBus } from "../lib/chat";
import { Avatar } from "./ui/Avatar";
import { storage } from "../lib/storage";
import { cn } from "../utils/cn";

interface ChatPanelProps {
  channel: Channel;
  server: Server;
  currentUser: User;
}

// Icon-based reactions instead of emojis
const QUICK_REACTIONS: Array<{ key: string; icon: React.ReactNode; label: string }> = [
  { key: "+1", icon: <ThumbsUp size={12} />, label: "Like" },
  { key: "heart", icon: <Heart size={12} />, label: "Love" },
  { key: "laugh", icon: <Laugh size={12} />, label: "Haha" },
  { key: "sad", icon: <Frown size={12} />, label: "Sad" },
  { key: "zap", icon: <Zap size={12} />, label: "Wow" },
  { key: "star", icon: <Star size={12} />, label: "Star" },
];

export function ChatPanel({ channel, server, currentUser }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Load messages
  useEffect(() => {
    const loaded = chatBus.getMessagesForChannel(channel.id);
    setMessages(loaded);
  }, [channel.id]);

  // Listen for new messages
  useEffect(() => {
    const unsub = chatBus.onMessage((msg) => {
      if (msg.channelId === channel.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return unsub;
  }, [channel.id]);

  // Listen for edits
  useEffect(() => {
    const unsub = chatBus.onEdit((msg) => {
      if (msg.channelId === channel.id) {
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      }
    });
    return unsub;
  }, [channel.id]);

  // Listen for deletes
  useEffect(() => {
    const unsub = chatBus.onDelete((msgId) => {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    });
    return unsub;
  }, []);

  // Listen for reactions
  useEffect(() => {
    const unsub = chatBus.onReaction(({ msgId, emoji, userId, add }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId) return m;
          const reactions = { ...(m.reactions ?? {}) };
          const users = reactions[emoji] ?? [];
          if (add) {
            reactions[emoji] = [...new Set([...users, userId])];
          } else {
            reactions[emoji] = users.filter((u) => u !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          }
          return { ...m, reactions };
        }),
      );
    });
    return unsub;
  }, []);

  // Listen for typing
  useEffect(() => {
    const unsub = chatBus.onTyping(({ userId, channelId, typing }) => {
      if (channelId !== channel.id || userId === currentUser.id) return;
      const users = storage.getUsers();
      const u = users.find((x) => x.id === userId);
      const name = u?.username ?? "Someone";
      setTypingUsers((prev) =>
        typing ? [...new Set([...prev, name])] : prev.filter((n) => n !== name),
      );
    });
    return unsub;
  }, [channel.id, currentUser.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      chatBus.sendTyping(currentUser.id, channel.id, true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      chatBus.sendTyping(currentUser.id, channel.id, false);
    }, 2000);
  }, [currentUser.id, channel.id]);

  function handleSend() {
    const content = input.trim();
    if (!content) return;
    chatBus.sendMessage(content, currentUser.id, channel.id, server.id, replyTo?.id);
    setInput("");
    setReplyTo(null);
    isTypingRef.current = false;
    chatBus.sendTyping(currentUser.id, channel.id, false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setReplyTo(null);
      setEditingId(null);
    }
  }

  function handleEditSave() {
    if (!editingId) return;
    const trimmed = editContent.trim();
    if (!trimmed) return;
    chatBus.editMessage(editingId, trimmed, currentUser.id);
    setEditingId(null);
    setEditContent("");
  }

  function handleDelete(msg: Message) {
    if (!confirm("Delete this message?")) return;
    chatBus.deleteMessage(msg.id, currentUser.id);
  }

  function handleReaction(msgId: string, reactionKey: string) {
    chatBus.toggleReaction(msgId, reactionKey, currentUser.id);
  }

  const allUsers = storage.getUsers();

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[color:var(--color-border)] flex-shrink-0">
        <Hash size={20} className="text-[color:var(--color-text-mute)]" />
        <div>
          <h2 className="font-semibold text-sm text-[color:var(--color-text)]">{channel.name}</h2>
          {channel.topic && (
            <p className="text-xs text-[color:var(--color-text-mute)] truncate max-w-xs">{channel.topic}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-0.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 text-center py-16">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "var(--color-bg-3)" }}
            >
              <Hash size={28} className="text-[color:var(--color-text-mute)]" />
            </div>
            <h3 className="text-lg font-semibold text-[color:var(--color-text)] mb-1">
              Welcome to #{channel.name}
            </h3>
            <p className="text-sm text-[color:var(--color-text-dim)] max-w-sm">
              {channel.topic ||
                `This is the start of the #${channel.name} channel. Send a message to get the conversation going.`}
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const author = allUsers.find((u) => u.id === msg.authorId);
          const prevMsg = messages[idx - 1];
          const isGrouped =
            prevMsg &&
            prevMsg.authorId === msg.authorId &&
            msg.timestamp - prevMsg.timestamp < 5 * 60 * 1000;
          const replyMsg = msg.replyTo ? messages.find((m) => m.id === msg.replyTo) : null;
          const replyAuthor = replyMsg ? allUsers.find((u) => u.id === replyMsg.authorId) : null;

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              author={author}
              grouped={!!isGrouped}
              replyMsg={replyMsg}
              replyAuthor={replyAuthor}
              isOwn={msg.authorId === currentUser.id}
              currentUserId={currentUser.id}
              isHovered={hoveredMsgId === msg.id}
              onHover={(id) => setHoveredMsgId(id)}
              onReply={() => {
                setReplyTo(msg);
                inputRef.current?.focus();
              }}
              onEdit={() => {
                setEditingId(msg.id);
                setEditContent(msg.content);
              }}
              onDelete={() => handleDelete(msg)}
              onReaction={(key) => handleReaction(msg.id, key)}
              isEditing={editingId === msg.id}
              editContent={editContent}
              onEditChange={setEditContent}
              onEditSave={handleEditSave}
              onEditCancel={() => {
                setEditingId(null);
                setEditContent("");
              }}
            />
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-[color:var(--color-text-mute)]">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-text-mute)] wave-bar"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : typingUsers.length === 2
                ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                : "Several people are typing..."}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply bar */}
      {replyTo && (
        <div className="mx-4 mb-1 px-3 py-2 rounded-t-lg bg-[color:var(--color-bg-3)] flex items-center gap-2 border-l-2 border-[color:var(--color-accent)]">
          <Reply size={14} className="text-[color:var(--color-accent)] flex-shrink-0" />
          <span className="text-xs text-[color:var(--color-text-dim)] truncate flex-1">
            Replying to{" "}
            <strong>
              {allUsers.find((u) => u.id === replyTo.authorId)?.username ?? "Unknown"}
            </strong>
            : {replyTo.content.slice(0, 60)}
            {replyTo.content.length > 60 ? "..." : ""}
          </span>
          <button
            onClick={() => setReplyTo(null)}
            className="text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div
          className={cn(
            "flex items-end gap-2 px-4 py-3 rounded-xl border transition-colors",
            "bg-[color:var(--color-bg-3)] border-[color:var(--color-border)]",
            "focus-within:border-[color:var(--color-accent)]",
          )}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channel.name}`}
            className="flex-1 bg-transparent text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)] focus:outline-none resize-none overflow-y-auto"
            style={{ maxHeight: 120 }}
          />
          <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                "p-2 rounded-lg transition-all",
                input.trim()
                  ? "bg-[color:var(--color-accent)] text-[color:var(--color-bg-0)] hover:brightness-110"
                  : "text-[color:var(--color-text-mute)] cursor-not-allowed",
              )}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
        <p className="text-xs text-[color:var(--color-text-mute)] mt-1.5 ml-1">
          Press{" "}
          <kbd className="px-1 py-0.5 rounded text-[10px] bg-[color:var(--color-bg-4)] border border-[color:var(--color-border)]">
            Enter
          </kbd>{" "}
          to send &middot;{" "}
          <kbd className="px-1 py-0.5 rounded text-[10px] bg-[color:var(--color-bg-4)] border border-[color:var(--color-border)]">
            Shift+Enter
          </kbd>{" "}
          for new line
        </p>
      </div>
    </div>
  );
}

// ---- Message Bubble ----

interface MessageBubbleProps {
  message: Message;
  author?: User;
  grouped: boolean;
  replyMsg?: Message | null;
  replyAuthor?: User | null;
  isOwn: boolean;
  currentUserId: string;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReaction: (key: string) => void;
  isEditing: boolean;
  editContent: string;
  onEditChange: (val: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
}

function MessageBubble({
  message,
  author,
  grouped,
  replyMsg,
  replyAuthor,
  isOwn,
  currentUserId,
  isHovered,
  onHover,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  isEditing,
  editContent,
  onEditChange,
  onEditSave,
  onEditCancel,
}: MessageBubbleProps) {
  const time = new Date(message.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <div
      className={cn(
        "group relative px-2 py-0.5 rounded-lg",
        isHovered && "bg-[color:var(--color-bg-3)]",
      )}
      onMouseEnter={() => onHover(message.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Reply context */}
      {replyMsg && (
        <div className="flex items-center gap-2 ml-10 mb-0.5 text-xs text-[color:var(--color-text-mute)]">
          <Reply size={10} className="flex-shrink-0" />
          <span className="font-medium text-[color:var(--color-text-dim)]">
            {replyAuthor?.username ?? "Unknown"}
          </span>
          <span className="truncate">
            {replyMsg.content.slice(0, 60)}
            {replyMsg.content.length > 60 ? "..." : ""}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar or time spacer */}
        {grouped ? (
          <div className="w-10 flex-shrink-0 flex items-center justify-end">
            {isHovered && (
              <span className="text-[10px] text-[color:var(--color-text-mute)] select-none leading-none">
                {timeStr}
              </span>
            )}
          </div>
        ) : (
          <Avatar user={author} size="sm" className="flex-shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          {!grouped && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-sm font-semibold text-[color:var(--color-text)]">
                {author?.username ?? "Unknown"}
              </span>
              <span className="text-[11px] text-[color:var(--color-text-mute)]">
                {dateStr} at {timeStr}
              </span>
            </div>
          )}

          {/* Message content or edit form */}
          {isEditing ? (
            <div className="mt-1">
              <textarea
                value={editContent}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onEditSave();
                  }
                  if (e.key === "Escape") onEditCancel();
                }}
                className="w-full text-sm bg-[color:var(--color-bg-0)] border border-[color:var(--color-accent)] rounded-lg p-2 text-[color:var(--color-text)] focus:outline-none resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={onEditSave}
                  className="flex items-center gap-1 text-xs text-[color:var(--color-accent)] hover:underline"
                >
                  <CheckCheck size={12} /> Save
                </button>
                <button
                  onClick={onEditCancel}
                  className="text-xs text-[color:var(--color-text-mute)] hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[color:var(--color-text)] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
              {message.edited && (
                <span className="text-[10px] text-[color:var(--color-text-mute)] ml-1.5">
                  (edited)
                </span>
              )}
            </p>
          )}

          {/* Reactions */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {Object.entries(message.reactions).map(([key, users]) => {
                const reaction = QUICK_REACTIONS.find((r) => r.key === key);
                if (!reaction) return null;
                return (
                  <button
                    key={key}
                    onClick={() => onReaction(key)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border transition-all",
                      users.includes(currentUserId)
                        ? "bg-[color:var(--color-accent)]/15 border-[color:var(--color-accent)]/40 text-[color:var(--color-accent)]"
                        : "bg-[color:var(--color-bg-4)] border-[color:var(--color-border)] text-[color:var(--color-text-dim)] hover:border-[color:var(--color-border-strong)]",
                    )}
                    title={`${reaction.label} - ${users.length}`}
                  >
                    {reaction.icon}
                    <span>{users.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action toolbar */}
      {isHovered && !isEditing && (
        <div className="absolute right-2 top-0 -translate-y-1/2 flex items-center gap-0.5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg-3)] shadow-lg p-0.5 z-10 fade-in">
          {QUICK_REACTIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => onReaction(r.key)}
              title={r.label}
              className="w-7 h-7 rounded flex items-center justify-center text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-4)] transition-colors"
            >
              {r.icon}
            </button>
          ))}
          <div className="w-px h-4 bg-[color:var(--color-border)] mx-0.5" />
          <ActionBtn icon={<Reply size={13} />} title="Reply" onClick={onReply} />
          {isOwn && (
            <>
              <ActionBtn icon={<Pencil size={13} />} title="Edit" onClick={onEdit} />
              <ActionBtn icon={<Trash2 size={13} />} title="Delete" onClick={onDelete} danger />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  icon,
  title,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "w-7 h-7 rounded flex items-center justify-center transition-colors",
        danger
          ? "text-[color:var(--color-text-mute)] hover:text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/10"
          : "text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-4)]",
      )}
    >
      {icon}
    </button>
  );
}
