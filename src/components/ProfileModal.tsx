import { useState, useRef } from "react";
import { Camera, Save, Trash2, Check } from "lucide-react";
import type { User } from "../lib/types";
import { Modal, ModalHeader } from "./ui/Modal";
import { Button, Input, Textarea } from "./ui/Primitives";
import { updateUser } from "../lib/auth";
import { Avatar, colorForName, initials } from "./ui/Avatar";
import { cn } from "../utils/cn";
import { toast } from "sonner";

interface ProfileModalProps { open: boolean; onClose: () => void; user: User; onUpdate: (user: User) => void; }

const BANNERS = ["#1e2a3a","#1e2d2a","#2a1e2d","#2d1e1e","#1e1e2d","#2a2d1e","#2d2a1e","#1a2030","#20301a","#2d1e2a","#0d1117","#141820"];

const STATUS_OPTS: Array<{ value: User["status"]; label: string; dot: string }> = [
  { value: "online",  label: "Online",         dot: "bg-[color:var(--color-success)]"    },
  { value: "idle",    label: "Idle",            dot: "bg-[color:var(--color-warn)]"       },
  { value: "dnd",     label: "Do Not Disturb", dot: "bg-[color:var(--color-danger)]"     },
  { value: "offline", label: "Invisible",      dot: "bg-[color:var(--color-text-mute)]"  },
];

export function ProfileModal({ open, onClose, user, onUpdate }: ProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || "");
  const [customStatus, setCustomStatus] = useState(user.customStatus || "");
  const [banner, setBanner] = useState(user.banner || BANNERS[0]);
  const [avatar, setAvatar] = useState(user.avatar);
  const [status, setStatus] = useState(user.status);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError("Avatar must be under 3 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setAvatar(reader.result as string); setError(null); };
    reader.readAsDataURL(file);
  }

  function save() {
    const u = username.trim();
    if (u.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (u.length > 24) { setError("Username must be under 24 characters."); return; }
    const updated = updateUser({ username: u, bio, banner, avatar, status, customStatus });
    if (updated) {
      setSaved(true);
      toast.success("Profile updated successfully");
      setTimeout(() => setSaved(false), 2000);
      onUpdate(updated);
    } else {
      toast.error("Failed to update profile");
    }
  }

  const preview = username.trim() || user.username;

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <ModalHeader title="Edit Profile" onClose={onClose} />
      <div className="overflow-y-auto max-h-[80dvh] p-5">
        {/* Preview */}
        <div className="rounded-xl overflow-hidden border border-[color:var(--color-border)] mb-5">
          <div className="h-20" style={{ background: banner }} />
          <div className="flex items-end gap-3 px-4 pb-3 -mt-7 bg-[color:var(--color-bg-4)]">
            <div className="h-14 w-14 rounded-full border-4 border-[color:var(--color-bg-4)] overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ background: avatar ? "transparent" : colorForName(preview) }}>
              {avatar ? <img src={avatar} alt="avatar" className="h-full w-full object-cover" /> : <span className="text-lg font-bold text-white">{initials(preview)}</span>}
            </div>
            <div className="pb-1">
              <p className="font-semibold text-[color:var(--color-text)] text-sm">{preview}</p>
              {customStatus && <p className="text-xs text-[color:var(--color-text-dim)]">{customStatus}</p>}
            </div>
          </div>
          {bio && <p className="px-4 pb-3 text-xs text-[color:var(--color-text-dim)] bg-[color:var(--color-bg-4)] leading-relaxed">{bio}</p>}
        </div>

        <div className="space-y-5">
          {/* Avatar */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] block mb-2">Profile Picture</label>
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
                <Avatar user={{ username: preview, avatar, status }} size="lg" />
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={16} className="text-white" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>Upload Image</Button>
                {avatar && <Button size="sm" variant="danger" onClick={() => setAvatar(undefined)}><Trash2 size={12} /> Remove</Button>}
                <p className="text-[10px] text-[color:var(--color-text-mute)]">JPG, PNG, GIF &middot; Max 3 MB</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
            </div>
          </div>

          {/* Banner */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] block mb-2">Banner Color</label>
            <div className="flex flex-wrap gap-2">
              {BANNERS.map((c) => (
                <button key={c} onClick={() => setBanner(c)}
                  className="h-8 w-8 rounded-lg border-2 transition-all"
                  style={{ background: c, borderColor: banner === c ? "var(--color-accent)" : "transparent", boxShadow: banner === c ? "0 0 0 2px var(--color-bg-3)" : "none" }} />
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)] block mb-2">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTS.map((s) => (
                <button key={s.value} onClick={() => setStatus(s.value)}
                  className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                    status === s.value ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-text)]"
                    : "border-[color:var(--color-border)] text-[color:var(--color-text-dim)] hover:border-[color:var(--color-border-strong)]")}>
                  <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", s.dot)} />{s.label}
                </button>
              ))}
            </div>
          </div>

          <Input label="Custom Status" value={customStatus} onChange={(e) => setCustomStatus(e.target.value)} placeholder="What are you up to?" maxLength={64} />
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={24} hint="3-24 chars. Letters, numbers, underscores, dots, dashes." />
          <div>
            <Textarea label="About Me" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about yourself..." rows={3} maxLength={200} />
            <p className="text-[10px] text-[color:var(--color-text-mute)] mt-1 text-right">{bio.length}/200</p>
          </div>

          {error && <p className="text-sm text-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)] px-3 py-2 rounded-lg">{error}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2 px-5 py-4 border-t border-[color:var(--color-border)]">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={save} variant={saved ? "success" : "primary"}>
          {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Changes</>}
        </Button>
      </div>
    </Modal>
  );
}
