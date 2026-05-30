import { describe, expect, it } from 'vitest';
import { buildPrompt } from './prompt';

describe('buildPrompt', () => {
  it('keeps narration prompts from recalculating local rule numbers', () => {
    const prompt = buildPrompt('narrate', { localResult: '피해 3' });

    expect(prompt).toContain('규칙 수치 재계산 금지');
  });

  it('keeps interpretation prompts from making judgments', () => {
    const prompt = buildPrompt('interpret', { summary: '앞으로 달려 공격' });

    expect(prompt).toContain('판정 금지');
  });
});
