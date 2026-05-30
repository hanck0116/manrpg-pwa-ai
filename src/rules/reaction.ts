import type { Character } from '../state/gameState';
import { rollAbsoluteCheck } from './dice';

export type ReactionResult = {
  success: boolean;
  log: string;
};

export const resolveDodgeReaction = (player: Character, enemy: Character): ReactionResult => {
  const roll = rollAbsoluteCheck(player.stats.dexterity, 0);

  return {
    success: roll.success,
    log: roll.success
      ? `${player.name}의 회피 성공: ${enemy.name}의 공격을 피했습니다. (${roll.roll} <= ${roll.target})`
      : `${player.name}의 회피 실패: ${enemy.name}의 공격을 피하지 못했습니다. (${roll.roll} > ${roll.target})`
  };
};

export const resolveGuardReaction = (player: Character, enemy: Character): ReactionResult => {
  const roll = rollAbsoluteCheck(player.stats.strength, 0);

  return {
    success: roll.success,
    log: roll.success
      ? `${player.name}의 방어 성공: ${enemy.name}의 공격을 막았습니다. (${roll.roll} <= ${roll.target})`
      : `${player.name}의 방어 실패: ${enemy.name}의 공격을 완전히 막지 못했습니다. (${roll.roll} > ${roll.target})`
  };
};

export const resolveCounterReaction = (player: Character, enemy: Character): ReactionResult => {
  const roll = rollAbsoluteCheck(player.stats.dexterity, 0);

  return {
    success: roll.success,
    log: roll.success
      ? `${player.name}의 카운터 성공: ${enemy.name}의 공격을 흘리고 반격합니다. (${roll.roll} <= ${roll.target})`
      : `${player.name}의 카운터 실패: ${enemy.name}의 공격을 흘리지 못했습니다. (${roll.roll} > ${roll.target})`
  };
};
