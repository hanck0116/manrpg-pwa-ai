import { callGemini } from './providers/gemini';
import { callGroq } from './providers/groq';
import { callOpenRouter } from './providers/openrouter';
import { getAISettings, getProviderOrder, hasProviderKey, type AISettings } from './settings';
import type { LLMPayload, LLMResponse, LLMTask, ProviderName, ProviderPriority } from './types';

export const fallbackResponse: LLMResponse = {
  narration: 'AI 응답 없이 로컬 규칙 결과만 반영합니다.',
  combat_log: ['fallback:local-only'],
  ui_tags: ['fallback']
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

export const routeProviders = (task: LLMTask, priority?: ProviderPriority): ProviderName[] => {
  const custom = priority?.[task];

  return custom && custom.length > 0 ? custom : defaultPriority[task];
};

export const callLLM = async (task: LLMTask, payload: LLMPayload): Promise<LLMResponse> => {
  const settings = getAISettings();

  if (!settings.enabled) {
    return fallbackResponse;
  }

  for (const provider of getProviderOrder(task, settings)) {
    if (!hasProviderKey(provider, settings)) {
      continue;
    }

    try {
      const response = await providerCalls[provider](task, payload, settings);
      return {
        narration: response.narration,
        combat_log: response.combat_log,
        ui_tags: [...response.ui_tags, `provider:${provider}`]
      };
    } catch {
      // Provider failures are intentionally silent and fall through to the next provider.
    }
  }

  return fallbackResponse;
};
