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
    })
  };
};

describe('AI proxy routing', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', createLocalStorage());
  });

  it('posts to proxyUrl when useProxy is true', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        narration: 'proxy ok',
        combat_log: [],
        ui_tags: ['provider:groq']
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { setAISettings } = await import('./settings');
    const { callLLM } = await import('./router');

    setAISettings({
      enabled: true,
      useProxy: true,
      proxyUrl: 'https://relay.example.dev',
      groqKey: 'secret-player-key'
    });

    const response = await callLLM('narrate', { summary: 'test' });

    expect(response.narration).toBe('proxy ok');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://relay.example.dev/llm',
      expect.objectContaining({
        method: 'POST'
      })
    );

    const [, init] = (fetchMock.mock.calls as unknown as Array<[string, RequestInit]>)[0];
    const body = JSON.parse(String(init.body)) as { playerKey?: string; prompt?: string };
    expect(body.playerKey).toBe('secret-player-key');
    expect(body.prompt).toContain('HP/MP/피해/보상 변경 금지');

    vi.unstubAllGlobals();
  });

  it('returns fallback when proxy fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network failed');
      })
    );

    const { setAISettings } = await import('./settings');
    const { callLLM } = await import('./router');

    setAISettings({
      enabled: true,
      useProxy: true,
      proxyUrl: 'https://relay.example.dev'
    });

    const response = await callLLM('narrate', { summary: 'test' });

    expect(response.ui_tags).toContain('fallback');

    vi.unstubAllGlobals();
  });
});
