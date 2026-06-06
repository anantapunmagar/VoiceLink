import { storage, generateId } from "./storage";

/**
 * Voice/video rooms using BroadcastChannel for signaling
 * and RTCPeerConnection for media. Works between browser tabs
 * on the same origin without a signaling server.
 */

const SIGNAL_CHANNEL = "voicelink_signaling";

type PeerEntry = {
  pc: RTCPeerConnection;
  peerTabId: string;
  remoteStream: MediaStream | null;
  audioEl?: HTMLAudioElement;
};

type RoomState = {
  channelId: string;
  userId: string;
  localStream: MediaStream | null;
  peers: Map<string, PeerEntry>;
  onPeersChanged: () => void;
};

let currentRoom: RoomState | null = null;
let localTabId: string | null = null;
let signalChannel: BroadcastChannel | null = null;
let signalHandler: ((ev: MessageEvent) => void) | null = null;

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export interface VoiceRoomEvents {
  onJoined?: () => void;
  onLeft?: () => void;
  onPeersChanged?: () => void;
  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
}

function getSignalChannel(): BroadcastChannel {
  if (!signalChannel) signalChannel = new BroadcastChannel(SIGNAL_CHANNEL);
  return signalChannel;
}

export async function joinVoiceRoom(
  channelId: string,
  userId: string,
  opts: { video: boolean; events: VoiceRoomEvents },
): Promise<void> {
  if (currentRoom && currentRoom.channelId === channelId) return;
  if (currentRoom) await leaveVoiceRoom();

  localTabId = generateId();

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
    video: opts.video ? { width: 640, height: 360 } : false,
  });

  currentRoom = {
    channelId,
    userId,
    localStream: stream,
    peers: new Map(),
    onPeersChanged: () => opts.events.onPeersChanged?.(),
  };

  // Persist voice state
  const states = storage.getVoiceStates().filter((s) => s.userId !== userId);
  states.push({
    userId,
    channelId,
    serverId: "",
    muted: false,
    deafened: false,
    video: opts.video,
    screenShare: false,
  });
  storage.setVoiceStates(states);

  // Set up signaling listener
  const sig = getSignalChannel();
  signalHandler = (ev) => handleSignal(ev.data);
  sig.onmessage = signalHandler;

  broadcast({
    kind: "hello",
    fromTab: localTabId,
    userId,
    channelId,
  });

  opts.events.onJoined?.();
}

export async function leaveVoiceRoom(): Promise<void> {
  if (!currentRoom || !localTabId) return;
  const channel = currentRoom.channelId;
  const userId = currentRoom.userId;

  currentRoom.localStream?.getTracks().forEach((t) => t.stop());

  currentRoom.peers.forEach((p) => {
    p.pc.close();
    p.audioEl?.remove();
  });
  currentRoom.peers.clear();

  const states = storage.getVoiceStates().filter((s) => !(s.channelId === channel && s.userId === userId));
  storage.setVoiceStates(states);

  broadcast({ kind: "bye", fromTab: localTabId, channelId: channel });

  currentRoom = null;
  localTabId = null;
}

export function setLocalMuted(muted: boolean): void {
  if (!currentRoom?.localStream) return;
  currentRoom.localStream.getAudioTracks().forEach((t) => (t.enabled = !muted));
}

export async function setLocalVideo(enabled: boolean): Promise<void> {
  if (!currentRoom) return;
  if (enabled && !currentRoom.localStream!.getVideoTracks().length) {
    try {
      const vs = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 } });
      vs.getVideoTracks().forEach((track) => {
        currentRoom!.localStream!.addTrack(track);
        currentRoom!.peers.forEach((p) => {
          const sender = p.pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(track);
          else p.pc.addTrack(track, currentRoom!.localStream!);
        });
      });
    } catch (e) {
      console.error("Could not enable video", e);
      return;
    }
  } else if (!enabled) {
    currentRoom.localStream!.getVideoTracks().forEach((t) => {
      currentRoom!.localStream!.removeTrack(t);
      t.stop();
      currentRoom!.peers.forEach((p) => {
        const sender = p.pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) p.pc.removeTrack(sender);
      });
    });
  } else {
    currentRoom.localStream!.getVideoTracks().forEach((t) => (t.enabled = true));
  }
  currentRoom.onPeersChanged();
}

export function getLocalStream(): MediaStream | null {
  return currentRoom?.localStream ?? null;
}

export function getRemoteStreams(): Array<{ peerId: string; stream: MediaStream }> {
  if (!currentRoom) return [];
  const out: Array<{ peerId: string; stream: MediaStream }> = [];
  currentRoom.peers.forEach((p, id) => {
    if (p.remoteStream && p.remoteStream.getTracks().length > 0) {
      out.push({ peerId: id, stream: p.remoteStream });
    }
  });
  return out;
}

export function getCurrentChannelId(): string | null {
  return currentRoom?.channelId ?? null;
}

export function getPeerCount(): number {
  return currentRoom?.peers.size ?? 0;
}

// ---------- Signaling ----------

function broadcast(msg: any): void {
  getSignalChannel().postMessage({ ...msg, _channelId: currentRoom?.channelId });
}

async function handleSignal(msg: any): Promise<void> {
  if (!currentRoom || !localTabId) return;
  if (msg.channelId && msg.channelId !== currentRoom.channelId) return;

  if (msg.kind === "hello") {
    if (msg.fromTab === localTabId) return;
    if (!currentRoom.peers.has(msg.fromTab)) {
      await createPeer(msg.fromTab, true);
    }
  } else if (msg.kind === "bye") {
    if (msg.fromTab === localTabId) return;
    removePeer(msg.fromTab);
  } else if (msg.kind === "offer" && msg.toTab === localTabId) {
    if (!currentRoom.peers.has(msg.fromTab)) {
      await createPeer(msg.fromTab, false);
    }
    const peer = currentRoom.peers.get(msg.fromTab);
    if (peer) {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      broadcast({
        kind: "answer",
        fromTab: localTabId,
        toTab: msg.fromTab,
        sdp: answer,
      });
    }
  } else if (msg.kind === "answer" && msg.toTab === localTabId) {
    const peer = currentRoom.peers.get(msg.fromTab);
    if (peer && peer.pc.signalingState !== "stable") {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    }
  } else if (msg.kind === "ice" && msg.toTab === localTabId) {
    const peer = currentRoom.peers.get(msg.fromTab);
    if (peer && msg.candidate) {
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
      } catch {
        /* ignore */
      }
    }
  }
}

async function createPeer(peerTabId: string, initiator: boolean): Promise<void> {
  if (!currentRoom) return;
  const pc = new RTCPeerConnection(rtcConfig);

  const entry: PeerEntry = { pc, peerTabId, remoteStream: new MediaStream() };
  currentRoom.peers.set(peerTabId, entry);

  if (currentRoom.localStream) {
    currentRoom.localStream.getTracks().forEach((track) => {
      pc.addTrack(track, currentRoom!.localStream!);
    });
  }

  pc.onicecandidate = (ev) => {
    if (ev.candidate) {
      broadcast({ kind: "ice", fromTab: localTabId, toTab: peerTabId, candidate: ev.candidate });
    }
  };

  pc.ontrack = (ev) => {
    const stream = ev.streams[0] || entry.remoteStream!;
    entry.remoteStream = stream;
    if (!entry.audioEl) {
      const audio = document.createElement("audio");
      audio.autoplay = true;
      audio.setAttribute("playsinline", "true");
      audio.style.display = "none";
      document.body.appendChild(audio);
      entry.audioEl = audio;
    }
    if (entry.audioEl.srcObject !== stream) {
      entry.audioEl.srcObject = stream;
    }
    currentRoom?.onPeersChanged();
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "failed" || pc.connectionState === "closed" || pc.connectionState === "disconnected") {
      removePeer(peerTabId);
    }
  };

  if (initiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    broadcast({ kind: "offer", fromTab: localTabId!, toTab: peerTabId, sdp: offer });
  }

  currentRoom.onPeersChanged();
}

function removePeer(peerTabId: string): void {
  if (!currentRoom) return;
  const peer = currentRoom.peers.get(peerTabId);
  if (peer) {
    peer.pc.close();
    peer.audioEl?.remove();
    currentRoom.peers.delete(peerTabId);
    currentRoom.onPeersChanged();
  }
}
