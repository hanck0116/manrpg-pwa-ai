import { calcDerivedStats } from '../rules/derivedStats';
import { applyEquipmentBonuses } from '../rules/equipment';
import type { Character, CoreStats, EquipmentLoadout, GameState } from '../state/gameState';

export const refreshCharacter = (character: Character, equipment?: EquipmentLoadout): Character => {
  const derived = calcDerivedStats(character.stats);

  const refreshed = {
    ...character,
    derived,
    hp: Math.min(character.hp, derived.maxHP),
    mp: Math.min(character.mp, derived.maxMP)
  };

  return equipment ? applyEquipmentBonuses(refreshed, equipment) : refreshed;
};

export const refreshPlayer = (state: GameState): GameState => ({
  ...state,
  player: refreshCharacter(state.player, state.equipment)
});

export const updatePlayerStats = (state: GameState, updater: (stats: CoreStats) => CoreStats): GameState =>
  refreshPlayer({
    ...state,
    player: {
      ...state.player,
      stats: updater(state.player.stats)
    }
  });
