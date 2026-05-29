---
이름: 새 캐릭터
구분: 플레이어
레벨: 1
포인트: 54
코인: 0
힘: 1
민첩: 1
체력: 1
지능: 1
지혜: 1
외모: 1
외공: 0
내공: 0
검기: 0
멀티캐스팅: 1
현재HP: 10
현재MP: 15
보유마법: []
스킬목록: []
기술목록: []
장비목록: []
특성목록: []
오리지널마나: ""
보상후보: []
보상선택남음: 0
선택아이템:
선택모드:
기록: "층 클리어: HP/MP 회복, 상태이상 제거, 층당 1회 능력 초기화"
다이스표시: 대기
다이스상세: 버튼을 누르면 여기서 바로 결과가 표시됨
스킬결과: 스킬 사용 결과 대기
기술결과: 기술 사용 결과 대기
마법결과: 마법 사용 결과 대기
시련결과: 천사의 시련 결과 대기
천사획득단계: []
특성결과: 특성 효과 결과 대기
상태결과: "층 클리어: 모든 상태이상 제거"
상태이상: []
임모탈발동: false
자기상환배수: 1
자기상환결과: "층 클리어: 자기상환 배수 초기화"
힘판정보정: 0
민첩판정보정: 0
원영사용됨: false
정령왕사용됨: false
헤일로사용됨: false
헤일로강화준비: false
빙백연혼사용됨: false
편집스킬:
편집기술:
---
# ManRPG 통합 시트

```dataviewjs
const file = app.vault.getAbstractFileByPath(dv.current().file.path);
const cur = dv.current();

const SPELL_MP = {
  1: 50,
  2: 80,
  3: 120,
  4: 180,
  5: 260,
  6: 380,
  7: 520,
  8: 700,
  9: 900,
};

const SPELLS = {
  1: ["라이트", "파이어", "아이스", "윈드", "매직 애로우", "그리스", "디그", "다크니스"],
  2: ["샤이닝 에로우", "파이어 애로우", "아이스 애로우", "윈드 애로우", "록 애로우", "라이트닝 애로우", "쉴드", "힐", "아이스 포그", "다크 애로우"],
  3: ["샤이닝 디펜스", "파이어 볼", "아이스 볼", "윈드 커터", "스톤 스파이크", "라이데인", "슬립", "캔슬레이션", "본 바인딩", "다크 볼", "웹", "메모라이즈"],
  4: ["샤이닝 웨이브", "샤이닝 인첸트", "샤이닝 블레스터", "파이어 랜스", "아이스 스피어", "에어로 봄", "어스 브레이크", "블라인드", "슬로우", "사일런스", "일루젼", "컨퓨전"],
  5: ["인비저빌리티", "디스토션", "샤이닝 필드", "레이져", "배리어", "익스플로전", "체인 라이트닝", "파이어 월", "블링크", "그래비티", "다크 필드", "라이프 드레인"],
  6: ["샤이닝 레이져", "서먼 샤이닝", "안티 매직 쉘", "필라 오브 파이어", "기가 라이데인", "토네이도", "디스펠", "그레이트 쉴드", "텔레포트", "그레이트 힐", "다크 캐논", "서먼 본 와이번"],
  7: ["샤이닝 저지먼트", "헤븐스 도어", "인페르노", "블리자드", "어스 퀘이크", "윈드 스톰", "워프", "리플렉션", "그래비티", "서먼 데스나이트"],
  8: ["소드 오브 리벤지 라이트", "샤이닝 레인", "볼케이노", "아이스 크리스탈 오브 스톰", "퓨리 오브 더 헤븐", "라이트닝 인피니티", "컨트롤 웨더", "매스 텔레포트", "헬파이어", "서먼 본 드래곤"],
  9: ["메테오 스트라이크", "메테오 스웜", "앱솔루트 제로 포인트", "라이트닝 월드", "루인 오브 그라운드", "엘리멘탈 퍼니시먼트", "앱솔루트 쉴드", "워프 게이트", "파워 워드 킬", "네크로폴리스"],
};

const SPELL_DESC = {
  "라이트": "빛을 만들어 어둠을 밝히거나 시야를 교란한다.",
  "파이어": "작은 불꽃을 생성해 태우거나 점화한다.",
  "아이스": "냉기를 일으켜 얼리거나 움직임을 둔화시킨다.",
  "윈드": "바람을 일으켜 밀어내거나 궤도를 흔든다.",
  "매직 애로우": "순수 마나 화살을 날린다.",
  "그리스": "미끄러운 기름막을 만들어 넘어뜨린다.",
  "디그": "흙과 바닥을 파내 지형을 바꾼다.",
  "다크니스": "어둠을 펼쳐 시야를 차단한다.",

  "샤이닝 에로우": "빛의 화살을 쏘아 관통 피해를 준다.",
  "파이어 애로우": "화염 화살로 단일 대상을 공격한다.",
  "아이스 애로우": "냉기 화살로 피해와 둔화를 준다.",
  "윈드 애로우": "압축된 바람 화살로 밀쳐낸다.",
  "록 애로우": "돌 화살을 생성해 타격한다.",
  "라이트닝 애로우": "번개 화살로 빠른 피해를 준다.",
  "쉴드": "마나 방벽을 만들어 공격을 막는다.",
  "힐": "대상의 체력을 회복한다.",
  "아이스 포그": "냉기 안개로 시야와 움직임을 방해한다.",
  "다크 애로우": "어둠의 화살로 생명력을 침식한다.",

  "샤이닝 디펜스": "빛의 방어막으로 피해를 줄인다.",
  "파이어 볼": "폭발하는 화염구를 날린다.",
  "아이스 볼": "냉기 구체로 피해와 결빙을 노린다.",
  "윈드 커터": "날카로운 바람 칼날로 베어낸다.",
  "스톤 스파이크": "땅에서 돌가시를 솟구치게 한다.",
  "라이데인": "벼락을 떨어뜨려 감전 피해를 준다.",
  "슬립": "대상을 잠들게 만든다.",
  "캔슬레이션": "마법 효과를 방해하거나 해제한다.",
  "본 바인딩": "뼈의 속박으로 움직임을 묶는다.",
  "다크 볼": "어둠의 구체로 타격한다.",
  "웹": "거미줄 같은 마나망으로 속박한다.",
  "메모라이즈": "마법 구조를 안정화하거나 기억한다.",

  "샤이닝 웨이브": "빛의 파동을 퍼뜨려 다수에게 영향을 준다.",
  "샤이닝 인첸트": "빛의 힘을 부여해 공격이나 방어를 강화한다.",
  "샤이닝 블레스터": "응축된 빛을 폭발시켜 공격한다.",
  "파이어 랜스": "관통형 화염 창을 생성한다.",
  "아이스 스피어": "냉기 창으로 관통과 결빙을 노린다.",
  "에어로 봄": "압축 공기 폭발을 일으킨다.",
  "어스 브레이크": "지면을 깨뜨려 타격한다.",
  "블라인드": "대상의 시야를 방해한다.",
  "슬로우": "대상의 속도를 낮춘다.",
  "사일런스": "마법 발동을 방해한다.",
  "일루젼": "환영을 만들어 속인다.",
  "컨퓨전": "정신을 흔들어 판단을 흐린다.",

  "인비저빌리티": "모습을 숨겨 은신한다.",
  "디스토션": "공간이나 시야를 왜곡한다.",
  "샤이닝 필드": "빛의 영역을 펼쳐 보호하거나 정화한다.",
  "레이져": "집중된 광선을 발사한다.",
  "배리어": "강한 마나 장벽을 만든다.",
  "익스플로전": "폭발을 일으켜 범위 피해를 준다.",
  "체인 라이트닝": "번개가 여러 대상에게 연쇄된다.",
  "파이어 월": "화염의 벽을 세운다.",
  "블링크": "짧은 거리 순간이동을 한다.",
  "그래비티": "중력을 조작해 움직임을 압박한다.",
  "다크 필드": "어둠의 영역으로 침식과 방해를 준다.",
  "라이프 드레인": "생명력을 흡수한다.",

  "샤이닝 레이져": "고출력 빛 광선을 발사한다.",
  "서먼 샤이닝": "빛의 존재나 구조물을 소환한다.",
  "안티 매직 쉘": "마법을 막는 껍질을 만든다.",
  "필라 오브 파이어": "불기둥을 솟구치게 한다.",
  "기가 라이데인": "강력한 벼락을 떨어뜨린다.",
  "토네이도": "회오리로 광역 피해와 이동 방해를 준다.",
  "디스펠": "강한 마법 효과를 해제한다.",
  "그레이트 쉴드": "대형 방벽을 생성한다.",
  "텔레포트": "위치를 순간적으로 이동한다.",
  "그레이트 힐": "큰 체력 회복을 일으킨다.",
  "다크 캐논": "어둠의 포격을 발사한다.",
  "서먼 본 와이번": "뼈 와이번을 소환한다.",

  "샤이닝 저지먼트": "빛의 심판으로 강한 피해와 정화를 준다.",
  "헤븐스 도어": "빛의 문을 열어 이동이나 심판 효과를 낸다.",
  "인페르노": "거대한 화염 지대를 만든다.",
  "블리자드": "눈보라로 광역 냉기 피해를 준다.",
  "어스 퀘이크": "지진을 일으켜 광역 타격한다.",
  "윈드 스톰": "폭풍으로 넓은 범위를 휩쓴다.",
  "워프": "장거리 공간 이동을 한다.",
  "리플렉션": "마법이나 공격을 반사한다.",
  "서먼 데스나이트": "죽음의 기사를 소환한다.",

  "소드 오브 리벤지 라이트": "복수의 빛 검을 구현한다.",
  "샤이닝 레인": "빛의 비를 내려 광역 공격한다.",
  "볼케이노": "화산성 폭발을 일으킨다.",
  "아이스 크리스탈 오브 스톰": "폭풍 속 얼음 결정으로 광역 피해를 준다.",
  "퓨리 오브 더 헤븐": "하늘의 분노를 내려친다.",
  "라이트닝 인피니티": "끝없이 뻗는 번개 공격을 만든다.",
  "컨트롤 웨더": "날씨를 조작한다.",
  "매스 텔레포트": "다수 대상을 순간이동시킨다.",
  "헬파이어": "지옥불로 강한 화염 피해를 준다.",
  "서먼 본 드래곤": "뼈 드래곤을 소환한다.",

  "메테오 스트라이크": "거대한 운석 하나를 떨어뜨린다.",
  "메테오 스웜": "다수의 운석을 쏟아붓는다.",
  "앱솔루트 제로 포인트": "절대영도에 가까운 냉기를 집중한다.",
  "라이트닝 월드": "전장을 번개의 세계로 바꾼다.",
  "루인 오브 그라운드": "대지를 붕괴시킨다.",
  "엘리멘탈 퍼니시먼트": "속성의 징벌을 복합적으로 가한다.",
  "앱솔루트 쉴드": "절대적인 방어막을 형성한다.",
  "워프 게이트": "공간 관문을 연다.",
  "파워 워드 킬": "강력한 죽음의 언령을 발한다.",
  "네크로폴리스": "죽음의 영역을 전개한다.",
};

function spellCategory(name) {
  if (["라이트", "그리스", "디그", "다크니스", "슬립", "캔슬레이션", "웹", "메모라이즈", "블라인드", "슬로우", "사일런스", "일루젼", "컨퓨전", "인비저빌리티", "디스토션", "블링크", "텔레포트", "워프", "컨트롤 웨더", "매스 텔레포트", "워프 게이트"].includes(name)) return "utility";
  if (["쉴드", "샤이닝 디펜스", "배리어", "안티 매직 쉘", "그레이트 쉴드", "리플렉션", "앱솔루트 쉴드"].includes(name)) return "defense";
  if (["힐", "그레이트 힐", "라이프 드레인"].includes(name)) return "heal";
  if (name.startsWith("서먼")) return "summon";
  if (["샤이닝 웨이브", "샤이닝 필드", "익스플로전", "체인 라이트닝", "파이어 월", "다크 필드", "토네이도", "인페르노", "블리자드", "어스 퀘이크", "윈드 스톰", "샤이닝 레인", "볼케이노", "아이스 크리스탈 오브 스톰", "퓨리 오브 더 헤븐", "라이트닝 인피니티", "헬파이어", "메테오 스웜", "라이트닝 월드", "루인 오브 그라운드", "엘리멘탈 퍼니시먼트", "네크로폴리스"].includes(name)) return "area";
  if (["파이어 볼", "아이스 볼", "에어로 봄", "다크 볼"].includes(name)) return "smallArea";
  if (["레이져", "샤이닝 레이져", "다크 캐논", "메테오 스트라이크", "파워 워드 킬", "앱솔루트 제로 포인트"].includes(name)) return "singleHigh";
  return "single";
}

function spellRangeText(category) {
  if (category === "single") return "단일";
  if (category === "singleHigh") return "단일 고집중";
  if (category === "smallArea") return "소범위";
  if (category === "area") return "광역";
  if (category === "defense") return "방어";
  if (category === "heal") return "회복";
  if (category === "summon") return "소환";
  if (category === "utility") return "기능";
  return "기타";
}

function spellPowerRatio(circle, category) {
  // 절대 규칙: 마법 위력은 사용 MP를 넘지 않는다.
  // 1서클은 약 1/5. 서클이 오를수록 효율이 상승하지만 최대 1배를 넘지 않는다.
  const base = Math.min(1, (circle + 0.2) / 6);

  const rangePenalty = {
    singleHigh: 1.00,
    single: 0.86,
    smallArea: 0.68,
    area: 0.45,
    defense: 0.80,
    heal: 0.72,
    summon: 0.60,
    utility: 0.35,
  }[category] ?? 0.70;

  return Math.min(1, base * rangePenalty);
}

function spellPower(mp, circle, category) {
  return Math.min(mp, Math.max(1, Math.floor(mp * spellPowerRatio(circle, category))));
}

function spellManaCost(circle, category) {
  const base = SPELL_MP[circle];

  const costMul = {
    singleHigh: 1.00,
    single: 0.95,
    smallArea: 1.05,
    area: 1.15,
    defense: 0.95,
    heal: 1.00,
    summon: 1.15,
    utility: 0.80,
  }[category] ?? 1.00;

  return Math.max(1, Math.round(base * costMul));
}

const MAGIC_POOL = Object.entries(SPELLS).flatMap(([circle, names]) => {
  const c = Number(circle);
  return names.map(name => {
    const category = spellCategory(name);
    const mp = spellManaCost(c, category);
    const power = spellPower(mp, c, category);

    return {
      key: `${c}:${name}`,
      name,
      circle: c,
      mp,
      damage: power,
      range: spellRangeText(category),
      category,
      ratio: spellPowerRatio(c, category),
      desc: SPELL_DESC[name] ?? "마법 효과 설명 없음.",
    };
  });
});

const KI = {
  0: { name: "없음", atkMul: 1, mpDelta: 0 },
  1: { name: "검기상인", atkMul: 1.5, mpDelta: -50 },
  2: { name: "검기", atkMul: 2, mpDelta: -150 },
  3: { name: "검사", atkMul: 5, mpDelta: -300 },
  4: { name: "검강", atkMul: 20, mpDelta: -700 },
  5: { name: "강기압환", atkMul: 50, mpDelta: -500 },
  6: { name: "심검", atkMul: 50, mpDelta: 1000000 },
};

const ANGEL_TABLE = [
  { score: 1000000, name: "헤일로/입천 선택권", type: "choice", choices: ["헤일로", "입천"] },
  { score: 750000, name: "정령왕", type: "trait" },
  { score: 500000, name: "금강불괴의 정신", type: "trait" },
  { score: 400000, name: "원영", type: "trait" },
  { score: 300000, name: "상급 정령/빙백연혼 선택권", type: "choice", choices: ["상급 정령", "빙백연혼"] },
  { score: 200000, name: "중급 정령/흑염의 영체화 선택권", type: "choice", choices: ["중급 정령", "흑염의 영체화"] },
  { score: 100000, name: "심/신적초월 선택권", type: "choice", choices: ["심적초월", "신적초월"] },
  { score: 75000, name: "정령/연혼염 선택권", type: "choice", choices: ["하급 정령", "연혼염"] },
  { score: 50000, name: "변이 선택권", type: "choice", choices: ["자기상환적 돌연변이", "삼매경", "접기"] },
  { score: 25000, name: "유물", type: "item" },
  { score: 10000, name: "임모탈 평선", type: "trait" },
  { score: 9000, name: "오리지널 스킬", type: "item" },
  { score: 7000, name: "심법", type: "trait" },
  { score: 5000, name: "극기", type: "trait" },
  { score: 4000, name: "시분할/50코인 선택권", type: "choice", choices: ["시분할", "50코인"] },
  { score: 3000, name: "공법", type: "item" },
  { score: 2000, name: "묘리 선택권", type: "choice", choices: ["모델링", "스키마"] },
  { score: 1000, name: "검기 2권", type: "multiItem", itemName: "검기", count: 2 },
  { score: 500, name: "고급 마법서 뽑기권", type: "item" },
  { score: 300, name: "멀티캐스팅 2권", type: "multiItem", itemName: "멀티캐스팅의 서", count: 2 },
  { score: 200, name: "중급 마법서 선택권", type: "item" },
  { score: 100, name: "기초 마법서 선택권", type: "item" },
  { score: 80, name: "멀티캐스팅의 서", type: "item" },
  { score: 60, name: "외공서/내공서 선택권", type: "choice", choices: ["외공서", "내공서"] },
  { score: 40, name: "중급 마법서 뽑기권", type: "item" },
  { score: 30, name: "기초 마법서 뽑기권", type: "item" },
  { score: 20, name: "3코인", type: "coin", coin: 3 },
  { score: 10, name: "1코인", type: "coin", coin: 1 },
];

const TRAIT_DESC = {
  "모델링": "마법의 형태 조형 가능",
  "스키마": "육체능력 강화 선택권. 회복력 강화, 근력 강화, 속도강화 중 하나만 선택해 적용한다.",
  "스키마: 회복력 강화": "스키마 선택 효과. 1턴 소비 = 체력 100 회복",
  "스키마: 근력 강화": "스키마 선택 효과. 힘 판정 +10",
  "스키마: 속도강화": "스키마 선택 효과. 민첩 판정 +10",
  "공법": "검법, 창법, 박투술 등의 무술을 전수받는다. 스킬/기술칸에 GM이 플레이어에 맞게 수동 제작한다.",
  "무공": "검법, 창법, 박투술 등의 무공을 전수받는다. GM이 플레이어에 맞게 수동 기술로 제작한다.",
  "시분할": "멀티캐스팅 수가 2배가 된다. 상시 2배",
  "극기": "자신의 고통을 체화해 깨달은 개인 고유의 기술",
  "심법": "내공 심법이다. 마나 총량과 회복량이 2배가 된다",
  "오리지널 스킬": "오리지널 마나를 사용하여 만든 고유의 스킬",
  "임모탈 평선": "보유만으로 자동 발동되지 않는다. 발동 버튼을 눌렀을 때 마나 총량을 없앤다. 마나 사용 시 지능, 지혜 절대 판정을 모두 성공해야 하며 실패 시 사망한다. 발동 취소 시 마나가 0이 된다",
  "유물": "만트라에 속성을 추가한다",
  "변이": "육체가 변이하며 특정한 효과를 낸다",
  "하급 정령": "정령 마법을 하나 추가해 준다",
  "연혼염": "영혼을 태우는 불을 사용할 수 있게 된다. 방어무시 효과",
  "자기상환적 돌연변이": "받는 피해를 배수한 만큼 공격력이 배가 된다. 배수×20 다이스를 굴려 지혜판정을 하며 실패 시 마나가 0이 되고 2턴간 기절한다",
  "삼매경": "한가지 행동에 자신의 모든 것을 집중한다. 그 행동에 필중, 서치, 관통, 무시, 치명타 등의 효과가 더해진다. 사용 이후 3턴간 행동 불능에 빠진다",
  "접기": "스키마의 회복량과 판정 보정을 2배로 적용한다",
  "신적초월": "불가능한 신체 움직임을 가능하게 한다",
  "심적초월": "마나 총량이 2배 상승한다",
  "중급 정령": "하급 정령을 선택하면 자동으로 선택된다. 중급 정령 마법이 추가된다",
  "흑염의 영체화": "물질 관통이 가능해진다. 마나는 관통 불가능",
  "상급 정령": "중급 정령을 선택하면 자동으로 선택된다. 상급 정령 마법이 추가된다",
  "빙백연혼": "영혼을 얼리는 불을 사용할 수 있다. 층당 1회 사용 가능하다",
  "원영": "1층당 1번 원영이 남아 있다면 살아날 수 있다",
  "금강불괴의 정신": "모든 지혜판정에 +100을 한다",
  "정령왕": "모든 정령을 소유한 자만이 획득 가능하다. 정령왕의 기술을 사용할 수 있게 된다. 층당 1번 사용 가능하다",
  "헤일로": "천사의 고리다. 한가지 마법을 극한으로 강화한다. 층당 1번 사용 가능하다",
  "입천": "플레이어의 이상을 구현화한 무구를 얻는다. 자유를 원하면 무형의 검, 빛보다 빠르기를 원하면 능과도, 파괴를 원하면 함천멸도처럼 구현된다",
  "앙케 라": "천사의 시련 구체를 파괴했을 때 얻는 특수 보상",
};

const TECH_SOURCES = [
  "공법",
  "무공",
  "극기",
  "오리지널 스킬",
  "하급 정령",
  "중급 정령",
  "상급 정령",
  "정령왕",
  "헤일로",
  "입천",
  "유물",
  "연혼염",
  "흑염의 영체화",
  "빙백연혼",
  "앙케 라",
];


function arr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return Array.from(v); } catch { return []; }
}

function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function esc(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function dice(sides) {
  return Math.floor(Math.random() * Math.max(1, sides)) + 1;
}

let state = {
  이름: cur.이름 ?? cur.file.name,
  구분: cur.구분 ?? "플레이어",

  레벨: num(cur.레벨, 1),
  포인트: num(cur.포인트, 0),
  코인: num(cur.코인, 0),

  힘: num(cur.힘, 10),
  민첩: num(cur.민첩, 10),
  체력: num(cur.체력, 10),
  지능: num(cur.지능, 10),
  지혜: num(cur.지혜, 10),
  외모: num(cur.외모, 10),

  외공: num(cur.외공, 0),
  내공: num(cur.내공, 0),
  검기: num(cur.검기, 0),

  멀티캐스팅: num(cur.멀티캐스팅, 1),

  현재HP: num(cur.현재HP, 100),
  현재MP: num(cur.현재MP, 100),

  보유마법: arr(cur.보유마법),
  스킬목록: arr(cur.스킬목록),
  기술목록: arr(cur.기술목록),
  장비목록: arr(cur.장비목록),
  특성목록: arr(cur.특성목록),
  오리지널마나: cur.오리지널마나 ?? "",

  보상후보: arr(cur.보상후보),
  보상선택남음: num(cur.보상선택남음, 0),

  선택아이템: cur.선택아이템 ?? null,
  선택모드: cur.선택모드 ?? null,

  기록: cur.기록 ?? "대기 중",
  다이스표시: cur.다이스표시 ?? "대기",
  다이스상세: cur.다이스상세 ?? "버튼을 누르면 여기서 바로 결과가 표시됨",
  스킬결과: cur.스킬결과 ?? "스킬 사용 결과 대기",
  기술결과: cur.기술결과 ?? "기술 사용 결과 대기",
  마법결과: cur.마법결과 ?? "마법 사용 결과 대기",
  시련결과: cur.시련결과 ?? "천사의 시련 결과 대기",
  천사획득단계: arr(cur.천사획득단계),
  특성결과: cur.특성결과 ?? "특성 효과 결과 대기",
  상태결과: cur.상태결과 ?? "상태이상 없음",
  상태이상: arr(cur.상태이상),
  임모탈발동: cur.임모탈발동 ?? false,
  자기상환배수: num(cur.자기상환배수, 1),
  자기상환결과: cur.자기상환결과 ?? "자기상환적 돌연변이 대기",
  힘판정보정: num(cur.힘판정보정, 0),
  민첩판정보정: num(cur.민첩판정보정, 0),
  원영사용됨: cur.원영사용됨 ?? false,
  정령왕사용됨: cur.정령왕사용됨 ?? false,
  헤일로사용됨: cur.헤일로사용됨 ?? false,
  헤일로강화준비: cur.헤일로강화준비 ?? false,
  빙백연혼사용됨: cur.빙백연혼사용됨 ?? false,
  편집스킬: cur.편집스킬 ?? null,
  편집기술: cur.편집기술 ?? null,
};

const STAT_KEYS = ["힘", "민첩", "체력", "지능", "지혜", "외모"];

function totalPoint() {
  return 60 + (Math.max(1, state.레벨) - 1) * 3;
}

function usedPoint() {
  return STAT_KEYS.reduce((sum, key) => sum + num(state[key], 1), 0);
}

function remainPoint() {
  return totalPoint() - usedPoint();
}

const root = dv.el("div", "", { cls: "manrpg-root" });

function hasTrait(name) {
  return state.특성목록.includes(name);
}

function isImmortalActive() {
  return hasTrait("임모탈 평선") && state.임모탈발동 === true;
}

function addStatusToList(list, status) {
  const clean = String(status ?? "").trim();
  if (!clean) return list;
  return list.includes(clean) ? list : [...list, clean];
}

function statusHTML() {
  if (!state.상태이상.length) return `<div class="m-empty">상태이상 없음</div>`;

  return state.상태이상.map((s, i) => `
    <button class="m-equip" data-action="removeStatus" data-index="${i}">
      <b>${esc(s)}</b>
      <span>제거</span>
    </button>
  `).join("");
}


function passiveBonus(stat) {
  return state.스킬목록.reduce((sum, skill) => {
    if ((skill.kind === "패시브" || skill.passive) && skill.passiveStat === stat) {
      return sum + num(skill.passiveValue, 0);
    }
    return sum;
  }, 0);
}

function effStat(stat) {
  return num(state[stat], 1) + passiveBonus(stat);
}

function judgeBonus(stat) {
  let bonus = 0;
  const schemaMul = hasTrait("접기") ? 2 : 1;

  if (hasTrait("금강불괴의 정신") && stat === "지혜") bonus += 100;
  if (hasTrait("스키마: 근력 강화") && stat === "힘") bonus += 10 * schemaMul;
  if (hasTrait("스키마: 속도강화") && stat === "민첩") bonus += 10 * schemaMul;
  if (stat === "힘") bonus += num(state.힘판정보정);
  if (stat === "민첩") bonus += num(state.민첩판정보정);
  return bonus;
}

function clearOneShotBonus(stat) {
  if (stat === "힘" && state.힘판정보정) state.힘판정보정 = 0;
  if (stat === "민첩" && state.민첩판정보정) state.민첩판정보정 = 0;
}

function absoluteJudge(stat) {
  const base = effStat(stat);
  const bonus = judgeBonus(stat);
  const target = Math.max(1, base + bonus);
  const roll = dice(100);
  const success = roll <= target;

  return {
    stat,
    base,
    bonus,
    target,
    roll,
    success,
    text: `${stat} 절대판정: 1d100=${roll} ≤ ${target} (${base}${bonus ? ` + 보정 ${bonus}` : ""}) ${success ? "성공" : "실패"}`,
  };
}

function attackBonusMultiplier() {
  let mul = 1;
  if (hasTrait("자기상환적 돌연변이")) mul *= Math.max(1, num(state.자기상환배수, 1));
  if (hasTrait("연혼염")) mul *= 1.15;
  if (hasTrait("흑염의 영체화")) mul *= 1.1;
  if (hasTrait("헤일로")) mul *= 1.25;
  if (hasTrait("입천")) mul *= 1.3;
  if (hasTrait("앙케 라")) mul *= 1.5;
  return mul;
}

function 특성효과요약() {
  const effects = [];
  const schemaMul = hasTrait("접기") ? 2 : 1;

  if (hasTrait("스키마: 회복력 강화")) effects.push(`스키마 회복력: 버튼 사용 시 HP ${100 * schemaMul} 회복`);
  if (hasTrait("스키마: 근력 강화")) effects.push(`스키마 근력 강화: 힘 판정 상시 +${10 * schemaMul}`);
  if (hasTrait("스키마: 속도강화")) effects.push(`스키마 속도강화: 민첩 판정 상시 +${10 * schemaMul}`);
  if (hasTrait("접기")) effects.push("접기: 스키마 회복량과 판정 보정 2배 적용 중");

  if (hasTrait("심법")) effects.push("심법: 최대 MP와 MP 회복량 2배");
  if (hasTrait("심적초월")) effects.push("심적초월: 최대 MP 2배");
  if (hasTrait("시분할")) effects.push("시분할: 멀티캐스팅 2배");
  if (hasTrait("자기상환적 돌연변이")) effects.push(`자기상환적 돌연변이: 현재 공격력 ${Math.max(1, num(state.자기상환배수, 1))}배`);
  if (hasTrait("연혼염")) effects.push("연혼염: 공격력 1.15배, 방어무시 성격");
  if (hasTrait("흑염의 영체화")) effects.push("흑염의 영체화: 공격력 1.1배, 물질 관통 성격");
  if (hasTrait("헤일로")) effects.push(`헤일로: 다음 마법 2배 강화 ${state.헤일로사용됨 ? "(이번 층 사용됨)" : "(사용 가능)"}`);
  if (hasTrait("입천")) effects.push("입천: 공격력 1.3배");
  if (hasTrait("앙케 라")) effects.push("앙케 라: 공격력 1.5배");
  if (hasTrait("금강불괴의 정신")) effects.push("금강불괴의 정신: 지혜 판정 +100. 절대판정에도 적용");
  if (hasTrait("임모탈 평선")) effects.push(`임모탈 평선: ${isImmortalActive() ? "발동 중" : "미발동"} / 발동 중 MP 사용 시 지능·지혜 절대판정 실패하면 사망`);
  if (hasTrait("원영")) effects.push(`원영: 층당 1회 부활 ${state.원영사용됨 ? "(사용됨)" : "(사용 가능)"}`);
  if (hasTrait("빙백연혼")) effects.push(`빙백연혼: 층당 1회 ${state.빙백연혼사용됨 ? "(사용됨)" : "(사용 가능)"}`);
  if (hasTrait("정령왕")) effects.push(`정령왕: 층당 1회 ${state.정령왕사용됨 ? "(사용됨)" : "(사용 가능)"}`);
  if (state.스킬목록.some(s => s.kind === "패시브" || s.passive)) effects.push("패시브 스킬: 해당 스탯을 쓰는 모든 판정과 절대판정에 적용");
  return effects.length ? effects.join("\n") : "적용 중인 자동 특성 효과 없음";
}

function maxStat() {
  return state.레벨 >= 80 ? 100 : state.레벨 + 20;
}

function calc() {
  const maxS = maxStat();
  const level = Math.max(1, num(state.레벨, 1));

  // 규칙 파일 기준 기본 파생 공식
  // 최대 HP = 체력 × 10
  // 최대 MP = 레벨 × 5 + 지능 × 10
  // MP 회복량 = 레벨 + 지혜 × 2
  // 평타 피해 = floor((힘 + 체력) / 10) + 2
  const baseHP = effStat("체력") * 10;
  let baseMP = level * 5 + effStat("지능") * 10;
  let baseRegen = level + effStat("지혜") * 2;
  const baseAtk = Math.floor((effStat("힘") + effStat("체력")) / 10) + 2;

  // 특성/스택 보정은 규칙 파생값 계산 후 적용
  if (hasTrait("심법")) {
    baseMP *= 2;
    baseRegen *= 2;
  }
  if (hasTrait("심적초월")) baseMP *= 2;

  const 외공배수 = Math.pow(1.4, Math.max(0, state.외공));
  const 내공배수 = Math.pow(1.2, Math.max(0, state.내공));
  const ki = KI[clamp(state.검기, 0, 6)];

  let maxHP = Math.max(1, Math.floor(baseHP * 외공배수));
  let maxMP = Math.max(0, Math.floor(baseMP * 내공배수 + ki.mpDelta));
  let mpRegen = Math.max(0, Math.floor(baseRegen * 내공배수));
  let atk = Math.max(0, Math.floor(baseAtk * ki.atkMul * attackBonusMultiplier()));

  if (isImmortalActive()) maxMP = 999999999;

  const multi = state.멀티캐스팅 * (hasTrait("시분할") ? 2 : 1);

  return {
    maxS,
    baseHP,
    baseMP,
    baseRegen,
    baseAtk,
    maxHP,
    maxMP,
    mpRegen,
    atk,
    ki,
    외공배수,
    내공배수,
    multi,
  };
}
function normalize() {
  const d = calc();
  state.레벨 = Math.max(1, num(state.레벨, 1));
  state.코인 = Math.max(0, num(state.코인, 0));

  for (const s of STAT_KEYS) {
    state[s] = clamp(num(state[s], 1), 1, d.maxS);
  }

  state.외공 = Math.max(0, num(state.외공));
  state.내공 = Math.max(0, num(state.내공));
  state.검기 = clamp(num(state.검기), 0, 6);

  state.포인트 = remainPoint();

  state.현재HP = clamp(num(state.현재HP), 0, d.maxHP);
  state.현재MP = isImmortalActive() ? 0 : clamp(num(state.현재MP), 0, d.maxMP);
}

async function applyBasicAndStats(logPrefix = "스탯 직접 입력 적용") {
  const dNow = calc();
  const patch = {
    이름: root.querySelector("#nameInput").value.trim() || state.이름,
    구분: root.querySelector("#typeInput").value,
  };

  const proposed = {};
  const log = [];

  for (const s of STAT_KEYS) {
    const input = root.querySelector(`[data-stat-input="${s}"]`);
    proposed[s] = clamp(num(input.value, state[s]), 1, dNow.maxS);
  }

  const proposedUsed = STAT_KEYS.reduce((sum, s) => sum + proposed[s], 0);
  const total = totalPoint();

  if (proposedUsed > total) {
    await save({
      기록: `스탯 저장 실패: 사용 포인트 ${proposedUsed} / 보유 총 포인트 ${total}. ${proposedUsed - total}포인트 초과`,
    });
    return false;
  }

  for (const s of STAT_KEYS) {
    if (proposed[s] !== state[s]) log.push(`${s} ${state[s]}→${proposed[s]}`);
    patch[s] = proposed[s];
  }

  patch.포인트 = total - proposedUsed;
  patch.기록 = log.length ? `${logPrefix}: ${log.join(", ")}` : "기본 정보 저장";
  await save(patch);
  return true;
}

async function save(patch = {}) {
  Object.assign(state, patch);
  normalize();

  await app.fileManager.processFrontMatter(file, fm => {
    for (const [key, value] of Object.entries(state)) {
      fm[key] = value;
    }
  });

  render();
}

function rewardConfig() {
  const a = state.외모;
  if (a >= 100) return { offer: 10, pick: 5 };
  if (a >= 90) return { offer: 10, pick: 4 };
  if (a >= 80) return { offer: 10, pick: 3 };
  if (a >= 70) return { offer: 9, pick: 3 };
  if (a >= 60) return { offer: 8, pick: 3 };
  if (a >= 50) return { offer: 7, pick: 2 };
  if (a >= 40) return { offer: 6, pick: 2 };
  if (a >= 30) return { offer: 5, pick: 2 };
  if (a >= 20) return { offer: 4, pick: 1 };
  if (a >= 10) return { offer: 3, pick: 1 };
  return { offer: 2, pick: 1 };
}

function weightedPick(list) {
  const total = list.reduce((s, x) => s + x.rate, 0);
  let r = Math.random() * total;
  for (const item of list) {
    r -= item.rate;
    if (r <= 0) return item;
  }
  return list[list.length - 1];
}

function makeItem(name) {
  if (name === "외공서") return { name: "외공서", type: "martial", sell: 5 };
  if (name === "내공서") return { name: "내공서", type: "martial", sell: 5 };
  if (name === "검기") return { name: "검기", type: "martial", sell: 12 };
  if (name === "멀티캐스팅의 서") return { name: "멀티캐스팅의 서", type: "multi", sell: 10 };
  if (name === "스킬 초기화권") return { name: "스킬 초기화권", type: "reset", sell: 5 };
  if (name === "기초 마법서") return { name: "기초 마법서", type: "magicBook", grade: "기초", sell: 3 };
  if (name === "중급 마법서") return { name: "중급 마법서", type: "magicBook", grade: "중급", sell: 5 };
  if (name === "고급 마법서") return { name: "고급 마법서", type: "magicBook", grade: "고급", sell: 8 };
  if (name === "마도서") return { name: "마도서", type: "magicBook", grade: "마도서", sell: 15 };
  if (["모델링", "스키마", "스키마: 회복력 강화", "스키마: 근력 강화", "스키마: 속도강화", "시분할", "극기", "심법", "임모탈 평선", "유물", "하급 정령", "연혼염", "자기상환적 돌연변이", "삼매경", "접기", "신적초월", "심적초월", "중급 정령", "흑염의 영체화", "상급 정령", "빙백연혼", "원영", "금강불괴의 정신", "정령왕", "헤일로", "입천", "앙케 라"].includes(name)) return { name, type: "trait", sell: 0 };
  if (name === "공법" || name === "오리지널 스킬") return { name, type: "special", sell: 0 };
  if (name === "기초 마법서 뽑기권") return { name, type: "magicTicket", grade: "기초", mode: "random", sell: 3 };
  if (name === "중급 마법서 뽑기권") return { name, type: "magicTicket", grade: "중급", mode: "random", sell: 5 };
  if (name === "고급 마법서 뽑기권") return { name, type: "magicTicket", grade: "고급", mode: "random", sell: 8 };
  if (name === "기초 마법서 선택권") return { name, type: "magicTicket", grade: "기초", mode: "select", sell: 5 };
  if (name === "중급 마법서 선택권") return { name, type: "magicTicket", grade: "중급", mode: "select", sell: 8 };
  if (name === "무공") return { name: "무공", type: "special", sell: 0 };
  if (name === "극기") return { name: "극기", type: "trait", sell: 0 };
  if (name.includes("선택권")) return { name, type: "choice", sell: 0 };
  return { name, type: "item", sell: 0 };
}

function rollMartialBook() {
  const p = weightedPick([
    { name: "외공서", rate: 40 },
    { name: "내공서", rate: 40 },
    { name: "검기", rate: 20 },
  ]);
  return makeItem(p.name);
}

function rollMagicBookGrade() {
  const p = weightedPick([
    { name: "기초 마법서", rate: 50 },
    { name: "중급 마법서", rate: 30 },
    { name: "고급 마법서", rate: 10 },
    { name: "멀티캐스팅의 서", rate: 9 },
    { name: "마도서", rate: 1 },
  ]);
  return makeItem(p.name);
}

function rollReward() {
  const p = weightedPick([
    { name: "스킬 초기화권", rate: 5 },
    { name: "무공서", rate: 10 },
    { name: "마법서", rate: 25 },
    { name: "추가 코인 +1", rate: 40 },
    { name: "추가 코인 +2", rate: 20 },
  ]);

  if (p.name === "무공서") return rollMartialBook();
  if (p.name === "마법서") return rollMagicBookGrade();
  if (p.name === "추가 코인 +1") return { name: "추가 코인 +1", type: "coin", coin: 1 };
  if (p.name === "추가 코인 +2") return { name: "추가 코인 +2", type: "coin", coin: 2 };
  return makeItem(p.name);
}

function spellRangeByGrade(grade) {
  if (grade === "기초") return [1, 2];
  if (grade === "중급") return [3, 4];
  if (grade === "고급") return [5, 6];
  if (grade === "마도서") return [7, 8, 9];
  return [1, 2];
}

function randomSpellByGrade(grade) {
  const circles = spellRangeByGrade(grade);
  const c = circles[Math.floor(Math.random() * circles.length)];
  const names = SPELLS[c];
  const name = names[Math.floor(Math.random() * names.length)];
  const spell = MAGIC_POOL.find(m => m.circle === c && m.name === name);
  return {
    name: `${spell.name} 마법서`,
    type: "magicBook",
    grade,
    spellKey: spell.key,
    sell: grade === "기초" ? 3 : grade === "중급" ? 5 : grade === "고급" ? 8 : 15,
  };
}

function learnDifficulty(grade) {
  if (grade === "기초") return 50;
  if (grade === "중급") return 70;
  if (grade === "고급") return 100;
  if (grade === "마도서") return 100;
  return 50;
}

function addItem(item, list = state.장비목록) {
  return [...list, item];
}

function removeItem(index) {
  return state.장비목록.filter((_, i) => i !== index);
}

function magicSelectOptions(range = null) {
  let list = MAGIC_POOL;
  if (range) list = MAGIC_POOL.filter(m => range.includes(m.circle));

  return list.map(m => {
    return `<option value="${esc(m.key)}">${m.circle}서클 · ${esc(m.name)} · ${m.range} · MP ${m.mp} · 위력 ${m.damage} · ${esc(m.desc)}</option>`;
  }).join("");
}

function ownedMagicHTML() {
  const owned = state.보유마법
    .map(key => MAGIC_POOL.find(m => m.key === key))
    .filter(Boolean);

  if (!owned.length) return `<div class="m-empty">보유 마법 없음</div>`;

  return owned.map(m => `
    <div class="m-skill">
      <button class="m-list-btn" data-action="castMagic" data-key="${esc(m.key)}">
        <b>${esc(m.name)}</b>
        <span>${m.circle}서클 / ${m.range} / MP -${m.mp} / 위력 ${m.damage} / ${esc(m.desc)}</span>
      </button>
      <button class="m-small danger" data-action="removeMagic" data-key="${esc(m.key)}">마법 제거</button>
    </div>
  `).join("");
}

function skillHTML() {
  const usable = state.스킬목록.map((s, i) => ({ s, i }));
  if (!usable.length) return `<div class="m-empty">등록된 스킬 없음</div>`;

  const d = calc();

  return usable.map(({ s, i }) => {
    const mp = num(s.mp);
    const hp = num(s.hp);
    const mul = num(s.damage, 1);
    const finalDamage = Math.floor(d.atk * mul);
    const isPassive = s.kind === "패시브" || s.passive;

    return `
      <div class="m-skill">
        <button class="m-list-btn" data-action="${isPassive ? "noop" : "useSkill"}" data-index="${i}">
          <b>${esc(s.name)}</b>
          <span>${isPassive ? `패시브 ${esc(s.passiveStat ?? "")} +${num(s.passiveValue)}` : `MP ${mp >= 0 ? "+" : ""}${mp} / HP ${hp >= 0 ? "+" : ""}${hp} / ${finalDamage} (${mul}배) / 판정 +${num(s.bonus)}`}</span>
        </button>
        <div class="m-note">
          판정: ${esc(s.stat ?? "없음")} / 유형: ${esc(s.kind ?? "기타")}
          <br>${esc(s.note ?? "")}
        </div>
        <div class="m-row2">
          <button class="m-small" data-action="editSkill" data-index="${i}">스킬 수정</button>
          <button class="m-small danger" data-action="deleteSkill" data-index="${i}">스킬 제거</button>
        </div>
      </div>
    `;
  }).join("");
}

function lockedSkillHTML() {
  return "";
}

function availableTechSources(current = null) {
  return TECH_SOURCES.filter(src => {
    if (current && src === current) return true;
    if (!hasTrait(src)) return false;
    return !state.기술목록.some(t => t.source === src);
  });
}

function techOptions(current = null) {
  const list = availableTechSources(current);
  if (!list.length) return `<option value="">제작 가능한 기술 없음</option>`;
  return list.map(src => `<option value="${esc(src)}">${esc(src)}</option>`).join("");
}

function techHTML() {
  if (!state.기술목록.length) return `<div class="m-empty">등록된 기술 없음</div>`;

  const d = calc();

  return state.기술목록.map((t, i) => {
    const mp = num(t.mp);
    const hp = num(t.hp);
    const mul = num(t.damage, 1);
    const finalDamage = Math.floor(d.atk * mul);

    return `
      <div class="m-skill">
        <button class="m-list-btn" data-action="useTech" data-index="${i}">
          <b>${esc(t.name)}</b>
          <span>${esc(t.source)} / MP ${mp >= 0 ? "+" : ""}${mp} / HP ${hp >= 0 ? "+" : ""}${hp} / ${finalDamage} (${mul}배) / 판정 +${num(t.bonus)}</span>
        </button>
        <div class="m-note">
          출처: ${esc(t.source)} / 판정: ${esc(t.stat ?? "없음")} / 유형: ${esc(t.kind ?? "기술")}
          <br>${esc(t.note ?? "")}
        </div>
        <div class="m-row2">
          <button class="m-small" data-action="editTech" data-index="${i}">기술 수정</button>
          <button class="m-small danger" data-action="deleteTech" data-index="${i}">기술 제거</button>
        </div>
      </div>
    `;
  }).join("");
}

function equipHTML() {
  if (!state.장비목록.length) return `<div class="m-empty">장비 / 아이템 없음</div>`;

  return state.장비목록.map((item, i) => `
    <button class="m-equip" data-action="selectItem" data-index="${i}">
      <b>${esc(item.name)}</b>
      <span>${esc(item.type ?? "item")}</span>
    </button>
  `).join("");
}

function itemPanelHTML() {
  const index = state.선택아이템;
  if (index === null || index === undefined) return "";

  const item = state.장비목록[index];
  if (!item) return "";

  return `
    <div class="m-panel">
      <h4>선택 아이템</h4>
      <div class="m-big">${esc(item.name)}</div>
      <div class="m-row3">
        <button class="m-btn" data-action="useItem" data-index="${index}">사용</button>
        <button class="m-btn" data-action="sellItem" data-index="${index}">판매</button>
        <button class="m-btn danger" data-action="removeItem" data-index="${index}">제거</button>
      </div>
    </div>
  `;
}


function defaultChoices(name) {
  if (name === "스키마 효과 선택권") return ["스키마: 회복력 강화", "스키마: 근력 강화", "스키마: 속도강화"];
  if (name.includes("묘리")) return ["모델링", "스키마"];
  if (name.includes("변이")) return ["자기상환적 돌연변이", "삼매경", "접기"];
  if (name.includes("심/신")) return ["심적초월", "신적초월"];
  if (name.includes("외공서")) return ["외공서", "내공서"];
  if (name.includes("시분할")) return ["시분할", "50코인"];
  if (name.includes("정령/연혼염")) return ["하급 정령", "연혼염"];
  if (name.includes("중급 정령")) return ["중급 정령", "흑염의 영체화"];
  if (name.includes("상급 정령")) return ["상급 정령", "빙백연혼"];
  if (name.includes("헤일로")) return ["헤일로", "입천"];
  return [];
}

function choicePanelHTML() {
  if (!state.선택모드) return "";

  const mode = state.선택모드;

  if (mode.kind === "magicSelect") {
    const item = state.장비목록[mode.index];
    if (!item) return "";
    const range = spellRangeByGrade(item.grade);

    return `
      <div class="m-panel">
        <h4>${esc(item.name)} 사용</h4>
        <select id="choice-magic" size="8">${magicSelectOptions(range)}</select>
        <div class="m-row2">
          <button class="m-btn" data-action="confirmMagicChoice" data-index="${mode.index}">선택</button>
          <button class="m-btn" data-action="cancelChoice">취소</button>
        </div>
      </div>
    `;
  }

  if (mode.kind === "choiceItem") {
    const item = state.장비목록[mode.index];
    if (!item) return "";
    const choices = item.choices ?? [];

    return `
      <div class="m-panel">
        <h4>${esc(item.name)} 사용</h4>
        <div class="m-row2">
          ${choices.map(c => {
            const reason = canSelectChoice(c);
            return `<button class="m-btn" data-action="confirmChoiceItem" data-index="${mode.index}" data-choice="${esc(c)}" ${reason ? "disabled" : ""}>${esc(c)}${reason ? " 불가" : ""}</button>`;
          }).join("")}
        </div>
        <button class="m-btn" data-action="cancelChoice">취소</button>
      </div>
    `;
  }

  return "";
}

function rewardHTML() {
  const cfg = rewardConfig();

  const candidates = state.보상후보 ?? [];
  const left = num(state.보상선택남음);

  return `
    <div class="m-card">
      <div class="m-card-label">외모 보상 보정</div>
      <div class="m-card-value">${cfg.offer}개 중 ${cfg.pick}개 선택</div>
    </div>

    <button class="m-btn full" data-action="drawReward">보상 뽑기</button>

    ${candidates.length ? `
      <div class="m-rewards">
        <div class="m-sub">남은 선택: ${left}</div>
        ${candidates.map((r, i) => `
          <button class="m-equip" data-action="takeReward" data-index="${i}" ${left <= 0 ? "disabled" : ""}>
            <b>${esc(r.name)}</b>
            <span>${r.type === "coin" ? `${r.coin}코인` : esc(r.type)}</span>
          </button>
        `).join("")}
      </div>
    ` : ""}
  `;
}

function traitHTML() {
  if (!state.특성목록.length) return `<div class="m-empty">특성 없음</div>`;

  return state.특성목록.map(t => `<div class="m-trait"><b>${esc(t)}</b><br><span>${esc(TRAIT_DESC[t] ?? "")}</span></div>`).join("");
}
function bar(label, curValue, maxValue) {
  const immortal = label === "MP" && isImmortalActive();
  const pct = immortal ? 100 : maxValue <= 0 ? 0 : clamp((curValue / maxValue) * 100, 0, 100);
  const text = immortal ? "무한" : `${curValue} / ${maxValue}`;

  return `
    <div class="m-barbox">
      <div class="m-bartop"><span>${label}</span><b>${text}</b></div>
      <div class="m-bar"><div style="width:${pct}%"></div></div>
    </div>
  `;
}

function card(label, value) {
  return `
    <div class="m-card">
      <div class="m-card-label">${label}</div>
      <div class="m-card-value">${value}</div>
    </div>
  `;
}

function statBox(label, key) {
  const bonus = passiveBonus(key);
  return `
    <div class="m-stat">
      <div class="m-stat-name">${label}${bonus ? ` +${bonus}` : ""}</div>
      <input data-stat-input="${key}" type="number" value="${state[key]}">
      <div class="m-sub">판정값 ${effStat(key)}</div>
      <div class="m-row2">
        <button class="m-small" data-action="statMinus" data-key="${key}">-</button>
        <button class="m-small" data-action="statPlus" data-key="${key}">+</button>
      </div>
    </div>
  `;
}


function showDiceRoll(sides, finalValue, detail) {
  const display = root.querySelector("#diceDisplay");
  const detailBox = root.querySelector("#diceDetail");

  if (!display || !detailBox) return;

  let elapsed = 0;
  const intervalMs = 60;

  display.classList.add("m-dice-rolling");
  detailBox.textContent = "굴리는 중...";

  const timer = setInterval(() => {
    display.textContent = dice(sides);
    elapsed += intervalMs;

    if (elapsed >= 1000) {
      clearInterval(timer);
      display.classList.remove("m-dice-rolling");

      state.다이스표시 = String(finalValue);
      state.다이스상세 = detail;

      display.textContent = state.다이스표시;
      detailBox.textContent = state.다이스상세;
    }
  }, intervalMs);
}



function addTraitToList(list, name) {
  const next = [...list];

  if (["자기상환적 돌연변이", "삼매경", "접기"].includes(name) && !next.includes("변이")) {
    next.push("변이");
  }

  if (name === "하급 정령") {
    for (const t of ["하급 정령", "중급 정령", "상급 정령"]) {
      if (!next.includes(t)) next.push(t);
    }
    return next;
  }

  if (name === "중급 정령" && !next.includes("하급 정령")) {
    return next;
  }

  if (name === "상급 정령" && !next.includes("중급 정령")) {
    return next;
  }

  if (name === "정령왕" && !(next.includes("하급 정령") && next.includes("중급 정령") && next.includes("상급 정령"))) {
    return next;
  }

  if (!next.includes(name)) next.push(name);
  return next;
}

function canSelectChoice(choice, traits = state.특성목록) {
  if (choice === "중급 정령" && !traits.includes("하급 정령")) return "하급 정령이 없으면 중급 정령을 선택할 수 없음";
  if (choice === "상급 정령" && !traits.includes("중급 정령")) return "중급 정령이 없으면 상급 정령을 선택할 수 없음";
  if (choice === "정령왕" && !(traits.includes("하급 정령") && traits.includes("중급 정령") && traits.includes("상급 정령"))) return "모든 정령이 없으면 정령왕을 선택할 수 없음";
  return "";
}

function isTraitChoice(choice) {
  return ["모델링", "공법", "무공", "시분할", "극기", "심법", "오리지널 스킬", "임모탈 평선", "유물", "하급 정령", "연혼염", "자기상환적 돌연변이", "삼매경", "접기", "심적초월", "신적초월", "중급 정령", "흑염의 영체화", "상급 정령", "빙백연혼", "원영", "금강불괴의 정신", "정령왕", "헤일로", "입천", "스키마: 회복력 강화", "스키마: 근력 강화", "스키마: 속도강화"].includes(choice);
}

function angelRewards(score) {
  return ANGEL_TABLE.filter(r => score >= r.score).sort((a, b) => a.score - b.score);
}

async function applyAngelReward(score, prefix) {
  const rewards = angelRewards(score);
  const already = new Set(arr(state.천사획득단계).map(x => Number(x)));
  const freshRewards = rewards.filter(r => !already.has(Number(r.score)));

  if (!rewards.length) {
    await save({
      시련결과: `${prefix}
보상 없음`,
      기록: "천사의 시련 실패",
    });
    return;
  }

  if (!freshRewards.length) {
    const highest = rewards[rewards.length - 1]?.score ?? 0;
    await save({
      시련결과: `${prefix}
이미 ${highest} 이하 보상을 모두 획득함.
새로 획득한 보상 없음`,
      기록: "천사의 시련: 신규 보상 없음",
    });
    return;
  }

  let nextCoin = state.코인;
  let nextItems = [...state.장비목록];
  const nextClaimed = new Set(already);
  const gainedNames = [];
  const skippedNames = rewards
    .filter(r => already.has(Number(r.score)))
    .map(r => `${r.score}: ${r.name}`);

  for (const reward of freshRewards) {
    nextClaimed.add(Number(reward.score));
    gainedNames.push(`${reward.score}: ${reward.name}`);

    if (reward.type === "coin") {
      nextCoin += num(reward.coin);
      continue;
    }

    if (reward.type === "multiItem") {
      for (let i = 0; i < num(reward.count); i++) {
        nextItems.push(makeItem(reward.itemName));
      }
      continue;
    }

    if (reward.type === "trait") {
      nextItems.push({
        name: reward.name,
        type: "trait",
        sell: 0,
      });
      continue;
    }

    if (reward.type === "choice") {
      nextItems.push({
        name: reward.name,
        type: "choice",
        choices: reward.choices,
        sell: 0,
      });
      continue;
    }

    nextItems.push(makeItem(reward.name));
  }

  const gainedText = gainedNames.length
    ? "신규 획득 보상:\\n- " + gainedNames.join("\\n- ")
    : "신규 획득 보상 없음";
  const skippedText = skippedNames.length
    ? "\\n\\n이미 획득한 보상:\\n- " + skippedNames.join("\\n- ")
    : "";

  await save({
    코인: nextCoin,
    장비목록: nextItems,
    천사획득단계: Array.from(nextClaimed).sort((a, b) => a - b),
    시련결과: prefix + "\\n" + gainedText + skippedText,
    기록: `천사의 시련 신규 보상 ${freshRewards.length}개 획득`,
  });
}

function render() {
  normalize();
  const d = calc();
  const editSkillIndex = state.편집스킬;
  const editSkill = editSkillIndex !== null && editSkillIndex !== undefined ? state.스킬목록[editSkillIndex] : null;
  const editTechIndex = state.편집기술;
  const editTech = editTechIndex !== null && editTechIndex !== undefined ? state.기술목록[editTechIndex] : null;

  root.innerHTML = `
<style>
.manrpg-root {
  --bg:#181818;
  --panel:#222;
  --panel2:#2b2b2b;
  --line:#444;
  --text:#f2f2f2;
  --sub:#b9b9b9;
  background:var(--bg);
  color:var(--text);
  border:1px solid var(--line);
  border-radius:14px;
  padding:14px;
  font-family:system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-user-select:none;
  user-select:none;
  overscroll-behavior:contain;
}
.manrpg-root * {
  box-sizing:border-box;
}
.manrpg-root input,
.manrpg-root select,
.manrpg-root textarea {
  width:100%;
  background:#111;
  color:var(--text);
  border:1px solid var(--line);
  border-radius:8px;
  padding:9px;
  font-size:15px;
  -webkit-user-select:text;
  user-select:text;
}
.m-top {
  display:grid;
  grid-template-columns:1fr 110px;
  gap:8px;
}
.m-level {
  display:grid;
  grid-template-columns:1fr 1fr 1fr 1fr;
  gap:6px;
  margin-top:8px;
}
.m-btn,
.m-small,
.m-list-btn,
.m-equip,
.m-click-card {
  background:var(--panel2);
  color:var(--text);
  border:1px solid #666;
  border-radius:10px;
  padding:10px;
  font-weight:800;
}
.m-btn.full {
  width:100%;
  margin-top:8px;
}
.manrpg-root button:disabled {
  opacity:.35;
  filter:grayscale(1);
  pointer-events:none;
}
.m-click-card {
  cursor:pointer;
  text-align:left;
}
.manrpg-root button {
  transition: transform .08s ease, filter .12s ease, box-shadow .12s ease;
  touch-action: pan-y;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}
.manrpg-root button:active {
  transform: scale(.97);
  filter: brightness(1.25);
  box-shadow: 0 0 0 2px rgba(255,255,255,.22) inset;
}
.m-flash {
  animation: mFlash .55s ease;
}
@keyframes mFlash {
  0% { box-shadow:0 0 0 0 rgba(255,255,255,.65); filter:brightness(1.45); }
  100% { box-shadow:0 0 0 12px rgba(255,255,255,0); filter:brightness(1); }
}
.m-small {
  padding:7px;
  font-size:13px;
}
.danger {
  border-color:#8a4a4a;
}
.m-section {
  margin-top:16px;
  padding-top:14px;
  border-top:2px solid #555;
}
.m-section h3 {
  margin:0 0 10px 0;
  font-size:20px;
}
.m-bars {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
  margin-top:12px;
}
.m-barbox {
  background:var(--panel);
  border:1px solid var(--line);
  border-radius:12px;
  padding:10px;
}
.m-bartop {
  display:flex;
  justify-content:space-between;
  margin-bottom:8px;
}
.m-bar {
  height:13px;
  background:#111;
  border-radius:99px;
  overflow:hidden;
}
.m-bar div {
  height:100%;
  background:#ddd;
}
.m-grid {
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:8px;
}
.m-stat {
  background:var(--panel);
  border:1px solid var(--line);
  border-radius:12px;
  padding:9px;
}
.m-stat-name {
  color:var(--sub);
  font-size:13px;
  margin-bottom:5px;
}
.m-row2 {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:6px;
  margin-top:6px;
}
.m-row3 {
  display:grid;
  grid-template-columns:1fr 1fr 1fr;
  gap:6px;
  margin-top:8px;
}
.m-cards {
  display:grid;
  grid-template-columns:repeat(2, 1fr);
  gap:8px;
}
.m-card {
  background:var(--panel);
  border:1px solid var(--line);
  border-radius:12px;
  padding:10px;
}
.m-card-label {
  color:var(--sub);
  font-size:13px;
}
.m-card-value {
  font-size:20px;
  font-weight:900;
  margin-top:4px;
}
.m-stack {
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:8px;
}
.m-panel {
  background:#101010;
  border:1px solid #666;
  border-radius:12px;
  padding:12px;
  margin-top:10px;
}
.m-big {
  font-size:20px;
  font-weight:900;
  margin:6px 0;
}
.m-list-btn {
  width:100%;
  display:flex;
  justify-content:space-between;
  gap:8px;
  text-align:left;
  margin-bottom:7px;
}
.m-list-btn span {
  color:var(--sub);
  font-size:13px;
  text-align:right;
}
.m-equip {
  width:100%;
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:7px;
  text-align:left;
}
.m-equip span {
  color:var(--sub);
  font-size:13px;
}
.m-add {
  display:grid;
  gap:7px;
  margin-bottom:10px;
}
.m-add3 {
  display:grid;
  grid-template-columns:1fr 1fr 1fr;
  gap:7px;
}
.m-note {
  color:#ccc;
  font-size:13px;
  line-height:1.5;
  margin:4px 0 8px 2px;
}
.m-empty {
  background:#202020;
  border:1px solid #333;
  color:#999;
  border-radius:10px;
  padding:10px;
}
.m-log {
  background:#111;
  border:1px solid #555;
  border-radius:12px;
  padding:12px;
  margin-top:12px;
  white-space:pre-wrap;
  max-height:140px;
  overflow:auto;
}
.m-trait {
  display:block;
  border:1px solid #666;
  border-radius:12px;
  padding:8px 10px;
  margin:6px 0;
  background:#242424;
}
.m-result {
  background:#111;
  border:1px solid #666;
  border-radius:12px;
  padding:12px;
  margin:8px 0;
  white-space:pre-wrap;
  min-height:44px;
}
.m-details {
  margin-top:8px;
  background:#151515;
  border:1px solid #333;
  border-radius:10px;
  padding:10px;
}
.m-locked {
  color:#aaa;
  padding:5px 0;
}
.m-sub {
  color:var(--sub);
  font-size:13px;
  margin:6px 0;
}
.m-dice-panel {
  background:#101010;
  border:1px solid #666;
  border-radius:14px;
  padding:14px;
  margin-bottom:10px;
  text-align:center;
}
.m-dice-label {
  color:var(--sub);
  font-size:13px;
  margin-bottom:6px;
}
.m-dice-display {
  font-size:46px;
  font-weight:900;
  line-height:1.1;
  letter-spacing:.04em;
}
.m-dice-detail {
  color:#ddd;
  font-size:15px;
  margin-top:6px;
  min-height:22px;
}
.m-dice-rolling {
  animation:mDiceRoll .42s linear infinite;
}
@keyframes mDiceRoll {
  0% { transform:rotate(-5deg) scale(1); filter:brightness(1); }
  25% { transform:rotate(4deg) scale(1.08); filter:brightness(1.4); }
  50% { transform:rotate(-3deg) scale(.98); filter:brightness(1.15); }
  75% { transform:rotate(5deg) scale(1.06); filter:brightness(1.35); }
  100% { transform:rotate(-5deg) scale(1); filter:brightness(1); }
}
@media (max-width:650px) {
  .m-top,
  .m-bars,
  .m-cards,
  .m-stack {
    grid-template-columns:1fr;
  }
  .m-grid {
    grid-template-columns:1fr 1fr;
  }
  .m-level {
    grid-template-columns:1fr 1fr;
  }
  .m-add3 {
    grid-template-columns:1fr;
  }
  .m-list-btn {
    flex-direction:column;
  }
}
</style>

<div class="m-top">
  <input id="nameInput" value="${esc(state.이름)}">
  <select id="typeInput">
    <option value="플레이어" ${state.구분 === "플레이어" ? "selected" : ""}>플레이어</option>
    <option value="적" ${state.구분 === "적" ? "selected" : ""}>적</option>
  </select>
</div>

<div class="m-level">
  <button class="m-btn" data-action="levelDown5">Lv -5</button>
  <button class="m-btn" data-action="levelDown1">Lv -1</button>
  <button class="m-btn" data-action="levelUp1">Lv +1</button>
  <button class="m-btn" data-action="levelUp5">5Lv 플러스</button>
</div>

<div class="m-section">
  <div class="m-cards">
    ${card("레벨", state.레벨)}
    ${card("남은 스탯 포인트", state.포인트)}
    ${card("스탯 최대치", d.maxS)}
    ${card("코인", state.코인)}
  </div>
</div>

<div class="m-bars">
  ${bar("HP", state.현재HP, d.maxHP)}
  ${bar("MP", state.현재MP, d.maxMP)}
</div>

<div class="m-section">
  <h3>스탯</h3>
  <div class="m-note">+/- 버튼은 그대로 사용 가능. 숫자칸을 직접 수정하고 Enter를 누르거나 입력칸을 벗어나면 자동 적용된다.</div>
  <div class="m-grid">
    ${statBox("힘", "힘")}
    ${statBox("민첩", "민첩")}
    ${statBox("체력", "체력")}
    ${statBox("지능", "지능")}
    ${statBox("지혜", "지혜")}
    ${statBox("외모", "외모")}
  </div>
  <button class="m-btn full" data-action="saveBasic">직접 입력값 적용 / 저장</button>
</div>

<div class="m-section">
  <h3>파생 수치</h3>
  <div class="m-note">
    규칙 공식 적용: 최대 HP=체력×10 / 최대 MP=레벨×5+지능×10 / MP 회복량=레벨+지혜×2 / 평타 피해=floor((힘+체력)/10)+2<br>
    외공, 내공, 검기, 심법, 심적초월, 특성 배수는 기본 파생값 계산 후 적용된다.
  </div>
  <div class="m-cards">
    ${card("최대 HP", d.maxHP)}
    ${card("최대 MP", isImmortalActive() ? "무한" : d.maxMP)}
    ${card("평타 피해", d.baseAtk)}
    ${card("최종 공격 피해", d.atk)}
    <button class="m-card m-click-card" data-action="regenMP">
      <div class="m-card-label">MP 회복량</div>
      <div class="m-card-value">${d.mpRegen}</div>
      <div class="m-sub">누르면 MP 회복</div>
    </button>
    ${card("멀티캐스팅", d.multi)}
    ${card("검기 효과", `${d.ki.name} / 공격 ${d.ki.atkMul}배 / 최대MP ${d.ki.mpDelta >= 0 ? "+" : ""}${d.ki.mpDelta}`)}
  </div>
  <button class="m-btn full" data-action="floorClear">층 클리어</button>
</div>

<div class="m-section">
  <h3>무공 스택</h3>
  <div class="m-stack">
    <div class="m-card">
      <div class="m-card-label">외공</div>
      <div class="m-card-value">${state.외공}</div>
      <div class="m-sub">스택당 최대체력 1.4배 / 현재 ${d.외공배수.toFixed(2)}배</div>
      <div class="m-row2">
        <button class="m-small" data-action="stackDown" data-key="외공">-</button>
        <button class="m-small" data-action="stackUp" data-key="외공">+</button>
      </div>
    </div>

    <div class="m-card">
      <div class="m-card-label">내공</div>
      <div class="m-card-value">${state.내공}</div>
      <div class="m-sub">스택당 최대마나/회복량 1.2배 / 현재 ${d.내공배수.toFixed(2)}배</div>
      <div class="m-row2">
        <button class="m-small" data-action="stackDown" data-key="내공">-</button>
        <button class="m-small" data-action="stackUp" data-key="내공">+</button>
      </div>
    </div>

    <div class="m-card">
      <div class="m-card-label">검기</div>
      <div class="m-card-value">${state.검기}</div>
      <div class="m-sub">${d.ki.name}</div>
      <div class="m-row2">
        <button class="m-small" data-action="stackDown" data-key="검기">-</button>
        <button class="m-small" data-action="stackUp" data-key="검기">+</button>
      </div>
    </div>
  </div>
</div>

<div class="m-section">
  <h3>HP / MP / 코인 직접 조정</h3>
  <div class="m-add3">
    <input id="coinDelta" type="number" placeholder="코인 변화량 예: -1 또는 5">
    <button class="m-btn" data-action="coinAdjust">코인 적용</button>
  </div>
  <div class="m-add3">
    <input id="hpDelta" type="number" placeholder="HP 변화량 예: -30 또는 50">
    <input id="mpDelta" type="number" placeholder="MP 변화량 예: -50 또는 100">
    <button class="m-btn" data-action="manualResource">적용</button>
  </div>
</div>

<div class="m-section">
  <h3>상태이상</h3>
  <div class="m-result">${esc(state.상태결과)}</div>
  <div class="m-add3">
    <input id="statusInput" placeholder="상태이상 예: 기절 2턴 / 행동불능 3턴">
    <button class="m-btn" data-action="addStatus">상태이상 추가</button>
    <button class="m-btn danger" data-action="clearStatus">상태이상 전체 제거</button>
  </div>
  ${statusHTML()}
</div>

<div class="m-section">
  <h3>판정 / 다이스</h3>
  <div class="m-dice-panel">
    <div class="m-dice-label">다이스 결과</div>
    <div id="diceDisplay" class="m-dice-display">${esc(state.다이스표시)}</div>
    <div id="diceDetail" class="m-dice-detail">${esc(state.다이스상세)}</div>
  </div>
  <div class="m-grid">
    ${STAT_KEYS.map(s => `
      <button class="m-btn" data-action="statDice" data-stat="${s}">${s} 판정 1d${effStat(s)}</button>
    `).join("")}
  </div>
  <button class="m-btn full" data-action="d100">1d100</button>
</div>

<div class="m-section">
  <h3>마법 목록</h3>
  <div class="m-panel">
    <div class="m-note">
      <b>마법 위력 규칙</b><br>
      마법 위력은 절대 사용 MP를 넘지 않음.<br>
      1서클은 사용 MP의 약 1/5 수준.<br>
      서클이 오를수록 MP 대비 위력 효율이 상승함.<br>
      광역, 소환, 기능형 마법은 범위와 활용성이 큰 대신 위력이 낮아짐.<br>
      단일 고집중 마법은 범위가 좁은 대신 위력이 가장 높음.<br>
      각 마법은 이름, 서클, 범위 유형에 따라 MP와 위력이 개별 조정됨.
    </div>
  </div>
  <div class="m-result">${esc(state.마법결과)}</div>
  <div class="m-add">
    <select id="magicSelect" size="8">${magicSelectOptions()}</select>
    <button class="m-btn" data-action="addMagic">선택한 마법 직접 추가</button>
  </div>
  ${ownedMagicHTML()}
</div>

<div class="m-section">
  <h3>스킬 제작</h3>
  <div class="m-panel">
    <div class="m-note">
      <b>스킬 제작 설명</b><br><br>
      스킬 이름: 화면에 표시될 스킬 이름<br>
      MP 변화량: 음수면 마나 소모, 양수면 마나 회복<br>
      HP 변화량: 음수면 체력 소모, 양수면 체력 회복<br>
      공격 피해 배수: 최종 공격 피해에 곱해지는 값. 1.1이면 1.1배, 5면 5배<br>
      판정 보정: 스킬 판정 결과에 더하는 값. 절대판정에도 적용<br>
      패시브: 선택한 스탯에 +값을 상시 적용. 해당 스탯을 쓰는 모든 판정과 절대판정에도 적용<br>
      추가 설명: 조건, 사거리, 대상, 효과를 자유 입력
    </div>
  </div>
  <div class="m-add">
    <input id="skillName" value="${esc(editSkill?.name ?? "")}" placeholder="스킬 이름">
    <div class="m-add3">
      <input id="skillMp" type="number" value="${editSkill?.mp ?? -10}" placeholder="MP 변화량: 소모 -50 / 회복 50">
      <input id="skillHp" type="number" value="${editSkill?.hp ?? 0}" placeholder="HP 변화량: 소모 -20 / 회복 20">
      <input id="skillDamage" type="number" step="0.1" value="${editSkill?.damage ?? 1.0}" placeholder="최종 공격 피해 배수 예: 1.1 / 5 / 20">
    </div>
    <div class="m-add3">
      <input id="skillBonus" type="number" value="${editSkill?.bonus ?? 0}" placeholder="판정 보정 +값">
      <select id="skillStat">
        ${STAT_KEYS.map(s => `<option value="${s}" ${(editSkill?.stat ?? "힘") === s ? "selected" : ""}>${s} 판정</option>`).join("")}
        <option value="없음" ${(editSkill?.stat ?? "") === "없음" ? "selected" : ""}>판정 없음</option>
      </select>
      <select id="skillKind">
        ${["공격","방어","회복","버프","디버프","이동","특수","패시브"].map(k => `<option value="${k}" ${(editSkill?.kind ?? "공격") === k ? "selected" : ""}>${k}</option>`).join("")}
      </select>
    </div>
    <div class="m-add3">
      <select id="passiveStat">
        ${STAT_KEYS.map(s => `<option value="${s}" ${(editSkill?.passiveStat ?? "힘") === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>
      <input id="passiveValue" type="number" value="${editSkill?.passiveValue ?? 0}" placeholder="패시브 스탯 +값">
      <button class="m-btn" data-action="${editSkill ? "saveSkillEdit" : "addSkill"}">${editSkill ? "스킬 수정 저장" : "스킬 추가"}</button>
    </div>
    ${editSkill ? `<button class="m-btn full" data-action="cancelSkillEdit">스킬 수정 취소</button>` : ""}
    <textarea id="skillNote" rows="3" placeholder="효과, 조건, 사거리, 대상, 추가 설명">${esc(editSkill?.note ?? "")}</textarea>
  </div>
  <div class="m-result">${esc(state.스킬결과)}</div>

  <h3>스킬 목록</h3>
  ${skillHTML()}
</div>

<div class="m-section">
  <h3>장비 / 아이템</h3>
  <div class="m-add">
    <input id="manualItem" placeholder="직접 추가할 장비 / 아이템 이름">
    <button class="m-btn" data-action="addManualItem">아이템 추가</button>
  </div>
  ${equipHTML()}
  ${itemPanelHTML()}
  ${choicePanelHTML()}
</div>

<div class="m-section">
  <h3>보상 뽑기</h3>
  ${rewardHTML()}
</div>



<div class="m-section">
  <h3>천사의 시련</h3>
  <div class="m-result">${esc(state.시련결과)}</div>
  <div class="m-cards">
    ${card("기본 공격 시련값", d.atk)}
    ${card("획득 방식", "수치 이하 미획득 단계만 획득")}
    ${card("획득 완료 단계", state.천사획득단계.length ? state.천사획득단계.join(", ") : "없음")}
    ${card("파괴 보상", "앙케 라")}
  </div>
  <div class="m-add3">
    <button class="m-btn" data-action="angelBase">기본 공격값 적용</button>
    <input id="angelManual" type="number" placeholder="직접 결과 입력">
    <button class="m-btn" data-action="angelManual">직접값 적용</button>
  </div>
  <div class="m-row2">
    <button class="m-btn full" data-action="angelBreak">파괴됨: 앙케 라 획득</button>
    <button class="m-btn full danger" data-action="angelResetClaim">시련 획득기록 초기화</button>
  </div>
</div>

<div class="m-section">
  <h3>특성 / 오리지널 마나</h3>
  <div class="m-panel">
    <h4>오리지널 마나</h4>
    <textarea id="originalMana" rows="4" placeholder="오리지널 마나 이름과 설명">${esc(state.오리지널마나)}</textarea>
    <button class="m-btn full" data-action="saveOriginalMana">오리지널 마나 저장</button>
  </div>

  ${traitHTML()}

  <div class="m-panel">
    <h4>적용 중인 특성 효과</h4>
    <div class="m-result">${esc(특성효과요약())}</div>
    <div class="m-row3">
      ${hasTrait("원영") ? `<button class="m-btn" data-action="traitWonYoung" ${state.원영사용됨 ? "disabled" : ""}>원영 부활</button>` : ""}
      ${hasTrait("빙백연혼") ? `<button class="m-btn" data-action="traitIceSoul" ${state.빙백연혼사용됨 ? "disabled" : ""}>빙백연혼</button>` : ""}
      ${hasTrait("정령왕") ? `<button class="m-btn" data-action="traitSpiritKing" ${state.정령왕사용됨 ? "disabled" : ""}>정령왕 기술</button>` : ""}
    </div>
    <div class="m-row2">
      ${hasTrait("헤일로") ? `<button class="m-btn" data-action="traitHalo" ${state.헤일로사용됨 ? "disabled" : ""}>헤일로 마법 강화</button>` : ""}
      ${hasTrait("임모탈 평선") ? (isImmortalActive()
        ? `<button class="m-btn danger" data-action="cancelImmortal">임모탈 평선 취소</button>`
        : `<button class="m-btn" data-action="activateImmortal">임모탈 평선 발동</button>`) : ""}
    </div>
    <div class="m-row3">
      ${hasTrait("삼매경") ? `<button class="m-btn" data-action="traitSamadhi">삼매경 사용</button>` : ""}
      ${hasTrait("신적초월") ? `<button class="m-btn" data-action="traitDivineBody">신적초월 사용</button>` : ""}
      ${hasTrait("자기상환적 돌연변이") ? `<button class="m-btn danger" data-action="selfMutationReset">자기상환 해제</button>` : ""}
    </div>
    ${hasTrait("자기상환적 돌연변이") ? `
      <div class="m-panel">
        <h4>자기상환적 돌연변이</h4>
        <div class="m-result">${esc(state.자기상환결과)}</div>
        <div class="m-add3">
          <input id="selfMutationMul" type="number" step="0.1" value="${Math.max(1, num(state.자기상환배수, 1))}" placeholder="공격력 배수">
          <button class="m-btn" data-action="selfMutationApply">배수 적용</button>
          <button class="m-btn" data-action="selfMutationQuick" data-mul="2">2배</button>
        </div>
        <div class="m-row3">
          <button class="m-btn" data-action="selfMutationQuick" data-mul="3">3배</button>
          <button class="m-btn" data-action="selfMutationQuick" data-mul="5">5배</button>
          <button class="m-btn" data-action="selfMutationQuick" data-mul="10">10배</button>
        </div>
      </div>
    ` : ""}
    <div class="m-result">${esc(state.특성결과)}</div>
  </div>

  ${(hasTrait("스키마: 회복력 강화") || hasTrait("스키마: 근력 강화") || hasTrait("스키마: 속도강화")) ? `
    <div class="m-panel">
      <h4>스키마</h4>
      <div class="m-row3">
        ${hasTrait("스키마: 회복력 강화") ? `<button class="m-btn" data-action="schemaHeal">회복력 강화</button>` : ""}
        ${hasTrait("스키마: 근력 강화") ? `<div class="m-card"><div class="m-card-label">근력 강화</div><div class="m-card-value">힘 판정 +${10 * (hasTrait("접기") ? 2 : 1)}</div><div class="m-sub">상시 적용${hasTrait("접기") ? " / 접기 2배" : ""}</div></div>` : ""}
        ${hasTrait("스키마: 속도강화") ? `<div class="m-card"><div class="m-card-label">속도 강화</div><div class="m-card-value">민첩 판정 +${10 * (hasTrait("접기") ? 2 : 1)}</div><div class="m-sub">상시 적용${hasTrait("접기") ? " / 접기 2배" : ""}</div></div>` : ""}
      </div>
    </div>
  ` : ""}

  <div class="m-panel">
    <h3>특성 기술 제작</h3>
    <div class="m-note">
      정령 마법, 공법, 입천, 극기, 유물, 헤일로 같은 미정의 보상은 여기서 기술로 만든다.<br>
      각 출처는 1개만 제작 가능하다. 제작 후 해당 출처의 제작 UI는 사라지고 기술 목록에만 표시된다.
    </div>
    ${availableTechSources(editTech?.source).length ? `
      <div class="m-add">
        <select id="techSource">${techOptions(editTech?.source)}</select>
        <input id="techName" value="${esc(editTech?.name ?? "")}" placeholder="기술 이름">
        <div class="m-add3">
          <input id="techMp" type="number" value="${editTech?.mp ?? -10}" placeholder="MP 변화량">
          <input id="techHp" type="number" value="${editTech?.hp ?? 0}" placeholder="HP 변화량">
          <input id="techDamage" type="number" step="0.1" value="${editTech?.damage ?? 1.0}" placeholder="공격력 배수">
        </div>
        <div class="m-add3">
          <input id="techBonus" type="number" value="${editTech?.bonus ?? 0}" placeholder="판정 보정 +값">
          <select id="techStat">
            ${STAT_KEYS.map(s => `<option value="${s}" ${(editTech?.stat ?? "힘") === s ? "selected" : ""}>${s} 판정</option>`).join("")}
            <option value="없음" ${(editTech?.stat ?? "") === "없음" ? "selected" : ""}>판정 없음</option>
          </select>
          <select id="techKind">
            ${["공격","방어","회복","버프","디버프","이동","특수"].map(k => `<option value="${k}" ${(editTech?.kind ?? "특수") === k ? "selected" : ""}>${k}</option>`).join("")}
          </select>
        </div>
        <textarea id="techNote" rows="3" placeholder="기술 효과, 조건, 사거리, 대상, 추가 설명">${esc(editTech?.note ?? "")}</textarea>
        <button class="m-btn full" data-action="${editTech ? "saveTechEdit" : "addTech"}">${editTech ? "기술 수정 저장" : "기술 제작"}</button>
        ${editTech ? `<button class="m-btn full" data-action="cancelTechEdit">기술 수정 취소</button>` : ""}
      </div>
    ` : `<div class="m-empty">제작 가능한 새 특성 기술 없음</div>`}
    <div class="m-result">${esc(state.기술결과)}</div>
    <h3>특성 기술 목록</h3>
    ${techHTML()}
  </div>
</div>
</div>

`;

  let actionPointer = null;
  let actionBusy = false;

  root.onpointerdown = event => {
    const target = event.target.closest("[data-action]");
    if (!target || !root.contains(target) || target.disabled) return;

    actionPointer = {
      el: target,
      x: event.clientX,
      y: event.clientY,
      t: Date.now(),
      pointerId: event.pointerId,
    };
  };

  root.onpointercancel = () => {
    actionPointer = null;
  };

  root.onpointerleave = event => {
    if (actionPointer && event.pointerId === actionPointer.pointerId) {
      actionPointer = null;
    }
  };

  root.onclick = event => {
    const target = event.target.closest("[data-action]");
    if (!target || !root.contains(target)) return;
    event.preventDefault();
    event.stopPropagation();
  };

  root.onpointerup = async event => {
    const target = event.target.closest("[data-action]");
    if (!target || !root.contains(target) || target.disabled || !actionPointer) return;

    const start = actionPointer;
    actionPointer = null;

    if (target !== start.el) return;

    const dx = Math.abs(event.clientX - start.x);
    const dy = Math.abs(event.clientY - start.y);
    const dt = Date.now() - start.t;

    // 스크롤, 드래그, 길게 누름은 클릭으로 처리하지 않는다.
    if (dx > 10 || dy > 10 || dt > 900) return;

    event.preventDefault();
    event.stopPropagation();

    if (actionBusy) return;
    actionBusy = true;

    try {
      const el = target;
      event.preventDefault();
      event.stopPropagation();
      el.classList.remove("m-flash");
      void el.offsetWidth;
      el.classList.add("m-flash");
      const action = el.dataset.action;
      const dNow = calc();

      if (action === "saveBasic") {
        await applyBasicAndStats("스탯 저장");
      }

      if (action === "levelUp1") {
        await save({ 레벨: state.레벨 + 1, 기록: "레벨 +1 / 포인트 총량 +3" });
      }

      if (action === "levelDown1") {
        await save({ 레벨: Math.max(1, state.레벨 - 1), 기록: "레벨 -1 / 포인트 총량 -3" });
      }

      if (action === "levelDown5") {
        await save({ 레벨: Math.max(1, state.레벨 - 5), 기록: "레벨 -5 / 포인트 총량 -15" });
      }

      if (action === "levelUp5") {
        await save({
          레벨: state.레벨 + 5,
          기록: "5Lv 플러스: 레벨 +5 / 포인트 총량 +15",
        });
      }

      if (action === "floorClear") {
        await save({
          현재HP: dNow.maxHP,
          현재MP: isImmortalActive() ? 0 : dNow.maxMP,
          상태이상: [],
          상태결과: "층 클리어: 모든 상태이상 제거",
          원영사용됨: false,
          정령왕사용됨: false,
          헤일로사용됨: false,
          헤일로강화준비: false,
          빙백연혼사용됨: false,
          자기상환배수: 1,
          자기상환결과: "층 클리어: 자기상환 배수 초기화",
          기록: "층 클리어: HP/MP 회복, 상태이상 제거, 층당 1회 능력 초기화",
        });
      }

      if (action === "statPlus") {
        const key = el.dataset.key;
        if (state[key] >= dNow.maxS) {
          await save({ 기록: `${key} 증가 실패: 현재 최대 스탯 ${dNow.maxS}` });
          return;
        }
        if (state.포인트 <= 0) {
          await save({ 기록: `${key} 증가 실패: 스탯 포인트 부족` });
          return;
        }
        await save({
          [key]: state[key] + 1,
          기록: `${key} +1`,
        });
      }

      if (action === "statMinus") {
        const key = el.dataset.key;
        if (state[key] <= 1) return;
        await save({
          [key]: state[key] - 1,
          기록: `${key} -1`,
        });
      }

      if (action === "stackUp") {
        const key = el.dataset.key;
        const limit = key === "검기" ? 6 : 999;
        await save({
          [key]: clamp(state[key] + 1, 0, limit),
          기록: `${key} 스택 +1`,
        });
      }

      if (action === "stackDown") {
        const key = el.dataset.key;
        await save({
          [key]: Math.max(0, state[key] - 1),
          기록: `${key} 스택 -1`,
        });
      }

      if (action === "coinAdjust") {
        const delta = num(root.querySelector("#coinDelta").value);
        const next = Math.max(0, state.코인 + delta);

        await save({
          코인: next,
          기록: `코인 ${delta >= 0 ? "+" : ""}${delta} / 현재 코인 ${next}`,
        });
      }

      if (action === "regenMP") {
        const next = isImmortalActive() ? 0 : clamp(state.현재MP + dNow.mpRegen, 0, dNow.maxMP);
        await save({
          현재MP: next,
          기록: `MP 회복: +${dNow.mpRegen} / 현재 MP ${next}`,
        });
      }

      if (action === "manualResource") {
        const hp = num(root.querySelector("#hpDelta").value);
        const mp = num(root.querySelector("#mpDelta").value);

        await save({
          현재HP: clamp(state.현재HP + hp, 0, dNow.maxHP),
          현재MP: isImmortalActive() ? 0 : clamp(state.현재MP + mp, 0, dNow.maxMP),
          기록: `직접 조정: HP ${hp >= 0 ? "+" : ""}${hp}, MP ${mp >= 0 ? "+" : ""}${mp}`,
        });
      }

      if (action === "addStatus") {
        const status = root.querySelector("#statusInput").value.trim();
        await save({
          상태이상: addStatusToList(state.상태이상, status),
          상태결과: status ? `상태이상 추가: ${status}` : "상태이상 이름 필요",
          기록: status ? `상태이상 추가: ${status}` : "상태이상 이름 필요",
        });
      }

      if (action === "removeStatus") {
        const index = num(el.dataset.index);
        const target = state.상태이상[index];
        await save({
          상태이상: state.상태이상.filter((_, i) => i !== index),
          상태결과: `상태이상 제거: ${target ?? ""}`,
          기록: `상태이상 제거: ${target ?? ""}`,
        });
      }

      if (action === "clearStatus") {
        await save({
          상태이상: [],
          상태결과: "상태이상 전체 제거",
          기록: "상태이상 전체 제거",
        });
      }

      if (action === "statDice") {
        const stat = el.dataset.stat;
        const bonus = judgeBonus(stat);

        const sides = effStat(stat);
        const roll = dice(sides);
        const finalValue = roll + bonus;
        const detail = `${stat} 판정: 1d${sides} = ${roll}${bonus ? ` / 특성·스킬 보정 +${bonus} / 최종 ${finalValue}` : ""}`;

        showDiceRoll(sides, finalValue, detail);
        clearOneShotBonus(stat);

        setTimeout(async () => {
          await save({
            기록: detail,
            다이스표시: String(finalValue),
            다이스상세: detail,
          });
        }, 1050);
      }

      if (action === "d100") {
        const roll = dice(100);
        const detail = `1d100 = ${roll}`;

        showDiceRoll(100, roll, detail);

        setTimeout(async () => {
          await save({
            기록: detail,
            다이스표시: String(roll),
            다이스상세: detail,
          });
        }, 1050);
      }

      if (action === "addMagic") {
        const key = root.querySelector("#magicSelect").value;
        const m = MAGIC_POOL.find(x => x.key === key);
        if (!m) return;

        if (state.보유마법.includes(key)) {
          await save({ 마법결과: `${m.name}은 이미 보유 중`, 기록: `${m.name}은 이미 보유 중` });
          return;
        }

        await save({
          보유마법: [...state.보유마법, key],
          마법결과: `마법 추가: ${m.name}`,
          기록: `마법 추가: ${m.name}`,
        });
      }

      if (action === "castMagic") {
        const key = el.dataset.key;
        const m = MAGIC_POOL.find(x => x.key === key);
        if (!m) return;

        const cost = m.mp;

        if (isImmortalActive()) {
          const intJudge = absoluteJudge("지능");
          const wisJudge = absoluteJudge("지혜");

          if (!intJudge.success || !wisJudge.success) {
            await save({
              현재HP: 0,
              마법결과: `${m.name} 사용 실패: 임모탈 평선 절대판정 실패. ${intJudge.text} / ${wisJudge.text} / 사망`,
              기록: `${m.name} 사용 실패`,
            });
            return;
          }

          const haloMul = state.헤일로강화준비 ? 2 : 1;
          const finalPower = Math.floor(m.damage * haloMul);

          await save({
            헤일로강화준비: false,
            마법결과: `${m.name} 사용: 임모탈 평선 판정 성공 / 범위 ${m.range} / 위력 ${finalPower}${haloMul > 1 ? " (헤일로 2배)" : ""} / ${m.desc}`,
            기록: `${m.name} 사용`,
          });
          return;
        }

        if (state.현재MP - cost < 0) {
          await save({ 마법결과: `${m.name} 사용 실패: MP 부족`, 기록: `${m.name} 사용 실패: MP 부족` });
          return;
        }

        const haloMul = state.헤일로강화준비 ? 2 : 1;
        const finalPower = Math.floor(m.damage * haloMul);

        await save({
          현재MP: state.현재MP - cost,
          헤일로강화준비: false,
          마법결과: `${m.name} 사용: MP -${cost}, 범위 ${m.range}, 위력 ${finalPower}${haloMul > 1 ? " (헤일로 2배)" : ""} / ${m.desc}`,
          기록: `${m.name} 사용`,
        });
      }

      if (action === "removeMagic") {
        const key = el.dataset.key;
        const m = MAGIC_POOL.find(x => x.key === key);
        await save({
          보유마법: state.보유마법.filter(x => x !== key),
          마법결과: `마법 제거: ${m ? m.name : key}`,
          기록: `마법 제거: ${m ? m.name : key}`,
        });
      }

      if (action === "editSkill") {
        await save({
          편집스킬: num(el.dataset.index),
          스킬결과: "스킬 수정 모드",
        });
      }

      if (action === "cancelSkillEdit") {
        await save({
          편집스킬: null,
          스킬결과: "스킬 수정 취소",
        });
      }

      if (action === "addSkill" || action === "saveSkillEdit") {
        const name = root.querySelector("#skillName").value.trim();
        if (!name) {
          await save({ 기록: "스킬 추가 실패: 이름 필요", 스킬결과: "스킬 이름 필요" });
          return;
        }

        const skill = {
          name,
          mp: num(root.querySelector("#skillMp").value),
          hp: num(root.querySelector("#skillHp").value),
          damage: num(root.querySelector("#skillDamage").value, 1),
          bonus: num(root.querySelector("#skillBonus").value),
          stat: root.querySelector("#skillStat").value,
          kind: root.querySelector("#skillKind").value,
          passiveStat: root.querySelector("#passiveStat").value,
          passiveValue: num(root.querySelector("#passiveValue").value),
          note: root.querySelector("#skillNote").value.trim(),
        };

        if (action === "saveSkillEdit") {
          const index = num(state.편집스킬, -1);
          if (index < 0 || !state.스킬목록[index]) {
            await save({ 편집스킬: null, 스킬결과: "수정할 스킬 없음" });
            return;
          }

          await save({
            스킬목록: state.스킬목록.map((s, i) => i === index ? skill : s),
            편집스킬: null,
            스킬결과: `스킬 수정: ${skill.name}`,
            기록: `스킬 수정: ${skill.name}`,
          });
          return;
        }

        await save({
          스킬목록: [...state.스킬목록, skill],
          스킬결과: `스킬 추가: ${skill.name}`,
          기록: `스킬 추가: ${skill.name} / 공격 ${Math.floor(calc().atk * Number(skill.damage ?? 1))} (${Number(skill.damage ?? 1)}배)`,
        });
      }

      if (action === "useSkill") {
        const index = num(el.dataset.index);
        const s = state.스킬목록[index];
        if (!s) return;

        const mp = num(s.mp);
        const hp = num(s.hp);

        if (isImmortalActive() && mp < 0) {
          const intJudge = absoluteJudge("지능");
          const wisJudge = absoluteJudge("지혜");

          if (!intJudge.success || !wisJudge.success) {
            await save({
              현재HP: 0,
              스킬결과: `${s.name} 사용 실패: 임모탈 평선 절대판정 실패. ${intJudge.text} / ${wisJudge.text} / 사망`,
              기록: `${s.name} 사용 실패`,
            });
            return;
          }
        } else {
          if (state.현재MP + mp < 0) {
            await save({ 스킬결과: `${s.name} 사용 실패: MP 부족`, 기록: `${s.name} 사용 실패: MP 부족` });
            return;
          }
        }

        if (state.현재HP + hp < 0) {
          await save({ 스킬결과: `${s.name} 사용 실패: HP 부족`, 기록: `${s.name} 사용 실패: HP 부족` });
          return;
        }

        const nextMP = isImmortalActive() ? 0 : clamp(state.현재MP + mp, 0, dNow.maxMP);
        const nextHP = clamp(state.현재HP + hp, 0, dNow.maxHP);
        const multiplier = Math.max(0, Number(s.damage ?? 1));
        const finalDamage = Math.floor(dNow.atk * multiplier);
        let judge = "";

        if (s.stat && s.stat !== "없음") {
          const sides = effStat(s.stat);
          const roll = dice(sides);
          const traitBonus = judgeBonus(s.stat);
          const finalJudge = roll + num(s.bonus) + traitBonus;
          judge = ` / ${s.stat} 판정: 1d${sides}=${roll} +${num(s.bonus)}${traitBonus ? ` +${traitBonus}` : ""} = ${finalJudge}`;
          clearOneShotBonus(s.stat);
        }

        await save({
          현재MP: nextMP,
          현재HP: nextHP,
          스킬결과: `${s.name} 사용: 공격 ${finalDamage} (${multiplier}배), MP ${mp >= 0 ? "+" : ""}${mp}, HP ${hp >= 0 ? "+" : ""}${hp}${judge}`,
          기록: `${s.name} 사용`,
        });
      }

      if (action === "deleteSkill") {
        const index = num(el.dataset.index);
        await save({
          스킬목록: state.스킬목록.filter((_, i) => i !== index),
          스킬결과: "스킬 제거 완료",
          기록: "스킬 삭제",
        });
      }

      if (action === "addManualItem") {
        const name = root.querySelector("#manualItem").value.trim();
        if (!name) {
          await save({ 기록: "아이템 이름 필요" });
          return;
        }

        await save({
          장비목록: addItem(makeItem(name)),
          기록: `아이템 추가: ${name}`,
        });
      }

      if (action === "selectItem") {
        await save({
          선택아이템: num(el.dataset.index),
          선택모드: null,
          기록: "아이템 선택",
        });
      }

      if (action === "removeItem") {
        const index = num(el.dataset.index);
        const item = state.장비목록[index];
        await save({
          장비목록: removeItem(index),
          선택아이템: null,
          선택모드: null,
          기록: `아이템 제거: ${item?.name ?? ""}`,
        });
      }

      if (action === "sellItem") {
        const index = num(el.dataset.index);
        const item = state.장비목록[index];
        if (!item) return;

        const sell = num(item.sell, 0);

        await save({
          코인: state.코인 + sell,
          장비목록: removeItem(index),
          선택아이템: null,
          선택모드: null,
          기록: `아이템 판매: ${item.name} / 코인 +${sell}`,
        });
      }

      if (action === "useItem") {
        const index = num(el.dataset.index);
        const item = state.장비목록[index];
        if (!item) return;

        if (item.name === "외공서") {
          await save({
            외공: state.외공 + 1,
            장비목록: removeItem(index),
            선택아이템: null,
            기록: "외공서 사용: 외공 +1",
          });
          return;
        }

        if (item.name === "내공서") {
          await save({
            내공: state.내공 + 1,
            장비목록: removeItem(index),
            선택아이템: null,
            기록: "내공서 사용: 내공 +1",
          });
          return;
        }

        if (item.name === "검기") {
          await save({
            검기: clamp(state.검기 + 1, 0, 6),
            장비목록: removeItem(index),
            선택아이템: null,
            기록: "검기 사용: 검기 +1",
          });
          return;
        }

        if (item.name === "멀티캐스팅의 서") {
          await save({
            멀티캐스팅: state.멀티캐스팅 + 1,
            장비목록: removeItem(index),
            선택아이템: null,
            기록: "멀티캐스팅의 서 사용: 멀티캐스팅 +1",
          });
          return;
        }

        if (item.type === "reset") {
          await save({
            스킬목록: [],
            장비목록: removeItem(index),
            선택아이템: null,
            기록: "스킬 초기화권 사용: 스킬 목록 초기화",
          });
          return;
        }

        if (item.type === "magicTicket") {
          if (item.mode === "select") {
            await save({
              선택모드: { kind: "magicSelect", index },
              기록: `${item.name} 사용: 선택할 마법을 고르세요`,
            });
            return;
          }

          const book = randomSpellByGrade(item.grade);
          const next = removeItem(index);
          next.push(book);

          await save({
            장비목록: next,
            선택아이템: null,
            기록: `${item.name} 사용: ${book.name} 획득`,
          });
          return;
        }

        if (item.type === "magicBook") {
          let book = item;

          if (!book.spellKey) {
            book = randomSpellByGrade(item.grade);
          }

          const spell = MAGIC_POOL.find(m => m.key === book.spellKey);
          if (!spell) {
            await save({ 기록: "마법서 오류: 마법 없음" });
            return;
          }

          if (state.보유마법.includes(spell.key)) {
            await save({
              장비목록: removeItem(index),
              선택아이템: null,
              기록: `${spell.name}은 이미 보유 중. 마법서 제거`,
            });
            return;
          }

          const diff = learnDifficulty(item.grade);
          const roll = dice(diff);
          const success = roll < state.지혜 || state.지혜 >= diff;

          if (!success) {
            await save({
              기록: `${spell.name} 습득 실패: 1d${diff}=${roll}, 지혜 ${state.지혜}. 마법서는 유지`,
            });
            return;
          }

          await save({
            보유마법: [...state.보유마법, spell.key],
            장비목록: removeItem(index),
            선택아이템: null,
            기록: `${spell.name} 습득 성공: 1d${diff}=${roll}, 지혜 ${state.지혜}`,
          });
          return;
        }

        if (item.type === "choice") {
          let choices = item.choices;

          if (!choices) choices = defaultChoices(item.name);

          await save({
            장비목록: state.장비목록.map((x, i) => i === index ? { ...x, choices } : x),
            선택모드: { kind: "choiceItem", index },
            기록: `${item.name} 사용: 선택지를 고르세요`,
          });
          return;
        }

        if (item.type === "special") {
          await save({
            특성목록: addTraitToList(state.특성목록, item.name),
            장비목록: removeItem(index),
            선택아이템: null,
            선택모드: null,
            기록: `특성 획득: ${item.name}`,
          });
          return;
        }

        if (item.type === "trait") {
          const blockReason = canSelectChoice(item.name);
          if (blockReason) {
            await save({ 기록: blockReason });
            return;
          }

          await save({
            특성목록: addTraitToList(state.특성목록, item.name),
            장비목록: removeItem(index),
            선택아이템: null,
            선택모드: null,
            기록: `특성 획득: ${item.name}`,
          });
          return;
        }

        await save({ 기록: `${item.name}은 자동 사용 규칙 없음` });
      }

      if (action === "confirmMagicChoice") {
        const index = num(el.dataset.index);
        const item = state.장비목록[index];
        const key = root.querySelector("#choice-magic").value;
        const spell = MAGIC_POOL.find(m => m.key === key);

        if (!spell || !item) return;

        const book = {
          name: `${spell.name} 마법서`,
          type: "magicBook",
          grade: item.grade,
          spellKey: spell.key,
          sell: item.grade === "기초" ? 3 : item.grade === "중급" ? 5 : 8,
        };

        const next = removeItem(index);
        next.push(book);

        await save({
          장비목록: next,
          선택아이템: null,
          선택모드: null,
          기록: `${item.name} 사용: ${book.name} 획득`,
        });
      }

      if (action === "confirmChoiceItem") {
        const index = num(el.dataset.index);
        const choice = el.dataset.choice;
        const item = state.장비목록[index];

        if (!item) return;

        const blockReason = canSelectChoice(choice);
        if (blockReason) {
          await save({
            기록: blockReason,
          });
          return;
        }

        let nextItems = removeItem(index);
        let nextTraits = [...state.특성목록];
        let nextCoin = state.코인;
        let log = `${item.name} 사용: ${choice} 선택`;

        if (choice === "50코인") {
          nextCoin += 50;
        } else if (choice === "스키마") {
          nextItems.push({
            name: "스키마 효과 선택권",
            type: "choice",
            choices: ["스키마: 회복력 강화", "스키마: 근력 강화", "스키마: 속도강화"],
            sell: 0,
          });
          log = "스키마 선택: 스키마 효과 선택권을 장비에 추가";
        } else if (isTraitChoice(choice)) {
          const before = nextTraits.length;
          nextTraits = addTraitToList(nextTraits, choice);
          if (nextTraits.length === before && !nextTraits.includes(choice)) {
            await save({ 기록: `${choice} 선택 불가` });
            return;
          }
        } else {
          nextItems.push(makeItem(choice));
        }

        await save({
          코인: nextCoin,
          장비목록: nextItems,
          특성목록: nextTraits,
          선택아이템: null,
          선택모드: null,
          기록: log,
        });
      }

      if (action === "cancelChoice") {
        await save({
          선택모드: null,
          기록: "선택 취소",
        });
      }

      if (action === "drawReward") {
        const cfg = rewardConfig();
        const rewards = Array.from({ length: cfg.offer }, () => rollReward());

        await save({
          보상후보: rewards,
          보상선택남음: cfg.pick,
          기록: `보상 뽑기: ${cfg.offer}개 중 ${cfg.pick}개 선택`,
        });
      }

      if (action === "takeReward") {
        const index = num(el.dataset.index);
        const reward = state.보상후보[index];

        if (!reward || state.보상선택남음 <= 0) return;

        const nextCandidates = state.보상후보.filter((_, i) => i !== index);
        const left = state.보상선택남음 - 1;

        if (reward.type === "coin") {
          await save({
            코인: state.코인 + num(reward.coin),
            보상후보: left <= 0 ? [] : nextCandidates,
            보상선택남음: left,
            기록: `보상 선택: ${reward.name} / 코인 +${num(reward.coin)}`,
          });
        } else {
          await save({
            장비목록: addItem(reward),
            보상후보: left <= 0 ? [] : nextCandidates,
            보상선택남음: left,
            기록: `보상 선택: ${reward.name}`,
          });
        }
      }

      if (action === "angelBase") {
        const score = dNow.atk;
        await applyAngelReward(score, `천사의 시련 기본 공격값: ${score}`);
      }

      if (action === "angelManual") {
        const score = num(root.querySelector("#angelManual").value);
        await applyAngelReward(score, `천사의 시련 직접값: ${score}`);
      }

      if (action === "angelResetClaim") {
        await save({
          천사획득단계: [],
          시련결과: "천사의 시련 획득기록 초기화",
          기록: "천사의 시련 획득기록 초기화",
        });
      }

      if (action === "angelBreak") {
        const claimed = new Set(arr(state.천사획득단계).map(x => Number(x)));
        const breakKey = -1;

        if (claimed.has(breakKey)) {
          await save({
            시련결과: "파괴됨: 앙케 라는 이미 획득함",
            기록: "앙케 라 중복 획득 차단",
          });
          return;
        }

        claimed.add(breakKey);
        await save({
          장비목록: addItem(makeItem("앙케 라")),
          천사획득단계: Array.from(claimed).sort((a, b) => a - b),
          시련결과: "파괴됨: 앙케 라 획득",
          기록: "앙케 라 획득",
        });
      }

      if (action === "saveOriginalMana") {
        await save({
          오리지널마나: root.querySelector("#originalMana").value.trim(),
          기록: "오리지널 마나 저장",
        });
      }

      if (action === "editTech") {
        await save({
          편집기술: num(el.dataset.index),
          기술결과: "기술 수정 모드",
        });
      }

      if (action === "cancelTechEdit") {
        await save({
          편집기술: null,
          기술결과: "기술 수정 취소",
        });
      }

      if (action === "addTech" || action === "saveTechEdit") {
        const source = root.querySelector("#techSource")?.value ?? "";
        const name = root.querySelector("#techName")?.value.trim() ?? "";

        if (!source) {
          await save({ 기술결과: "기술 출처 필요" });
          return;
        }
        if (!name) {
          await save({ 기술결과: "기술 이름 필요" });
          return;
        }

        const tech = {
          source,
          name,
          mp: num(root.querySelector("#techMp")?.value),
          hp: num(root.querySelector("#techHp")?.value),
          damage: num(root.querySelector("#techDamage")?.value, 1),
          bonus: num(root.querySelector("#techBonus")?.value),
          stat: root.querySelector("#techStat")?.value ?? "없음",
          kind: root.querySelector("#techKind")?.value ?? "특수",
          note: root.querySelector("#techNote")?.value.trim() ?? "",
        };

        if (action === "saveTechEdit") {
          const index = num(state.편집기술, -1);
          if (index < 0 || !state.기술목록[index]) {
            await save({ 편집기술: null, 기술결과: "수정할 기술 없음" });
            return;
          }

          const duplicate = state.기술목록.some((t, i) => i !== index && t.source === source);
          if (duplicate) {
            await save({ 기술결과: `${source} 기술은 이미 존재함` });
            return;
          }

          await save({
            기술목록: state.기술목록.map((t, i) => i === index ? tech : t),
            편집기술: null,
            기술결과: `기술 수정: ${tech.name}`,
            기록: `기술 수정: ${tech.name}`,
          });
          return;
        }

        if (state.기술목록.some(t => t.source === source)) {
          await save({ 기술결과: `${source} 기술은 이미 1개 제작됨` });
          return;
        }

        await save({
          기술목록: [...state.기술목록, tech],
          기술결과: `기술 제작: ${tech.name}`,
          기록: `기술 제작: ${tech.name}`,
        });
      }

      if (action === "deleteTech") {
        const index = num(el.dataset.index);
        const target = state.기술목록[index];
        await save({
          기술목록: state.기술목록.filter((_, i) => i !== index),
          기술결과: `기술 제거: ${target?.name ?? ""}`,
          기록: "기술 제거",
        });
      }

      if (action === "useTech") {
        const index = num(el.dataset.index);
        const t = state.기술목록[index];
        if (!t) return;

        const mp = num(t.mp);
        const hp = num(t.hp);

        if (isImmortalActive() && mp < 0) {
          const intJudge = absoluteJudge("지능");
          const wisJudge = absoluteJudge("지혜");

          if (!intJudge.success || !wisJudge.success) {
            await save({
              현재HP: 0,
              기술결과: `${t.name} 사용 실패: 임모탈 평선 절대판정 실패. ${intJudge.text} / ${wisJudge.text} / 사망`,
              기록: `${t.name} 사용 실패`,
            });
            return;
          }
        } else if (state.현재MP + mp < 0) {
          await save({ 기술결과: `${t.name} 사용 실패: MP 부족`, 기록: `${t.name} 사용 실패` });
          return;
        }

        if (state.현재HP + hp < 0) {
          await save({ 기술결과: `${t.name} 사용 실패: HP 부족`, 기록: `${t.name} 사용 실패` });
          return;
        }

        const nextMP = isImmortalActive() ? 0 : clamp(state.현재MP + mp, 0, dNow.maxMP);
        const nextHP = clamp(state.현재HP + hp, 0, dNow.maxHP);
        const multiplier = Math.max(0, Number(t.damage ?? 1));
        const finalDamage = Math.floor(dNow.atk * multiplier);
        let judge = "";

        if (t.stat && t.stat !== "없음") {
          const sides = effStat(t.stat);
          const roll = dice(sides);
          const traitBonus = judgeBonus(t.stat);
          const finalJudge = roll + num(t.bonus) + traitBonus;
          judge = ` / ${t.stat} 판정: 1d${sides}=${roll} +${num(t.bonus)}${traitBonus ? ` +${traitBonus}` : ""} = ${finalJudge}`;
          clearOneShotBonus(t.stat);
        }

        await save({
          현재MP: nextMP,
          현재HP: nextHP,
          기술결과: `${t.name} 사용: 공격 ${finalDamage} (${multiplier}배), MP ${mp >= 0 ? "+" : ""}${mp}, HP ${hp >= 0 ? "+" : ""}${hp}${judge}`,
          기록: `${t.name} 사용`,
        });
      }

      if (action === "traitWonYoung") {
        if (!hasTrait("원영") || state.원영사용됨) return;
        await save({
          현재HP: Math.max(1, Math.floor(dNow.maxHP * 0.5)),
          원영사용됨: true,
          특성결과: "원영 발동: HP 50%로 부활",
          기록: "원영 발동",
        });
      }

      if (action === "traitIceSoul") {
        if (!hasTrait("빙백연혼") || state.빙백연혼사용됨) return;
        await save({
          빙백연혼사용됨: true,
          특성결과: "빙백연혼 발동: 영혼을 얼리는 불 사용. 층당 1회",
          기록: "빙백연혼 발동",
        });
      }

      if (action === "traitSpiritKing") {
        if (!hasTrait("정령왕") || state.정령왕사용됨) return;
        await save({
          정령왕사용됨: true,
          특성결과: "정령왕 기술 발동. 층당 1회",
          기록: "정령왕 기술 발동",
        });
      }

      if (action === "traitHalo") {
        if (!hasTrait("헤일로") || state.헤일로사용됨) return;
        await save({
          헤일로사용됨: true,
          헤일로강화준비: true,
          특성결과: "헤일로 발동: 다음 마법 위력 2배. 층당 1회",
          기록: "헤일로 발동",
        });
      }

      if (action === "activateImmortal") {
        if (!hasTrait("임모탈 평선")) return;
        await save({
          임모탈발동: true,
          현재MP: 0,
          특성결과: "임모탈 평선 발동: MP 총량 제거. MP 사용 시 지능·지혜 절대판정 필요",
          기록: "임모탈 평선 발동",
        });
      }

      if (action === "cancelImmortal") {
        if (!hasTrait("임모탈 평선")) return;
        await save({
          임모탈발동: false,
          현재MP: 0,
          특성결과: "임모탈 평선 취소: MP 0",
          기록: "임모탈 평선 취소",
        });
      }

      if (action === "traitSamadhi") {
        if (!hasTrait("삼매경")) return;
        await save({
          상태이상: addStatusToList(state.상태이상, "행동불능 3턴"),
          상태결과: "삼매경 사용: 행동불능 3턴 추가",
          특성결과: "삼매경 사용: 선택 행동에 필중/서치/관통/무시/치명타 성격 부여. 이후 행동불능 3턴",
          기록: "삼매경 사용",
        });
      }

      if (action === "traitDivineBody") {
        if (!hasTrait("신적초월")) return;
        await save({
          특성결과: "신적초월 사용: 불가능한 신체 움직임 가능",
          기록: "신적초월 사용",
        });
      }

      if (action === "selfMutationApply" || action === "selfMutationQuick") {
        if (!hasTrait("자기상환적 돌연변이")) return;

        const inputMul = action === "selfMutationQuick"
          ? num(el.dataset.mul, 1)
          : num(root.querySelector("#selfMutationMul")?.value, 1);

        const mul = Math.max(1, inputMul);
        const sides = Math.max(1, Math.floor(mul * 20));
        const roll = dice(sides);
        const target = effStat("지혜") + judgeBonus("지혜");
        const success = roll <= target;

        if (!success) {
          await save({
            현재MP: 0,
            자기상환배수: 1,
            상태이상: addStatusToList(state.상태이상, "기절 2턴"),
            상태결과: "자기상환 실패: 기절 2턴 추가",
            자기상환결과: `자기상환 실패: 1d${sides}=${roll} / 지혜 기준 ${target}. MP 0, 기절 2턴`,
            특성결과: "자기상환적 돌연변이 실패",
            기록: "자기상환적 돌연변이 실패",
          });
          return;
        }

        await save({
          자기상환배수: mul,
          자기상환결과: `자기상환 성공: 1d${sides}=${roll} / 지혜 기준 ${target}. 공격력 ${mul}배 적용`,
          특성결과: `자기상환적 돌연변이: 공격력 ${mul}배 적용`,
          기록: `자기상환적 돌연변이 ${mul}배 적용`,
        });
      }

      if (action === "selfMutationReset") {
        await save({
          자기상환배수: 1,
          자기상환결과: "자기상환 배수 해제",
          특성결과: "자기상환적 돌연변이 배수 해제",
          기록: "자기상환 배수 해제",
        });
      }

      if (action === "schemaHeal") {
        const mul = hasTrait("접기") ? 2 : 1;
        const heal = 100 * mul;

        await save({
          현재HP: clamp(state.현재HP + heal, 0, dNow.maxHP),
          특성결과: `스키마 회복력 강화: HP +${heal}`,
          기록: `스키마 회복력 강화: HP +${heal}`,
        });
      }

    } finally {
      setTimeout(() => {
        actionBusy = false;
      }, 120);
    }
  };

  root.querySelectorAll("[data-stat-input]").forEach(input => {
    input.onchange = async () => {
      await applyBasicAndStats("스탯 직접 입력 적용");
    };

    input.onkeydown = async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
        await applyBasicAndStats("스탯 직접 입력 적용");
      }
    };
  });

  const nameInput = root.querySelector("#nameInput");
  if (nameInput) {
    nameInput.onchange = async () => {
      await applyBasicAndStats("이름 저장");
    };
  }

  const typeInput = root.querySelector("#typeInput");
  if (typeInput) {
    typeInput.onchange = async () => {
      await applyBasicAndStats("구분 저장");
    };
  }
}

render();
```
