import type { LLMPayload, LLMResponse, LLMTask } from '../types';
import type { AISettings } from '../settings';
import { buildPrompt } from '../prompt';
import { getProviderKey } from '../settings';
import { fetchWithTimeout, parseLLMText } from './common';

export const callOpenRouter = async (task: LLMTask, payload: LLMPayload, settings: AISettings): Promise<LLMResponse> => {
  const apiKey = getProviderKey('openrouter', settings);
  if (!apiKey) {
    throw new Error('OpenRouter API key is missing.');
  }

  const response = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.openrouterModel,
      messages: [{ role: 'user', content: buildPrompt(task, payload) }],
      temperature: 0.7,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('OpenRouter response did not include content.');
  }

  return parseLLMText(text);
};
