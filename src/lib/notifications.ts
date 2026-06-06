import type { Notification } from "./types";
import { storage, generateId } from "./storage";

export const notifications = {
  add(n: Omit<Notification, "id" | "timestamp" | "read">): Notification {
    const notif: Notification = {
      ...n,
      id: generateId(),
      timestamp: Date.now(),
      read: false,
    };
    const all = storage.getNotifications();
    all.unshift(notif);
    // cap at 50
    storage.setNotifications(all.slice(0, 50));
    return notif;
  },

  markRead(id: string): void {
    const all = storage.getNotifications();
    const n = all.find((x) => x.id === id);
    if (n) {
      n.read = true;
      storage.setNotifications(all);
    }
  },

  markAllRead(): void {
    const all = storage.getNotifications().map((n) => ({ ...n, read: true }));
    storage.setNotifications(all);
  },

  getAll(): Notification[] {
    return storage.getNotifications();
  },

  getUnreadCount(): number {
    return storage.getNotifications().filter((n) => !n.read).length;
  },

  clear(): void {
    storage.setNotifications([]);
  },

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    return result === "granted";
  },

  async showDesktop(title: string, body: string): Promise<void> {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    new Notification(title, { body, icon: "/favicon.svg" });
  },
};
