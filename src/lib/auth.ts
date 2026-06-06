import type { User } from './types';
import { storage, hashPassword, generateId, generateInviteCode } from './storage';

export interface AuthResult {
  ok: boolean;
  user?: User;
  error?: string;
}

export function signup(username: string, email: string, password: string): AuthResult {
  const u = username.trim();
  const e = email.trim().toLowerCase();

  if (u.length < 3) return { ok: false, error: 'Username must be at least 3 characters.' };
  if (u.length > 24) return { ok: false, error: 'Username must be under 24 characters.' };
  if (!/^[a-zA-Z0-9_.-]+$/.test(u))
    return {
      ok: false,
      error: 'Username may only contain letters, numbers, underscores, dots, and dashes.',
    };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    return { ok: false, error: 'Please enter a valid email address.' };
  if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

  const users = storage.getUsers();
  if (users.some((x) => x.username.toLowerCase() === u.toLowerCase()))
    return { ok: false, error: 'That username is already taken.' };
  if (users.some((x) => x.email === e))
    return { ok: false, error: 'An account with that email already exists.' };

  const user: User = {
    id: generateId(),
    username: u,
    email: e,
    passwordHash: hashPassword(password),
    status: 'online',
    banner: pickBanner(),
    bio: '',
    createdAt: Date.now(),
    lastSeen: Date.now(),
    notifySounds: true,
    notifyDesktop: false,
    compactMode: false,
  };
  users.push(user);
  storage.setUsers(users);
  storage.setCurrentUserId(user.id);
  return { ok: true, user };
}

export function login(identifier: string, password: string): AuthResult {
  const id = identifier.trim().toLowerCase();
  const users = storage.getUsers();
  const hash = hashPassword(password);
  const user = users.find(
    (u) => (u.username.toLowerCase() === id || u.email === id) && u.passwordHash === hash
  );
  if (!user) return { ok: false, error: 'Invalid username or password.' };
  user.status = 'online';
  user.lastSeen = Date.now();
  storage.setUsers(users);
  storage.setCurrentUserId(user.id);
  return { ok: true, user };
}

export function logout(): void {
  const id = storage.getCurrentUserId();
  if (id) {
    const users = storage.getUsers();
    const u = users.find((x) => x.id === id);
    if (u) {
      u.status = 'offline';
      u.lastSeen = Date.now();
      storage.setUsers(users);
    }
  }
  storage.setCurrentUserId(null);
}

export function getCurrentUser(): User | null {
  const id = storage.getCurrentUserId();
  if (!id) return null;
  return storage.getUsers().find((u) => u.id === id) || null;
}

export function updateUser(
  patch: Partial<Omit<User, 'id' | 'passwordHash' | 'createdAt'>>
): User | null {
  const id = storage.getCurrentUserId();
  if (!id) return null;
  const users = storage.getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return null;
  users[idx] = { ...users[idx], ...patch };
  storage.setUsers(users);
  return users[idx];
}

export function changePassword(oldPw: string, newPw: string): { ok: boolean; error?: string } {
  const id = storage.getCurrentUserId();
  if (!id) return { ok: false, error: 'Not logged in.' };
  const users = storage.getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return { ok: false, error: 'User not found.' };
  if (users[idx].passwordHash !== hashPassword(oldPw))
    return { ok: false, error: 'Current password is incorrect.' };
  if (newPw.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };
  users[idx].passwordHash = hashPassword(newPw);
  storage.setUsers(users);
  return { ok: true };
}

/** Join a server by invite code. Returns the server or null. */
export function joinByInviteCode(
  code: string,
  userId: string
): { ok: boolean; server?: import('./types').Server; error?: string } {
  const servers = storage.getServers();
  const server = servers.find((s) => s.inviteCode === code.toUpperCase().trim());
  if (!server) return { ok: false, error: 'Invalid invite code. Check the code and try again.' };
  if (!server.members.includes(userId)) {
    server.members.push(userId);
    storage.setServers(servers);
  }
  return { ok: true, server };
}

function pickBanner(): string {
  const palette = [
    '#1e2a3a',
    '#1e2d2a',
    '#2a1e2d',
    '#2d1e1e',
    '#1e1e2d',
    '#2a2d1e',
    '#1a2030',
    '#20301a',
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

export function createServer(
  name: string,
  ownerId: string,
  description?: string
): import('./types').Server {
  const id = generateId();
  const server: import('./types').Server = {
    id,
    name: name.trim(),
    ownerId,
    members: [ownerId],
    channels: [
      {
        id: generateId(),
        name: 'general',
        type: 'text',
        serverId: id,
        topic: 'General conversation',
      },
      { id: generateId(), name: 'off-topic', type: 'text', serverId: id },
      { id: generateId(), name: 'General Voice', type: 'voice', serverId: id },
    ],
    createdAt: Date.now(),
    description,
    inviteCode: generateInviteCode(),
  };
  const servers = storage.getServers();
  servers.push(server);
  storage.setServers(servers);
  return server;
}
