import type { LLMResponse } from '../types';

export const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 15000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const parseLLMText = (text: string): LLMResponse => {
  try {
    const parsed = JSON.parse(text) as Partial<LLMResponse>;

    return {
      narration: typeof parsed.narration === 'string' ? parsed.narration : text,
      combat_log: Array.isArray(parsed.combat_log) ? parsed.combat_log.filter((entry): entry is string => typeof entry === 'string') : [],
      ui_tags: Array.isArray(parsed.ui_tags) ? parsed.ui_tags.filter((entry): entry is string => typeof entry === 'string') : []
    };
  } catch {
    return {
      narration: text,
      combat_log: [],
      ui_tags: []
    };
  }
};
