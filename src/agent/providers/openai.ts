import type { AIProvider } from './index.ts';
import { postJSON } from './index.ts';

/** Any OpenAI-compatible Chat Completions endpoint (set OPENAI_BASE_URL + OPENAI_MODEL). */
export const openaiProvider: AIProvider = {
  id: 'openai',
  label: 'OpenAI-compatible Chat Completions',
  isLLM: true,
  configured: () => !!process.env.OPENAI_API_KEY && !!process.env.OPENAI_MODEL,
  async generate(req) {
    const model = process.env.OPENAI_MODEL!;
    const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
    const max = Math.min(req.maxTokens ?? 800, Number(process.env.AI_MAX_OUTPUT_TOKENS || 1500));
    const data = await postJSON(
      `${base}/chat/completions`,
      { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      {
        model,
        max_tokens: max,
        messages: [{ role: 'system', content: req.system }, ...req.messages],
        ...(req.json ? { response_format: { type: 'json_object' } } : {}),
      },
      req.task === 'generate' ? 120000 : 45000,
    );
    return { text: data.choices?.[0]?.message?.content || '', provider: 'openai', model, usage: { input: data.usage?.prompt_tokens, output: data.usage?.completion_tokens } };
  },
};
