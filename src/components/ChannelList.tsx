import { Hash, Volume2, ChevronDown, Plus, Trash2, Settings, Info } from "lucide-react";
import type { Server, Channel, User } from "../lib/types";
import { cn } from "../utils/cn";
import { useState } from "react";
import { generateId } from "../lib/storage";
import { storage } from "../lib/storage";
import { Avatar } from "./ui/Avatar";

interface ChannelListProps {
  server: Server;
  selectedChannelId: string;
  onSelect: (channelId: string) => void;
  currentUser: User;
  onServersChange: (servers: Server[]) => void;
}

export function ChannelList({
  server,
  selectedChannelId,
  onSelect,
  currentUser,
  onServersChange,
}: ChannelListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"text" | "voice">("text");
  const [newTopic, setNewTopic] = useState("");
  const [showServerInfo, setShowServerInfo] = useState(false);

  const textChannels = server.channels.filter((c) => c.type === "text");
  const voiceChannels = server.channels.filter((c) => c.type === "voice");
  const isOwner = server.ownerId === currentUser.id;

  function handleAddChannel() {
    const name = newName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return;
    const channel: Channel = {
      id: generateId(),
      name,
      type: newType,
      serverId: server.id,
      topic: newTopic.trim() || undefined,
    };
    const updated = { ...server, channels: [...server.channels, channel] };
    const servers = storage.getServers();
    const idx = servers.findIndex((s) => s.id === server.id);
    if (idx >= 0) {
      servers[idx] = updated;
      storage.setServers(servers);
      onServersChange(servers);
    }
    setNewName("");
    setNewTopic("");
    setShowAdd(false);
    onSelect(channel.id);
  }

  function handleDeleteChannel(channelId: string) {
    if (!isOwner) return;
    const ch = server.channels.find((c) => c.id === channelId);
    if (!ch) return;
    if (!confirm(`Delete channel #${ch.name}? All messages will be lost.`)) return;
    const updated = { ...server, channels: server.channels.filter((c) => c.id !== channelId) };
    const servers = storage.getServers();
    const idx = servers.findIndex((s) => s.id === server.id);
    if (idx >= 0) {
      servers[idx] = updated;
      storage.setServers(servers);
      onServersChange(servers);
    }
    if (selectedChannelId === channelId && updated.channels.length > 0) {
      onSelect(updated.channels[0].id);
    }
  }

  // Members in this server
  const allUsers = storage.getUsers();
  const memberUsers = allUsers.filter((u) => server.members.includes(u.id));

  return (
    <div className="flex flex-col w-60 flex-shrink-0" style={{ background: "var(--color-bg-2)" }}>
      {/* Server header */}
      <button
        onClick={() => setShowServerInfo(!showServerInfo)}
        className="flex items-center justify-between px-4 py-4 border-b border-[color:var(--color-border)] hover:bg-[color:var(--color-bg-3)] transition-colors group"
      >
        <h2 className="font-semibold text-sm text-[color:var(--color-text)] truncate">{server.name}</h2>
        <ChevronDown
          size={16}
          className={cn(
            "text-[color:var(--color-text-mute)] transition-transform duration-200",
            showServerInfo && "rotate-180",
          )}
        />
      </button>

      {/* Server info dropdown */}
      {showServerInfo && (
        <div className="p-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg-1)] slide-up">
          {server.description && (
            <p className="text-xs text-[color:var(--color-text-dim)] mb-2 leading-relaxed">
              {server.description}
            </p>
          )}
          <p className="text-xs text-[color:var(--color-text-mute)]">
            {server.members.length} member{server.members.length !== 1 ? "s" : ""} ·{" "}
            {server.channels.length} channel{server.channels.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-[color:var(--color-text-mute)] mt-0.5">
            Created {new Date(server.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        <ChannelSection
          title="Text Channels"
          icon={<Hash size={14} />}
          channels={textChannels}
          selectedId={selectedChannelId}
          onSelect={onSelect}
          onAdd={
            isOwner
              ? () => {
                  setNewType("text");
                  setShowAdd(true);
                }
              : undefined
          }
          onDelete={isOwner ? handleDeleteChannel : undefined}
        />
        <ChannelSection
          title="Voice Channels"
          icon={<Volume2 size={14} />}
          channels={voiceChannels}
          selectedId={selectedChannelId}
          onSelect={onSelect}
          onAdd={
            isOwner
              ? () => {
                  setNewType("voice");
                  setShowAdd(true);
                }
              : undefined
          }
          onDelete={isOwner ? handleDeleteChannel : undefined}
        />
      </div>

      {/* Add channel form */}
      {showAdd && isOwner && (
        <div className="p-3 border-t border-[color:var(--color-border)] bg-[color:var(--color-bg-1)]">
          <p className="text-xs font-semibold text-[color:var(--color-text-dim)] mb-2 uppercase tracking-wide">
            New {newType} channel
          </p>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddChannel();
              if (e.key === "Escape") setShowAdd(false);
            }}
            placeholder={`${newType === "text" ? "text" : "voice"}-channel`}
            className="w-full h-8 px-2.5 text-sm bg-[color:var(--color-bg-0)] border border-[color:var(--color-border)] rounded-md focus:outline-none focus:border-[color:var(--color-accent)] mb-2 text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)]"
            autoFocus
            maxLength={32}
          />
          <input
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Channel topic (optional)"
            className="w-full h-8 px-2.5 text-sm bg-[color:var(--color-bg-0)] border border-[color:var(--color-border)] rounded-md focus:outline-none focus:border-[color:var(--color-accent)] mb-2 text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)]"
            maxLength={100}
          />
          <div className="flex gap-1.5">
            <button
              onClick={() => { setShowAdd(false); setNewName(""); setNewTopic(""); }}
              className="flex-1 h-7 text-xs text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)] transition-colors rounded border border-[color:var(--color-border)]"
            >
              Cancel
            </button>
            <button
              onClick={handleAddChannel}
              disabled={!newName.trim()}
              className="flex-1 h-7 text-xs font-semibold bg-[color:var(--color-accent)] text-[color:var(--color-bg-0)] rounded disabled:opacity-40 hover:brightness-110 transition-all"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Members online */}
      <div className="border-t border-[color:var(--color-border)] p-3">
        <p className="text-xs font-semibold text-[color:var(--color-text-mute)] uppercase tracking-wide mb-2">
          Members — {memberUsers.filter(u => u.status !== 'offline').length} online
        </p>
        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
          {memberUsers
            .sort((a, b) => {
              const order = { online: 0, idle: 1, dnd: 2, offline: 3 };
              return order[a.status] - order[b.status];
            })
            .map((u) => (
              <div key={u.id} className="flex items-center gap-2 px-1 py-0.5">
                <Avatar user={u} size="xs" showStatus />
                <span
                  className={cn(
                    "text-xs truncate",
                    u.status === "offline"
                      ? "text-[color:var(--color-text-mute)]"
                      : "text-[color:var(--color-text-dim)]",
                  )}
                >
                  {u.username}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

interface ChannelSectionProps {
  title: string;
  icon: React.ReactNode;
  channels: Channel[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  onDelete?: (id: string) => void;
}

function ChannelSection({
  title,
  icon,
  channels,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
}: ChannelSectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-3">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-1 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text-dim)] transition-colors group"
      >
        <div className="flex items-center gap-1">
          <ChevronDown
            size={12}
            className={cn("transition-transform duration-150", collapsed && "-rotate-90")}
          />
          {title}
        </div>
        {onAdd && (
          <Plus
            size={14}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-[color:var(--color-text)]"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          />
        )}
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-0.5 mt-1">
          {channels.map((ch) => (
            <div key={ch.id} className="group/ch relative">
              <button
                onClick={() => onSelect(ch.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  selectedId === ch.id
                    ? "bg-[color:var(--color-bg-4)] text-[color:var(--color-text)]"
                    : "text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-bg-3)] hover:text-[color:var(--color-text)]",
                )}
              >
                <span className="text-[color:var(--color-text-mute)]">{icon}</span>
                <span className="truncate">{ch.name}</span>
                {ch.topic && (
                  <span className="ml-auto opacity-50 flex-shrink-0" title={ch.topic}>
                    <Info size={10} />
                  </span>
                )}
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(ch.id)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-[color:var(--color-danger)] opacity-0 group-hover/ch:opacity-100 hover:bg-[color:var(--color-danger)]/10 transition-all"
                  title="Delete channel"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}
          {channels.length === 0 && (
            <p className="px-2 py-1 text-xs text-[color:var(--color-text-mute)] italic">
              No channels yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
