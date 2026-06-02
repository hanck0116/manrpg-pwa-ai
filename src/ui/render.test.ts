import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bindUI, applyStateWithAutoNarration, render } from './render';
import { createInitialGameState, type GameState } from '../state/gameState';
import { createPlayerSkill } from '../rules/skill';
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
    },
    querySelector: () => null
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
    expect(root.innerHTML).toContain('보유 기술');
    expect(root.innerHTML).toContain('보유 스킬');
    expect(root.innerHTML).not.toContain('기술 제작</summary>');
    expect(root.innerHTML).not.toContain('스킬 생성');
    expect(root.innerHTML).toContain('보유 마법');
    expect(root.innerHTML).toContain('숨은 적의 기척');
    expect(root.innerHTML).not.toContain(state.enemy.name);
    expect(root.innerHTML).not.toContain('적 간단 시트');
    expect(root.innerHTML).not.toContain(`<dd>${state.enemy.hp} / ${state.enemy.derived.maxHP}</dd>`);

    await getClickHandler()({ target: new TestButton({ tab: 'maintenance' }) });
    expect(root.innerHTML).toContain('장비');
    expect(root.innerHTML).toContain('정비용 인벤토리');
    expect(root.innerHTML).toContain('저장/불러오기');

    await getClickHandler()({ target: new TestButton({ tab: 'trial' }) });
    expect(root.innerHTML).toContain('기본 공격값으로 시련 적용');
    expect(root.innerHTML).toContain('data-angel-manual-score');

    await getClickHandler()({ target: new TestButton({ tab: 'sheet' }) });
    expect(root.innerHTML).toContain('기술 제작');
    expect(root.innerHTML).toContain('사용 가능한 기술 제작 출처가 없어 제작할 수 없습니다.');
    expect(root.innerHTML).toContain('스킬 생성');

    await getClickHandler()({ target: new TestButton({ tab: 'ai' }) });
    expect(root.innerHTML).toContain('<details class="panel ai-settings" open>');
    vi.unstubAllGlobals();
  });
});

describe('technique UI', () => {
  it('shows usable source in sheet creation UI', async () => {
    class TestButton {
      dataset: Record<string, string>;
      constructor(dataset: Record<string, string>) {
        this.dataset = dataset;
      }
    }
    vi.stubGlobal('HTMLButtonElement', TestButton);
    const { root, getClickHandler } = makeRoot();
    let state = { ...createInitialGameState(), techniqueSources: ['공법'] };
    const setState = (next: GameState): void => {
      state = next;
      render(root, state);
    };

    render(root, state);
    bindUI(root, () => state, setState);
    await getClickHandler()({ target: new TestButton({ tab: 'sheet' }) });

    expect(root.innerHTML).toContain('보유 기술');
    expect(root.innerHTML).toContain('<option value=\"공법\">공법</option>');
    vi.unstubAllGlobals();
  });
});


describe('reaction skill UI', () => {
  it('shows reaction skill buttons during player reaction', async () => {
    class TestButton {
      dataset: Record<string, string>;
      constructor(dataset: Record<string, string>) {
        this.dataset = dataset;
      }
    }
    vi.stubGlobal('HTMLButtonElement', TestButton);
    const { root, getClickHandler } = makeRoot();
    const skill = createPlayerSkill({ name: '반응기', resourceType: 'none', timing: 'reaction', effectType: 'damage', multiplier: 1 });
    let state: GameState = {
      ...createInitialGameState(),
      setupMode: false,
      phase: 'player-reaction' as const,
      pendingReaction: { against: 'player' as const, attackLog: '적 공격', damage: 1 },
      skills: [skill]
    };
    const setState = (next: GameState): void => {
      state = next;
      render(root, state);
    };

    render(root, state);
    bindUI(root, () => state, setState);
    await getClickHandler()({ target: new TestButton({ tab: 'battle' }) });

    expect(root.innerHTML).toContain('data-reaction-skill');
    expect(root.innerHTML).toContain('반응기');
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

  it('passes pending amplification to narration and consumes it only after successful AI narration', async () => {
    setAISettings({ enabled: true });
    const base = createInitialGameState();
    const state: GameState = {
      ...base,
      halo: {
        ...base.halo,
        selectedKind: 'amplification',
        pendingAmplification: { description: '검격', createdTurn: base.turn, consumeOnNextNarration: true }
      }
    };
    const applied: GameState[] = [];

    await applyStateWithAutoNarration(state, '증폭 테스트', (next) => applied.push(next));

    expect(callLLM).toHaveBeenCalledWith('narrate', expect.objectContaining({
      halo: expect.objectContaining({
        selectedKind: 'amplification',
        pendingAmplification: expect.objectContaining({
          description: '검격',
          instruction: expect.stringContaining('묘사를 무한히 증폭')
        })
      })
    }));
    expect(applied.at(-1)?.halo.pendingAmplification).toBeUndefined();
    expect(applied.at(-1)?.log.map((entry) => entry.message)).toContain('증폭 묘사가 AI GM 서술에 반영되었습니다.');
  });

  it('keeps pending amplification when automatic narration is disabled or fails', async () => {
    const base = createInitialGameState();
    const state: GameState = {
      ...base,
      halo: {
        ...base.halo,
        pendingAmplification: { description: '검격', createdTurn: base.turn, consumeOnNextNarration: true }
      }
    };
    const disabledApplied: GameState[] = [];
    setAISettings({ enabled: false });

    await applyStateWithAutoNarration(state, '비활성 테스트', (next) => disabledApplied.push(next));

    expect(callLLM).not.toHaveBeenCalled();
    expect(disabledApplied.at(-1)?.halo.pendingAmplification).toBeDefined();
    expect(disabledApplied.at(-1)?.log.at(-1)?.message).toBe('AI 자동 GM 서술이 꺼져 있어 증폭 묘사는 대기 중입니다.');

    vi.clearAllMocks();
    vi.mocked(callLLM).mockRejectedValueOnce(new Error('network'));
    const failedApplied: GameState[] = [];
    setAISettings({ enabled: true });

    await applyStateWithAutoNarration(state, '실패 테스트', (next) => failedApplied.push(next));

    expect(failedApplied.at(-1)?.halo.pendingAmplification).toBeDefined();
    expect(failedApplied.at(-1)?.log.at(-1)?.message).toContain('AI 자동 GM 서술 실패');
  });


  it('manual AI narration consumes pending amplification on success and keeps it on failure', async () => {
    class TestButton {
      dataset: Record<string, string>;
      constructor(dataset: Record<string, string>) {
        this.dataset = dataset;
      }
    }
    vi.stubGlobal('HTMLButtonElement', TestButton);
    setAISettings({ enabled: false });
    const { root, getClickHandler } = makeRoot();
    const base = createInitialGameState();
    let state: GameState = {
      ...base,
      halo: {
        ...base.halo,
        pendingAmplification: { description: '수동 검격', createdTurn: base.turn, consumeOnNextNarration: true }
      }
    };
    const setState = (next: GameState): void => {
      state = next;
    };

    bindUI(root, () => state, setState);
    await getClickHandler()({ target: new TestButton({ aiNarrate: '' }) });

    expect(callLLM).toHaveBeenCalledWith('narrate', expect.objectContaining({
      halo: expect.objectContaining({
        pendingAmplification: expect.objectContaining({ description: '수동 검격' })
      })
    }));
    expect(state.halo.pendingAmplification).toBeUndefined();
    expect(state.log.map((entry) => entry.message)).toContain('증폭 묘사가 AI GM 서술에 반영되었습니다.');

    vi.mocked(callLLM).mockRejectedValueOnce(new Error('network'));
    state = {
      ...base,
      halo: {
        ...base.halo,
        pendingAmplification: { description: '실패 검격', createdTurn: base.turn, consumeOnNextNarration: true }
      }
    };

    await getClickHandler()({ target: new TestButton({ aiNarrate: '' }) });

    expect(state.halo.pendingAmplification).toBeDefined();
    expect(state.log.at(-1)?.message).toBe('AI 호출 실패로 증폭 묘사가 대기 상태로 유지됩니다.');
    vi.unstubAllGlobals();
  });

});

describe('halo UI', () => {
  it('shows no-access message and nine halo selectors when halo is owned', async () => {
    class TestButton {
      dataset: Record<string, string>;
      constructor(dataset: Record<string, string>) {
        this.dataset = dataset;
      }
    }
    vi.stubGlobal('HTMLButtonElement', TestButton);
    const { root, getClickHandler } = makeRoot();
    let state: GameState = createInitialGameState();
    const setState = (next: GameState): void => {
      state = next;
      render(root, state);
    };

    render(root, state);
    expect(root.innerHTML).toContain('헤일로를 보유하지 않았습니다.');

    state = {
      ...state,
      setupMode: false,
      phase: 'floor-cleared',
      player: { ...state.player, stats: { ...state.player.stats, traits: ['헤일로'] } }
    };
    render(root, state);
    bindUI(root, () => state, setState);
    await getClickHandler()({ target: new TestButton({ tab: 'maintenance' }) });

    expect(root.innerHTML).toContain('data-select-halo-kind="amplification"');
    expect(root.innerHTML).toContain('data-select-halo-kind="satan"');
    expect(root.innerHTML).toContain('data-use-halo="birth"');
    expect(root.innerHTML).toContain('data-use-halo="fusion"');
    expect(root.innerHTML).toContain('data-use-halo="decomposition"');
    expect(root.innerHTML).toContain('증폭은 실제 수치를 바꾸지 않고, 다음 AI GM 묘사만 무한히 증폭합니다.');
    vi.unstubAllGlobals();
  });
});
