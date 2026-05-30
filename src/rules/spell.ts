export type MagicBookGrade = '기초' | '중급' | '고급' | '마도서';

export type SpellCircle = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type SpellDefinition = {
  name: string;
  circle: SpellCircle;
  grade: MagicBookGrade;
};

export type MagicBookConfig = {
  circles: SpellCircle[];
  difficulty: number;
};

export type TryLearnMagicBookResult = {
  success: boolean;
  roll?: number;
  difficulty: number;
  spell?: SpellDefinition;
  keepBookOnFail: true;
  message: string;
};

export type SpellResult = {
  ok: boolean;
  message: string;
};

export type SpellCategory =
  | 'single'
  | 'singleHigh'
  | 'smallArea'
  | 'area'
  | 'defense'
  | 'heal'
  | 'summon'
  | 'utility'
  | 'other';

export type SpellDescription = {
  category: SpellCategory;
  rangeText: string;
  manaCost: number;
  power: number;
};

export const SPELL_MP: Record<SpellCircle, number> = {
  1: 50,
  2: 80,
  3: 120,
  4: 180,
  5: 260,
  6: 380,
  7: 520,
  8: 700,
  9: 900
};

export const UTILITY_SPELLS = [
  '라이트',
  '그리스',
  '디그',
  '다크니스',
  '슬립',
  '캔슬레이션',
  '웹',
  '메모라이즈',
  '블라인드',
  '슬로우',
  '사일런스',
  '일루젼',
  '컨퓨전',
  '인비저빌리티',
  '디스토션',
  '블링크',
  '텔레포트',
  '워프',
  '컨트롤 웨더',
  '매스 텔레포트',
  '워프 게이트'
];

export const DEFENSE_SPELLS = [
  '쉴드',
  '샤이닝 디펜스',
  '배리어',
  '안티 매직 쉘',
  '그레이트 쉴드',
  '리플렉션',
  '앱솔루트 쉴드'
];

export const HEAL_SPELLS = ['힐', '그레이트 힐', '라이프 드레인'];

export const AREA_SPELLS = [
  '샤이닝 웨이브',
  '샤이닝 필드',
  '익스플로전',
  '체인 라이트닝',
  '파이어 월',
  '다크 필드',
  '토네이도',
  '인페르노',
  '블리자드',
  '어스 퀘이크',
  '윈드 스톰',
  '샤이닝 레인',
  '볼케이노',
  '아이스 크리스탈 오브 스톰',
  '퓨리 오브 더 헤븐',
  '라이트닝 인피니티',
  '헬파이어',
  '메테오 스웜',
  '라이트닝 월드',
  '루인 오브 그라운드',
  '엘리멘탈 퍼니시먼트',
  '네크로폴리스'
];

export const SMALL_AREA_SPELLS = ['파이어 볼', '아이스 볼', '에어로 봄', '다크 볼'];

export const SINGLE_HIGH_SPELLS = [
  '레이져',
  '샤이닝 레이져',
  '다크 캐논',
  '메테오 스트라이크',
  '파워 워드 킬',
  '앱솔루트 제로 포인트'
];

export const SPELLS: Record<SpellCircle, string[]> = {
  1: ['라이트', '파이어', '아이스', '윈드', '매직 애로우', '그리스', '디그', '다크니스'],
  2: ['샤이닝 에로우', '파이어 애로우', '아이스 애로우', '윈드 애로우', '록 애로우', '라이트닝 애로우', '쉴드', '힐', '아이스 포그', '다크 애로우'],
  3: ['샤이닝 디펜스', '파이어 볼', '아이스 볼', '윈드 커터', '스톤 스파이크', '라이데인', '슬립', '캔슬레이션', '본 바인딩', '다크 볼', '웹', '메모라이즈'],
  4: ['샤이닝 웨이브', '샤이닝 인첸트', '샤이닝 블레스터', '파이어 랜스', '아이스 스피어', '에어로 봄', '어스 브레이크', '블라인드', '슬로우', '사일런스', '일루젼', '컨퓨전'],
  5: ['인비저빌리티', '디스토션', '샤이닝 필드', '레이져', '배리어', '익스플로전', '체인 라이트닝', '파이어 월', '블링크', '그래비티', '다크 필드', '라이프 드레인'],
  6: ['샤이닝 레이져', '서먼 샤이닝', '안티 매직 쉘', '필라 오브 파이어', '기가 라이데인', '토네이도', '디스펠', '그레이트 쉴드', '텔레포트', '그레이트 힐', '다크 캐논', '서먼 본 와이번'],
  7: ['샤이닝 저지먼트', '헤븐스 도어', '인페르노', '블리자드', '어스 퀘이크', '윈드 스톰', '워프', '리플렉션', '그래비티', '서먼 데스나이트'],
  8: ['소드 오브 리벤지 라이트', '샤이닝 레인', '볼케이노', '아이스 크리스탈 오브 스톰', '퓨리 오브 더 헤븐', '라이트닝 인피니티', '컨트롤 웨더', '매스 텔레포트', '헬파이어', '서먼 본 드래곤'],
  9: ['메테오 스트라이크', '메테오 스웜', '앱솔루트 제로 포인트', '라이트닝 월드', '루인 오브 그라운드', '엘리멘탈 퍼니시먼트', '앱솔루트 쉴드', '워프 게이트', '파워 워드 킬', '네크로폴리스']
};

export const MAGIC_BOOK_GRADE_CONFIG: Record<MagicBookGrade, MagicBookConfig> = {
  기초: { circles: [1, 2], difficulty: 50 },
  중급: { circles: [3, 4], difficulty: 70 },
  고급: { circles: [5, 6], difficulty: 100 },
  마도서: { circles: [7, 8, 9], difficulty: 100 }
};

const isMagicBookGrade = (grade: string): grade is MagicBookGrade =>
  grade === '기초' || grade === '중급' || grade === '고급' || grade === '마도서';

const pickRandom = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const gradeForCircle = (circle: SpellCircle): MagicBookGrade => {
  if (circle <= 2) return '기초';
  if (circle <= 4) return '중급';
  if (circle <= 6) return '고급';
  return '마도서';
};

export const getMagicBookConfig = (grade: string): MagicBookConfig =>
  MAGIC_BOOK_GRADE_CONFIG[isMagicBookGrade(grade) ? grade : '기초'];

export const rollSpellFromGrade = (grade: string): SpellDefinition => {
  const config = getMagicBookConfig(grade);
  const circle = pickRandom(config.circles);
  const name = pickRandom(SPELLS[circle]);

  return {
    name,
    circle,
    grade: isMagicBookGrade(grade) ? grade : gradeForCircle(circle)
  };
};

export const tryLearnMagicBook = (wisdom: number, grade: string): TryLearnMagicBookResult => {
  const config = getMagicBookConfig(grade);
  const difficulty = config.difficulty;
  const safeWisdom = Math.floor(wisdom);
  const spell = rollSpellFromGrade(grade);

  if (safeWisdom >= difficulty) {
    return {
      success: true,
      difficulty,
      spell,
      keepBookOnFail: true,
      message: `${spell.name} ${spell.circle}서클 습득 성공: 지혜 ${safeWisdom}이 난이도 ${difficulty} 이상이라 자동 성공했습니다.`
    };
  }

  const roll = Math.floor(Math.random() * difficulty) + 1;
  const success = roll < safeWisdom;

  if (success) {
    return {
      success: true,
      roll,
      difficulty,
      spell,
      keepBookOnFail: true,
      message: `${spell.name} ${spell.circle}서클 습득 성공: 1d${difficulty}=${roll} < 지혜 ${safeWisdom}.`
    };
  }

  return {
    success: false,
    roll,
    difficulty,
    keepBookOnFail: true,
    message: `마법서 습득 실패: 1d${difficulty}=${roll}, 지혜 ${safeWisdom}. 마법서는 사라지지 않습니다.`
  };
};

export const spellCategory = (name: string): SpellCategory => {
  if (UTILITY_SPELLS.includes(name)) return 'utility';
  if (DEFENSE_SPELLS.includes(name)) return 'defense';
  if (HEAL_SPELLS.includes(name)) return 'heal';
  if (name.startsWith('서먼')) return 'summon';
  if (AREA_SPELLS.includes(name)) return 'area';
  if (SMALL_AREA_SPELLS.includes(name)) return 'smallArea';
  if (SINGLE_HIGH_SPELLS.includes(name)) return 'singleHigh';

  return 'single';
};

export const spellRangeText = (category: SpellCategory): string => {
  switch (category) {
    case 'singleHigh':
      return '단일 고집중';
    case 'single':
      return '단일';
    case 'smallArea':
      return '소범위';
    case 'area':
      return '광역';
    case 'defense':
      return '방어';
    case 'heal':
      return '회복';
    case 'summon':
      return '소환';
    case 'utility':
      return '기능';
    case 'other':
      return '기타';
  }
};

export const spellPowerRatio = (circle: number, category: SpellCategory): number => {
  const base = Math.min(1, (circle + 0.2) / 6);
  const categoryMultiplier: Record<SpellCategory, number> = {
    singleHigh: 1,
    single: 0.86,
    smallArea: 0.68,
    area: 0.45,
    defense: 0.8,
    heal: 0.72,
    summon: 0.6,
    utility: 0.35,
    other: 0.7
  };

  return Math.min(1, base * categoryMultiplier[category]);
};

export const spellPower = (mp: number, circle: number, category: SpellCategory): number =>
  Math.min(mp, Math.max(1, Math.floor(mp * spellPowerRatio(circle, category))));

export const spellManaCost = (circle: number, category: SpellCategory): number => {
  const safeCircle = Math.min(9, Math.max(1, Math.floor(circle))) as SpellCircle;
  const base = SPELL_MP[safeCircle];
  const categoryCostMultiplier: Record<SpellCategory, number> = {
    singleHigh: 1,
    single: 0.95,
    smallArea: 1.05,
    area: 1.15,
    defense: 0.95,
    heal: 1,
    summon: 1.15,
    utility: 0.8,
    other: 1
  };

  return Math.max(1, Math.round(base * categoryCostMultiplier[category]));
};

export const describeSpell = (name: string, circle: number): SpellDescription => {
  const category = spellCategory(name);
  const manaCost = spellManaCost(circle, category);

  return {
    category,
    rangeText: spellRangeText(category),
    manaCost,
    power: spellPower(manaCost, circle, category)
  };
};

export const castSpellStub = (): SpellResult => ({
  ok: false,
  message: '마법 전투 시전 효과는 아직 TODO입니다. 이번 단계에서는 마법서 사용으로 마법 습득까지만 구현합니다.'
});
