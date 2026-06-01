import { makeItem } from '../rules/reward';
import { appendLog, type GameState, type RewardItem } from '../state/gameState';
import { refreshPlayer } from './characterUpdate';

const traitChoices = [
  '모델링',
  '공법',
  '무공',
  '시분할',
  '극기',
  '심법',
  '오리지널 스킬',
  '임모탈 평선',
  '유물',
  '하급 정령',
  '연혼염',
  '자기상환적 돌연변이',
  '삼매경',
  '접기',
  '심적초월',
  '신적초월',
  '중급 정령',
  '흑염의 영체화',
  '상급 정령',
  '빙백연혼',
  '원영',
  '금강불괴의 정신',
  '정령왕',
  '헤일로',
  '입천',
  '스키마: 회복력 강화',
  '스키마: 근력 강화',
  '스키마: 속도강화',
  '앙케 라'
];

export const isTraitChoice = (choice: string): boolean => traitChoices.includes(choice);

export const getTraitRestrictionReason = (trait: string, traits: string[]): string => {
  if (trait === '중급 정령' && !traits.includes('하급 정령')) return '하급 정령이 없으면 중급 정령을 선택할 수 없음';
  if (trait === '상급 정령' && !traits.includes('중급 정령')) return '중급 정령이 없으면 상급 정령을 선택할 수 없음';
  if (trait === '정령왕' && !(traits.includes('하급 정령') && traits.includes('중급 정령') && traits.includes('상급 정령'))) {
    return '모든 정령이 없으면 정령왕을 선택할 수 없음';
  }

  return '';
};

export const addTraitIfAllowed = (state: GameState, trait: string): { state: GameState; applied: boolean; message: string } => {
  const reason = getTraitRestrictionReason(trait, state.player.stats.traits);

  if (reason) {
    return { state, applied: false, message: reason };
  }

  if (state.player.stats.traits.includes(trait)) {
    return { state, applied: true, message: '이미 보유한 특성입니다.' };
  }

  const next = refreshPlayer({
    ...state,
    player: {
      ...state.player,
      stats: {
        ...state.player.stats,
        traits: [...state.player.stats.traits, trait]
      }
    }
  });

  return { state: next, applied: true, message: `${trait} 특성을 획득했습니다.` };
};

const removeSourceItem = (state: GameState, sourceItemId: string): GameState => ({
  ...state,
  inventory: state.inventory.filter((item) => item.id !== sourceItemId)
});

const choiceToItem = (choice: string): RewardItem => makeItem(choice);

export const applyChoiceItemResult = (state: GameState, sourceItemId: string, sourceItemName: string, choice: string): GameState => {
  const baseLog = `${sourceItemName}: ${choice}을 선택했습니다.`;
  const restriction = getTraitRestrictionReason(choice, state.player.stats.traits);

  if (restriction) {
    return appendLog(state, restriction);
  }

  let next = removeSourceItem(state, sourceItemId);
  let applyMessage = '';

  if (choice === '50코인') {
    next = refreshPlayer({
      ...next,
      player: {
        ...next.player,
        stats: {
          ...next.player.stats,
          coin: next.player.stats.coin + 50
        }
      }
    });
    applyMessage = '50코인을 획득했습니다.';
  } else if (choice === '스키마') {
    next = {
      ...next,
      inventory: [
        ...next.inventory,
        {
          ...makeItem('스키마 효과 선택권'),
          type: 'choice',
          choices: ['스키마: 회복력 강화', '스키마: 근력 강화', '스키마: 속도강화']
        }
      ]
    };
    applyMessage = '스키마 효과 선택권을 인벤토리에 추가했습니다.';
  } else if (isTraitChoice(choice)) {
    const applied = addTraitIfAllowed(next, choice);
    next = applied.state;
    applyMessage = applied.message;
  } else {
    const item = choiceToItem(choice);
    next = {
      ...next,
      inventory: [...next.inventory, item]
    };
    applyMessage = `${item.name} 아이템을 인벤토리에 추가했습니다.`;
  }

  return appendLog(next, `${baseLog} ${applyMessage}`);
};
