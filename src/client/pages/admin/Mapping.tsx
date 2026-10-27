import { useState } from 'react';
import { api, useApi } from '../../lib/api.ts';
import { Badge, Button, Card, Empty, Field, Input, Modal, Notice, Select, Spinner, StatusPill, Textarea, toast } from '../../components/ui.tsx';
import { StepHeader } from './Studio.tsx';

const BOARDS = ['CBSE', 'CISCE (ICSE/ISC)', 'Cambridge IGCSE', 'State board', 'Other'];

export function MappingStep({ courseId, modules }: { courseId: string; modules: any[] }) {
  const { data, loading, reload } = useApi<any[]>(`/api/admin/courses/${courseId}/tracks`);
  const [trackForm, setTrackForm] = useState<any>(null);
  const [mapForm, setMapForm] = useState<any>(null);
  const [csv, setCsv] = useState<{ trackId: string; text: string } | null>(null);
  const [err, setErr] = useState('');
  const lessons = modules.flatMap((m) => m.lessons);
  const act = async (fn: () => Promise<any>, msg: string) => {
    setErr('');
    try {
      await fn();
      toast(msg);
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <div className="space-y-5">
      <StepHeader
        title="Board & Olympiad mapping"
        actions={
          <Button variant="primary" icon="plus" onClick={() => setTrackForm({ pathway: 'board', board: 'CBSE', grade: '', subject: '', syllabus_code: '', syllabus_year: '', title: '' })}>
            Add track
          </Button>
        }
      >
        Each board keeps its own versioned track — syllabi are never assumed identical. New mappings start <strong>unverified</strong>; learners only see an alignment claim after an admin approves it with an official reference.
      </StepHeader>
      {err && <Notice tone="bad">{err}</Notice>}
      {loading || !data ? (
        <Spinner />
      ) : !data.length ? (
        <Empty title="No curriculum tracks" icon="map">
          Add a CBSE, CISCE, IGCSE or Olympiad track to map lessons to syllabus topics.
        </Empty>
      ) : (
        data.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  {t.title} <Badge tone={t.pathway === 'olympiad' ? 'teach' : 'accent'}>{t.pathway}</Badge>
                </p>
                <p className="text-sm text-muted">
                  {[t.board, t.grade, t.subject, t.syllabus_code && `code ${t.syllabus_code}`, t.syllabus_year && `syllabus ${t.syllabus_year}`].filter(Boolean).join(' · ')} · track v{t.version}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" icon="plus" onClick={() => setMapForm({ trackId: t.id, topic: '', objective: '', assessment_format: '', reference_source: '', lesson_id: '' })}>
                  Mapping
                </Button>
                <Button size="sm" icon="upload" onClick={() => setCsv({ trackId: t.id, text: 'topic,objective,assessment_format,reference_source\n' })}>
                  Import CSV
                </Button>
                <Button size="sm" variant="ghost" icon="trash" aria-label="Delete track" onClick={() => confirm('Delete this track and its mappings?') && act(() => api(`/api/admin/tracks/${t.id}`, { method: 'DELETE' }), 'Track deleted')} />
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="pb-2">Topic</th>
                    <th>Lesson</th>
                    <th>Assessment</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {t.mappings.map((m: any) => (
                    <tr key={m.id} className="border-t border-line align-top">
                      <td className="py-2 pr-2">
                        <p className="font-semibold">{m.topic}</p>
                        {m.objective && <p className="text-xs text-muted">{m.objective}</p>}
                      </td>
                      <td className="py-2 pr-2">
                        <Select className="!h-8 !text-xs" value={m.lesson_id || ''} onChange={(e) => act(() => api(`/api/admin/mappings/${m.id}/review`, { body: { status: m.review_status === 'approved' ? 'in_review' : m.review_status, lessonId: e.target.value } }), 'Lesson linked')} aria-label="Linked lesson">
                          <option value="">—</option>
                          {lessons.map((l: any) => (
                            <option key={l.id} value={l.id}>
                              {l.title}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="py-2 pr-2 text-xs">{m.assessment_format}</td>
                      <td className="py-2 pr-2 text-xs">{m.reference_source || <span className="text-warn">missing</span>}</td>
                      <td className="py-2 pr-2">
                        <StatusPill status={m.review_status} />
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        {m.review_status !== 'approved' && (
                          <Button size="sm" variant="good" onClick={() => act(() => api(`/api/admin/mappings/${m.id}/review`, { body: { status: 'approved' } }), 'Mapping approved')}>
                            Approve
                          </Button>
                        )}
                        {m.review_status !== 'rejected' && (
                          <Button size="sm" variant="ghost" onClick={() => act(() => api(`/api/admin/mappings/${m.id}/review`, { body: { status: 'rejected' } }), 'Mapping rejected')}>
                            Reject
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" icon="trash" aria-label="Delete mapping" onClick={() => act(() => api(`/api/admin/mappings/${m.id}`, { method: 'DELETE' }), 'Deleted')} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!t.mappings.length && <p className="py-3 text-sm text-muted">No mappings yet.</p>}
            </div>
          </Card>
        ))
      )}

      <Modal open={!!trackForm} onClose={() => setTrackForm(null)} title="New curriculum track">
        {trackForm && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pathway">
                <Select value={trackForm.pathway} onChange={(e) => setTrackForm({ ...trackForm, pathway: e.target.value })}>
                  <option value="board">School board</option>
                  <option value="olympiad">Olympiad</option>
                  <option value="general">General</option>
                </Select>
              </Field>
              <Field label={trackForm.pathway === 'olympiad' ? 'Olympiad / body' : 'Board'}>
                {trackForm.pathway === 'board' ? (
                  <Select value={trackForm.board} onChange={(e) => setTrackForm({ ...trackForm, board: e.target.value })}>
                    {BOARDS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </Select>
                ) : (
                  <Input value={trackForm.board} onChange={(e) => setTrackForm({ ...trackForm, board: e.target.value })} />
                )}
              </Field>
              <Field label="Grade">
                <Input value={trackForm.grade} onChange={(e) => setTrackForm({ ...trackForm, grade: e.target.value })} placeholder="Class 5" />
              </Field>
              <Field label="Subject">
                <Input value={trackForm.subject} onChange={(e) => setTrackForm({ ...trackForm, subject: e.target.value })} />
              </Field>
              <Field label="Syllabus code">
                <Input value={trackForm.syllabus_code} onChange={(e) => setTrackForm({ ...trackForm, syllabus_code: e.target.value })} placeholder="e.g. 0580" />
              </Field>
              <Field label="Syllabus year">
                <Input value={trackForm.syllabus_year} onChange={(e) => setTrackForm({ ...trackForm, syllabus_year: e.target.value })} placeholder="2026–27" />
              </Field>
            </div>
            <Field label="Track title">
              <Input value={trackForm.title} onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })} />
            </Field>
            <div className="flex justify-end">
              <Button variant="primary" disabled={trackForm.title.length < 2} onClick={() => act(() => api(`/api/admin/courses/${courseId}/tracks`, { body: trackForm }), 'Track added').then(() => setTrackForm(null))}>
                Add track
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!mapForm} onClose={() => setMapForm(null)} title="New mapping (starts unverified)">
        {mapForm && (
          <div className="space-y-3">
            <Field label="Syllabus topic">
              <Input value={mapForm.topic} onChange={(e) => setMapForm({ ...mapForm, topic: e.target.value })} />
            </Field>
            <Field label="Learning objective">
              <Input value={mapForm.objective} onChange={(e) => setMapForm({ ...mapForm, objective: e.target.value })} />
            </Field>
            <Field label="Assessment format">
              <Input value={mapForm.assessment_format} onChange={(e) => setMapForm({ ...mapForm, assessment_format: e.target.value })} />
            </Field>
            <Field label="Official reference source" hint="Document title, year and page/section. Required before approval.">
              <Input value={mapForm.reference_source} onChange={(e) => setMapForm({ ...mapForm, reference_source: e.target.value })} />
            </Field>
            <Field label="Linked lesson">
              <Select value={mapForm.lesson_id} onChange={(e) => setMapForm({ ...mapForm, lesson_id: e.target.value })}>
                <option value="">—</option>
                {lessons.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex justify-end">
              <Button variant="primary" disabled={!mapForm.topic} onClick={() => act(() => api(`/api/admin/tracks/${mapForm.trackId}/mappings`, { body: mapForm }), 'Mapping added').then(() => setMapForm(null))}>
                Add mapping
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!csv} onClose={() => setCsv(null)} title="Import mappings from CSV">
        {csv && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Columns: topic (required), objective, assessment_format, reference_source. All imported rows start unverified.</p>
            <Textarea rows={10} className="font-mono text-xs" value={csv.text} onChange={(e) => setCsv({ ...csv, text: e.target.value })} />
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => act(async () => toast(`Imported ${(await api<any>(`/api/admin/tracks/${csv.trackId}/import`, { body: { csv: csv.text } })).imported} rows`), 'Import complete').then(() => setCsv(null))}>
                Import
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
