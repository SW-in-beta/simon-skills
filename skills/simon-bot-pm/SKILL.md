---
name: simon-bot-pm
description: "프로젝트 매니저 - 앱 전체를 기획하고 simon-bot에게 작업을 분배하여 완성합니다. Use when: (1) 새 앱/서비스를 처음부터 만들고 싶을 때 ('앱 만들어줘', '서비스 구축해줘', '프로젝트 시작하자'), (2) 대규모 마이그레이션이나 리팩토링을 체계적으로 진행할 때, (3) 여러 기능을 조율하며 전체 프로젝트를 완성해야 할 때. 단일 기능이 아닌 '전체 프로젝트'를 관리하는 PM 역할입니다."
---

# simon-bot-pm

프로젝트 매니저 스킬. 사용자와 인터뷰하며 PRD를 작성하고, 작업을 분해하여 simon-bot/simon-bot-grind에게 분배한 뒤, 전체 프로젝트 완성까지 관리합니다.

## Scope Guard

이 스킬은 **여러 기능을 조율하는 전체 프로젝트 관리**를 위한 것입니다. 소규모 작업에 PM 워크플로를 적용하면 오버헤드만 늘어나므로, 아래 기준으로 적용 여부를 먼저 판단합니다:

| 기준 | simon-bot-pm 적용 | simon-bot으로 리다이렉트 |
|------|-------------------|------------------------|
| 기능(Feature) 수 | 3개 이상 | 1-2개 |
| 예상 변경 파일 수 | 15개 이상 | 15개 미만 |
| 기능 간 의존성 | 있음 | 없음 |
| PRD/작업 분해 필요 | 필요 | 불필요 (범위가 이미 명확) |

**리다이렉트 시 행동**: 사용자에게 왜 simon-bot-pm이 과한지 간략히 설명하고, simon-bot 사용을 제안한다. 강제하지 말고 사용자가 그래도 PM 워크플로를 원하면 진행한다.

---

## Instructions

이 스킬은 7단계 파이프라인으로 동작합니다:

| Phase | 이름 | 핵심 |
|-------|------|------|
| 0 | Project Setup | 프로젝트 유형 판별, 실행 모드 선택 |
| 1 | Spec-Driven Design | 인터뷰 → Spec(WHAT) → Architecture(HOW) → PRD |
| 2 | Task Breakdown | PRD → 기능 분해 → 의존성 그래프 → 실행 계획 |
| 3 | Environment Setup | 프로젝트 뼈대, 의존성, 설정 |
| 4 | Feature Execution | simon-bot/grind 파이프라인으로 기능별 구현 + 진행 관리 |
| 5 | Full Verification | 전체 레벨 통합 검증 |
| 6 | Delivery | 최종 보고, 가이드 리뷰, PR 생성 |

**Dependencies**: simon-bot/simon-bot-grind 스킬을 활용합니다. Claude Code의 Agent 및 Agent Teams 기능을 사용합니다.

## Cross-Cutting Protocols

### Decision Trail

주요 판단 지점에서 사용자에게 1줄 판단 근거를 함께 제시한다. PM이 왜 그렇게 결정했는지 투명하게 보여주어야 사용자가 방향을 교정할 수 있다.

적용 지점:
- **Feature 분배** (Phase 2): 각 Feature에 simon-bot vs simon-bot-grind를 할당한 이유
- **실행 순서 결정** (Phase 2): 그룹 구성과 병렬/순차 선택 이유
- **Re-planning** (Phase 4): 작업 변경이 필요한 이유 또는 불필요한 이유
- **Bot 전환** (Phase 4): simon-bot에서 simon-bot-grind로 전환하는 이유

형식 예시: `[판단] F3를 simon-bot-grind로 할당 — 외부 API 3개 연동 + 기존 코드 광범위 수정`

### Error Resilience

모든 실패를 자동 진단/복구한다. 사용자가 명시적으로 중단을 요청하지 않는 한 워크플로를 계속 진행한다.
실패 분류: ENV_INFRA (환경/인프라) vs CODE_LOGIC (코드/로직). 각각 다른 복구 전략 적용.

### Subagent 사용 기준

단일 파일 수정이나 간단한 작업은 PM이 직접 수행한다. Subagent는 독립적 컨텍스트가 필요한 병렬 작업에만 사용한다. Subagent를 불필요하게 spawn하면 컨텍스트 전달 오버헤드와 조율 비용이 생기기 때문이다.

| 상황 | 수행 방식 |
|------|----------|
| 단일 파일 수정, 설정 변경, 간단한 스크립트 | PM 직접 수행 |
| 독립적인 Feature 구현, 전문 분석(CTO/보안 리뷰) | Subagent spawn |
| 같은 파일을 건드리는 여러 작업 | 순차로 직접 수행 (병렬 불가) |

### State Management

모든 상태는 `.claude/pm/` 하위에 저장:

| 파일 | 내용 |
|------|------|
| `state.json` | 전체 진행 상태 (현재 phase, 실행 모드) |
| `spec.md` | Feature Specification (WHAT — 요구사항, 시나리오, 성공 기준) |
| `constitution.md` | Project Constitution (원칙, 품질 게이트, 제약) |
| `research.md` | 기술 리서치 결과 ([NEEDS CLARIFICATION] 해소) |
| `plan.md` | Implementation Plan (HOW — 기술 스택, 아키텍처, 기술 컨텍스트) |
| `prd.md` | PRD 문서 (spec + plan 종합) |
| `tasks.json` | 작업 목록 + 의존성 + 상태 |
| `tasks/{task-id}/spec.md` | 개별 작업 명세 |
| `tasks/{task-id}/result.md` | 작업 결과 |
| `progress.md` | 진행 현황 보고 |
| `verification.md` | 최종 검증 결과 |

---

## Phase 0: Project Setup

**0-A: 프로젝트 유형 판별**

사용자의 요청에서 자동 판별하고 확인만 한다:

- **Greenfield**: "만들고 싶어", "새로 시작", "프로젝트 생성" 등 → 새 프로젝트
- **Existing**: "리팩토링", "마이그레이션", "전환", "기존 코드" 등 → 기존 프로젝트

자동 판별 결과를 사용자에게 보여주고 맞는지 확인만 받는다 (별도 질문으로 묻지 않는다).
불확실한 경우에만 AskUserQuestion으로 질문한다.

Existing인 경우:
- 코드베이스 탐색 (`explore-medium`)으로 현황 파악
- AskUserQuestion: "simon-bot-report로 사전 분석 보고서를 먼저 작성할까요?"
  - Yes → `/simon-bot-report` 스킬 호출 → 결과를 Phase 1 인터뷰 컨텍스트로 활용
  - No → Phase 1로 직접 진행

**0-B: 실행 모드 선택**

AskUserQuestion:

> 각 기능 구현이 완료될 때마다 어떻게 진행할까요?
> 1. **자동 진행**: 완료 즉시 다음 작업으로 자동 진행 (중간 보고만)
> 2. **승인 후 진행**: 각 기능 완료 시 결과를 보고하고 승인 후 다음 작업 진행

선택을 `state.json`에 `execution_mode: "auto" | "approval"` 로 저장.

**0-C: 초기 상태 저장**

```json
// .claude/pm/state.json
{
  "phase": 0,
  "project_type": "greenfield|existing",
  "execution_mode": "auto|approval",
  "created_at": "timestamp",
  "tasks_total": 0,
  "tasks_completed": 0
}
```

---

## Phase 1: Spec-Driven Design (Interactive)

Spec-Driven Development 기반 설계. WHAT(요구사항)과 HOW(기술 결정)를 분리하여 체계적으로 진행한다.
사용자와 인터뷰하고, 전문가 에이전트 패널이 기술 결정을 지원한다.

이 단계가 전체 프로젝트의 품질을 결정하므로, 충분한 대화와 분석을 통해 구체화한다.

### 1-A: Vision Interview (AI-First Draft Protocol)

사용자가 처음부터 답하는 것보다, AI가 초안을 제시하고 사용자가 교정하는 것이 더 빠르고 정확하다.

**프로토콜:**
1. 사용자의 초기 요청에서 비전/기능/대상 사용자를 추출하여 Spec 초안을 먼저 작성한다
2. 초안을 제시: "이 방향으로 진행할까요? 수정할 부분이 있으면 알려주세요."
3. 사용자는 빈 칸을 채우는 대신, 잘못된 부분만 교정한다
4. 교정 후 인터뷰는 미해결 항목(비즈니스 결정, 우선순위, 트레이드오프)에만 집중한다

이 방식은 인터뷰 라운드를 줄이고 더 정확한 결과를 빠르게 도출한다. 아래 주제 커버가 필요한 부분만 추가 질문한다. 한 번에 2-3개 질문씩.

**인터뷰 분량 가이드:**
- 목표: 3-5 라운드, 총 8-12개 질문
- Greenfield: 비전 1라운드 + 기능별 1라운드씩 + 우선순위 1라운드 = 보통 4-5 라운드
- Existing: 비전/동기 1라운드 + 범위/호환성 1-2라운드 + 우선순위 1라운드 = 보통 3-4 라운드
- 사용자가 첫 메시지에서 이미 상세히 설명한 부분은 확인만 하고 넘어간다

**커버할 주제:**
- **비전**: 무엇을, 왜, 누구를 위해 만드는지
- **핵심 기능**: Must-have / Nice-to-have / Out of scope
- **세부 시나리오**: 각 핵심 기능의 상세 동작, 엣지 케이스, 에러 처리
- **UI/UX** (해당 시): 화면 구성, 사용자 흐름
- **규모/환경**: 예상 사용자 수, 배포 환경, 시간 제약

기술 스택은 이 단계에서 묻지 않는다 — 1-C에서 전문가 패널이 추천한다.
사용자가 스택을 먼저 언급하면 선호사항으로 기록해둔다.

**Interview Guard** (인터뷰 피로를 줄이고 핵심에 집중하기 위한 원칙):
- 사용자가 이미 답한 내용을 다시 묻지 않는다
- 코드에서 알 수 있는 것은 묻지 않는다 (existing 프로젝트의 경우)
- 비즈니스 결정과 우선순위에 집중한다
- 사용자가 "충분하다"고 하면 즉시 다음 단계로 넘어간다
- 질문이 너무 많아지지 않도록 -- 핵심 불확실성만 해소한다

### 1-B: Feature Specification (WHAT)

인터뷰 결과를 바탕으로 **무엇을** 만들지 정의한다. 기술적 구현 방법(HOW)은 포함하지 않는다.
For detailed template, read [spec-template.md](references/spec-template.md).

`planner` 에이전트에게 인터뷰 결과를 전달하여 Spec 작성:

**Spec 핵심 구성:**
1. **User Stories** — 우선순위(P1/P2/P3) + Given/When/Then 수용 시나리오. P1만으로 MVP 가능해야 함
2. **Functional Requirements** — FR-001 형식. 불확실한 항목은 `[NEEDS CLARIFICATION]` 마커 (최대 3개)
3. **Edge Cases** — 경계 조건, 에러 시나리오, 동시성 이슈
4. **Key Entities** — 개념적 엔티티 관계 (구현 디테일 없이)
5. **Success Criteria** — 기술 무관, 측정 가능한 성공 지표

Save: `.claude/pm/spec.md`

사용자에게 Spec을 제시하고 피드백을 받는다. 수정 요청 시 반영 후 재제시.

### 1-C: Technical Architecture (HOW) — Expert Panel

Spec이 확정되면, **어떻게** 만들지를 전문가 에이전트 패널과 함께 결정한다.
For detailed process, read [technical-architecture.md](references/technical-architecture.md).

**Step 1: CTO Agent** (`architect` role)

Spec + 사용자 선호사항 + 규모 예상치를 입력으로:
- 기술 스택 추천 (언어, 프레임워크, DB, 인프라) + 근거
- 규모 기반 아키텍처 패턴 추천 + 근거
- 대안 비교표 (최소 2개)
- 기술적 리스크 식별

사용자가 기술 스택을 이미 지정한 경우 → CTO는 해당 스택의 적합성을 검증하고 보완 추천만 한다.
사용자가 기술 스택을 모르는 경우 → CTO가 Spec 요구사항과 규모를 분석하여 최적의 스택을 추천한다.

**Step 2: Dev Lead Agent** (`architect` role)

CTO 추천을 검증:
- 구현 관점 실현 가능성 평가
- 숨겨진 복잡성/리스크 지적
- 수정 제안 또는 대안 제시

**Step 3: 사용자 최종 결정**

두 에이전트 의견을 비교표로 정리하여 제시 → AskUserQuestion으로 확인/수정.

**Step 4: Research & Clarification**

`[NEEDS CLARIFICATION]` 항목이 있으면 `researcher` 에이전트로 조사:
- 기술 선택 best practices
- 미결 요구사항 해소
- 결과를 `.claude/pm/research.md`에 정리
- Spec의 `[NEEDS CLARIFICATION]`을 해소하고 `spec.md` 업데이트

**Step 5: Constitution & Constraints**

프로젝트 원칙과 제약 조건을 확정. CTO agent가 초안을 제안하고 사용자가 확정:

```markdown
# Constitution: [프로젝트명]
## Core Principles (예: "성능보다 가독성", "외부 의존성 최소화")
## Quality Gates (예: 테스트 커버리지 80%, OWASP 준수)
## Constraints (기술적/비즈니스/시간 제약)
```

Save: `.claude/pm/constitution.md` — 이후 모든 Phase에서 참조

**Step 6: Implementation Plan**

확정된 기술 스택과 아키텍처를 Technical Context로 정리:

```markdown
## Technical Context
**Language/Version**: [e.g., Go 1.24]
**Primary Framework**: [e.g., Gin]
**Storage**: [e.g., PostgreSQL 16, Redis 7]
**Testing**: [e.g., go test + testify]
**Target Platform**: [e.g., Docker on AWS ECS]
**Project Type**: [e.g., web-service]
**Performance Goals**: [e.g., 1000 req/s, <200ms p95]
**Scale/Scope**: [e.g., 10K users, 50 API endpoints]
```

Save: `.claude/pm/plan.md`

### 1-D: PRD Assembly & Review

Spec(WHAT) + Plan(HOW) + Constitution을 종합하여 PRD를 조립한다:

```markdown
# PRD: [프로젝트명]

## 1. Overview (Spec에서)
## 2. Goals & Non-Goals (Spec에서)
## 3. User Stories & Acceptance Criteria (Spec에서)
## 4. Feature Inventory (Spec에서, 우선순위 포함)
## 5. Technical Architecture (Plan에서)
## 6. Technical Context (Plan에서)
## 7. Constraints & Principles (Constitution에서)
## 8. Success Criteria (Spec에서)
```

Save: `.claude/pm/prd.md`

PRD 전문을 사용자에게 제시 → AskUserQuestion:
- **승인**: Phase 2로 진행
- **수정 요청**: 해당 섹션 수정 후 재제시 (Spec/Plan/Constitution 원본도 함께 갱신)
- **추가 논의 필요**: 해당 주제에 대해 추가 인터뷰 또는 Expert Panel 재소집

---

## Phase 2: Task Breakdown

PRD를 구현 가능한 단위 작업(Feature)으로 분해합니다.

### 2-A: Feature Decomposition

`architect` 에이전트에게 PRD + Spec + Constitution을 분석시켜 작업 분해:

분해 원칙:
- 각 Feature는 simon-bot 하나가 처리할 수 있는 크기 (파일 5-15개, 단일 관심사) -- 컨텍스트 윈도우에 맞아야 품질이 유지된다
- Feature 간 의존성을 최소화 -- 병렬 실행을 가능하게 하고 실패 전파를 막는다
- 공통 인프라/설정은 별도 Feature로 분리 -- 다른 Feature들이 안정된 기반 위에서 작업할 수 있다
- 각 Feature는 독립적으로 테스트 가능해야 함 -- 통합 전에 개별 검증이 가능해야 한다
- User Story 단위로 Feature를 그룹핑 -- Spec의 P1/P2/P3 우선순위를 존중하여 가치 순서대로 전달한다

### 2-B: Dependency Analysis

```
architect:
- Feature 간 의존성 그래프 생성
- 병렬 실행 가능한 Feature 그룹 식별
- 순차 실행이 필요한 체인 식별
- 실행 순서 최적화 (Critical Path 기반)
```

### 2-C: Complexity Assessment & Bot Assignment

각 Feature별 복잡도 평가 → simon-bot vs simon-bot-grind 자동 할당:

| 기준 | simon-bot | simon-bot-grind |
|------|-----------|-----------------|
| 변경 파일 수 | ≤10 | >10 |
| 외부 연동 | 없거나 단순 | 복잡한 다중 연동 |
| 기존 코드 영향 | 제한적 | 광범위 |
| 빌드/테스트 난이도 | 안정적 | 실패 가능성 높음 |

### 2-D: Execution Plan 생성

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

### 2-E: 실행 계획 리뷰

사용자에게 시각적으로 제시:

```
Execution Plan:

Group 1 (순차) ─── [F1: 프로젝트 초기 설정] (simon-bot)
                        │
Group 2 (병렬) ─┬─ [F2: 사용자 인증] (simon-bot-grind)
                └─ [F3: 데이터 모델] (simon-bot)
                        │
Group 3 (순차) ─── [F4: API 엔드포인트] (simon-bot)
                        │
Group 4 (병렬) ─┬─ [F5: 프론트엔드] (simon-bot)
                └─ [F6: 알림 시스템] (simon-bot)
```

AskUserQuestion:
- **승인**: Phase 3로 진행
- **수정 요청**: Feature 분할/병합/순서 변경 → 재생성
- **Bot 변경**: 특정 Feature의 bot 할당 변경

---

## Phase 3: Environment Setup

기능 구현 전에 프로젝트 환경을 준비합니다.

**Scope Guard**: Feature Spec에 명시된 환경 구성만 수행한다. Spec에 없는 추상화 레이어, 유틸리티 모듈, 미래를 위한 확장 포인트 등을 선제적으로 만들지 않는다. 실제로 필요해지는 시점에 추가하는 것이 복잡성을 낮게 유지하는 방법이다.

### 3-A: Project Scaffolding (Greenfield Only)

`executor` 에이전트로 프로젝트 뼈대 생성:
- 디렉토리 구조
- 패키지 매니저 초기화 (package.json, go.mod, requirements.txt 등)
- 기본 설정 파일 (.gitignore, .editorconfig, linter 설정 등)
- CI/CD 기본 설정 (해당 시)
- README.md 초안

### 3-B: Dependencies & Tooling

PRD의 기술 스택에 따라:
- 핵심 의존성 설치
- 개발 도구 설정 (테스트 프레임워크, 린터 등)
- 빌드 스크립트 설정
- 빌드 + 초기 테스트 통과 확인

### 3-C: Git Setup

- Git 초기화 (greenfield) 또는 브랜치 생성 (existing)
- 초기 커밋
- `.claude/workflow/` 설정 (simon-bot 인프라)

### 3-D: 환경 검증

- 빌드 성공 확인
- 테스트 실행 가능 확인
- 개발 서버 기동 확인 (해당 시)

Save: 환경 세팅 결과를 `.claude/pm/progress.md`에 기록

---

## Phase 4: Feature Execution

각 Feature를 simon-bot 또는 simon-bot-grind에게 위임하여 구현합니다.
For detailed execution protocol, read [feature-execution.md](references/feature-execution.md).

### Execution Loop

`execution_groups` 순서대로 진행:

```
for each group in execution_groups:
    if group.type == "parallel":
        모든 features를 병렬로 실행 (각각 background agent)
        모두 완료될 때까지 대기
    else:
        features를 순차 실행

    그룹 간 통합 검증 (build + test)

    ── Re-planning Gate ──
    PM이 그룹 결과를 평가:
      - 예상과 다른 결과, 새로 드러난 의존성, 구현 불가 항목이 있는가?
      - 후속 그룹의 작업 분할/병합/순서 변경이 필요한가?
    재계획이 필요하면:
      - 변경 사항과 판단 근거를 사용자에게 제시
      - 사용자 승인 후 tasks.json 및 execution_groups 갱신
    재계획이 불필요하면:
      - 그대로 다음 그룹으로 진행
    ──────────────────────

    if execution_mode == "approval":
        사용자에게 그룹 완료 보고 → 승인 대기
    else:
        진행 상황만 보고 → 자동 진행
```

### Feature 실행 단위

**Scope Guard**: 각 Feature는 Task Spec에 명시된 변경만 구현한다. 요청하지 않은 추상화, 불필요한 헬퍼 파일 생성, 미래를 대비한 유연성 추가는 하지 않는다. 범위를 좁게 유지해야 Feature 간 충돌을 줄이고 리뷰 부담을 낮출 수 있다.

각 Feature 실행 시:

1. **Task Spec 생성**: `.claude/pm/tasks/{feature-id}/spec.md`
   - PRD에서 해당 기능의 요구사항 추출
   - 의존하는 Feature의 결과물 참조
   - 기술적 제약사항
   - 수용 기준 (Acceptance Criteria)

2. **Agent Spawn**: `general-purpose` 에이전트를 spawn하여 Feature 구현
   - Task Spec + 핵심 실행 파이프라인 규칙을 프롬프트에 인라인으로 포함
   - simon-bot의 핵심 파이프라인 (TDD, 코드 리뷰, 검증)을 따르도록 지시
   - 워크트리 격리 환경에서 실행

3. **결과 수집**: 완료 시 `.claude/pm/tasks/{feature-id}/result.md`에 기록

### Failure Recovery

| 실패 유형 | 1차 대응 | 2차 대응 | 3차 대응 |
|----------|---------|---------|---------|
| 빌드 실패 | 자동 진단 → 수정 재시도 | simon-bot-grind로 전환 | 사용자 에스컬레이션 |
| 테스트 실패 | 실패 원인 분석 → 수정 | 재시도 (max 3) | 사용자 에스컬레이션 |
| 의존성 충돌 | 의존 Feature 결과 재검토 | 실행 순서 재조정 | 사용자 에스컬레이션 |
| 컨텍스트 부족 | 추가 코드 탐색 | spec 재생성 | 사용자 에스컬레이션 |

### Bot Switch Notification (P-010)

simon-bot에서 simon-bot-grind로 전환할 때 사용자에게 반드시 알린다. 전환 시, deep-executor 프롬프트에 `feature-execution.md`의 "deep-executor 프롬프트 필수 포함 항목" 중 **grind 추가 필수** 항목도 반드시 추가한다.
```
[Bot Switch] F{N}: {feature-name}
- 전환 이유: {빌드 실패 3회 연속 / 테스트 복잡도 높음 / ...}
- simon-bot → simon-bot-grind (재시도 한계 10회, 자동 전략 전환 활성화)
```

### Progress Tracking

각 Feature 상태 변화 시 `.claude/pm/tasks.json` 갱신:
- `pending` → `running` → `completed` | `failed`
- 실패 시: `failure_reason`, `retry_count`, `escalated` 필드 추가

진행 현황을 `.claude/pm/progress.md`에 마크다운 테이블로 유지:

```markdown
## Progress Report — [3/6 Features completed] ████████░░░░ 50%

| Feature | Bot | Status | Branch | Notes |
|---------|-----|--------|--------|-------|
| F1: 초기 설정 | simon-bot | completed | feat/f1-setup | OK |
| F2: 사용자 인증 | simon-bot-grind | running | feat/f2-auth | Step 7/19 |
| F3: 데이터 모델 | simon-bot | running | feat/f3-model | Step 5/19 |
| F4: API 엔드포인트 | simon-bot | pending | - | F2, F3 대기 |
```

진행 바를 매 Feature 완료 시 갱신한다 (P-010).

---

## Phase 5: Full Verification

모든 Feature 완료 후, 전체 프로젝트 수준에서 통합 검증을 수행합니다.
For detailed verification protocol, read [full-verification.md](references/full-verification.md).

### 5-A: Integration

- 모든 Feature 브랜치를 메인 브랜치에 통합
- 충돌 해결 (`architect` 분석 → `executor` 해결)
- 통합 후 전체 빌드 + 테스트

### 5-B: Full Build & Test

```
executor:
- 전체 빌드 성공 확인
- 전체 테스트 스위트 실행 (0 failures)
- 타입 체크 통과 (해당 시)
- 린트 통과
```

### 5-C: Integration Testing

```
general-purpose (QA tester role):
- Feature 간 연동 동작 검증
- 데이터 흐름 E2E 시나리오 테스트
- 공통 사용자 시나리오 워크스루
- 엣지 케이스 검증
```

### 5-D: Architecture Review

```
architect:
- 전체 코드 구조 리뷰
- Feature 간 일관성 검증 (네이밍, 패턴, 에러 처리)
- 불필요한 중복 코드 식별
- 아키텍처 원칙 준수 확인
```

### 5-E: Security Review

```
security-reviewer:
- OWASP Top 10 검증
- 인증/인가 로직 검증
- 입력 검증, 에러 노출
- 비밀 정보 노출 확인
```

### 5-F: Issue Resolution

검증에서 발견된 이슈 처리:
- CRITICAL/HIGH: `executor`로 즉시 수정 → 재검증
- MEDIUM: 사용자에게 보고 → 수정 여부 결정
- LOW: 기록만 (`.claude/pm/verification.md`)

수정 후 5-B부터 재검증 (max 3 rounds)

### 5-G: Verification Report

`.claude/pm/verification.md`에 최종 검증 결과 저장:
- 빌드/테스트 결과
- 통합 테스트 결과
- 아키텍처 리뷰 결과
- 보안 리뷰 결과
- 미해결 이슈 목록

---

## Phase 6: Delivery (사용자 인터랙티브)

### 6-A: Final Report

사용자에게 전체 프로젝트 완료 보고:
- PRD 대비 구현 현황 (Feature별 완료 상태)
- 전체 검증 결과 요약
- 아키텍처 개요
- 미해결/보류 항목
- 향후 개선 제안

### 6-B: Guided Review

사용자에게 주요 Feature별로 순차 리뷰 제공:
- 각 Feature의 핵심 변경사항 요약
- 주요 설계 결정과 이유
- AskUserQuestion으로 피드백 수집
- 수정 요청 시 즉시 반영

### 6-C: Finalization

- 최종 수정사항 커밋
- AskUserQuestion: "PR을 생성할까요?"
- PR 생성 시 `/git-push-pr` 활용
- `.claude/pm/retrospective.md`에 회고 기록

---

## Success Criteria

프로젝트 완료 전 모두 검증한다. 하나라도 미충족이면 완료 불가 -- 출시 후 발견되는 결함보다 이 시점에서 잡는 것이 비용이 훨씬 낮다.

- [ ] PRD의 모든 Must-have 기능 구현 완료
- [ ] 전체 빌드 성공
- [ ] 전체 테스트 스위트 통과 (0 failures)
- [ ] 통합 테스트 통과
- [ ] 아키텍처 리뷰 CRITICAL 없음
- [ ] 보안 리뷰 CRITICAL 없음
- [ ] 사용자 가이드 리뷰 완료
- [ ] 미해결 결정사항 문서화됨

---

## Global Forbidden Rules

`~/.claude/skills/simon-bot/references/forbidden-rules.md`의 3계층 규칙(ABSOLUTE / CONTEXT-SENSITIVE / AUDIT-REQUIRED)을 전체 적용한다. Runtime Guard(P-008)도 Phase 4-5에서 적용한다.

---

## Context Window Management

컨텍스트 부족 시 세션 분할 경계:

| 경계 | 시점 | 저장 상태 |
|------|------|----------|
| 1 | Phase 1 완료 후 | spec.md, plan.md, constitution.md, research.md, prd.md |
| 2 | Phase 2 완료 후 | tasks.json, tasks/*/spec.md |
| 3 | Phase 4 중간 (그룹 완료 시) | progress.md, tasks/*/result.md |
| 4 | Phase 5 완료 후 | verification.md |

복원: `.claude/pm/state.json` + 해당 시점의 저장 파일 읽기 → 다음 Phase/Step 이어서 실행
