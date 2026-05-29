import { applyPlayerAction, type PlayerAction } from '../game/turn';
import { fixedMap } from '../map/fixedMap';
import { getMinimapSummary } from '../map/minimap';
import { loadGameStub, saveGameStub } from '../storage/save';
import type { Character, GameState } from '../state/gameState';
import { appendLog } from '../state/gameState';
import { renderAISettings } from './aiSettings';

const actions: { action: PlayerAction; label: string }[] = [
  { action: 'move', label: '이동' },
  { action: 'basic-attack', label: '기본 공격' },
  { action: 'skill', label: '스킬' },
  { action: 'spell', label: '마법' },
  { action: 'item', label: '아이템' },
  { action: 'defend', label: '방어' },
  { action: 'wait', label: '대기' },
  { action: 'end-turn', label: '턴 마무리' }
];

const renderCharacterCard = (character: Character): string => `
  <section class="panel character ${character.kind}">
    <h2>${character.kind === 'player' ? '플레이어 상태' : '적 상태'}</h2>
    <strong>${character.name}</strong>
    <dl>
      <div><dt>HP</dt><dd>${character.hp} / ${character.derived.maxHP}</dd></div>
      <div><dt>MP</dt><dd>${character.mp} / ${character.derived.maxMP}</dd></div>
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
          const hasPlayer = state.player.position.x === tile.x && state.player.position.y === tile.y;
          const hasEnemy = state.enemy.position.x === tile.x && state.enemy.position.y === tile.y;
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
      ${state.log.map((entry) => `<li><span>턴 ${entry.turn}</span>${entry.message}</li>`).join('')}
    </ol>
  </section>
`;

const renderActionButtons = (): string => `
  <section class="panel actions">
    <h2>행동</h2>
    <div class="action-grid">
      ${actions.map(({ action, label }) => `<button type="button" data-action="${action}">${label}</button>`).join('')}
    </div>
    <div class="save-grid">
      <button type="button" data-save="save">저장 stub</button>
      <button type="button" data-save="load">불러오기 stub</button>
    </div>
  </section>
`;

const template = (state: GameState): string => `
  <main class="app-shell">
    <header class="hero">
      <p class="eyebrow">Local-first PWA scaffold</p>
      <h1>ManRPG PWA AI</h1>
      <p>규칙·판정·전투·보상·미니맵은 로컬 TypeScript에서 처리하고, AI는 서술 보조로만 사용하는 1차 골격입니다.</p>
    </header>

    ${renderMap(state)}

    <section class="status-grid">
      ${renderCharacterCard(state.player)}
      ${renderCharacterCard(state.enemy)}
    </section>

    <section class="panel minimap">
      <h2>미니맵 요약</h2>
      <p>${getMinimapSummary(state)}</p>
    </section>

    ${renderActionButtons()}
    ${renderAISettings()}
    ${renderLog(state)}
  </main>
`;

export const render = (root: HTMLElement, state: GameState): void => {
  root.innerHTML = template(state);
};

export const bindUI = (root: HTMLElement, getState: () => GameState, setState: (state: GameState) => void): void => {
  root.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement)) {
      return;
    }

    const action = target.dataset.action as PlayerAction | undefined;
    const saveAction = target.dataset.save;

    if (action) {
      setState(applyPlayerAction(getState(), action));
    }

    if (saveAction === 'save') {
      setState(appendLog(getState(), saveGameStub(getState())));
    }

    if (saveAction === 'load') {
      setState(appendLog(loadGameStub(), '불러오기 stub: localStorage에서 상태를 읽었습니다.'));
    }
  });
};
