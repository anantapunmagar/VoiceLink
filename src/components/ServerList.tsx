import { useState } from "react";
import { Plus, Home, Trash2 } from "lucide-react";
import type { Server } from "../lib/types";
import { generateId } from "../lib/storage";
import { cn } from "../utils/cn";
import { Tooltip } from "./ui/Primitives";

interface ServerListProps {
  servers: Server[];
  selectedId: string;
  onSelect: (id: string) => void;
  onServersChange: (servers: Server[]) => void;
  currentUserId: string;
}

export function ServerList({
  servers,
  selectedId,
  onSelect,
  onServersChange,
  currentUserId,
}: ServerListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const server: Server = {
      id: generateId(),
      name,
      ownerId: currentUserId,
      members: [currentUserId],
      channels: [
        { id: generateId(), name: "general", type: "text", serverId: "" },
        { id: generateId(), name: "off-topic", type: "text", serverId: "" },
        { id: generateId(), name: "Lounge", type: "voice", serverId: "" },
      ],
      createdAt: Date.now(),
    };
    server.channels.forEach((c) => (c.serverId = server.id));
    const updated = [...servers, server];
    onServersChange(updated);
    setNewName("");
    setShowCreate(false);
    onSelect(server.id);
  }

  function handleDelete(serverId: string) {
    const server = servers.find((s) => s.id === serverId);
    if (!server || server.ownerId !== currentUserId) return;
    if (!confirm(`Delete server "${server.name}"? This cannot be undone.`)) return;
    const updated = servers.filter((s) => s.id !== serverId);
    onServersChange(updated);
    if (selectedId === serverId && updated.length > 0) {
      onSelect(updated[0].id);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 py-3 w-[72px] flex-shrink-0 overflow-y-auto">
      {/* Home */}
      <Tooltip label="Home" side="right">
        <button
          onClick={() => onSelect(servers[0]?.id || "")}
          className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-200",
            "bg-[color:var(--color-bg-3)] hover:bg-[color:var(--color-accent)] hover:rounded-xl",
            "focus-ring",
            selectedId === servers[0]?.id && "bg-[color:var(--color-accent)] rounded-xl",
          )}
        >
          <Home
            size={20}
            className={cn(
              selectedId === servers[0]?.id
                ? "text-[color:var(--color-bg-0)]"
                : "text-[color:var(--color-text-dim)]",
            )}
          />
        </button>
      </Tooltip>

      {/* Divider */}
      <div className="w-8 h-px bg-[color:var(--color-border)]" />

      {/* Server icons */}
      {servers.map((server) => (
        <ServerIcon
          key={server.id}
          server={server}
          selected={selectedId === server.id}
          onClick={() => onSelect(server.id)}
          canDelete={server.ownerId === currentUserId}
          onDelete={() => handleDelete(server.id)}
        />
      ))}

      {/* Divider */}
      {servers.length > 0 && <div className="w-8 h-px bg-[color:var(--color-border)]" />}

      {/* Add server */}
      <Tooltip label="Create Server" side="right">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[color:var(--color-bg-3)] hover:bg-[color:var(--color-success)] hover:rounded-xl transition-all duration-200 focus-ring group"
        >
          <Plus
            size={20}
            className="text-[color:var(--color-success)] group-hover:text-[color:var(--color-bg-0)] transition-colors"
          />
        </button>
      </Tooltip>

      {/* Create server popup */}
      {showCreate && (
        <div
          className="fixed left-20 z-50 w-64 rounded-xl border border-[color:var(--color-border)] p-4 slide-up shadow-2xl"
          style={{ background: "var(--color-bg-3)", top: "50%" }}
        >
          <h3 className="text-sm font-semibold text-[color:var(--color-text)] mb-3">
            Create a server
          </h3>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setShowCreate(false);
            }}
            placeholder="Server name"
            className="w-full h-9 px-3 text-sm bg-[color:var(--color-bg-0)] border border-[color:var(--color-border)] rounded-md focus:outline-none focus:border-[color:var(--color-accent)] mb-3 text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)]"
            autoFocus
            maxLength={32}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 h-8 text-xs text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)] transition-colors rounded-md border border-[color:var(--color-border)] hover:border-[color:var(--color-border-strong)]"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="flex-1 h-8 text-xs font-semibold bg-[color:var(--color-accent)] text-[color:var(--color-bg-0)] rounded-md disabled:opacity-40 hover:brightness-110 transition-all"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ServerIconProps {
  server: Server;
  selected: boolean;
  onClick: () => void;
  canDelete: boolean;
  onDelete: () => void;
}

function ServerIcon({ server, selected, onClick, canDelete, onDelete }: ServerIconProps) {
  const [hover, setHover] = useState(false);
  const initial = server.name.charAt(0).toUpperCase();
  const color = `hsl(${(server.name.charCodeAt(0) * 37) % 360}, 45%, 45%)`;

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={cn(
          "relative h-12 w-12 flex items-center justify-center font-semibold text-sm transition-all duration-200",
          "rounded-2xl hover:rounded-xl focus-ring",
          selected && "rounded-xl ring-2 ring-[color:var(--color-accent)] ring-offset-2 ring-offset-[color:var(--color-bg-0)]",
        )}
        style={{ background: color }}
        title={server.name}
      >
        {server.icon ? (
          <img src={server.icon} alt={server.name} className="h-full w-full object-cover rounded-inherit" />
        ) : (
          <span style={{ color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>{initial}</span>
        )}

        {/* Selection indicator */}
        {selected && (
          <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-1 bg-[color:var(--color-text)] rounded-full" />
        )}
      </button>

      {/* Tooltip */}
      {hover && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-xl bg-[color:var(--color-bg-4)] text-[color:var(--color-text)] border border-[color:var(--color-border)]">
            {server.name}
          </div>
        </div>
      )}

      {/* Delete button (owner only) */}
      {canDelete && hover && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[color:var(--color-danger)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:brightness-110"
          title="Delete server"
        >
          <Trash2 size={10} className="text-white" />
        </button>
      )}
    </div>
  );
}
