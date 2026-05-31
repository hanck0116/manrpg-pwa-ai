import { enqueueAction, removeQueuedAction } from '../game/actionQueue';
import { clearFloorRecovery, enterNextFloor } from '../game/floor';
import {
  clearSavedData,
  exportStateJson,
  fullRecoverPlayer,
  grantTestCoins,
  grantTestRewards,
  grantTestSpell,
  resetAllProgress,
  setEnemyHpToOne
} from '../game/debugTools';
import { getBattleUsableItems, sellInventoryItem, useInventoryItem } from '../game/inventory';
import { applyFiveLevelPlus, canFinishLevelAllocation, finishLevelAllocation } from '../game/levelUp';
import { resolvePlayerReaction } from '../game/reactionFlow';
import { createRewardOffer, claimSelectedRewards, toggleRewardSelection } from '../game/rewardFlow';
import { advanceTurn, createNewBattleFromPlayer } from '../game/turn';
import { fixedMap } from '../map/fixedMap';
import { getMinimapSummary } from '../map/minimap';
import { getDirectionLabel } from '../game/movement';
import { loadGameStub, saveGameStub } from '../storage/save';
import { buyShopItem, canBuyShopItem, getShopItems } from '../rules/shop';
import { describeSpell } from '../rules/spell';
import { callLLM } from '../ai/router';
import { setAISettings, clearAIKeys, type AIProvider, type AISettings } from '../ai/settings';
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
import type { Character, Direction, GameState, QueuedAction } from '../state/gameState';
import { appendLog } from '../state/gameState';
import { renderAISettings, setAIConnectionStatus, setAISettingsStatus } from './aiSettings';

const actionLabels: Record<QueuedAction['type'], string> = {
  move: '이동',
  'basic-attack': '기본 공격',
  skill: '스킬',
  spell: '마법',
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

const appendAILogs = (state: GameState, narration: string, combatLog: string[] = []): GameState => {
  const withNarration = narration ? appendLog(state, narration) : state;
  return combatLog.reduce((nextState, log) => appendLog(nextState, log), withNarration);
};

const toErrorMessage = (error: unknown): string => (error instanceof Error && error.message ? error.message : '알 수 없는 오류');

const getInputValue = (root: HTMLElement, selector: string): string =>
  root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)?.value.trim() ?? '';

const getChecked = (root: HTMLElement, selector: string): boolean =>
  root.querySelector<HTMLInputElement>(selector)?.checked ?? false;

const getSelectValue = (root: HTMLElement, selector: string): AIProvider =>
  (root.querySelector<HTMLSelectElement>(selector)?.value as AIProvider | undefined) ?? 'groq';

const collectAISettings = (root: HTMLElement): Partial<AISettings> => {
  const nextSettings: Partial<AISettings> = {
    enabled: getChecked(root, '[data-ai-enabled]'),
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

const buildNarrationPayload = (state: GameState): Record<string, unknown> => ({
  summary: state.log.slice(-5).map((entry) => entry.message),
  delta: {
    phase: state.phase,
    floor: state.floor
  },
  localResult: {
    player: {
      name: state.player.name,
      hp: state.player.hp,
      maxHP: state.player.derived.maxHP,
      mp: state.player.mp,
      maxMP: state.player.derived.maxMP,
      position: state.player.position
    },
    enemy: {
      name: state.enemy.name,
      hp: state.enemy.hp,
      maxHP: state.enemy.derived.maxHP,
      position: state.enemy.position
    }
  }
});

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
  <section class="panel map-panel" aria-label="7x7 고정 맵">
    <h2>7x7 고정 맵</h2>
    <div class="map-grid">
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
        <p class="muted">아이템 사용/판매는 정비 단계에서만 가능합니다. 전투 중 아이템 행동과는 아직 연결하지 않습니다.</p>
        ${
          state.inventory.length === 0
            ? '<p class="muted">보유 아이템이 없습니다.</p>'
            : `<ul class="inventory-list">${state.inventory
                .map(
                  (item) => `
                    <li>
                      <span>${item.name}${item.grade ? ` / ${item.grade}` : ''} · 판매가 ${item.sell ?? 0}코인</span>
                      <span class="inline-actions">
                        <button type="button" data-use-item="${item.id}" ${maintenanceDisabled}>사용</button>
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

const renderReactionPanel = (state: GameState): string => {
  if (state.phase !== 'player-reaction') {
    return '';
  }

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
      <div class="save-grid">
        <button type="button" data-save="save">저장</button>
        <button type="button" data-save="load">불러오기</button>
      </div>
    </section>
  `;
};

const template = (state: GameState): string => `
  <main class="app-shell">
    <header class="hero">
      <p class="eyebrow">ManRPG 모바일 전투 시트</p>
      <h1>ManRPG PWA AI</h1>
      <p>플레이어 1명과 적 1명이 고정 7x7 맵에서 전투하고, 규칙·판정·보상은 로컬에서 처리합니다.</p>
    </header>

    ${renderTurnStatus(state)}
    ${renderStatAllocationPanel(state)}
    ${renderLevelUpAllocationPanel(state)}
    ${renderMap(state)}

    <section class="status-grid">
      ${renderCharacterCard(state.player)}
      ${renderCharacterCard(state.enemy)}
    </section>

    <section class="panel minimap">
      <h2>미니맵 요약</h2>
      <p>${getMinimapSummary(state)}</p>
    </section>

    ${renderFloorClearPanel(state)}
    ${renderRewardPanel(state)}
    ${renderShopPanel(state)}
    ${renderInventorySummary(state)}
    ${renderKnownSpells(state)}
    ${renderBattleItems(state)}
    ${renderReactionPanel(state)}
    ${renderActionQueue(state)}
    ${renderActionButtons(state)}
    ${renderAISettings()}
    ${renderDebugPanel()}
    ${renderLog(state)}
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
    const addSpellId = target.dataset.addSpell;
    const addBattleItemId = target.dataset.addBattleItem;
    const buyShopItemId = target.dataset.buyShopItem;
    const reaction = target.dataset.reaction as 'dodge' | 'guard' | 'counter' | 'none' | undefined;
    const debugAction = target.dataset.debugAction;

    const logError = (error: unknown): void => {
      setState(appendLog(getState(), `오류: ${toErrorMessage(error)}`));
    };

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

    if (target.dataset.aiTest !== undefined) {
      try {
        setAISettings(collectAISettings(root));
        const response = await callLLM('narrate', {
          summary: 'AI 연결 테스트',
          delta: { source: 'settings-panel' },
          localResult: '규칙 상태 변경 없음'
        });
        const fallbackUsed = response.ui_tags.includes('fallback');
        const message = fallbackUsed ? 'AI 연결 실패 또는 fallback 사용' : 'AI 연결 성공';

        setAIConnectionStatus(message, fallbackUsed);
        setState(appendAILogs(appendLog(getState(), message), response.narration, response.combat_log));
      } catch (error) {
        setAIConnectionStatus('AI 연결 테스트 오류', true);
        logError(error);
      }
      return;
    }

    if (target.dataset.aiNarrate !== undefined) {
      try {
        const response = await callLLM('narrate', buildNarrationPayload(getState()));
        setState(appendAILogs(getState(), response.narration, response.combat_log));
      } catch (error) {
        logError(error);
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
        setState(appendAILogs(getState(), response.narration, response.combat_log));
      } catch (error) {
        logError(error);
      }
      return;
    }

    if (reaction) {
      setState(resolvePlayerReaction(getState(), reaction));
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
      setState(createRewardOffer(applyFiveLevelPlus(clearFloorRecovery(getState()))));
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
      setState(useInventoryItem(getState(), useItemId));
      return;
    }

    if (sellItemId) {
      setState(sellInventoryItem(getState(), sellItemId));
      return;
    }

    if (buyShopItemId) {
      setState(buyShopItem(getState(), buyShopItemId));
      return;
    }

    if (target.dataset.claimRewards !== undefined) {
      setState(claimSelectedRewards(getState()));
      return;
    }

    if (target.dataset.enterNextFloor !== undefined) {
      setState(enterNextFloor(getState()));
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
      setState(advanceTurn(getState()));
      return;
    }

    if (target.dataset.newBattle !== undefined) {
      const currentState = getState();

      setState(createNewBattleFromPlayer(currentState));
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
