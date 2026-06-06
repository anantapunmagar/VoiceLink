import type { Message, ChatSignal } from "./types";
import { storage, generateId } from "./storage";

/**
 * Cross-tab messaging via BroadcastChannel + localStorage persistence.
 * Any browser tab on the same origin can see messages in real time.
 */
export const chatBus = (() => {
  let channel: BroadcastChannel | null = null;
  const listeners = new Set<(msg: Message) => void>();
  const editListeners = new Set<(msg: Message) => void>();
  const deleteListeners = new Set<(msgId: string) => void>();
  const reactionListeners = new Set<(payload: { msgId: string; emoji: string; userId: string; add: boolean }) => void>();
  const typingListeners = new Set<(payload: { userId: string; channelId: string; typing: boolean }) => void>();
  const presenceListeners = new Set<(signal: ChatSignal) => void>();

  function ensureChannel() {
    if (channel) return;
    channel = new BroadcastChannel("voicelink");
    channel.onmessage = (ev) => {
      const signal = ev.data as ChatSignal;
      if (!signal) return;
      if (signal.type === "message" && signal.payload) {
        listeners.forEach((fn) => fn(signal.payload as Message));
      } else if (signal.type === "message-edit" && signal.payload) {
        editListeners.forEach((fn) => fn(signal.payload as Message));
      } else if (signal.type === "message-delete") {
        deleteListeners.forEach((fn) => fn(signal.payload as string));
      } else if (signal.type === "reaction") {
        reactionListeners.forEach((fn) => fn(signal.payload as { msgId: string; emoji: string; userId: string; add: boolean }));
      } else if (signal.type === "typing") {
        typingListeners.forEach((fn) => fn(signal.payload as { userId: string; channelId: string; typing: boolean }));
      } else {
        presenceListeners.forEach((fn) => fn(signal));
      }
    };
  }

  function sendMessage(content: string, authorId: string, channelId: string, serverId: string, replyTo?: string): Message {
    ensureChannel();
    const message: Message = {
      id: generateId(),
      content,
      authorId,
      channelId,
      serverId,
      timestamp: Date.now(),
      type: "text",
      replyTo,
      reactions: {},
    };
    const all = storage.getMessages();
    all.push(message);
    storage.setMessages(all);
    const signal: ChatSignal = {
      type: "message",
      payload: message,
      senderId: authorId,
      timestamp: Date.now(),
    };
    channel?.postMessage(signal);
    listeners.forEach((fn) => fn(message));
    return message;
  }

  function editMessage(messageId: string, newContent: string, authorId: string): Message | null {
    ensureChannel();
    const all = storage.getMessages();
    const idx = all.findIndex((m) => m.id === messageId && m.authorId === authorId);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], content: newContent, edited: true, editedAt: Date.now() };
    storage.setMessages(all);
    const signal: ChatSignal = {
      type: "message-edit",
      payload: all[idx],
      senderId: authorId,
      timestamp: Date.now(),
    };
    channel?.postMessage(signal);
    editListeners.forEach((fn) => fn(all[idx]));
    return all[idx];
  }

  function deleteMessage(messageId: string, authorId: string): boolean {
    ensureChannel();
    const all = storage.getMessages();
    const idx = all.findIndex((m) => m.id === messageId && m.authorId === authorId);
    if (idx < 0) return false;
    all.splice(idx, 1);
    storage.setMessages(all);
    const signal: ChatSignal = {
      type: "message-delete",
      payload: messageId,
      senderId: authorId,
      timestamp: Date.now(),
    };
    channel?.postMessage(signal);
    deleteListeners.forEach((fn) => fn(messageId));
    return true;
  }

  function toggleReaction(messageId: string, emoji: string, userId: string): void {
    ensureChannel();
    const all = storage.getMessages();
    const msg = all.find((m) => m.id === messageId);
    if (!msg) return;
    if (!msg.reactions) msg.reactions = {};
    const users = msg.reactions[emoji] ?? [];
    const add = !users.includes(userId);
    if (add) {
      msg.reactions[emoji] = [...users, userId];
    } else {
      msg.reactions[emoji] = users.filter((u) => u !== userId);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    }
    storage.setMessages(all);
    const payload = { msgId: messageId, emoji, userId, add };
    const signal: ChatSignal = { type: "reaction", payload, senderId: userId, timestamp: Date.now() };
    channel?.postMessage(signal);
    reactionListeners.forEach((fn) => fn(payload));
  }

  function sendTyping(userId: string, channelId: string, typing: boolean): void {
    ensureChannel();
    const payload = { userId, channelId, typing };
    const signal: ChatSignal = { type: "typing", payload, senderId: userId, timestamp: Date.now() };
    channel?.postMessage(signal);
  }

  function getMessagesForChannel(channelId: string): Message[] {
    return storage
      .getMessages()
      .filter((m) => m.channelId === channelId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  function onMessage(fn: (msg: Message) => void): () => void {
    ensureChannel();
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function onEdit(fn: (msg: Message) => void): () => void {
    ensureChannel();
    editListeners.add(fn);
    return () => editListeners.delete(fn);
  }

  function onDelete(fn: (msgId: string) => void): () => void {
    ensureChannel();
    deleteListeners.add(fn);
    return () => deleteListeners.delete(fn);
  }

  function onReaction(fn: (p: { msgId: string; emoji: string; userId: string; add: boolean }) => void): () => void {
    ensureChannel();
    reactionListeners.add(fn);
    return () => reactionListeners.delete(fn);
  }

  function onTyping(fn: (p: { userId: string; channelId: string; typing: boolean }) => void): () => void {
    ensureChannel();
    typingListeners.add(fn);
    return () => typingListeners.delete(fn);
  }

  function onPresence(fn: (signal: ChatSignal) => void): () => void {
    ensureChannel();
    presenceListeners.add(fn);
    return () => presenceListeners.delete(fn);
  }

  function clearMessagesForChannel(channelId: string): void {
    const all = storage.getMessages().filter((m) => m.channelId !== channelId);
    storage.setMessages(all);
  }

  return {
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    sendTyping,
    getMessagesForChannel,
    onMessage,
    onEdit,
    onDelete,
    onReaction,
    onTyping,
    onPresence,
    clearMessagesForChannel,
  };
})();
