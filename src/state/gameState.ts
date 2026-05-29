import { calcDerivedStats, type DerivedStats } from '../rules/derivedStats';

export type Position = {
  x: number;
  y: number;
};

export type CoreStats = {
  level: number;
  strength: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  dexterity: number;
};

export type Character = {
  id: string;
  name: string;
  kind: 'player' | 'enemy';
  position: Position;
  stats: CoreStats;
  derived: DerivedStats;
  hp: number;
  mp: number;
  guarding: boolean;
};

export type GameLogEntry = {
  turn: number;
  message: string;
};

export type GameState = {
  turn: number;
  player: Character;
  enemy: Character;
  log: GameLogEntry[];
  selectedAction: string;
};

export const createCharacter = (
  character: Omit<Character, 'derived' | 'hp' | 'mp' | 'guarding'>
): Character => {
  const derived = calcDerivedStats(character.stats);

  return {
    ...character,
    derived,
    hp: derived.maxHP,
    mp: derived.maxMP,
    guarding: false
  };
};

export const createInitialGameState = (): GameState => ({
  turn: 1,
  player: createCharacter({
    id: 'player-1',
    name: '탐험자',
    kind: 'player',
    position: { x: 3, y: 5 },
    stats: {
      level: 1,
      strength: 12,
      constitution: 12,
      intelligence: 8,
      wisdom: 8,
      dexterity: 10
    }
  }),
  enemy: createCharacter({
    id: 'enemy-1',
    name: '훈련용 고블린',
    kind: 'enemy',
    position: { x: 3, y: 1 },
    stats: {
      level: 1,
      strength: 8,
      constitution: 8,
      intelligence: 4,
      wisdom: 4,
      dexterity: 6
    }
  }),
  log: [
    {
      turn: 1,
      message: '고정 7x7 맵에 플레이어 1명과 적 1명이 배치되었습니다.'
    }
  ],
  selectedAction: '대기'
});

export const appendLog = (state: GameState, message: string): GameState => ({
  ...state,
  log: [...state.log.slice(-19), { turn: state.turn, message }]
});
