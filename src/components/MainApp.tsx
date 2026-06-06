import { useState, useEffect } from "react";
<<<<<<< HEAD
import type { User, Server, CallState } from "../lib/types";
import { storage } from "../lib/storage";
import { joinByInviteCode } from "../lib/auth";
=======
import type { User, CallState } from "../lib/types";
import { useAppStore } from "../lib/store";
>>>>>>> ca46219e9fbcab83d24b211ef878cf1422213454
import { ServerList } from "./ServerList";
import { ChannelList } from "./ChannelList";
import { ChatPanel } from "./ChatPanel";
import { VoicePanel } from "./VoicePanel";
import { DMList } from "./DMList";
import { DMPanel } from "./DMPanel";
import { UserPanel } from "./UserPanel";
import { ProfileModal } from "./ProfileModal";
import { SettingsModal } from "./SettingsModal";
<<<<<<< HEAD
import { chatBus } from "../lib/chat";
=======
>>>>>>> ca46219e9fbcab83d24b211ef878cf1422213454
import { Hash, Volume2, MessageSquare, Menu, Sparkles } from "lucide-react";
import { cn } from "../utils/cn";
import { motion, AnimatePresence } from "framer-motion";

interface MainAppProps { user: User; onLogout: () => void; onUserUpdate: (user: User) => void; }

type View = "server" | "dm";

export function MainApp({ user, onLogout, onUserUpdate }: MainAppProps) {
  const [servers, setServers] = useState<Server[]>(storage.getServers());
  const [selectedServerId, setSelectedServerId] = useState<string>(servers[0]?.id ?? "");
  const [selectedChannelId, setSelectedChannelId] = useState<string>(servers[0]?.channels[0]?.id ?? "");
  const [view, setView] = useState<View>("server");
  const [selectedPeer, setSelectedPeer] = useState<User | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [callState, setCallState] = useState<CallState>({ status: "idle" });
  const [dmUnread, setDmUnread] = useState(0);

  // Mobile sidebar state
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChannels, setShowChannels] = useState(false);

  // Check for ?invite= in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("invite");
    if (code) {
      const result = joinByInviteCode(code, user.id);
      if (result.ok && result.server) {
        const updated = storage.getServers();
        setServers(updated);
        setSelectedServerId(result.server.id);
        setView("server");
      }
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [user.id]);

  // Cross-tab server sync
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "vl_servers") setServers(storage.getServers());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // DM unread count
  useEffect(() => {
    function refresh() { setDmUnread(chatBus.getUnreadDMCount(user.id)); }
    refresh();
    return chatBus.onDM(refresh as () => void);
  }, [user.id]);

  const selectedServer = servers.find((s) => s.id === selectedServerId) ?? null;
  const selectedChannel = selectedServer?.channels.find((c) => c.id === selectedChannelId) ?? null;

  function handleServerSelect(id: string) {
    setSelectedServerId(id);
    const s = servers.find((sv) => sv.id === id);
    if (s?.channels.length) {
      const text = s.channels.find((c) => c.type === "text");
      setSelectedChannelId(text?.id ?? s.channels[0].id);
    }
    setView("server");
    setShowSidebar(false);
    setShowChannels(true);
  }

  function handleChannelSelect(id: string) {
    setSelectedChannelId(id);
    setShowChannels(false);
  }

  function handleServersChange(newServers: Server[]) {
    setServers(newServers);
    storage.setServers(newServers);
  }

  function handleDMsClick() {
    setView("dm");
    setSelectedPeer(null);
    setShowSidebar(false);
    setShowChannels(true);
  }

  function handleSelectPeer(peer: User) {
    setSelectedPeer(peer);
    setView("dm");
    setShowChannels(false);
  }

  const hasContent = (view === "server" && selectedChannel) || (view === "dm" && selectedPeer);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[color:var(--color-bg-2)]">
      {/* ---- Server rail (always visible on desktop, overlay on mobile) ---- */}
      <div className={cn(
        "flex-shrink-0 z-30",
        "lg:flex lg:relative lg:translate-x-0",
        showSidebar ? "flex fixed inset-0 bg-black/50" : "hidden lg:flex",
      )} onClick={showSidebar ? () => setShowSidebar(false) : undefined}>
        <div onClick={(e) => e.stopPropagation()} className="h-full">
          <ServerList
            servers={servers} selectedId={selectedServerId}
            onSelect={handleServerSelect} onServersChange={handleServersChange}
            currentUserId={user.id} dmUnread={dmUnread}
            showDMs={view === "dm"} onDMsClick={handleDMsClick}
          />
        </div>
      </div>

      {/* ---- Channel/DM list (collapsible on mobile) ---- */}
      <div className={cn(
        "flex-shrink-0 w-60 bg-[color:var(--color-bg-1)] flex flex-col h-full",
        "lg:flex",
        showChannels ? "flex fixed left-[68px] top-0 bottom-0 z-20 shadow-xl" : "hidden lg:flex",
      )}>
        {view === "server" && selectedServer ? (
          <ChannelList
            server={selectedServer} selectedChannelId={selectedChannelId}
            onSelect={handleChannelSelect} currentUser={user}
            onServersChange={handleServersChange}
            onClose={() => setShowChannels(false)}
          />
        ) : view === "dm" ? (
          <DMList currentUser={user} selectedPeerId={selectedPeer?.id ?? null}
            onSelectPeer={handleSelectPeer} onClose={() => setShowChannels(false)} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-[color:var(--color-text-mute)]">Select a server</p>
          </div>
        )}
        <UserPanel user={user} onProfileClick={() => setShowProfile(true)}
          onSettingsClick={() => setShowSettings(true)} onLogout={onLogout} onUserUpdate={onUserUpdate} />
      </div>

      {/* ---- Main content ---- */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[color:var(--color-bg-2)] min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg-2)] lg:hidden flex-shrink-0">
          <button onClick={() => setShowSidebar(true)} className="p-1.5 rounded-lg text-[color:var(--color-text-mute)] hover:bg-[color:var(--color-bg-4)] transition-colors">
            <Menu size={18} />
          </button>
          <button onClick={() => setShowChannels(!showChannels)} className="p-1.5 rounded-lg text-[color:var(--color-text-mute)] hover:bg-[color:var(--color-bg-4)] transition-colors">
            {view === "dm" ? <MessageSquare size={16} /> : selectedChannel?.type === "voice" ? <Volume2 size={16} /> : <Hash size={16} />}
          </button>
          <span className="text-sm font-semibold text-[color:var(--color-text)] truncate">
            {view === "dm"
              ? (selectedPeer?.username ?? "Direct Messages")
              : (selectedChannel ? `${selectedChannel.type === "text" ? "#" : ""}${selectedChannel.name}` : (selectedServer?.name ?? "VoiceLink"))}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === "server" && selectedChannel?.type === "text" && selectedServer && (
            <ChatPanel key={selectedChannelId} channel={selectedChannel} server={selectedServer} currentUser={user}
              onBack={() => setShowChannels(true)} />
          )}
          {view === "server" && selectedChannel?.type === "voice" && selectedServer && (
            <VoicePanel key={selectedChannelId} channel={selectedChannel} server={selectedServer} currentUser={user}
              onBack={() => setShowChannels(true)} />
          )}
          {view === "dm" && selectedPeer && (
            <DMPanel key={selectedPeer.id} currentUser={user} peer={selectedPeer}
              onBack={() => { setSelectedPeer(null); setShowChannels(true); }}
              callState={callState} onCallStateChange={setCallState} />
          )}
          {!hasContent && (
            <EmptyState
              isDM={view === "dm"}
              serverName={selectedServer?.name}
              onOpenSidebar={() => setShowSidebar(true)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} user={user}
        onUpdate={(u) => { onUserUpdate(u); setShowProfile(false); }} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} user={user}
        onUpdate={onUserUpdate} onLogout={onLogout} />
    </div>
  );
}

function EmptyState({ isDM, serverName, onOpenSidebar }: { isDM: boolean; serverName?: string; onOpenSidebar: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-5">
      <div className="h-16 w-16 rounded-full flex items-center justify-center bg-[color:var(--color-bg-3)]">
        {isDM ? <MessageSquare size={28} className="text-[color:var(--color-text-mute)]" />
               : <Sparkles size={28} className="text-[color:var(--color-accent)]" />}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--color-text)] mb-1">
          {isDM ? "Select a conversation" : serverName ? `Welcome to ${serverName}` : "No server selected"}
        </h2>
        <p className="text-sm text-[color:var(--color-text-dim)] max-w-xs">
          {isDM ? "Choose a user from the left panel to start chatting."
                : "Select a channel from the sidebar to start talking."}
        </p>
      </div>
      <button onClick={onOpenSidebar} className="lg:hidden px-4 py-2 rounded-xl bg-[color:var(--color-accent)] text-white text-sm font-medium hover:bg-[color:var(--color-accent-hover)] transition-colors">
        Open Sidebar
      </button>
    </div>
  );
}
