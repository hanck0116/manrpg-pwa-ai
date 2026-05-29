import { isWalkable } from '../map/fixedMap';
import { resolveBasicAttack } from '../rules/combat';
import { appendLog, type GameState, type Position } from '../state/gameState';

export type PlayerAction = 'move' | 'basic-attack' | 'skill' | 'spell' | 'item' | 'defend' | 'wait' | 'end-turn';

const nextPosition = (position: Position): Position => ({
  x: position.x,
  y: Math.max(0, position.y - 1)
});

export const applyPlayerAction = (state: GameState, action: PlayerAction): GameState => {
  const baseState = {
    ...state,
    player: { ...state.player, guarding: false },
    enemy: { ...state.enemy, guarding: false },
    selectedAction: action
  };

  switch (action) {
    case 'move': {
      const target = nextPosition(baseState.player.position);
      const occupiedByEnemy = target.x === baseState.enemy.position.x && target.y === baseState.enemy.position.y;

      if (!isWalkable(target.x, target.y) || occupiedByEnemy) {
        return appendLog(baseState, '이동할 수 없는 칸입니다. 1차 구현은 위쪽 1칸 이동만 지원합니다.');
      }

      return appendLog(
        {
          ...baseState,
          player: { ...baseState.player, position: target }
        },
        '플레이어가 위쪽으로 1칸 이동했습니다.'
      );
    }
    case 'basic-attack': {
      const result = resolveBasicAttack(baseState.player, baseState.enemy);

      return appendLog(
        {
          ...baseState,
          enemy: { ...baseState.enemy, hp: result.targetHp }
        },
        result.log
      );
    }
    case 'defend':
      return appendLog(
        {
          ...baseState,
          player: { ...baseState.player, guarding: true }
        },
        '플레이어가 방어 자세를 취했습니다.'
      );
    case 'end-turn':
      return appendLog(
        {
          ...baseState,
          turn: baseState.turn + 1,
          player: {
            ...baseState.player,
            mp: Math.min(baseState.player.derived.maxMP, baseState.player.mp + baseState.player.derived.mpRegen)
          }
        },
        '턴을 마무리했습니다. MP가 회복됩니다.'
      );
    case 'skill':
      return appendLog(baseState, '스킬은 원본 규칙 확인 후 구현 예정입니다.');
    case 'spell':
      return appendLog(baseState, '마법은 원본 규칙 확인 후 구현 예정입니다.');
    case 'item':
      return appendLog(baseState, '아이템은 저장/인벤토리 규칙 확인 후 구현 예정입니다.');
    case 'wait':
      return appendLog(baseState, '플레이어가 대기했습니다.');
  }
};
