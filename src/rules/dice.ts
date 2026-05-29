export type StatRollResult = {
  type: 'stat';
  sides: number;
  roll: number;
  bonus: number;
  total: number;
  success?: boolean;
  note: string;
};

export type AbsoluteRollResult = {
  type: 'absolute';
  roll: number;
  target: number;
  success: boolean;
};

export type RollResult = StatRollResult | AbsoluteRollResult;

const rollDie = (sides: number): number => Math.floor(Math.random() * sides) + 1;

/** 일반 판정: 원본 통합본 기준 1d[유효스탯]을 굴리며, 성공조건은 호출 규칙이 결정합니다. */
export const rollStatCheck = (effectiveStat: number, bonus = 0): StatRollResult => {
  const sides = Math.max(1, Math.floor(effectiveStat));
  const roll = rollDie(sides);
  const safeBonus = Math.floor(bonus);

  return {
    type: 'stat',
    sides,
    roll,
    bonus: safeBonus,
    total: roll + safeBonus,
    success: undefined,
    note: '원본 통합본은 일반 판정을 1d[유효스탯]으로 명시하지만, 구체 성공조건은 호출 규칙에서 결정해야 함'
  };
};

/** 절대 판정: 1d100이 유효스탯 + 보정 이하이면 성공합니다. */
export const rollAbsoluteCheck = (effectiveStat: number, bonus = 0): AbsoluteRollResult => {
  const target = Math.max(1, Math.min(100, Math.floor(effectiveStat + bonus)));
  const roll = rollDie(100);

  return {
    type: 'absolute',
    roll,
    target,
    success: roll <= target
  };
};
