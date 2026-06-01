import type { Character, PlayerSkill } from '../state/gameState';

export type SkillUseResult = {
  player: Character;
  enemy: Character;
  log: string;
};

const clamp = (value: number, max: number): number => Math.min(max, Math.max(0, value));

const basePowerForSkill = (player: Character, skill: PlayerSkill): number => {
  if (skill.resourceType === 'outer') return Math.max(1, player.derived.attack);
  if (skill.resourceType === 'inner') return Math.max(1, player.derived.mpRegen);
  if (skill.resourceType === 'sword') return Math.max(1, player.derived.attack);
  if (skill.resourceType === 'magic') return Math.max(1, Math.floor(player.derived.maxMP / 10));
  return 1;
};

const judgeText = (skill: PlayerSkill): string =>
  skill.judgeStat && skill.judgeStat !== 'none' ? ` 판정 참고: ${skill.judgeStat} ${(skill.judgeBonus ?? 0) >= 0 ? '+' : ''}${skill.judgeBonus ?? 0}.` : '';

const applyOptionalDeltas = (player: Character, skill: PlayerSkill): { player?: Character; error?: string; parts: string[] } => {
  const mpDelta = skill.mpDelta ?? 0;
  const hpDelta = skill.hpDelta ?? 0;

  if (mpDelta < 0 && player.mp < Math.abs(mpDelta)) return { error: `${skill.name} 사용 실패: MP가 부족합니다.`, parts: [] };
  if (hpDelta < 0 && player.hp < Math.abs(hpDelta)) return { error: `${skill.name} 사용 실패: HP가 부족합니다.`, parts: [] };

  const parts: string[] = [];
  if (mpDelta !== 0) parts.push(`MP ${mpDelta >= 0 ? '+' : ''}${mpDelta}`);
  if (hpDelta !== 0) parts.push(`HP ${hpDelta >= 0 ? '+' : ''}${hpDelta}`);

  return {
    player: {
      ...player,
      mp: clamp(player.mp + mpDelta, player.derived.maxMP),
      hp: clamp(player.hp + hpDelta, player.derived.maxHP)
    },
    parts
  };
};

export const resolveSkillUse = (player: Character, enemy: Character, skill: PlayerSkill): SkillUseResult => {
  if (skill.kind === 'passive' || skill.timing === 'passive') {
    return { player, enemy, log: `${skill.name} 사용 실패: 패시브 스킬은 전투 큐에서 사용할 수 없습니다.` };
  }

  const deltaResult = applyOptionalDeltas(player, skill);
  if (deltaResult.error || !deltaResult.player) return { player, enemy, log: deltaResult.error ?? `${skill.name} 사용 실패` };

  let nextPlayer = deltaResult.player;
  let nextEnemy = enemy;
  const parts = [...deltaResult.parts];

  if (skill.damageMultiplier !== undefined) {
    if (skill.damageMultiplier > 0) {
      const damage = Math.max(0, Math.floor(player.derived.attack * skill.damageMultiplier));
      nextEnemy = { ...nextEnemy, hp: clamp(nextEnemy.hp - damage, nextEnemy.derived.maxHP) };
      parts.push(`적에게 ${damage} 피해`);
    }

    if (skill.kind === 'defense' || skill.effectType === 'guard') {
      nextPlayer = { ...nextPlayer, guarding: true };
      parts.push('방어 자세');
    }

    return {
      player: nextPlayer,
      enemy: nextEnemy,
      log: `${skill.name} 사용: ${parts.length ? parts.join(', ') : '수치 효과 없음'}.${judgeText(skill)}`
    };
  }

  const power = Math.max(1, Math.floor(basePowerForSkill(player, skill) * skill.multiplier));

  if (skill.effectType === 'damage') {
    nextEnemy = { ...nextEnemy, hp: clamp(nextEnemy.hp - power, nextEnemy.derived.maxHP) };
    return { player: nextPlayer, enemy: nextEnemy, log: `${skill.name} 사용: ${[...parts, `적에게 ${power} 피해`].join(', ')}. 기존 스킬 배율 방식으로 처리했습니다.${judgeText(skill)}` };
  }

  if (skill.effectType === 'heal') {
    const beforeHp = nextPlayer.hp;
    nextPlayer = { ...nextPlayer, hp: clamp(nextPlayer.hp + power, nextPlayer.derived.maxHP) };
    return { player: nextPlayer, enemy: nextEnemy, log: `${skill.name} 사용: ${[...parts, `플레이어 HP를 ${nextPlayer.hp - beforeHp} 회복`].join(', ')}. 기존 스킬 배율 방식으로 처리했습니다.${judgeText(skill)}` };
  }

  if (skill.effectType === 'guard') {
    return { player: { ...nextPlayer, guarding: true }, enemy: nextEnemy, log: `${skill.name} 사용: ${[...parts, '방어 자세'].join(', ')}.${judgeText(skill)}` };
  }

  return { player: nextPlayer, enemy: nextEnemy, log: `${skill.name} 사용: ${parts.length ? parts.join(', ') : '원본 효과 확인 전이라 실제 효과 없음'}.${judgeText(skill)}` };
};
