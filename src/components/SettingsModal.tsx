import { useState } from "react";
import { LogOut, User, Bell, Shield, Keyboard, Trash2, Download } from "lucide-react";
import type { User as UserType } from "../lib/types";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Primitives";
import { Avatar } from "./ui/Avatar";
import { cn } from "../utils/cn";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  user: UserType;
  onUpdate: (user: UserType) => void;
  onLogout: () => void;
}

type Tab = "account" | "notifications" | "privacy" | "keybinds" | "advanced";

const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: "account", label: "My Account", icon: <User className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "privacy", label: "Privacy & Safety", icon: <Shield className="h-4 w-4" /> },
  { id: "keybinds", label: "Keybinds", icon: <Keyboard className="h-4 w-4" /> },
  { id: "advanced", label: "Advanced", icon: <Download className="h-4 w-4" /> },
];

export function SettingsModal({ open, onClose, user, onLogout }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("account");

  return (
    <Modal open={open} onClose={onClose} size="xl" className="h-[640px] max-h-[85vh]">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-56 bg-[color:var(--color-bg-1)] border-r border-[color:var(--color-border)] py-5 px-2 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-mute)] mb-2">
            User Settings
          </p>
          <div className="space-y-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                  activeTab === tab.id
                    ? "bg-[color:var(--color-bg-4)] text-[color:var(--color-text)]"
                    : "text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-bg-3)] hover:text-[color:var(--color-text)]",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="my-3 h-px bg-[color:var(--color-border)]" />

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger)]/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md text-[color:var(--color-text-mute)] hover:text-[color:var(--color-text)] hover:bg-[color:var(--color-bg-3)] transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="p-8 max-w-2xl">
            {activeTab === "account" && <AccountTab user={user} onLogout={onLogout} onClose={onClose} />}
            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "privacy" && <PrivacyTab />}
            {activeTab === "keybinds" && <KeybindsTab />}
            {activeTab === "advanced" && <AdvancedTab />}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AccountTab({ user, onLogout, onClose }: { user: UserType; onLogout: () => void; onClose: () => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">My Account</h2>
      <p className="text-sm text-[color:var(--color-text-dim)] mb-6">Manage your VoiceLink account details.</p>

      <div className="rounded-lg overflow-hidden border border-[color:var(--color-border)]">
        <div className="h-24" style={{ background: user.banner || "#2a2f3a" }} />
        <div className="px-5 py-4 bg-[color:var(--color-bg-3)] flex items-end gap-4 -mt-8">
          <div className="ring-4 ring-[color:var(--color-bg-3)] rounded-full">
            <Avatar user={user} size="xl" showStatus />
          </div>
          <div className="pb-1 flex-1">
            <h3 className="font-semibold text-lg">{user.username}</h3>
            <p className="text-sm text-[color:var(--color-text-dim)]">{user.email}</p>
          </div>
        </div>
        {user.bio && (
          <div className="px-5 py-4 bg-[color:var(--color-bg-3)] border-t border-[color:var(--color-border)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text-mute)] mb-1.5">
              About Me
            </p>
            <p className="text-sm text-[color:var(--color-text)] whitespace-pre-wrap">{user.bio}</p>
          </div>
        )}
      </div>

      <div className="mt-8 space-y-3">
        <InfoRow label="Username" value={user.username} />
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Member since" value={new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })} />
        <InfoRow label="Account ID" value={user.id} mono />
      </div>

      <div className="mt-10 pt-6 border-t border-[color:var(--color-border)]">
        <h3 className="text-sm font-semibold text-[color:var(--color-danger)] mb-3">Account removal</h3>
        <p className="text-sm text-[color:var(--color-text-dim)] mb-4">
          Deleting your account will remove all your messages and data. This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => {
            if (confirm("Delete account? This will clear all local data for your user.")) {
              localStorage.clear();
              onLogout();
              onClose();
            }
          }}>
            <Trash2 className="h-4 w-4" />
            Delete account
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[color:var(--color-border)] last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-mute)]">
        {label}
      </span>
      <span className={cn("text-sm text-[color:var(--color-text)]", mono && "font-mono text-xs")}>
        {value}
      </span>
    </div>
  );
}

function NotificationsTab() {
  const [desktop, setDesktop] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [mentions, setMentions] = useState(true);
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Notifications</h2>
      <p className="text-sm text-[color:var(--color-text-dim)] mb-6">Choose how you want to be notified.</p>
      <div className="space-y-1">
        <Toggle label="Desktop notifications" description="Show system notifications for new messages." value={desktop} onChange={setDesktop} />
        <Toggle label="Notification sounds" description="Play a sound for new messages and mentions." value={sounds} onChange={setSounds} />
        <Toggle label="Only notify for mentions" description="Suppress notifications unless you're mentioned." value={mentions} onChange={setMentions} />
      </div>
    </div>
  );
}

function PrivacyTab() {
  const [dms, setDms] = useState(true);
  const [activity, setActivity] = useState(false);
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Privacy & Safety</h2>
      <p className="text-sm text-[color:var(--color-text-dim)] mb-6">Control who can reach you and what data is shared.</p>
      <div className="space-y-1">
        <Toggle label="Allow direct messages" description="Let other users send you private messages." value={dms} onChange={setDms} />
        <Toggle label="Share activity status" description="Show others what you're currently doing." value={activity} onChange={setActivity} />
      </div>
    </div>
  );
}

function KeybindsTab() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Keybinds</h2>
      <p className="text-sm text-[color:var(--color-text-dim)] mb-6">Shortcuts for common actions.</p>
      <div className="space-y-1 border border-[color:var(--color-border)] rounded-lg overflow-hidden">
        <Keybind action="Toggle mute" keys={["Ctrl", "Shift", "M"]} />
        <Keybind action="Toggle video" keys={["Ctrl", "Shift", "V"]} />
        <Keybind action="Focus message box" keys={["Ctrl", "K"]} />
        <Keybind action="Close modal" keys={["Esc"]} />
      </div>
    </div>
  );
}

function Keybind({ action, keys }: { action: string; keys: string[] }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--color-border)] last:border-0">
      <span className="text-sm text-[color:var(--color-text)]">{action}</span>
      <div className="flex gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="px-2 py-1 rounded text-xs font-mono bg-[color:var(--color-bg-3)] border border-[color:var(--color-border-strong)] text-[color:var(--color-text-dim)]"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

function AdvancedTab() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Advanced</h2>
      <p className="text-sm text-[color:var(--color-text-dim)] mb-6">Low-level preferences and data management.</p>
      <div className="rounded-lg border border-[color:var(--color-border)] p-5 space-y-3">
        <h3 className="text-sm font-semibold">Local storage</h3>
        <p className="text-sm text-[color:var(--color-text-dim)]">
          VoiceLink stores your account, messages and servers in your browser's local storage for this demo build.
        </p>
        <Button
          variant="subtle"
          size="sm"
          onClick={() => {
            const data = {
              users: localStorage.getItem("vl_users"),
              servers: localStorage.getItem("vl_servers"),
              messages: localStorage.getItem("vl_messages"),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "voicelink-export.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-4 w-4" />
          Export data
        </Button>
      </div>
    </div>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg hover:bg-[color:var(--color-bg-2)] transition-colors">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-[color:var(--color-text)]">{label}</p>
        <p className="text-xs text-[color:var(--color-text-dim)] mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          value ? "bg-[color:var(--color-accent)]" : "bg-[color:var(--color-bg-4)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
