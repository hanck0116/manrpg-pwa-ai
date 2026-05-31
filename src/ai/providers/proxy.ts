import { buildPrompt } from '../prompt';
import { getProviderKey, type AISettings } from '../settings';
import type { LLMPayload, LLMResponse, LLMTask, ProviderName } from '../types';
import { fetchWithTimeout, parseLLMText } from './common';

const modelForProvider = (provider: ProviderName, settings: AISettings): string => {
  if (provider === 'groq') return settings.groqModel;
  if (provider === 'gemini') return settings.geminiModel;
  return settings.openrouterModel;
};

const normalizeProxyResponse = (value: unknown): LLMResponse => {
  if (typeof value === 'string') {
    return parseLLMText(value);
  }

  if (typeof value === 'object' && value !== null) {
    const response = value as Partial<LLMResponse>;
    return {
      narration: typeof response.narration === 'string' ? response.narration : '',
      combat_log: Array.isArray(response.combat_log) ? response.combat_log.filter((entry): entry is string => typeof entry === 'string') : [],
      ui_tags: Array.isArray(response.ui_tags) ? response.ui_tags.filter((entry): entry is string => typeof entry === 'string') : []
    };
  }

  return {
    narration: 'AI 응답 형식을 해석할 수 없습니다.',
    combat_log: [],
    ui_tags: ['fallback']
  };
};

export const callViaProxy = async (provider: ProviderName, task: LLMTask, payload: LLMPayload, settings: AISettings): Promise<LLMResponse> => {
  const proxyUrl = settings.proxyUrl.trim().replace(/\/$/, '');

  if (!proxyUrl) {
    throw new Error('Worker proxy URL is missing.');
  }

  const response = await fetchWithTimeout(`${proxyUrl}/llm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      task,
      provider,
      prompt: buildPrompt(task, payload),
      model: modelForProvider(provider, settings),
      playerKey: getProviderKey(provider, settings) || undefined
    })
  });

  if (!response.ok) {
    throw new Error(`Worker proxy request failed with status ${response.status}.`);
  }

  return normalizeProxyResponse(await response.json());
};
