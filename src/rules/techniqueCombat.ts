import type { Character, PlayerTechnique } from '../state/gameState';

export type TechniqueUseResult = {
  player: Character;
  enemy: Character;
  log: string;
};

const clamp = (value: number, max: number): number => Math.min(max, Math.max(0, value));
const judgeText = (technique: PlayerTechnique): string =>
  technique.judgeStat === 'none' ? '' : ` 판정 참고: ${technique.judgeStat} ${technique.judgeBonus >= 0 ? '+' : ''}${technique.judgeBonus}.`;

export const resolveTechniqueUse = (player: Character, enemy: Character, technique: PlayerTechnique): TechniqueUseResult => {
  if (technique.mpDelta < 0 && player.mp < Math.abs(technique.mpDelta)) {
    return { player, enemy, log: `${technique.name} 사용 실패: MP가 부족합니다.` };
  }

  if (technique.hpDelta < 0 && player.hp < Math.abs(technique.hpDelta)) {
    return { player, enemy, log: `${technique.name} 사용 실패: HP가 부족합니다.` };
  }

  let nextPlayer: Character = {
    ...player,
    mp: clamp(player.mp + technique.mpDelta, player.derived.maxMP),
    hp: clamp(player.hp + technique.hpDelta, player.derived.maxHP)
  };
  let nextEnemy = enemy;
  const parts: string[] = [];

  if (technique.mpDelta !== 0) parts.push(`MP ${technique.mpDelta >= 0 ? '+' : ''}${technique.mpDelta}`);
  if (technique.hpDelta !== 0) parts.push(`HP ${technique.hpDelta >= 0 ? '+' : ''}${technique.hpDelta}`);

  if (technique.damageMultiplier > 0) {
    const damage = Math.max(0, Math.floor(player.derived.attack * technique.damageMultiplier));
    nextEnemy = { ...nextEnemy, hp: clamp(nextEnemy.hp - damage, nextEnemy.derived.maxHP) };
    parts.push(`적에게 ${damage} 피해`);
  }

  if (technique.kind === 'defense') {
    nextPlayer = { ...nextPlayer, guarding: true };
    parts.push('방어 자세');
  }

  return {
    player: nextPlayer,
    enemy: nextEnemy,
    log: `${technique.name} 사용: ${parts.length ? parts.join(', ') : '수치 효과 없음'}.${judgeText(technique)}`
  };
};
