# Task Breakdown Detail

Phase 2의 상세 프로세스. SKILL.md에서 참조한다.

---

## 2-A: Feature Decomposition

`architect` 에이전트에게 PRD + Spec + Constitution을 분석시켜 작업 분해:

분해 원칙:
- 각 Feature는 simon-bot 하나가 처리할 수 있는 크기 (파일 5-15개, 단일 관심사) -- 컨텍스트 윈도우에 맞아야 품질이 유지된다
- Feature 간 의존성을 최소화 -- 병렬 실행을 가능하게 하고 실패 전파를 막는다
- 공통 인프라/설정은 별도 Feature로 분리 -- 다른 Feature들이 안정된 기반 위에서 작업할 수 있다
- 각 Feature는 독립적으로 테스트 가능해야 함 -- 통합 전에 개별 검증이 가능해야 한다
- User Story 단위로 Feature를 그룹핑 -- Spec의 P1/P2/P3 우선순위를 존중하여 가치 순서대로 전달한다

## 2-B: Dependency Analysis

```
architect:
- Feature 간 의존성 그래프 생성
- 병렬 실행 가능한 Feature 그룹 식별
- 순차 실행이 필요한 체인 식별
- 실행 순서 최적화 (Critical Path 기반)
```

## 2-C: Complexity Assessment & Bot Assignment

각 Feature별 복잡도 평가 -> simon-bot vs simon-bot-grind 자동 할당:

| 기준 | simon-bot | simon-bot-grind |
|------|-----------|-----------------|
| 변경 파일 수 | <=10 | >10 |
| 외부 연동 | 없거나 단순 | 복잡한 다중 연동 |
| 기존 코드 영향 | 제한적 | 광범위 |
| 빌드/테스트 난이도 | 안정적 | 실패 가능성 높음 |

## 2-D: Execution Plan 생성

각 Feature에 Task ID, User Story 귀속, 병렬 실행 가능 여부를 표기한다:

```json
// .claude/pm/tasks.json
{
  "features": [
    {
      "id": "F001",
      "name": "프로젝트 초기 설정",
      "description": "...",
      "story": null,
      "bot": "simon-bot",
      "parallel": false,
      "dependencies": [],
      "group": 1,
      "status": "pending",
      "priority": 1
    },
    {
      "id": "F002",
      "name": "사용자 인증",
      "description": "...",
      "story": "US-1",
      "bot": "simon-bot-grind",
      "parallel": true,
      "dependencies": ["F001"],
      "group": 2,
      "status": "pending",
      "priority": 2
    }
  ],
  "execution_groups": [
    { "group": 1, "features": ["F001"], "type": "sequential", "reason": "기반 설정" },
    { "group": 2, "features": ["F002", "F003"], "type": "parallel", "reason": "독립적 기능, 다른 파일" },
    { "group": 3, "features": ["F004"], "type": "sequential", "reason": "F002, F003에 의존" }
  ]
}
```

## 2-E: 실행 계획 리뷰

사용자에게 시각적으로 제시:

```
Execution Plan:

Group 1 (순차) --- [F1: 프로젝트 초기 설정] (simon-bot)
                        |
Group 2 (병렬) -+- [F2: 사용자 인증] (simon-bot-grind)
                +- [F3: 데이터 모델] (simon-bot)
                        |
Group 3 (순차) --- [F4: API 엔드포인트] (simon-bot)
                        |
Group 4 (병렬) -+- [F5: 프론트엔드] (simon-bot)
                +- [F6: 알림 시스템] (simon-bot)
```

AskUserQuestion:
- **승인**: Phase 3로 진행
- **수정 요청**: Feature 분할/병합/순서 변경 -> 재생성
- **Bot 변경**: 특정 Feature의 bot 할당 변경
