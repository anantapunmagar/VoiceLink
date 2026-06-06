import type { Message, DirectMessage, ChatSignal } from "./types";
import { storage, generateId } from "./storage";

const bus = (() => {
  let channel: BroadcastChannel | null = null;
  const msgListeners = new Set<(msg: Message) => void>();
  const editListeners = new Set<(msg: Message) => void>();
  const deleteListeners = new Set<(msgId: string) => void>();
  const reactionListeners = new Set<(p: { msgId: string; key: string; userId: string; add: boolean }) => void>();
  const typingListeners = new Set<(p: { userId: string; channelId: string; typing: boolean }) => void>();
  const dmListeners = new Set<(dm: DirectMessage) => void>();
  const callListeners = new Set<(signal: ChatSignal) => void>();

  function getChannel() {
    if (!channel) {
      channel = new BroadcastChannel("voicelink_chat");
      channel.onmessage = (ev) => dispatch(ev.data as ChatSignal);
    }
    return channel;
  }

  function dispatch(signal: ChatSignal) {
    if (!signal) return;
    switch (signal.type) {
      case "message":        msgListeners.forEach((f) => f(signal.payload as Message)); break;
      case "message-edit":   editListeners.forEach((f) => f(signal.payload as Message)); break;
      case "message-delete": deleteListeners.forEach((f) => f(signal.payload as string)); break;
      case "reaction":       reactionListeners.forEach((f) => f(signal.payload as { msgId: string; key: string; userId: string; add: boolean })); break;
      case "typing":         typingListeners.forEach((f) => f(signal.payload as { userId: string; channelId: string; typing: boolean })); break;
      case "dm":             dmListeners.forEach((f) => f(signal.payload as DirectMessage)); break;
      case "call-invite":
      case "call-answer":
      case "call-reject":
      case "call-end":       callListeners.forEach((f) => f(signal)); break;
    }
  }

  function post(signal: ChatSignal) {
    getChannel().postMessage(signal);
  }

  // ---- Channel messages ----
  function sendMessage(content: string, authorId: string, channelId: string, serverId: string, replyTo?: string): Message {
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
    const signal: ChatSignal = { type: "message", payload: message, senderId: authorId, timestamp: Date.now() };
    post(signal);
    msgListeners.forEach((f) => f(message));
    return message;
  }

  function editMessage(id: string, content: string, authorId: string): Message | null {
    const all = storage.getMessages();
    const idx = all.findIndex((m) => m.id === id && m.authorId === authorId);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], content, edited: true, editedAt: Date.now() };
    storage.setMessages(all);
    const signal: ChatSignal = { type: "message-edit", payload: all[idx], senderId: authorId, timestamp: Date.now() };
    post(signal);
    editListeners.forEach((f) => f(all[idx]));
    return all[idx];
  }

  function deleteMessage(id: string, authorId: string): boolean {
    const all = storage.getMessages();
    const idx = all.findIndex((m) => m.id === id && m.authorId === authorId);
    if (idx < 0) return false;
    all.splice(idx, 1);
    storage.setMessages(all);
    const signal: ChatSignal = { type: "message-delete", payload: id, senderId: authorId, timestamp: Date.now() };
    post(signal);
    deleteListeners.forEach((f) => f(id));
    return true;
  }

  function toggleReaction(msgId: string, key: string, userId: string) {
    const all = storage.getMessages();
    const msg = all.find((m) => m.id === msgId);
    if (!msg) return;
    if (!msg.reactions) msg.reactions = {};
    const users = msg.reactions[key] ?? [];
    const add = !users.includes(userId);
    msg.reactions[key] = add ? [...users, userId] : users.filter((u) => u !== userId);
    if (msg.reactions[key].length === 0) delete msg.reactions[key];
    storage.setMessages(all);
    const payload = { msgId, key, userId, add };
    post({ type: "reaction", payload, senderId: userId, timestamp: Date.now() });
    reactionListeners.forEach((f) => f(payload));
  }

  function sendTyping(userId: string, channelId: string, typing: boolean) {
    post({ type: "typing", payload: { userId, channelId, typing }, senderId: userId, timestamp: Date.now() });
  }

  function getMessagesForChannel(channelId: string): Message[] {
    return storage.getMessages()
      .filter((m) => m.channelId === channelId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  // ---- DMs ----
  function sendDM(content: string, authorId: string, recipientId: string, replyTo?: string): DirectMessage {
    const dm: DirectMessage = {
      id: generateId(),
      content,
      authorId,
      recipientId,
      timestamp: Date.now(),
      read: false,
      replyTo,
    };
    const all = storage.getDMs();
    all.push(dm);
    storage.setDMs(all);
    post({ type: "dm", payload: dm, senderId: authorId, timestamp: Date.now() });
    dmListeners.forEach((f) => f(dm));
    return dm;
  }

  function getDMThread(userA: string, userB: string): DirectMessage[] {
    return storage.getDMs()
      .filter((d) =>
        (d.authorId === userA && d.recipientId === userB) ||
        (d.authorId === userB && d.recipientId === userA),
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  function markDMsRead(viewerId: string, senderId: string) {
    const all = storage.getDMs();
    let changed = false;
    all.forEach((d) => {
      if (d.authorId === senderId && d.recipientId === viewerId && !d.read) {
        d.read = true;
        changed = true;
      }
    });
    if (changed) storage.setDMs(all);
  }

  function getUnreadDMCount(userId: string): number {
    return storage.getDMs().filter((d) => d.recipientId === userId && !d.read).length;
  }

  // ---- Call signals ----
  function sendCallSignal(type: ChatSignal["type"], payload: unknown, senderId: string) {
    const signal: ChatSignal = { type, payload, senderId, timestamp: Date.now() };
    post(signal);
    callListeners.forEach((f) => f(signal));
  }

  // ---- Subscriptions ----
  function onMessage(fn: (msg: Message) => void) { getChannel(); msgListeners.add(fn); return () => { msgListeners.delete(fn); }; }
  function onEdit(fn: (msg: Message) => void) { getChannel(); editListeners.add(fn); return () => { editListeners.delete(fn); }; }
  function onDelete(fn: (id: string) => void) { getChannel(); deleteListeners.add(fn); return () => { deleteListeners.delete(fn); }; }
  function onReaction(fn: (p: { msgId: string; key: string; userId: string; add: boolean }) => void) { getChannel(); reactionListeners.add(fn); return () => { reactionListeners.delete(fn); }; }
  function onTyping(fn: (p: { userId: string; channelId: string; typing: boolean }) => void) { getChannel(); typingListeners.add(fn); return () => { typingListeners.delete(fn); }; }
  function onDM(fn: (dm: DirectMessage) => void) { getChannel(); dmListeners.add(fn); return () => { dmListeners.delete(fn); }; }
  function onCallSignal(fn: (s: ChatSignal) => void) { getChannel(); callListeners.add(fn); return () => { callListeners.delete(fn); }; }

  return {
    sendMessage, editMessage, deleteMessage, toggleReaction, sendTyping, getMessagesForChannel,
    sendDM, getDMThread, markDMsRead, getUnreadDMCount,
    sendCallSignal,
    onMessage, onEdit, onDelete, onReaction, onTyping, onDM, onCallSignal,
  };
})();

export { bus as chatBus };
