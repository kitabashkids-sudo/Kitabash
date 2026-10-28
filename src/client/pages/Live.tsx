import { useEffect, useRef, useState } from 'react';
import { api, useApi } from '../lib/api.ts';
import { Link, navigate } from '../lib/router.tsx';
import { LiveClient, type Peer } from '../lib/live.ts';
import { Badge, Button, Icon, Notice, Spinner, Tabs } from '../components/ui.tsx';
import { ActivityRunner } from '../components/activities/index.tsx';

function useClient(c: LiveClient | null) {
  const [, force] = useState(0);
  useEffect(() => (c ? c.on(() => force((n) => n + 1)) : undefined), [c]);
  return c;
}

function VideoTile({ stream, muted, peer, big, self, mirror }: { stream: MediaStream | null | undefined; muted?: boolean; peer?: Peer; big?: boolean; self?: boolean; mirror?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== (stream || null)) ref.current.srcObject = stream || null;
  }, [stream, stream?.getTracks().length]);
  const showVideo = !!stream && (peer ? peer.cam || peer.screen : true);
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#1d2230] ${big ? 'aspect-video w-full' : 'aspect-video'}`}>
      <video ref={ref} autoPlay playsInline muted={muted} className={`h-full w-full ${peer?.screen ? 'object-contain' : 'object-cover'} ${showVideo ? '' : 'invisible'} ${mirror && !peer?.screen ? '-scale-x-100' : ''}`} />
      {!showVideo && (
        <div className="absolute inset-0 grid place-items-center">
          <span className={`grid place-items-center rounded-full bg-accent font-display font-black text-white ${big ? 'size-24 text-4xl' : 'size-12 text-xl'}`}>{(peer?.name || 'You')[0]}</span>
        </div>
      )}
      <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5">
        <span className="truncate rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
          {self ? 'You' : peer?.name}
          {peer?.role === 'host' && ' · Teacher'}
        </span>
        {peer && !peer.mic && (
          <span className="rounded-full bg-black/60 p-1 text-white" aria-label="Microphone off">
            <Icon name="mic" size={12} className="opacity-60" />
          </span>
        )}
        {peer?.hand && <span className="rounded-full bg-warn px-2 py-0.5 text-xs font-bold text-white">✋</span>}
      </div>
    </div>
  );
}

function PreJoin({ info, onJoin }: { info: any; onJoin: (c: LiveClient) => void }) {
  const [client] = useState(() => new LiveClient(info.session.id, info.role, info.canPublish));
  const c = useClient(client)!;
  const [busy, setBusy] = useState(false);
  const s = info.session;
  const starts = new Date(s.starts_at);
  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1.3fr_1fr]">
      <div>
        <VideoTile stream={c.local} muted self mirror />
        {c.mediaError && <Notice tone="warn" className="mt-3">{c.mediaError}</Notice>}
        {!info.canPublish && (
          <Notice tone="warn" icon="shield" className="mt-3">
            Your camera and microphone stay off in live classes until a parent or guardian allows them. You can still watch, listen, raise your hand and use the chat.
          </Notice>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-muted">{s.course_title} · {s.batch_name}</p>
        <h1 className="mt-1 text-3xl font-black">{s.title}</h1>
        <p className="mt-2 text-muted">
          {starts.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · {s.duration_min} min{s.instructor_name ? ` · with ${s.instructor_name}` : ''}
        </p>
        {s.lesson_title && <p className="mt-1 text-sm">Lesson: <strong>{s.lesson_title}</strong></p>}
        <div className="mt-6 space-y-2">
          {s.external_url ? (
            <a href={s.external_url} target="_blank" rel="noreferrer noopener" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-white">
              <Icon name="link" /> Open the meeting link
            </a>
          ) : (
            <>
              {info.canPublish && !c.local && (
                <Button className="w-full" icon="mic" onClick={() => void c.prepareMedia()}>
                  Check camera & microphone
                </Button>
              )}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                busy={busy}
                onClick={async () => {
                  setBusy(true);
                  if (info.role === 'host' && s.status !== 'live') await api(`/api/live/${s.id}/start`, { method: 'POST' });
                  await c.prepareMedia();
                  c.join();
                  onJoin(c);
                }}
              >
                {info.role === 'host' ? (s.status === 'live' ? 'Rejoin class' : 'Start class') : 'Join class'}
              </Button>
            </>
          )}
          {s.external_url && info.role === 'host' && <p className="text-xs text-muted">This class uses an external meeting link instead of Kitabash video.</p>}
        </div>
      </div>
    </div>
  );
}

function LessonPanel({ c, info }: { c: LiveClient; info: any }) {
  const host = info.role === 'host';
  const [lessonId, setLessonId] = useState<string>(c.sync?.lessonId || info.session.lesson_id || info.lessons?.[0]?.id || '');
  const target = host ? lessonId : c.sync?.lessonId;
  const { data } = useApi<any>(target ? `/api/lessons/${target}/learn` : null, [target]);
  const sync = c.sync;
  if (host)
    return (
      <div className="space-y-3 text-sm">
        <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} aria-label="Lesson" className="h-10 w-full rounded-xl border border-line bg-paper px-3">
          {info.lessons.map((l: any) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
        {!data ? (
          <Spinner />
        ) : (
          <>
            <p className="text-xs font-bold text-muted uppercase">Show a card to the class</p>
            {data.lesson.learn.cards.map((card: any, i: number) => {
              const on = sync?.lessonId === lessonId && sync?.kind === 'card' && sync?.index === i;
              return (
                <button key={i} data-share="card" aria-pressed={on} onClick={() => void c.share({ lessonId, title: data.lesson.title, kind: 'card', index: i, card })} className={`block w-full rounded-xl border-2 p-2.5 text-left ${on ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent/50'}`}>
                  <span className="font-semibold">{card.emoji} {card.title || `Card ${i + 1}`}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{card.body}</span>
                </button>
              );
            })}
            <p className="pt-2 text-xs font-bold text-muted uppercase">Ask the class to do an activity</p>
            {data.activities.map((a: any) => {
              const on = sync?.kind === 'activity' && sync?.activityId === a.id;
              return (
                <button key={a.id} onClick={() => void c.share({ lessonId, title: data.lesson.title, kind: 'activity', activityId: a.id, activityTitle: a.title })} className={`flex w-full items-center gap-2 rounded-xl border-2 p-2.5 text-left ${on ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent/50'}`}>
                  <Badge>{a.phase}</Badge>
                  <span className="font-semibold">{a.title}</span>
                </button>
              );
            })}
            {sync && (
              <Button size="sm" variant="ghost" icon="x" onClick={() => void c.share(null)}>
                Stop sharing
              </Button>
            )}
          </>
        )}
      </div>
    );
  if (!sync) return <p className="p-2 text-sm text-muted">When your teacher shares part of the lesson, it appears here.</p>;
  if (sync.kind === 'card')
    return (
      <div className="kb-rise rounded-2xl border border-line bg-card p-4">
        <p className="text-xs font-bold text-muted">{sync.title}</p>
        <p className="mt-1 text-lg font-black">{sync.card.emoji} {sync.card.title}</p>
        <p className="mt-1 leading-relaxed">{sync.card.body}</p>
      </div>
    );
  const act = data?.activities.find((a: any) => a.id === sync.activityId);
  return act ? <ActivityRunner key={act.id} activity={act} consentAudio={info.canPublish} /> : <Spinner />;
}

function ChatPanel({ c, info }: { c: LiveClient; info: any }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void end.current?.scrollIntoView({ block: 'nearest' });
  }, [c.chat.length]);
  const locked = info.role === 'student' && (c.state.chatLocked || !c.state.live);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="thin-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-1">
        {c.chat.map((m, i) => (
          <div key={i} className="text-sm">
            <span className={`font-bold ${m.role === 'host' ? 'text-teach' : ''}`}>{m.name}{m.role === 'host' ? ' (Teacher)' : ''}: </span>
            <span>{m.body}</span>
          </div>
        ))}
        {!c.chat.length && <p className="text-sm text-muted">Messages are visible to the whole class and saved for the teacher. No private messages.</p>}
        <div ref={end} />
      </div>
      {err && <p className="text-xs text-bad">{err}</p>}
      <form
        className="mt-2 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          setErr('');
          try {
            await c.sendChat(text);
            setText('');
          } catch (x) {
            setErr((x as Error).message);
          }
        }}
      >
        <input value={text} disabled={locked} onChange={(e) => setText(e.target.value.slice(0, 500))} placeholder={locked ? (c.state.live ? 'The teacher paused chat' : 'Chat opens when class starts') : 'Message the class…'} aria-label="Chat message" className="h-10 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 text-sm disabled:opacity-60" />
        <Button size="sm" variant="primary" icon="arrowR" aria-label="Send" disabled={locked || !text.trim()} />
      </form>
    </div>
  );
}

function PeoplePanel({ c, info }: { c: LiveClient; info: any }) {
  const host = info.role === 'host';
  const toggle = (label: string, key: 'mesh' | 'micsLocked' | 'chatLocked', help: string) => (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-1" checked={c.state[key]} onChange={(e) => void c.control(key, undefined, e.target.checked)} />
      <span>
        <span className="font-semibold">{label}</span>
        <span className="block text-xs text-muted">{help}</span>
      </span>
    </label>
  );
  return (
    <div className="space-y-4">
      {host && (
        <div className="space-y-2 rounded-2xl bg-sunk p-3">
          {toggle('Students see & hear each other', 'mesh', 'Off: students only see and hear you (lighter, more private).')}
          {toggle('Lock student microphones', 'micsLocked', 'Students can’t unmute until you unlock.')}
          {toggle('Pause chat', 'chatLocked', 'Only you can post.')}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={() => void c.control('muteAll')}>Mute all</Button>
            <Button size="sm" onClick={() => void c.control('lowerAllHands')}>Lower all hands</Button>
          </div>
        </div>
      )}
      <ul className="space-y-1.5">
        {[...c.state.peers].sort((a, b) => Number(b.hand) - Number(a.hand) || (a.role === 'host' ? -1 : 1)).map((p) => (
          <li key={p.connId} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-sunk">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-black text-white">{p.name[0]}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {p.name}
              {p.connId === c.connId && ' (you)'}
              {p.role === 'host' && <Badge tone="teach" className="ml-1">Teacher</Badge>}
              {!p.canPublish && p.role === 'student' && <Badge className="ml-1">view only</Badge>}
            </span>
            {p.hand && <span title="Hand raised">✋</span>}
            <Icon name="mic" size={14} className={p.mic ? 'text-good' : 'text-muted opacity-40'} label={p.mic ? 'Mic on' : 'Mic off'} />
            {host && p.role === 'student' && (
              <span className="flex gap-0.5">
                {p.hand && <button className="rounded px-1 text-xs font-semibold text-muted hover:text-ink" onClick={() => void c.control('lowerHand', p.connId)}>Lower</button>}
                {p.mic && <button className="rounded px-1 text-xs font-semibold text-muted hover:text-ink" onClick={() => void c.control('mute', p.connId)}>Mute</button>}
                <button className="rounded px-1 text-xs font-semibold text-bad" onClick={() => confirm(`Remove ${p.name} from this class?`) && void c.control('remove', p.connId)}>Remove</button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Room({ c, info }: { c: LiveClient; info: any }) {
  useClient(c);
  const host = info.role === 'host';
  const [tab, setTab] = useState<'lesson' | 'chat' | 'people'>(host ? 'lesson' : 'chat');
  const [unread, setUnread] = useState(0);
  const lastChat = useRef(c.chat.length);
  useEffect(() => {
    if (tab === 'chat') setUnread(0);
    else if (c.chat.length > lastChat.current) setUnread((n) => n + c.chat.length - lastChat.current);
    lastChat.current = c.chat.length;
  }, [c.chat.length, tab]);
  useEffect(() => {
    if (!host && c.sync) setTab('lesson');
  }, [c.sync, host]);
  useEffect(() => {
    const bye = () => void c.leave();
    window.addEventListener('pagehide', bye);
    return () => window.removeEventListener('pagehide', bye);
  }, [c]);
  if (c.ended)
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="text-5xl">👋</div>
        <h1 className="mt-3 text-2xl font-black">{c.ended}</h1>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="primary" onClick={() => navigate('/classes')}>Back to my classes</Button>
          {host && <Button onClick={() => navigate(`/live/${info.session.id}/report`)}>Attendance & chat log</Button>}
        </div>
      </div>
    );
  const others = c.state.peers.filter((p) => p.connId !== c.connId);
  const teacher = others.find((p) => p.role === 'host');
  const screenPeer = others.find((p) => p.screen);
  const stage = host ? screenPeer : screenPeer || teacher;
  const tiles = host ? others.filter((p) => p !== stage) : others.filter((p) => p !== stage && c.state.mesh);
  const me = c.me();
  return (
    <div className="-mx-4 -my-8 grid min-h-[calc(100dvh-4rem)] bg-[#12141a] lg:grid-cols-[1fr_360px]">
      <section className="flex min-w-0 flex-col p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-white">
          <span className={`size-2.5 rounded-full ${c.state.live ? 'animate-pulse bg-bad' : 'bg-warn'}`} />
          <span className="text-sm font-bold">{c.state.live ? 'LIVE' : 'Waiting for the teacher to start'}</span>
          <span className="truncate text-sm text-white/70">· {info.session.title}</span>
          {c.connection !== 'connected' && <Badge tone="warn">{c.connection}…</Badge>}
          <span className="ml-auto text-xs text-white/60">{c.state.peers.length} in class</span>
        </div>
        {!host && !teacher && <Notice className="mb-3">Your teacher hasn’t joined yet. Stay on this page; the class starts automatically.</Notice>}
        <div className="grid min-h-0 flex-1 gap-3">
          {stage ? <VideoTile big stream={c.remote.get(stage.connId)} peer={stage} /> : host && !others.length ? <div className="grid aspect-video place-items-center rounded-2xl border border-white/10 text-white/60">Students will appear here when they join.</div> : null}
          <div className={`grid content-start gap-2 ${host ? (stage ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 xl:grid-cols-3') : 'grid-cols-3 sm:grid-cols-4'}`}>
            <VideoTile stream={c.screen || c.local} muted self mirror={!c.screen} peer={me ? { ...me, name: 'You' } : undefined} />
            {tiles.map((p) => (
              <VideoTile key={p.connId} stream={c.remote.get(p.connId)} peer={p} />
            ))}
          </div>
          {/* Audio from peers we don't show as tiles (e.g. teacher-only mode) still plays via hidden elements */}
          {others.filter((p) => p !== stage && !tiles.includes(p)).map((p) => (
            <AudioOnly key={p.connId} stream={c.remote.get(p.connId)} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {c.canPublish && (
            <>
              <button onClick={() => c.setMic(!c.mic)} disabled={!host && c.state.micsLocked} className={`inline-flex h-12 items-center gap-2 rounded-full px-5 font-semibold ${c.mic ? 'bg-white text-ink' : 'bg-bad text-white'} disabled:opacity-50`} aria-pressed={c.mic}>
                <Icon name="mic" /> {c.mic ? 'Mute' : !host && c.state.micsLocked ? 'Mics locked' : 'Unmute'}
              </button>
              <button onClick={() => c.setCam(!c.cam)} className={`inline-flex h-12 items-center gap-2 rounded-full px-5 font-semibold ${c.cam ? 'bg-white text-ink' : 'bg-white/20 text-white'}`} aria-pressed={c.cam}>
                <Icon name="eye" /> {c.cam ? 'Camera off' : 'Camera on'}
              </button>
            </>
          )}
          {host && 'getDisplayMedia' in (navigator.mediaDevices || {}) && (
            <button onClick={() => void c.toggleScreen()} className={`inline-flex h-12 items-center gap-2 rounded-full px-5 font-semibold ${c.screen ? 'bg-teach text-white' : 'bg-white/20 text-white'}`}>
              <Icon name="screen" /> {c.screen ? 'Stop sharing' : 'Share screen'}
            </button>
          )}
          {!host && (
            <button onClick={() => c.setHand(!c.hand)} className={`inline-flex h-12 items-center gap-2 rounded-full px-5 font-semibold ${c.hand ? 'bg-warn text-white' : 'bg-white/20 text-white'}`} aria-pressed={c.hand}>
              ✋ {c.hand ? 'Lower hand' : 'Raise hand'}
            </button>
          )}
          {host ? (
            <button onClick={() => confirm('End the class for everyone?') && void c.control('end')} className="inline-flex h-12 items-center gap-2 rounded-full bg-bad px-5 font-semibold text-white">
              End class
            </button>
          ) : (
            <button onClick={() => void c.leave()} className="inline-flex h-12 items-center gap-2 rounded-full bg-white/20 px-5 font-semibold text-white">
              Leave
            </button>
          )}
        </div>
      </section>
      <aside className="flex min-h-[420px] flex-col border-l border-white/10 bg-card p-3 lg:h-[calc(100dvh-4rem)]">
        <Tabs
          wrap
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'lesson', label: 'Lesson', icon: 'book' },
            { id: 'chat', label: 'Chat', icon: 'chat', badge: unread ? <Badge tone="accent">{unread}</Badge> : undefined },
            { id: 'people', label: `People (${c.state.peers.length})`, icon: 'users' },
          ]}
        />
        <div className="thin-scroll mt-3 min-h-0 flex-1 overflow-y-auto">
          {tab === 'lesson' && <LessonPanel c={c} info={info} />}
          {tab === 'chat' && <ChatPanel c={c} info={info} />}
          {tab === 'people' && <PeoplePanel c={c} info={info} />}
        </div>
      </aside>
    </div>
  );
}

function AudioOnly({ stream }: { stream?: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);
  return <audio ref={ref} autoPlay />;
}

export function LivePage({ id }: { id: string }) {
  const { data: info, error } = useApi<any>(`/api/live/${id}`, [id]);
  const [client, setClient] = useState<LiveClient | null>(null);
  useEffect(() => () => void client?.leave(), [client]);
  if (error) return <Notice tone="bad">{error}</Notice>;
  if (!info) return <Spinner label="Opening class" />;
  if (info.session.status === 'ended' || info.session.status === 'cancelled')
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-black">This class {info.session.status === 'ended' ? 'has ended' : 'was cancelled'}.</h1>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/classes" className="font-semibold text-accent-ink underline">Back to my classes</Link>
          {info.role === 'host' && <Link to={`/live/${id}/report`} className="font-semibold text-accent-ink underline">Attendance & chat log</Link>}
        </div>
      </div>
    );
  return client ? <Room c={client} info={info} /> : <PreJoin info={info} onJoin={setClient} />;
}

export function LiveReport({ id }: { id: string }) {
  const { data, error } = useApi<any>(`/api/live/${id}/report`, [id]);
  if (error) return <Notice tone="bad">{error}</Notice>;
  if (!data) return <Spinner />;
  const fmt = (s: number | null) => (s ? `${Math.floor(s / 60)} min` : '—');
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/classes" className="text-sm font-semibold text-muted">← Classes</Link>
      <h1 className="mt-2 text-3xl font-black">{data.session.title}</h1>
      <p className="text-muted">{data.session.course_title} · {data.session.batch_name} · {new Date(data.session.starts_at).toLocaleString()}</p>
      <h2 className="mt-6 mb-2 font-bold">Attendance</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted"><th className="pb-2">Student</th><th>Status</th><th>Time in class</th><th>Joins</th></tr>
        </thead>
        <tbody>
          {data.attendance.map((a: any) => (
            <tr key={a.id} className="border-t border-line">
              <td className="py-2 font-semibold">{a.name}</td>
              <td>{a.first_join ? <Badge tone="good">present</Badge> : <Badge tone="bad">absent</Badge>}</td>
              <td>{fmt(a.seconds)}</td>
              <td>{a.joins || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mt-6 mb-2 font-bold">Chat log</h2>
      <div className="space-y-1 rounded-2xl bg-sunk p-4 text-sm">
        {data.messages.map((m: any, i: number) => (
          <p key={i}><span className="text-xs text-muted">{new Date(m.created_at).toLocaleTimeString()} </span><strong>{m.name}:</strong> {m.body}</p>
        ))}
        {!data.messages.length && <p className="text-muted">No messages.</p>}
      </div>
    </div>
  );
}
