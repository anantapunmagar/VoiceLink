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
}

export interface Server {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  members: string[]; // user IDs
  channels: Channel[];
  createdAt: number;
}

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  serverId: string;
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  serverId: string;
  timestamp: number;
  type: "text" | "system";
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
  type: "message" | "voice-join" | "voice-leave" | "voice-state-update" | "user-presence";
  payload: any;
  senderId: string;
  timestamp: number;
}
