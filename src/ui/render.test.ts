import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bindUI, applyStateWithAutoNarration, render } from './render';
import { createInitialGameState, type GameState } from '../state/gameState';
import { setAISettings } from '../ai/settings';

vi.mock('../ai/router', () => ({
  callLLM: vi.fn(async () => ({
    narration: 'AI 묘사',
    combat_log: ['AI 로그'],
    ui_tags: [],
    meta: { provider: 'groq', via: 'direct', fallback: false }
  }))
}));

const { callLLM } = await import('../ai/router');

type ClickHandler = (event: { target: unknown }) => void | Promise<void>;

const makeRoot = (): { root: HTMLElement; getClickHandler: () => ClickHandler } => {
  let clickHandler: ClickHandler = () => undefined;
  const root = {
    innerHTML: '',
    addEventListener: (type: string, handler: ClickHandler) => {
      if (type === 'click') clickHandler = handler;
    }
  } as unknown as HTMLElement;

  return { root, getClickHandler: () => clickHandler };
};

describe('tab UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAISettings({ enabled: false });
  });

  it('renders battle tab by default and switches tabs without storing activeTab in GameState', async () => {
    class TestButton {
      dataset: Record<string, string>;
      constructor(dataset: Record<string, string>) {
        this.dataset = dataset;
      }
    }
    vi.stubGlobal('HTMLButtonElement', TestButton);
    const { root, getClickHandler } = makeRoot();
    let state = createInitialGameState();
    const setState = (next: GameState): void => {
      state = next;
      render(root, state);
    };

    render(root, state);
    bindUI(root, () => state, setState);

    expect(root.innerHTML).toContain('data-tab="battle" class="active"');
    expect(root.innerHTML).toContain('11x11 고정 맵');
    expect(root.innerHTML).toContain('행동 추가');
    expect(root.innerHTML).toContain('보유 스킬');
    expect(root.innerHTML).toContain('보유 마법');
    expect(root.innerHTML).toContain('적 간단 시트');

    await getClickHandler()({ target: new TestButton({ tab: 'maintenance' }) });
    expect(root.innerHTML).toContain('장비');
    expect(root.innerHTML).toContain('정비용 인벤토리');
    expect(root.innerHTML).toContain('저장/불러오기');

    await getClickHandler()({ target: new TestButton({ tab: 'trial' }) });
    expect(root.innerHTML).toContain('천사의 시련은 다음 단계에서 구현 예정입니다.');
    vi.unstubAllGlobals();
  });
});

describe('automatic AI narration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call LLM when disabled', async () => {
    setAISettings({ enabled: false });
    const state = createInitialGameState();
    const setState = vi.fn();

    await applyStateWithAutoNarration(state, '테스트', setState);

    expect(callLLM).not.toHaveBeenCalled();
    expect(setState).toHaveBeenCalledTimes(1);
  });

  it('adds only AI logs while preserving rule state when enabled', async () => {
    setAISettings({ enabled: true });
    const base = createInitialGameState();
    const state = {
      ...base,
      player: { ...base.player, hp: 7, mp: 3, position: { x: 5, y: 9 } },
      enemy: { ...base.enemy, hp: 2, position: { x: 5, y: 1 } }
    };
    const applied: GameState[] = [];

    await applyStateWithAutoNarration(state, '테스트', (next) => applied.push(next));

    expect(callLLM).toHaveBeenCalledTimes(1);
    expect(applied).toHaveLength(2);
    expect(applied[1].player).toEqual(state.player);
    expect(applied[1].enemy).toEqual(state.enemy);
    expect(applied[1].log.map((entry) => entry.message)).toContain('AI 묘사');
    expect(applied[1].log.map((entry) => entry.message)).toContain('AI 로그');
  });
});
