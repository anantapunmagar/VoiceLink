import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import type { User } from "../lib/types";
import { chatBus } from "../lib/chat";
import { storage } from "../lib/storage";
import { Avatar } from "./ui/Avatar";
import { cn } from "../utils/cn";

interface DMListProps {
  currentUser: User;
  selectedPeerId: string | null;
  onSelectPeer: (peer: User) => void;
  onClose?: () => void;
}

export function DMList({ currentUser, selectedPeerId, onSelectPeer, onClose }: DMListProps) {
  const [search, setSearch] = useState("");
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  // Build unread map per sender
  useEffect(() => {
    function refresh() {
      const dms = storage.getDMs();
      const map: Record<string, number> = {};
      dms.filter((d) => d.recipientId === currentUser.id && !d.read).forEach((d) => {
        map[d.authorId] = (map[d.authorId] ?? 0) + 1;
      });
      setUnreadMap(map);
    }
    refresh();
    return chatBus.onDM(refresh as () => void);
  }, [currentUser.id]);

  const allUsers = storage.getUsers().filter((u) => u.id !== currentUser.id);

  // Users who have exchanged DMs, sorted by recency
  const dms = storage.getDMs();
  const interacted = new Map<string, number>();
  dms.forEach((d) => {
    const other = d.authorId === currentUser.id ? d.recipientId : d.authorId;
    if (other === currentUser.id) return;
    const prev = interacted.get(other) ?? 0;
    if (d.timestamp > prev) interacted.set(other, d.timestamp);
  });

  const sortedPeers = [...interacted.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => allUsers.find((u) => u.id === id))
    .filter(Boolean) as User[];

  // Other users not yet interacted
  const othersFiltered = allUsers
    .filter((u) => !interacted.has(u.id) && u.username.toLowerCase().includes(search.toLowerCase()));

  const sortedFiltered = search
    ? allUsers.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()))
    : sortedPeers;

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="px-3 py-3 border-b border-[color:var(--color-border)] flex-shrink-0">
        <h2 className="text-sm font-semibold text-[color:var(--color-text)] mb-3">Direct Messages</h2>
        <button onClick={() => alert("Friend requests coming soon!")} className="w-full flex items-center justify-between px-2 py-2 mb-3 rounded-lg bg-[color:var(--color-bg-3)] hover:bg-[color:var(--color-bg-4)] text-[color:var(--color-text)] transition-colors group">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full flex items-center justify-center bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]">
              <Plus size={14} />
            </div>
            <span className="text-sm font-medium">Add Friend</span>
          </div>
          <span className="text-xs text-[color:var(--color-text-mute)] group-hover:text-[color:var(--color-text)] px-1">NEW</span>
        </button>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--color-text-mute)]" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Find or start a conversation"
            className="w-full h-8 pl-8 pr-3 text-xs bg-[color:var(--color-bg-0)] border border-[color:var(--color-border)] rounded-lg focus:outline-none focus:border-[color:var(--color-accent)] text-[color:var(--color-text)] placeholder:text-[color:var(--color-text-mute)]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2">
        {sortedFiltered.length === 0 && (
          <p className="text-xs text-[color:var(--color-text-mute)] text-center mt-4 px-2">
            {search ? "No users found." : "No conversations yet. Search to find users."}
          </p>
        )}
        {sortedFiltered.map((peer) => {
          const lastDM = storage.getDMs()
            .filter((d) => (d.authorId === peer.id && d.recipientId === currentUser.id) || (d.authorId === currentUser.id && d.recipientId === peer.id))
            .sort((a, b) => b.timestamp - a.timestamp)[0];
          const unread = unreadMap[peer.id] ?? 0;

          return (
            <button key={peer.id} onClick={() => { onSelectPeer(peer); onClose?.(); }}
              className={cn("w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors text-left",
                selectedPeerId === peer.id
                  ? "bg-[color:var(--color-bg-4)] text-[color:var(--color-text)]"
                  : "text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-bg-3)] hover:text-[color:var(--color-text)]")}>
              <Avatar user={peer} size="sm" showStatus className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={cn("text-sm truncate", unread > 0 && "font-semibold text-[color:var(--color-text)]")}>{peer.username}</span>
                  {lastDM && <span className="text-[10px] text-[color:var(--color-text-mute)] flex-shrink-0">{new Date(lastDM.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                </div>
                {lastDM && (
                  <p className={cn("text-xs truncate", unread > 0 ? "text-[color:var(--color-text-dim)] font-medium" : "text-[color:var(--color-text-mute)]")}>
                    {lastDM.authorId === currentUser.id ? "You: " : ""}{lastDM.content}
                  </p>
                )}
              </div>
              {unread > 0 && (
                <span className="flex-shrink-0 h-5 min-w-[20px] px-1 rounded-full bg-[color:var(--color-danger)] text-white text-[10px] font-bold flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          );
        })}

        {/* Show all users section when searching */}
        {search && sortedFiltered.length > 0 && othersFiltered.length > 0 && (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] px-2 py-2 mt-2">All Users</p>
            {othersFiltered.filter((u) => !sortedFiltered.some((s) => s.id === u.id)).map((peer) => (
              <button key={peer.id} onClick={() => { onSelectPeer(peer); onClose?.(); }}
                className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors text-left text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-bg-3)] hover:text-[color:var(--color-text)]">
                <Avatar user={peer} size="sm" showStatus className="flex-shrink-0" />
                <span className="text-sm">{peer.username}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
