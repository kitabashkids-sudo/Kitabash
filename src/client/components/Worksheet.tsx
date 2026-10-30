// Printable worksheet for any lesson, generated from its Learn cards and activities (never the
// answer keys, which students' lesson data doesn't include). Learners can print it, save it as
// a PDF from the print dialog, or download it as a file to print later.
import { Icon } from './ui.tsx';
import type { Download } from '../../lib/lessonTypes.ts';

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const lines = (n: number) => `<div class="lines">${'<div></div>'.repeat(n)}</div>`;
const box = '<span class="box"></span>';

function activityHtml(a: any, n: number): string {
  const c = a.config || {};
  const onScreenOnly = ['project', 'python_lab', 'web_lab', 'code_lab', 'block_code', 'categorize', 'ordering', 'matching', 'tracing', 'speaking'].includes(a.type);
  const head = `<h3>${n}. ${esc(a.title)}</h3>${a.instructions && !onScreenOnly ? `<p class="muted">${esc(a.instructions)}</p>` : ''}`;
  switch (a.type) {
    case 'multiple_choice':
    case 'code_output':
      return `${head}${c.code ? `<pre>${esc(c.code)}</pre>` : ''}<p><b>${esc(c.question)}</b></p><ul class="opts">${(c.options || []).map((o: any) => `<li>${box} ${esc(o.text)}</li>`).join('')}</ul>`;
    case 'fill_blank': {
      let i = 0;
      const text = esc(c.text).replace(/\[\[(\w+)\]\]/g, () => `<span class="blank">(${++i})</span>`);
      return `${head}<p class="big">${text}</p>${c.wordBank?.length ? `<p class="bank"><b>Word bank:</b> ${c.wordBank.map(esc).join(' · ')}</p>` : ''}`;
    }
    case 'ordering':
      return `${head}${c.prompt ? `<p><b>${esc(c.prompt)}</b></p>` : ''}<p class="muted">Number the boxes 1, 2, 3… in the right order.</p><ul class="opts">${(c.items || []).map((x: any) => `<li>${box} ${esc(x.text)}</li>`).join('')}</ul>`;
    case 'matching':
      return `${head}<table class="match"><tr><td><ol>${(c.left || []).map((x: any) => `<li>${esc(x.text)} → ____</li>`).join('')}</ol></td><td><ol type="A">${(c.right || []).map((x: any) => `<li>${esc(x.text)}</li>`).join('')}</ol></td></tr></table>`;
    case 'categorize':
      return `${head}<p><b>Cards:</b> ${(c.items || []).map((x: any) => esc(x.text)).join(' · ')}</p><table class="grid"><tr>${(c.buckets || []).map((b: any) => `<th>${esc(b.label)}</th>`).join('')}</tr><tr>${(c.buckets || []).map(() => '<td class="tall"></td>').join('')}</tr></table>`;
    case 'budget_sim':
      return `${head}<p><b>Budget: ${esc(c.currency || '')}${esc(c.budget)}</b> — tick what you would buy and add it up.</p><table class="grid"><tr><th></th><th>Item</th><th>Cost</th></tr>${(c.items || []).map((x: any) => `<tr><td>${box}</td><td>${esc(x.name)}</td><td>${esc(c.currency || '')}${esc(x.cost)}</td></tr>`).join('')}<tr><td></td><td><b>Total</b></td><td></td></tr><tr><td></td><td><b>Left over</b></td><td></td></tr></table>`;
    case 'free_response':
      return `${head}<p><b>${esc(c.prompt)}</b></p>${c.sentenceStarters?.length ? `<p class="muted">Starters: ${c.sentenceStarters.map(esc).join(' · ')}</p>` : ''}${lines(Math.max(4, Math.ceil((c.minWords || 12) / 8)))}`;
    case 'speaking':
      return `${head}<p class="big">“${esc(c.phrase)}”</p><p class="muted">Say it aloud to a partner. Tick each one you did:</p><ul class="opts">${(c.checklist || []).map((x: string) => `<li>${box} ${esc(x)}</li>`).join('')}</ul>`;
    case 'tracing':
      return `${head}<p>Write it here, slowly, 5 times. Circle your best one.</p>${lines(3)}`;
    case 'project':
    case 'python_lab':
    case 'web_lab':
    case 'code_lab':
      return `${head}<p><b>${esc(c.brief || c.task || c.challenge)}</b></p>${c.platform?.url ? `<p class="muted">Use: ${esc(c.platform.name)} — ${esc(c.platform.url)}</p>` : c.platform?.name ? `<p class="muted">Use: ${esc(c.platform.name)}</p>` : ''}${(c.requirements || []).length ? `<ul class="opts">${c.requirements.map((x: string) => `<li>${box} ${esc(x)}</li>`).join('')}</ul>` : ''}${c.reflection ? `<p><b>Reflection:</b> ${esc(c.reflection)}</p>${lines(4)}` : ''}${a.type === 'project' && !c.offlineOnly ? '<p>My link: ______________________________________________</p>' : ''}`;
    case 'block_code':
      return `${head}<p><b>${esc(c.goalText || 'Plan the blocks for this puzzle.')}</b></p><p class="muted">Write or draw your blocks in order:</p>${lines(5)}`;
    default:
      return `${head}${lines(3)}`;
  }
}

export function worksheetHtml({ course, lesson, activities }: { course: { title: string }; lesson: any; activities: any[] }) {
  const learn = lesson.learn || {};
  const cards = (learn.cards || []) as { emoji?: string; title: string; body: string }[];
  const acts = activities.filter((a) => a.phase !== 'learn');
  const perform = acts.filter((a) => a.phase === 'perform');
  const probe = acts.filter((a) => a.phase === 'probe');
  let n = 0;
  const title = learn.worksheet?.title || `${lesson.title} — worksheet`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  @page { margin: 16mm; }
  body { font: 13px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; color: #1b1e27; max-width: 760px; margin: 0 auto; padding: 16px; }
  header { border-bottom: 3px solid #1b1e27; margin-bottom: 12px; }
  h1 { font-size: 22px; margin: 4px 0; } h2 { font-size: 16px; margin: 18px 0 6px; padding: 4px 8px; background: #f1efe9; border-radius: 6px; }
  h3 { font-size: 14px; margin: 14px 0 4px; } p { margin: 4px 0; } .muted { color: #5c6272; font-size: 12px; }
  .meta { display: flex; gap: 24px; margin: 8px 0; } .meta span { flex: 1; border-bottom: 1px solid #999; padding-bottom: 2px; }
  .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; } .card { border: 1px solid #ccc; border-radius: 8px; padding: 6px 8px; }
  .opts { list-style: none; padding: 0; } .opts li { margin: 4px 0; } .box { display: inline-block; width: 13px; height: 13px; border: 1.5px solid #333; border-radius: 3px; vertical-align: -2px; margin-right: 6px; }
  .blank { display: inline-block; min-width: 90px; border-bottom: 1.5px solid #333; font-size: 10px; color: #888; text-align: right; }
  .big { font-size: 15px; line-height: 2; } .bank { border: 1px dashed #999; padding: 4px 8px; border-radius: 6px; }
  pre { background: #f5f5f5; padding: 6px 8px; border-radius: 6px; white-space: pre-wrap; font-size: 12px; }
  .lines div { border-bottom: 1px solid #bbb; height: 26px; } table { border-collapse: collapse; width: 100%; } .grid th, .grid td { border: 1px solid #999; padding: 4px 6px; text-align: left; } .tall { height: 110px; } .match td { vertical-align: top; width: 50%; }
  section { break-inside: avoid; } footer { margin-top: 18px; font-size: 11px; color: #888; text-align: center; }
  </style></head><body>
  <header><p class="muted">${esc(course.title)}</p><h1>${esc(title)}</h1><p><b>Goal:</b> ${esc(lesson.objective)}</p>
  <div class="meta"><span>Name:</span><span>Class:</span><span>Date:</span></div></header>
  ${cards.length ? `<h2>Key ideas</h2><div class="cards">${cards.map((c) => `<div class="card"><b>${esc(c.emoji || '')} ${esc(c.title)}</b><br>${esc(c.body)}</div>`).join('')}</div>` : ''}
  ${learn.worksheet?.task ? `<h2>Worksheet task</h2><p>${esc(learn.worksheet.task)}</p>${lines(5)}` : ''}
  ${perform.length ? `<h2>Practice</h2>${perform.map((a) => `<section>${activityHtml(a, ++n)}</section>`).join('')}` : ''}
  ${probe.length ? `<h2>Show your thinking</h2>${probe.map((a) => `<section>${activityHtml(a, ++n)}</section>`).join('')}` : ''}
  <h2>Exit ticket</h2><p>One thing I learned: ____________________________________________</p><p>One question I still have: _____________________________________</p>
  <footer>Kitabash · ${esc(lesson.title)}</footer></body></html>`;
}

const fileName = (s: string) => s.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'worksheet';

export function printWorksheet(data: { course: { title: string }; lesson: any; activities: any[] }) {
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) return downloadWorksheet(data);
  w.document.open();
  w.document.write(worksheetHtml(data));
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 300);
}

export function downloadWorksheet(data: { course: { title: string }; lesson: any; activities: any[] }) {
  const blob = new Blob([worksheetHtml(data)], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName(data.lesson.title)}-worksheet.html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 1000);
}

/** "Printable worksheet" card: print / save as PDF, download, plus any PDF printables attached to the lesson. */
export function WorksheetCard({ data, compact }: { data: { course: { title: string }; lesson: any; activities: any[] }; compact?: boolean }) {
  const pdfs = (data.lesson.learn?.downloads || []) as Download[];
  return (
    <section className={`rounded-[var(--radius-card)] border border-line bg-card ${compact ? 'p-3' : 'p-5'}`} aria-label="Printable worksheet">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Icon name="download" size={18} />
        </span>
        <div className="mr-auto min-w-0">
          <h2 className="font-bold">Printable worksheet</h2>
          <p className="text-sm text-muted">Practise on paper: key ideas, questions and space to write.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => printWorksheet(data)} className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white">
            <Icon name="download" size={15} /> Print / save as PDF
          </button>
          <button type="button" onClick={() => downloadWorksheet(data)} className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold hover:bg-sunk">
            Download
          </button>
        </div>
      </div>
      {pdfs.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {pdfs.map((d) => (
            <li key={d.resourceId}>
              <a href={`/api/resources/${d.resourceId}/file`} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold hover:border-accent">
                <Icon name="download" size={14} /> {d.title} <span className="text-xs font-normal text-muted">PDF</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
