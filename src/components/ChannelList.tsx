import { Hash, Volume2, ChevronDown, Plus } from "lucide-react";
import type { Server, Channel } from "../lib/types";
import { cn } from "../utils/cn";
import { useState } from "react";
import { generateId } from "../lib/storage";
import { storage } from "../lib/storage";

interface ChannelListProps {
  server: Server;
  selectedChannelId: string;
  onSelect: (channelId: string) => void;
}

export function ChannelList({ server, selectedChannelId, onSelect }: ChannelListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"text" | "voice">("text");

  const textChannels = server.channels.filter((c) => c.type === "text");
  const voiceChannels = server.channels.filter((c) => c.type === "voice");

  function handleAddChannel() {
    const name = newName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return;
    const channel: Channel = {
      id: generateId(),
      name,
      type: newType,
      serverId: server.id,
    };
    const updated = { ...server, channels: [...server.channels, channel] };
    const servers = storage.getServers();
    const idx = servers.findIndex((s) => s.id === server.id);
    if (idx >= 0) {
      servers[idx] = updated;
      storage.setServers(servers);
    }
    setNewName("");
    setShowAdd(false);
  }

  return (
    <div className="w-60 bg-[color:var(--color-bg-2)] flex flex-col border-r border-[color:var(--color-border)]">
      {/* Server header */}
      <div className="h-12 px-4 flex items-center border-b border-[color:var(--color-border)] shadow-sm">
        <h2 className="font-semibold text-[15px] truncate">{server.name}</h2>
        <ChevronDown className="h-4 w-4 ml-auto text-[color:var(--color-text-mute)]" />
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        <ChannelSection
          title="Text Channels"
          icon={<Hash className="h-3.5 w-3.5" />}
          channels={textChannels}
          selectedId={selectedChannelId}
          onSelect={onSelect}
          onAdd={() => {
            setNewType("text");
            setShowAdd(true);
          }}
        />
        <ChannelSection
          title="Voice Channels"
          icon={<Volume2 className="h-3.5 w-3.5" />}
          channels={voiceChannels}
          selectedId={selectedChannelId}
          onSelect={onSelect}
          onAdd={() => {
            setNewType("voice");
            setShowAdd(true);
          }}
        />
      </div>

      {showAdd && (
        <div className="p-3 border-t border-[color:var(--color-border)] bg-[color:var(--color-bg-1)] slide-up">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddChannel()}
            placeholder={`${newType === "text" ? "text" : "voice"}-channel`}
            className="w-full h-8 px-2.5 text-sm bg-[color:var(--color-bg-0)] border border-[color:var(--color-border)] rounded-md focus:outline-none focus:border-[color:var(--color-accent)] mb-2"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 h-7 text-xs text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)]"
            >
              Cancel
            </button>
            <button
              onClick={handleAddChannel}
              className="flex-1 h-7 text-xs font-medium bg-[color:var(--color-accent)] text-[color:var(--color-bg-0)] rounded-md hover:brightness-110"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ChannelSectionProps {
  title: string;
  icon: React.ReactNode;
  channels: Channel[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

function ChannelSection({ title, icon, channels, selectedId, onSelect, onAdd }: ChannelSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-1 px-1 mb-1 group">
        <button className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] transition-colors">
          <ChevronDown className="h-3 w-3" />
          {title}
        </button>
        <button
          onClick={onAdd}
          className="ml-auto p-0.5 rounded text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="space-y-0.5">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onSelect(ch.id)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors group",
              selectedId === ch.id
                ? "bg-[color:var(--color-bg-4)] text-[color:var(--color-text)]"
                : "text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-bg-3)] hover:text-[color:var(--color-text)]",
            )}
          >
            <span className="text-[color:var(--color-text-mute)]">{icon}</span>
            <span className="truncate">{ch.name}</span>
          </button>
        ))}
        {channels.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-[color:var(--color-text-mute)] italic">No channels yet</p>
        )}
      </div>
    </div>
  );
}
