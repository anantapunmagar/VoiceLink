import type { User, Server, Message, VoiceState, DirectMessage, Notification } from './types';

const KEYS = {
  USERS: 'vl_users',
  CURRENT_USER: 'vl_current_user',
  SERVERS: 'vl_servers',
  MESSAGES: 'vl_messages',
  VOICE_STATES: 'vl_voice_states',
  DMS: 'vl_dms',
  NOTIFICATIONS: 'vl_notifications',
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
    console.warn('localStorage write failed for key:', key);
  }
}

export const storage = {
  getUsers: (): User[] => read(KEYS.USERS, []),
  setUsers: (users: User[]) => write(KEYS.USERS, users),

  getCurrentUserId: (): string | null => read(KEYS.CURRENT_USER, null),
  setCurrentUserId: (id: string | null) => write(KEYS.CURRENT_USER, id),

  getServers: (): Server[] => read(KEYS.SERVERS, []),
  setServers: (servers: Server[]) => write(KEYS.SERVERS, servers),

  getMessages: (): Message[] => read(KEYS.MESSAGES, []),
  setMessages: (messages: Message[]) => write(KEYS.MESSAGES, messages),

  getVoiceStates: (): VoiceState[] => read(KEYS.VOICE_STATES, []),
  setVoiceStates: (states: VoiceState[]) => write(KEYS.VOICE_STATES, states),

  getDMs: (): DirectMessage[] => read(KEYS.DMS, []),
  setDMs: (dms: DirectMessage[]) => write(KEYS.DMS, dms),

  getNotifications: (): Notification[] => read(KEYS.NOTIFICATIONS, []),
  setNotifications: (notifications: Notification[]) => write(KEYS.NOTIFICATIONS, notifications),

  exportAll: () => ({
    users: read(KEYS.USERS, []),
    servers: read(KEYS.SERVERS, []),
    messages: read(KEYS.MESSAGES, []),
    dms: read(KEYS.DMS, []),
  }),
};

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

export function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}

export function storageUsageKB(): number {
  let total = 0;
  for (const key of Object.values(KEYS)) {
    total += (localStorage.getItem(key) ?? '').length;
  }
  return Math.round(total / 102.4) / 10;
}
