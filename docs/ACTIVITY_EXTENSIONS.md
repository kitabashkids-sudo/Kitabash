# Adding an activity type

**Configuration vs. code.** Admins create unlimited *activities* of any registered type in the Studio, with no code. A new *type* (a new interaction, such as a Pyodide coding sandbox or a hotspot diagram) needs a developer. If an existing type can render it, add a **configurable preset** instead (`rendersAs`), which needs only a registry entry.

## 1. Register the definition (server + shared metadata)

`src/lib/activities/registry.ts`:

```ts
{
  type: 'number_line',
  label: 'Number line placement',
  description: 'Drag a marker to a value on a number line.',
  availability: 'built-in',
  inputs: 'Drag or use ←/→ keys to move the marker.',
  feedback: 'Correct within tolerance; shows distance from target.',
  completion: 'A value submitted.',
  accessibility: 'Slider semantics (role=slider, aria-valuenow), keyboard operable, value read aloud.',
  subjects: ['maths'],
  validate(c, k) { need(typeof c.min === 'number' && typeof c.max === 'number', 'config.min/max required'); need(typeof k.value === 'number', 'answer_key.value required'); },
  grade(c, k, r) {
    const ok = Math.abs(Number(r?.value) - k.value) <= (k.tolerance ?? 0);
    return { ratio: ok ? 1 : 0, correct: ok, needsReview: false, feedback: ok ? 'Spot on!' : 'Not quite — check the scale.' };
  },
  example: { config: { min: 0, max: 10 }, answer_key: { value: 7, tolerance: 0 }, hints: ['Count the marks from 0.'] },
}
```

Rules:

- `grade` is **pure** and runs on the server. Never trust client-computed scores.
- Anything secret goes in `answer_key`, never in `config`.
- Return `detail` only for per-item correctness, never the key itself.

## 2. Build the component (client)

`src/client/components/activities/<file>.tsx` implementing `ActivityProps` (`activity`, `value`, `setValue`, `locked`, `result`). Register it in `CLIENT_TYPES` in `components/activities/index.tsx` with a `ready(value)` predicate. The shared `ActivityRunner` supplies hints, submission, feedback, retry and the optional timer.

## 3. Accessibility checklist (required)

- [ ] Fully keyboard operable; visible focus.
- [ ] Every drag interaction has a non-drag alternative (buttons/selects).
- [ ] Labels on every input; state changes announced (`aria-live`).
- [ ] No colour-only feedback.
- [ ] Respects `prefers-reduced-motion`.
- [ ] Works at 320 px width with touch.
- [ ] An offline/manual completion route where the input modality may be unavailable (mic, pointer).

## 4. Tests

Add grading cases to `tests/unit/activities.test.ts`. The "examples validate" test checks your `example` automatically.

## Reserved slots (status: extension-required)

`coding_sandbox`, `visual_simulation`, `interactive_diagram`, `audio_listening`, `project_submission` are listed in the registry so admins can see what's planned. Check each third-party tool's terms (Scratch, MakeCode, App Inventor, PhET, etc.) before embedding it.
