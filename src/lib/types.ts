export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  banner?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  bio?: string;
  createdAt: number;
  lastSeen?: number;
  customStatus?: string;
  notifySounds?: boolean;
  notifyDesktop?: boolean;
  compactMode?: boolean;
}

export interface Server {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  members: string[];
  channels: Channel[];
  createdAt: number;
  description?: string;
  inviteCode?: string; // unique short code for invites
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  serverId: string;
  topic?: string;
}

export interface Message {
  id: string;
  content: string;
  authorId: string;
  channelId: string;
  serverId: string; // empty string for DMs
  timestamp: number;
  type: 'text' | 'system';
  edited?: boolean;
  editedAt?: number;
  reactions?: Record<string, string[]>;
  replyTo?: string;
}

export interface DirectMessage {
  id: string;
  content: string;
  authorId: string;
  recipientId: string;
  timestamp: number;
  read: boolean;
  edited?: boolean;
  replyTo?: string;
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
    | 'message'
    | 'message-edit'
    | 'message-delete'
    | 'reaction'
    | 'voice-join'
    | 'voice-leave'
    | 'voice-state-update'
    | 'user-presence'
    | 'typing'
    | 'dm'
    | 'dm-edit'
    | 'call-invite'
    | 'call-answer'
    | 'call-reject'
    | 'call-end';
  payload: unknown;
  senderId: string;
  timestamp: number;
}

export type CallState =
  | { status: 'idle' }
  | { status: 'calling'; peerId: string; peerName: string; callId: string }
  | { status: 'ringing'; callerId: string; callerName: string; callId: string }
  | { status: 'active'; peerId: string; peerName: string; callId: string; startedAt: number };

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  timestamp: number;
}
