import { useRef, useState } from 'react';
import { api, upload, useApi } from '../../lib/api.ts';
import { Badge, Button, Card, Empty, Icon, Input, Modal, Notice, Select, Spinner, StatusPill, toast } from '../../components/ui.tsx';
import { StepHeader } from './Studio.tsx';

const ACCEPT = '.txt,.md,.csv,.json,.html,.htm,.pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.gif';

export function KnowledgeStep({ courseId, next }: { courseId: string; next: () => void }) {
  const { data, loading, reload } = useApi<any[]>(`/api/admin/courses/${courseId}/resources`);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [audience, setAudience] = useState<'teacher' | 'student'>('teacher');
  const [url, setUrl] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<any[] | null>(null);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replacing, setReplacing] = useState<string | null>(null);

  const doUpload = async (files: FileList | File[], replaces?: string) => {
    setErr('');
    for (const f of Array.from(files)) {
      setBusy(f.name);
      try {
        const r = await upload<any>(`/api/admin/courses/${courseId}/resources`, f, { audience, ...(replaces ? { replaces } : {}) });
        toast(`${f.name}: ${r.status === 'extracted' ? `${r.chunks} passages extracted` : r.status}`, r.status === 'failed' ? 'bad' : 'good');
      } catch (e) {
        setErr(`${f.name}: ${(e as Error).message}`);
      }
    }
    setBusy(null);
    await reload();
  };
  const addLink = async () => {
    setErr('');
    try {
      const r = await api<{ id: string }>(`/api/admin/courses/${courseId}/links`, { body: { url, title: urlTitle } });
      setUrl('');
      setUrlTitle('');
      await reload();
      setBusy(r.id);
      await api(`/api/admin/resources/${r.id}/verify`, { method: 'POST' });
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const search = async () => {
    if (!q.trim()) return setHits(null);
    setHits(await api<any[]>(`/api/admin/courses/${courseId}/search?q=${encodeURIComponent(q)}`));
  };
  return (
    <div className="space-y-5">
      <StepHeader n={2} title="Upload and organise knowledge" actions={<Button variant="primary" onClick={next}>Next: configure agent <Icon name="arrowR" /></Button>}>
        Files are split into passages with page/section references. The agent <strong>searches these per question</strong> (retrieval) — uploading does not train or fine-tune a model.
      </StepHeader>
      <Card
        className={`border-2 border-dashed p-8 text-center transition ${drag ? 'border-accent bg-accent-soft' : ''}`}
        onDragOver={(e: any) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={(e: any) => {
          e.preventDefault();
          setDrag(false);
          void doUpload(e.dataTransfer.files);
        }}
      >
        <Icon name="upload" size={28} className="mx-auto text-accent" />
        <p className="mt-2 font-display text-lg font-bold">Drop files here</p>
        <p className="text-sm text-muted">PDF, DOCX, PPTX, TXT, Markdown, CSV, JSON, HTML · images are stored (text extraction needs OCR) · max 15 MB</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Select value={audience} onChange={(e) => setAudience(e.target.value as any)} className="!w-auto" aria-label="Who can see the file">
            <option value="teacher">Visible to teachers only</option>
            <option value="student">Students may download</option>
          </Select>
          <Button variant="primary" icon="upload" busy={!!busy && !busy.startsWith('r_')} onClick={() => fileRef.current?.click()}>
            Choose files
          </Button>
          <input ref={fileRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => e.target.files && doUpload(e.target.files)} />
        </div>
        {busy && !busy.startsWith('r_') && <p className="mt-2 text-sm text-muted">Uploading & extracting {busy}…</p>}
      </Card>
      <Card className="p-5">
        <h3 className="mb-3 font-bold">Add an approved resource link</h3>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" aria-label="URL" />
          <Input value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} placeholder="Title (optional)" aria-label="Link title" />
          <Button icon="link" disabled={!url} onClick={addLink}>
            Add & verify
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">Links are checked from the server. Unreachable links stay listed but are marked — they’re never assumed accessible. Check each site’s terms before using its content.</p>
      </Card>
      {err && <Notice tone="bad">{err}</Notice>}
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">Course knowledge library</h3>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void search();
            }}
          >
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Test retrieval: search passages…" className="!w-64" aria-label="Search knowledge" />
            <Button icon="search" aria-label="Search" />
          </form>
        </div>
        {hits && (
          <div className="mb-4 rounded-2xl bg-sunk p-4">
            <p className="mb-2 text-xs font-bold text-muted uppercase">{hits.length} passages the agent would retrieve</p>
            {hits.map((h, i) => (
              <div key={h.chunkId} className="mb-2 rounded-xl bg-card p-3 text-sm">
                <p className="text-xs font-bold text-muted">
                  S{i + 1} · {h.resourceTitle} · {h.ref} · score {h.score.toFixed(2)}
                </p>
                <p className="mt-1 line-clamp-3">{h.text}</p>
              </div>
            ))}
            {!hits.length && <p className="text-sm text-muted">No matching passages — the agent would have nothing to cite for this.</p>}
          </div>
        )}
        {loading || !data ? (
          <Spinner />
        ) : data.length === 0 ? (
          <Empty title="No knowledge yet" icon="book">
            Upload a syllabus, teacher guide, slides or notes so the agent and generator can ground their content.
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {data.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="grid size-10 place-items-center rounded-xl bg-sunk text-muted">
                  <Icon name={r.kind === 'url' ? 'link' : 'book'} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.title}</p>
                  <p className="truncate text-xs text-muted">
                    {r.source} · v{r.version} · {r.chunk_count} passages · {r.audience === 'student' ? 'students may download' : 'teachers only'}
                  </p>
                  <p className="text-xs text-muted">{r.extraction_note}</p>
                </div>
                <StatusPill status={r.extraction_status} />
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" icon="eye" onClick={async () => setPreview(await api(`/api/admin/resources/${r.id}`))}>
                    Preview
                  </Button>
                  {r.kind === 'url' ? (
                    <Button size="sm" variant="ghost" icon="refresh" busy={busy === r.id} onClick={async () => (setBusy(r.id), await api(`/api/admin/resources/${r.id}/verify`, { method: 'POST' }), setBusy(null), reload())}>
                      Re-check
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" icon="upload" onClick={() => (setReplacing(r.id), replaceRef.current?.click())}>
                      Replace
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" icon="trash" aria-label={`Remove ${r.title}`} onClick={async () => confirm(`Remove “${r.title}” and all its versions?`) && (await api(`/api/admin/resources/${r.id}`, { method: 'DELETE' }), reload())} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <input ref={replaceRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => e.target.files && replacing && doUpload(e.target.files, replacing)} />
      </Card>
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.resource.title || ''} wide>
        {preview && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {preview.resource.source} · <StatusPill status={preview.resource.extraction_status} /> · {preview.resource.extraction_note}
            </p>
            {preview.history.length > 0 && <p className="text-xs text-muted">Previous versions: {preview.history.map((h: any) => `v${h.version} (${h.source})`).join(', ')}</p>}
            {preview.chunks.map((c: any) => (
              <div key={c.ord} className="rounded-xl bg-sunk p-3 text-sm">
                <Badge>{c.ref}</Badge>
                <p className="mt-1 whitespace-pre-wrap">{c.text}</p>
              </div>
            ))}
            {!preview.chunks.length && <p className="text-sm text-muted">No extracted text.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
