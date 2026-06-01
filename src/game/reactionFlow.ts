import { resolveBasicAttack } from '../rules/combat';
import { resolveSkillUse } from '../rules/skillCombat';
import { resolveCounterReaction, resolveDodgeReaction, resolveGuardReaction } from '../rules/reaction';
import { appendLog, type GameState, type QueuedAction } from '../state/gameState';

const finishReaction = (state: GameState): GameState => {
  if (state.enemy.hp <= 0) {
    return appendLog(
      {
        ...state,
        pendingReaction: undefined,
        actionQueue: [],
        phase: 'floor-cleared',
        turnOwner: 'player',
        battleResult: 'win',
        player: { ...state.player, guarding: false }
      },
      '반응 처리 완료: 적 HP가 0이 되어 층을 클리어했습니다.'
    );
  }

  const cleared = {
    ...state,
    pendingReaction: undefined,
    actionQueue: [],
    turnOwner: state.player.hp <= 0 ? ('enemy' as const) : ('player' as const),
    phase: state.player.hp <= 0 ? ('battle-ended' as const) : ('player-main' as const),
    battleResult: state.player.hp <= 0 ? ('lose' as const) : state.battleResult,
    player: { ...state.player, guarding: false }
  };

  return state.player.hp <= 0
    ? appendLog(cleared, '전투 종료: 반응 처리 중 플레이어 HP가 0이 되었습니다.')
    : appendLog(cleared, '반응 처리 완료: 플레이어 메인턴으로 돌아갑니다.');
};

const applyIncomingDamage = (state: GameState, damage: number, log: string): GameState =>
  appendLog(
    {
      ...state,
      player: {
        ...state.player,
        hp: Math.max(0, state.player.hp - damage)
      }
    },
    log
  );

export const beginPlayerReaction = (state: GameState, attackLog: string, damage: number): GameState =>
  appendLog(
    {
      ...state,
      phase: 'player-reaction',
      turnOwner: 'player',
      pendingReaction: {
        against: 'player',
        attackLog,
        damage
      }
    },
    `${attackLog} 적 공격에 반응할 수 있습니다. 반응은 턴을 소모하지 않습니다.`
  );

export const resolvePlayerReactionSkill = (state: GameState, skillId: string): GameState => {
  if (state.phase !== 'player-reaction' || !state.pendingReaction) {
    return appendLog(state, '반응 스킬은 플레이어 반응턴에서만 사용할 수 있습니다.');
  }

  const skill = state.skills.find((playerSkill) => playerSkill.id === skillId);

  if (!skill || skill.timing !== 'reaction' || skill.kind === 'passive') {
    return finishReaction(appendLog(state, '반응 스킬 사용 실패: 사용할 수 있는 반응 스킬이 아닙니다.'));
  }

  const result = resolveSkillUse(state.player, state.enemy, skill);

  return finishReaction(
    appendLog(
      {
        ...state,
        player: result.player,
        enemy: result.enemy
      },
      `반응 스킬 사용: ${result.log}`
    )
  );
};

export const resolvePlayerReaction = (state: GameState, reactionType: NonNullable<QueuedAction['reactionType']> | 'none'): GameState => {
  if (state.phase !== 'player-reaction' || !state.pendingReaction) {
    return appendLog(state, '처리할 플레이어 반응이 없습니다.');
  }

  const incomingDamage = Math.max(0, state.pendingReaction.damage ?? 0);
  let nextState = state;

  if (reactionType === 'dodge') {
    const result = resolveDodgeReaction(state.player, state.enemy);
    nextState = appendLog(nextState, result.log);
    if (!result.success) {
      nextState = applyIncomingDamage(nextState, incomingDamage, `회피 실패: ${incomingDamage} 피해를 받았습니다.`);
    }
    return finishReaction(nextState);
  }

  if (reactionType === 'guard') {
    const result = resolveGuardReaction(state.player, state.enemy);
    nextState = appendLog(nextState, result.log);
    if (!result.success) {
      const reducedDamage = Math.max(0, incomingDamage - 1);
      nextState = applyIncomingDamage(nextState, reducedDamage, `방어 실패: 피해를 1 줄여 ${reducedDamage} 피해를 받았습니다.`);
    }
    return finishReaction(nextState);
  }

  if (reactionType === 'counter') {
    const result = resolveCounterReaction(state.player, state.enemy);
    nextState = appendLog(nextState, result.log);

    if (result.success) {
      const counter = resolveBasicAttack(state.player, state.enemy);
      nextState = appendLog(
        {
          ...nextState,
          enemy: { ...nextState.enemy, hp: counter.targetHp }
        },
        `카운터 반격: ${counter.log}`
      );
    } else {
      nextState = applyIncomingDamage(nextState, incomingDamage, `카운터 실패: ${incomingDamage} 피해를 받았습니다.`);
    }

    return finishReaction(nextState);
  }

  nextState = applyIncomingDamage(nextState, incomingDamage, `반응 안 함: ${incomingDamage} 피해를 받았습니다.`);
  return finishReaction(nextState);
};
