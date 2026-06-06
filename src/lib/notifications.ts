import type { Notification } from './types';
import { storage, generateId } from './storage';

export const notifications = {
  add(n: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
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
    const n = all.find((x: Notification) => x.id === id);
    if (n) {
      n.read = true;
      storage.setNotifications(all);
    }
  },

  markAllRead(): void {
    const all = storage.getNotifications().map((n: Notification) => ({ ...n, read: true }));
    storage.setNotifications(all);
  },

  getAll(): Notification[] {
    return storage.getNotifications();
  },

  getUnreadCount(): number {
    return storage.getNotifications().filter((n: Notification) => !n.read).length;
  },

  clear(): void {
    storage.setNotifications([]);
  },

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (window.Notification.permission === 'granted') return true;
    const result = await window.Notification.requestPermission();
    return result === 'granted';
  },

  async showDesktop(title: string, body: string): Promise<void> {
    if (!('Notification' in window)) return;
    if (window.Notification.permission !== 'granted') return;
    new window.Notification(title, { body, icon: '/favicon.svg' });
  },
};
