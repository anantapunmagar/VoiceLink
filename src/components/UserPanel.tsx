import { Settings, LogOut, Mic, MicOff, Headphones, ChevronUp, Radio } from "lucide-react";
import type { User } from "../lib/types";
import { Avatar } from "./ui/Avatar";
import { cn } from "../utils/cn";
import { getCurrentRoomId } from "../lib/voice";
import { useState } from "react";
import { updateUser } from "../lib/auth";

interface UserPanelProps {
  user: User;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

const STATUS_OPTS: Array<{ value: User["status"]; label: string; dot: string }> = [
  { value: "online",  label: "Online",         dot: "bg-[color:var(--color-success)]"    },
  { value: "idle",    label: "Idle",            dot: "bg-[color:var(--color-warn)]"       },
  { value: "dnd",     label: "Do Not Disturb", dot: "bg-[color:var(--color-danger)]"     },
  { value: "offline", label: "Invisible",      dot: "bg-[color:var(--color-text-mute)]"  },
];

export function UserPanel({ user, onProfileClick, onSettingsClick, onLogout, onUserUpdate }: UserPanelProps) {
  const inVoice = Boolean(getCurrentRoomId());
  const [showStatus, setShowStatus] = useState(false);
  const [muted, setMuted] = useState(false);

  function changeStatus(status: User["status"]) {
    const updated = updateUser({ status });
    if (updated) onUserUpdate(updated);
    setShowStatus(false);
  }

  const currentStatus = STATUS_OPTS.find((s) => s.value === user.status);

  return (
    <div className="relative px-2 py-2 flex-shrink-0 bg-[color:var(--color-bg-1)]">
      {/* Status popup */}
      {showStatus && (
        <div className="absolute bottom-full left-2 right-2 mb-1.5 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-4)] shadow-2xl p-1.5 z-50 animate-slide-up">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] px-2 py-1">Set Status</p>
          {STATUS_OPTS.map((s) => (
            <button key={s.value} onClick={() => changeStatus(s.value)}
              className={cn("w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors",
                user.status === s.value
                  ? "bg-[color:var(--color-bg-5)] text-[color:var(--color-text)]"
                  : "text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-bg-5)]")}>
              <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", s.dot)} />
              <span className="flex-1 text-left">{s.label}</span>
              {user.status === s.value && <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)]" />}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={onProfileClick} className="flex items-center gap-2 flex-1 min-w-0 rounded-xl p-1.5 hover:bg-[color:var(--color-bg-4)] transition-colors focus-ring">
          <Avatar user={user} size="sm" showStatus />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-[color:var(--color-text)] truncate leading-tight">{user.username}</p>
            <p className="text-[10px] text-[color:var(--color-text-mute)] truncate">{user.customStatus || currentStatus?.label}</p>
          </div>
        </button>
        <div className="flex items-center gap-0.5">
          {inVoice && (
            <div className="p-1.5 rounded-lg text-[color:var(--color-success)]" title="In voice">
              <Radio size={14} className="pulse-dot" />
            </div>
          )}
          <IconBtn icon={muted ? <MicOff size={14} /> : <Mic size={14} />} title={muted ? "Unmute" : "Mute"}
            onClick={() => setMuted(!muted)} active={muted} danger={muted} />
          <IconBtn icon={<ChevronUp size={14} className={cn("transition-transform", showStatus && "rotate-180")} />}
            title="Set status" onClick={() => setShowStatus(!showStatus)} />
          <IconBtn icon={<Settings size={14} />} title="Settings" onClick={onSettingsClick} />
          <IconBtn icon={<LogOut size={14} />} title="Log out" onClick={onLogout} danger />
        </div>
      </div>
    </div>
  );
}

function IconBtn({ icon, title, onClick, active, danger }: { icon: React.ReactNode; title: string; onClick: () => void; active?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title}
      className={cn("p-1.5 rounded-lg transition-colors",
        danger && !active ? "text-[color:var(--color-text-mute)] hover:text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)]"
        : active ? "text-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)]"
        : "text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-4)]")}>
      {icon}
    </button>
  );
}
