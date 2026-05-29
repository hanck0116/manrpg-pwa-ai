import { createInitialGameState, type GameState } from './state/gameState';
import { bindUI, render } from './ui/render';
import './styles.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('App root not found');
}

let state: GameState = createInitialGameState();

const getState = (): GameState => state;
const setState = (nextState: GameState): void => {
  state = nextState;
  render(root, state);
};

render(root, state);
bindUI(root, getState, setState);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // PWA registration is best-effort in the scaffold.
    });
  });
}
