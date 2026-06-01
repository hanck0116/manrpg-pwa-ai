import { calcDerivedStats } from '../rules/derivedStats';
import { applyPassiveSkillStats } from '../rules/passiveSkill';
import { applyEquipmentBonuses } from '../rules/equipment';
import type { Character, CoreStats, EquipmentLoadout, GameState, PlayerSkill } from '../state/gameState';

export const refreshCharacter = (character: Character, equipment?: EquipmentLoadout, skills: PlayerSkill[] = []): Character => {
  const effectiveStats = character.kind === 'player' ? applyPassiveSkillStats(character.stats, skills) : character.stats;
  const derived = calcDerivedStats(effectiveStats);

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
  player: refreshCharacter(state.player, state.equipment, state.skills)
});

export const updatePlayerStats = (state: GameState, updater: (stats: CoreStats) => CoreStats): GameState =>
  refreshPlayer({
    ...state,
    player: {
      ...state.player,
      stats: updater(state.player.stats)
    }
  });
