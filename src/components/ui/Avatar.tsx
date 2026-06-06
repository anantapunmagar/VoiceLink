import { cn } from "../../utils/cn";
import type { User } from "../../lib/types";

interface AvatarProps {
  user?: Pick<User, "username" | "avatar" | "status"> | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  status?: User["status"];
  className?: string;
}

const sizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
} as const;

const statusSizes = {
  xs: "h-2 w-2 border",
  sm: "h-2.5 w-2.5 border-[1.5px]",
  md: "h-3 w-3 border-2",
  lg: "h-4 w-4 border-2",
  xl: "h-5 w-5 border-2",
} as const;

const statusColors = {
  online: "bg-[color:var(--color-success)]",
  idle: "bg-[color:var(--color-accent)]",
  dnd: "bg-[color:var(--color-danger)]",
  offline: "bg-[color:var(--color-text-mute)]",
} as const;

function colorForName(name: string): string {
  const palette = [
    "#7c93f5", "#f5a57c", "#7cf5c0", "#f57c93",
    "#c07cf5", "#f5e07c", "#7ccdf5", "#f57c7c",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/[\s_.-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({ user, size = "md", showStatus, status, className }: AvatarProps) {
  const s = sizes[size];
  const hasAvatar = Boolean(user?.avatar);
  const name = user?.username ?? "Unknown";
  const bg = hasAvatar ? "transparent" : colorForName(name);
  const st = status ?? user?.status ?? "offline";

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <div
        className={cn(
          s,
          "rounded-full flex items-center justify-center font-semibold overflow-hidden",
          "ring-1 ring-black/20",
        )}
        style={{ background: hasAvatar ? undefined : bg }}
      >
        {hasAvatar ? (
          <img src={user!.avatar} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[color:var(--color-bg-0)]">{initials(name)}</span>
        )}
      </div>
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-[color:var(--color-bg-2)]",
            statusSizes[size],
            statusColors[st as User["status"]],
            st === "online" && "pulse-dot",
          )}
          aria-label={st}
        />
      )}
    </div>
  );
}
