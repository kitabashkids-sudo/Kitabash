// Browser side of live classes: Server-Sent Events for signalling + WebRTC for media.
import { api } from './api.ts';

export interface Peer {
  connId: string;
  userId: string;
  name: string;
  role: 'host' | 'student';
  canPublish: boolean;
  mic: boolean;
  cam: boolean;
  screen: boolean;
  hand: boolean;
}
export interface ChatMsg {
  from: string;
  name: string;
  role: string;
  body: string;
  at: string;
}
export interface RoomState {
  mesh: boolean;
  micsLocked: boolean;
  chatLocked: boolean;
  live: boolean;
  peers: Peer[];
}

type Listener = () => void;

export class LiveClient {
  connId = '';
  state: RoomState = { mesh: false, micsLocked: false, chatLocked: false, live: false, peers: [] };
  chat: ChatMsg[] = [];
  sync: any = null;
  remote = new Map<string, MediaStream>();
  local: MediaStream | null = null;
  screen: MediaStream | null = null;
  mic = false;
  cam = false;
  hand = false;
  ended: string | null = null;
  mediaError = '';
  connection: 'connecting' | 'connected' | 'reconnecting' = 'connecting';
  private es: EventSource | null = null;
  private pcs = new Map<string, RTCPeerConnection>();
  private pendingIce = new Map<string, RTCIceCandidateInit[]>();
  private ice: RTCIceServer[] = [];
  private listeners = new Set<Listener>();

  constructor(private sessionId: string, private role: 'host' | 'student', public canPublish: boolean) {}

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }
  private emit() {
    for (const l of this.listeners) l();
  }

  /** Ask for camera + mic (falls back to mic only, then to view-only). */
  async prepareMedia() {
    if (!this.canPublish || this.local) return;
    const video = this.role === 'host' ? { width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 24 } } : { width: { ideal: 480 }, height: { ideal: 270 }, frameRate: { ideal: 15 } };
    try {
      this.local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video });
    } catch {
      try {
        this.local = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaError = 'Camera not available — joining with microphone only.';
      } catch {
        this.mediaError = 'Camera and microphone are blocked or missing. You can still watch, listen and chat.';
      }
    }
    // Students join muted; the teacher joins with mic + camera on.
    this.mic = this.role === 'host' && !!this.local?.getAudioTracks().length;
    this.cam = !!this.local?.getVideoTracks().length;
    this.local?.getAudioTracks().forEach((t) => (t.enabled = this.mic));
    this.emit();
  }

  join() {
    this.es?.close();
    this.es = new EventSource(`/api/live/${this.sessionId}/events`);
    this.es.addEventListener('welcome', (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      if (this.connId && this.connId !== d.connId) this.closeAll(); // reconnected: start fresh
      this.connId = d.connId;
      this.ice = d.iceServers;
      this.sync = d.sync;
      this.connection = 'connected';
      this.applyState(d);
      void this.pushState();
    });
    this.es.addEventListener('state', (e) => this.applyState(JSON.parse((e as MessageEvent).data)));
    this.es.addEventListener('signal', (e) => void this.onSignal(JSON.parse((e as MessageEvent).data)));
    this.es.addEventListener('chat', (e) => {
      this.chat = [...this.chat, JSON.parse((e as MessageEvent).data)].slice(-200);
      this.emit();
    });
    this.es.addEventListener('sync', (e) => {
      this.sync = JSON.parse((e as MessageEvent).data);
      this.emit();
    });
    this.es.addEventListener('control', (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      if (d.action === 'mute') this.setMic(false, false);
    });
    this.es.addEventListener('bye', (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      this.ended = d.reason === 'removed' ? 'The teacher removed you from this class.' : d.reason === 'ended' ? 'The class has ended. Thank you for joining!' : d.reason === 'replaced' ? 'You joined this class from another tab or device.' : 'You left the class.';
      this.shutdown();
    });
    this.es.onerror = () => {
      if (this.ended) return;
      this.connection = 'reconnecting';
      this.emit();
      // EventSource retries automatically; a server error (e.g. removed/full) closes it.
      if (this.es?.readyState === EventSource.CLOSED) {
        void api<any>(`/api/live/${this.sessionId}`)
          .then((d) => {
            const st = d.session.status;
            this.ended = st === 'ended' ? 'This class has ended.' : st === 'cancelled' ? 'This class was cancelled.' : 'Could not join: the class may be full, or the teacher removed you.';
          })
          .catch((e) => (this.ended = (e as Error).message))
          .finally(() => this.shutdown());
      }
    };
  }

  me(): Peer | undefined {
    return this.state.peers.find((p) => p.connId === this.connId);
  }

  private allowed(a: Peer, b: Peer) {
    return a.role === 'host' || b.role === 'host' || this.state.mesh;
  }

  private applyState(s: RoomState) {
    this.state = { mesh: s.mesh, micsLocked: s.micsLocked, chatLocked: s.chatLocked, live: s.live, peers: s.peers };
    const me = this.me();
    if (me) {
      for (const p of s.peers) {
        if (p.connId === this.connId) continue;
        const ok = this.allowed(me, p);
        if (!ok && this.pcs.has(p.connId)) this.closePeer(p.connId);
        // The peer with the smaller id makes the offer, so two peers never collide.
        if (ok && !this.pcs.has(p.connId) && this.connId < p.connId) void this.call(p.connId);
      }
      for (const id of [...this.pcs.keys()]) if (!s.peers.some((p) => p.connId === id)) this.closePeer(id);
      if (this.state.micsLocked && this.role === 'student' && this.mic) this.setMic(false, false);
    }
    this.emit();
  }

  private makePc(peerId: string) {
    const pc = new RTCPeerConnection({ iceServers: this.ice });
    this.pcs.set(peerId, pc);
    pc.onicecandidate = (e) => {
      if (e.candidate) void this.post('signal', { to: peerId, data: { type: 'ice', candidate: e.candidate.toJSON() } });
    };
    pc.ontrack = (e) => {
      const s = this.remote.get(peerId) || new MediaStream();
      if (!s.getTracks().includes(e.track)) s.addTrack(e.track);
      this.remote.set(peerId, s);
      e.track.onunmute = () => this.emit();
      this.emit();
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        this.closePeer(peerId);
        if (this.connId < peerId) setTimeout(() => void this.call(peerId), 1000);
      }
      this.emit();
    };
    return pc;
  }

  private outgoingTrack(kind: 'audio' | 'video') {
    if (kind === 'video' && this.screen) return this.screen.getVideoTracks()[0] || null;
    return (kind === 'audio' ? this.local?.getAudioTracks() : this.local?.getVideoTracks())?.[0] || null;
  }

  private async call(peerId: string) {
    const pc = this.makePc(peerId);
    for (const kind of ['audio', 'video'] as const) {
      const t = this.outgoingTrack(kind);
      if (this.canPublish) {
        const tr = pc.addTransceiver(t || kind, { direction: 'sendrecv' });
        if (!t) void tr.sender.replaceTrack(null);
      } else pc.addTransceiver(kind, { direction: 'recvonly' });
    }
    await pc.setLocalDescription(await pc.createOffer());
    await this.post('signal', { to: peerId, data: { type: 'offer', sdp: pc.localDescription } });
  }

  private async onSignal({ from, data }: { from: string; data: any }) {
    try {
      if (data.type === 'offer') {
        this.closePeer(from);
        const pc = this.makePc(from);
        await pc.setRemoteDescription(data.sdp);
        for (const tr of pc.getTransceivers()) {
          const kind = tr.receiver.track.kind as 'audio' | 'video';
          if (this.canPublish) {
            tr.direction = 'sendrecv';
            await tr.sender.replaceTrack(this.outgoingTrack(kind));
          } else tr.direction = 'recvonly';
        }
        await pc.setLocalDescription(await pc.createAnswer());
        await this.flushIce(from);
        await this.post('signal', { to: from, data: { type: 'answer', sdp: pc.localDescription } });
      } else if (data.type === 'answer') {
        const pc = this.pcs.get(from);
        if (pc && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(data.sdp);
          await this.flushIce(from);
        }
      } else if (data.type === 'ice') {
        const pc = this.pcs.get(from);
        if (pc?.remoteDescription) await pc.addIceCandidate(data.candidate);
        else this.pendingIce.set(from, [...(this.pendingIce.get(from) || []), data.candidate]);
      }
    } catch (e) {
      console.warn('[live] signalling error', e);
    }
  }

  private async flushIce(peerId: string) {
    const pc = this.pcs.get(peerId);
    for (const c of this.pendingIce.get(peerId) || []) await pc?.addIceCandidate(c).catch(() => {});
    this.pendingIce.delete(peerId);
  }

  private closePeer(id: string) {
    this.pcs.get(id)?.close();
    this.pcs.delete(id);
    this.remote.delete(id);
    this.pendingIce.delete(id);
  }

  private closeAll() {
    for (const id of [...this.pcs.keys()]) this.closePeer(id);
  }

  private replaceVideo() {
    const t = this.outgoingTrack('video');
    for (const pc of this.pcs.values()) for (const s of pc.getSenders()) if (s.track?.kind === 'video' || (!s.track && pc.getTransceivers().find((x) => x.sender === s)?.receiver.track.kind === 'video')) void s.replaceTrack(t);
  }

  setMic(on: boolean, push = true) {
    if (on && (!this.canPublish || (this.state.micsLocked && this.role === 'student'))) return;
    this.mic = on && !!this.local?.getAudioTracks().length;
    this.local?.getAudioTracks().forEach((t) => (t.enabled = this.mic));
    if (push) void this.pushState();
    else void this.pushState();
    this.emit();
  }

  setCam(on: boolean) {
    this.cam = on && !!this.local?.getVideoTracks().length;
    this.local?.getVideoTracks().forEach((t) => (t.enabled = this.cam));
    void this.pushState();
    this.emit();
  }

  setHand(up: boolean) {
    this.hand = up;
    void this.pushState();
    this.emit();
  }

  async toggleScreen() {
    if (this.screen) {
      this.screen.getTracks().forEach((t) => t.stop());
      this.screen = null;
    } else {
      try {
        this.screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        this.screen.getVideoTracks()[0].onended = () => {
          this.screen = null;
          this.replaceVideo();
          void this.pushState();
          this.emit();
        };
      } catch {
        return;
      }
    }
    this.replaceVideo();
    void this.pushState();
    this.emit();
  }

  private pushState() {
    return this.post('state', { mic: this.mic, cam: this.cam || !!this.screen, screen: !!this.screen, hand: this.hand });
  }

  sendChat(body: string) {
    return this.post('chat', { body });
  }
  control(action: string, target?: string, value?: boolean) {
    return this.post('control', { action, target, value });
  }
  share(state: unknown) {
    this.sync = state;
    this.emit();
    return this.post('sync', { state });
  }

  async post(path: string, body: Record<string, unknown>) {
    if (!this.connId) return;
    return api(`/api/live/${this.sessionId}/${path}`, { body: { ...body, connId: this.connId } });
  }

  private shutdown() {
    this.es?.close();
    this.closeAll();
    this.local?.getTracks().forEach((t) => t.stop());
    this.screen?.getTracks().forEach((t) => t.stop());
    this.emit();
  }

  async leave() {
    if (!this.ended) {
      await this.post('leave', {}).catch(() => {});
      this.ended = 'You left the class.';
    }
    this.shutdown();
  }
}
