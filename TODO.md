
## saveVersion 19 새 목표 TODO

- [x] 목표를 GPTs 같은 대화형 TRPG 경험으로 전환한다.
- [x] 코드는 상태 기억/수치 연산/저장/검증을 담당하고 API는 GM 진행/플레이어 행동 처리/적 행동 처리/묘사를 담당하도록 prompt를 재정의한다.
- [x] `gm-turn`, `enemy-action`, `compact-summary` task를 추가하고 `gm-turn` compact payload를 사용한다.
- [x] 적 상세 UI를 숨기고 내부적으로만 적 1명을 유지한다.
- [x] 토큰 절약을 위해 전체 상태/전체 로그/전체 적 상세 대신 `sceneSummary`, `recentEvents`, 숨은 적 힌트만 API에 보낸다.
- [x] 보스몹 없음, 랜덤맵 없음, 11x11 고정 맵 유지, 원본에 없는 효과 창작 금지를 문서화한다.
- [ ] 실제 플레이 밸런싱을 원본 수치 기준으로 계속 검증한다.
