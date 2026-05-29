import { calcDerivedStats } from '../rules/derivedStats';
import type { Character, CoreStats, GameState } from '../state/gameState';

export const refreshCharacter = (character: Character): Character => {
  const derived = calcDerivedStats(character.stats);

  return {
    ...character,
    derived,
    hp: Math.min(character.hp, derived.maxHP),
    mp: Math.min(character.mp, derived.maxMP)
  };
};

export const refreshPlayer = (state: GameState): GameState => ({
  ...state,
  player: refreshCharacter(state.player)
});

export const updatePlayerStats = (state: GameState, updater: (stats: CoreStats) => CoreStats): GameState =>
  refreshPlayer({
    ...state,
    player: {
      ...state.player,
      stats: updater(state.player.stats)
    }
  });
