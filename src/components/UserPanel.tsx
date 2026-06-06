import { Settings, LogOut, ChevronUp, Mic, Headphones } from "lucide-react";
import type { User } from "../lib/types";
import { Avatar } from "./ui/Avatar";
import { cn } from "../utils/cn";
import { getCurrentChannelId } from "../lib/voice";

interface UserPanelProps {
  user: User;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
}

const statusLabels = {
  online: "Online",
  idle: "Idle",
  dnd: "Do Not Disturb",
  offline: "Invisible",
} as const;

const statusColors = {
  online: "bg-[color:var(--color-success)]",
  idle: "bg-[color:var(--color-accent)]",
  dnd: "bg-[color:var(--color-danger)]",
  offline: "bg-[color:var(--color-text-mute)]",
} as const;

export function UserPanel({ user, onProfileClick, onSettingsClick, onLogout }: UserPanelProps) {
  const inVoice = Boolean(getCurrentChannelId());

  return (
    <div className="h-14 px-2 flex items-center gap-1.5 bg-[color:var(--color-bg-0)] border-t border-[color:var(--color-border)]">
      <button
        onClick={onProfileClick}
        className="flex items-center gap-2 flex-1 min-w-0 px-1.5 py-1.5 rounded-md hover:bg-[color:var(--color-bg-2)] transition-colors group"
      >
        <Avatar user={user} size="sm" showStatus />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-medium text-[color:var(--color-text)] truncate leading-tight">
            {user.username}
          </p>
          <p className="text-[11px] text-[color:var(--color-text-mute)] truncate leading-tight mt-0.5 flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", statusColors[user.status])} />
            {statusLabels[user.status]}
          </p>
        </div>
        <ChevronUp className="h-4 w-4 text-[color:var(--color-text-mute)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      <div className="flex items-center">
        {inVoice && (
          <div className="flex items-center gap-1 px-2 py-1 mr-1 rounded-md bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]">
            <div className="flex items-end gap-0.5 h-3">
              <span className="w-0.5 bg-current rounded-full wave-bar" style={{ height: "60%", animationDelay: "0ms" }} />
              <span className="w-0.5 bg-current rounded-full wave-bar" style={{ height: "100%", animationDelay: "150ms" }} />
              <span className="w-0.5 bg-current rounded-full wave-bar" style={{ height: "70%", animationDelay: "300ms" }} />
              <span className="w-0.5 bg-current rounded-full wave-bar" style={{ height: "90%", animationDelay: "450ms" }} />
            </div>
            <Mic className="h-3 w-3" />
          </div>
        )}

        <IconButton icon={<Headphones className="h-4 w-4" />} label="Audio settings" onClick={() => {}} />
        <IconButton icon={<Mic className="h-4 w-4" />} label="Voice settings" onClick={() => {}} />
        <IconButton icon={<Settings className="h-4 w-4" />} label="User settings" onClick={onSettingsClick} />
        <IconButton icon={<LogOut className="h-4 w-4" />} label="Log out" onClick={onLogout} />
      </div>
    </div>
  );
}

function IconButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-md text-[color:var(--color-text-dim)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-2)] transition-colors"
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
