import { useState } from "react";
import type { User, Server } from "../lib/types";
import { storage } from "../lib/storage";
import { ServerList } from "./ServerList";
import { ChannelList } from "./ChannelList";
import { ChatPanel } from "./ChatPanel";
import { VoicePanel } from "./VoicePanel";
import { UserPanel } from "./UserPanel";
import { ProfileModal } from "./ProfileModal";
import { SettingsModal } from "./SettingsModal";

interface MainAppProps {
  user: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

export function MainApp({ user, onLogout, onUserUpdate }: MainAppProps) {
  const [servers, setServers] = useState<Server[]>(storage.getServers());
  const [selectedServerId, setSelectedServerId] = useState<string>(servers[0]?.id || "");
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    servers[0]?.channels[0]?.id || "",
  );
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const selectedServer = servers.find((s) => s.id === selectedServerId) || null;
  const selectedChannel = selectedServer?.channels.find((c) => c.id === selectedChannelId) || null;

  function handleServerSelect(serverId: string) {
    setSelectedServerId(serverId);
    const server = servers.find((s) => s.id === serverId);
    if (server && server.channels.length > 0) {
      const textChannel = server.channels.find((c) => c.type === "text");
      setSelectedChannelId(textChannel?.id || server.channels[0].id);
    }
  }

  function handleChannelSelect(channelId: string) {
    setSelectedChannelId(channelId);
  }

  function handleProfileUpdate(updated: User) {
    onUserUpdate(updated);
    setShowProfile(false);
  }

  function handleServersChange(newServers: Server[]) {
    setServers(newServers);
    storage.setServers(newServers);
  }

  return (
    <div className="h-full flex bg-[color:var(--color-bg-1)]">
      {/* Server list */}
      <ServerList
        servers={servers}
        selectedId={selectedServerId}
        onSelect={handleServerSelect}
        onServersChange={handleServersChange}
        currentUserId={user.id}
      />

      {/* Channel list */}
      {selectedServer && (
        <ChannelList
          server={selectedServer}
          selectedChannelId={selectedChannelId}
          onSelect={handleChannelSelect}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
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
          <div className="flex-1 flex items-center justify-center text-[color:var(--color-text-mute)]">
            Select a channel to begin
          </div>
        )}

        {/* User panel */}
        <UserPanel
          user={user}
          onProfileClick={() => setShowProfile(true)}
          onSettingsClick={() => setShowSettings(true)}
          onLogout={onLogout}
        />
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
        onUpdate={handleProfileUpdate}
        onLogout={onLogout}
      />
    </div>
  );
}
