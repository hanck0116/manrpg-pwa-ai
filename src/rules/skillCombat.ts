import type { Character, PlayerSkill } from '../state/gameState';

export type SkillUseResult = {
  player: Character;
  enemy: Character;
  log: string;
};

const clampHp = (value: number, maxHP: number): number => Math.min(maxHP, Math.max(0, value));

const basePowerForSkill = (player: Character, skill: PlayerSkill): number => {
  if (skill.resourceType === 'outer') return Math.max(1, player.derived.attack);
  if (skill.resourceType === 'inner') return Math.max(1, player.derived.mpRegen);
  if (skill.resourceType === 'sword') return Math.max(1, player.derived.attack);
  if (skill.resourceType === 'magic') return Math.max(1, Math.floor(player.derived.maxMP / 10));
  return 1;
};

export const resolveSkillUse = (player: Character, enemy: Character, skill: PlayerSkill): SkillUseResult => {
  const power = Math.max(1, Math.floor(basePowerForSkill(player, skill) * skill.multiplier));

  if (skill.effectType === 'damage') {
    const enemyHp = clampHp(enemy.hp - power, enemy.derived.maxHP);
    return {
      player,
      enemy: { ...enemy, hp: enemyHp },
      log: `${skill.name} 사용: 적에게 ${power} 피해를 주었습니다. 스킬 피해 배수는 최종 공격 피해 기반의 임시 1차 계산입니다.`
    };
  }

  if (skill.effectType === 'heal') {
    const playerHp = clampHp(player.hp + power, player.derived.maxHP);
    return {
      player: { ...player, hp: playerHp },
      enemy,
      log: `${skill.name} 사용: 플레이어 HP를 ${playerHp - player.hp} 회복했습니다. 회복량은 임시 1차 계산입니다.`
    };
  }

  if (skill.effectType === 'guard') {
    return {
      player: { ...player, guarding: true },
      enemy,
      log: `${skill.name} 사용: 플레이어가 방어 자세를 취했습니다.`
    };
  }

  return {
    player,
    enemy,
    log: `${skill.name} 사용: 원본 효과 확인 전이라 실제 효과를 적용하지 않았습니다.`
  };
};
