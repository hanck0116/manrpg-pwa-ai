import { describe, expect, it, vi } from 'vitest';
import worker from './index';

describe('worker relay', () => {
  it('returns health without exposing keys', async () => {
    const response = await worker.fetch(new Request('https://worker.test/health'), {
      GROQ_API_KEY: 'secret-groq-key'
    });
    const data = (await response.json()) as { ok: boolean; service: string; version: string; providers: { groq: boolean; gemini: boolean; openrouter: boolean } };

    expect(data).toMatchObject({
      ok: true,
      service: 'manrpg-worker',
      version: 'relay-v1',
      providers: {
        groq: true,
        gemini: false,
        openrouter: false
      }
    });
    expect(JSON.stringify(data)).not.toContain('secret-groq-key');
  });

  it('returns CORS headers for OPTIONS', async () => {
    const response = await worker.fetch(new Request('https://worker.test/llm', { method: 'OPTIONS' }), {
      ALLOWED_ORIGIN: 'https://hanck0116.github.io'
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://hanck0116.github.io');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('rejects prompts over 6000 characters', async () => {
    const response = await worker.fetch(
      new Request('https://worker.test/llm', {
        method: 'POST',
        body: JSON.stringify({
          task: 'narrate',
          prompt: 'x'.repeat(6001)
        })
      }),
      {}
    );

    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain('x'.repeat(100));
  });

  it('returns fallback without exposing keys when no provider key is available', async () => {
    const response = await worker.fetch(
      new Request('https://worker.test/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'narrate',
          provider: 'groq',
          prompt: 'safe short prompt'
        })
      }),
      {}
    );
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain('fallback');
    expect(text).not.toContain('Bearer');
  });

  it('normalizes provider JSON text into LLMResponse shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  narration: '테스트 묘사',
                  combat_log: ['로그'],
                  ui_tags: ['tag']
                })
              }
            }
          ]
        })
      )
    );

    const response = await worker.fetch(
      new Request('https://worker.test/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'narrate',
          provider: 'groq',
          prompt: 'safe short prompt'
        })
      }),
      { GROQ_API_KEY: 'secret-groq-key' }
    );
    const data = (await response.json()) as { narration: string; combat_log: string[]; ui_tags: string[] };

    expect(data).toMatchObject({
      narration: '테스트 묘사',
      combat_log: ['로그']
    });
    expect(data.ui_tags).toContain('provider:groq');

    vi.unstubAllGlobals();
  });
});
