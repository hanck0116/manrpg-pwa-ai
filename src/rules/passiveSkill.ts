import type { CoreStats, PlayerSkill } from '../state/gameState';

export type PassiveStat = Exclude<PlayerSkill['passiveStat'], undefined>;

const passiveStats: PassiveStat[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'appearance'];

export const isPassiveSkill = (skill: PlayerSkill): boolean => skill.kind === 'passive' || skill.timing === 'passive';

export const applyPassiveSkillStats = (stats: CoreStats, skills: PlayerSkill[] = []): CoreStats =>
  skills.reduce<CoreStats>((nextStats, skill) => {
    if (!isPassiveSkill(skill) || !skill.passiveStat || !passiveStats.includes(skill.passiveStat)) {
      return nextStats;
    }

    const value = skill.passiveValue ?? 0;
    if (value === 0) {
      return nextStats;
    }

    return {
      ...nextStats,
      [skill.passiveStat]: nextStats[skill.passiveStat] + value
    };
  }, { ...stats });

export const summarizePassiveSkills = (skills: PlayerSkill[] = []): string[] =>
  skills
    .filter((skill) => isPassiveSkill(skill) && skill.passiveStat && (skill.passiveValue ?? 0) !== 0)
    .map((skill) => `${skill.name}: ${skill.passiveStat} ${skill.passiveValue! >= 0 ? '+' : ''}${skill.passiveValue}`);
