import { useState, useRef } from "react";
import { Camera, X, Save } from "lucide-react";
import type { User } from "../lib/types";
import { Modal, ModalHeader } from "./ui/Modal";
import { Button, Input, Textarea } from "./ui/Primitives";
import { updateUser } from "../lib/auth";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (user: User) => void;
}

const bannerColors = [
  "#3a2a1a", "#2a2f3a", "#2d3a2a", "#3a2a35",
  "#3a332a", "#26333a", "#332a3a", "#1f2937",
  "#3a2a2a", "#2a3a33",
];

const statusOptions: Array<{ value: User["status"]; label: string; color: string }> = [
  { value: "online", label: "Online", color: "bg-[color:var(--color-success)]" },
  { value: "idle", label: "Idle", color: "bg-[color:var(--color-accent)]" },
  { value: "dnd", label: "Do Not Disturb", color: "bg-[color:var(--color-danger)]" },
  { value: "offline", label: "Invisible", color: "bg-[color:var(--color-text-mute)]" },
];

export function ProfileModal({ open, onClose, user, onUpdate }: ProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || "");
  const [banner, setBanner] = useState(user.banner || bannerColors[0]);
  const [avatar, setAvatar] = useState<string | undefined>(user.avatar);
  const [status, setStatus] = useState<User["status"]>(user.status);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setAvatar(undefined);
  }

  function handleSave() {
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (trimmed.length > 24) {
      setError("Username must be under 24 characters.");
      return;
    }
    const updated = updateUser({
      username: trimmed,
      bio,
      banner,
      avatar,
      status,
    });
    if (updated) {
      onUpdate(updated);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="Edit profile" subtitle="Customize how others see you on VoiceLink." onClose={onClose} />

      <div className="px-6 pb-6 space-y-6">
        {/* Banner */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] mb-2">
            Banner color
          </label>
          <div className="flex gap-2 flex-wrap">
            {bannerColors.map((c) => (
              <button
                key={c}
                onClick={() => setBanner(c)}
                className="h-9 w-9 rounded-md border-2 transition-all focus-ring"
                style={{
                  background: c,
                  borderColor: banner === c ? "var(--color-accent)" : "transparent",
                }}
                aria-label={`Banner color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Avatar */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] mb-2">
            Profile picture
          </label>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div
                className="h-24 w-24 rounded-full flex items-center justify-center text-2xl font-semibold overflow-hidden"
                style={{ background: avatar ? undefined : colorForName(username) }}
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[color:var(--color-bg-0)]">
                    {initials(username)}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-ring"
                aria-label="Upload avatar"
              >
                <Camera className="h-5 w-5" />
              </button>
              {avatar && (
                <button
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-[color:var(--color-danger)] text-white flex items-center justify-center hover:brightness-110"
                  aria-label="Remove avatar"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <Button variant="subtle" size="sm" onClick={() => fileRef.current?.click()}>
                Upload image
              </Button>
              <p className="mt-2 text-xs text-[color:var(--color-text-mute)]">
                JPG, PNG or GIF. Max 2 MB.
              </p>
            </div>
          </div>
        </div>

        {/* Username */}
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={24}
        />

        {/* Bio */}
        <Textarea
          label="About me"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          placeholder="Tell people a little about yourself..."
        />

        {/* Status */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] mb-2">
            Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all border ${
                  status === opt.value
                    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-text)]"
                    : "border-[color:var(--color-border)] text-[color:var(--color-text-dim)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text)]"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${opt.color}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-[color:var(--color-danger)]/30 bg-[color:var(--color-danger)]/10 px-3 py-2 text-sm text-[color:var(--color-danger)]">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[color:var(--color-border)]">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

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
