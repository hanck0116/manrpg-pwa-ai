import type { CoreStats } from '../state/gameState';

export type DerivedStats = {
  maxHP: number;
  maxMP: number;
  mpRegen: number;
  basicAtk: number;
};

/**
 * Temporary implementation based on the initial project brief.
 * TODO: Replace with source zip integrated rules if they differ after upload.
 */
export const calcDerivedStats = (stats: CoreStats): DerivedStats => ({
  maxHP: stats.constitution * 10,
  maxMP: stats.level * 5 + stats.intelligence * 10,
  mpRegen: stats.level + stats.wisdom * 2,
  basicAtk: Math.floor((stats.strength + stats.constitution) / 10) + 2
});
