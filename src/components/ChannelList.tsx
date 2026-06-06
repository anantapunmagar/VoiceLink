import { useState } from "react";
import { Hash, Volume2, ChevronDown, Plus, Trash2, Copy, Check, Link, Settings } from "lucide-react";
import type { Server, Channel, User } from "../lib/types";
import { cn } from "../utils/cn";
import { generateId, generateInviteCode } from "../lib/storage";
import { storage } from "../lib/storage";
import { Avatar } from "./ui/Avatar";

interface ChannelListProps {
  server: Server;
  selectedChannelId: string;
  onSelect: (channelId: string) => void;
  currentUser: User;
  onServersChange: (servers: Server[]) => void;
  onClose?: () => void; // mobile
}

export function ChannelList({ server, selectedChannelId, onSelect, currentUser, onServersChange, onClose }: ChannelListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"text" | "voice">("text");
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const isOwner = server.ownerId === currentUser.id;
  const textChannels = server.channels.filter((c) => c.type === "text");
  const voiceChannels = server.channels.filter((c) => c.type === "voice");
  const memberUsers = storage.getUsers().filter((u) => server.members.includes(u.id));

  function getOrCreateInviteCode(): string {
    if (server.inviteCode) return server.inviteCode;
    const servers = storage.getServers();
    const idx = servers.findIndex((s) => s.id === server.id);
    if (idx >= 0) {
      servers[idx].inviteCode = generateInviteCode();
      storage.setServers(servers);
      onServersChange(servers);
      return servers[idx].inviteCode!;
    }
    return "";
  }

  function copyInviteLink() {
    const code = getOrCreateInviteCode();
    const url = `${window.location.origin}${window.location.pathname}?invite=${code}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function addChannel() {
    const name = newName.trim().toLowerCase().replace(/\s+/g, "-");
    if (!name) return;
    const channel: Channel = { id: generateId(), name, type: newType, serverId: server.id };
    const servers = storage.getServers();
    const idx = servers.findIndex((s) => s.id === server.id);
    if (idx >= 0) {
      servers[idx].channels = [...servers[idx].channels, channel];
      storage.setServers(servers);
      onServersChange(servers);
    }
    setNewName(""); setShowAdd(false);
    onSelect(channel.id);
  }

  function deleteChannel(channelId: string) {
    const ch = server.channels.find((c) => c.id === channelId);
    if (!ch || !confirm(`Delete #${ch.name}?`)) return;
    const servers = storage.getServers();
    const idx = servers.findIndex((s) => s.id === server.id);
    if (idx >= 0) {
      servers[idx].channels = servers[idx].channels.filter((c) => c.id !== channelId);
      storage.setServers(servers);
      onServersChange(servers);
    }
    if (selectedChannelId === channelId) {
      const remaining = server.channels.filter((c) => c.id !== channelId);
      if (remaining.length) onSelect(remaining[0].id);
    }
  }

  function leaveServer() {
    if (!confirm(`Leave ${server.name}?`)) return;
    const servers = storage.getServers();
    const idx = servers.findIndex((s) => s.id === server.id);
    if (idx >= 0) {
      servers[idx].members = servers[idx].members.filter((m) => m !== currentUser.id);
      if (servers[idx].members.length === 0 || servers[idx].ownerId === currentUser.id) {
        servers.splice(idx, 1);
      }
      storage.setServers(servers);
      onServersChange(servers);
    }
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Server header */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="flex items-center justify-between px-4 py-4 border-b border-[color:var(--color-border)] hover:bg-[color:var(--color-bg-3)] transition-colors flex-shrink-0 group">
        <h2 className="font-semibold text-sm text-[color:var(--color-text)] truncate">{server.name}</h2>
        <ChevronDown size={14} className={cn("text-[color:var(--color-text-mute)] transition-transform flex-shrink-0 ml-2", showInfo && "rotate-180")} />
      </button>

      {/* Server info + actions */}
      {showInfo && (
        <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-bg-1)] p-3 flex flex-col gap-2 animate-slide-up">
          {server.description && <p className="text-xs text-[color:var(--color-text-dim)]">{server.description}</p>}
          <p className="text-xs text-[color:var(--color-text-mute)]">{server.members.length} members &middot; Created {new Date(server.createdAt).toLocaleDateString()}</p>

          {/* Invite */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)]">Invite Link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[color:var(--color-bg-0)] border border-[color:var(--color-border)] text-xs font-mono text-[color:var(--color-text-dim)] overflow-hidden">
                <Link size={11} className="flex-shrink-0 text-[color:var(--color-text-mute)]" />
                <span className="truncate">{getOrCreateInviteCode()}</span>
              </div>
              <button onClick={copyInviteLink}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[color:var(--color-accent)] text-white text-xs font-medium hover:bg-[color:var(--color-accent-hover)] transition-colors flex-shrink-0">
                {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
              </button>
            </div>
          </div>

          {!isOwner && (
            <button onClick={leaveServer} className="text-xs text-[color:var(--color-danger)] hover:underline text-left mt-1">Leave server</button>
          )}
        </div>
      )}

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        <Section title="Text Channels" icon={<Hash size={13} />} channels={textChannels}
          selectedId={selectedChannelId} onSelect={(id) => { onSelect(id); onClose?.(); }}
          onAdd={isOwner ? () => { setNewType("text"); setShowAdd(true); } : undefined}
          onDelete={isOwner ? deleteChannel : undefined} />
        <Section title="Voice Channels" icon={<Volume2 size={13} />} channels={voiceChannels}
          selectedId={selectedChannelId} onSelect={(id) => { onSelect(id); onClose?.(); }}
          onAdd={isOwner ? () => { setNewType("voice"); setShowAdd(true); } : undefined}
          onDelete={isOwner ? deleteChannel : undefined} />
      </div>

      {/* Add channel */}
      {showAdd && isOwner && (
        <div className="p-3 border-t border-[color:var(--color-border)] flex-shrink-0 bg-[color:var(--color-bg-1)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] mb-2">New {newType} channel</p>
          <input value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addChannel(); if (e.key === "Escape") setShowAdd(false); }}
            placeholder="channel-name" autoFocus maxLength={32}
            className="w-full h-8 px-2.5 text-sm bg-[color:var(--color-bg-0)] border border-[color:var(--color-border)] rounded-lg focus:outline-none focus:border-[color:var(--color-accent)] mb-2 text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)]" />
          <div className="flex gap-1.5">
            <button onClick={() => setShowAdd(false)} className="flex-1 h-7 text-xs text-[color:var(--color-text-dim)] rounded-lg border border-[color:var(--color-border)]">Cancel</button>
            <button onClick={addChannel} disabled={!newName.trim()} className="flex-1 h-7 text-xs font-semibold bg-[color:var(--color-accent)] text-white rounded-lg disabled:opacity-40 hover:bg-[color:var(--color-accent-hover)]">Add</button>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="border-t border-[color:var(--color-border)] p-3 flex-shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] mb-2">
          Members &mdash; {memberUsers.filter((u) => u.status !== "offline").length} online
        </p>
        <div className="flex flex-col gap-1 max-h-28 overflow-y-auto">
          {memberUsers
            .sort((a, b) => (a.status === "offline" ? 1 : 0) - (b.status === "offline" ? 1 : 0))
            .map((u) => (
              <div key={u.id} className="flex items-center gap-2 px-1 py-0.5 rounded-md">
                <Avatar user={u} size="xs" showStatus />
                <span className={cn("text-xs truncate", u.status === "offline" ? "text-[color:var(--color-text-mute)]" : "text-[color:var(--color-text-dim)]")}>{u.username}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, channels, selectedId, onSelect, onAdd, onDelete }: {
  title: string; icon: React.ReactNode; channels: Channel[]; selectedId: string;
  onSelect: (id: string) => void; onAdd?: () => void; onDelete?: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="mb-3">
      <button onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text-dim)] transition-colors group">
        <div className="flex items-center gap-1">
          <ChevronDown size={10} className={cn("transition-transform", collapsed && "-rotate-90")} />
          {title}
        </div>
        {onAdd && (
          <Plus size={13} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-[color:var(--color-text)]"
            onClick={(e) => { e.stopPropagation(); onAdd(); }} />
        )}
      </button>
      {!collapsed && (
        <div className="flex flex-col gap-0.5 mt-0.5">
          {channels.map((ch) => (
            <div key={ch.id} className="group/ch relative">
              <button onClick={() => onSelect(ch.id)}
                className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  selectedId === ch.id
                    ? "bg-[color:var(--color-bg-4)] text-[color:var(--color-text)]"
                    : "text-[color:var(--color-text-mute)] hover:bg-[color:var(--color-bg-3)] hover:text-[color:var(--color-text-dim)]")}>
                <span className="flex-shrink-0">{icon}</span>
                <span className="truncate">{ch.name}</span>
              </button>
              {onDelete && (
                <button onClick={() => onDelete(ch.id)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-[color:var(--color-danger)] opacity-0 group-hover/ch:opacity-100 hover:bg-[color:var(--color-danger-soft)] transition-all">
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}
          {channels.length === 0 && <p className="px-2 py-1 text-xs text-[color:var(--color-text-mute)] italic">No channels</p>}
        </div>
      )}
    </div>
  );
}
