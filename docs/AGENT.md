# Learning agents

## What "training" means here

| Approach | Used? | How |
|---|---|---|
| Retrieval-augmented generation (RAG) | **Yes** | Uploaded files → passages with page/section refs → BM25 search per question → top passages in the prompt, cited as `[S1]` |
| Prompt configuration | **Yes** | The versioned agent configuration becomes structured instructions |
| Few-shot examples | **Yes** | "Example exchanges" in the configuration |
| Model fine-tuning / retraining | **No** | Uploading documents never changes model weights |
| Learning from student chats | **No** | Logs inform admins via Insights; only an admin-approved new version changes behaviour |

## Prompt assembly (per request)

```
GLOBAL_PLATFORM_POLICY          (non-negotiable child-safety rules)
+ Course profile                (title, subject, ages, objectives)
+ Agent version config          (identity, tone, style, framework, vocabulary/complexity,
                                 questioning, ask-vs-explain, examples policy,
                                 assessment rules, hint ladder at the current level,
                                 misconceptions, out-of-scope, grounding mode)
+ Current lesson / activity     (objective, learn cards, authored hints)
+ Retrieved passages [S1..S4]   (knowledge files + lesson cards)
+ Few-shot examples, extra instructions
```

Code: `buildSystemPrompt()` in `src/lib/agent/runtime.ts`.

## Deterministic gates (before any model call)

1. **Safeguarding** — platform + course trigger phrases (word-form aware: "bully" matches "bullying"). Returns the escalation message, flags `escalated`, logs it for Insights. Platform phrases always apply even if a course config omits them.
2. **Personal data** — emails/phone numbers/addresses: reminder prepended; redacted before reaching the provider and in logs.
3. **Out-of-scope topics** — configured list → redirect message.
4. **Answer-seeking** ("just tell me the answer") → first authored hint, no answer.
5. **Topic relevance** (offline provider only) — no retrieved passage and no vocabulary overlap → redirect.
6. **Strict grounding** — nothing retrieved → "I'm not sure, ask your teacher".

## Providers

| `AI_PROVIDER` | Needs | Notes |
|---|---|---|
| `mock` (default) | nothing | **Offline demo tutor** — rule-based. Follows the configuration (hint ladder, misconceptions, sentence limits, citations) using lesson text and retrieved sentences. Not a language model; labelled as such in the UI. |
| `anthropic` | `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL` | Messages API via `fetch` |
| `openai` | `OPENAI_API_KEY`, `OPENAI_MODEL`, optional `OPENAI_BASE_URL` | Any OpenAI-compatible Chat Completions endpoint |

If the selected provider isn't configured, the offline tutor is used, so an unconfigured paid API is never called silently. To add a provider, implement `AIProvider` in `src/lib/agent/providers/` and register it in `providers/index.ts`.

Usage controls: per-user sliding-window rate limits (`AI_RATE_LIMIT_PER_MIN`; generation is capped at 6/min), `AI_MAX_OUTPUT_TOKENS`, 12-message history cap, 1500-character message cap, 45 s timeouts (120 s for generation).

## Curriculum generation

`generateCurriculum()` in `src/lib/agent/generator.ts` creates one lesson per objective, grouped into modules.

- **With an LLM**: JSON-schema prompt per lesson, grounded in retrieved passages. Every activity is validated against the registry; invalid ones are dropped, and a lesson with no valid Perform activity falls back to the offline scaffold (reported as a warning).
- **Offline**: cloze fill-in-the-blank and multiple-choice items built from source sentences and key terms; an explanation probe with keyword rubric; learn cards quoting sources (with refs); a word-reveal hook; teacher panel with vocabulary, prompts, differentiation, rubric and the agent's misconceptions. Placeholders such as analogies are marked "[Draft — please edit]".

Everything generated is `draft` + `generated=1` until an admin approves it.

## Sandbox tests

Categories: typical, incorrect/answer-seeking, misconception, off-topic, age, ambiguous, unsupported, grounding, safety. Expectations: must include / must not include, should redirect, should cite, should escalate. A platform check ("no personal data echoed") runs on every response. Runs are stored per agent version, and a version can't go to review until all tests have been run against it.

## Monitoring

Insights (Studio step 7) aggregates pseudonymous logs: totals, % grounded, 👍/👎, escalations, frequent questions (clustered by content words), unanswered/redirected questions, and per-activity correctness and hint use. Logs older than `AI_LOG_RETENTION_DAYS` are purged daily.
