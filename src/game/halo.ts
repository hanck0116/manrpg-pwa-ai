import { makeItem } from '../rules/reward';
import { canUseHalo, getHaloLabel, markHaloUsedThisFloor } from '../rules/halo';
import { resolveJudgement } from '../rules/judgement';
import { appendLog, type GameState, type HaloKind, type PlayerTechnique, type RewardItem } from '../state/gameState';
import { refreshPlayer } from './characterUpdate';

const createId = (prefix: string): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? `${prefix}-${crypto.randomUUID()}` : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const pushHaloHistory = (state: GameState, message: string): GameState => ({
  ...state,
  halo: {
    ...state.halo,
    history: [...state.halo.history.slice(-49), message]
  }
});

const logHalo = (state: GameState, message: string): GameState => appendLog(pushHaloHistory(state, message), message);

export const selectHaloKind = (state: GameState, kind: HaloKind): GameState => {
  if (state.phase !== 'floor-cleared' && state.phase !== 'reward-pending' && state.phase !== 'level-up-pending' && state.phase !== 'battle-ended') {
    return appendLog(state, '헤일로 종류 선택은 정비 단계에서만 가능합니다.');
  }

  const selected = {
    ...state,
    halo: {
      ...state.halo,
      selectedKind: kind,
      satanActive: kind === 'satan',
      haloIgnoresOpponentHalo: kind === 'satan' ? true : undefined,
      haloIgnoresOpponentIbcheon: kind === 'satan' ? true : undefined
    }
  };

  return logHalo(refreshPlayer(selected), `${getHaloLabel(kind)} 헤일로를 선택했습니다.${kind === 'satan' ? ' 사탄 패시브가 활성화됩니다. 향후 적 입천/헤일로 대응용 무시 플래그를 기록했습니다.' : ''}`);
};

export const useHaloAmplification = (state: GameState, description = '다음 플레이어 행동'): GameState => {
  const check = canUseHalo(state, 'amplification');
  if (!check.ok) return appendLog(state, check.message);

  return logHalo(
    markHaloUsedThisFloor({
      ...state,
      halo: {
        ...state.halo,
        pendingAmplification: { description }
      }
    }, 'amplification'),
    `증폭: ${description}을(를) 무한히 증폭할 준비를 마쳤습니다.`
  );
};

export const applyPendingAmplificationToDamage = (state: GameState): GameState => {
  if (!state.halo.pendingAmplification) return state;

  return logHalo(
    {
      ...state,
      enemy: { ...state.enemy, hp: 0 },
      halo: { ...state.halo, pendingAmplification: undefined }
    },
    '증폭: 행동이 무한히 증폭되어 적을 압도했습니다.'
  );
};

export const applyPendingAmplificationToHeal = (state: GameState): GameState => {
  if (!state.halo.pendingAmplification) return state;

  return logHalo(
    {
      ...state,
      player: { ...state.player, hp: state.player.derived.maxHP, mp: state.player.derived.maxMP },
      halo: { ...state.halo, pendingAmplification: undefined }
    },
    '증폭: 회복 행동이 무한히 증폭되어 HP/MP가 최대치가 되었습니다.'
  );
};

export const noteAmplificationNotApplicable = (state: GameState): GameState =>
  state.halo.pendingAmplification ? appendLog(state, '증폭 적용 대상이 아닙니다. 증폭 대기는 유지됩니다.') : state;

export const useHaloExtinction = (state: GameState, targetText: string): GameState => {
  const check = canUseHalo(state, 'extinction');
  if (!check.ok) return appendLog(state, check.message);

  const target = targetText.trim();
  if (!target) return appendLog(state, '소멸 헤일로 대상 입력이 필요합니다.');
  if (/(플레이어|적|생명체|사람|인간|고블린|player|enemy|human|creature)/i.test(target)) {
    return appendLog(state, '소멸 헤일로는 인지를 가진 생명체, 플레이어, 적에게 사용할 수 없습니다.');
  }

  return logHalo(markHaloUsedThisFloor(state, 'extinction'), `소멸 처리됨: ${target}`);
};

export const useHaloBirth = (state: GameState, itemName: string): GameState => {
  const check = canUseHalo(state, 'birth');
  if (!check.ok) return appendLog(state, check.message);

  const name = itemName.trim();
  if (!name) return appendLog(state, '탄생 헤일로로 창조할 물건 이름이 필요합니다.');

  let item: RewardItem = makeItem(name);
  if (item.name !== name) {
    item = { id: createId('halo-birth'), name, type: 'item', itemName: name, sell: 0 };
  } else if (item.type === 'item' && item.itemName === undefined) {
    item = { ...item, itemName: name };
  }

  return logHalo(
    markHaloUsedThisFloor({ ...state, inventory: [...state.inventory, item] }, 'birth'),
    `탄생: ${name}을 창조했습니다.`
  );
};

export const useHaloFusion = (state: GameState, techniqueIdA: string, techniqueIdB: string): GameState => {
  const check = canUseHalo(state, 'fusion');
  if (!check.ok) return appendLog(state, check.message);
  if (!techniqueIdA || !techniqueIdB) return appendLog(state, '결합할 기술 2개를 선택해야 합니다.');
  if (techniqueIdA === techniqueIdB) return appendLog(state, '같은 기술 2개는 결합할 수 없습니다.');

  const a = state.techniques.find((technique) => technique.id === techniqueIdA);
  const b = state.techniques.find((technique) => technique.id === techniqueIdB);
  if (!a || !b) return appendLog(state, '결합할 기술을 찾을 수 없습니다.');

  const fused: PlayerTechnique = {
    id: createId('halo-fusion'),
    name: `${a.name}+${b.name}`,
    source: 'halo:fusion',
    kind: 'special',
    mpDelta: a.mpDelta + b.mpDelta,
    hpDelta: a.hpDelta + b.hpDelta,
    damageMultiplier: a.damageMultiplier + b.damageMultiplier,
    judgeStat: a.judgeStat !== 'none' ? a.judgeStat : b.judgeStat,
    judgeBonus: a.judgeBonus + b.judgeBonus,
    description: `헤일로 결합: ${a.name} + ${b.name}`
  };

  return logHalo(
    {
      ...state,
      techniques: [...state.techniques, fused],
      actionQueue: [...state.actionQueue, { id: createId('action'), type: 'technique', techniqueId: fused.id, label: `헤일로 결합: ${a.name} + ${b.name}` }]
    },
    `결합: ${a.name}과 ${b.name}을 결합해 1회성 기술 행동을 추가했습니다.`
  );
};

export const useHaloDecomposition = (state: GameState): GameState => {
  const check = canUseHalo(state, 'decomposition');
  if (!check.ok) return appendLog(state, check.message);
  if (!state.pendingReaction) return appendLog(state, '분해할 반응 대상이 없습니다.');

  const sourceType = state.pendingReaction.sourceType ?? 'basic';
  const incomingDamage = Math.max(0, state.pendingReaction.damage ?? 0);
  if (!['skill', 'technique', 'spell'].includes(sourceType)) {
    return logHalo(
      {
        ...state,
        pendingReaction: undefined,
        actionQueue: [],
        phase: 'player-main',
        turnOwner: 'player'
      },
      '분해할 기술이 없습니다. 반응 기회를 소모했습니다.'
    );
  }

  const judgement = resolveJudgement(state.player.stats, 'intelligence', 0);
  if (judgement.success) {
    return logHalo(
      {
        ...state,
        player: { ...state.player, mp: Math.min(state.player.derived.maxMP, state.player.mp + incomingDamage) },
        pendingReaction: undefined,
        actionQueue: [],
        phase: 'player-main',
        turnOwner: 'player'
      },
      `분해 성공: ${judgement.log}. 피해를 0으로 만들고 MP ${incomingDamage}을 흡수했습니다.`
    );
  }

  const nextHp = Math.max(0, state.player.hp - incomingDamage);
  return logHalo(
    {
      ...state,
      player: { ...state.player, hp: nextHp },
      pendingReaction: undefined,
      actionQueue: [],
      phase: nextHp <= 0 ? 'battle-ended' : 'player-main',
      turnOwner: nextHp <= 0 ? 'enemy' : 'player',
      battleResult: nextHp <= 0 ? 'lose' : state.battleResult
    },
    `분해 실패: ${judgement.log}. ${incomingDamage} 피해를 받았습니다.`
  );
};

export const useHaloExistence = (state: GameState, conceptText: string): GameState => {
  const check = canUseHalo(state, 'existence');
  if (!check.ok) return appendLog(state, check.message);
  const concept = conceptText.trim();
  if (!concept) return appendLog(state, '존재 헤일로로 이끌어낼 개념/대상이 필요합니다.');
  return logHalo(state, `존재: ${concept}의 존재를 이끌어냈습니다. 실제 수치 효과는 상황 판정에서 처리합니다.`);
};

export const useHaloAchievement = (state: GameState): GameState => {
  const check = canUseHalo(state, 'achievement');
  if (!check.ok) return appendLog(state, check.message);
  if (state.halo.observedSpells.length === 0) return logHalo(state, '성취: 아직 바라본 마법이 없습니다.');

  const known = new Set(state.spells.map((spell) => `${spell.name}:${spell.circle}`));
  const learned = state.halo.observedSpells.filter((spell) => !known.has(`${spell.name}:${spell.circle}`));
  return logHalo({ ...state, spells: [...state.spells, ...learned] }, `성취: 바라본 마법 ${learned.length}개를 습득했습니다.`);
};

export const useHaloDesire = (state: GameState, resultText: string, disabledTurns: number): GameState => {
  const check = canUseHalo(state, 'desire');
  if (!check.ok) return appendLog(state, check.message);
  const result = resultText.trim();
  if (!result) return appendLog(state, '욕망 헤일로로 끌어올 결과가 필요합니다.');
  const turns = Number.isFinite(disabledTurns) ? Math.max(0, Math.floor(disabledTurns)) : 0;

  return logHalo(
    {
      ...state,
      statuses: [
        ...state.statuses,
        { id: createId('desire-cost'), name: '욕망의 대가', target: 'player', durationTurns: turns, kind: 'control', note: result }
      ],
      halo: { ...state.halo, pendingDesire: { result, actionDisabledTurns: turns } }
    },
    `욕망: ${result}라는 결과를 끌어왔습니다. 대가로 ${turns}턴 행동 불능 상태가 됩니다.`
  );
};

export const hasActiveDesireCost = (state: GameState): boolean =>
  state.statuses.some((status) => status.target === 'player' && status.name === '욕망의 대가' && status.durationTurns > 0);

export const tickPlayerControlStatuses = (state: GameState): GameState => ({
  ...state,
  statuses: state.statuses
    .map((status) =>
      status.target === 'player' && status.kind === 'control' && status.durationTurns > 0
        ? { ...status, durationTurns: status.durationTurns - 1 }
        : status
    )
    .filter((status) => status.durationTurns > 0)
});
