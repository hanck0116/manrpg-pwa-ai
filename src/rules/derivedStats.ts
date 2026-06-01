import type { CoreStats } from '../state/gameState';

export type SwordKiLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type SwordKiConfig = {
  name: string;
  atkMul: number;
  mpDelta: number;
};

export type DerivedStats = {
  maxStat: number;
  totalStatPoint: number;
  usedStatPoint: number;
  remainingStatPoint: number;
  maxHP: number;
  maxMP: number;
  mpRegen: number;
  basicAtk: number;
  attack: number;
  outerMultiplier: number;
  innerMultiplier: number;
  swordKiName: string;
  swordKiAtkMul: number;
  swordKiMpDelta: number;
  multi: number;
};

const SWORD_KI_TABLE: Record<SwordKiLevel, SwordKiConfig> = {
  0: { name: '없음', atkMul: 1, mpDelta: 0 },
  1: { name: '검기상인', atkMul: 1.5, mpDelta: -50 },
  2: { name: '검기', atkMul: 2, mpDelta: -150 },
  3: { name: '검사', atkMul: 5, mpDelta: -300 },
  4: { name: '검강', atkMul: 20, mpDelta: -700 },
  5: { name: '강기압환', atkMul: 50, mpDelta: -500 },
  6: { name: '심검', atkMul: 50, mpDelta: 1000000 }
};

const attackTraitMultipliers: Record<string, number> = {
  연혼염: 1.15,
  '흑염의 영체화': 1.1,
  입천: 1.3,
  '앙케 라': 1.5
};

const clampSwordKi = (swordKi: CoreStats['swordKi']): SwordKiLevel => Math.max(0, Math.min(6, swordKi)) as SwordKiLevel;

const calcAttackTraitMultiplier = (traits: string[]): number =>
  traits.reduce((multiplier, trait) => multiplier * (attackTraitMultipliers[trait] ?? 1), 1);

export const calcDerivedStats = (stats: CoreStats): DerivedStats => {
  const level = Math.max(1, Math.floor(stats.level));
  const strength = Math.max(0, Math.floor(stats.strength));
  const dexterity = Math.max(0, Math.floor(stats.dexterity));
  const constitution = Math.max(0, Math.floor(stats.constitution));
  const intelligence = Math.max(0, Math.floor(stats.intelligence));
  const wisdom = Math.max(0, Math.floor(stats.wisdom));
  const appearance = Math.max(0, Math.floor(stats.appearance));
  const outerStack = Math.max(0, Math.floor(stats.outerStack));
  const innerStack = Math.max(0, Math.floor(stats.innerStack));
  const multicasting = Math.max(0, Math.floor(stats.multicasting));
  const traits = Array.isArray(stats.traits) ? stats.traits : [];
  const swordKi = SWORD_KI_TABLE[clampSwordKi(stats.swordKi)];

  const totalStatPoint = 60 + (level - 1) * 3;
  const usedStatPoint = strength + dexterity + constitution + intelligence + wisdom + appearance;
  const maxStat = level >= 80 ? 100 : level + 20;
  const baseHP = constitution * 10;
  const baseMP = level * 5 + intelligence * 10;
  const baseRegen = level + wisdom * 2;
  const baseAtk = Math.floor((strength + constitution) / 10) + 2;
  const outerMultiplier = Math.pow(1.4, outerStack);
  const innerMultiplier = Math.pow(1.2, innerStack);
  const simbeopMpMultiplier = traits.includes('심법') ? 2 : 1;
  const mentalTranscendenceMpMultiplier = traits.includes('심적초월') ? 2 : 1;
  // TODO: 임모탈 평선 발동/해제, 자기상환적 돌연변이 배수 선택 등 사용형/상태형 효과는 별도 상태 필드와 UI가 정리되면 반영합니다.
  const attack = Math.max(0, Math.floor(baseAtk * swordKi.atkMul * calcAttackTraitMultiplier(traits)));

  return {
    maxStat,
    totalStatPoint,
    usedStatPoint,
    remainingStatPoint: totalStatPoint - usedStatPoint,
    maxHP: Math.max(1, Math.floor(baseHP * outerMultiplier)),
    maxMP: Math.max(0, Math.floor((baseMP * innerMultiplier + swordKi.mpDelta) * simbeopMpMultiplier * mentalTranscendenceMpMultiplier)),
    mpRegen: Math.max(0, Math.floor(baseRegen * innerMultiplier * simbeopMpMultiplier)),
    basicAtk: baseAtk,
    attack,
    outerMultiplier,
    innerMultiplier,
    swordKiName: swordKi.name,
    swordKiAtkMul: swordKi.atkMul,
    swordKiMpDelta: swordKi.mpDelta,
    multi: multicasting * (traits.includes('시분할') ? 2 : 1)
  };
};
