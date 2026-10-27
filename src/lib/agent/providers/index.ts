// Provider adapter. The app talks only to `AIProvider`; switching models is an env change.
import type { AgentContext } from '../runtime.ts';
import { offlineProvider } from './offline.ts';
import { anthropicProvider } from './anthropic.ts';
import { openaiProvider } from './openai.ts';

export interface AIRequest {
  task: 'tutor' | 'cofacilitate' | 'generate';
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  /** Structured context; used by the offline provider, ignored by LLM providers. */
  context?: AgentContext;
  extra?: any;
  maxTokens?: number;
  json?: boolean;
}
export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  usage?: { input?: number; output?: number };
}
export interface AIProvider {
  id: string;
  label: string;
  isLLM: boolean;
  configured(): boolean;
  generate(req: AIRequest): Promise<AIResponse>;
}

const ALL: Record<string, AIProvider> = {
  mock: offlineProvider,
  anthropic: anthropicProvider,
  openai: openaiProvider,
};

export function listProviders() {
  return Object.values(ALL).map((p) => ({ id: p.id, label: p.label, configured: p.configured(), isLLM: p.isLLM }));
}

export function activeProvider(): AIProvider {
  const want = (process.env.AI_PROVIDER || 'mock').toLowerCase();
  const p = ALL[want];
  if (p && p.configured()) return p;
  return offlineProvider; // never silently call an unconfigured paid API
}

export async function postJSON(url: string, headers: Record<string, string>, body: unknown, timeoutMs = 45000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ctrl.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`AI provider error ${res.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(t);
  }
}
