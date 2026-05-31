import { describe, expect, it, vi } from 'vitest';
import type { LLMResponse } from '../src/ai/types';
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
    const data = (await response.json()) as LLMResponse;

    expect(data).toMatchObject({
      narration: '테스트 묘사',
      combat_log: ['로그']
    });
    expect(data.ui_tags).toContain('provider:groq');
    expect(data.meta).toMatchObject({
      provider: 'groq',
      via: 'worker',
      fallback: false,
      attemptedProviders: ['groq']
    });

    vi.unstubAllGlobals();
  });

  it('returns fallback meta when all providers fail', async () => {
    const response = await worker.fetch(
      new Request('https://worker.test/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'narrate',
          prompt: 'safe short prompt'
        })
      }),
      {}
    );
    const data = (await response.json()) as { meta?: { fallback?: boolean; attemptedProviders?: string[]; errorCode?: string } };

    expect(data.meta?.fallback).toBe(true);
    expect(data.meta?.attemptedProviders).toEqual(['groq', 'openrouter', 'gemini']);
    expect(data.meta?.errorCode).toBe('missing-key');
  });

  it('classifies provider status errors safely', async () => {
    const { classifyProviderError } = await import('./index');

    expect(classifyProviderError(new Error('x'), 401)).toBe('provider-401');
    expect(classifyProviderError(new Error('x'), 429)).toBe('provider-429');
    expect(classifyProviderError(new Error('x'), 500)).toBe('provider-5xx');
  });

  it('does not include API key strings in provider failure responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('unauthorized', { status: 401 })));
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
    const text = await response.text();

    expect(text).not.toContain('secret-groq-key');
    expect(text).toContain('provider-401');

    vi.unstubAllGlobals();
  });
});
