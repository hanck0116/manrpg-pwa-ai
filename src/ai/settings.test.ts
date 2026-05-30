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

describe('AI settings', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', createLocalStorage());
  });

  it('does not persist API keys when saveKeysOnDevice is false', async () => {
    const { setAISettings } = await import('./settings');

    setAISettings({
      enabled: true,
      saveKeysOnDevice: false,
      groqKey: 'secret-groq-key'
    });

    const stored = (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[1] ?? '';
    expect(stored).not.toContain('secret-groq-key');
  });

  it('clears API keys from memory and storage', async () => {
    const { clearAIKeys, getProviderKey, setAISettings } = await import('./settings');

    setAISettings({
      saveKeysOnDevice: true,
      groqKey: 'secret-groq-key',
      geminiKey: 'secret-gemini-key',
      openrouterKey: 'secret-openrouter-key'
    });
    clearAIKeys();

    expect(getProviderKey('groq')).toBe('');
    expect(getProviderKey('gemini')).toBe('');
    expect(getProviderKey('openrouter')).toBe('');

    const stored = (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[1] ?? '';
    expect(stored).not.toContain('secret-groq-key');
    expect(stored).not.toContain('secret-gemini-key');
    expect(stored).not.toContain('secret-openrouter-key');
  });
});
