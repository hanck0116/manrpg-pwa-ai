import { calcDerivedStats } from '../rules/derivedStats';
import { appendLog, type Character, type GameState } from '../state/gameState';

export const allocatableStatKeys = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'appearance'
] as const;

export type AllocatableStatKey = (typeof allocatableStatKeys)[number];

const MIN_STAT = 1;

const refreshPlayerVitals = (player: Character): Character => {
  const derived = calcDerivedStats(player.stats);

  return {
    ...player,
    derived,
    hp: derived.maxHP,
    mp: derived.maxMP
  };
};

const withRefreshedPlayer = (state: GameState, player: Character): GameState => ({
  ...state,
  player: refreshPlayerVitals(player)
});

const canAllocateStats = (state: GameState): boolean => state.setupMode || state.levelUpPending;

export const canIncreaseStat = (state: GameState, statKey: AllocatableStatKey): boolean =>
  canAllocateStats(state) && state.player.derived.remainingStatPoint > 0 && state.player.stats[statKey] < state.player.derived.maxStat;

export const canDecreaseStat = (state: GameState, statKey: AllocatableStatKey): boolean =>
  canAllocateStats(state) && state.player.stats[statKey] > MIN_STAT;

export const increaseStat = (state: GameState, statKey: AllocatableStatKey): GameState => {
  if (!canIncreaseStat(state, statKey)) {
    return state;
  }

  return withRefreshedPlayer(state, {
    ...state.player,
    stats: {
      ...state.player.stats,
      [statKey]: state.player.stats[statKey] + 1
    }
  });
};

export const decreaseStat = (state: GameState, statKey: AllocatableStatKey): GameState => {
  if (!canDecreaseStat(state, statKey)) {
    return state;
  }

  return withRefreshedPlayer(state, {
    ...state.player,
    stats: {
      ...state.player.stats,
      [statKey]: state.player.stats[statKey] - 1
    }
  });
};

export const resetStats = (state: GameState): GameState => {
  if (!state.setupMode || state.levelUpPending) {
    return state;
  }

  return withRefreshedPlayer(
    {
      ...state,
      setupMode: true
    },
    {
      ...state.player,
      stats: {
        ...state.player.stats,
        strength: MIN_STAT,
        dexterity: MIN_STAT,
        constitution: MIN_STAT,
        intelligence: MIN_STAT,
        wisdom: MIN_STAT,
        appearance: MIN_STAT
      }
    }
  );
};

export const finishSetup = (state: GameState): GameState => {
  if (!state.setupMode) {
    return state;
  }

  if (state.player.derived.remainingStatPoint !== 0) {
    return appendLog(state, '남은 스탯 포인트를 모두 분배해야 시작할 수 있습니다.');
  }

  return appendLog(
    {
      ...state,
      setupMode: false,
      actionQueue: []
    },
    '캐릭터 생성이 완료되었습니다. 전투를 시작합니다.'
  );
};
