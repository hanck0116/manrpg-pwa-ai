import { calcDerivedStats } from '../rules/derivedStats';
import { applyPassiveSkillStats } from '../rules/passiveSkill';
import type { HaloState } from '../state/gameState';
import { applyEquipmentBonuses } from '../rules/equipment';
import type { Character, CoreStats, EquipmentLoadout, GameState, PlayerSkill } from '../state/gameState';

const applySatanHaloStats = (stats: CoreStats, halo?: HaloState): CoreStats =>
  halo?.selectedKind === 'satan' || halo?.satanActive
    ? {
        ...stats,
        strength: stats.strength + 10,
        dexterity: stats.dexterity + 10,
        constitution: stats.constitution + 10
      }
    : stats;

export const refreshCharacter = (character: Character, equipment?: EquipmentLoadout, skills: PlayerSkill[] = [], halo?: HaloState): Character => {
  const passiveStats = character.kind === 'player' ? applyPassiveSkillStats(character.stats, skills) : character.stats;
  const effectiveStats = character.kind === 'player' ? applySatanHaloStats(passiveStats, halo) : passiveStats;
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
  player: refreshCharacter(state.player, state.equipment, state.skills, state.halo)
});

export const updatePlayerStats = (state: GameState, updater: (stats: CoreStats) => CoreStats): GameState =>
  refreshPlayer({
    ...state,
    player: {
      ...state.player,
      stats: updater(state.player.stats)
    }
  });
