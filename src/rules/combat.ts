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

const canApplyBasicAttackExtraHit = (actor: Character, target: Character): boolean =>
  actor.stats.dexterity >= target.stats.dexterity * 2;

export const resolveBasicAttack = (actor: Character, target: Character): CombatResult => {
  if (target.hp <= 0) {
    return {
      hit: false,
      damage: 0,
      targetHp: target.hp,
      log: `${target.name}은(는) 이미 쓰러져 기본 공격 대상이 될 수 없습니다.`
    };
  }

  if (!isAdjacent(actor, target)) {
    return {
      hit: false,
      damage: 0,
      targetHp: target.hp,
      log: `${actor.name}의 기본 공격은 사거리가 닿지 않았습니다.`
    };
  }

  // TODO: 원본 zip 미확인 상태의 임시 규칙입니다. zip 확인 후 기본 공격/추가타 공식을 동기화해야 합니다.
  const guardedReduction = target.guarding ? 1 : 0;
  const damagePerHit = Math.max(1, actor.derived.basicAtk - guardedReduction);
  const extraHit = canApplyBasicAttackExtraHit(actor, target);
  const hits = extraHit ? 2 : 1;
  const damage = damagePerHit * hits;
  const targetHp = Math.max(0, target.hp - damage);
  const extraLog = extraHit ? ` ${actor.name}의 민첩이 높아 기본 공격 추가타가 발동했습니다.` : '';

  return {
    hit: true,
    damage,
    targetHp,
    log: `${actor.name}의 기본 공격이 ${target.name}에게 ${damage} 피해를 입혔습니다.${extraLog}`
  };
};
