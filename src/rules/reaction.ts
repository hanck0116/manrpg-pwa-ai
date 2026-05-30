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
      ? `${player.name} dodged ${enemy.name}'s attack (${roll.roll} <= ${roll.target}).`
      : `${player.name} failed to dodge ${enemy.name}'s attack (${roll.roll} > ${roll.target}).`
  };
};

export const resolveGuardReaction = (player: Character, enemy: Character): ReactionResult => {
  const roll = rollAbsoluteCheck(player.stats.strength, 0);

  return {
    success: roll.success,
    log: roll.success
      ? `${player.name} guarded against ${enemy.name}'s attack (${roll.roll} <= ${roll.target}).`
      : `${player.name} failed to fully guard ${enemy.name}'s attack (${roll.roll} > ${roll.target}).`
  };
};

export const resolveCounterReaction = (player: Character, enemy: Character): ReactionResult => {
  const roll = rollAbsoluteCheck(player.stats.dexterity, 0);

  return {
    success: roll.success,
    log: roll.success
      ? `${player.name} countered ${enemy.name}'s attack (${roll.roll} <= ${roll.target}).`
      : `${player.name} failed to counter ${enemy.name}'s attack (${roll.roll} > ${roll.target}).`
  };
};
