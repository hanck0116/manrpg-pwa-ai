import { calcDerivedStats, type DerivedStats } from '../rules/derivedStats';

export type Position = {
  x: number;
  y: number;
};

export type Direction = 'up' | 'down' | 'left' | 'right';

export type CoreStats = {
  level: number;
  strength: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  dexterity: number;
  appearance: number;
  outerStack: number;
  innerStack: number;
  swordKi: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  multicasting: number;
  traits: string[];
  coin: number;
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

export type QueuedAction = {
  id: string;
  type: 'move' | 'basic-attack' | 'skill' | 'spell' | 'item' | 'defend' | 'wait';
  label: string;
  direction?: Direction;
  steps?: number;
};

export type BattlePhase =
  | 'player-main'
  | 'player-reaction'
  | 'enemy-main'
  | 'enemy-reaction'
  | 'floor-cleared'
  | 'reward-pending'
  | 'level-up-pending'
  | 'battle-ended';
export type TurnOwner = 'player' | 'enemy';
export type BattleResult = 'win' | 'lose';

export type GameLogEntry = {
  turn: number;
  message: string;
};

export type RewardItem = {
  id: string;
  name: string;
  type: 'coin' | 'martial' | 'magicBook' | 'multi' | 'reset' | 'trait' | 'special' | 'item';
  coin?: number;
  grade?: string;
  sell?: number;
  mode?: 'random' | 'select';
  learnedSpellName?: string;
  learnedCircle?: number;
};

export type LearnedSpell = {
  id: string;
  name: string;
  circle: number;
  grade: string;
  sourceItemName?: string;
};

export type RewardState = {
  offered: RewardItem[];
  selectedIds: string[];
  offerCount: number;
  pickCount: number;
  claimed: boolean;
};

export type GameState = {
  setupMode: boolean;
  levelUpPending: boolean;
  turn: number;
  floor: number;
  player: Character;
  enemy: Character;
  log: GameLogEntry[];
  selectedAction: string;
  phase: BattlePhase;
  initiative: TurnOwner;
  actionQueue: QueuedAction[];
  turnOwner: TurnOwner;
  rewardState?: RewardState;
  inventory: RewardItem[];
  spells: LearnedSpell[];
  battleResult?: BattleResult;
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

const getInitialInitiative = (player: Character, enemy: Character): TurnOwner =>
  enemy.stats.dexterity > player.stats.dexterity ? 'enemy' : 'player';

export const createInitialEnemy = (): Character =>
  createCharacter({
    id: 'enemy-1',
    name: '훈련용 고블린',
    kind: 'enemy',
    position: { x: 3, y: 1 },
    stats: {
      level: 1,
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      appearance: 1,
      outerStack: 0,
      innerStack: 0,
      swordKi: 0,
      multicasting: 1,
      traits: [],
      coin: 0
    }
  });

export const createInitialGameState = (): GameState => {
  const player = createCharacter({
    id: 'player-1',
    name: '새 캐릭터',
    kind: 'player',
    position: { x: 3, y: 5 },
    stats: {
      level: 1,
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      appearance: 1,
      outerStack: 0,
      innerStack: 0,
      swordKi: 0,
      multicasting: 1,
      traits: [],
      coin: 0
    }
  });
  const enemy = createInitialEnemy();
  const initiative = getInitialInitiative(player, enemy);

  return {
    setupMode: true,
    levelUpPending: false,
    floor: 1,
    turn: 1,
    player,
    enemy,
    log: [
      {
        turn: 1,
        message: `고정 7x7 맵에 플레이어 1명과 적 1명이 배치되었습니다. 캐릭터 생성에서 총 스탯 60이 되도록 54포인트를 분배하세요. 선턴: ${initiative === 'player' ? '플레이어' : '적'}`
      }
    ],
    selectedAction: '대기',
    phase: initiative === 'player' ? 'player-main' : 'enemy-main',
    initiative,
    actionQueue: [],
    turnOwner: initiative,
    rewardState: undefined,
    inventory: [],
    spells: []
  };
};

export const appendLog = (state: GameState, message: string): GameState => ({
  ...state,
  log: [...state.log.slice(-19), { turn: state.turn, message }]
});
