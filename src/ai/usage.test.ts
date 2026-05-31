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

describe('AI usage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorage());
  });

  it('estimates tokens from characters', async () => {
    const { estimateTokensFromChars } = await import('./usage');

    expect(estimateTokensFromChars(9)).toBe(3);
  });

  it('returns provider cost estimates', async () => {
    const { estimateCostUsd } = await import('./usage');

    expect(estimateCostUsd('groq', 1000, 1000)).toBeGreaterThan(0);
    expect(estimateCostUsd('unknown', 1000, 1000)).toBe(0);
  });

  it('keeps only the latest 100 entries', async () => {
    const { getAIUsageEntries, recordAIUsage } = await import('./usage');

    for (let index = 0; index < 101; index += 1) {
      recordAIUsage({
        task: 'narrate',
        provider: 'groq',
        via: 'direct',
        fallback: false,
        inputChars: 10,
        outputChars: 10
      });
    }

    expect(getAIUsageEntries()).toHaveLength(100);
  });

  it('clears usage records', async () => {
    const { clearAIUsage, getAIUsageEntries, recordAIUsage } = await import('./usage');

    recordAIUsage({
      task: 'narrate',
      provider: 'groq',
      via: 'direct',
      fallback: false,
      inputChars: 10,
      outputChars: 10
    });
    clearAIUsage();

    expect(getAIUsageEntries()).toHaveLength(0);
  });

  it('does not store prompt text or API keys', async () => {
    const { getAIUsageEntries, recordAIUsage } = await import('./usage');

    recordAIUsage({
      task: 'narrate',
      provider: 'groq',
      via: 'direct',
      fallback: false,
      inputChars: 'secret prompt'.length,
      outputChars: 'secret response'.length
    });

    expect(JSON.stringify(getAIUsageEntries())).not.toContain('secret prompt');
    expect(JSON.stringify(getAIUsageEntries())).not.toContain('secret-api-key');
  });
});
