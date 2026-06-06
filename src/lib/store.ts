import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Server, Message, VoiceState, DirectMessage, Channel } from './types';
import { storage, generateId, hashPassword, generateInviteCode } from './storage';

interface AppState {
  // Auth
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // Servers & Channels
  servers: Server[];
  setServers: (servers: Server[]) => void;
  activeServerId: string | null;
  setActiveServerId: (id: string | null) => void;
  activeChannelId: string | null;
  setActiveChannelId: (id: string | null) => void;

  // Messages
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;

  // DMs
  dms: DirectMessage[];
  setDMs: (dms: DirectMessage[]) => void;
  activeDMUserId: string | null;
  setActiveDMUserId: (id: string | null) => void;

  // Voice
  voiceStates: VoiceState[];
  setVoiceStates: (states: VoiceState[]) => void;

  // UI State
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Actions
  createServer: (name: string, userId: string) => Server;
  joinServer: (inviteCode: string, userId: string) => boolean;
  createChannel: (serverId: string, name: string, type: 'text' | 'voice') => void;
  sendMessage: (content: string, channelId: string, serverId: string, authorId: string) => void;
  toggleReaction: (messageId: string, emoji: string, userId: string) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state from storage
      currentUser: storage.getCurrentUserId() 
        ? storage.getUsers().find(u => u.id === storage.getCurrentUserId()) || null 
        : null,
      servers: storage.getServers(),
      activeServerId: null,
      activeChannelId: null,
      messages: storage.getMessages(),
      dms: storage.getDMs(),
      voiceStates: storage.getVoiceStates(),
      activeDMUserId: null,

      // UI
      showProfileModal: false,
      showSettingsModal: false,
      isMobileMenuOpen: false,

      setCurrentUser: (user) => {
        set({ currentUser: user });
        if (user) {
          storage.setCurrentUserId(user.id);
        } else {
          storage.setCurrentUserId(null);
        }
      },

      setServers: (servers) => {
        set({ servers });
        storage.setServers(servers);
      },

      setActiveServerId: (id) => set({ activeServerId: id }),
      setActiveChannelId: (id) => set({ activeChannelId: id }),

      setMessages: (messages) => {
        set({ messages });
        storage.setMessages(messages);
      },

      addMessage: (message) => {
        const messages = [...get().messages, message];
        set({ messages });
        storage.setMessages(messages);
      },

      setDMs: (dms) => {
        set({ dms });
        storage.setDMs(dms);
      },

      setActiveDMUserId: (id) => set({ activeDMUserId: id }),

      setVoiceStates: (states) => {
        set({ voiceStates: states });
        storage.setVoiceStates(states);
      },

      setShowProfileModal: (show) => set({ showProfileModal: show }),
      setShowSettingsModal: (show) => set({ showSettingsModal: show }),
      setIsMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

      // Business logic
      createServer: (name, userId) => {
        const newServer: Server = {
          id: generateId(),
          name,
          ownerId: userId,
          members: [userId],
          channels: [
            { id: generateId(), name: 'general', type: 'text', serverId: '' },
            { id: generateId(), name: 'voice', type: 'voice', serverId: '' },
          ],
          createdAt: Date.now(),
          inviteCode: generateInviteCode(),
        };
        // Fix channel serverId
        newServer.channels.forEach(c => c.serverId = newServer.id);

        const servers = [...get().servers, newServer];
        set({ servers, activeServerId: newServer.id, activeChannelId: newServer.channels[0].id });
        storage.setServers(servers);
        return newServer;
      },

      joinServer: (inviteCode, userId) => {
        const servers = get().servers;
        const server = servers.find(s => s.inviteCode === inviteCode);
        if (!server || server.members.includes(userId)) return false;

        const updated = servers.map(s =>
          s.id === server.id ? { ...s, members: [...s.members, userId] } : s
        );
        set({ servers: updated, activeServerId: server.id });
        storage.setServers(updated);
        return true;
      },

      createChannel: (serverId, name, type) => {
        const servers = get().servers.map(server => {
          if (server.id === serverId) {
            const newChannel: Channel = {
              id: generateId(),
              name: name.toLowerCase().replace(/\s+/g, '-'),
              type,
              serverId,
            };
            return { ...server, channels: [...server.channels, newChannel] };
          }
          return server;
        });
        set({ servers });
        storage.setServers(servers);
      },

      sendMessage: (content, channelId, serverId, authorId) => {
        const newMessage: Message = {
          id: generateId(),
          content: content.trim(),
          authorId,
          channelId,
          serverId,
          timestamp: Date.now(),
          type: 'text',
          reactions: {},
        };
        get().addMessage(newMessage);
      },

      toggleReaction: (messageId, emoji, userId) => {
        const messages = get().messages.map(msg => {
          if (msg.id === messageId) {
            const reactions = { ...(msg.reactions || {}) };
            const users = reactions[emoji] || [];
            if (users.includes(userId)) {
              reactions[emoji] = users.filter(u => u !== userId);
              if (reactions[emoji].length === 0) delete reactions[emoji];
            } else {
              reactions[emoji] = [...users, userId];
            }
            return { ...msg, reactions };
          }
          return msg;
        });
        set({ messages });
        storage.setMessages(messages);
      },

      updateUserProfile: (updates) => {
        const current = get().currentUser;
        if (!current) return;

        const updatedUser = { ...current, ...updates };
        const users = storage.getUsers().map(u => u.id === current.id ? updatedUser : u);
        storage.setUsers(users);
        set({ currentUser: updatedUser });
      },

      logout: () => {
        set({
          currentUser: null,
          activeServerId: null,
          activeChannelId: null,
          activeDMUserId: null,
          showProfileModal: false,
          showSettingsModal: false,
        });
        storage.setCurrentUserId(null);
      },
    }),
    {
      name: 'voicelink-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        servers: state.servers,
        messages: state.messages,
        dms: state.dms,
        voiceStates: state.voiceStates,
      }),
    }
  )
);