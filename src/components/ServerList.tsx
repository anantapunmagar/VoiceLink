import { useState } from "react";
import { Plus, MessageSquare } from "lucide-react";
import type { Server } from "../lib/types";
import { generateId, generateInviteCode } from "../lib/storage";
import { storage } from "../lib/storage";
import { cn } from "../utils/cn";
import { colorForName } from "./ui/Avatar";

interface ServerListProps {
  servers: Server[];
  selectedId: string;
  onSelect: (id: string) => void;
  onServersChange: (servers: Server[]) => void;
  currentUserId: string;
  dmUnread: number;
  showDMs: boolean;
  onDMsClick: () => void;
}

export function ServerList({ servers, selectedId, onSelect, onServersChange, currentUserId, dmUnread, showDMs, onDMsClick }: ServerListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newName, setNewName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const id = generateId();
    const server: Server = {
      id, name, ownerId: currentUserId, members: [currentUserId],
      channels: [
        { id: generateId(), name: "general", type: "text", serverId: id, topic: "General conversation" },
        { id: generateId(), name: "off-topic", type: "text", serverId: id },
        { id: generateId(), name: "General Voice", type: "voice", serverId: id },
      ],
      createdAt: Date.now(),
      inviteCode: generateInviteCode(),
    };
    const updated = [...servers, server];
    onServersChange(updated);
    setNewName(""); setShowCreate(false);
    onSelect(server.id);
  }

  function handleJoin() {
    setJoinError("");
    const code = inviteCode.trim().toUpperCase();
    if (!code) return;
    const allServers = storage.getServers();
    const server = allServers.find((s) => s.inviteCode === code);
    if (!server) { setJoinError("Invalid invite code."); return; }
    if (!server.members.includes(currentUserId)) { server.members.push(currentUserId); storage.setServers(allServers); }
    const updated = storage.getServers();
    onServersChange(updated);
    onSelect(server.id);
    setInviteCode(""); setShowJoin(false);
  }

  return (
    <div className="flex flex-col items-center gap-2 py-3 w-[68px] flex-shrink-0 overflow-y-auto overflow-x-hidden bg-[color:var(--color-bg-0)] h-full">
      {/* DMs button */}
      <ServerBtn
        label="Direct Messages"
        active={showDMs}
        onClick={onDMsClick}
        badge={dmUnread}
        icon={<MessageSquare size={20} />}
        color="var(--color-accent)"
      />
      <div className="w-8 h-px bg-[color:var(--color-border)]" />

      {/* Servers */}
      {servers.map((s) => (
        <ServerBtn
          key={s.id}
          label={s.name}
          active={selectedId === s.id && !showDMs}
          onClick={() => onSelect(s.id)}
          initials={s.name.charAt(0).toUpperCase()}
          color={colorForName(s.name)}
        />
      ))}

      {servers.length > 0 && <div className="w-8 h-px bg-[color:var(--color-border)]" />}

      {/* Add server */}
      <div className="relative">
        <button
          onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
          className="h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-200 bg-[color:var(--color-bg-3)] hover:bg-[color:var(--color-success)] hover:rounded-xl group focus-ring"
          title="Add a server">
          <Plus size={20} className="text-[color:var(--color-success)] group-hover:text-white transition-colors" />
        </button>
        {showCreate && (
          <Popup title="Create a server" onClose={() => setShowCreate(false)}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setShowCreate(false); }}
              placeholder="Server name" autoFocus maxLength={32}
              className="w-full h-9 px-3 text-sm bg-[color:var(--color-bg-2)] border border-[color:var(--color-border)] rounded-lg focus:outline-none focus:border-[color:var(--color-accent)] text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)] mb-3" />
            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 h-8 text-xs text-[color:var(--color-text-dim)] rounded-lg border border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)] transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!newName.trim()} className="flex-1 h-8 text-xs font-semibold bg-[color:var(--color-accent)] text-white rounded-lg disabled:opacity-40 hover:bg-[color:var(--color-accent-hover)] transition-colors">Create</button>
            </div>
            <button onClick={() => { setShowCreate(false); setShowJoin(true); }} className="w-full text-center text-xs text-[color:var(--color-accent)] hover:underline mt-2">Join with invite code instead</button>
          </Popup>
        )}
        {showJoin && (
          <Popup title="Join a server" onClose={() => { setShowJoin(false); setJoinError(""); }}>
            <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); if (e.key === "Escape") { setShowJoin(false); setJoinError(""); } }}
              placeholder="Invite code (e.g. AB12CDE)" autoFocus maxLength={16}
              className="w-full h-9 px-3 text-sm bg-[color:var(--color-bg-2)] border border-[color:var(--color-border)] rounded-lg focus:outline-none focus:border-[color:var(--color-accent)] text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)] mb-2 font-mono uppercase" />
            {joinError && <p className="text-xs text-[color:var(--color-danger)] mb-2">{joinError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setShowJoin(false); setJoinError(""); }} className="flex-1 h-8 text-xs text-[color:var(--color-text-dim)] rounded-lg border border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)] transition-colors">Cancel</button>
              <button onClick={handleJoin} disabled={!inviteCode.trim()} className="flex-1 h-8 text-xs font-semibold bg-[color:var(--color-accent)] text-white rounded-lg disabled:opacity-40 hover:bg-[color:var(--color-accent-hover)] transition-colors">Join</button>
            </div>
          </Popup>
        )}
      </div>
    </div>
  );
}

function ServerBtn({ label, active, onClick, initials, color, icon, badge }: {
  label: string; active: boolean; onClick: () => void;
  initials?: string; color?: string; icon?: React.ReactNode; badge?: number;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        onClick={onClick}
        className={cn("relative h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-200 focus-ring text-white",
          active ? "rounded-xl" : "hover:rounded-xl")}
        style={{ background: color ?? (active ? "var(--color-accent)" : "var(--color-bg-3)") }}
        title={label}>
        {icon ?? initials}
        {active && <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-1.5 bg-white rounded-full" />}
        {active && <span className="absolute inset-0 rounded-2xl ring-2 ring-white/20" style={{ borderRadius: active ? "12px" : "16px" }} />}
      </button>
      {badge != null && badge > 0 && (
        <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-0.5 rounded-full bg-[color:var(--color-danger)] text-white text-[9px] font-bold flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      {hover && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shadow-xl bg-[color:var(--color-bg-0)] text-[color:var(--color-text)] border border-[color:var(--color-border)]">
            {label}
          </div>
        </div>
      )}
    </div>
  );
}

function Popup({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute left-full ml-3 top-0 z-50 w-64 rounded-xl border border-[color:var(--color-border)] p-4 shadow-2xl bg-[color:var(--color-bg-3)] animate-scale-in">
      <h3 className="text-sm font-semibold text-[color:var(--color-text)] mb-3">{title}</h3>
      {children}
    </div>
  );
}
