import { appendLog, createInitialEnemy, type GameState } from '../state/gameState';

const getInitiative = (state: GameState): GameState['initiative'] =>
  state.enemy.stats.dexterity > state.player.stats.dexterity ? 'enemy' : 'player';

export const clearFloorRecovery = (state: GameState): GameState => {
  if (state.phase !== 'floor-cleared') {
    return appendLog(state, '층 클리어 상태에서만 회복/정비를 진행할 수 있습니다.');
  }

  return appendLog(
    {
      ...state,
      player: {
        ...state.player,
        hp: state.player.derived.maxHP,
        mp: state.player.derived.maxMP,
        guarding: false
        // TODO: 상태이상 필드가 추가되면 층 클리어 시 전체 제거한다.
      },
      actionQueue: []
    },
    '층 클리어 회복: HP/MP가 최대치로 회복되었습니다. 자동 코인 보상은 없습니다.'
  );
};

export const enterNextFloor = (state: GameState): GameState => {
  if (!state.rewardState?.claimed) {
    return appendLog(state, '보상을 확정해야 다음 층에 진입할 수 있습니다.');
  }

  if (state.phase === 'level-up-pending' || state.levelUpPending || state.player.derived.remainingStatPoint !== 0) {
    return appendLog(state, '레벨업으로 얻은 스탯 포인트를 모두 분배해야 다음 층에 진입할 수 있습니다.');
  }

  const enemy = createInitialEnemy();
  const positionedState = {
    ...state,
    floor: state.floor + 1,
    player: {
      ...state.player,
      position: { x: 5, y: 9 },
      guarding: false
    },
    enemy: {
      ...enemy,
      position: { x: 5, y: 1 }
    }
  };
  const initiative = getInitiative(positionedState);

  return appendLog(
    {
      ...positionedState,
      setupMode: false,
      levelUpPending: false,
      selectedAction: '대기',
      phase: initiative === 'player' ? 'player-main' : 'enemy-main',
      initiative,
      actionQueue: [],
      turnOwner: initiative,
      rewardState: undefined,
      battleResult: undefined,
      magicBookAttempt: {
        floor: state.floor + 1,
        freeUsed: false
      }
    },
    '다음 층에 진입했습니다. 11x11 고정 맵을 유지하며 적은 1명입니다.'
  );
};
