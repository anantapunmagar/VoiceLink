import type { User, Server, Message, VoiceState } from "./types";

const KEYS = {
  USERS: "vl_users",
  CURRENT_USER: "vl_current_user",
  SERVERS: "vl_servers",
  MESSAGES: "vl_messages",
  VOICE_STATES: "vl_voice_states",
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
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  // Users
  getUsers: (): User[] => read<User[]>(KEYS.USERS, []),
  setUsers: (users: User[]) => write(KEYS.USERS, users),

  getCurrentUserId: (): string | null => read<string | null>(KEYS.CURRENT_USER, null),
  setCurrentUserId: (id: string | null) => write(KEYS.CURRENT_USER, id),

  // Servers
  getServers: (): Server[] => read<Server[]>(KEYS.SERVERS, []),
  setServers: (servers: Server[]) => write(KEYS.SERVERS, servers),

  // Messages
  getMessages: (): Message[] => read<Message[]>(KEYS.MESSAGES, []),
  setMessages: (messages: Message[]) => write(KEYS.MESSAGES, messages),

  // Voice states
  getVoiceStates: (): VoiceState[] => read<VoiceState[]>(KEYS.VOICE_STATES, []),
  setVoiceStates: (states: VoiceState[]) => write(KEYS.VOICE_STATES, states),
};

export function hashPassword(password: string): string {
  // Simple hash for demo purposes - NOT secure for production
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
