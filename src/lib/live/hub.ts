// Live-class signalling hub.
//
// Video and audio travel directly between browsers (WebRTC). The server only relays
// small "signalling" messages (offers, answers, network candidates) plus chat and class
// controls, using Server-Sent Events (server → browser) and normal POSTs (browser → server).
// Works through Render/most proxies with no WebSocket support needed.
//
// Topology (decided by the teacher, changeable live):
//   • "Teacher only" (default): every student connects to the teacher only. Students see and
//     hear the teacher; the teacher sees everyone. Lightest on student devices; students never
//     see each other's cameras (a safeguarding plus for children).
//   • "Everyone": full mesh, so students also see and hear each other. Fine up to ~10 people.
//
// State is in memory, so run one server instance (Render free = one instance).
import type { ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { addAttendance, saveMessage, setSessionStatus } from '../services/classes.ts';
import { HttpError } from '../validate.ts';

export interface Participant {
  connId: string;
  userId: string;
  name: string;
  role: 'host' | 'student';
  canPublish: boolean; // camera/mic allowed (guardian consent for under-18s)
  mic: boolean;
  cam: boolean;
  screen: boolean;
  hand: boolean;
  res: ServerResponse;
  lastTick: number;
}

interface Room {
  sessionId: string;
  participants: Map<string, Participant>;
  mesh: boolean;
  micsLocked: boolean;
  chatLocked: boolean;
  studentScreens: boolean; // students may share their screen (guardian consent still required)
  sync: any | null;
  removed: Set<string>; // userIds removed by the teacher for this session
  live: boolean;
}

const rooms = new Map<string, Room>();
export const MAX_PARTICIPANTS = Number(process.env.LIVE_MAX_PARTICIPANTS || 12);

export function iceServers() {
  const list: { urls: string | string[]; username?: string; credential?: string }[] = [{ urls: (process.env.STUN_URLS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302').split(',').map((s) => s.trim()) }];
  if (process.env.TURN_URLS) list.push({ urls: process.env.TURN_URLS.split(',').map((s) => s.trim()), username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL });
  return list;
}

function room(sessionId: string, live = false): Room {
  let r = rooms.get(sessionId);
  if (!r) {
    r = { sessionId, participants: new Map(), mesh: false, micsLocked: false, chatLocked: false, studentScreens: true, sync: null, removed: new Set(), live };
    rooms.set(sessionId, r);
  }
  return r;
}

function send(p: Participant, event: string, data: unknown) {
  try {
    p.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch {}
}

function publicView(p: Participant) {
  const { res, lastTick, ...rest } = p;
  return rest;
}

function roomState(r: Room) {
  return { mesh: r.mesh, micsLocked: r.micsLocked, chatLocked: r.chatLocked, studentScreens: r.studentScreens, live: r.live, peers: [...r.participants.values()].map(publicView) };
}

function broadcast(r: Room, event: string, data: unknown, except?: string) {
  for (const p of r.participants.values()) if (p.connId !== except) send(p, event, data);
}

export function canConnect(r: { mesh: boolean }, a: { role: string }, b: { role: string }) {
  return a.role === 'host' || b.role === 'host' || r.mesh;
}

export function isLive(sessionId: string) {
  return rooms.get(sessionId)?.live || false;
}

export function markLive(sessionId: string, live: boolean) {
  const r = room(sessionId, live);
  r.live = live;
  broadcast(r, 'state', roomState(r));
}

export function join(sessionId: string, info: Omit<Participant, 'connId' | 'mic' | 'cam' | 'screen' | 'hand' | 'res' | 'lastTick'>, res: ServerResponse, liveInDb: boolean) {
  const r = room(sessionId, liveInDb);
  if (liveInDb) r.live = true;
  if (r.removed.has(info.userId)) throw new HttpError(403, 'The teacher has removed you from this class.');
  // Same user re-joining (new tab / reconnect): drop the old connection.
  for (const p of r.participants.values()) if (p.userId === info.userId) leave(sessionId, p.connId, 'replaced');
  if (r.participants.size >= MAX_PARTICIPANTS) throw new HttpError(409, `This class is full (${MAX_PARTICIPANTS} people).`);
  const p: Participant = { ...info, connId: crypto.randomBytes(8).toString('base64url'), mic: false, cam: false, screen: false, hand: false, res, lastTick: Date.now() };
  res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' });
  res.write(': connected\n\n');
  r.participants.set(p.connId, p);
  send(p, 'welcome', { connId: p.connId, iceServers: iceServers(), sync: r.sync, ...roomState(r) });
  broadcast(r, 'state', roomState(r), p.connId);
  void addAttendance(sessionId, p.userId, 0, true).catch(() => {});
  res.on('close', () => leave(sessionId, p.connId, 'closed'));
  return p.connId;
}

export function leave(sessionId: string, connId: string, reason: string) {
  const r = rooms.get(sessionId);
  const p = r?.participants.get(connId);
  if (!r || !p) return;
  r.participants.delete(connId);
  void addAttendance(sessionId, p.userId, (Date.now() - p.lastTick) / 1000, false).catch(() => {});
  if (reason !== 'closed') {
    send(p, 'bye', { reason });
    try {
      p.res.end();
    } catch {}
  }
  broadcast(r, 'state', roomState(r));
  if (!r.participants.size && !r.live) rooms.delete(sessionId);
}

export function participant(sessionId: string, connId: string, userId: string): { r: Room; p: Participant } {
  const r = rooms.get(sessionId);
  const p = r?.participants.get(connId);
  if (!r || !p || p.userId !== userId) throw new HttpError(409, 'You are not connected to this class. Reload the page to rejoin.');
  return { r, p };
}

export function relay(sessionId: string, from: Participant, to: string, data: unknown) {
  const r = rooms.get(sessionId)!;
  const target = r.participants.get(to);
  if (!target) return;
  if (!canConnect(r, from, target)) return; // students can't reach each other unless "Everyone" mode
  send(target, 'signal', { from: from.connId, data });
}

export function setMedia(sessionId: string, p: Participant, s: { mic?: boolean; cam?: boolean; screen?: boolean; hand?: boolean }) {
  const r = rooms.get(sessionId)!;
  if (!p.canPublish) (s.mic = false), (s.cam = false);
  if (p.role === 'student' && r.micsLocked && s.mic) s.mic = false;
  if (p.role === 'student' && (!p.canPublish || !r.studentScreens)) s.screen = false;
  // One screen on stage at a time: a new share replaces anyone else's.
  if (s.screen) for (const o of r.participants.values()) if (o !== p && o.screen) (o.screen = false), send(o, 'control', { action: 'stopScreen' });
  Object.assign(p, Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v === 'boolean')));
  broadcast(r, 'state', roomState(r));
}

export async function chat(sessionId: string, p: Participant, body: string) {
  const r = rooms.get(sessionId)!;
  if (p.role === 'student' && r.chatLocked) throw new HttpError(403, 'The teacher has paused chat.');
  if (p.role === 'student' && !r.live) throw new HttpError(403, 'Chat opens when the teacher starts the class.');
  const text = body.replace(/\s+/g, ' ').trim().slice(0, 500);
  if (!text) return;
  await saveMessage(sessionId, p.userId, text);
  broadcast(r, 'chat', { from: p.connId, name: p.name, role: p.role, body: text, at: new Date().toISOString() });
}

export type ControlAction = 'mute' | 'muteAll' | 'remove' | 'lowerHand' | 'lowerAllHands' | 'mesh' | 'micsLocked' | 'chatLocked' | 'studentScreens' | 'stopScreen' | 'end';

export async function control(sessionId: string, host: Participant, action: ControlAction, target?: string, value?: boolean) {
  const r = rooms.get(sessionId)!;
  if (host.role !== 'host') throw new HttpError(403, 'Only the teacher can do that.');
  const t = target ? r.participants.get(target) : undefined;
  switch (action) {
    case 'mute':
      if (t) (t.mic = false), send(t, 'control', { action: 'mute' });
      break;
    case 'muteAll':
      for (const p of r.participants.values()) if (p.role === 'student') (p.mic = false), send(p, 'control', { action: 'mute' });
      break;
    case 'remove':
      if (t && t.role === 'student') {
        r.removed.add(t.userId);
        leave(sessionId, t.connId, 'removed');
      }
      break;
    case 'lowerHand':
      if (t) t.hand = false;
      break;
    case 'lowerAllHands':
      for (const p of r.participants.values()) p.hand = false;
      break;
    case 'mesh':
      r.mesh = !!value;
      break;
    case 'micsLocked':
      r.micsLocked = !!value;
      if (r.micsLocked) for (const p of r.participants.values()) if (p.role === 'student' && p.mic) (p.mic = false), send(p, 'control', { action: 'mute' });
      break;
    case 'chatLocked':
      r.chatLocked = !!value;
      break;
    case 'studentScreens':
      r.studentScreens = !!value;
      if (!r.studentScreens) for (const p of r.participants.values()) if (p.role === 'student' && p.screen) (p.screen = false), send(p, 'control', { action: 'stopScreen' });
      break;
    case 'stopScreen':
      if (t && t.role === 'student' && t.screen) (t.screen = false), send(t, 'control', { action: 'stopScreen' });
      break;
    case 'end':
      r.live = false;
      await setSessionStatus(sessionId, 'ended');
      for (const p of [...r.participants.values()]) if (p.connId !== host.connId) leave(sessionId, p.connId, 'ended');
      leave(sessionId, host.connId, 'ended');
      rooms.delete(sessionId);
      return;
  }
  broadcast(r, 'state', roomState(r));
}

/** Teacher shares where the class is in the lesson (lesson, phase, card, activity). */
export function setSync(sessionId: string, host: Participant, state: unknown) {
  const r = rooms.get(sessionId)!;
  if (host.role !== 'host') throw new HttpError(403, 'Only the teacher can do that.');
  r.sync = state;
  broadcast(r, 'sync', state, host.connId);
}

// Heartbeat: keeps proxies from closing idle streams and accrues attendance time.
setInterval(() => {
  const now = Date.now();
  for (const r of rooms.values()) {
    for (const p of r.participants.values()) {
      try {
        p.res.write(': ping\n\n');
      } catch {}
      const secs = (now - p.lastTick) / 1000;
      p.lastTick = now;
      void addAttendance(r.sessionId, p.userId, secs, false).catch(() => {});
    }
  }
}, 20_000).unref();
