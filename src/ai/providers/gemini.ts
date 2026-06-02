import type { LLMPayload, LLMResponse, LLMTask } from '../types';
import type { AISettings } from '../settings';
import { buildPrompt } from '../prompt';
import { getProviderKey } from '../settings';
import { fetchWithTimeout, parseLLMText } from './common';

export const callGemini = async (task: LLMTask, payload: LLMPayload, settings: AISettings): Promise<LLMResponse> => {
  const apiKey = getProviderKey('gemini', settings);
  if (!apiKey) {
    throw new Error('Gemini API key is missing.');
  }

  const model = encodeURIComponent(settings.geminiModel);
  const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(task, payload) }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: task === 'gm-turn' ? 500 : 300
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini response did not include content.');
  }

  return parseLLMText(text);
};
