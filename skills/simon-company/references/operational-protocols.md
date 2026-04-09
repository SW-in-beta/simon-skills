# Operational Protocols

Cross-Cutting 운영 프로토콜 상세. SKILL.md에서 참조하는 세부 정의를 포함한다.

---

## Agile Sprint Methodology

이 스킬의 실행은 **Agile/Scrum 원칙**에 기반한다. 워터폴처럼 한번에 전부 만들지 않고, 작은 단위로 나눠 빠르게 구현하고 검증하는 사이클을 반복한다.

**핵심 프레임워크:**

| 방법론 | 적용 시점 | 핵심 원칙 |
|--------|----------|----------|
| **INVEST** | Phase 1 (User Story 작성) | Independent, Negotiable, Valuable, Estimable, Small, Testable |
| **Story Mapping** | Phase 1 (기능 구조화) | 사용자 여정 기반 기능 계층화 (Activity → Task → Story) |
| **DEEP Backlog** | Phase 3 (백로그 관리) | Detailed, Estimated, Emergent, Prioritized |
| **DoR / DoD** | Phase 3-4 (진입/완료 기준) | Definition of Ready → 작업 시작 조건, Definition of Done → 완료 조건 |
| **Sprint Cycle** | Phase 4 (반복 실행) | Plan → Execute → Review → Retro → Re-plan |
| **STICC** | Phase 1-3 (계획서 구조) | Situation → Task → Intent → Concerns → Criteria |

**Sprint 사이클 구조:**
```
Sprint N:
  1. Sprint Planning — 백로그에서 이번 Sprint의 작업 선정 (DoR 검증)
  2. Sprint Execution — simon-pm에 위임 (simon/grind 관리)
  3. Sprint Review — Agent Team으로 팀 리드 소집, Cross-Review (TRP + 통합 테스트)
  4. Sprint Retro — Agent Team에서 프로세스 개선점 논의
  5. Re-planning — 다음 Sprint에 반영
```

Phase 4에서 이 Sprint 사이클을 **Feature 그룹 단위**로 반복한다. 코드 구현은 **simon-pm**에 위임하고, Sprint Review/Retro는 **Agent Team**으로 팀 리드를 소집하여 수행한다. 각 Sprint 완료 시 **동작하는 소프트웨어 증분(increment)**이 나와야 한다.

**Plan Review Protocol (from simon):**
Phase 1-3의 계획/설계 산출물은 TRP 외에 추가로 **planner-critic-architect 3인 검증**을 거친다:
1. **planner**: 계획 작성/수정
2. **critic**: 논리·실현성 검증 (4축 평가: Completeness, Feasibility, Safety, Clarity — 각 1-5점, 모두 4점 이상 시 조기 종료)
3. **architect**: 구조 검증 + YAGNI/KISS 검증

이 검증은 TRP R1 전에 수행하여, TRP에 올라가는 산출물의 기본 품질을 보장한다.

---

## State Management

모든 상태는 `.claude/company/` 하위에 저장:

| 파일 | 내용 |
|------|------|
| `state.json` | 전체 진행 상태 (현재 phase, 실행 모드, 팀 편성) |
| `roster.json` | 활성 팀 목록 + 각 팀 리드 역할 정의 |
| `spec.md` | Feature Specification (WHAT) |
| `constitution.md` | Project Constitution (원칙, 품질 게이트) |
| `architecture.md` | 기술 아키텍처 |
| `design/` | 디자인 산출물 (wireframes, tokens, components) |
| `db-schema.md` | DBA 산출물 (스키마, 마이그레이션 전략) |
| `story-map.md` | Story Mapping (Activity → Task → Story 계층) |
| `contracts/` | 팀간 계약 (api-spec.md, data-contracts.md) |
| `prd.md` | PRD (spec + architecture + design 종합) |
| `backlog.json` | Product Backlog (DEEP 원칙, 규모 추정 포함) |
| `sprint-plan.md` | Sprint 계획 (Sprint별 Feature 할당) |
| `tasks/{task-id}/` | 개별 작업 명세 + 결과 |
| `quality/` | TRP 검토 결과, 체크리스트 |
| `deployment/` | CI/CD, Dockerfile, 모니터링 설정 |
| `deployment-checklist.md` | 배포 실행 체크리스트 (Phase 6-F에서 자동 생성) |
| `progress.md` | 진행 현황 보고 |
| `verification.md` | 최종 검증 결과 |

---

## Checklist Protocol

체크리스트는 Phase 내부의 세부 작업을 추적하는 메커니즘이다. compact 시 Phase 수준(state.json)은 보존되지만 Phase 내부 진행 상태가 유실되는 문제를 해결한다. cheer93 프로젝트에서 Phase 7 완료 후 배포 체크리스트 18개 항목의 진행 상태를 세션 간에 추적해야 했던 실제 사례에서 도입되었다.

### SSoT 역할 분리

| 관심사 | SSoT | 형식 |
|--------|------|------|
| 전체 Phase 진행 (Phase 0→1→...→7) | `state.json` | JSON |
| Phase 내부 작업 진행 (A-1, B-1...) | `deployment-checklist.md` | Markdown |
| Sprint 진행 (Sprint 1, 2, 3...) | `state.json`의 `current_sprint` | JSON |
| Sprint 내 Feature 진행 | `progress.md` | Markdown |

state.json은 "어떤 Phase에 있는가"를 관리하고, 체크리스트는 "그 Phase 안에서 어떤 항목까지 완료했는가"를 관리한다. 두 소스가 충돌하면 체크리스트의 체크박스 상태를 SSoT로 우선한다 — 체크박스는 항목 완료 시 즉시 갱신되므로 state.json보다 최신이다.

### state.json 확장 필드

기존 `phase`, `current_sprint`, `completed_tasks` 필드에 다음을 추가한다:

```json
{
  "phase": 7,
  "phase_status": "post_delivery",
  "current_substep": "7-E",
  "active_checklists": [
    {
      "path": ".claude/company/deployment-checklist.md",
      "total": 23,
      "completed": 5
    }
  ]
}
```

- `phase_status`: `in_progress` | `completed` | `post_delivery`. Phase 번호만으로는 "Phase 7에 진입했다"와 "Phase 7이 완료되었다"를 구분할 수 없으므로, 명시적 상태 필드를 추가한다.
- `current_substep`: Phase 내부 하위 단계 (예: "7-A", "7-B"). compact 후 Phase 내부 위치 복원에 사용.
- `active_checklists`: 활성 체크리스트 파일 참조. resume 시 이 경로의 파일을 자동으로 읽어 진행률을 파악한다.

### 체크리스트 파일 형식

**파일 위치**: `.claude/company/deployment-checklist.md`

**마크다운 형식**:

```markdown
# 배포 체크리스트

## Phase A: 코드 준비
- [x] A-1: [AUTO] 최종 빌드 확인 — `pnpm build`
- [x] A-2: [AUTO] 전체 테스트 PASS — `pnpm test:run`

## Phase B: 외부 서비스 설정
- [x] B-1: [MANUAL] Supabase 프로젝트 생성 + 키 확보
- [ ] B-2: [MANUAL] Supabase Auth — 카카오 OAuth Provider 설정
- [ ] B-3: [GUIDED] Supabase 마이그레이션 적용 — `supabase link && supabase db push`

## Phase C: 배포 검증 [blocked-by: Phase B]
- [ ] C-1: [GUIDED] Vercel 배포 성공 확인
```

**유형 태그**:
- `[AUTO]`: 에이전트가 명령어 실행으로 자동 검증. resume 시 일괄 실행 제안.
- `[MANUAL]`: 사용자가 외부 서비스에서 직접 수행. 에이전트는 완료 여부를 질문으로 확인. **설정 절차 안내 시 Docs-First Protocol 적용** — UI 경로/메뉴 구조는 기억에 의존하지 않고 공식 문서를 먼저 조회한 후 안내한다.
- `[GUIDED]`: 에이전트가 명령어를 제시하고, 사용자가 결과를 확인.

**커서 규약**: 별도 "현재 진행" 줄을 유지하지 않는다. **첫 번째 `[ ]` 항목이 현재 작업**이다. `[x]`로 체크하면 다음 `[ ]` 항목이 자동으로 현재 작업이 된다. 이렇게 하면 체크와 커서 이동이 단일 조작으로 통합되어 원자성 문제가 제거된다.

**갱신 시점**: 항목 완료 시 즉시 `[ ]` → `[x]`로 변경하고, `state.json`의 `active_checklists[].completed` 카운트도 함께 갱신한다.

### 적용 범위 가이드라인

체크리스트는 다음 조건 중 2개 이상을 충족하는 작업에 도입한다:
1. **외부 의존성**: 외부 서비스 설정, API 키 발급 등 코드 외부 작업 포함
2. **세션 간 연속성**: 하나의 세션에서 완료되지 않을 가능성이 높음 (항목 5개 이상)
3. **비가역적 단계**: 한번 실행하면 되돌리기 어려운 단계 포함
4. **순서 의존성**: 항목 간 순서가 중요하고, 순서 위반 시 실패 발생

이미 세분화된 Step/Phase 시스템이 존재하는 경우(simon의 19-Step 파이프라인), 재시도가 본질적인 작업(simon-grind), 단일 세션에서 완료 가능한 작업(항목 3개 이하)에는 체크리스트 대신 기존 메커니즘을 사용한다.

### 생성/업데이트/소비 주체

| 역할 | 주체 | 시점 |
|------|------|------|
| **생성** | simon-company (Phase 6-F) | Phase 6-E 완료 시 자동 생성 |
| **업데이트** | 실행 중인 에이전트 (CEO 또는 위임된 Bot) | 각 항목 완료 시 즉시 |
| **소비** | simon-sessions (resume flow) | 세션 복원 시 자동 읽기 |

---

## Artifact Persistence Protocol

기획·설계 산출물은 세션이 끝나면 사라진다. 각 Phase의 TRP 통과 직후 산출물을 Git에 커밋하여 영속화한다. 이 커밋은 후속 Phase에서 산출물을 참조할 때, 그리고 프로젝트 완료 후 디자인 반영을 검증할 때 근거가 된다.

| Phase 완료 시점 | 커밋 대상 | 커밋 메시지 예시 |
|----------------|----------|----------------|
| Phase 1 TRP 통과 | `spec.md`, `story-map.md`, `constitution.md` | `chore: Phase 1 Spec + Story Map 확정` |
| Phase 2 TRP 통과 | `architecture.md`, `design/`, `db-schema.md`, `prd.md` | `chore: Phase 2 Architecture + Design 확정` |
| Phase 3 TRP 통과 | `contracts/`, `backlog.json`, `sprint-plan.md`, `tasks/` | `chore: Phase 3 Sprint Plan + Contracts 확정` |
| Sprint N 완료 | `progress.md`, `quality/` | Sprint 커밋에 포함 |
| Phase 5-6 완료 | `quality/`, `deployment/` | 각 Phase 커밋에 포함 |

이를 통해:
1. 디자인 산출물(`design/`)이 Git에 보존되어 구현 시 참조 가능
2. 계약(`contracts/`)이 커밋되어 Cross-Review 시 원본 대조 가능
3. 세션 분할 시 이전 Phase 산출물을 Git에서 복원 가능

### Phase Transition Gate (하드 게이트)

다음 Phase로 진행하기 전에, 이전 Phase의 산출물이 **디스크에 파일로 존재**하는지 검증한다. 컨텍스트 윈도우 안에만 존재하고 파일로 영속화되지 않은 산출물은 세션 전환이나 컨텍스트 압축 시 소실된다. 이 게이트를 통과하지 못하면 다음 Phase로 진행할 수 없다.

**검증 방법**: Glob 또는 ls로 파일 존재 확인

| 전환 | 필수 파일 (하나라도 없으면 BLOCK) | 검증 명령 |
|------|--------------------------------|----------|
| **Phase 0 → 1** | `.claude/company/state.json`, `.claude/company/roster.json` | `ls .claude/company/state.json .claude/company/roster.json` |
| **Phase 1 → 2** | `.claude/company/spec.md`, `.claude/company/story-map.md`, `.claude/company/constitution.md` | `ls .claude/company/spec.md .claude/company/story-map.md .claude/company/constitution.md` |
| **Phase 2 → 3** | `.claude/company/architecture.md`, `.claude/company/prd.md` + (DBA 활성 시) `db-schema.md` + (Design 활성 시) `design/` | `ls .claude/company/architecture.md .claude/company/prd.md` |
| **Phase 3 → 4** | `.claude/company/contracts/api-spec.md` (Backend 활성 시), `.claude/company/backlog.json`, `.claude/company/sprint-plan.md` | `ls .claude/company/contracts/ .claude/company/backlog.json .claude/company/sprint-plan.md` |
| **Phase 4 → 5** | 모든 Sprint의 `.claude/company/tasks/*/result.md`, `.claude/company/progress.md` | `ls .claude/company/tasks/*/result.md .claude/company/progress.md` |
| **Phase 5 → 6** | `.claude/company/quality/test-report.md`, `.claude/company/quality/security-audit.md` | `ls .claude/company/quality/test-report.md` |
| **Phase 6 → 7** | `.claude/company/deployment/runbook.md` | `ls .claude/company/deployment/runbook.md` |

**BLOCK 시 행동:**
1. 누락된 파일 목록을 표시
2. 해당 파일의 내용이 컨텍스트에 있으면 → 즉시 파일로 저장 + Git 커밋
3. 컨텍스트에도 없으면 → 해당 Phase를 다시 실행
4. **절대로 파일 없이 다음 Phase로 진행하지 않는다**

이 게이트는 r93-cheer 프로젝트에서 발생한 실제 문제(spec.md, prd.md, contracts/ 등 Phase 1-3 산출물이 한 번도 파일로 생성되지 않아 후속 Phase에서 참조 불가)를 방지하기 위해 도입되었다.

---

## Context Window Management

컨텍스트 부족 시 세션 분할 경계:

| 경계 | 시점 | 저장 상태 |
|------|------|----------|
| 1 | Phase 1 완료 후 | spec.md, constitution.md |
| 2 | Phase 2 완료 후 | architecture.md, design/, db-schema.md |
| 3 | Phase 3 완료 후 | contracts/, tasks.json |
| 4 | Phase 4 중간 (그룹 완료 시) | progress.md, tasks/*/result.md |
| 5 | Phase 5 완료 후 | quality/, verification.md |
| 6 | Phase 6 완료 후 | deployment/ |

복원: `.claude/company/state.json` + 해당 시점의 저장 파일 읽기 → 다음 Phase 이어서 실행.

**Git Context 기반 복원 검증:** 세션 복원 시 `git log --oneline -15`를 실행하여 `state.json`의 현재 Phase와 실제 커밋 이력을 교차 검증한다. 커밋 메시지 패턴(`chore: Phase N ...`, `feat: Sprint N ...`)으로 실제 진행 상태를 확인하고, `state.json`과 불일치하면 git 이력을 SSoT로 우선하여 `state.json`을 보정한다.
