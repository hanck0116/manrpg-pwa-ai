import { describe, expect, it } from 'vitest';
import { buildPrompt } from '../ai/prompt';
import { createInitialGameState, type GameState } from '../state/gameState';
import { applyGmTurnResponse, buildGmTurnPayload } from './gmTurn';

const response = {
  narration: '짧은 장면 묘사',
  playerActionResult: { kind: 'attack', successLevel: 'success', summary: '공격이 스쳤다' },
  enemyAction: { kind: 'attack', summary: '반격했다' },
  stateDeltas: {
    playerHpDelta: -9999,
    playerMpDelta: 9999,
    enemyHpDelta: -9999,
    coinDelta: -9999,
    usedItemIds: ['potion'],
    gainedItemNames: ['원본 아이템']
  },
  nextChoices: ['후퇴한다', '막는다', '관찰한다'],
  summaryUpdate: '압축 장면'
};

describe('GM turn compact payload', () => {
  it('does not include full GameState, full log, inventory, or enemy details', () => {
    const state: GameState = {
      ...createInitialGameState(),
      sceneSummary: 'x'.repeat(400),
      recentEvents: ['1', '2', '3', '4', '5', '6'],
      log: Array.from({ length: 12 }, (_, index) => ({ turn: index, message: `전체 로그 ${index}` })),
      inventory: [{ id: 'potion', name: '비밀 물약', type: 'item', sell: 1 }]
    };

    const payload = buildGmTurnPayload(state, '공격한다');
    const text = JSON.stringify(payload);

    expect(payload.scene.shortSummary.length).toBeLessThanOrEqual(300);
    expect(payload.scene.recentEvents).toEqual(['2', '3', '4', '5', '6']);
    expect(text).not.toContain('전체 로그 0');
    expect(payload.player.availableActions.filter((action) => action.startsWith('핵심 아이템:'))).toHaveLength(1);
    expect(text).not.toContain(state.enemy.name);
  });

  it('keeps prompt compact and sends recentEvents instead of full log', () => {
    const state = createInitialGameState();
    const prompt = buildPrompt('gm-turn', buildGmTurnPayload({ ...state, recentEvents: ['최근 사건'], log: [{ turn: 1, message: '전체 로그 비공개' }] }, '살핀다'));

    expect(prompt.length).toBeLessThan(6000);
    expect(prompt).toContain('최근 사건');
    expect(prompt).not.toContain('전체 로그 비공개');
    expect(prompt).toContain('stateDeltas');
  });
});

describe('GM turn state deltas', () => {
  it('clamps player and enemy values and applies only deltas', () => {
    const state: GameState = {
      ...createInitialGameState(),
      setupMode: false,
      pendingPlayerInput: '공격한다',
      inventory: [{ id: 'potion', name: '회복약', type: 'item', sell: 1 }]
    };
    const next = applyGmTurnResponse(state, {
      ...response,
      maxHP: 9999,
      maxMP: 9999,
      level: 99,
      equipment: { weapon: { name: '조작 무기' } }
    });

    expect(next.player.hp).toBe(0);
    expect(next.player.mp).toBe(state.player.derived.maxMP);
    expect(next.enemy.hp).toBe(0);
    expect(next.player.stats.coin).toBe(0);
    expect(next.player.stats.level).toBe(state.player.stats.level);
    expect(next.player.derived.maxHP).toBe(state.player.derived.maxHP);
    expect(next.equipment).toEqual(state.equipment);
    expect(next.inventory.some((item) => item.id === 'potion')).toBe(false);
    expect(next.inventory.some((item) => item.name === '원본 아이템')).toBe(true);
    expect(next.sceneSummary).toBe('압축 장면');
    expect(next.nextChoices).toEqual(['후퇴한다', '막는다', '관찰한다']);
    expect(next.hiddenEnemyHint.conditionHint).toBeTruthy();
  });

  it('ignores NaN and Infinity deltas', () => {
    const state = createInitialGameState();
    const next = applyGmTurnResponse(state, {
      ...response,
      stateDeltas: { playerHpDelta: Number.NaN, playerMpDelta: Infinity, enemyHpDelta: -Infinity, coinDelta: Number.NaN, usedItemIds: [], gainedItemNames: [] }
    });

    expect(next.player.hp).toBe(state.player.hp);
    expect(next.player.mp).toBe(state.player.mp);
    expect(next.enemy.hp).toBe(state.enemy.hp);
  });
});
