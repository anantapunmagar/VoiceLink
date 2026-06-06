import { useState, useEffect } from "react";
import type { User, Server } from "../lib/types";
import { storage } from "../lib/storage";
import { ServerList } from "./ServerList";
import { ChannelList } from "./ChannelList";
import { ChatPanel } from "./ChatPanel";
import { VoicePanel } from "./VoicePanel";
import { UserPanel } from "./UserPanel";
import { ProfileModal } from "./ProfileModal";
import { SettingsModal } from "./SettingsModal";
import { Hash, Volume2, Sparkles } from "lucide-react";

interface MainAppProps {
  user: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

export function MainApp({ user, onLogout, onUserUpdate }: MainAppProps) {
  const [servers, setServers] = useState<Server[]>(storage.getServers());
  const [selectedServerId, setSelectedServerId] = useState(servers[0]?.id || "");
  const [selectedChannelId, setSelectedChannelId] = useState(
    servers[0]?.channels[0]?.id || "",
  );
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const selectedServer = servers.find((s) => s.id === selectedServerId) || null;
  const selectedChannel =
    selectedServer?.channels.find((c) => c.id === selectedChannelId) || null;

  // Sync servers from storage when another tab changes them
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "vl_servers") {
        setServers(storage.getServers());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function handleServerSelect(serverId: string) {
    setSelectedServerId(serverId);
    const server = servers.find((s) => s.id === serverId);
    if (server && server.channels.length > 0) {
      const textChannel = server.channels.find((c) => c.type === "text");
      setSelectedChannelId(textChannel?.id || server.channels[0].id);
    }
  }

  function handleServersChange(newServers: Server[]) {
    setServers(newServers);
    storage.setServers(newServers);
  }

  function handleProfileUpdate(updated: User) {
    onUserUpdate(updated);
    setShowProfile(false);
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--color-bg-0)" }}>
      {/* Server list */}
      <ServerList
        servers={servers}
        selectedId={selectedServerId}
        onSelect={handleServerSelect}
        onServersChange={handleServersChange}
        currentUserId={user.id}
      />

      {/* Vertical divider */}
      <div className="w-px bg-[color:var(--color-border)] flex-shrink-0" />

      {/* Channel list + user panel */}
      {selectedServer ? (
        <div className="flex flex-col flex-shrink-0" style={{ width: 240 }}>
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChannelList
              server={selectedServer}
              selectedChannelId={selectedChannelId}
              onSelect={setSelectedChannelId}
              currentUser={user}
              onServersChange={handleServersChange}
            />
          </div>
          <UserPanel
            user={user}
            onProfileClick={() => setShowProfile(true)}
            onSettingsClick={() => setShowSettings(true)}
            onLogout={onLogout}
            onUserUpdate={onUserUpdate}
          />
        </div>
      ) : (
        <div className="w-60 flex items-center justify-center text-sm text-[color:var(--color-text-mute)]">
          No server selected
        </div>
      )}

      {/* Vertical divider */}
      <div className="w-px bg-[color:var(--color-border)] flex-shrink-0" />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--color-bg-1)" }}>
        {selectedChannel?.type === "text" ? (
          <ChatPanel
            channel={selectedChannel}
            server={selectedServer!}
            currentUser={user}
          />
        ) : selectedChannel?.type === "voice" ? (
          <VoicePanel
            channel={selectedChannel}
            server={selectedServer!}
            currentUser={user}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Modals */}
      <ProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        user={user}
        onUpdate={handleProfileUpdate}
      />
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        onUpdate={onUserUpdate}
        onLogout={onLogout}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center p-8">
      <div
        className="h-20 w-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: "var(--color-bg-3)" }}
      >
        <Sparkles size={32} className="text-[color:var(--color-accent)]" />
      </div>
      <h2 className="text-xl font-semibold text-[color:var(--color-text)] mb-2">
        Welcome to VoiceLink
      </h2>
      <p className="text-sm text-[color:var(--color-text-dim)] max-w-sm leading-relaxed">
        Select a channel from the left sidebar to start chatting, or join a voice channel to talk with others.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 max-w-xs">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[color:var(--color-bg-3)] border border-[color:var(--color-border)]">
          <Hash size={16} className="text-[color:var(--color-accent)]" />
          <span className="text-xs text-[color:var(--color-text-dim)]">Text channels</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[color:var(--color-bg-3)] border border-[color:var(--color-border)]">
          <Volume2 size={16} className="text-[color:var(--color-accent)]" />
          <span className="text-xs text-[color:var(--color-text-dim)]">Voice rooms</span>
        </div>
      </div>
    </div>
  );
}
