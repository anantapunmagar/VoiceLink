import { useState, useRef } from "react";
import { Camera, Save, Trash2, Check } from "lucide-react";
import type { User } from "../lib/types";
import { Modal, ModalHeader } from "./ui/Modal";
import { Button, Input, Textarea } from "./ui/Primitives";
import { updateUser } from "../lib/auth";
import { Avatar, colorForName, initials } from "./ui/Avatar";
import { cn } from "../utils/cn";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (user: User) => void;
}

const bannerColors = [
  "#3a2a1a", "#2a2f3a", "#2d3a2a", "#3a2a35",
  "#3a332a", "#26333a", "#332a3a", "#1f2937",
  "#3a2a2a", "#2a3a33", "#1a2a3a", "#2d2a3a",
];

const statusOptions: Array<{ value: User["status"]; label: string; dot: string }> = [
  { value: "online",  label: "Online",          dot: "bg-[color:var(--color-success)]"   },
  { value: "idle",    label: "Idle",             dot: "bg-[color:var(--color-accent)]"    },
  { value: "dnd",     label: "Do Not Disturb",   dot: "bg-[color:var(--color-danger)]"    },
  { value: "offline", label: "Invisible",        dot: "bg-[color:var(--color-text-mute)]" },
];

export function ProfileModal({ open, onClose, user, onUpdate }: ProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || "");
  const [customStatus, setCustomStatus] = useState(user.customStatus || "");
  const [banner, setBanner] = useState(user.banner || bannerColors[0]);
  const [avatar, setAvatar] = useState(user.avatar);
  const [status, setStatus] = useState(user.status);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("Avatar must be under 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
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
    const updated = updateUser({ username: trimmed, bio, banner, avatar, status, customStatus });
    if (updated) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onUpdate(updated);
    }
  }

  const previewName = username.trim() || user.username;

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="Edit Profile" onClose={onClose} />

      <div className="overflow-y-auto max-h-[80vh] p-6">
        {/* Preview card */}
        <div className="rounded-2xl overflow-hidden border border-[color:var(--color-border)] mb-6">
          <div className="h-24 relative" style={{ background: banner }}>
            <div className="absolute inset-0 flex items-end px-4 pb-0">
              <div
                className="h-16 w-16 rounded-full border-4 border-[color:var(--color-bg-2)] overflow-hidden flex items-center justify-center translate-y-8 flex-shrink-0"
                style={{ background: avatar ? "transparent" : colorForName(previewName) }}
              >
                {avatar ? (
                  <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold" style={{ color: "#0f1013" }}>
                    {initials(previewName)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="pt-10 px-4 pb-4" style={{ background: "var(--color-bg-3)" }}>
            <p className="font-semibold text-[color:var(--color-text)]">{previewName}</p>
            {customStatus && (
              <p className="text-xs text-[color:var(--color-text-dim)] mt-0.5">{customStatus}</p>
            )}
            {bio && (
              <p className="text-xs text-[color:var(--color-text-dim)] mt-2 leading-relaxed">{bio}</p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {/* Avatar */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-dim)] block mb-2">
              Profile Picture
            </label>
            <div className="flex items-center gap-3">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <Avatar user={{ username: previewName, avatar, status }} size="lg" />
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={16} className="text-white" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                  Upload Image
                </Button>
                {avatar && (
                  <Button size="sm" variant="danger" onClick={() => setAvatar(undefined)}>
                    <Trash2 size={13} /> Remove
                  </Button>
                )}
                <p className="text-xs text-[color:var(--color-text-mute)]">JPG, PNG or GIF · Max 3 MB</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Banner */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-dim)] block mb-2">
              Banner Color
            </label>
            <div className="flex flex-wrap gap-2">
              {bannerColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setBanner(c)}
                  className="h-9 w-9 rounded-lg border-2 transition-all focus-ring"
                  style={{
                    background: c,
                    borderColor: banner === c ? "var(--color-accent)" : "transparent",
                    boxShadow: banner === c ? "0 0 0 2px var(--color-bg-2)" : "none",
                  }}
                  aria-label={`Banner color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-dim)] block mb-2">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                    status === s.value
                      ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 text-[color:var(--color-text)]"
                      : "border-[color:var(--color-border)] text-[color:var(--color-text-dim)] hover:border-[color:var(--color-border-strong)]",
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", s.dot)} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom status */}
          <Input
            label="Custom Status"
            value={customStatus}
            onChange={(e) => setCustomStatus(e.target.value)}
            placeholder="What are you up to?"
            maxLength={64}
          />

          {/* Username */}
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={24}
            hint="3-24 characters. Letters, numbers, underscores, dots, dashes."
          />

          {/* Bio */}
          <Textarea
            label="About Me"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a little about yourself..."
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-[color:var(--color-text-mute)] -mt-3 text-right">
            {bio.length}/200
          </p>

          {error && (
            <p className="text-sm text-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t border-[color:var(--color-border)]">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant={saved ? "success" : "primary"}>
          {saved ? (
            <>
              <Check size={15} /> Saved
            </>
          ) : (
            <>
              <Save size={15} /> Save Changes
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
