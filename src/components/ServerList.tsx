import { useState } from "react";
import { Plus, Home } from "lucide-react";
import type { Server } from "../lib/types";
import { generateId } from "../lib/storage";
import { cn } from "../utils/cn";

interface ServerListProps {
  servers: Server[];
  selectedId: string;
  onSelect: (id: string) => void;
  onServersChange: (servers: Server[]) => void;
  currentUserId: string;
}

export function ServerList({ servers, selectedId, onSelect, onServersChange, currentUserId }: ServerListProps) {
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

  return (
    <div className="w-[72px] bg-[color:var(--color-bg-0)] flex flex-col items-center py-3 gap-2 border-r border-[color:var(--color-border)]">
      {/* Home button */}
      <button
        onClick={() => onSelect(servers[0]?.id || "")}
        className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-200 group",
          "bg-[color:var(--color-bg-3)] hover:bg-[color:var(--color-accent)] hover:rounded-xl",
          selectedId === servers[0]?.id && "bg-[color:var(--color-accent)] rounded-xl",
        )}
        title="Home"
      >
        <Home
          className={cn(
            "h-5 w-5 transition-colors",
            selectedId === servers[0]?.id ? "text-[color:var(--color-bg-0)]" : "text-[color:var(--color-text-dim)] group-hover:text-[color:var(--color-bg-0)]",
          )}
        />
      </button>

      <div className="w-8 h-px bg-[color:var(--color-border)] my-1" />

      {/* Server icons */}
      {servers.map((server) => (
        <ServerIcon
          key={server.id}
          server={server}
          selected={server.id === selectedId}
          onClick={() => onSelect(server.id)}
        />
      ))}

      {/* Add server */}
      <div className="relative">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="h-12 w-12 rounded-2xl flex items-center justify-center bg-[color:var(--color-bg-3)] hover:bg-[color:var(--color-success)] hover:rounded-xl transition-all duration-200 group"
          title="Create server"
        >
          <Plus className="h-5 w-5 text-[color:var(--color-success)] group-hover:text-[color:var(--color-bg-0)]" />
        </button>

        {showCreate && (
          <div className="absolute left-full ml-2 top-0 w-64 p-4 bg-[color:var(--color-bg-2)] border border-[color:var(--color-border)] rounded-lg shadow-xl z-10 slide-up">
            <h3 className="text-sm font-semibold mb-3">Create a server</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Server name"
              className="w-full h-9 px-3 text-sm bg-[color:var(--color-bg-0)] border border-[color:var(--color-border)] rounded-md focus:outline-none focus:border-[color:var(--color-accent)] mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 h-8 text-xs text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 h-8 text-xs font-medium bg-[color:var(--color-accent)] text-[color:var(--color-bg-0)] rounded-md hover:brightness-110 transition-all"
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ServerIcon({ server, selected, onClick }: { server: Server; selected: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const initial = server.name.charAt(0).toUpperCase();
  const color = `hsl(${(server.name.charCodeAt(0) * 37) % 360}, 45%, 45%)`;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "relative h-12 w-12 flex items-center justify-center font-semibold text-sm transition-all duration-200 group",
        "rounded-2xl hover:rounded-xl",
        selected ? "rounded-xl" : "",
      )}
      style={{ background: color }}
      title={server.name}
    >
      {server.icon ? (
        <img src={server.icon} alt={server.name} className="h-full w-full rounded-[inherit] object-cover" />
      ) : (
        <span className="text-white">{initial}</span>
      )}

      {/* Selection indicator */}
      <div
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-1 bg-white rounded-r-full transition-all",
          selected ? "h-10" : hover ? "h-5" : "h-0",
        )}
      />

      {/* Tooltip */}
      {hover && (
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-[color:var(--color-bg-0)] text-xs font-medium text-[color:var(--color-text)] rounded-md shadow-lg whitespace-nowrap z-20 fade-in">
          {server.name}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[color:var(--color-bg-0)]" />
        </div>
      )}
    </button>
  );
}
