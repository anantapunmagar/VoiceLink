import { useState } from "react";
import {
  LogOut, User, Bell, Shield, Keyboard, Trash2, Download, Lock, Palette,
} from "lucide-react";
import type { User as UserType } from "../lib/types";
import { Modal } from "./ui/Modal";
import { Button, Input, Select, Divider } from "./ui/Primitives";
import { Avatar } from "./ui/Avatar";
import { cn } from "../utils/cn";
import { storage, storageUsageKB } from "../lib/storage";
import { changePassword, updateUser } from "../lib/auth";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  user: UserType;
  onUpdate: (user: UserType) => void;
  onLogout: () => void;
}

type Tab = "account" | "appearance" | "notifications" | "privacy" | "keybinds" | "advanced";

const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "account", label: "My Account", icon: <User size={15} /> },
  { id: "appearance", label: "Appearance", icon: <Palette size={15} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={15} /> },
  { id: "privacy", label: "Privacy & Safety", icon: <Shield size={15} /> },
  { id: "keybinds", label: "Keybinds", icon: <Keyboard size={15} /> },
  { id: "advanced", label: "Advanced", icon: <Trash2 size={15} /> },
];

export function SettingsModal({ open, onClose, user, onUpdate, onLogout }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("account");

  return (
    <Modal open={open} onClose={onClose} size="full">
      <div className="flex h-[600px]">
        {/* Sidebar */}
        <div
          className="w-56 flex-shrink-0 flex flex-col border-r border-[color:var(--color-border)]"
          style={{ background: "var(--color-bg-1)" }}
        >
          <div className="p-4 pb-2">
            <p className="text-xs font-semibold text-[color:var(--color-text-mute)] uppercase tracking-wider">
              User Settings
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5",
                  activeTab === tab.id
                    ? "bg-[color:var(--color-bg-4)] text-[color:var(--color-text)]"
                    : "text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-bg-3)] hover:text-[color:var(--color-text)]",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <Divider />
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/10 transition-colors"
            >
              <LogOut size={15} />
              Log Out
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: "var(--color-bg-2)" }}>
          {activeTab === "account" && <AccountTab user={user} onUpdate={onUpdate} onLogout={onLogout} onClose={onClose} />}
          {activeTab === "appearance" && <AppearanceTab user={user} onUpdate={onUpdate} />}
          {activeTab === "notifications" && <NotificationsTab user={user} onUpdate={onUpdate} />}
          {activeTab === "privacy" && <PrivacyTab user={user} onUpdate={onUpdate} />}
          {activeTab === "keybinds" && <KeybindsTab />}
          {activeTab === "advanced" && <AdvancedTab onLogout={onLogout} onClose={onClose} />}
        </div>
      </div>
    </Modal>
  );
}

// ---- Account Tab ----

function AccountTab({
  user,
  onUpdate,
  onLogout,
  onClose,
}: {
  user: UserType;
  onUpdate: (u: UserType) => void;
  onLogout: () => void;
  onClose: () => void;
}) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  function handleChangePassword() {
    const result = changePassword(oldPw, newPw);
    setPwMsg({ ok: result.ok, msg: result.ok ? "Password updated successfully!" : result.error ?? "Error" });
    if (result.ok) { setOldPw(""); setNewPw(""); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[color:var(--color-text)] mb-0.5">My Account</h2>
        <p className="text-sm text-[color:var(--color-text-dim)]">Manage your VoiceLink account details.</p>
      </div>

      {/* Account card */}
      <div className="rounded-xl overflow-hidden border border-[color:var(--color-border)]">
        <div className="h-16" style={{ background: user.banner || "#2a2f3a" }} />
        <div className="flex items-end gap-4 px-4 pb-3 pt-0 -mt-6" style={{ background: "var(--color-bg-3)" }}>
          <Avatar user={user} size="lg" showStatus />
          <div className="pb-1">
            <p className="font-semibold text-[color:var(--color-text)]">{user.username}</p>
            <p className="text-sm text-[color:var(--color-text-mute)]">{user.email}</p>
          </div>
        </div>
        <div className="px-4 pb-4" style={{ background: "var(--color-bg-3)" }}>
          {user.bio && (
            <div className="mt-2 p-3 rounded-lg bg-[color:var(--color-bg-4)] text-sm text-[color:var(--color-text-dim)]">
              {user.bio}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <InfoRow label="Member since" value={new Date(user.createdAt).toLocaleDateString()} />
            <InfoRow label="User ID" value={user.id} mono />
          </div>
        </div>
      </div>

      {/* Change password */}
      <div>
        <h3 className="text-sm font-semibold text-[color:var(--color-text)] mb-3 flex items-center gap-2">
          <Lock size={14} /> Change Password
        </h3>
        <div className="space-y-3">
          <Input
            label="Current Password"
            type="password"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            placeholder="Your current password"
          />
          <Input
            label="New Password"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="At least 6 characters"
          />
          {pwMsg && (
            <p className={cn("text-sm", pwMsg.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-danger)]")}>
              {pwMsg.msg}
            </p>
          )}
          <Button size="sm" variant="secondary" onClick={handleChangePassword} disabled={!oldPw || !newPw}>
            Update Password
          </Button>
        </div>
      </div>

      <Divider />

      {/* Danger zone */}
      <div className="border border-[color:var(--color-danger)]/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[color:var(--color-danger)] mb-1">Danger Zone</h3>
        <p className="text-xs text-[color:var(--color-text-mute)] mb-3">
          Deleting your account removes all your data from local storage. This cannot be undone.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm("Delete account? This will clear all local data for your user.")) {
              localStorage.clear();
              onLogout();
              onClose();
            }
          }}
        >
          <Trash2 size={13} /> Delete Account
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-2 rounded-lg bg-[color:var(--color-bg-4)]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-text-mute)] mb-0.5">{label}</p>
      <p className={cn("text-xs text-[color:var(--color-text)] break-all", mono && "font-mono")}>{value}</p>
    </div>
  );
}

// ---- Appearance Tab ----

function AppearanceTab({ user, onUpdate }: { user: UserType; onUpdate: (u: UserType) => void }) {
  const [compact, setCompact] = useState(user.compactMode ?? false);

  function save(patch: Partial<UserType>) {
    const updated = updateUser(patch);
    if (updated) onUpdate(updated);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[color:var(--color-text)] mb-0.5">Appearance</h2>
        <p className="text-sm text-[color:var(--color-text-dim)]">Customize how VoiceLink looks for you.</p>
      </div>

      <div className="space-y-4">
        <Toggle
          label="Compact Mode"
          description="Reduce message spacing for denser conversations."
          value={compact}
          onChange={(v) => { setCompact(v); save({ compactMode: v }); }}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[color:var(--color-text)] mb-3">Accent Color</h3>
        <p className="text-xs text-[color:var(--color-text-mute)]">
          The accent color is currently <code className="px-1 py-0.5 rounded bg-[color:var(--color-bg-4)] font-mono text-[10px]">#d4a574</code>. 
          Custom theme colors can be set by modifying the CSS variables in <code className="px-1 py-0.5 rounded bg-[color:var(--color-bg-4)] font-mono text-[10px]">src/index.css</code>.
        </p>
      </div>
    </div>
  );
}

// ---- Notifications Tab ----

function NotificationsTab({ user, onUpdate }: { user: UserType; onUpdate: (u: UserType) => void }) {
  const [sounds, setSounds] = useState(user.notifySounds ?? true);
  const [desktop, setDesktop] = useState(user.notifyDesktop ?? false);

  function save(patch: Partial<UserType>) {
    const updated = updateUser(patch);
    if (updated) onUpdate(updated);
  }

  async function requestDesktopPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    if (result === "granted") {
      setDesktop(true);
      save({ notifyDesktop: true });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[color:var(--color-text)] mb-0.5">Notifications</h2>
        <p className="text-sm text-[color:var(--color-text-dim)]">Choose how you want to be notified.</p>
      </div>

      <div className="space-y-4">
        <Toggle
          label="Notification Sounds"
          description="Play a sound when you receive a new message."
          value={sounds}
          onChange={(v) => { setSounds(v); save({ notifySounds: v }); }}
        />
        <div>
          <Toggle
            label="Desktop Notifications"
            description="Show browser notifications when a message arrives."
            value={desktop}
            onChange={(v) => {
              if (v && Notification.permission !== "granted") {
                requestDesktopPermission();
              } else {
                setDesktop(v);
                save({ notifyDesktop: v });
              }
            }}
          />
          {Notification.permission === "denied" && (
            <p className="text-xs text-[color:var(--color-danger)] mt-1 ml-1">
              Browser notifications are blocked. Please allow them in your browser settings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Privacy Tab ----

function PrivacyTab({ user, onUpdate }: { user: UserType; onUpdate: (u: UserType) => void }) {
  const [dms, setDms] = useState(true);
  const [activity, setActivity] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[color:var(--color-text)] mb-0.5">Privacy & Safety</h2>
        <p className="text-sm text-[color:var(--color-text-dim)]">Control who can reach you and what data is shared.</p>
      </div>

      <div className="space-y-4">
        <Toggle
          label="Allow Direct Messages"
          description="Let other users send you direct messages."
          value={dms}
          onChange={setDms}
        />
        <Toggle
          label="Show Activity Status"
          description="Display what you're currently doing to others."
          value={activity}
          onChange={setActivity}
        />
      </div>

      <div className="p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-3)]">
        <h3 className="text-sm font-semibold text-[color:var(--color-text)] mb-1">Data Notice</h3>
        <p className="text-xs text-[color:var(--color-text-mute)] leading-relaxed">
          VoiceLink is a demo application. All data is stored exclusively in your browser's localStorage. 
          Nothing is sent to external servers. Passwords are hashed but not production-grade — do not reuse passwords.
        </p>
      </div>
    </div>
  );
}

// ---- Keybinds Tab ----

function KeybindsTab() {
  const keybinds = [
    { action: "Send message", keys: ["Enter"] },
    { action: "New line in message", keys: ["Shift", "Enter"] },
    { action: "Cancel / close", keys: ["Esc"] },
    { action: "Edit last message", keys: ["↑"] },
    { action: "Open emoji picker", keys: ["Ctrl", "."] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[color:var(--color-text)] mb-0.5">Keybinds</h2>
        <p className="text-sm text-[color:var(--color-text-dim)]">Shortcuts for common actions.</p>
      </div>

      <div className="space-y-2">
        {keybinds.map((kb) => (
          <div key={kb.action} className="flex items-center justify-between p-3 rounded-lg bg-[color:var(--color-bg-3)]">
            <span className="text-sm text-[color:var(--color-text-dim)]">{kb.action}</span>
            <div className="flex items-center gap-1">
              {kb.keys.map((k, i) => (
                <span key={i}>
                  <kbd className="px-2 py-0.5 rounded text-xs bg-[color:var(--color-bg-4)] border border-[color:var(--color-border)] font-mono text-[color:var(--color-text)]">
                    {k}
                  </kbd>
                  {i < kb.keys.length - 1 && <span className="text-[color:var(--color-text-mute)] mx-1 text-xs">+</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Advanced Tab ----

function AdvancedTab({ onLogout, onClose }: { onLogout: () => void; onClose: () => void }) {
  const usageKB = storageUsageKB();

  function exportData() {
    const data = storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voicelink-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearMessages() {
    if (!confirm("Clear all messages? This cannot be undone.")) return;
    storage.setMessages([]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-[color:var(--color-text)] mb-0.5">Advanced</h2>
        <p className="text-sm text-[color:var(--color-text-dim)]">Low-level preferences and data management.</p>
      </div>

      <div className="p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-3)]">
        <h3 className="text-sm font-semibold text-[color:var(--color-text)] mb-1">Local Storage</h3>
        <p className="text-xs text-[color:var(--color-text-mute)] mb-3 leading-relaxed">
          All VoiceLink data is stored in your browser's localStorage.
        </p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[color:var(--color-text-dim)]">Storage used</span>
          <span className="text-xs font-mono text-[color:var(--color-text)]">{usageKB} KB</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={exportData}>
            <Download size={13} /> Export Data
          </Button>
          <Button size="sm" variant="danger" onClick={clearMessages}>
            <Trash2 size={13} /> Clear Messages
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-3)]">
        <h3 className="text-sm font-semibold text-[color:var(--color-text)] mb-1">About VoiceLink</h3>
        <p className="text-xs text-[color:var(--color-text-mute)] leading-relaxed">
          Version 1.0.0 · Built with React 19, TypeScript, Tailwind CSS v4, Vite, WebRTC, and BroadcastChannel API.
          <br /><br />
          This is a demo application using client-side storage only.
          Not suitable for production without a backend server.
        </p>
      </div>
    </div>
  );
}

// ---- Toggle ----

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[color:var(--color-bg-3)]">
      <div>
        <p className="text-sm font-medium text-[color:var(--color-text)]">{label}</p>
        <p className="text-xs text-[color:var(--color-text-mute)] mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
          value ? "bg-[color:var(--color-accent)]" : "bg-[color:var(--color-bg-4)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            value ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
