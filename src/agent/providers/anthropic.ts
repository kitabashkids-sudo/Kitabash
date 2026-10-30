import type { AIProvider } from './index.ts';
import { postJSON } from './index.ts';

export const anthropicProvider: AIProvider = {
  id: 'anthropic',
  label: 'Anthropic Claude (Messages API)',
  isLLM: true,
  configured: () => !!process.env.ANTHROPIC_API_KEY,
  async generate(req) {
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
    const max = Math.min(req.maxTokens ?? 800, Number(process.env.AI_MAX_OUTPUT_TOKENS || 1500));
    const data = await postJSON(
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      { model, max_tokens: max, system: req.system, messages: req.messages },
      req.task === 'generate' ? 120000 : 45000,
    );
    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
    return { text, provider: 'anthropic', model, usage: { input: data.usage?.input_tokens, output: data.usage?.output_tokens } };
  },
};
