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

  it('records choiceItem selection without applying invented effects', () => {
    const item = {
      ...makeItem('테스트 선택권'),
      type: 'choice' as const,
      choices: ['외공서', '검기']
    };
    const pending = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);
    const optionId = pending.pendingChoice?.options[0]?.id ?? '';
    const next = confirmPendingChoice(pending, optionId);

    expect(next.inventory).toHaveLength(1);
    expect(next.spells).toHaveLength(0);
    expect(next.pendingChoice).toBeUndefined();
    expect(next.log.at(-1)?.message).toContain('실제 효과는 원본 규칙 확인 후 구현 예정입니다.');
  });

  it('round-trips saveVersion 11 state with pendingChoice', () => {
    vi.stubGlobal('localStorage', createLocalStorage());
    const item = makeItem('기초 마법서 선택권');
    const pending = useInventoryItem({ ...maintenanceState(), inventory: [item] }, item.id);

    expect(saveGameStub(pending)).toContain('saveVersion 11');
    expect(loadGameStub().pendingChoice).toMatchObject({
      kind: 'magicTicketSelect',
      sourceItemName: '기초 마법서 선택권'
    });

    vi.unstubAllGlobals();
  });
});
