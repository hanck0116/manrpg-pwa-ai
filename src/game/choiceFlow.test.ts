import { describe, expect, it, vi } from 'vitest';
import { makeItem } from '../rules/reward';
import { createInitialGameState, type GameState } from '../state/gameState';
import { loadGameStub, saveGameStub } from '../storage/save';
import { confirmPendingChoice, cancelPendingChoice } from './choiceFlow';
import { useInventoryItem } from './inventory';

const maintenanceState = (): GameState => ({
  ...createInitialGameState(),
  setupMode: false,
  phase: 'floor-cleared',
  turnOwner: 'player'
});

const createLocalStorage = () => {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    })
  };
};

describe('choice flow', () => {
  it('creates pendingChoice when using a basic magic select ticket', () => {
    const item = makeItem('기초 마법서 선택권');
    const next = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);

    expect(next.pendingChoice).toMatchObject({
      sourceItemId: item.id,
      sourceItemName: item.name,
      kind: 'magicTicketSelect'
    });
  });

  it('includes circle 1 and 2 spells in basic magic select ticket options', () => {
    const item = makeItem('기초 마법서 선택권');
    const next = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);
    const circles = new Set(next.pendingChoice?.options.map((option) => option.meta?.circle));

    expect(circles.has(1)).toBe(true);
    expect(circles.has(2)).toBe(true);
  });

  it('adds a spell when confirming a magic select option', () => {
    const item = makeItem('기초 마법서 선택권');
    const pending = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);
    const optionId = pending.pendingChoice?.options[0]?.id ?? '';
    const next = confirmPendingChoice(pending, optionId);

    expect(next.spells).toHaveLength(1);
  });

  it('removes the source magicTicket after confirming a magic select option', () => {
    const item = makeItem('기초 마법서 선택권');
    const pending = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);
    const optionId = pending.pendingChoice?.options[0]?.id ?? '';
    const next = confirmPendingChoice(pending, optionId);

    expect(next.inventory).toHaveLength(0);
    expect(next.pendingChoice).toBeUndefined();
  });

  it('keeps inventory when cancelling a pending choice', () => {
    const item = makeItem('기초 마법서 선택권');
    const pending = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);
    const next = cancelPendingChoice(pending);

    expect(next.inventory).toHaveLength(1);
    expect(next.pendingChoice).toBeUndefined();
  });

  it('adds 50 coins and removes the choice item when selecting 50코인', () => {
    const item = { ...makeItem('시분할/50코인 선택권'), type: 'choice' as const, choices: ['시분할', '50코인'] };
    const pending = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);
    const optionId = pending.pendingChoice?.options.find((option) => option.value === '50코인')?.id ?? '';
    const next = confirmPendingChoice(pending, optionId);

    expect(next.player.stats.coin).toBe(50);
    expect(next.inventory).toHaveLength(0);
    expect(next.pendingChoice).toBeUndefined();
  });

  it('adds martial item and removes the choice item when selecting 외공서', () => {
    const item = { ...makeItem('외공서/내공서 선택권'), type: 'choice' as const, choices: ['외공서', '내공서'] };
    const pending = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);
    const optionId = pending.pendingChoice?.options[0]?.id ?? '';
    const next = confirmPendingChoice(pending, optionId);

    expect(next.inventory).toHaveLength(1);
    expect(next.inventory[0].name).toBe('외공서');
    expect(next.inventory[0].type).toBe('martial');
  });

  it('adds selected trait to player stats', () => {
    const item = { ...makeItem('묘리 선택권'), type: 'choice' as const, choices: ['모델링'] };
    const pending = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);
    const next = confirmPendingChoice(pending, pending.pendingChoice?.options[0]?.id ?? '');

    expect(next.player.stats.traits).toContain('모델링');
    expect(next.inventory).toHaveLength(0);
    expect(next.pendingChoice).toBeUndefined();
  });

  it('does not duplicate already owned traits', () => {
    const item = { ...makeItem('묘리 선택권'), type: 'choice' as const, choices: ['모델링'] };
    const state = {
      ...maintenanceState(),
      player: { ...maintenanceState().player, stats: { ...maintenanceState().player.stats, traits: ['모델링'] } },
      inventory: [item]
    };
    const pending = useInventoryItem(state, item.id);
    const next = confirmPendingChoice(pending, pending.pendingChoice?.options[0]?.id ?? '');

    expect(next.player.stats.traits).toEqual(['모델링']);
    expect(next.inventory).toHaveLength(1);
    expect(next.pendingChoice).toEqual(pending.pendingChoice);
    expect(next.log.at(-1)?.message).toBe('이미 보유한 특성입니다. 다른 선택지를 고르세요.');
  });

  it('blocks 중급 정령 without 하급 정령', () => {
    const item = { ...makeItem('정령 선택권'), type: 'choice' as const, choices: ['중급 정령'] };
    const pending = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);
    const next = confirmPendingChoice(pending, pending.pendingChoice?.options[0]?.id ?? '');

    expect(next.inventory).toHaveLength(1);
    expect(next.pendingChoice).toEqual(pending.pendingChoice);
    expect(next.player.stats.traits).not.toContain('중급 정령');
  });

  it('blocks 상급 정령 without 중급 정령', () => {
    const item = { ...makeItem('정령 선택권'), type: 'choice' as const, choices: ['상급 정령'] };
    const pending = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);
    const next = confirmPendingChoice(pending, pending.pendingChoice?.options[0]?.id ?? '');

    expect(next.inventory).toHaveLength(1);
    expect(next.pendingChoice).toEqual(pending.pendingChoice);
    expect(next.player.stats.traits).not.toContain('상급 정령');
  });

  it('blocks 정령왕 without all lower spirits', () => {
    const item = { ...makeItem('정령 선택권'), type: 'choice' as const, choices: ['정령왕'] };
    const pending = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);
    const next = confirmPendingChoice(pending, pending.pendingChoice?.options[0]?.id ?? '');

    expect(next.inventory).toHaveLength(1);
    expect(next.pendingChoice).toEqual(pending.pendingChoice);
    expect(next.player.stats.traits).not.toContain('정령왕');
  });

  it('round-trips saveVersion 18 state with pendingChoice', () => {
    vi.stubGlobal('localStorage', createLocalStorage());
    const item = makeItem('기초 마법서 선택권');
    const pending = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);

    expect(saveGameStub(pending)).toContain('saveVersion 18');
    expect(loadGameStub().pendingChoice).toMatchObject({
      kind: 'magicTicketSelect',
      sourceItemName: '기초 마법서 선택권'
    });

    vi.unstubAllGlobals();
  });
});
