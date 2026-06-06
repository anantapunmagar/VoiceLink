import { Settings, LogOut, Mic, Headphones, ChevronUp, Radio } from "lucide-react";
import type { User } from "../lib/types";
import { Avatar } from "./ui/Avatar";
import { cn } from "../utils/cn";
import { getCurrentChannelId } from "../lib/voice";
import { useState } from "react";
import { updateUser } from "../lib/auth";
import { Tooltip } from "./ui/Primitives";

interface UserPanelProps {
  user: User;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

const statusOptions: Array<{ value: User["status"]; label: string; dot: string }> = [
  { value: "online",  label: "Online",          dot: "bg-[color:var(--color-success)]"   },
  { value: "idle",    label: "Idle",             dot: "bg-[color:var(--color-accent)]"    },
  { value: "dnd",     label: "Do Not Disturb",   dot: "bg-[color:var(--color-danger)]"    },
  { value: "offline", label: "Invisible",        dot: "bg-[color:var(--color-text-mute)]" },
];

export function UserPanel({ user, onProfileClick, onSettingsClick, onLogout, onUserUpdate }: UserPanelProps) {
  const inVoice = Boolean(getCurrentChannelId());
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  const currentStatus = statusOptions.find((s) => s.value === user.status);

  function handleStatusChange(status: User["status"]) {
    const updated = updateUser({ status });
    if (updated) onUserUpdate(updated);
    setShowStatusMenu(false);
  }

  return (
    <div
      className="relative flex-shrink-0 border-t border-[color:var(--color-border)] p-2"
      style={{ background: "var(--color-bg-2)" }}
    >
      {/* Status picker */}
      {showStatusMenu && (
        <div className="absolute bottom-full left-2 right-2 mb-1 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-3)] shadow-xl p-1.5 z-40 slide-up">
          <p className="text-xs font-semibold text-[color:var(--color-text-mute)] uppercase tracking-wide px-2 py-1">
            Set Status
          </p>
          {statusOptions.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors",
                user.status === s.value
                  ? "bg-[color:var(--color-bg-4)] text-[color:var(--color-text)]"
                  : "text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-bg-4)]",
              )}
            >
              <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", s.dot)} />
              <span>{s.label}</span>
              {user.status === s.value && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[color:var(--color-accent)]" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Avatar + name */}
        <button
          onClick={onProfileClick}
          className="flex items-center gap-2 flex-1 min-w-0 rounded-lg p-1.5 hover:bg-[color:var(--color-bg-3)] transition-colors focus-ring group"
        >
          <Avatar user={user} size="sm" showStatus />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-[color:var(--color-text)] truncate leading-none mb-0.5">
              {user.username}
            </p>
            <p className="text-xs text-[color:var(--color-text-mute)] truncate">
              {user.customStatus || currentStatus?.label}
            </p>
          </div>
        </button>

        {/* Quick controls */}
        <div className="flex items-center gap-0.5">
          {inVoice && (
            <Tooltip label="In Voice" side="top">
              <div className="p-1.5 rounded text-[color:var(--color-success)]">
                <Radio size={14} className="pulse-dot" />
              </div>
            </Tooltip>
          )}

          <Tooltip label={muted ? "Unmute" : "Mute"} side="top">
            <button
              onClick={() => setMuted(!muted)}
              className={cn(
                "p-1.5 rounded transition-colors",
                muted
                  ? "text-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10"
                  : "text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-3)]",
              )}
            >
              <Mic size={15} />
            </button>
          </Tooltip>

          <Tooltip label={deafened ? "Undeafen" : "Deafen"} side="top">
            <button
              onClick={() => setDeafened(!deafened)}
              className={cn(
                "p-1.5 rounded transition-colors",
                deafened
                  ? "text-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10"
                  : "text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-3)]",
              )}
            >
              <Headphones size={15} />
            </button>
          </Tooltip>

          <Tooltip label="Change Status" side="top">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="p-1.5 rounded text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-3)] transition-colors"
            >
              <ChevronUp
                size={15}
                className={cn("transition-transform", showStatusMenu && "rotate-180")}
              />
            </button>
          </Tooltip>

          <Tooltip label="Settings" side="top">
            <button
              onClick={onSettingsClick}
              className="p-1.5 rounded text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-3)] transition-colors"
            >
              <Settings size={15} />
            </button>
          </Tooltip>

          <Tooltip label="Log Out" side="top">
            <button
              onClick={onLogout}
              className="p-1.5 rounded text-[color:var(--color-text-mute)] hover:text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/10 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
