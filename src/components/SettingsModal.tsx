import { useState } from 'react';
import {
  LogOut,
  User,
  Bell,
  Shield,
  Keyboard,
  Sliders,
  Lock,
  Download,
  Trash2,
  Check,
} from 'lucide-react';
import type { User as UserType } from '../lib/types';
import { Modal } from './ui/Modal';
import { Button, Input, Divider, Toggle } from './ui/Primitives';
import { Avatar } from './ui/Avatar';
import { cn } from '../utils/cn';
import { storage, storageUsageKB } from '../lib/storage';
import { changePassword, updateUser } from '../lib/auth';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  user: UserType;
  onUpdate: (u: UserType) => void;
  onLogout: () => void;
}
type Tab = 'account' | 'appearance' | 'notifications' | 'privacy' | 'keybinds' | 'advanced';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'account', label: 'My Account', icon: <User size={14} /> },
  { id: 'appearance', label: 'Appearance', icon: <Sliders size={14} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={14} /> },
  { id: 'privacy', label: 'Privacy', icon: <Shield size={14} /> },
  { id: 'keybinds', label: 'Keybinds', icon: <Keyboard size={14} /> },
  { id: 'advanced', label: 'Advanced', icon: <Sliders size={14} /> },
];

export function SettingsModal({ open, onClose, user, onUpdate, onLogout }: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>('account');

  return (
    <Modal open={open} onClose={onClose} size="full">
      <div className="flex" style={{ height: 'min(600px, 90dvh)' }}>
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 flex flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-bg-2)]">
          <div className="px-4 py-4 border-b border-[color:var(--color-border)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-text-mute)]">
              User Settings
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5',
                  tab === t.id
                    ? 'bg-[color:var(--color-bg-5)] text-[color:var(--color-text)]'
                    : 'text-[color:var(--color-text-dim)] hover:bg-[color:var(--color-bg-4)] hover:text-[color:var(--color-text)]'
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
            <Divider className="my-2" />
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-soft)] transition-colors"
            >
              <LogOut size={14} /> Log Out
            </button>
          </nav>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[color:var(--color-bg-3)]">
          {tab === 'account' && (
            <AccountTab user={user} onUpdate={onUpdate} onLogout={onLogout} onClose={onClose} />
          )}
          {tab === 'appearance' && <AppearanceTab user={user} onUpdate={onUpdate} />}
          {tab === 'notifications' && <NotificationsTab user={user} onUpdate={onUpdate} />}
          {tab === 'privacy' && <PrivacyTab />}
          {tab === 'keybinds' && <KeybindsTab />}
          {tab === 'advanced' && <AdvancedTab onLogout={onLogout} onClose={onClose} />}
        </div>
      </div>
    </Modal>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-[color:var(--color-text)] mb-1">{children}</h2>;
}
function SectionDesc({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[color:var(--color-text-dim)] mb-4">{children}</p>;
}

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
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  function handlePw() {
    const r = changePassword(oldPw, newPw);
    setPwMsg({ ok: r.ok, msg: r.ok ? 'Password updated.' : (r.error ?? 'Error') });
    if (r.ok) {
      setOldPw('');
      setNewPw('');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>My Account</SectionTitle>
        <SectionDesc>Manage your VoiceLink account.</SectionDesc>
      </div>
      {/* Account card */}
      <div className="rounded-xl overflow-hidden border border-[color:var(--color-border)]">
        <div className="h-14" style={{ background: user.banner || '#1e2a3a' }} />
        <div className="flex items-end gap-3 px-4 pb-3 pt-0 -mt-5 bg-[color:var(--color-bg-4)]">
          <Avatar user={user} size="md" showStatus />
          <div className="pb-1">
            <p className="font-semibold text-[color:var(--color-text)] text-sm">{user.username}</p>
            <p className="text-xs text-[color:var(--color-text-mute)]">{user.email}</p>
          </div>
        </div>
        {user.bio && (
          <p className="px-4 pb-3 text-xs text-[color:var(--color-text-dim)] bg-[color:var(--color-bg-4)]">
            {user.bio}
          </p>
        )}
        <div className="px-4 pb-3 grid grid-cols-2 gap-2 text-xs bg-[color:var(--color-bg-4)]">
          <div className="p-2 rounded-lg bg-[color:var(--color-bg-5)]">
            <p className="text-[color:var(--color-text-mute)] mb-0.5">Member since</p>
            <p className="text-[color:var(--color-text)]">
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-[color:var(--color-bg-5)]">
            <p className="text-[color:var(--color-text-mute)] mb-0.5">User ID</p>
            <p className="text-[color:var(--color-text)] font-mono text-[10px] break-all">
              {user.id}
            </p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div>
        <h3 className="text-xs font-semibold text-[color:var(--color-text)] mb-3 flex items-center gap-1.5">
          <Lock size={13} /> Change Password
        </h3>
        <div className="space-y-2">
          <Input
            label="Current Password"
            type="password"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            placeholder="Current password"
          />
          <Input
            label="New Password"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="At least 6 characters"
          />
          {pwMsg && (
            <p
              className={cn(
                'text-xs',
                pwMsg.ok ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'
              )}
            >
              {pwMsg.msg}
            </p>
          )}
          <Button size="sm" variant="secondary" onClick={handlePw} disabled={!oldPw || !newPw}>
            Update Password
          </Button>
        </div>
      </div>
      <Divider />
      <div className="border border-[color:var(--color-danger)]/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[color:var(--color-danger)] mb-1">Danger Zone</h3>
        <p className="text-xs text-[color:var(--color-text-mute)] mb-3">
          Permanently delete your account and all local data.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm('Delete your account? This cannot be undone.')) {
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

function AppearanceTab({ user, onUpdate }: { user: UserType; onUpdate: (u: UserType) => void }) {
  const [compact, setCompact] = useState(user.compactMode ?? false);
  function save(patch: Partial<UserType>) {
    const u = updateUser(patch);
    if (u) onUpdate(u);
  }
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Appearance</SectionTitle>
        <SectionDesc>Customize how VoiceLink looks.</SectionDesc>
      </div>
      <Toggle
        label="Compact Mode"
        description="Reduce spacing in message lists."
        value={compact}
        onChange={(v) => {
          setCompact(v);
          save({ compactMode: v });
        }}
      />
      <div className="p-3 rounded-xl bg-[color:var(--color-bg-4)] text-xs text-[color:var(--color-text-mute)]">
        Theme colors can be changed by editing the CSS variables in{' '}
        <code className="font-mono bg-[color:var(--color-bg-5)] px-1 py-0.5 rounded text-[10px]">
          src/index.css
        </code>
        .
      </div>
    </div>
  );
}

function NotificationsTab({ user, onUpdate }: { user: UserType; onUpdate: (u: UserType) => void }) {
  const [sounds, setSounds] = useState(user.notifySounds ?? true);
  const [desktop, setDesktop] = useState(user.notifyDesktop ?? false);
  function save(patch: Partial<UserType>) {
    const u = updateUser(patch);
    if (u) onUpdate(u);
  }
  async function requestDesktop() {
    if (!('Notification' in window)) return;
    const r = await Notification.requestPermission();
    if (r === 'granted') {
      setDesktop(true);
      save({ notifyDesktop: true });
    }
  }
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Notifications</SectionTitle>
        <SectionDesc>Choose how you want to be notified.</SectionDesc>
      </div>
      <Toggle
        label="Notification Sounds"
        description="Play a sound on new messages."
        value={sounds}
        onChange={(v) => {
          setSounds(v);
          save({ notifySounds: v });
        }}
      />
      <div>
        <Toggle
          label="Desktop Notifications"
          description="Show system notifications."
          value={desktop}
          onChange={(v) => {
            if (v && Notification.permission !== 'granted') requestDesktop();
            else {
              setDesktop(v);
              save({ notifyDesktop: v });
            }
          }}
        />
        {Notification.permission === 'denied' && (
          <p className="text-xs text-[color:var(--color-danger)] mt-1 ml-1">
            Notifications are blocked in your browser.
          </p>
        )}
      </div>
    </div>
  );
}

function PrivacyTab() {
  const [dms, setDms] = useState(true);
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Privacy &amp; Safety</SectionTitle>
        <SectionDesc>Control who can reach you.</SectionDesc>
      </div>
      <Toggle
        label="Allow Direct Messages"
        description="Let any user send you DMs."
        value={dms}
        onChange={setDms}
      />
      <div className="p-3 rounded-xl bg-[color:var(--color-bg-4)] text-xs text-[color:var(--color-text-mute)] leading-relaxed">
        VoiceLink stores all data locally in your browser. Nothing is sent to external servers. Do
        not reuse passwords.
      </div>
    </div>
  );
}

function KeybindsTab() {
  const keys = [
    ['Send message', ['Enter']],
    ['New line', ['Shift', 'Enter']],
    ['Close / cancel', ['Esc']],
    ['React to message', ['Ctrl', '.']],
  ] as const;
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Keybinds</SectionTitle>
        <SectionDesc>Keyboard shortcuts.</SectionDesc>
      </div>
      <div className="space-y-2">
        {keys.map(([action, keyList]) => (
          <div
            key={action}
            className="flex items-center justify-between p-3 rounded-xl bg-[color:var(--color-bg-4)]"
          >
            <span className="text-sm text-[color:var(--color-text-dim)]">{action}</span>
            <div className="flex items-center gap-1">
              {(keyList as readonly string[]).map((k, i) => (
                <span key={i}>
                  <kbd className="px-2 py-0.5 rounded text-xs bg-[color:var(--color-bg-5)] border border-[color:var(--color-border)] font-mono text-[color:var(--color-text)]">
                    {k}
                  </kbd>
                  {i < keyList.length - 1 && (
                    <span className="text-[color:var(--color-text-mute)] mx-1 text-xs">+</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdvancedTab({ onLogout, onClose }: { onLogout: () => void; onClose: () => void }) {
  const kb = storageUsageKB();
  function exportData() {
    const data = storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voicelink-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Advanced</SectionTitle>
        <SectionDesc>Data management.</SectionDesc>
      </div>
      <div className="p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-4)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[color:var(--color-text-dim)]">Storage used</span>
          <span className="text-xs font-mono text-[color:var(--color-text)]">{kb} KB</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={exportData}>
            <Download size={13} /> Export Data
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              if (confirm('Clear all messages?')) storage.setMessages([]);
            }}
          >
            <Trash2 size={13} /> Clear Messages
          </Button>
        </div>
      </div>
      <div className="p-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-4)]">
        <p className="text-xs font-semibold text-[color:var(--color-text)] mb-1">About VoiceLink</p>
        <p className="text-xs text-[color:var(--color-text-mute)] leading-relaxed">
          v1.0.0 &middot; React 19, TypeScript, Tailwind CSS v4, Vite, WebRTC (full
          RTCPeerConnection with ICE/STUN), BroadcastChannel API.
          <br />
          <br />
          Demo application using client-side localStorage only. No backend required.
        </p>
      </div>
    </div>
  );
}
