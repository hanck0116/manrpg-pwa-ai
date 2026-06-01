import type { CoreStats } from '../state/gameState';

export type JudgeStat = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'appearance' | 'none';

export type JudgementResult = {
  attempted: boolean;
  success: boolean;
  roll?: number;
  target?: number;
  stat?: JudgeStat;
  bonus?: number;
  log: string;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const resolveJudgement = (
  stats: Pick<CoreStats, Exclude<JudgeStat, 'none'>>,
  judgeStat: JudgeStat | undefined,
  judgeBonus = 0,
  rng: () => number = Math.random
): JudgementResult => {
  if (!judgeStat || judgeStat === 'none') {
    return {
      attempted: false,
      success: true,
      stat: 'none',
      bonus: judgeBonus,
      log: '판정 없음'
    };
  }

  const roll = clamp(Math.floor(rng() * 100) + 1, 1, 100);
  const rawTarget = Math.floor(stats[judgeStat] + judgeBonus);
  const target = clamp(rawTarget, 1, 95);
  const success = roll <= target;

  return {
    attempted: true,
    success,
    roll,
    target,
    stat: judgeStat,
    bonus: judgeBonus,
    log: `1d100 판정: ${roll} <= ${target} ${success ? '성공' : '실패'}`
  };
};
