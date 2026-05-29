export type RollResult = {
  roll: number;
  target: number;
  success: boolean;
};

const rollDie = (sides: number): number => Math.floor(Math.random() * sides) + 1;

/** 일반 판정: 1d[유효스탯] + 보정이 유효스탯 이상이면 성공하는 임시 로컬 판정입니다. */
export const rollStatCheck = (effectiveStat: number, bonus = 0): RollResult => {
  const safeStat = Math.max(1, Math.floor(effectiveStat));
  const roll = rollDie(safeStat);
  const total = roll + bonus;

  return {
    roll: total,
    target: safeStat,
    success: total >= safeStat
  };
};

/** 절대 판정: 1d100이 유효스탯 + 보정 이하이면 성공합니다. */
export const rollAbsoluteCheck = (effectiveStat: number, bonus = 0): RollResult => {
  const target = Math.max(1, Math.min(100, Math.floor(effectiveStat + bonus)));
  const roll = rollDie(100);

  return {
    roll,
    target,
    success: roll <= target
  };
};
