import type { GameState, HaloKind } from '../state/gameState';

export const HALO_KINDS: HaloKind[] = [
  'amplification',
  'extinction',
  'birth',
  'fusion',
  'decomposition',
  'existence',
  'achievement',
  'desire',
  'satan'
];

const labels: Record<HaloKind, string> = {
  amplification: '증폭',
  extinction: '소멸',
  birth: '탄생',
  fusion: '결합',
  decomposition: '분해',
  existence: '존재',
  achievement: '성취',
  desire: '욕망',
  satan: '사탄'
};

const descriptions: Record<HaloKind, string> = {
  amplification: '한 가지 행동을 무한히 증폭시킨다. 층당 1번 사용 가능하며 수치 무한대 대신 안전한 최대 결과로 처리합니다.',
  extinction: '인지를 가진 생명체를 제외한 모든 것을 소멸시킨다. 층당 1번 사용 가능합니다.',
  birth: '원하는 물건을 창조한다. 제약 없음. 층당 1번 사용 가능합니다.',
  fusion: '원하는 두 가지 기술을 결합시켜 1회성 기술로 사용합니다.',
  decomposition: '반응턴에 상대의 기술을 지능 판정으로 마나로 분해해 흡수합니다. 사용 시 그 반응턴 행동 기회를 소모합니다.',
  existence: '존재를 이끌어 낸다. 1차 구현은 로그와 수동 판정 기록으로 처리합니다.',
  achievement: '바라본 모든 마법을 습득합니다. observedSpells에 기록된 마법만 대상입니다.',
  desire: '결과를 끌어온다. 결과의 크기에 따라 행동 불능 상태를 남깁니다.',
  satan: '선택형 패시브. 힘/민첩/체력 +10, 상대의 입천과 헤일로 무시 플래그를 제공합니다.'
};

const floorLimited = new Set<HaloKind>(['amplification', 'extinction', 'birth']);

export const getHaloLabel = (kind: HaloKind): string => labels[kind];
export const getHaloDescription = (kind: HaloKind): string => descriptions[kind];

export const hasHaloAccess = (state: GameState): boolean =>
  state.player.stats.traits.includes('헤일로') ||
  state.techniqueSources.includes('헤일로') ||
  state.skills.some((skill) => skill.source === '헤일로' || skill.source === 'halo') ||
  state.techniques.some((technique) => technique.source === '헤일로' || technique.source.startsWith('halo:'));

export const canUseHalo = (state: GameState, kind: HaloKind): { ok: boolean; message: string } => {
  if (!HALO_KINDS.includes(kind)) return { ok: false, message: '알 수 없는 헤일로입니다.' };
  if (!hasHaloAccess(state)) return { ok: false, message: '헤일로를 보유하지 않았습니다.' };
  if (state.halo.selectedKind !== kind) return { ok: false, message: `${getHaloLabel(kind)} 헤일로를 먼저 선택해야 합니다.` };
  if (kind === 'satan') return { ok: true, message: '사탄 헤일로는 선택형 패시브입니다.' };
  if (floorLimited.has(kind) && state.halo.usedThisFloor[kind]) return { ok: false, message: `${getHaloLabel(kind)} 헤일로는 이번 층에서 이미 사용했습니다.` };
  if (kind === 'decomposition' && state.phase !== 'player-reaction') return { ok: false, message: '분해 헤일로는 플레이어 반응턴에서만 사용할 수 있습니다.' };
  return { ok: true, message: `${getHaloLabel(kind)} 헤일로를 사용할 수 있습니다.` };
};

export const markHaloUsedThisFloor = (state: GameState, kind: HaloKind): GameState => ({
  ...state,
  halo: {
    ...state.halo,
    usedThisFloor: {
      ...state.halo.usedThisFloor,
      [kind]: true
    }
  }
});

export const resetHaloFloorUses = (state: GameState): GameState => ({
  ...state,
  halo: {
    ...state.halo,
    usedThisFloor: {},
    pendingAmplification: undefined
  }
});
