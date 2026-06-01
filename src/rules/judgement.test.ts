import { describe, expect, it } from 'vitest';
import { resolveJudgement } from './judgement';
import { createInitialGameState } from '../state/gameState';

const stats = createInitialGameState().player.stats;

describe('judgement', () => {
  it('does not attempt when judgeStat is none', () => {
    const result = resolveJudgement(stats, 'none', 0, () => 0.99);

    expect(result.attempted).toBe(false);
    expect(result.success).toBe(true);
    expect(result.log).toBe('판정 없음');
  });

  it('succeeds when roll is less than or equal to target', () => {
    const result = resolveJudgement({ ...stats, strength: 50 }, 'strength', 0, () => 0.49);

    expect(result.roll).toBe(50);
    expect(result.target).toBe(50);
    expect(result.success).toBe(true);
  });

  it('fails when roll is greater than target', () => {
    const result = resolveJudgement({ ...stats, strength: 50 }, 'strength', 0, () => 0.5);

    expect(result.roll).toBe(51);
    expect(result.target).toBe(50);
    expect(result.success).toBe(false);
  });

  it('clamps target between 1 and 95', () => {
    expect(resolveJudgement({ ...stats, strength: -10 }, 'strength', 0, () => 0).target).toBe(1);
    expect(resolveJudgement({ ...stats, strength: 200 }, 'strength', 0, () => 0).target).toBe(95);
  });

  it('includes 1d100, roll, and target in log', () => {
    const result = resolveJudgement({ ...stats, wisdom: 30 }, 'wisdom', 5, () => 0.2);

    expect(result.log).toContain('1d100');
    expect(result.log).toContain('21');
    expect(result.log).toContain('35');
  });
});
