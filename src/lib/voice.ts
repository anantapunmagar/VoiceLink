import { storage, generateId } from './storage';

/**
 * Full WebRTC engine.
 * - Server voice/video channels: BroadcastChannel signaling (same-origin multi-tab)
 * - Private 1-on-1 calls (DM calls): also BroadcastChannel signaling + RTCPeerConnection
 *   with renegotiation for video toggle and screen-share.
 */

const SIGNAL_CH = 'voicelink_rtc';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
};

// ---- Types ----

type PeerEntry = {
  pc: RTCPeerConnection;
  peerId: string; // tabId or userId for DM calls
  remoteStream: MediaStream;
  audioEl?: HTMLAudioElement;
  pendingCandidates: RTCIceCandidate[];
  hasRemoteDesc: boolean;
};

type RoomState = {
  roomId: string; // channelId or callId
  userId: string;
  localStream: MediaStream;
  peers: Map<string, PeerEntry>;
  onPeersChanged: () => void;
  isDMCall: boolean;
};

// ---- Module state ----

let room: RoomState | null = null;
let localTabId: string | null = null;
let sigCh: BroadcastChannel | null = null;

// ---- Exports ----

export interface VoiceEvents {
  onJoined?: () => void;
  onLeft?: () => void;
  onPeersChanged?: () => void;
  onError?: (e: Error) => void;
}

export async function joinVoiceRoom(
  channelId: string,
  userId: string,
  opts: { video?: boolean; events?: VoiceEvents }
): Promise<void> {
  if (room?.roomId === channelId) return;
  if (room) await leaveRoom();

  localTabId = generateId();
  const stream = await acquireStream({ audio: true, video: !!opts.video }, opts.events?.onError);

  room = {
    roomId: channelId,
    userId,
    localStream: stream,
    peers: new Map(),
    onPeersChanged: () => opts.events?.onPeersChanged?.(),
    isDMCall: false,
  };

  const states = storage.getVoiceStates().filter((s) => s.userId !== userId);
  states.push({
    userId,
    channelId,
    serverId: '',
    muted: false,
    deafened: false,
    video: !!opts.video,
    screenShare: false,
  });
  storage.setVoiceStates(states);

  getSigCh();
  broadcast({ kind: 'hello', fromTab: localTabId, userId, roomId: channelId });
  opts.events?.onJoined?.();
}

/** Start a direct 1-on-1 call. callId should be shared with peer. */
export async function startDMCall(
  callId: string,
  userId: string,
  opts: { video?: boolean; events?: VoiceEvents }
): Promise<void> {
  if (room?.roomId === callId) return;
  if (room) await leaveRoom();

  localTabId = generateId();
  const stream = await acquireStream({ audio: true, video: !!opts.video }, opts.events?.onError);

  room = {
    roomId: callId,
    userId,
    localStream: stream,
    peers: new Map(),
    onPeersChanged: () => opts.events?.onPeersChanged?.(),
    isDMCall: true,
  };

  getSigCh();
  broadcast({ kind: 'hello', fromTab: localTabId, userId, roomId: callId });
  opts.events?.onJoined?.();
}

export async function leaveRoom(): Promise<void> {
  if (!room || !localTabId) return;
  const { roomId, userId, localStream, peers, isDMCall } = room;

  localStream.getTracks().forEach((t) => t.stop());
  peers.forEach((p) => {
    p.pc.close();
    p.audioEl?.remove();
  });
  peers.clear();

  if (!isDMCall) {
    const states = storage
      .getVoiceStates()
      .filter((s) => !(s.channelId === roomId && s.userId === userId));
    storage.setVoiceStates(states);
  }

  broadcast({ kind: 'bye', fromTab: localTabId, roomId });
  room = null;
  localTabId = null;
}

export function setMuted(muted: boolean) {
  room?.localStream.getAudioTracks().forEach((t) => (t.enabled = !muted));
}

export function setDeafened(deafened: boolean) {
  room?.peers.forEach((p) => {
    if (p.audioEl) p.audioEl.muted = deafened;
  });
}

export async function setVideo(enabled: boolean): Promise<void> {
  if (!room) return;
  if (enabled && !room.localStream.getVideoTracks().length) {
    try {
      const vs = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 360, frameRate: 24 },
      });
      vs.getVideoTracks().forEach((track) => {
        room!.localStream.addTrack(track);
        room!.peers.forEach((p) => {
          const sender = p.pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(track).catch(() => {});
          else p.pc.addTrack(track, room!.localStream);
        });
      });
    } catch (e) {
      console.error('Could not enable video', e);
    }
  } else if (!enabled) {
    room.localStream.getVideoTracks().forEach((t) => {
      room!.localStream.removeTrack(t);
      t.stop();
      room!.peers.forEach((p) => {
        const sender = p.pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) p.pc.removeTrack(sender);
      });
    });
  } else {
    room.localStream.getVideoTracks().forEach((t) => (t.enabled = true));
  }
  room.onPeersChanged();
}

export async function shareScreen(): Promise<boolean> {
  if (!room) return false;
  try {
    const s = await (
      navigator.mediaDevices as MediaDevices & {
        getDisplayMedia(o?: object): Promise<MediaStream>;
      }
    ).getDisplayMedia({ video: true, audio: true });
    const track = s.getVideoTracks()[0];
    if (!track) return false;
    room.peers.forEach((p) => {
      const sender = p.pc.getSenders().find((se) => se.track?.kind === 'video');
      if (sender) sender.replaceTrack(track).catch(() => {});
      else p.pc.addTrack(track, room!.localStream);
    });
    track.onended = () => room?.onPeersChanged();
    return true;
  } catch {
    return false;
  }
}

export const getLocalStream = () => room?.localStream ?? null;
export const getCurrentRoomId = () => room?.roomId ?? null;
export const getPeerCount = () => room?.peers.size ?? 0;

export function getRemoteStreams(): Array<{ peerId: string; stream: MediaStream }> {
  if (!room) return [];
  const out: Array<{ peerId: string; stream: MediaStream }> = [];
  room.peers.forEach((p, id) => {
    if (p.remoteStream.getTracks().length > 0) out.push({ peerId: id, stream: p.remoteStream });
  });
  return out;
}

// ---- Internals ----

async function acquireStream(
  constraints: { audio: boolean; video: boolean },
  onError?: (e: Error) => void
): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: constraints.video ? { width: 640, height: 360, frameRate: 24 } : false,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    onError?.(err);
    throw err;
  }
}

function getSigCh(): BroadcastChannel {
  if (!sigCh) {
    sigCh = new BroadcastChannel(SIGNAL_CH);
    sigCh.onmessage = (ev) => handleSignal(ev.data).catch(console.error);
  }
  return sigCh;
}

function broadcast(msg: object) {
  getSigCh().postMessage({ ...msg, _room: room?.roomId });
}

async function handleSignal(msg: Record<string, unknown>) {
  if (!room || !localTabId) return;
  if (msg.roomId && msg.roomId !== room.roomId) return;

  switch (msg.kind) {
    case 'hello': {
      if (msg.fromTab === localTabId) return;
      if (!room.peers.has(msg.fromTab as string)) await createPeer(msg.fromTab as string, true);
      break;
    }
    case 'bye': {
      if (msg.fromTab === localTabId) return;
      removePeer(msg.fromTab as string);
      break;
    }
    case 'offer': {
      if (msg.toTab !== localTabId) return;
      if (!room.peers.has(msg.fromTab as string)) await createPeer(msg.fromTab as string, false);
      const peer = room.peers.get(msg.fromTab as string);
      if (!peer) return;
      await peer.pc.setRemoteDescription(
        new RTCSessionDescription(msg.sdp as RTCSessionDescriptionInit)
      );
      peer.hasRemoteDesc = true;
      for (const c of peer.pendingCandidates) await peer.pc.addIceCandidate(c).catch(() => {});
      peer.pendingCandidates = [];
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      broadcast({
        kind: 'answer',
        fromTab: localTabId,
        toTab: msg.fromTab,
        sdp: answer,
        roomId: room.roomId,
      });
      break;
    }
    case 'answer': {
      if (msg.toTab !== localTabId) return;
      const peer = room.peers.get(msg.fromTab as string);
      if (peer && peer.pc.signalingState !== 'stable') {
        await peer.pc.setRemoteDescription(
          new RTCSessionDescription(msg.sdp as RTCSessionDescriptionInit)
        );
        peer.hasRemoteDesc = true;
        for (const c of peer.pendingCandidates) await peer.pc.addIceCandidate(c).catch(() => {});
        peer.pendingCandidates = [];
      }
      break;
    }
    case 'ice': {
      if (msg.toTab !== localTabId) return;
      const peer = room.peers.get(msg.fromTab as string);
      if (!peer) return;
      const candidate = new RTCIceCandidate(msg.candidate as RTCIceCandidateInit);
      if (peer.hasRemoteDesc) {
        await peer.pc.addIceCandidate(candidate).catch(() => {});
      } else {
        peer.pendingCandidates.push(candidate);
      }
      break;
    }
  }
}

async function createPeer(peerId: string, initiator: boolean) {
  if (!room || !localTabId) return;

  const pc = new RTCPeerConnection(RTC_CONFIG);
  const entry: PeerEntry = {
    pc,
    peerId,
    remoteStream: new MediaStream(),
    pendingCandidates: [],
    hasRemoteDesc: false,
  };
  room.peers.set(peerId, entry);

  room.localStream.getTracks().forEach((t) => pc.addTrack(t, room!.localStream));

  pc.onicecandidate = ({ candidate }) => {
    if (candidate)
      broadcast({
        kind: 'ice',
        fromTab: localTabId!,
        toTab: peerId,
        candidate,
        roomId: room!.roomId,
      });
  };

  pc.ontrack = ({ streams }) => {
    const stream = streams[0] ?? entry.remoteStream;
    entry.remoteStream = stream;
    if (!entry.audioEl) {
      const audio = document.createElement('audio');
      audio.autoplay = true;
      audio.setAttribute('playsinline', 'true');
      audio.style.display = 'none';
      document.body.appendChild(audio);
      entry.audioEl = audio;
    }
    if (entry.audioEl.srcObject !== stream) entry.audioEl.srcObject = stream;
    room?.onPeersChanged();
  };

  pc.onconnectionstatechange = () => {
    if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) removePeer(peerId);
  };

  if (initiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    broadcast({
      kind: 'offer',
      fromTab: localTabId!,
      toTab: peerId,
      sdp: offer,
      roomId: room.roomId,
    });
  }

  room.onPeersChanged();
}

function removePeer(peerId: string) {
  if (!room) return;
  const peer = room.peers.get(peerId);
  if (peer) {
    peer.pc.close();
    peer.audioEl?.remove();
    room.peers.delete(peerId);
    room.onPeersChanged();
  }
}

// Backwards-compat alias
export const leaveVoiceRoom = leaveRoom;
export const setLocalMuted = setMuted;
export const setLocalDeafened = setDeafened;
export const setLocalVideo = setVideo;
export const startScreenShare = shareScreen;
export const getCurrentChannelId = getCurrentRoomId;
