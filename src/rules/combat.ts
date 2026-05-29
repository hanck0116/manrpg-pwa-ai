import type { Character } from '../state/gameState';

export type CombatResult = {
  hit: boolean;
  damage: number;
  targetHp: number;
  log: string;
};

export const isAdjacent = (actor: Character, target: Character): boolean => {
  const distance = Math.abs(actor.position.x - target.position.x) + Math.abs(actor.position.y - target.position.y);

  return distance === 1;
};

export const resolveBasicAttack = (actor: Character, target: Character): CombatResult => {
  if (!isAdjacent(actor, target)) {
    return {
      hit: false,
      damage: 0,
      targetHp: target.hp,
      log: `${actor.name}의 기본 공격은 사거리가 닿지 않았습니다.`
    };
  }

  const guardedReduction = target.guarding ? 1 : 0;
  const damage = Math.max(1, actor.derived.basicAtk - guardedReduction);
  const targetHp = Math.max(0, target.hp - damage);

  return {
    hit: true,
    damage,
    targetHp,
    log: `${actor.name}의 기본 공격이 ${target.name}에게 ${damage} 피해를 입혔습니다.`
  };
};
