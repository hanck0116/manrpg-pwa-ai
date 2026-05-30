import { beforeEach, describe, expect, it, vi } from 'vitest';

const createLocalStorage = () => {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    })
  };
};

const okOpenAIResponse = (narration: string): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ narration, combat_log: ['ai-log'], ui_tags: ['ai'] }) } }]
    })
  }) as Response;

const failedResponse = (): Response =>
  ({
    ok: false,
    status: 500,
    json: async () => ({})
  }) as Response;

describe('callLLM', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', createLocalStorage());
    vi.stubGlobal('fetch', vi.fn());
  });

  it('uses fallback when AI is disabled', async () => {
    const { setAISettings } = await import('./settings');
    const { callLLM } = await import('./router');

    setAISettings({ enabled: false, groqKey: 'secret' });

    const response = await callLLM('narrate', { localResult: 'test' });

    expect(response.ui_tags).toContain('fallback');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('skips providers without keys and falls back', async () => {
    const { setAISettings } = await import('./settings');
    const { callLLM } = await import('./router');

    setAISettings({ enabled: true });

    const response = await callLLM('narrate', { localResult: 'test' });

    expect(response.ui_tags).toContain('fallback');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('tries the next provider when the first provider fails', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async (url) => {
      const target = String(url);
      if (target.includes('groq.com')) {
        return failedResponse();
      }
      return okOpenAIResponse('두 번째 provider 성공');
    });

    const { setAISettings } = await import('./settings');
    const { callLLM } = await import('./router');

    setAISettings({
      enabled: true,
      groqKey: 'secret-groq-key',
      openrouterKey: 'secret-openrouter-key'
    });

    const response = await callLLM('narrate', { localResult: 'test' });

    expect(response.narration).toBe('두 번째 provider 성공');
    expect(response.combat_log).toEqual(['ai-log']);
    expect(response.ui_tags).toContain('provider:openrouter');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back when every keyed provider fails', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(failedResponse());

    const { setAISettings } = await import('./settings');
    const { callLLM } = await import('./router');

    setAISettings({
      enabled: true,
      groqKey: 'secret-groq-key',
      geminiKey: 'secret-gemini-key',
      openrouterKey: 'secret-openrouter-key'
    });

    const response = await callLLM('narrate', { localResult: 'test' });

    expect(response.ui_tags).toContain('fallback');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
