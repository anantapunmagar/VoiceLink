import type { User, Server, Message, VoiceState, Notification, DirectMessage } from "./types";

const KEYS = {
  USERS: "vl_users",
  CURRENT_USER: "vl_current_user",
  SERVERS: "vl_servers",
  MESSAGES: "vl_messages",
  VOICE_STATES: "vl_voice_states",
  NOTIFICATIONS: "vl_notifications",
  DMS: "vl_dms",
  PINNED_DM_USERS: "vl_pinned_dms",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn("localStorage write failed for key:", key);
  }
}

export const storage = {
  // Users
  getUsers: (): User[] => read(KEYS.USERS, []),
  setUsers: (users: User[]) => write(KEYS.USERS, users),

  getCurrentUserId: (): string | null => read(KEYS.CURRENT_USER, null),
  setCurrentUserId: (id: string | null) => write(KEYS.CURRENT_USER, id),

  // Servers
  getServers: (): Server[] => read(KEYS.SERVERS, []),
  setServers: (servers: Server[]) => write(KEYS.SERVERS, servers),

  // Messages
  getMessages: (): Message[] => read(KEYS.MESSAGES, []),
  setMessages: (messages: Message[]) => write(KEYS.MESSAGES, messages),

  // Voice states
  getVoiceStates: (): VoiceState[] => read(KEYS.VOICE_STATES, []),
  setVoiceStates: (states: VoiceState[]) => write(KEYS.VOICE_STATES, states),

  // Notifications
  getNotifications: (): Notification[] => read(KEYS.NOTIFICATIONS, []),
  setNotifications: (n: Notification[]) => write(KEYS.NOTIFICATIONS, n),

  // DMs
  getDMs: (): DirectMessage[] => read(KEYS.DMS, []),
  setDMs: (dms: DirectMessage[]) => write(KEYS.DMS, dms),

  getPinnedDmUsers: (): string[] => read(KEYS.PINNED_DM_USERS, []),
  setPinnedDmUsers: (ids: string[]) => write(KEYS.PINNED_DM_USERS, ids),

  // Export everything
  exportAll: () => ({
    users: read(KEYS.USERS, []),
    servers: read(KEYS.SERVERS, []),
    messages: read(KEYS.MESSAGES, []),
    dms: read(KEYS.DMS, []),
  }),
};

/** Simple hash for demo purposes — NOT secure for production */
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${hash.toString(36)}_${password.length}`;
}

export function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Storage size in KB */
export function storageUsageKB(): number {
  let total = 0;
  for (const key of Object.values(KEYS)) {
    total += (localStorage.getItem(key) ?? "").length;
  }
  return Math.round(total / 102.4) / 10;
}
