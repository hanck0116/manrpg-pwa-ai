import { enqueueAction, removeQueuedAction } from '../game/actionQueue';
import { runAngelTrialWithAttack, runAngelTrialWithManualScore, resetAngelTrialClaims } from '../game/angelTrial';
import { cancelPendingChoice, confirmPendingChoice } from '../game/choiceFlow';
import { clearFloorRecovery, enterNextFloor } from '../game/floor';
import {
  clearSavedData,
  exportStateJson,
  fullRecoverPlayer,
  grantTestCoins,
  grantTestEquipment,
  grantTestRewards,
  grantTestSkill,
  grantTestSpell,
  resetAllProgress,
  setEnemyHpToOne
} from '../game/debugTools';
import { unequipItem } from '../game/equipment';
import {
  selectHaloKind,
  consumePendingAmplificationNarration,
  useHaloAchievement,
  useHaloAmplification,
  useHaloBirth,
  useHaloDecomposition,
  useHaloDesire,
  useHaloExistence,
  useHaloExtinction,
  useHaloFusion
} from '../game/halo';
import { getBattleUsableItems, sellInventoryItem, useInventoryItem } from '../game/inventory';
import { applyFiveLevelPlus, canFinishLevelAllocation, finishLevelAllocation } from '../game/levelUp';
import { resolvePlayerReaction, resolvePlayerReactionSkill } from '../game/reactionFlow';
import { createRewardOffer, claimSelectedRewards, toggleRewardSelection } from '../game/rewardFlow';
import { advanceTurn, createNewBattleFromPlayer } from '../game/turn';
import { fixedMap, MAP_SIZE } from '../map/fixedMap';
import { getMinimapSummary } from '../map/minimap';
import { getDirectionLabel } from '../game/movement';
import { loadGameStub, saveGameStub } from '../storage/save';
import { getAngelRewards, getUnclaimedAngelRewards } from '../rules/angelTrial';
import { HALO_KINDS, canUseHalo, getHaloDescription, getHaloLabel, hasHaloAccess } from '../rules/halo';
import { buyShopItem, canBuyShopItem, getShopItems } from '../rules/shop';
import { describeSpell } from '../rules/spell';
import { callLLM } from '../ai/router';
import { setAISettings, clearAIKeys, getAISettings, type AIProvider, type AISettings } from '../ai/settings';
import { clearAIUsage } from '../ai/usage';
import { addPlayerSkill } from '../game/skillBook';
import { addPlayerTechnique } from '../game/techniqueBook';
import { getEquipmentLabel } from '../rules/equipment';
import { summarizePassiveSkills } from '../rules/passiveSkill';
import {
  allocatableStatKeys,
  canDecreaseStat,
  canIncreaseStat,
  decreaseStat,
  finishSetup,
  increaseStat,
  resetStats,
  type AllocatableStatKey
} from '../game/statAllocation';
import type { Character, Direction, EquipmentSlot, GameState, HaloKind, QueuedAction, TechniqueJudgeStat, TechniqueKind } from '../state/gameState';

type AppTab = 'battle' | 'sheet' | 'maintenance' | 'trial' | 'ai' | 'log';
let activeTab: AppTab = 'battle';
import { appendLog } from '../state/gameState';
import { renderAISettings, setAIConnectionStatus, setAISettingsStatus } from './aiSettings';

const actionLabels: Record<QueuedAction['type'], string> = {
  move: '이동',
  'basic-attack': '기본 공격',
  skill: '스킬',
  spell: '마법',
  technique: '기술',
  item: '아이템',
  defend: '방어',
  wait: '대기'
};

const phaseLabels: Record<GameState['phase'], string> = {
  'player-main': '플레이어 메인턴',
  'player-reaction': '플레이어 반응턴',
  'enemy-main': '적 메인턴',
  'enemy-reaction': '적 반응턴',
  'floor-cleared': '층 클리어',
  'reward-pending': '보상 선택 대기',
  'level-up-pending': '레벨업 스탯 분배',
  'battle-ended': '전투 종료'
};

const statLabels: Record<AllocatableStatKey, string> = {
  strength: '힘',
  dexterity: '민첩',
  constitution: '체력',
  intelligence: '지능',
  wisdom: '지혜',
  appearance: '외모'
};

const directionLabels: Record<Direction, string> = {
  up: '↑ 위',
  down: '↓ 아래',
  left: '← 왼쪽',
  right: '→ 오른쪽'
};

const createActionId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

const createQueuedAction = (type: QueuedAction['type'], direction?: Direction, steps?: number): QueuedAction => ({
  id: createActionId(),
  type,
  label: type === 'move' ? `${getDirectionLabel(direction ?? 'up')}으로 ${steps ?? 1}칸 이동` : actionLabels[type],
  direction,
  steps
});

const createTechniqueAction = (techniqueId: string, techniqueName: string): QueuedAction => ({
  id: createActionId(),
  type: 'technique',
  techniqueId,
  label: `${techniqueName} 사용`
});

const createSkillAction = (skillId: string, skillName: string): QueuedAction => ({
  id: createActionId(),
  type: 'skill',
  skillId,
  label: `${skillName} 사용`
});

const appendAILogs = (state: GameState, narration: string, combatLog: string[] = []): GameState => {
  const withNarration = narration ? appendLog(state, narration) : state;
  return combatLog.reduce((nextState, log) => appendLog(nextState, log), withNarration);
};

const toErrorMessage = (error: unknown): string => (error instanceof Error && error.message ? error.message : '알 수 없는 오류');

const getInputValue = (root: HTMLElement, selector: string): string =>
  root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(selector)?.value.trim() ?? '';

const getChecked = (root: HTMLElement, selector: string): boolean =>
  root.querySelector<HTMLInputElement>(selector)?.checked ?? false;

const getSelectValue = (root: HTMLElement, selector: string): AIProvider =>
  (root.querySelector<HTMLSelectElement>(selector)?.value as AIProvider | undefined) ?? 'groq';

const collectAISettings = (root: HTMLElement): Partial<AISettings> => {
  const nextSettings: Partial<AISettings> = {
    enabled: getChecked(root, '[data-ai-enabled]'),
    useProxy: getChecked(root, '[data-ai-use-proxy]'),
    proxyUrl: getInputValue(root, '[data-ai-proxy-url]'),
    saveKeysOnDevice: getChecked(root, '[data-ai-save-keys]'),
    primaryProvider: getSelectValue(root, '[data-ai-primary-provider]'),
    secondaryProvider: getSelectValue(root, '[data-ai-secondary-provider]'),
    tertiaryProvider: getSelectValue(root, '[data-ai-tertiary-provider]'),
    groqModel: getInputValue(root, '[data-ai-groq-model]'),
    geminiModel: getInputValue(root, '[data-ai-gemini-model]'),
    openrouterModel: getInputValue(root, '[data-ai-openrouter-model]')
  };

  const groqKey = getInputValue(root, '[data-ai-groq-key]');
  const geminiKey = getInputValue(root, '[data-ai-gemini-key]');
  const openrouterKey = getInputValue(root, '[data-ai-openrouter-key]');

  if (groqKey) nextSettings.groqKey = groqKey;
  if (geminiKey) nextSettings.geminiKey = geminiKey;
  if (openrouterKey) nextSettings.openrouterKey = openrouterKey;

  return nextSettings;
};

const buildNarrationPayload = (state: GameState, reason = '수동 AI GM 묘사'): Record<string, unknown> => ({
  summary: state.log.slice(-8).map((entry) => entry.message),
  reason,
  phase: state.phase,
  floor: state.floor,
  turn: state.turn,
  player: {
    hp: state.player.hp,
    maxHP: state.player.derived.maxHP,
    mp: state.player.mp,
    maxMP: state.player.derived.maxMP,
    position: state.player.position
  },
  enemy: {
    hp: state.enemy.hp,
    maxHP: state.enemy.derived.maxHP,
    position: state.enemy.position
  },
  halo: {
    selectedKind: state.halo.selectedKind,
    pendingAmplification: state.halo.pendingAmplification
      ? {
          description: state.halo.pendingAmplification.description,
          instruction: '이번 행동의 묘사를 무한히 증폭하라. 단, HP/MP/피해/위치/보상/판정 결과는 절대 바꾸지 말고 이미 계산된 로컬 결과만 묘사하라.'
        }
      : undefined
  },
  localResult: '로컬 규칙 처리가 완료된 결과이며 AI는 묘사만 한다.'
});

const preserveRuleStateWithAILogs = (baseState: GameState, narration: string, combatLog: string[] = []): GameState => ({
  ...baseState,
  log: appendAILogs(baseState, narration, combatLog).log
});

export async function applyStateWithAutoNarration(
  nextState: GameState,
  reason: string,
  setState: (state: GameState) => void
): Promise<void> {
  setState(nextState);

  if (!getAISettings().enabled) {
    if (nextState.halo.pendingAmplification) {
      setState(appendLog(nextState, 'AI 자동 GM 서술이 꺼져 있어 증폭 묘사는 대기 중입니다.'));
    }
    return;
  }

  try {
    const response = await callLLM('narrate', buildNarrationPayload(nextState, reason));
    setAIConnectionStatus(
      response.meta?.fallback ? 'AI 자동 GM fallback 사용' : 'AI 자동 GM 묘사 생성 완료',
      response.meta?.fallback ?? response.ui_tags.includes('fallback'),
      response.meta
    );
    const ruleState = consumePendingAmplificationNarration(nextState);
    setState(preserveRuleStateWithAILogs(ruleState, response.narration, response.combat_log));
  } catch (error) {
    setAIConnectionStatus('AI 자동 GM 호출 실패', true);
    setState(appendLog(nextState, `AI 자동 GM 서술 실패: ${toErrorMessage(error)}. 로컬 규칙 결과는 유지됩니다.`));
  }
}

const renderCharacterCard = (character: Character): string => `
  <section class="panel character ${character.kind}">
    <h2>${character.kind === 'player' ? '플레이어 상태' : '적 상태'}</h2>
    <strong>${character.name}</strong>
    <dl>
      <div><dt>HP</dt><dd>${character.hp} / ${character.derived.maxHP}</dd></div>
      <div><dt>MP</dt><dd>${character.mp} / ${character.derived.maxMP}</dd></div>
      <div><dt>레벨</dt><dd>${character.stats.level}</dd></div>
      <div><dt>최종 공격력</dt><dd>${character.derived.attack}</dd></div>
      <div><dt>코인</dt><dd>${character.stats.coin}</dd></div>
      <div><dt>좌표</dt><dd>${character.position.x + 1}, ${character.position.y + 1}</dd></div>
    </dl>
    <details>
      <summary>상세 스탯</summary>
      <dl>
        <div><dt>힘</dt><dd>${character.stats.strength}</dd></div>
        <div><dt>민첩</dt><dd>${character.stats.dexterity}</dd></div>
        <div><dt>체력</dt><dd>${character.stats.constitution}</dd></div>
        <div><dt>지능</dt><dd>${character.stats.intelligence}</dd></div>
        <div><dt>지혜</dt><dd>${character.stats.wisdom}</dd></div>
        <div><dt>외모</dt><dd>${character.stats.appearance}</dd></div>
        <div><dt>남은 스탯 포인트</dt><dd>${character.derived.remainingStatPoint}</dd></div>
        <div><dt>최대 스탯</dt><dd>${character.derived.maxStat}</dd></div>
        <div><dt>외공</dt><dd>${character.stats.outerStack} (${character.derived.outerMultiplier.toFixed(2)}배)</dd></div>
        <div><dt>내공</dt><dd>${character.stats.innerStack} (${character.derived.innerMultiplier.toFixed(2)}배)</dd></div>
        <div><dt>검기</dt><dd>${character.derived.swordKiName}</dd></div>
        <div><dt>기본 공격력</dt><dd>${character.derived.basicAtk}</dd></div>
        <div><dt>멀티캐스팅</dt><dd>${character.derived.multi}</dd></div>
        <div><dt>MP 회복</dt><dd>${character.derived.mpRegen}</dd></div>
      </dl>
    </details>
  </section>
`;

const renderStatAllocationPanel = (state: GameState): string => {
  if (!state.setupMode) {
    return '';
  }

  return `
    <section class="panel stat-allocation">
      <details open>
        <summary>캐릭터 생성</summary>
        <p class="muted">총 스탯 60이 되도록 54포인트를 분배하세요.</p>
        <div class="setup-summary">
          <span>남은 포인트 <strong>${state.player.derived.remainingStatPoint}</strong></span>
          <span>최대 스탯 <strong>${state.player.derived.maxStat}</strong></span>
        </div>
        <div class="stat-controls">
          ${allocatableStatKeys
            .map(
              (statKey) => `
                <div class="stat-row">
                  <span>${statLabels[statKey]}</span>
                  <button type="button" data-stat-decrease="${statKey}" ${canDecreaseStat(state, statKey) ? '' : 'disabled'}>-</button>
                  <strong>${state.player.stats[statKey]}</strong>
                  <button type="button" data-stat-increase="${statKey}" ${canIncreaseStat(state, statKey) ? '' : 'disabled'}>+</button>
                </div>
              `
            )
            .join('')}
        </div>
        <div class="setup-actions">
          <button type="button" data-reset-stats>초기화</button>
          <button type="button" class="finish-button" data-finish-setup ${state.player.derived.remainingStatPoint === 0 ? '' : 'disabled'}>생성 완료</button>
        </div>
      </details>
    </section>
  `;
};

const renderLevelUpAllocationPanel = (state: GameState): string => {
  if (state.setupMode || state.phase !== 'level-up-pending') {
    return '';
  }

  return `
    <section class="panel stat-allocation level-up-allocation">
      <details open>
        <summary>레벨업 스탯 분배</summary>
        <p class="muted">보상 선택 후 다음 층에 진입하기 전에 레벨업으로 얻은 스탯 포인트를 모두 분배해야 합니다.</p>
        <div class="setup-summary">
          <span>현재 레벨 <strong>${state.player.stats.level}</strong></span>
          <span>남은 포인트 <strong>${state.player.derived.remainingStatPoint}</strong></span>
          <span>최대 스탯 <strong>${state.player.derived.maxStat}</strong></span>
        </div>
        <div class="stat-controls">
          ${allocatableStatKeys
            .map(
              (statKey) => `
                <div class="stat-row">
                  <span>${statLabels[statKey]}</span>
                  <button type="button" data-stat-decrease="${statKey}" ${canDecreaseStat(state, statKey) ? '' : 'disabled'}>-</button>
                  <strong>${state.player.stats[statKey]}</strong>
                  <button type="button" data-stat-increase="${statKey}" ${canIncreaseStat(state, statKey) ? '' : 'disabled'}>+</button>
                </div>
              `
            )
            .join('')}
        </div>
        <div class="setup-actions">
          <button type="button" class="finish-button" data-finish-level-allocation ${canFinishLevelAllocation(state) ? '' : 'disabled'}>레벨업 분배 완료</button>
        </div>
      </details>
    </section>
  `;
};

const renderMap = (state: GameState): string => `
  <section class="panel map-panel" aria-label="11x11 고정 맵">
    <h2>11x11 고정 맵</h2>
    <div class="map-grid" style="--map-size: ${MAP_SIZE}">
      ${fixedMap
        .map((tile) => {
          const hasPlayer = state.player.position.x === tile.x && state.player.position.y === tile.y && state.player.hp > 0;
          const hasEnemy = state.enemy.position.x === tile.x && state.enemy.position.y === tile.y && state.enemy.hp > 0;
          const label = hasPlayer ? 'P' : hasEnemy ? 'E' : tile.type === 'wall' ? '■' : '·';
          const classes = ['tile', tile.type, hasPlayer ? 'has-player' : '', hasEnemy ? 'has-enemy' : ''].join(' ');

          return `<div class="${classes}" aria-label="${tile.x + 1},${tile.y + 1}">${label}</div>`;
        })
        .join('')}
    </div>
  </section>
`;

const renderLog = (state: GameState): string => `
  <section class="panel log-panel">
    <h2>전투 로그</h2>
    <p class="muted">AI는 묘사만 생성하며 HP/MP/판정 결과를 바꾸지 않습니다.</p>
    <button type="button" data-ai-narrate>AI GM 묘사 생성</button>
    <ol>
      ${state.log.slice(-20).map((entry) => `<li><span>턴 ${entry.turn}</span>${entry.message}</li>`).join('')}
    </ol>
  </section>
`;

const renderDebugPanel = (): string => `
  <details class="panel debug-panel">
    <summary>실험/디버그</summary>
    <p class="muted">이 패널은 모바일 실험과 버그 재현을 위한 테스트 편의 기능입니다. 원본 규칙 보상이나 전투 판정이 아니며, 기본 전투 흐름에 자동 개입하지 않습니다.</p>
    <div class="debug-grid">
      <button type="button" data-debug-action="clear-save">저장 데이터 초기화</button>
      <button type="button" data-debug-action="reset-all">새 캐릭터로 완전 초기화</button>
      <button type="button" data-debug-action="copy-json">현재 상태 JSON 복사</button>
      <button type="button" data-debug-action="coins">테스트용 코인 +50</button>
      <button type="button" data-debug-action="rewards">테스트용 보상 아이템 지급</button>
      <button type="button" data-debug-action="spell">테스트용 마법 지급</button>
      <button type="button" data-debug-action="skill">테스트용 스킬 지급</button>
      <button type="button" data-debug-action="equipment">테스트용 장비 지급</button>
      <button type="button" data-debug-action="enemy-hp-one">적 HP 1로 만들기</button>
      <button type="button" data-debug-action="recover">플레이어 HP/MP 최대 회복</button>
    </div>
  </details>
`;

const renderTurnStatus = (state: GameState): string => `
  <section class="panel turn-status">
    <h2>턴 상태</h2>
    <p>현재 층: <strong>${state.floor}층</strong></p>
    <p>현재 phase: <strong>${phaseLabels[state.phase]}</strong></p>
    <p>현재 turnOwner: <strong>${state.turnOwner === 'player' ? '플레이어' : '적'}</strong></p>
    <p>선공: <strong>${state.initiative === 'player' ? '플레이어' : '적'}</strong></p>
    ${state.phase === 'floor-cleared' ? '<p class="muted">적이 쓰러졌습니다. 정비 단계로 이동할 수 있습니다.</p>' : ''}
    ${state.battleResult ? `<p>결과: <strong>${state.battleResult === 'win' ? '승리' : '패배'}</strong></p>` : ''}
  </section>
`;


const describeReward = (reward: GameState['inventory'][number]): string => {
  if (reward.type === 'coin') return `${reward.name} (${reward.coin ?? 0}코인)`;
  if (reward.grade) return `${reward.name} / ${reward.grade} / 판매가 ${reward.sell ?? 0}코인`;
  return `${reward.name} / 판매가 ${reward.sell ?? 0}코인`;
};

const renderFloorClearPanel = (state: GameState): string => {
  if (state.phase !== 'floor-cleared') {
    return '';
  }

  return `
    <section class="panel floor-clear-panel">
      <h2>층 클리어</h2>
      <p class="muted">회복/정비 후 외모 기준 보상 후보를 생성합니다. 자동 코인 +1은 없습니다.</p>
      <button type="button" class="finish-button" data-clear-floor>층 클리어 회복/정비</button>
    </section>
  `;
};

const renderRewardPanel = (state: GameState): string => {
  if (state.phase !== 'reward-pending') {
    return '';
  }

  const rewardState = state.rewardState;

  if (!rewardState) {
    return `
      <section class="panel reward-panel">
        <h2>보상 선택</h2>
        <p class="muted">보상 후보가 없습니다.</p>
        <button type="button" data-create-reward-offer>보상 후보 생성</button>
      </section>
    `;
  }

  return `
    <section class="panel reward-panel">
      <h2>보상 선택</h2>
      <p>후보 ${rewardState.offerCount}개 중 ${rewardState.pickCount}개 선택 · 현재 ${rewardState.selectedIds.length}개 선택</p>
      <div class="reward-list">
        ${rewardState.offered
          .map((reward) => {
            const selected = rewardState.selectedIds.includes(reward.id);
            return `
              <div class="reward-row ${selected ? 'selected' : ''}">
                <span>${describeReward(reward)}</span>
                <button type="button" data-toggle-reward="${reward.id}" ${rewardState.claimed ? 'disabled' : ''}>${selected ? '해제' : '선택'}</button>
              </div>
            `;
          })
          .join('')}
      </div>
      <button type="button" class="finish-button" data-claim-rewards ${rewardState.claimed ? 'disabled' : ''}>보상 확정</button>
      ${rewardState.claimed && !state.levelUpPending ? '<button type="button" class="finish-button" data-enter-next-floor>다음 층 진입</button>' : ''}
    </section>
  `;
};

const renderInventorySummary = (state: GameState): string => {
  const maintenanceDisabled = ['reward-pending', 'level-up-pending', 'floor-cleared', 'battle-ended'].includes(state.phase) ? '' : 'disabled';

  return `
    <section class="panel inventory-panel">
      <details>
        <summary>정비용 인벤토리 (${state.inventory.length})</summary>
        <p class="muted">아이템 사용/판매와 장비 착용은 정비 단계에서만 가능합니다. 전투 중 장비 변경은 불가능합니다.</p>
        <p class="muted">이번 층 마법서 무료 시도: ${state.magicBookAttempt.floor === state.floor && state.magicBookAttempt.freeUsed ? '사용 완료, 이후 1회 1코인' : '사용 가능'}</p>
        ${
          state.inventory.length === 0
            ? '<p class="muted">보유 아이템이 없습니다.</p>'
            : `<ul class="inventory-list">${state.inventory
                .map(
                  (item) => `
                    <li>
                      <span>${item.equipment ? getEquipmentLabel(item.equipment) : `${item.name}${item.grade ? ` / ${item.grade}` : ''}`} · 판매가 ${item.sell ?? 0}코인</span>
                      <span class="inline-actions">
                        <button type="button" data-use-item="${item.id}" ${maintenanceDisabled}>${item.equipment ? '착용' : '사용'}</button>
                        <button type="button" data-sell-item="${item.id}" ${maintenanceDisabled}>판매</button>
                      </span>
                    </li>
                  `
                )
                .join('')}</ul>`
        }
      </details>
    </section>
  `;
};

const renderEquipmentPanel = (state: GameState): string => {
  const maintenanceDisabled = ['reward-pending', 'level-up-pending', 'floor-cleared', 'battle-ended'].includes(state.phase) ? '' : 'disabled';
  const slots: { slot: EquipmentSlot; label: string }[] = [
    { slot: 'weapon', label: '무기' },
    { slot: 'armor', label: '방어구' },
    { slot: 'accessory', label: '장신구' }
  ];

  return `
    <section class="panel equipment-panel">
      <details>
        <summary>장비</summary>
        <p class="muted">장비 착용/해제는 정비 단계에서만 가능합니다. 테스트용 장비는 디버그 편의 기능입니다.</p>
        <ul class="inventory-list">
          ${slots
            .map(({ slot, label }) => {
              const item = state.equipment[slot];
              return `
                <li>
                  <span>${label}: ${item ? getEquipmentLabel(item) : '비어 있음'}</span>
                  <button type="button" data-unequip-slot="${slot}" ${item && !maintenanceDisabled ? '' : 'disabled'}>해제</button>
                </li>
              `;
            })
            .join('')}
        </ul>
      </details>
    </section>
  `;
};

const renderShopPanel = (state: GameState): string => {
  const shopEnabled = ['floor-cleared', 'reward-pending', 'level-up-pending', 'battle-ended'].includes(state.phase);

  if (!shopEnabled) {
    return '';
  }

  return `
    <section class="panel shop-panel">
      <details>
        <summary>상점</summary>
        <div class="shop-list">
          ${getShopItems()
            .map(
              (item) => `
                <div class="reward-row">
                  <span>${item.name} / 가격 ${item.price}코인${item.grade ? ` / ${item.grade}` : ''}</span>
                  <button type="button" data-buy-shop-item="${item.id}" ${canBuyShopItem(state, item.id) ? '' : 'disabled'}>구매</button>
                </div>
              `
            )
            .join('')}
        </div>
      </details>
    </section>
  `;
};

const renderPendingChoicePanel = (state: GameState): string => {
  if (!state.pendingChoice) {
    return '';
  }

  const guidance =
    state.pendingChoice.kind === 'magicTicketSelect'
      ? '획득할 마법을 선택하세요.'
      : '명확한 원본 선택권 효과는 즉시 적용하고, 불명확한 효과는 아이템화합니다.';

  return `
    <section class="panel pending-choice-panel">
      <h2>선택권 사용</h2>
      <p><strong>${state.pendingChoice.sourceItemName}</strong></p>
      <p class="muted">${guidance}</p>
      <div class="choice-option-list">
        ${state.pendingChoice.options
          .map(
            (option) => `
              <div class="reward-row">
                <span>${option.label}</span>
                <button type="button" data-confirm-choice="${option.id}">선택</button>
              </div>
            `
          )
          .join('')}
      </div>
      <button type="button" data-cancel-choice>취소</button>
    </section>
  `;
};

const renderKnownSpells = (state: GameState): string => `
  <section class="panel spells-panel">
    <details>
      <summary>보유 마법 (${state.spells.length})</summary>
      ${
        state.spells.length === 0
          ? '<p class="muted">습득한 마법이 없습니다.</p>'
          : `<ul class="inventory-list">${state.spells
              .map((spell) => {
                const description = describeSpell(spell.name, spell.circle);
                const disabled = state.phase === 'player-main' && !state.setupMode && !state.levelUpPending ? '' : 'disabled';

                return `
                  <li>
                    <span>${spell.name} / ${spell.circle}서클 / ${spell.grade} / ${description.rangeText} / MP ${description.manaCost} / 위력 ${description.power}</span>
                    <button type="button" data-add-spell="${spell.id}" ${disabled}>큐에 추가</button>
                  </li>
                `;
              })
              .join('')}</ul>`
      }
    </details>
  </section>
`;

const renderKnownSkillsForBattle = (state: GameState): string => {
  const canQueueSkill = state.phase === 'player-main' && !state.setupMode && !state.levelUpPending;
  const usableSkills = state.skills.filter((skill) => skill.timing === 'main');

  return `
    <section class="panel skills-panel">
      <details>
        <summary>보유 스킬 (${state.skills.length})</summary>
        ${
          usableSkills.length === 0
            ? '<p class="muted">전투 메인턴에 사용할 수 있는 보유 스킬이 없습니다.</p>'
            : `<ul class="inventory-list">${state.skills
                .map(
                  (skill) => `
                    <li>
                      <span>${skill.name} / ${skill.resourceType} / ${skill.timing} / ${skill.effectType} / ${skill.multiplier}배</span>
                      <button type="button" data-add-skill="${skill.id}" ${canQueueSkill && skill.timing === 'main' ? '' : 'disabled'}>큐에 추가</button>
                    </li>
                  `
                )
                .join('')}</ul>`
        }
      </details>
    </section>
  `;
};

const renderSkillManagement = (state: GameState): string => {
  const canQueueSkill = state.phase === 'player-main' && !state.setupMode && !state.levelUpPending;
  const canCreate = ['floor-cleared', 'reward-pending', 'level-up-pending', 'battle-ended'].includes(state.phase);

  return `
    <section class="panel skills-panel">
      <details>
        <summary>보유 스킬 (${state.skills.length})</summary>
        ${
          state.skills.length === 0
            ? '<p class="muted">보유 스킬이 없습니다.</p>'
            : `<ul class="inventory-list">${state.skills
                .map(
                  (skill) => `
                    <li>
                      <span>${skill.name} / ${skill.resourceType} / ${skill.timing} / ${skill.effectType} / ${skill.multiplier}배</span>
                      <button type="button" data-add-skill="${skill.id}" ${canQueueSkill && skill.timing === 'main' ? '' : 'disabled'}>큐에 추가</button>
                    </li>
                  `
                )
                .join('')}</ul>`
        }
      </details>
      <details>
        <summary>스킬 생성</summary>
        <p class="muted">원본 시트지 기반의 최소 스킬 구조입니다. 상태이상/소환/광역 효과는 만들지 않습니다.</p>
        <label>스킬 이름 <input type="text" data-skill-name placeholder="스킬 이름" /></label>
        <label>자원 유형
          <select data-skill-resource>
            <option value="outer">외공</option>
            <option value="inner">내공</option>
            <option value="sword">검기</option>
            <option value="magic">마법</option>
            <option value="none">없음</option>
          </select>
        </label>
        <label>효과 유형
          <select data-skill-effect>
            <option value="damage">피해</option>
            <option value="heal">회복</option>
            <option value="guard">방어</option>
            <option value="todo">TODO</option>
          </select>
        </label>
        <label>배율 <input type="number" min="0.1" step="0.1" data-skill-multiplier value="1" /></label>
        <label>스킬 유형 <select data-skill-kind>${kindOptions(true)}</select></label>
        <label>사용 타이밍
          <select data-skill-timing>
            <option value="main">메인턴</option>
            <option value="reaction">반응턴</option>
            <option value="passive">패시브</option>
          </select>
        </label>
        <label>MP 변화량 <input type="number" step="1" data-skill-mp-delta value="0" /></label>
        <label>HP 변화량 <input type="number" step="1" data-skill-hp-delta value="0" /></label>
        <label>공격 피해 배수 <input type="number" min="0" step="0.1" data-skill-damage-multiplier value="0" /></label>
        <label>판정 스탯 <select data-skill-judge-stat>${judgeStatOptions()}</select></label>
        <label>판정 보정 <input type="number" step="1" data-skill-judge-bonus value="0" /></label>
        <label>패시브 스탯 <select data-skill-passive-stat>${judgeStatOptions('strength').replace('<option value=\"none\" >없음</option>', '')}</select></label>
        <label>패시브 값 <input type="number" step="1" data-skill-passive-value value="0" /></label>
        <label>설명 <textarea rows="2" data-skill-description placeholder="원본 확인용 설명"></textarea></label>
        <button type="button" data-create-skill ${canCreate ? '' : 'disabled'}>스킬 생성</button>
      </details>
    </section>
  `;
};


const judgeStatOptions = (selected: string = 'none'): string =>
  [
    ['none', '없음'],
    ['strength', '힘'],
    ['dexterity', '민첩'],
    ['constitution', '체력'],
    ['intelligence', '지능'],
    ['wisdom', '지혜'],
    ['appearance', '외모']
  ]
    .map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`)
    .join('');

const kindOptions = (includePassive = false): string =>
  [
    ['attack', '공격'],
    ['defense', '방어'],
    ['heal', '회복'],
    ['buff', '버프'],
    ['debuff', '디버프'],
    ['move', '이동'],
    ['special', '특수'],
    ...(includePassive ? [['passive', '패시브']] : [])
  ]
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');

const renderKnownTechniquesForBattle = (state: GameState): string => {
  const canQueueTechnique = state.phase === 'player-main' && !state.setupMode && !state.levelUpPending;
  const usableTechniques = state.techniques;

  return `
    <section class="panel techniques-panel">
      <details>
        <summary>보유 기술 (${state.techniques.length})</summary>
        ${
          usableTechniques.length === 0
            ? '<p class="muted">전투 메인턴에 사용할 수 있는 보유 기술이 없습니다.</p>'
            : `<ul class="inventory-list">${state.techniques
                .map(
                  (technique) => `
                    <li>
                      <span>${technique.name} / ${technique.source} / ${technique.kind} / MP ${technique.mpDelta} / HP ${technique.hpDelta} / 피해 ${technique.damageMultiplier}배</span>
                      <button type="button" data-add-technique="${technique.id}" ${canQueueTechnique ? '' : 'disabled'}>큐에 추가</button>
                    </li>
                  `
                )
                .join('')}</ul>`
        }
      </details>
    </section>
  `;
};

const renderTechniqueManagement = (state: GameState): string => {
  const canCreate = ['floor-cleared', 'reward-pending', 'level-up-pending', 'battle-ended'].includes(state.phase);
  const unusedSources = state.techniqueSources.filter((source) => !state.techniques.some((technique) => technique.source === source));

  return `
    <section class="panel techniques-panel">
      <details>
        <summary>기술 제작 출처 (${state.techniqueSources.length})</summary>
        ${state.techniqueSources.length === 0 ? '<p class="muted">해금된 기술 제작 출처가 없습니다. 공법/무공/오리지널 스킬/유물 등 출처 아이템을 사용하거나 선택권에서 고르세요.</p>' : `<p>${state.techniqueSources.join(', ')}</p>`}
      </details>
      <details>
        <summary>보유 기술 (${state.techniques.length})</summary>
        ${
          state.techniques.length === 0
            ? '<p class="muted">보유 기술이 없습니다.</p>'
            : `<ul class="inventory-list">${state.techniques
                .map((technique) => `<li><span>${technique.name} / ${technique.source} / ${technique.kind} / MP ${technique.mpDelta} / HP ${technique.hpDelta} / 피해 ${technique.damageMultiplier}배</span></li>`)
                .join('')}</ul>`
        }
      </details>
      <details>
        <summary>기술 제작</summary>
        <p class="muted">해금된 출처 1개당 기술 1개만 제작합니다. 상태이상/소환/광역 효과는 실제 효과가 아니라 설명에만 남깁니다.</p>
        ${unusedSources.length === 0 ? '<p class="muted">사용 가능한 기술 제작 출처가 없어 제작할 수 없습니다.</p>' : ''}
        <label>출처
          <select data-technique-source>
            ${unusedSources.map((source) => `<option value="${source}">${source}</option>`).join('')}
          </select>
        </label>
        <label>기술 이름 <input type="text" data-technique-name placeholder="기술 이름" /></label>
        <label>유형 <select data-technique-kind>${kindOptions(false)}</select></label>
        <label>MP 변화량 <input type="number" step="1" data-technique-mp-delta value="0" /></label>
        <label>HP 변화량 <input type="number" step="1" data-technique-hp-delta value="0" /></label>
        <label>공격 피해 배수 <input type="number" min="0" step="0.1" data-technique-damage-multiplier value="0" /></label>
        <label>판정 스탯 <select data-technique-judge-stat>${judgeStatOptions()}</select></label>
        <label>판정 보정 <input type="number" step="1" data-technique-judge-bonus value="0" /></label>
        <label>설명 <textarea rows="2" data-technique-description placeholder="상태이상/소환/광역 등 보류 효과는 설명에만 기록"></textarea></label>
        <button type="button" data-create-technique ${canCreate && unusedSources.length > 0 ? '' : 'disabled'}>기술 제작</button>
      </details>
    </section>
  `;
};

const renderBattleItems = (state: GameState): string => {
  const items = getBattleUsableItems(state);
  const disabled = state.phase === 'player-main' && !state.setupMode && !state.levelUpPending ? '' : 'disabled';

  return `
    <section class="panel battle-items-panel">
      <details>
        <summary>전투 아이템</summary>
        ${
          items.length === 0
            ? '<p class="muted">현재 원본 규칙상 전투 중 사용 가능한 아이템이 없습니다.</p>'
            : `<ul class="inventory-list">${items
                .map(
                  (item) => `
                    <li>
                      <span>${item.name}</span>
                      <button type="button" data-add-battle-item="${item.id}" ${disabled}>큐에 추가</button>
                    </li>
                  `
                )
                .join('')}</ul>`
        }
      </details>
    </section>
  `;
};


const renderHaloPanel = (state: GameState, compact = false): string => {
  const hasAccess = hasHaloAccess(state);
  const selected = state.halo.selectedKind;

  if (!hasAccess) {
    return `<section class="panel halo-panel"><h2>헤일로</h2><p class="muted">헤일로를 보유하지 않았습니다.</p></section>`;
  }

  const selectedDescription = selected ? getHaloDescription(selected) : '정비 단계에서 사용할 천사의 헤일로를 선택하세요.';
  const useDisabled = (kind: HaloKind): string => (canUseHalo(state, kind).ok ? '' : 'disabled');
  const used = (kind: HaloKind): string => state.halo.usedThisFloor[kind] ? '사용 완료' : '사용 가능';

  if (compact) {
    return `
      <section class="panel halo-panel compact">
        <h2>헤일로</h2>
        <p>현재 선택: <strong>${selected ? getHaloLabel(selected) : '없음'}</strong></p>
        <p class="muted">${selectedDescription}</p>
        ${state.halo.pendingAmplification ? '<p class="muted">증폭 묘사 대기 중: 다음 AI GM 서술에 반영됩니다.</p>' : ''}
        <p class="muted">증폭은 실제 수치를 바꾸지 않고, 다음 AI GM 묘사만 무한히 증폭합니다.</p>
        ${selected && selected !== 'satan' ? `<button type="button" data-use-halo="${selected}" ${useDisabled(selected)}>현재 헤일로 사용</button>` : ''}
        ${selected === 'satan' ? '<p class="muted">사탄은 선택형 패시브로 힘/민첩/체력 +10을 적용합니다.</p>' : ''}
      </section>
    `;
  }

  return `
    <section class="panel halo-panel">
      <h2>헤일로</h2>
      <p>보유 상태: <strong>보유</strong></p>
      <p>현재 선택: <strong>${selected ? getHaloLabel(selected) : '없음'}</strong></p>
      <p class="muted">${selectedDescription}</p>
      <p class="muted">증폭은 실제 수치를 바꾸지 않고, 다음 AI GM 묘사만 무한히 증폭합니다.</p>
      ${state.halo.pendingAmplification ? `<p class="muted">증폭 묘사 대기 중: ${state.halo.pendingAmplification.description ?? '다음 주요 행동'}</p>` : ''}
      <div class="choice-grid halo-kind-grid">
        ${HALO_KINDS.map(
          (kind) => `<button type="button" class="choice ${selected === kind ? 'selected' : ''}" data-select-halo-kind="${kind}">${getHaloLabel(kind)}</button>`
        ).join('')}
      </div>
      <div class="halo-list">
        ${HALO_KINDS.map((kind) => `<div><strong>${getHaloLabel(kind)}</strong><span>${getHaloDescription(kind)}</span><em>${['amplification', 'extinction', 'birth'].includes(kind) ? used(kind) : kind === 'satan' ? '패시브' : '제한 없음'}</em></div>`).join('')}
      </div>
      <details open>
        <summary>헤일로 사용</summary>
        <div class="halo-input-grid">
          <label>증폭 설명<input data-halo-amplification-description value="다음 행동" /></label>
          <button type="button" data-use-halo="amplification" ${useDisabled('amplification')}>증폭 사용</button>
          <label>소멸 대상<input data-halo-extinction-target placeholder="생명체가 아닌 대상" /></label>
          <button type="button" data-use-halo="extinction" ${useDisabled('extinction')}>소멸 사용</button>
          <label>탄생 물건<input data-halo-birth-item placeholder="창조할 물건" /></label>
          <button type="button" data-use-halo="birth" ${useDisabled('birth')}>탄생 사용</button>
          <label>결합 A<select data-halo-fusion-a>${state.techniques.map((technique) => `<option value="${technique.id}">${technique.name}</option>`).join('')}</select></label>
          <label>결합 B<select data-halo-fusion-b>${state.techniques.map((technique) => `<option value="${technique.id}">${technique.name}</option>`).join('')}</select></label>
          <button type="button" data-use-halo="fusion" ${useDisabled('fusion')}>결합 사용</button>
          <button type="button" data-use-halo="decomposition" ${useDisabled('decomposition')}>분해 사용</button>
          <label>존재 개념<input data-halo-existence-concept placeholder="공간, 빛 등" /></label>
          <button type="button" data-use-halo="existence" ${useDisabled('existence')}>존재 사용</button>
          <button type="button" data-use-halo="achievement" ${useDisabled('achievement')}>성취 사용</button>
          <label>욕망 결과<input data-halo-desire-result placeholder="끌어올 결과" /></label>
          <label>행동 불능 턴<input type="number" min="0" data-halo-desire-disabled-turns value="0" /></label>
          <button type="button" data-use-halo="desire" ${useDisabled('desire')}>욕망 사용</button>
        </div>
      </details>
    </section>
  `;
};

const renderReactionPanel = (state: GameState): string => {
  if (state.phase !== 'player-reaction') {
    return '';
  }

  const reactionSkills = state.skills.filter((skill) => skill.timing === 'reaction');

  return `
    <section class="panel reaction-panel">
      <h2>반응턴</h2>
      <p class="muted">${state.pendingReaction?.attackLog ?? '적 공격에 반응할 수 있습니다.'}</p>
      <p class="muted">적 공격에 반응할 수 있습니다. 반응은 턴을 소모하지 않습니다.</p>
      <div class="action-grid">
        <button type="button" data-reaction="dodge">회피</button>
        <button type="button" data-reaction="guard">방어</button>
        <button type="button" data-reaction="counter">카운터</button>
        <button type="button" data-reaction="none">반응 안 함</button>
      </div>
      <details open>
        <summary>반응 스킬 (${reactionSkills.length})</summary>
        ${reactionSkills.length === 0 ? '<p class="muted">사용 가능한 반응 스킬이 없습니다.</p>' : `<div class="action-grid">${reactionSkills.map((skill) => `<button type="button" data-reaction-skill="${skill.id}">${skill.name}</button>`).join('')}</div>`}
      </details>
    </section>
  `;
};

const renderActionQueue = (state: GameState): string => `
  <section class="panel queue-panel">
    <h2>행동 큐</h2>
    ${
      state.actionQueue.length === 0
        ? '<p class="muted">아직 추가된 행동이 없습니다.</p>'
        : `<ol>${state.actionQueue
            .map(
              (action, index) =>
                `<li><span>${index + 1}. ${action.label}</span><button type="button" data-remove-action="${action.id}" aria-label="${action.label} 삭제">삭제</button></li>`
            )
            .join('')}</ol>`
    }
  </section>
`;

const renderActionButtons = (state: GameState): string => {
  const disabled = state.setupMode || state.levelUpPending || state.phase !== 'player-main' ? 'disabled' : '';
  const finishDisabled = state.setupMode || state.levelUpPending || state.phase !== 'player-main' ? 'disabled' : '';
  const newBattleDisabled = !state.setupMode && state.phase === 'battle-ended' ? '' : 'disabled';

  return `
    <section class="panel actions">
      <h2>행동 추가</h2>
      <p class="muted">버튼은 즉시 실행하지 않고 큐에 쌓입니다. 턴 마무리 시 순서대로 실행됩니다.</p>
      ${state.setupMode ? '<p class="muted">캐릭터 생성이 끝나야 전투 행동을 할 수 있습니다.</p>' : ''}
      ${state.levelUpPending ? '<p class="muted">레벨업 스탯 분배가 끝나야 전투 행동을 할 수 있습니다.</p>' : ''}
      <details open>
        <summary>이동</summary>
        <div class="choice-grid" data-direction-group>
          ${(['up', 'down', 'left', 'right'] as Direction[])
            .map(
              (direction, index) =>
                `<button type="button" class="choice ${index === 0 ? 'selected' : ''}" data-move-direction="${direction}" ${disabled}>${directionLabels[direction]}</button>`
            )
            .join('')}
        </div>
        <div class="choice-grid" data-step-group>
          ${[1, 2, 3]
            .map(
              (step, index) =>
                `<button type="button" class="choice ${index === 0 ? 'selected' : ''}" data-move-step="${step}" ${disabled}>${step}칸</button>`
            )
            .join('')}
        </div>
        <button type="button" data-add-move ${disabled}>이동 행동 추가</button>
      </details>
      <div class="action-grid">
        ${(['basic-attack', 'skill', 'spell', 'item', 'defend', 'wait'] as QueuedAction['type'][])
          .map((type) => `<button type="button" data-add-action="${type}" ${disabled}>${actionLabels[type]} 추가</button>`)
          .join('')}
      </div>
      <button type="button" class="finish-button" data-finish-turn ${finishDisabled}>턴 마무리</button>
      <button type="button" data-new-battle ${newBattleDisabled}>새 전투 시작</button>
      ${state.phase === 'enemy-main' ? '<p class="muted">적 메인턴은 자동 진행 대상입니다. 초기 선턴 등 예외 상황에서만 턴 마무리로 처리합니다.</p>' : ''}
    </section>
  `;
};


const renderEnemyCompact = (state: GameState): string => `
  <section class="panel enemy-compact">
    <h2>적 간단 시트</h2>
    <dl>
      <div><dt>이름</dt><dd>${state.enemy.name}</dd></div>
      <div><dt>HP</dt><dd>${state.enemy.hp} / ${state.enemy.derived.maxHP}</dd></div>
      <div><dt>위치</dt><dd>${state.enemy.position.x + 1}, ${state.enemy.position.y + 1}</dd></div>
      <div><dt>공격력</dt><dd>${state.enemy.derived.attack}</dd></div>
      <div><dt>상태</dt><dd>${state.enemy.guarding ? '방어 중' : '일반'}</dd></div>
    </dl>
  </section>
`;

const renderRecentLog = (state: GameState): string => `
  <section class="panel log-panel compact">
    <h2>최근 로그</h2>
    <ol>${state.log.slice(-8).map((entry) => `<li><span>턴 ${entry.turn}</span>${entry.message}</li>`).join('')}</ol>
  </section>
`;

const renderSavePanel = (): string => `
  <section class="panel save-panel">
    <h2>저장/불러오기</h2>
    <div class="save-grid">
      <button type="button" data-save="save">저장</button>
      <button type="button" data-save="load">불러오기</button>
    </div>
  </section>
`;

const renderBattleTab = (state: GameState): string => `
  <section class="tab-panel battle-layout" data-tab-panel="battle">
    <div>
      ${renderTurnStatus(state)}
      ${renderMap(state)}
      ${renderReactionPanel(state)}
      <section class="panel minimap"><h2>미니맵 요약</h2><p>${getMinimapSummary(state)}</p></section>
      ${renderActionQueue(state)}
      ${renderActionButtons(state)}
      ${renderHaloPanel(state, true)}
    </div>
    <div>
      ${renderKnownTechniquesForBattle(state)}
      ${renderKnownSkillsForBattle(state)}
      ${renderKnownSpells(state)}
      ${renderBattleItems(state)}
      ${renderEnemyCompact(state)}
      ${renderRecentLog(state)}
    </div>
  </section>
`;


const renderPassiveSummary = (state: GameState): string => {
  const summaries = summarizePassiveSkills(state.skills);

  return `
    <section class="panel passive-summary">
      <h2>적용 중인 패시브</h2>
      ${summaries.length === 0 ? '<p class="muted">적용 중인 패시브 스킬이 없습니다.</p>' : `<ul>${summaries.map((summary) => `<li>${summary}</li>`).join('')}</ul>`}
      <p class="muted">판정은 1d100 ≤ 스탯+보정으로 처리됩니다. 상황별 성공조건은 추후 정밀화 예정입니다.</p>
      <p class="muted">기술 제작 출처 ${state.techniqueSources.length}개 / 보유 기술 ${state.techniques.length}개</p>
    </section>
  `;
};

const renderSheetTab = (state: GameState): string => `
  <section class="tab-panel" data-tab-panel="sheet">
    ${renderCharacterCard(state.player)}
    ${renderStatAllocationPanel(state)}
    ${renderLevelUpAllocationPanel(state)}
    ${renderHaloPanel(state)}
    ${renderTechniqueManagement(state)}
    ${renderPassiveSummary(state)}
    ${renderSkillManagement(state)}
    ${renderKnownSpells(state)}
    ${renderEquipmentPanel(state)}
  </section>
`;

const renderMaintenanceTab = (state: GameState): string => `
  <section class="tab-panel" data-tab-panel="maintenance">
    <section class="panel"><h2>마법서 시도권</h2><p>이번 층 마법서 무료 시도: <strong>${state.magicBookAttempt.floor === state.floor && state.magicBookAttempt.freeUsed ? '사용 완료, 이후 1회 1코인' : '사용 가능'}</strong></p></section>
    ${renderFloorClearPanel(state)}
    ${renderHaloPanel(state)}
    ${renderRewardPanel(state)}
    ${renderShopPanel(state)}
    ${renderEquipmentPanel(state)}
    ${renderInventorySummary(state)}
    ${renderPendingChoicePanel(state)}
    ${renderSavePanel()}
  </section>
`;

const renderTrialTab = (state: GameState): string => {
  const claimed = [...state.angelTrial.claimedScores].sort((a, b) => a - b);
  const availableRewards = getAngelRewards(state.player.derived.attack);
  const nextRewards = getUnclaimedAngelRewards(state.player.derived.attack, state.angelTrial.claimedScores);

  return `
    <section class="tab-panel" data-tab-panel="trial">
      <section class="panel">
        <h2>천사의 시련</h2>
        <p>기본 공격력 또는 직접 입력한 시련값으로 원본 ANGEL_TABLE 보상을 획득합니다.</p>
        <p class="muted">천사의 시련은 전투/보스전이 아니며 적을 추가하지 않습니다. 점수 기반 보상 지급만 처리합니다.</p>
        <dl>
          <div><dt>현재 기본 공격 시련값</dt><dd>${state.player.derived.attack}</dd></div>
          <div><dt>마지막 시련값</dt><dd>${state.angelTrial.lastScore ?? '없음'}</dd></div>
          <div><dt>마지막 결과</dt><dd>${state.angelTrial.lastResult ?? '아직 실행하지 않았습니다.'}</dd></div>
        </dl>
        <div class="button-row">
          <button type="button" data-angel-run-attack>기본 공격값으로 시련 적용</button>
          <label>직접 시련값 <input type="number" min="0" step="1" data-angel-manual-score value="${state.player.derived.attack}" /></label>
          <button type="button" data-angel-run-manual>직접값 적용</button>
          <button type="button" data-angel-reset>획득 기록 초기화</button>
        </div>
      </section>
      <section class="panel">
        <details open>
          <summary>획득 완료 단계 (${claimed.length})</summary>
          <p>${claimed.length ? claimed.join(', ') : '없음'}</p>
        </details>
        <details>
          <summary>현재 기본 공격값 기준 보상 (${availableRewards.length}) / 신규 ${nextRewards.length}</summary>
          ${
            availableRewards.length === 0
              ? '<p class="muted">현재 기본 공격값으로 받을 수 있는 보상이 없습니다.</p>'
              : `<ul class="inventory-list">${availableRewards.map((reward) => `<li>${reward.score}: ${reward.name}</li>`).join('')}</ul>`
          }
        </details>
      </section>
    </section>
  `;
};

const renderAITab = (): string => `<section class="tab-panel" data-tab-panel="ai">${renderAISettings({ open: true })}</section>`;

const renderLogTab = (state: GameState): string => `
  <section class="tab-panel" data-tab-panel="log">
    ${renderLog(state)}
    <section class="panel halo-panel"><h2>헤일로 기록</h2>${state.halo.history.length === 0 ? '<p class="muted">헤일로 기록이 없습니다.</p>' : `<ol>${state.halo.history.slice(-20).map((entry) => `<li>${entry}</li>`).join('')}</ol>`}</section>
    ${renderDebugPanel()}
  </section>
`;

const renderActiveTab = (state: GameState): string => {
  if (activeTab === 'sheet') return renderSheetTab(state);
  if (activeTab === 'maintenance') return renderMaintenanceTab(state);
  if (activeTab === 'trial') return renderTrialTab(state);
  if (activeTab === 'ai') return renderAITab();
  if (activeTab === 'log') return renderLogTab(state);
  return renderBattleTab(state);
};

const renderTabBar = (): string => {
  const tabs: { id: AppTab; label: string }[] = [
    { id: 'battle', label: '전투' },
    { id: 'sheet', label: '시트지' },
    { id: 'maintenance', label: '정비' },
    { id: 'trial', label: '천사의 시련' },
    { id: 'ai', label: 'AI' },
    { id: 'log', label: '로그' }
  ];

  return `<nav class="tab-bar" aria-label="주요 탭">${tabs
    .map((tab) => `<button type="button" data-tab="${tab.id}" class="${activeTab === tab.id ? 'active' : ''}">${tab.label}</button>`)
    .join('')}</nav>`;
};

const template = (state: GameState): string => `
  <main class="app-shell">
    <header class="hero">
      <p class="eyebrow">ManRPG 모바일 전투 시트</p>
      <h1>ManRPG PWA AI</h1>
      <p>플레이어 1명과 적 1명이 고정 11x11 맵에서 전투하고, 규칙·판정·보상은 로컬에서 처리합니다.</p>
    </header>

    ${renderTabBar()}
    ${renderActiveTab(state)}
  </main>
`;

export const render = (root: HTMLElement, state: GameState): void => {
  root.innerHTML = template(state);
};

const getSelectedDirection = (root: HTMLElement): Direction =>
  (root.querySelector<HTMLButtonElement>('[data-move-direction].selected')?.dataset.moveDirection as Direction | undefined) ?? 'up';

const getSelectedSteps = (root: HTMLElement): number =>
  Number(root.querySelector<HTMLButtonElement>('[data-move-step].selected')?.dataset.moveStep ?? 1);

const updateSelectedButton = (button: HTMLButtonElement, selector: string): void => {
  button.parentElement?.querySelectorAll(selector).forEach((element) => element.classList.remove('selected'));
  button.classList.add('selected');
};

export const bindUI = (root: HTMLElement, getState: () => GameState, setState: (state: GameState) => void): void => {
  root.addEventListener('click', async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const addAction = target.dataset.addAction as QueuedAction['type'] | undefined;
    const removeActionId = target.dataset.removeAction;
    const saveAction = target.dataset.save;
    const statIncrease = target.dataset.statIncrease as AllocatableStatKey | undefined;
    const statDecrease = target.dataset.statDecrease as AllocatableStatKey | undefined;
    const rewardId = target.dataset.toggleReward;
    const useItemId = target.dataset.useItem;
    const sellItemId = target.dataset.sellItem;
    const unequipSlot = target.dataset.unequipSlot as EquipmentSlot | undefined;
    const addSpellId = target.dataset.addSpell;
    const addSkillId = target.dataset.addSkill;
    const addTechniqueId = target.dataset.addTechnique;
    const addBattleItemId = target.dataset.addBattleItem;
    const buyShopItemId = target.dataset.buyShopItem;
    const confirmChoiceId = target.dataset.confirmChoice;
    const reaction = target.dataset.reaction as 'dodge' | 'guard' | 'counter' | 'none' | undefined;
    const reactionSkillId = target.dataset.reactionSkill;
    const selectHalo = target.dataset.selectHaloKind as HaloKind | undefined;
    const useHalo = target.dataset.useHalo as HaloKind | undefined;
    const debugAction = target.dataset.debugAction;
    const tab = target.dataset.tab as AppTab | undefined;
    const angelManualScore = Number(getInputValue(root, '[data-angel-manual-score]'));

    const setStateWithAuto = async (nextState: GameState, reason: string): Promise<void> => {
      await applyStateWithAutoNarration(nextState, reason, setState);
    };

    const logError = (error: unknown): void => {
      setState(appendLog(getState(), `오류: ${toErrorMessage(error)}`));
    };

    if (tab) {
      activeTab = tab;
      render(root, getState());
      return;
    }


    if (selectHalo) {
      await setStateWithAuto(selectHaloKind(getState(), selectHalo), '헤일로 선택 후');
      return;
    }

    if (useHalo) {
      const haloState = getState();
      const nextState =
        useHalo === 'amplification'
          ? useHaloAmplification(haloState, getInputValue(root, '[data-halo-amplification-description]'))
          : useHalo === 'extinction'
            ? useHaloExtinction(haloState, getInputValue(root, '[data-halo-extinction-target]'))
            : useHalo === 'birth'
              ? useHaloBirth(haloState, getInputValue(root, '[data-halo-birth-item]'))
              : useHalo === 'fusion'
                ? useHaloFusion(haloState, getInputValue(root, '[data-halo-fusion-a]'), getInputValue(root, '[data-halo-fusion-b]'))
                : useHalo === 'decomposition'
                  ? useHaloDecomposition(haloState)
                  : useHalo === 'existence'
                    ? useHaloExistence(haloState, getInputValue(root, '[data-halo-existence-concept]'))
                    : useHalo === 'achievement'
                      ? useHaloAchievement(haloState)
                      : useHalo === 'desire'
                        ? useHaloDesire(haloState, getInputValue(root, '[data-halo-desire-result]'), Number(getInputValue(root, '[data-halo-desire-disabled-turns]') || 0))
                        : appendLog(haloState, '사탄 헤일로는 사용 버튼이 아니라 선택형 패시브입니다.');

      if (useHalo === 'amplification') {
        setState(nextState);
      } else {
        await setStateWithAuto(nextState, '헤일로 사용 후');
      }
      return;
    }

    if (debugAction) {
      try {
        if (debugAction === 'clear-save') {
          clearSavedData();
          setState(appendLog(getState(), '저장 데이터를 초기화했습니다.'));
          return;
        }

        if (debugAction === 'reset-all') {
          clearSavedData();
          setState(resetAllProgress(getState()));
          return;
        }

        if (debugAction === 'copy-json') {
          await navigator.clipboard.writeText(exportStateJson(getState()));
          setState(appendLog(getState(), '실험/디버그: 현재 상태 JSON을 클립보드에 복사했습니다.'));
          return;
        }

        if (debugAction === 'coins') {
          setState(grantTestCoins(getState()));
          return;
        }

        if (debugAction === 'rewards') {
          setState(grantTestRewards(getState()));
          return;
        }

        if (debugAction === 'spell') {
          setState(grantTestSpell(getState()));
          return;
        }

        if (debugAction === 'skill') {
          setState(grantTestSkill(getState()));
          return;
        }

        if (debugAction === 'equipment') {
          setState(grantTestEquipment(getState()));
          return;
        }

        if (debugAction === 'enemy-hp-one') {
          setState(setEnemyHpToOne(getState()));
          return;
        }

        if (debugAction === 'recover') {
          setState(fullRecoverPlayer(getState()));
          return;
        }
      } catch (error) {
        logError(error);
        return;
      }
    }

    if (target.dataset.angelRunAttack !== undefined) {
      await setStateWithAuto(runAngelTrialWithAttack(getState()), '천사의 시련 결과 후');
      return;
    }

    if (target.dataset.angelRunManual !== undefined) {
      await setStateWithAuto(runAngelTrialWithManualScore(getState(), angelManualScore), '천사의 시련 결과 후');
      return;
    }

    if (target.dataset.angelReset !== undefined) {
      setState(resetAngelTrialClaims(getState()));
      return;
    }

    if (target.dataset.aiSaveSettings !== undefined) {
      try {
        setAISettings(collectAISettings(root));
        setAISettingsStatus('AI 설정을 저장했습니다.');
        setState(appendLog(getState(), 'AI 설정을 저장했습니다.'));
      } catch (error) {
        logError(error);
      }
      return;
    }

    if (target.dataset.aiClearKeys !== undefined) {
      try {
        clearAIKeys();
        setAISettingsStatus('API 키를 지웠습니다.');
        setState(appendLog(getState(), 'AI API 키를 지웠습니다.'));
      } catch (error) {
        logError(error);
      }
      return;
    }

    if (target.dataset.aiClearUsage !== undefined) {
      try {
        clearAIUsage();
        setAISettingsStatus('AI 사용량 기록을 초기화했습니다.');
        setState(appendLog(getState(), 'AI 사용량 기록을 초기화했습니다.'));
      } catch (error) {
        logError(error);
      }
      return;
    }

    if (target.dataset.aiWorkerHealth !== undefined) {
      try {
        setAISettings(collectAISettings(root));
        const proxyUrl = getAISettings().proxyUrl.trim().replace(/\/$/, '');

        if (!proxyUrl) {
          setState(appendLog(getState(), 'Worker URL을 입력하세요.'));
          return;
        }

        const response = await fetch(`${proxyUrl}/health`);

        if (!response.ok) {
          setAISettingsStatus('Worker 상태 확인 실패');
          setState(appendLog(getState(), 'Worker 상태 확인 실패'));
          return;
        }

        const health = (await response.json()) as { service?: string; version?: string; providers?: Record<string, boolean> };
        const providers = Object.entries(health.providers ?? {})
          .map(([provider, available]) => `${provider}:${available ? '있음' : '없음'}`)
          .join(', ');
        const message = `Worker 상태: ${health.service ?? 'unknown'} ${health.version ?? ''} (${providers || 'provider 정보 없음'})`;
        setAISettingsStatus(message);
        setState(appendLog(getState(), message));
      } catch (error) {
        setAISettingsStatus('Worker 상태 확인 실패');
        logError(error);
      }
      return;
    }

    if (target.dataset.aiTest !== undefined) {
      try {
        setAISettings(collectAISettings(root));
        const response = await callLLM('narrate', {
          summary: 'AI 연결 테스트',
          delta: { source: 'settings-panel' },
          localResult: '규칙 상태 변경 없음'
        });
        const fallbackUsed = response.meta?.fallback ?? response.ui_tags.includes('fallback');
        const message = fallbackUsed ? 'AI 연결 실패 또는 fallback 사용' : 'AI 연결 성공';

        setAIConnectionStatus(message, fallbackUsed, response.meta);
        setState(appendAILogs(appendLog(getState(), response.meta?.errorCode ? `${message}: ${response.meta.errorCode}` : message), response.narration, response.combat_log));
      } catch (error) {
        setAIConnectionStatus('AI 연결 테스트 오류', true);
        logError(error);
      }
      return;
    }

    if (target.dataset.aiNarrate !== undefined) {
      const stateBeforeNarration = getState();
      try {
        const response = await callLLM('narrate', buildNarrationPayload(stateBeforeNarration));
        setAIConnectionStatus(response.meta?.fallback ? 'AI 연결 실패 또는 fallback 사용' : 'AI GM 묘사 생성 완료', response.meta?.fallback ?? response.ui_tags.includes('fallback'), response.meta);
        const ruleState = consumePendingAmplificationNarration(stateBeforeNarration);
        setState(appendAILogs(ruleState, response.narration, response.combat_log));
      } catch (error) {
        setState(appendLog(stateBeforeNarration, stateBeforeNarration.halo.pendingAmplification ? 'AI 호출 실패로 증폭 묘사가 대기 상태로 유지됩니다.' : `오류: ${toErrorMessage(error)}`));
      }
      return;
    }

    if (target.dataset.aiInterpret !== undefined) {
      const naturalAction = getInputValue(root, '[data-ai-interpret-input]');
      if (!naturalAction) {
        setState(appendLog(getState(), '해석할 자연어 행동을 입력하세요.'));
        return;
      }

      try {
        const response = await callLLM('interpret', {
          summary: naturalAction,
          delta: { phase: getState().phase, floor: getState().floor },
          localResult: '행동 큐에 추가하지 않고 해석만 표시'
        });
        setAIConnectionStatus(response.meta?.fallback ? 'AI 연결 실패 또는 fallback 사용' : 'AI 자연어 해석 완료', response.meta?.fallback ?? response.ui_tags.includes('fallback'), response.meta);
        setState(appendAILogs(getState(), response.narration, response.combat_log));
      } catch (error) {
        logError(error);
      }
      return;
    }

    if (reaction) {
      await setStateWithAuto(resolvePlayerReaction(getState(), reaction), '반응턴 처리 후');
      return;
    }

    if (reactionSkillId) {
      await setStateWithAuto(resolvePlayerReactionSkill(getState(), reactionSkillId), '반응 스킬 처리 후');
      return;
    }

    if (statIncrease) {
      setState(increaseStat(getState(), statIncrease));
      return;
    }

    if (statDecrease) {
      setState(decreaseStat(getState(), statDecrease));
      return;
    }

    if (target.dataset.resetStats !== undefined) {
      setState(resetStats(getState()));
      return;
    }

    if (target.dataset.finishSetup !== undefined) {
      setState(finishSetup(getState()));
      return;
    }

    if (target.dataset.finishLevelAllocation !== undefined) {
      setState(finishLevelAllocation(getState()));
      return;
    }

    if (target.dataset.clearFloor !== undefined) {
      await setStateWithAuto(createRewardOffer(applyFiveLevelPlus(clearFloorRecovery(getState()))), '보상 후보 생성 후');
      return;
    }

    if (target.dataset.createRewardOffer !== undefined) {
      setState(createRewardOffer(getState()));
      return;
    }

    if (rewardId) {
      setState(toggleRewardSelection(getState(), rewardId));
      return;
    }

    if (useItemId) {
      await setStateWithAuto(useInventoryItem(getState(), useItemId), '마법서 또는 인벤토리 사용 후');
      return;
    }

    if (sellItemId) {
      setState(sellInventoryItem(getState(), sellItemId));
      return;
    }

    if (unequipSlot) {
      await setStateWithAuto(unequipItem(getState(), unequipSlot), '장비 해제 후');
      return;
    }

    if (buyShopItemId) {
      await setStateWithAuto(buyShopItem(getState(), buyShopItemId), '상점 구매 후');
      return;
    }

    if (confirmChoiceId) {
      await setStateWithAuto(confirmPendingChoice(getState(), confirmChoiceId), '선택권 처리 후');
      return;
    }

    if (target.dataset.cancelChoice !== undefined) {
      setState(cancelPendingChoice(getState()));
      return;
    }

    if (target.dataset.claimRewards !== undefined) {
      await setStateWithAuto(claimSelectedRewards(getState()), '보상 확정 후');
      return;
    }

    if (target.dataset.enterNextFloor !== undefined) {
      await setStateWithAuto(enterNextFloor(getState()), '다음 층 진입 후');
      return;
    }

    if (target.dataset.moveDirection) {
      updateSelectedButton(target, '[data-move-direction]');
      return;
    }

    if (target.dataset.moveStep) {
      updateSelectedButton(target, '[data-move-step]');
      return;
    }

    if (target.dataset.addMove !== undefined) {
      setState(enqueueAction(getState(), createQueuedAction('move', getSelectedDirection(root), getSelectedSteps(root))));
      return;
    }

    if (addSpellId) {
      const spell = getState().spells.find((knownSpell) => knownSpell.id === addSpellId);
      setState(
        enqueueAction(getState(), {
          id: createActionId(),
          type: 'spell',
          spellId: addSpellId,
          label: `${spell?.name ?? '마법'} 시전`
        })
      );
      return;
    }

    if (addTechniqueId) {
      const technique = getState().techniques.find((knownTechnique) => knownTechnique.id === addTechniqueId);
      setState(enqueueAction(getState(), createTechniqueAction(addTechniqueId, technique?.name ?? '기술')));
      return;
    }

    if (addSkillId) {
      const skill = getState().skills.find((knownSkill) => knownSkill.id === addSkillId);
      setState(enqueueAction(getState(), createSkillAction(addSkillId, skill?.name ?? '스킬')));
      return;
    }

    if (target.dataset.createTechnique !== undefined) {
      await setStateWithAuto(
        addPlayerTechnique(getState(), {
          name: getInputValue(root, '[data-technique-name]'),
          source: getInputValue(root, '[data-technique-source]'),
          kind: getInputValue(root, '[data-technique-kind]') as TechniqueKind,
          mpDelta: Number(getInputValue(root, '[data-technique-mp-delta]') || 0),
          hpDelta: Number(getInputValue(root, '[data-technique-hp-delta]') || 0),
          damageMultiplier: Number(getInputValue(root, '[data-technique-damage-multiplier]') || 0),
          judgeStat: getInputValue(root, '[data-technique-judge-stat]') as TechniqueJudgeStat,
          judgeBonus: Number(getInputValue(root, '[data-technique-judge-bonus]') || 0),
          description: getInputValue(root, '[data-technique-description]')
        }),
        '기술 제작 후'
      );
      return;
    }

    if (target.dataset.createSkill !== undefined) {
      const effectType = getInputValue(root, '[data-skill-effect]') as 'damage' | 'heal' | 'guard' | 'todo';
      const targetType = effectType === 'damage' ? 'enemy' : 'self';
      await setStateWithAuto(
        addPlayerSkill(getState(), {
          name: getInputValue(root, '[data-skill-name]'),
          description: getInputValue(root, '[data-skill-description]'),
          resourceType: getInputValue(root, '[data-skill-resource]') as 'outer' | 'inner' | 'sword' | 'magic' | 'none',
          effectType,
          target: targetType,
          multiplier: Number(getInputValue(root, '[data-skill-multiplier]') || 1),
          source: 'user',
          kind: getInputValue(root, '[data-skill-kind]') as TechniqueKind | 'passive',
          timing: getInputValue(root, '[data-skill-kind]') === 'passive' ? 'passive' : (getInputValue(root, '[data-skill-timing]') as 'main' | 'reaction' | 'passive'),
          mpDelta: Number(getInputValue(root, '[data-skill-mp-delta]') || 0),
          hpDelta: Number(getInputValue(root, '[data-skill-hp-delta]') || 0),
          damageMultiplier: Number(getInputValue(root, '[data-skill-damage-multiplier]') || 0),
          judgeStat: getInputValue(root, '[data-skill-judge-stat]') as TechniqueJudgeStat,
          judgeBonus: Number(getInputValue(root, '[data-skill-judge-bonus]') || 0),
          passiveStat: getInputValue(root, '[data-skill-passive-stat]') as Exclude<TechniqueJudgeStat, 'none'>,
          passiveValue: Number(getInputValue(root, '[data-skill-passive-value]') || 0)
        }),
        '스킬 생성 후'
      );
      return;
    }

    if (addBattleItemId) {
      const item = getState().inventory.find((inventoryItem) => inventoryItem.id === addBattleItemId);
      setState(
        enqueueAction(getState(), {
          id: createActionId(),
          type: 'item',
          itemId: addBattleItemId,
          label: `${item?.name ?? '아이템'} 사용`
        })
      );
      return;
    }

    if (addAction) {
      setState(enqueueAction(getState(), createQueuedAction(addAction)));
      return;
    }

    if (removeActionId) {
      setState(removeQueuedAction(getState(), removeActionId));
      return;
    }

    if (target.dataset.finishTurn !== undefined) {
      await setStateWithAuto(advanceTurn(getState()), '턴 마무리 후');
      return;
    }

    if (target.dataset.newBattle !== undefined) {
      const currentState = getState();

      await setStateWithAuto(createNewBattleFromPlayer(currentState), '새 전투 시작 후');
      return;
    }

    if (saveAction === 'save') {
      try {
        setState(appendLog(getState(), saveGameStub(getState())));
      } catch (error) {
        logError(error);
      }
    }

    if (saveAction === 'load') {
      try {
        setState(appendLog(loadGameStub(), '불러오기: localStorage에서 검증된 상태를 읽었습니다. 깨진 데이터면 초기 상태로 복구됩니다.'));
      } catch (error) {
        logError(error);
      }
    }
  });
};
