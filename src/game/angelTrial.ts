import { angelRewardToRewardItem, getUnclaimedAngelRewards } from '../rules/angelTrial';
import { appendLog, type GameState, type RewardItem } from '../state/gameState';
import { refreshPlayer } from './characterUpdate';

const applyAngelScore = (state: GameState, rawScore: number, prefix: string): GameState => {
  if (!Number.isFinite(rawScore) || rawScore < 0 || !Number.isInteger(rawScore)) {
    return appendLog(
      {
        ...state,
        angelTrial: {
          ...state.angelTrial,
          lastResult: '천사의 시련 실패: 시련값은 0 이상 정수여야 합니다.'
        }
      },
      '천사의 시련 실패: 시련값은 0 이상 정수여야 합니다.'
    );
  }

  const score = rawScore;
  const freshRewards = getUnclaimedAngelRewards(score, state.angelTrial.claimedScores);

  if (freshRewards.length === 0) {
    const lastResult = `${prefix}: 신규 보상 없음`;
    return appendLog(
      {
        ...state,
        angelTrial: {
          ...state.angelTrial,
          lastScore: score,
          lastResult
        }
      },
      '천사의 시련: 신규 보상 없음'
    );
  }

  let nextCoin = state.player.stats.coin;
  const gainedItems: RewardItem[] = [];

  for (const reward of freshRewards) {
    const converted = angelRewardToRewardItem(reward);

    if (Array.isArray(converted)) {
      gainedItems.push(...converted);
    } else if ('coin' in converted) {
      nextCoin += converted.coin ?? 0;
    } else {
      gainedItems.push(converted);
    }
  }

  const gainedList = freshRewards.map((reward) => `${reward.score}: ${reward.name}`);
  const lastResult = `${prefix}\n신규 획득 보상:\n- ${gainedList.join('\n- ')}`;
  const claimedScores = Array.from(new Set([...state.angelTrial.claimedScores, ...freshRewards.map((reward) => reward.score)])).sort((a, b) => a - b);

  const next = refreshPlayer({
    ...state,
    player: {
      ...state.player,
      stats: {
        ...state.player.stats,
        coin: nextCoin
      }
    },
    inventory: [...state.inventory, ...gainedItems],
    angelTrial: {
      claimedScores,
      lastScore: score,
      lastResult
    }
  });

  return appendLog(next, `천사의 시련 신규 보상 ${freshRewards.length}개 획득: ${gainedList.join(', ')}`);
};

export const runAngelTrialWithAttack = (state: GameState): GameState =>
  applyAngelScore(state, Math.floor(state.player.derived.attack), `천사의 시련 기본 공격값: ${Math.floor(state.player.derived.attack)}`);

export const runAngelTrialWithManualScore = (state: GameState, score: number): GameState =>
  applyAngelScore(state, score, `천사의 시련 직접값: ${score}`);

export const resetAngelTrialClaims = (state: GameState): GameState =>
  appendLog(
    {
      ...state,
      angelTrial: {
        claimedScores: [],
        lastResult: '천사의 시련 획득 기록 초기화'
      }
    },
    '천사의 시련 획득 기록 초기화'
  );
