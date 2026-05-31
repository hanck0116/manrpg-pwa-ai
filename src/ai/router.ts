import { callGemini } from './providers/gemini';
import { callGroq } from './providers/groq';
import { callOpenRouter } from './providers/openrouter';
import { callViaProxy } from './providers/proxy';
import { buildPrompt } from './prompt';
import { getAISettings, getProviderOrder, hasProviderKey, type AISettings } from './settings';
import type { LLMPayload, LLMResponse, LLMTask, ProviderName, ProviderPriority } from './types';
import { recordAIUsage } from './usage';

export const fallbackResponse: LLMResponse = {
  narration: 'AI 응답 없이 로컬 규칙 결과만 반영합니다.',
  combat_log: ['fallback:local-only'],
  ui_tags: ['fallback'],
  meta: {
    fallback: true
  }
};

const defaultPriority: Required<ProviderPriority> = {
  interpret: ['groq', 'openrouter', 'gemini'],
  narrate: ['groq', 'openrouter', 'gemini'],
  summarize: ['gemini', 'openrouter', 'groq'],
  'generate-skill': ['gemini', 'openrouter', 'groq']
};

const providerCalls: Record<ProviderName, (task: LLMTask, payload: LLMPayload, settings: AISettings) => Promise<LLMResponse>> = {
  groq: callGroq,
  gemini: callGemini,
  openrouter: callOpenRouter
};

const responseOutputChars = (response: LLMResponse): number => response.narration.length + response.combat_log.join('\n').length;

const recordUsage = (task: LLMTask, provider: ProviderName | 'unknown', via: 'direct' | 'proxy' | 'fallback', fallback: boolean, inputChars: number, response: LLMResponse): void => {
  recordAIUsage({
    task,
    provider,
    via,
    fallback,
    inputChars,
    outputChars: response.meta?.estimatedOutputChars ?? responseOutputChars(response)
  });
};

export const routeProviders = (task: LLMTask, priority?: ProviderPriority): ProviderName[] => {
  const custom = priority?.[task];

  return custom && custom.length > 0 ? custom : defaultPriority[task];
};

export const callLLM = async (task: LLMTask, payload: LLMPayload): Promise<LLMResponse> => {
  const settings = getAISettings();
  const inputChars = buildPrompt(task, payload).length;

  if (!settings.enabled) {
    recordUsage(task, 'unknown', 'fallback', true, inputChars, fallbackResponse);
    return fallbackResponse;
  }

  for (const provider of getProviderOrder(task, settings)) {
    if (settings.useProxy && settings.proxyUrl.trim()) {
      try {
        const response = await callViaProxy(provider, task, payload, settings);
        const responseProvider = response.meta?.provider === 'groq' || response.meta?.provider === 'gemini' || response.meta?.provider === 'openrouter' ? response.meta.provider : provider;
        const responseVia = response.meta?.via === 'worker' || response.meta?.via === 'proxy' || response.meta?.via === 'direct' ? response.meta.via : 'proxy';
        const responseFallback = response.meta?.fallback ?? response.ui_tags.includes('fallback');
        const normalized = {
          narration: response.narration,
          combat_log: response.combat_log,
          ui_tags: [...response.ui_tags, `provider:${responseProvider}`, 'proxy'],
          meta: {
            ...response.meta,
            provider: responseProvider,
            via: responseVia,
            fallback: responseFallback
          }
        };
        recordUsage(task, responseProvider, normalized.meta.fallback ? 'fallback' : 'proxy', normalized.meta.fallback ?? false, response.meta?.estimatedInputChars ?? inputChars, normalized);
        return normalized;
      } catch {
        // Proxy/provider failures are intentionally silent and fall through.
      }

      continue;
    }

    if (!hasProviderKey(provider, settings)) {
      continue;
    }

    try {
      const response = await providerCalls[provider](task, payload, settings);
      const normalized = {
        narration: response.narration,
        combat_log: response.combat_log,
        ui_tags: [...response.ui_tags, `provider:${provider}`],
        meta: {
          ...response.meta,
          provider,
          via: 'direct' as const,
          fallback: false
        }
      };
      recordUsage(task, provider, 'direct', false, inputChars, normalized);
      return normalized;
    } catch {
      // Provider failures are intentionally silent and fall through to the next provider.
    }
  }

  recordUsage(task, 'unknown', 'fallback', true, inputChars, fallbackResponse);
  return fallbackResponse;
};
