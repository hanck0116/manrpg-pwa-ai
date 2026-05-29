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

export const castSpellStub = (): SpellResult => ({
  ok: false,
  message: '마법 전투 시전 효과는 아직 TODO입니다. 이번 단계에서는 마법서 사용으로 마법 습득까지만 구현합니다.'
});
