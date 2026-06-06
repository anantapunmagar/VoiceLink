export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string; // base64 or URL
  banner?: string; // color hex
  status: "online" | "idle" | "dnd" | "offline";
  bio?: string;
  createdAt: number;
  lastSeen?: number;
  customStatus?: string; // e.g. "Working on something cool"
  theme?: "dark" | "darker" | "midnight";
  notifySounds?: boolean;
  notifyDesktop?: boolean;
  compactMode?: boolean;
}

export interface Server {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  members: string[]; // user IDs
  channels: Channel[];
  createdAt: number;
  description?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  serverId: string;
  topic?: string;
  slowMode?: number; // seconds
  nsfw?: boolean;
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  serverId: string;
  timestamp: number;
  type: "text" | "system";
  edited?: boolean;
  editedAt?: number;
  reactions?: Record<string, string[]>; // emoji -> [userId, ...]
  replyTo?: string; // message id
  pinned?: boolean;
}

export interface VoiceState {
  userId: string;
  channelId: string;
  serverId: string;
  muted: boolean;
  deafened: boolean;
  video: boolean;
  screenShare: boolean;
}

export interface ChatSignal {
  type:
    | "message"
    | "message-edit"
    | "message-delete"
    | "reaction"
    | "voice-join"
    | "voice-leave"
    | "voice-state-update"
    | "user-presence"
    | "typing";
  payload: unknown;
  senderId: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  type: "mention" | "message" | "voice" | "system";
  title: string;
  body: string;
  channelId?: string;
  serverId?: string;
  timestamp: number;
  read: boolean;
}

export interface DirectMessage {
  id: string;
  content: string;
  authorId: string;
  recipientId: string;
  timestamp: number;
  read: boolean;
}
