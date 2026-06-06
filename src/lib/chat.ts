import type { Message, ChatSignal } from "./types";
import { storage, generateId } from "./storage";

/**
 * Cross-tab messaging via BroadcastChannel + localStorage persistence.
 * Any browser tab on the same origin can see messages in real time.
 */
export const chatBus = (() => {
  let channel: BroadcastChannel | null = null;
  const listeners = new Set<(msg: Message) => void>();
  const presenceListeners = new Set<(signal: ChatSignal) => void>();

  function ensureChannel() {
    if (channel) return;
    channel = new BroadcastChannel("voicelink");
    channel.onmessage = (ev) => {
      const signal = ev.data as ChatSignal;
      if (!signal) return;
      if (signal.type === "message" && signal.payload) {
        listeners.forEach((fn) => fn(signal.payload));
      } else {
        presenceListeners.forEach((fn) => fn(signal));
      }
    };
  }

  function sendMessage(content: string, authorId: string, channelId: string, serverId: string): Message {
    ensureChannel();
    const message: Message = {
      id: generateId(),
      content,
      authorId,
      channelId,
      serverId,
      timestamp: Date.now(),
      type: "text",
    };
    // persist
    const all = storage.getMessages();
    all.push(message);
    storage.setMessages(all);
    // broadcast
    const signal: ChatSignal = {
      type: "message",
      payload: message,
      senderId: authorId,
      timestamp: Date.now(),
    };
    channel?.postMessage(signal);
    // notify local tab too
    listeners.forEach((fn) => fn(message));
    return message;
  }

  function sendPresence(signal: Omit<ChatSignal, "timestamp">): void {
    ensureChannel();
    channel?.postMessage({ ...signal, timestamp: Date.now() } as ChatSignal);
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

  function onPresence(fn: (signal: ChatSignal) => void): () => void {
    ensureChannel();
    presenceListeners.add(fn);
    return () => presenceListeners.delete(fn);
  }

  function clearMessagesForChannel(channelId: string): void {
    const all = storage.getMessages().filter((m) => m.channelId !== channelId);
    storage.setMessages(all);
  }

  return { sendMessage, getMessagesForChannel, onMessage, onPresence, sendPresence, clearMessagesForChannel };
})();
