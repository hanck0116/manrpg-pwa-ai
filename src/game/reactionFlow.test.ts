import { describe, expect, it, vi } from 'vitest';
import { createPlayerSkill } from '../rules/skill';
import { createInitialGameState, type GameState } from '../state/gameState';
import { runEnemyMainTurn } from './enemyAI';
import { resolvePlayerReaction, resolvePlayerReactionSkill } from './reactionFlow';

const enemyAttackState = (guarding = false): GameState => ({
  ...createInitialGameState(),
  setupMode: false,
  phase: 'enemy-main',
  turnOwner: 'enemy',
  player: {
    ...createInitialGameState().player,
    guarding,
    position: { x: 3, y: 2 }
  },
  enemy: {
    ...createInitialGameState().enemy,
    position: { x: 3, y: 1 }
  }
});

describe('반응 흐름', () => {
  it('플레이어 방어 자세는 적 공격 판정까지 유지되어 피해를 1 줄입니다', () => {
    const unguarded = runEnemyMainTurn(enemyAttackState(false));
    const guarded = runEnemyMainTurn(enemyAttackState(true));

    expect(unguarded.pendingReaction?.damage).toBe(2);
    expect(guarded.pendingReaction?.damage).toBe(1);
    expect(guarded.player.guarding).toBe(true);
  });

  it('회피 성공 시 피해를 받지 않고 턴 숫자를 증가시키지 않습니다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const reacting = runEnemyMainTurn(enemyAttackState(false));
    const beforeHp = reacting.player.hp;
    const beforeTurn = reacting.turn;

    const next = resolvePlayerReaction(reacting, 'dodge');

    expect(next.player.hp).toBe(beforeHp);
    expect(next.turn).toBe(beforeTurn);
    expect(next.phase).toBe('player-main');
    expect(next.player.guarding).toBe(false);
    vi.restoreAllMocks();
  });

  it('반응 안 함은 대기 중인 피해를 적용하고 방어 자세를 해제합니다', () => {
    const reacting = runEnemyMainTurn(enemyAttackState(true));
    const beforeHp = reacting.player.hp;

    const next = resolvePlayerReaction(reacting, 'none');

    expect(next.player.hp).toBe(beforeHp - 1);
    expect(next.player.guarding).toBe(false);
    expect(next.phase).toBe('player-main');
  });

  it('반응 스킬 사용 시 pendingReaction을 해소하고 피해를 적용합니다', () => {
    const skill = createPlayerSkill({ name: '반격기', resourceType: 'none', timing: 'reaction', effectType: 'damage', multiplier: 1 });
    const reacting = { ...runEnemyMainTurn(enemyAttackState(false)), skills: [skill] };

    const next = resolvePlayerReactionSkill(reacting, skill.id);

    expect(next.pendingReaction).toBeUndefined();
    expect(next.phase).toBe('player-main');
    expect(next.enemy.hp).toBeLessThan(reacting.enemy.hp);
  });

  it('플레이어 반응턴이 아니면 반응 스킬을 사용할 수 없습니다', () => {
    const skill = createPlayerSkill({ name: '반응 회복', resourceType: 'none', timing: 'reaction', effectType: 'heal', multiplier: 1 });
    const state = { ...createInitialGameState(), setupMode: false, phase: 'player-main' as const, skills: [skill] };

    const next = resolvePlayerReactionSkill(state, skill.id);

    expect(next.phase).toBe('player-main');
    expect(next.log.at(-1)?.message).toContain('플레이어 반응턴');
  });

  it('반응 스킬 실패도 반응턴을 종료합니다', () => {
    const reacting = runEnemyMainTurn(enemyAttackState(false));
    const next = resolvePlayerReactionSkill(reacting, 'missing');

    expect(next.pendingReaction).toBeUndefined();
    expect(next.phase).toBe('player-main');
  });
});
