# Orchestrator Protocols

simon-bot-sandbox의 Cross-Cutting 프로토콜. simon-bot의 프로토콜을 기반으로 하되, **State-Driven Execution**이 추가된다.

프로토콜은 두 종류로 나뉜다:
- **Instruction** (행동 지시): 무시하면 워크플로가 깨진다. 반드시 준수.
- **Guidance** (행동 규범): 상황에 따라 유연하게 적용. 무시하면 품질이 저하된다.

---

## Instruction 프로토콜

### State-Driven Execution (신규)

workflow-state.json은 워크플로 진행 상태의 Single Source of Truth다. LLM의 기억이 아닌 파일이 기준이다.

**갱신 규칙:**
- Step 시작: `current_step` 갱신, `last_updated` 갱신
- Step 완료: `completed_steps`에 추가, `next_step` 갱신
- Phase 전환: `current_phase` 갱신
- 중단/에러: `blocked: true`, `blocked_reason` 기록

**복원 규칙 (매 턴 시작):**
1. workflow-state.json 읽기
2. `blocked: true`이면 → `blocked_reason` 확인 후 해결 시도
3. `current_step`에 해당하는 Phase reference 로딩
4. 해당 Step부터 이어서 실행

**Compaction 후 복원:**
자동 또는 수동 compaction 후 다음을 무조건 재로딩한다:
1. workflow-state.json — 현재 Step 번호와 상태
2. 현재 Step의 reference 파일 — Done-When Checks
3. `jq '.hooks.PreToolUse' ~/.claude/settings.json` — forbidden-guard.sh 등록 확인

### Auto-Verification Hook (P-001)

모든 소스코드 파일 수정(Edit/Write) 후, `.claude/workflow/verify-commands.md`의 빌드/린트 명령을 즉시 실행한다.

- **빌드+린트**: 항상 실행
- **테스트**: 변경된 파일 관련 테스트만 (전체 스위트는 Step 5d VERIFY에서)
- **실패 시**: Stop-and-Fix Gate 적용
- **적용 제외**: `.md`, `.json` 설정 파일, 커밋 메시지 등 비소스코드
- **코드 품질 검토**: 구현 일단락 시점에서 `/simplify` 스킬 실행

hooks.PostToolUse에 `auto-verify.sh` 등록 시 자동 실행된다.

### Stop-and-Fix Gate

빌드, 린트, 타입체크, 테스트 중 하나라도 실패하면 **반드시 수정한 후에만** 다음 작업을 진행한다. "나중에 고치겠다"는 허용되지 않는다 — 미수정 실패는 누적되어 디버깅 비용이 기하급수적으로 증가하기 때문이다.

수정 후에는 동일 검증 명령을 재실행(Fix-Verify Loop)하여 통과를 확인한다.

### Deterministic Gate Principle

게이트 검증에서 결정론적으로 수행 가능한 작업(파일 존재 확인, 빌드/린트/테스트 실행, 패턴 매칭)은 bash 스크립트를 우선 사용한다. LLM은 스크립트 결과(PASS/FAIL)만 받아 후속 판단에 집중한다.

### Error Resilience

모든 실패를 ENV_INFRA / CODE_LOGIC / WORKFLOW_ERROR로 분류한 후 자동 복구한다. 사용자가 명시적으로 중단을 요청하지 않는 한 워크플로를 중단하지 않는다.

상세: `~/.claude/skills/simon-bot/references/error-resilience.md`

에러 발생 시 workflow-state.json에도 반영:
```json
{ "blocked": true, "blocked_reason": "CODE_LOGIC: test_auth_login 실패 — 3회 재시도 중" }
```
복구 완료 시 `blocked: false`, `blocked_reason: null`로 갱신.

### Decision Journal

주요 판단 지점에서 사용자에게 1줄 판단 근거를 제시하고, `.claude/memory/decision-journal.md`에 누적 기록한다.

형식: `[Decision] {Step} — {선택} (기각: {대안}). 이유: {근거}`

**Anti-Oscillation Rule**: 새 결정 전 decision-journal.md를 확인. 이전에 기각한 접근법을 다시 선택하려면, 이전 기각 이후 새로운 정보가 있어야 한다.

### Step Transition Gate

각 Step 완료 시 반드시:
1. 해당 Step의 Done-When 조건을 확인
2. workflow-state.json 갱신 (completed_steps에 추가, next_step 설정)
3. 산출물 파일 존재 확인

하나라도 미충족이면 다음 Step으로 진행하지 않는다.

---

## Guidance 프로토콜

### Session Isolation Protocol

동시 세션 충돌 방지. 세션별 런타임 데이터를 홈 디렉토리에 격리한다.

| 스킬 내 표기 | 실제 저장 위치 |
|-------------|--------------|
| `.claude/memory/*` | `{SESSION_DIR}/memory/*` |
| `.claude/reports/*` | `{SESSION_DIR}/reports/*` |

프로젝트 `.claude/workflow/` (config, scripts)는 공유 설정이므로 프로젝트 디렉토리에서 읽는다.

### Agent Teams

Agent Teams 기능 우선 사용 (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 필요). TeamCreate 실패 시 subagent fallback.
상세: `~/.claude/skills/simon-bot/references/agent-teams.md`

### Cognitive Independence

검증 에이전트가 구현 에이전트의 프레이밍에 anchoring되지 않도록 구조적·인지적 분리를 유지한다.
상세: `~/.claude/skills/simon-bot/references/context-separation.md`

### Subagent 사용 기준

독립적 컨텍스트가 필요한 병렬 작업, 역할 분리, 대량 코드 탐색, 독립 검증에 사용한다. 단일 파일 수정, 간단한 검색은 직접 수행한다.

| 용도 | maxTurns |
|------|----------|
| 코드 탐색 | 20 |
| 구현 (TDD) — SMALL | 50 |
| 구현 (TDD) — STANDARD | 100 |
| 검증/리뷰 | 30 |
| expert team member | 20 |

### Over-engineering 방지

plan-summary.md에 명시된 변경만 구현한다. 범위 밖 개선은 `.claude/memory/unresolved-decisions.md`에 기록만 한다.

### Parallel Tool Invocation

독립적인 도구 호출(Read, Grep, Glob 등)은 병렬로 실행한다. 의존성이 있는 호출만 순차 실행한다.

### Docs-First Protocol

외부 라이브러리·서비스 사용 시 학습 데이터 기반 기억에 의존하지 않고 공식 문서를 먼저 조회한다.
상세: `~/.claude/skills/simon-bot/references/docs-first-protocol.md`

### User Interaction Recording

매 단계에서 사용자 응답을 받을 때마다, 스킬 개선에 반영할 인사이트를 `.claude/memory/user-feedback-log.md`에 누적 기록한다.

### Phase-End Auto-Retrospective

각 Phase 경계에서 user-feedback-log.md를 스캔하고, 반복 교정/워크플로 마찰 패턴 감지 시 boost-capture를 백그라운드로 자동 트리거한다. 패턴 없으면 1줄 통보만 출력하고 즉시 진행.

### Handoff Notification

스킬 전환 시 사용자에게 1줄 통보: `[Handoff] {현재} → {다음}: {목적}`

---

## Context Window Management

### 선제적 Compaction

Step 전환 시:
1. `/context`로 활용률 확인
2. 70% 이상이면 workflow-state.json에 현재 상태 저장 확인 후 `/compact` 실행

### 세션 분할 경계

| 경계 | 시점 | 저장 상태 |
|------|------|----------|
| 1 | Phase A 완료 후 | plan-summary, code-design-analysis, expert-plan-concerns, requirements |
| 2 | Integration 완료 후 | integration-result, unit-*/implementation, review-findings |
| 3 | Step 18 완료 후 | review-sequence, report |

복원: workflow-state.json + 해당 memory 파일 읽기 → 다음 Step 이어서 실행.

### Memory Persistence

Record at: Step 완료, agent 전환, loop rollback, Unit 완료 시.
각 Step 시작 전에 workflow-state.json + 관련 memory 파일을 읽는다.

---

## Forbidden Rules

`~/.claude/skills/simon-bot/references/forbidden-rules.md`의 3계층 규칙(ABSOLUTE / CONTEXT-SENSITIVE / AUDIT-REQUIRED)을 전체 적용한다.
