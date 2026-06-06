import type { User } from "./types";
import { storage, hashPassword, generateId } from "./storage";

export interface AuthResult {
  ok: boolean;
  user?: User;
  error?: string;
}

export function signup(username: string, email: string, password: string): AuthResult {
  const u = username.trim();
  const e = email.trim().toLowerCase();
  const p = password;

  if (u.length < 3) return { ok: false, error: "Username must be at least 3 characters." };
  if (u.length > 24) return { ok: false, error: "Username must be under 24 characters." };
  if (!/^[a-zA-Z0-9_.-]+$/.test(u))
    return { ok: false, error: "Username may only contain letters, numbers, underscores, dots, and dashes." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    return { ok: false, error: "Please enter a valid email address." };
  if (p.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

  const users = storage.getUsers();
  if (users.some((x) => x.username.toLowerCase() === u.toLowerCase()))
    return { ok: false, error: "That username is already taken." };
  if (users.some((x) => x.email === e))
    return { ok: false, error: "An account with that email already exists." };

  const user: User = {
    id: generateId(),
    username: u,
    email: e,
    passwordHash: hashPassword(p),
    status: "online",
    banner: pickBanner(),
    bio: "",
    createdAt: Date.now(),
    lastSeen: Date.now(),
    notifySounds: true,
    notifyDesktop: false,
    compactMode: false,
    theme: "dark",
  };
  users.push(user);
  storage.setUsers(users);
  storage.setCurrentUserId(user.id);
  ensureDefaultServer(user.id);
  return { ok: true, user };
}

export function login(identifier: string, password: string): AuthResult {
  const id = identifier.trim().toLowerCase();
  const users = storage.getUsers();
  const hash = hashPassword(password);
  const user = users.find(
    (u) => (u.username.toLowerCase() === id || u.email === id) && u.passwordHash === hash,
  );
  if (!user) return { ok: false, error: "Invalid username or password." };
  user.status = "online";
  user.lastSeen = Date.now();
  storage.setUsers(users);
  storage.setCurrentUserId(user.id);
  ensureDefaultServer(user.id);
  return { ok: true, user };
}

export function logout(): void {
  const id = storage.getCurrentUserId();
  if (id) {
    const users = storage.getUsers();
    const u = users.find((x) => x.id === id);
    if (u) {
      u.status = "offline";
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

export function updateUser(patch: Partial<Omit<User, "id" | "passwordHash" | "createdAt">>): User | null {
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
  if (!id) return { ok: false, error: "Not logged in." };
  const users = storage.getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return { ok: false, error: "User not found." };
  if (users[idx].passwordHash !== hashPassword(oldPw))
    return { ok: false, error: "Current password is incorrect." };
  if (newPw.length < 6) return { ok: false, error: "New password must be at least 6 characters." };
  users[idx].passwordHash = hashPassword(newPw);
  storage.setUsers(users);
  return { ok: true };
}

function pickBanner(): string {
  const palette = [
    "#3a2a1a", "#2a2f3a", "#2d3a2a", "#3a2a35",
    "#3a332a", "#26333a", "#332a3a", "#3a2a2a",
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

export function ensureDefaultServer(userId: string): void {
  const servers = storage.getServers();
  let general = servers.find((s) => s.id === "srv_general");
  if (!general) {
    general = {
      id: "srv_general",
      name: "Welcome Hall",
      ownerId: "system",
      members: [userId],
      channels: [
        { id: "ch_general", name: "general", type: "text", serverId: "srv_general", topic: "Welcome to VoiceLink!" },
        { id: "ch_introductions", name: "introductions", type: "text", serverId: "srv_general", topic: "Introduce yourself here." },
        { id: "ch_announcements", name: "announcements", type: "text", serverId: "srv_general", topic: "Important updates" },
        { id: "ch_lounge", name: "Lounge", type: "voice", serverId: "srv_general" },
        { id: "ch_music", name: "Music Room", type: "voice", serverId: "srv_general" },
      ],
      createdAt: Date.now(),
      description: "The default server for all VoiceLink users.",
    };
    servers.push(general);
    storage.setServers(servers);
  } else if (!general.members.includes(userId)) {
    general.members.push(userId);
    storage.setServers(servers);
  }
}
