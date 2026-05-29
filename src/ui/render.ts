import { enqueueAction, removeQueuedAction } from '../game/actionQueue';
import { advanceTurn } from '../game/turn';
import { fixedMap } from '../map/fixedMap';
import { getMinimapSummary } from '../map/minimap';
import { getDirectionLabel } from '../game/movement';
import { loadGameStub, saveGameStub } from '../storage/save';
import type { Character, Direction, GameState, QueuedAction } from '../state/gameState';
import { appendLog } from '../state/gameState';
import { renderAISettings } from './aiSettings';

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
  'player-reaction': '플레이어 반응턴(TODO)',
  'enemy-main': '적 메인턴',
  'enemy-reaction': '적 반응턴(TODO)',
  'battle-ended': '전투 종료'
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

const renderCharacterCard = (character: Character): string => `
  <section class="panel character ${character.kind}">
    <h2>${character.kind === 'player' ? '플레이어 상태' : '적 상태'}</h2>
    <strong>${character.name}</strong>
    <dl>
      <div><dt>HP</dt><dd>${character.hp} / ${character.derived.maxHP}</dd></div>
      <div><dt>MP</dt><dd>${character.mp} / ${character.derived.maxMP}</dd></div>
      <div><dt>민첩</dt><dd>${character.stats.dexterity}</dd></div>
      <div><dt>평타</dt><dd>${character.derived.basicAtk}</dd></div>
      <div><dt>MP 회복</dt><dd>${character.derived.mpRegen}</dd></div>
      <div><dt>좌표</dt><dd>${character.position.x + 1}, ${character.position.y + 1}</dd></div>
    </dl>
  </section>
`;

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
    <ol>
      ${state.log.slice(-20).map((entry) => `<li><span>턴 ${entry.turn}</span>${entry.message}</li>`).join('')}
    </ol>
  </section>
`;

const renderTurnStatus = (state: GameState): string => `
  <section class="panel turn-status">
    <h2>턴 상태</h2>
    <p>현재 phase: <strong>${phaseLabels[state.phase]}</strong></p>
    <p>현재 turnOwner: <strong>${state.turnOwner === 'player' ? '플레이어' : '적'}</strong></p>
    <p>선공: <strong>${state.initiative === 'player' ? '플레이어' : '적'}</strong></p>
    ${state.battleResult ? `<p>결과: <strong>${state.battleResult === 'win' ? '승리' : '패배'}</strong></p>` : ''}
  </section>
`;

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
  const disabled = state.phase !== 'player-main' ? 'disabled' : '';

  return `
    <section class="panel actions">
      <h2>행동 추가</h2>
      <p class="muted">버튼은 즉시 실행하지 않고 큐에 쌓입니다. 턴 마무리 시 순서대로 실행됩니다.</p>
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
      <button type="button" class="finish-button" data-finish-turn ${state.phase === 'battle-ended' ? 'disabled' : ''}>턴 마무리</button>
      ${state.phase === 'enemy-main' ? '<p class="muted">적 메인턴입니다. 턴 마무리를 누르면 적이 이동하거나 공격합니다.</p>' : ''}
      <div class="save-grid">
        <button type="button" data-save="save">저장 stub</button>
        <button type="button" data-save="load">불러오기 stub</button>
      </div>
    </section>
  `;
};

const template = (state: GameState): string => `
  <main class="app-shell">
    <header class="hero">
      <p class="eyebrow">Local-first PWA scaffold</p>
      <h1>ManRPG PWA AI</h1>
      <p>규칙·판정·전투·보상·미니맵은 로컬 TypeScript에서 처리하고, AI는 서술 보조 stub으로만 유지합니다.</p>
    </header>

    ${renderTurnStatus(state)}
    ${renderMap(state)}

    <section class="status-grid">
      ${renderCharacterCard(state.player)}
      ${renderCharacterCard(state.enemy)}
    </section>

    <section class="panel minimap">
      <h2>미니맵 요약</h2>
      <p>${getMinimapSummary(state)}</p>
    </section>

    ${renderActionQueue(state)}
    ${renderActionButtons(state)}
    ${renderAISettings()}
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
  root.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const addAction = target.dataset.addAction as QueuedAction['type'] | undefined;
    const removeActionId = target.dataset.removeAction;
    const saveAction = target.dataset.save;

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

    if (saveAction === 'save') {
      setState(appendLog(getState(), saveGameStub(getState())));
    }

    if (saveAction === 'load') {
      setState(appendLog(loadGameStub(), '불러오기 stub: localStorage에서 검증된 상태를 읽었습니다. 깨진 데이터면 초기 상태로 복구됩니다.'));
    }
  });
};
