import { describe, expect, it } from 'vitest';
import { buildPrompt } from './prompt';

describe('buildPrompt', () => {
  it('keeps narration prompts from recalculating local rule numbers', () => {
    const prompt = buildPrompt('narrate', { localResult: '피해 3' });

    expect(prompt).toContain('규칙 수치 재계산 금지');
  });

  it('instructs halo amplification to affect narration only', () => {
    const prompt = buildPrompt('narrate', {
      halo: {
        pendingAmplification: {
          description: '검격',
          instruction: '이번 행동의 묘사를 무한히 증폭하라.'
        }
      },
      localResult: '피해 3'
    });

    expect(prompt).toContain('헤일로 증폭이 있으면 묘사만 과장');
    expect(prompt).toContain('이미 로컬 로그에 없는 결과를 추가하지 않는다');
    expect(prompt).toContain('이번 행동의 묘사를 무한히 증폭하라');
  });

  it('keeps interpretation prompts from making judgments', () => {
    const prompt = buildPrompt('interpret', { summary: '앞으로 달려 공격' });

    expect(prompt).toContain('판정 금지');
  });
});
