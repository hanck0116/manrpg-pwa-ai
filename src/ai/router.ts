import type { LLMPayload, LLMResponse, LLMTask, ProviderName, ProviderPriority } from './types';

export const fallbackResponse: LLMResponse = {
  narration: 'AI 응답 없이 로컬 규칙 결과만 반영합니다.',
  combat_log: ['fallback:local-only'],
  ui_tags: ['fallback']
};

const defaultPriority: Required<ProviderPriority> = {
  interpret: ['groq', 'openrouter'],
  narrate: ['groq', 'openrouter'],
  summarize: ['gemini', 'openrouter'],
  'generate-skill': ['gemini', 'openrouter']
};

export const routeProviders = (task: LLMTask, priority?: ProviderPriority): ProviderName[] => {
  const custom = priority?.[task];

  return custom && custom.length > 0 ? custom : defaultPriority[task];
};

export const callLLM = async (_task: LLMTask, _payload: LLMPayload): Promise<LLMResponse> => fallbackResponse;
