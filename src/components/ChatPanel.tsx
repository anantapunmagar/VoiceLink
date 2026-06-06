import { useState, useEffect, useRef } from "react";
import { Hash, Send, Smile } from "lucide-react";
import type { Channel, Server, User, Message } from "../lib/types";
import { chatBus } from "../lib/chat";
import { Avatar } from "./ui/Avatar";
import { storage } from "../lib/storage";

interface ChatPanelProps {
  channel: Channel;
  server: Server;
  currentUser: User;
}

export function ChatPanel({ channel, server, currentUser }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const content = input.trim();
    if (!content) return;
    chatBus.sendMessage(content, currentUser.id, channel.id, server.id);
    setInput("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-[color:var(--color-border)] shadow-sm bg-[color:var(--color-bg-2)]">
        <Hash className="h-5 w-5 text-[color:var(--color-text-mute)] mr-2" />
        <h2 className="font-semibold text-[15px]">{channel.name}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-full bg-[color:var(--color-bg-3)] flex items-center justify-center mb-4">
              <Hash className="h-8 w-8 text-[color:var(--color-text-mute)]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Welcome to #{channel.name}</h3>
            <p className="text-sm text-[color:var(--color-text-dim)] max-w-md">
              This is the start of the #{channel.name} channel. Send a message to get the conversation going.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const author = storage.getUsers().find((u) => u.id === msg.authorId);
          const prevMsg = messages[idx - 1];
          const isGrouped =
            prevMsg &&
            prevMsg.authorId === msg.authorId &&
            msg.timestamp - prevMsg.timestamp < 5 * 60 * 1000; // 5 minutes

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              author={author}
              grouped={isGrouped}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6">
        <div className="relative flex items-center gap-2 bg-[color:var(--color-bg-3)] rounded-lg px-4 py-2.5 border border-[color:var(--color-border)] focus-within:border-[color:var(--color-accent)] transition-colors">
          <button className="p-1 text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] transition-colors">
            <Smile className="h-5 w-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channel.name}`}
            className="flex-1 bg-transparent text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)] focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-1.5 rounded-md text-[color:var(--color-text-mute)] hover:text-[color:var(--color-accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  author?: User;
  grouped: boolean;
}

function MessageBubble({ message, author, grouped }: MessageBubbleProps) {
  const time = new Date(message.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString([], { month: "short", day: "numeric" });

  if (grouped) {
    return (
      <div className="flex gap-4 py-0.5 pl-14 group hover:bg-[color:var(--color-bg-2)]/30 rounded">
        <span className="absolute left-4 text-[10px] text-[color:var(--color-text-mute)] opacity-0 group-hover:opacity-100 w-10 text-right">
          {timeStr}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[color:var(--color-text)] break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 py-2 group hover:bg-[color:var(--color-bg-2)]/30 rounded px-2 -mx-2 relative">
      <Avatar user={author} size="md" className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-medium text-sm text-[color:var(--color-text)]">{author?.username || "Unknown"}</span>
          <span className="text-[11px] text-[color:var(--color-text-mute)]">{dateStr} at {timeStr}</span>
        </div>
        <p className="text-sm text-[color:var(--color-text)] break-words leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
