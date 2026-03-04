---
name: simon-bot-grind
description: "열일모드 - simon-bot의 밤샘 변형. 모든 재시도 한계를 10으로 설정하고, 자동 진단/복구/전략 전환으로 끝까지 물고 늘어집니다. Use when: (1) 반드시 성공해야 하는 고위험 피처, (2) 빌드/테스트 실패가 잦은 복잡한 코드베이스, (3) 사람 개입 최소화하고 끝까지 자동으로 해결하고 싶을 때."
---

# simon-bot-grind

**열일모드** — 끝날 때까지 끝난 게 아니다.

Based on `simon-bot` 19-step pipeline, enhanced with:
- **모든 재시도 한계 = 10** (포기하지 않는다)
- **새 재시도 지점** at previously non-retrying steps
- **자동 진단 시스템** that tracks failures and pivots strategy
- **체크포인트/롤백** for safe experimentation

## Grind Config Overrides

This skill uses the same `.omc/workflow/` infrastructure as simon-bot but overrides ALL retry-related config values to **10**:

```yaml
# GRIND MODE OVERRIDES — 열일모드: 모든 재시도 = 10
loop_limits:
  # ── Existing (ALL → 10) ────────────────────────
  critic_planner: 10            # 3 → 10  (Step 2)
  step4b_critical: 10           # 2 → 10  (Step 4-B)
  step7b_recheck: 10            # 1 → 10  (Step 7-B)
  step7_8: 10                   # 2 → 10  (Step 7-8)
  step16: 10                    # 3 → 10  (Step 16)
  step6_executor: 10            # 3 → 10  (Step 6)

  # ── New Retry Points (ALL = 10) ────────────────
  step5_build_retry: 10         # NEW: build/test failure retry in Step 5
  step5_strategy_pivot: 10      # NEW: full strategy pivot if Step 5 keeps failing
  step9_11_refactor: 10         # NEW: Step 11 → Step 9 refactoring loop
  step12_major: 10              # NEW: Step 12 → Step 9 review loop
  step17_readiness: 10          # NEW: Step 17 production readiness retry
  step19_review: 10             # 3 → 10  (Step 19 review revision)
  expert_consensus_extra: 10    # NEW: extra discussion rounds if no consensus
  integration_conflict: 10      # NEW: integration stage conflict resolution retry
  test_env_setup: 10            # NEW: test environment setup retry
  step13_cleanup: 10            # NEW: dead code cleanup retry
  step14_quality: 10            # NEW: code quality improvement retry
  step15_flow: 10               # NEW: flow verification retry

  # ── Interview Protocol ──────────────────────────
  interview_max_rounds: 5           # Step 1-B 최대 인터뷰 라운드
  confidence_threshold: 0.7         # 이 미만이면 사용자 확인 필수
  step1a_verification: true         # Step 1-A 후 사용자 검증 활성화
  step2_4_escalation: true          # Steps 2-4에서 가정 에스컬레이션 활성화
  step4b_interactive: true          # Step 4-B 우려사항별 인터랙티브 해결
  max_questions_per_round: 5        # 라운드당 최대 질문 수 (피로도 관리)

  # ── Auto-Diagnosis ────────────────────────────
  diagnosis_threshold: 5        # Failures before root cause analysis triggers
  pivot_threshold: 10           # Strategy pivots before human escalation
```

## Instructions

You are executing the **simon-bot-grind** (열일모드) deep workflow. This is the same 19-step quality pipeline as simon-bot, but you **never give up easily**. Every retry limit is set to 10. You diagnose, adapt, and retry until it works.

**Core Philosophy: "끝날 때까지 끝난 게 아니다. 진단하고, 적응하고, 다시 시도한다."**

### Error Resilience Protocol (Cross-Cutting — ALL Steps, 최우선 규칙)

**ABSOLUTE RULE: 워크플로는 사용자가 명시적으로 중단을 요청하지 않는 한 절대 중단되지 않는다.**

어떤 단계에서든 명령어 실행(빌드, 테스트, 타입체크, 린트, docker, git, script 등)이 실패하면:

1. **절대 워크플로를 중단하지 말 것** — 에러 출력을 읽고 즉시 분석 시작
2. **에러 원인 분석**: 에러 메시지, 스택 트레이스, 관련 파일을 분석하여 근본 원인 파악
3. **Auto-Diagnosis Escalation Ladder 적용** (아래 섹션 참조): 10회까지 자동 재시도
4. **10회 모두 실패 시에도 중단 금지**: 사용자에게 AskUserQuestion으로 상황 보고 + 선택지 제시:
   - 다른 접근법으로 재시도
   - 해당 단계를 건너뛰고 다음으로 진행
   - 워크플로 중단 (사용자가 명시적으로 선택한 경우에만)

**절대 금지 사항:**
- 에러가 발생했다고 "워크플로를 종료합니다" / "중단합니다" / "실패했습니다" 라고 선언하고 멈추는 것
- 사용자에게 묻지 않고 자의적으로 워크플로를 포기하는 것
- 에러를 무시하고 넘어가는 것 (반드시 분석 후 수정 시도해야 함)
- Escalation Ladder를 소진하기 전에 사용자에게 에스컬레이션하는 것

**이 규칙은 Auto-Diagnosis System보다 상위 규칙이며, 모든 단계의 모든 실패에 무조건 적용된다.**

### Auto-Diagnosis System (Cross-Cutting)

This system operates across ALL steps. On ANY failure:

**Failure Tracking Protocol:**
1. Record every failure in `.omc/memory/failure-log.md`:
   ```
   ## [Step N] Attempt M — {timestamp}
   - **Error type**: build / test / typecheck / review-rejection / consensus-failure
   - **Error summary**: (1-2 lines)
   - **Files involved**: list
   - **Previous attempts**: what was tried
   ```
2. Check failure patterns before each retry

**Escalation Ladder (per step):**

| Attempt | Action |
|---------|--------|
| 1 ~ 3 | Simple retry: `executor` fixes the immediate issue |
| 4 ~ 6 | **Root Cause Analysis**: spawn `architect` (opus) to diagnose WHY it keeps failing, then `executor` applies the deeper fix |
| 7 ~ 9 | **Strategy Pivot**: `architect` proposes 2-3 alternative approaches, selects the most different one from what was tried, resets relevant state, retries with new strategy |
| 10 (final) | **Last Stand**: architect + executor collaborate on a completely fresh approach. If this also fails → **Human Escalation**: generate detailed diagnosis report in `.omc/memory/escalation-report.md`, present to user via AskUserQuestion |

**Strategy Pivot Examples:**
- Implementation approach change (different algorithm, different library)
- Architecture change (split into smaller units, change layer boundaries)
- Test strategy change (integration test instead of unit test, or vice versa)
- Dependency resolution (different package version, alternative dependency)
- Scope reduction (implement core only, defer edge cases)
- Complete rewrite of the problematic section

**Checkpoint System:**
- Before each strategy pivot, save checkpoint: `git stash` or `git tag checkpoint-step{N}-attempt{M}`
- If new strategy also fails, can rollback to checkpoint and try next alternative
- Save: `.omc/memory/checkpoints.md` (list of checkpoint tags with descriptions)

### Confidence Scoring & Assumption Registry (Cross-Cutting)

This system operates across ALL Phase A steps. Every agent output must include confidence assessments.

**Confidence Levels:**
- **HIGH** (≥0.9): No user confirmation needed, record only
- **MEDIUM** (0.7–0.9): User confirmation needed if agents disagree
- **LOW** (<0.7): Automatic user confirmation required

**Assumption Registry** (`.omc/memory/assumptions-registry.md`):
All assumptions tracked with status: `Unverified` / `Verified` / `Rejected`

```markdown
## Assumptions Registry
| # | Assumption | Confidence | Impact | Status | Source Step | User Response |
|---|-----------|-----------|--------|--------|------------|---------------|
| 1 | ... | LOW | HIGH | Unverified | Step 0 | — |
```

**Escalation Rules:**

| Confidence | Impact | Action |
|-----------|--------|--------|
| LOW | HIGH | **MUST** ask user (blocking, 탈출 불가) |
| LOW | LOW | 인터뷰 라운드에 포함 (탈출 가능) |
| MEDIUM + 의견 불일치 | any | 인터뷰 라운드에 포함 (탈출 가능) |
| HIGH | any | 기록만, 사용자 확인 불필요 |

**Protocol:**
1. Every agent output in Phase A must tag assumptions with `[ASSUMPTION confidence=X impact=Y]: description`
2. Orchestrator collects all assumptions and updates `assumptions-registry.md`
3. LOW confidence or MEDIUM+disagreement assumptions queue for user interview
4. User responses update registry status to Verified/Rejected
5. Rejected assumptions trigger re-analysis of dependent decisions

### Startup

**IMPORTANT: Execute these steps SEQUENTIALLY, not in parallel.**

1. Determine if `.omc/workflow/` exists in the current project. If not, run the init script:
   ```
   bash ~/.claude/skills/simon-bot/install.sh --project-only
   ```
2. After Step 1 confirms workflow files exist, read these (can be parallel):
   - Workflow config: `.omc/workflow/config.yaml`
   - Retrospective (if exists, skip if not): `.omc/memory/retrospective.md`
   - Failure log (if exists from previous run): `.omc/memory/failure-log.md`
   - Project memory (if exists, skip if not): use `project_memory_read` MCP tool
3. **Initialize failure tracking**: Create or clear `.omc/memory/failure-log.md`
4. **Initialize checkpoints**: Create or clear `.omc/memory/checkpoints.md`
5. **Branch name input** (AskUserQuestion):
   - Ask user for branch name (e.g., `feat/add-auth`, `fix/login-bug`)
   - Save to `.omc/memory/branch-name.md`
   - Used for worktree creation, integration, and PR

### Phase A: Planning (Interactive with User)

**Step 0: Scope Challenge + Assumption Collection**
- Spawn `architect` (opus): Analyze git history for past problem areas
- Identify "What already exists" - existing code that solves parts of the request
- Determine minimum viable change
- Flag if scope exceeds 8 files or 2 new classes
- **[GRIND-INTERVIEW] Assumption collection**: architect must explicitly list ALL assumptions made during analysis, each with confidence score and impact level
- **[GRIND-INTERVIEW] Clarification questions**: architect identifies ambiguous or underspecified aspects of the request
- Initialize `.omc/memory/assumptions-registry.md` with collected assumptions
- Present to user via AskUserQuestion in structured format:
  ```
  ## Scope 분석 결과
  ### 추천 경로: [SMALL/STANDARD/LARGE] (이유)
  - **SMALL**: Steps 5-8 + 17 only
  - **STANDARD**: Steps 5-17 full pipeline
  - **LARGE**: Steps 5-17 + extended failure mode analysis

  ### 확인이 필요한 가정들:
  1. [가정] — Confidence: MEDIUM — 맞나요?
  2. [가정] — Confidence: LOW — 확인 부탁드립니다

  ### 질문:
  1. [모호한 부분에 대한 질문]
  ```
- User responses → update `assumptions-registry.md` (Verified/Rejected)
- Rejected assumptions → architect re-evaluates affected scope decisions
- **GRIND NOTE**: In 열일모드, ALL paths get max retry (10). The path choice only affects which Steps execute, not the retry aggressiveness.
- Record decision in `.omc/memory/plan-summary.md`

**Step 1-A: Project Analysis + Code Design Analysis**
- Spawn `explore-medium` (sonnet): Scan project structure
- Spawn `analyst` (opus): Generate analysis report + recommend principles
- Use Context7 MCP (`resolve-library-id` → `query-docs`) for library docs
- Auto-generate allowed command list based on detected stack
- Skill: Use `/deepsearch` if codebase is large
- **Auto-detect experts**: Match scan results against `config.yaml` `expert_panel.specialists[].detect` keywords
- **Agent Team: Code Design Team** (after explore-medium completes, parallel):
  - Reference `config.yaml` `expert_panel.domain_teams.code-design`
  - Purpose: Pre-analyze repo's code design context for all subsequent steps
  - Agent Team (teammate model: opus):
    - **convention-expert** (always): Analyze existing code patterns via `explore-medium`
    - **idiom-expert** (always): Query official docs via Context7 MCP
    - **design-pattern-expert** (auto-detect): Identify architecture patterns
    - **testability-expert** (auto-detect): Analyze test structure, mock/fixture patterns
  - Shared tasks:
    - Task 1: Each teammate analyzes their domain independently
    - Task 2: Share findings and discuss
    - Task 3: Team consensus → write `.omc/memory/code-design-analysis.md`
  - Disband Agent Team
- Save: `.omc/memory/requirements.md`, `.omc/memory/code-design-analysis.md`

**Step 1-A-B: Analysis Verification Checkpoint** (NEW — `step1a_verification`)
- **Purpose**: Validate key findings with user BEFORE plan creation
- Spawn `architect` (opus): Extract verification-needed items from Step 1-A results
- **도메인별 순차 인터뷰** — Code Design Team 도메인별로 차례로 제시:

  **Round 1: 코드 컨벤션** (convention-expert)
  ```
  ## 코드 컨벤션 분석 결과 — convention-expert

  감지된 패턴들:
  1. [패턴] — Confidence: MEDIUM — 맞나요?
  2. ...

  제안:
  - [컨벤션 제안] — 동의하시나요?
  ```

  **Round 2: 언어/프레임워크 관용구** (idiom-expert)
  ```
  ## 언어/프레임워크 관용구 — idiom-expert

  공식 문서 기반 권장사항:
  1. [권장 원칙: TDD/DDD/Clean Architecture 등] — 동의하시나요?
  2. ...
  ```

  **Round 3: 설계 패턴** (design-pattern-expert, auto-detect 시)
  ```
  ## 설계 패턴 분석 — design-pattern-expert

  감지된 아키텍처 패턴:
  1. [패턴] — Confidence: [LEVEL] — 맞나요?

  범위 경계:
  - In scope: [목록]
  - Out of scope: [목록]
  ```

  **Round 4: 테스트 구조** (testability-expert, auto-detect 시)
  ```
  ## 테스트 구조 분석 — testability-expert

  재사용 가능 코드:
  1. [파일/함수]: [용도] — 재사용해도 될까요?

  테스트 전략 제안:
  1. [제안] — 동의하시나요?
  ```

- 각 라운드는 별도 AskUserQuestion으로 제시 (해당 도메인에 질문이 없으면 skip)
- **Escape hatch**: 어떤 라운드에서든 "진행해" → 해당 라운드 이후 남은 라운드 skip, 에이전트 판단으로 진행
  - **Exception**: LOW confidence + HIGH impact 항목은 탈출 불가, 반드시 확인
- User responses → update `assumptions-registry.md`
- **Major corrections found** → re-run affected parts of Step 1-A (max 2 times)
- Save: updated `requirements.md`, `code-design-analysis.md`, `assumptions-registry.md`

**Step 1-B: Plan Creation (3-Phase Structured Interview)**

**Phase 1: Draft Creation** (no user interaction)
- Spawn `planner` (opus)
- Input: User request + Step 0 scope + Step 1-A analysis + Step 1-A-B verification results + `.omc/memory/code-design-analysis.md` + `.omc/memory/assumptions-registry.md`
- Split work into Units: max 3-5 files, 200 lines per Unit, single concern
- Build dependency graph: parallel vs sequential groups
- Use Context7 for SDK documentation needed for implementation

- **Interview Guard (필수 원칙)**:
  - 코드를 먼저 충분히 탐색한 뒤, **코드에서 답할 수 있는 질문은 절대 하지 않는다**
  - Step 0 scope + Step 1-A 분석 결과에서 이미 파악된 정보를 다시 묻지 않는다
  - 사용자에게는 **비즈니스 결정, 엣지케이스, 스코프 경계, 트레이드오프**만 질문한다
  - 예시 (BAD): "이 프로젝트에서 어떤 ORM을 쓰나요?" → 코드에서 알 수 있음
  - 예시 (GOOD): "기존 피드와 신규 피드 포맷이 충돌할 때 어느 쪽을 우선하나요?" → 비즈니스 결정

- **계획서 구조 (STICC Framework)**:
  계획서(`plan-summary.md`)는 다음 구조를 따른다. 단, 계획서에 "STICC"라는 메타 텍스트를 포함하지 않는다.

  **1. Situation (현재 상태)**:
  - 현재 시스템의 관련 부분이 어떤 상태인지
  - 왜 이 작업이 필요한지 (배경, 문제점, 기회)

  **2. Task (구체적 작업)**:
  - Unit 분할 (max 3-5 files, 200 lines per Unit, single concern)
  - 각 Unit별 변경 대상 파일 목록 (파일 경로 + 변경 유형: 신규/수정/삭제)
  - Implementation order (dependency graph: parallel vs sequential)
  - Development principles (TDD/DDD/Clean Architecture as confirmed)
  - **[GRIND] Fallback strategies per Unit** (what to do if primary approach fails)
  - **[GRIND] Alternative implementation approaches** (at least 2 per Unit)

  **3. Intent (의도와 목적)**:
  - 이 작업이 달성하려는 근본적 목적 (단순히 "뭘 하는지"가 아니라 "왜 하는지")
  - 성공 기준: 이 작업이 완료되면 시스템이 어떤 상태가 되어야 하는지

  **4. Concerns (우려사항과 리스크)**:
  - Expected risks
  - "NOT in scope" section (명시적으로 하지 않을 것)
  - "Unresolved decisions" section (결정되지 않은 사항)
  - **"Assumptions made" section** (each with confidence score + impact level)

  **5. Acceptance Criteria (인수 기준)** — 3개 하위 섹션으로 분할:
  - **Code Changes**: 구현해야 할 코드 변경사항 목록
  - **Tests**: 작성/수정해야 할 테스트 목록 (파일 패턴 수준)
  - **Quality Gates**: 통과해야 할 품질 기준 (build, typecheck, lint, 특정 성능 기준 등)

  **6. End State (최종 상태 명세)** — 구현 전에 "완료"의 모습을 구체적으로 정의:
  - **Files Changed 테이블**:
    ```
    | File | Action | Summary |
    |------|--------|---------|
    | path/to/file.py | 신규 | 새 서비스 클래스 |
    | path/to/existing.py | 수정 | 기존 핸들러에 새 분기 추가 |
    ```
  - **Behavior Changes**: Before → After 형식으로 동작 변화 명세
    ```
    - Before: X 요청 시 404 반환
    - After: X 요청 시 새 핸들러가 처리하여 200 + 데이터 반환
    ```
  - **Test Targets**: 테스트 대상 파일 패턴 (실제 테스트 실행은 tester agent가 담당)
    ```
    - tests/test_new_service.py (신규)
    - tests/test_existing_handler.py (기존 테스트에 케이스 추가)
    ```

**Phase 2: 도메인별 순차 인터뷰** (max `interview_max_rounds` rounds, default 5)
- Planner reviews draft and identifies ALL points requiring user input
- **도메인별로 순차 제시** — 각 도메인이 별도 AskUserQuestion 라운드:

  **Round 1: 요구사항 명확화**
  ```
  ## 요구사항 명확화 — planner

  모호하거나 불충분한 요구사항:
  1. [질문] — 왜 필요한지: [배경]
  2. ...
  ```

  **Round 2: 설계 결정**
  ```
  ## 설계 결정 — planner

  여러 유효한 접근법이 있는 선택지:
  1. [선택지] — 옵션 A: [설명] / 옵션 B: [설명] — 권장: [권장안]
  2. ...
  ```

  **Round 3: 범위 경계**
  ```
  ## 범위 경계 — planner

  포함/미포함 확인:
  - In scope: [목록]
  - Out of scope: [목록]
  - 추가/제외할 항목이 있나요?
  ```

  **Round 4: 제약조건 검증**
  ```
  ## 제약조건 검증 — planner

  기술적/비즈니스 제약:
  1. [제약] — 맞나요?
  2. ...
  ```

  **Round 5: 리스크 인지**
  ```
  ## 리스크 인지 — planner

  계획에서 식별된 위험:
  1. [리스크] — 수용 가능한가요? 대안이 있나요?
  2. ...
  ```

- 해당 도메인에 질문이 없으면 해당 라운드 skip
- 각 라운드: max `max_questions_per_round` questions (default 5) via AskUserQuestion
- **Escape hatch**: 어떤 라운드에서든 "진행해" → 남은 라운드 skip, planner 판단으로 결정
  - **Exception**: LOW confidence + HIGH impact items are **non-escapable** (must be answered)
- **Round termination**: All questions answered / max rounds reached / user says "진행해"
- Each round's answers → update plan draft + `assumptions-registry.md`

**Phase 3: Plan Finalization**
- Incorporate all interview answers into final plan
- Unconfirmed assumptions: mark as "planner's best judgment" + reasoning documented
- Update `assumptions-registry.md` with final statuses
- Save to `.omc/memory/plan-summary.md`
- Skill: Use `/plan`

**Steps 2-4: Plan Review (Agent Team) + User Escalation**

**Agent Team creation**: One persistent Agent Team across Steps 2-4.
- Purpose: planner, critic, architect discuss directly to improve plan quality
- Agent Team (teammate model: opus):
  - **planner**: plan modification/defense
  - **critic**: logic/feasibility verification
  - **architect**: structure verification + YAGNI/KISS verification
- Context: `.omc/memory/plan-summary.md`, `.omc/memory/requirements.md`, `.omc/memory/code-design-analysis.md`, `.omc/memory/assumptions-registry.md`
- **[GRIND-INTERVIEW] `[USER-ESCALATION]` tag**: During discussion, any agent can flag items needing user input with `[USER-ESCALATION reason="..."]`
- **Special rule**: Deadlocks about **user intent** trigger IMMEDIATE escalation
  - e.g., critic and planner disagree on "does the user want X or Y?" → must ask user

**Step 2: Plan Review**
- Shared task: "critic reviews plan and gives planner direct feedback"
- critic <-> planner direct discussion (no orchestrator relay)
- Max **10** iterations (`loop_limits.critic_planner`)
- **[GRIND] Deadlock breakers:**
  - After iteration 5: architect joins as mediator
  - After iteration 7: architect proposes compromise position
  - After iteration 9: lead forces decision based on majority reasoning

**Step 2 → 도메인별 에스컬레이션 체크포인트** (`step2_4_escalation`):
- Collect all `[USER-ESCALATION]` items from Step 2, grouped by raising agent
- **에이전트별 순차 제시** (해당 에이전트에 에스컬레이션 없으면 skip):

  **Round 1: critic의 질문/제안**
  ```
  ## Step 2 — critic 에스컬레이션

  리뷰 중 사용자 확인이 필요한 사항:
  1. [항목] — 배경: [왜 필요한지]
  2. ...
  ```

  **Round 2: planner의 질문/제안**
  ```
  ## Step 2 — planner 에스컬레이션

  계획 수정 중 사용자 결정이 필요한 사항:
  1. [항목] — 배경: [왜 필요한지]
  2. ...
  ```

  **Round 3: architect의 질문/제안**
  ```
  ## Step 2 — architect 에스컬레이션

  구조 검증 중 사용자 확인이 필요한 사항:
  1. [항목] — 배경: [왜 필요한지]
  2. ...
  ```

- **Escape hatch**: 어떤 라운드에서든 "진행해" → 남은 라운드 skip, 에이전트 다수결로 결정 (except LOW+HIGH items)
- User responses → update `assumptions-registry.md` + feed back into Agent Team

**Step 3: Meta Verification**
- Shared task: "architect cross-verifies critic's review"
- Severity-based routing:
  - Minor (detail-level): → Step 2 task reassignment
  - Major (structural): → report to lead → Step 1-B (with failure reason)

**Step 4: Over-engineering Check**
- Shared task: "architect verifies plan from YAGNI/KISS perspective"
- Direct discussion for consensus
- Severity-based routing:
  - Minor: → Step 2 task reassignment
  - Major: → report to lead → Step 1-B (with failure reason)

**Step 4 → 도메인별 에스컬레이션 체크포인트** (`step2_4_escalation`):
- Collect all `[USER-ESCALATION]` items from Steps 3-4, grouped by raising agent
- **에이전트별 순차 제시** (Step 2 체크포인트와 동일 방식):
  - Round 1: architect의 질문/제안 (구조 검증, YAGNI/KISS 관련)
  - Round 2: critic의 질문/제안 (메타 검증 관련)
  - Round 3: planner의 질문/제안 (계획 수정 관련)
- 해당 에이전트에 에스컬레이션 없으면 skip
- **Escape hatch**: "진행해" → 남은 라운드 skip, 에이전트 다수결 (except LOW+HIGH items)
- User responses → update plan + `assumptions-registry.md`

**Step 4 completion**: Disband Agent Team
- Skill: Use `/ralplan` for Steps 2-4 combined

**Step 4-B: Expert Plan Review (4-Phase Interactive Resolution)** (`step4b_interactive`)

**Phase 1: Concern Classification** (no user interaction)
- Same 5-team Agent Team structure as simon-bot
- Team activation per `config.yaml` → `expert_panel.team_activation`
- **[GRIND] Enhanced consensus protocol:**
  - Standard: 2 discussion rounds (`expert_panel.discussion_rounds`)
  - If no consensus: **+10 extra rounds** (`loop_limits.expert_consensus_extra`)
  - If still no consensus: lead makes final decision with dissenting opinions recorded
- **[GRIND-INTERVIEW] Each concern tagged:**
  - `[TECHNICAL]` — agents can resolve without user (code/architecture issues)
  - `[REQUIRES-USER]` — needs user intent, preference, or domain knowledge
  - `[AMBIGUOUS]` — concern itself is unclear, needs user clarification
- Save classified concerns: `.omc/memory/expert-plan-concerns.md`

**Phase 2: Technical Resolution** (no user interaction)
- `[TECHNICAL]` concerns: planner modifies plan to address
- CRITICAL `[TECHNICAL]` → planner revision → Step 2 (max **10** loops: `loop_limits.step4b_critical`)
- HIGH `[TECHNICAL]`: add to plan as mandatory notes after resolution
- MEDIUM `[TECHNICAL]`: record resolution for reference

**Phase 3: 도메인팀별 순차 인터랙티브 해결** (AskUserQuestion loop)
- **Pre-pass**: CRITICAL `[REQUIRES-USER]`/`[AMBIGUOUS]`는 어떤 팀 소속이든 **먼저 일괄 제시** (non-escapable)
  ```
  ## CRITICAL: 반드시 확인이 필요합니다

  다음 항목들은 구현 방향에 큰 영향을 미치며 반드시 확인이 필요합니다:
  1. [우려사항] — 출처: [전문가팀] — 왜 중요한지: [설명]
  2. ...
  ```

- **이후 도메인팀별 순차 제시** (해당 팀에 `[REQUIRES-USER]`/`[AMBIGUOUS]`가 없으면 skip):

  각 도메인팀 라운드 형식 (config.yaml `expert_panel.specialists` 순서):
  ```
  ## [도메인팀명] 전문가 리뷰 — [전문가 이름]

  ### 질문:
  1. [우려사항] — 권장안: [전문가 권장] — 동의하시나요?
  2. ...

  ### 제안:
  1. [개선 제안] — 적용할까요?
  2. ...

  ("진행해"라고 하면 이 팀의 권장안으로 진행합니다)
  ```

- **Escape hatch**: 어떤 도메인팀 라운드에서든 "진행해" → 해당 팀 이후 남은 팀 skip, 각 팀의 전문가 권장안 적용
- Each round's responses → update plan + `assumptions-registry.md`
- Escaped items: apply expert recommendation, record as "expert judgment" in registry

**Phase 4: Final Synthesis**
- All resolutions (technical + user) reflected in final summary
- Present to user via AskUserQuestion:
  ```
  ## Phase A 완료 — 구현 준비 요약

  ### 해결된 우려사항: N개
  ### 전문가 판단으로 진행: N개
  ### 최종 계획 요약: (핵심 포인트)

  구현을 시작할까요?
  - **Yes**: Phase B 진행
  - **추가 질문**: (질문을 남겨주세요)
  - **수정 필요**: (수정할 부분을 알려주세요)
  ```
- **추가 질문/수정** → max 2 additional rounds
- Save: updated `.omc/memory/expert-plan-concerns.md`, `.omc/memory/assumptions-registry.md`
- Update: `CONTEXT.md` — Phase A 완료 표시, 핵심 결정사항 및 전문가 우려(HIGH+) 갱신

**Phase A Calibration Checklist (Phase B 진입 전 필수 검증)**

Phase A의 모든 단계가 완료된 후, Phase B로 진입하기 전에 다음 7개 항목을 자동 검증한다.
**하나라도 미충족 시 해당 단계로 돌아가 보완한 후 재검증한다.**

| # | 검증 항목 | 확인 방법 | 미충족 시 |
|---|----------|----------|----------|
| 1 | 코드베이스 탐색 완료 | `.omc/memory/requirements.md` + `.omc/memory/code-design-analysis.md` 존재 및 비어있지 않음 | → Step 1-A |
| 2 | 인터뷰 완료 (비즈니스 결정 확보) | `plan-summary.md`에 Unresolved decisions이 비어있거나, 남은 결정이 구현에 영향 없음 | → Step 1-B |
| 3 | 계획서에 파일 경로 포함 | `plan-summary.md`의 Task 섹션 + End State의 Files Changed 테이블에 구체적 파일 경로가 있음 | → Step 1-B |
| 4 | Acceptance Criteria 3분할 | `plan-summary.md`에 Code Changes / Tests / Quality Gates 섹션이 모두 존재 | → Step 1-B |
| 5 | End State에 Files Changed 테이블 존재 | `plan-summary.md`에 File \| Action \| Summary 형식 테이블 존재 | → Step 1-B |
| 6 | End State에 Behavior Changes 존재 | `plan-summary.md`에 Before → After 형식의 동작 변화 명세 존재 | → Step 1-B |
| 7 | Test Targets 섹션 존재 | `plan-summary.md`에 테스트 대상 파일 패턴이 명시됨 | → Step 1-B |

검증 방법: `plan-summary.md` 파일을 읽어 각 항목의 존재 여부를 확인한다. 누락된 항목이 있으면 사용자에게 보고하지 않고 자동으로 해당 단계를 재실행하여 보완한다.

### Phase B-E: Implementation & Verification (ralph + ultrawork AUTO)

After Phase A is confirmed, activate ralph + ultrawork mode automatically.
Each Unit runs in an **isolated git worktree**.
Independent Units run in **parallel**.

**Pre-Phase: Base Branch Sync & Worktree Creation**
- Same as simon-bot:
  1. Detect default branch
  2. `git fetch {remote} {base_branch}`
  3. Read branch name from `.omc/memory/branch-name.md`
  4. Create worktree: `git worktree add .claude/worktrees/{branch-name} -b {branch-name} origin/{base_branch}`
  5. Move working directory to worktree
  6. Record base commit SHA in `.omc/memory/base-commit.md`
- **[GRIND] Create initial checkpoint:**
  - `git tag checkpoint-initial` in worktree
  - Record in `.omc/memory/checkpoints.md`
7. **CONTEXT.md 생성** (한눈에 보는 작업 요약 문서):
   - 워크트리 루트에 `CONTEXT.md` 생성
   - `.git/info/exclude`에 `CONTEXT.md` 추가 (커밋에서 제외)
   - Phase A 결과를 반영한 초기 내용:
     ```markdown
     # [브랜치명]: [작업 요약]

     ## 목표
     [plan-summary.md에서 Goal 발췌]

     ## 현재 진행 상태
     - [x] Phase A: Planning
     - [ ] Phase B-E: Implementation & Verification
     - [ ] Integration
     - [ ] Step 18: Report
     - [ ] Step 19: Interactive Review

     ## 핵심 결정사항
     [plan-summary.md에서 주요 결정 발췌]

     ## 주의사항 (전문가 우려)
     [expert-plan-concerns.md에서 HIGH 이상 발췌]

     ## 성공 기준
     - [ ] RED→GREEN TDD 사이클 완료
     - [ ] 전체 테스트 통과 (0 failures)
     - [ ] 빌드 + 타입체크 통과
     - [ ] 보안 리뷰 CRITICAL 없음
     - [ ] 코드 리뷰 통과
     - [ ] 사용자 가이드 리뷰 완료
     - [ ] 미해결 결정사항 문서화됨
     - [ ] CONTEXT.md 최종 갱신됨
     - [ ] 열일 Summary 포함
     - [ ] 에스컬레이션 리포트 해결/문서화됨

     ## 열일 현황
     - 총 재시도: 0회
     - 전략 전환: 0회
     - 수용된 트레이드오프: 0건

     ## 메모리 파일 맵
     - plan-summary.md — 전체 계획
     - code-design-analysis.md — 코드 설계 분석
     - expert-plan-concerns.md — 전문가 우려사항
     - failure-log.md — 실패 기록
     - checkpoints.md — 체크포인트 목록
     - success-criteria.md — 완료 체크리스트
     ```
   - **갱신 시점**: 각 Step 완료, 전략 전환 시, Integration 완료, Step 19 완료 시 진행 상태, 성공 기준 및 열일 현황 갱신

**CRITICAL RULES:**
- All verification/review: ONLY changed files (git diff based)
- Use `.omc/workflow/scripts/*.sh` for deterministic tasks
- Record findings in `.omc/memory/unit-{name}/*.md` after each step
- Read memory files AND failure-log at start of each step
- Tests: NEVER use real DB or external APIs (mock/stub only)
- Commands: NEVER access real external systems

**Pre-Step: Test Environment Setup**
- Same as simon-bot (run-tests.sh auto-triggers setup)
- **[GRIND] If setup fails** (max **10** attempts: `loop_limits.test_env_setup`):
  - Attempt 1-3: Retry with clean install (`rm -rf node_modules && npm install`, `pip install --force-reinstall`, etc.)
  - Attempt 4-6: Try alternative package manager (npm → yarn → pnpm / pip → poetry → pipx)
  - Attempt 7-8: Architect diagnoses environment issue → attempt manual fix (version conflicts, missing system deps)
  - Attempt 9: Try minimal dependency install (only test-critical packages)
  - Attempt 10: Last stand — architect proposes workaround (e.g., docker-based test env, skip specific test suites)
  - If all fail: record in failure-log, proceed with build/typecheck only (tests skipped with warning)
- Save result: `.omc/memory/test-env-status.md`

**For each Unit (in isolated worktree):**

---

**Step 5: Implementation (with Build Resilience)**
- **Read first**:
  - `.omc/memory/expert-plan-concerns.md`
  - `.omc/memory/code-design-analysis.md`
  - `.omc/memory/failure-log.md` (check for patterns from previous Units)
- Spawn `executor` (opus), parallel for independent files
- executor must follow code-design-analysis.md conventions and patterns
- Must address HIGH+ expert concerns
- **MANDATORY TDD Cycle (RED→GREEN→REFACTOR)**:
  - **Step 5a: RED** — 실패하는 테스트 먼저 작성. 예상 동작을 테스트로 정의한 후, 테스트가 **실패하는지 반드시 확인**.
  - **Step 5b: GREEN** — 테스트를 통과시키는 최소한의 구현 코드 작성. **테스트 통과 확인 필수.**
  - **Step 5c: REFACTOR** — 테스트가 통과하는 상태를 유지하며 코드 정리. 불필요하면 skip 가능.
  - **Step 5d: VERIFY** — 전체 테스트 스위트 실행. **하나라도 실패하면 Step 6으로 진행 금지.**
- **[GRIND] Build/Test Verification Loop** (max **10** attempts: `loop_limits.step5_build_retry`):
  1. Run via tmux: build + test + typecheck simultaneously
  2. If ALL pass: proceed to Step 6
  3. If ANY fails:
     - **Attempt 1-3**: `executor` fixes the immediate error (compile error, test assertion, type error)
     - **Attempt 4-6**: Spawn `architect` (opus) for **Root Cause Analysis**
       - Read failure-log to identify pattern
       - Determine if issue is: code bug / test design flaw / dependency issue / architecture mismatch
       - Prescribe targeted fix → `executor` applies
     - **Attempt 7-9**: **Strategy Pivot** (`loop_limits.step5_strategy_pivot`)
       - Save checkpoint: `git tag checkpoint-step5-attempt{N}`
       - `architect` proposes alternative approach:
         - Different implementation pattern
         - Simplified scope (implement core, defer edge cases)
         - Different test strategy
         - Alternative library/dependency
       - `executor` implements alternative from checkpoint
     - **Attempt 10**: **Last Stand** — architect + executor collaborate on completely fresh approach
       - If this also fails: Record in `.omc/memory/escalation-report.md`, AskUserQuestion with:
         - Diagnosis summary
         - What was tried (all 10 attempts)
         - Recommended manual intervention
         - Option to skip this Unit and continue with others
- Save: `.omc/memory/unit-{name}/implementation.md`
- Update: `CONTEXT.md` 진행 상태 및 열일 현황 갱신

**Step 6: Purpose Alignment Review (Enhanced)**
- Spawn `architect` (opus): Check implementation matches requirements
- **[GRIND] Escalation ladder** (max **10** attempts: `loop_limits.step6_executor`):
  - **Attempt 1-3**: executor auto-fix (simple alignment corrections)
  - **Attempt 4-6**: architect **re-analyzes requirements** against code
    - Maybe requirements were ambiguous → clarify and re-fix
    - Maybe code is correct but review criteria were wrong → adjust
  - **Attempt 7-9**: architect proposes **scope adjustment** or **alternative interpretation** of requirements
  - **Attempt 10**: architect + executor final collaborative fix attempt
  - **Major misalignment** (at any point): → Step 1-B (plan was insufficient)
    - BUT first check failure-log: if Step 1-B was already revisited, escalate to user

**Step 7: Bug/Security/Performance Review (with Enhanced Loop)**
- Read expert prompts from `.omc/workflow/prompts/*.md`
- **7-A: Implementation Verification (Agent Team Discussion)**
  - Same 5-team Agent Team structure as Step 4-B
  - Additional context: actual git diff
  - **[GRIND] Enhanced consensus** (+10 extra rounds if needed)
  - Each Agent Team's Shared Tasks (4 steps):
    - Task 0: "Verify Step 4-B concerns were addressed in implementation"
    - Task 1: Independent diff review → domain findings
    - Task 2: Cross-teammate discussion (direct messages)
    - Task 3: Team consensus → findings.md (CRITICAL/HIGH/MEDIUM)
  - CRITICAL/HIGH → executor auto-fix, MEDIUM → record
  - **[GRIND] If auto-fix fails** (executor can't fix CRITICAL/HIGH):
    - Follow escalation ladder (root cause → strategy pivot → last stand)
    - architect may determine issue requires re-implementation (→ Step 5 with strategy pivot)
    - OR architect may determine the expert concern is a false positive → record reasoning and proceed
- **7-B: Prior Concern Verification (Enhanced)**
  - Read `.omc/memory/expert-plan-concerns.md`
  - Spawn `architect` (opus): Cross-check prior concerns against implementation
  - **[GRIND]** If concerns missed: executor auto-fix → 7-A re-review (max **10** loops: `loop_limits.step7b_recheck`)
  - After attempt 5: architect determines if concern is implementable in current architecture
    - If not: record as "architectural limitation" and propose follow-up task
  - After attempt 8: consider scope reduction — implement partial fix and document remainder
- Save: `.omc/memory/unit-{name}/review-findings.md`

**Step 8: Regression Verification (Enhanced)**
- Spawn `architect` (opus): Verify Step 7 fixes didn't break anything
- **[GRIND]** Regression → executor fix → Step 7 re-review (max **10** loops: `loop_limits.step7_8`)
- **Escalation ladder:**
  - **Loop 1-3**: Simple fix and re-verify
  - **Loop 4-5**: Root cause analysis — WHY do fixes keep causing regressions?
    - Common causes: tight coupling, shared mutable state, missing test coverage
    - Architect prescribes structural fix (not just symptom fix)
  - **Loop 6-8**: Strategy pivot
    - Checkpoint current state
    - Architect proposes: "rewrite this section with better isolation" or "add integration test to catch regression earlier"
    - Executor implements from checkpoint
  - **Loop 9**: Scope reduction — fix only the most critical regression, document the rest
  - **Loop 10**: Last stand — architect + executor collaborate. If fails → escalation report + AskUserQuestion

--- SMALL path skips to Step 17 here ---

**Step 9: File/Function Splitting**
- Spawn `architect` (opus): Detect oversized functions/files
- Thresholds from config.yaml
- Spawn `executor` (opus): Execute splits
- **[GRIND] Save checkpoint** before splitting: `git tag checkpoint-step9`

**Step 10: Integration/Reuse Review**
- Spawn `architect` (opus): Find duplicate code, reuse opportunities
- Spawn `executor` (opus): Refactor as needed

**Step 11: Side Effect Check (with Refactoring Loop)**
- Spawn `architect` (opus): Verify refactoring didn't change behavior
- **[GRIND] Refactoring resilience loop** (max **10**: `loop_limits.step9_11_refactor`):
  - **Attempt 1-3**: Minor side effect → executor fix
  - **Attempt 4-6**: Major side effect → **rollback to checkpoint-step9** → re-attempt Step 9 with less aggressive splitting
  - **Attempt 7-8**: architect proposes "minimal split" — only split what's absolutely necessary
  - **Attempt 9**: architect proposes "targeted split" — split only the single worst offender
  - **Attempt 10**: skip splitting entirely, keep original structure (record in failure-log as acceptable trade-off)

**Step 12: Full Change Review (with Review Loop)**
- Spawn `code-reviewer` (opus): Review entire diff
- **[GRIND] Review loop** (max **10**: `loop_limits.step12_major`):
  - **Attempt 1-3**: Minor → executor fix. Major → Step 9 for structural re-work
  - **Attempt 4-6**: architect mediates between code-reviewer findings and implementation constraints
  - **Attempt 7-8**: architect + code-reviewer negotiate — which findings are must-fix vs nice-to-have?
  - **Attempt 9**: prioritize: fix security/correctness issues, accept style/design issues
  - **Attempt 10**: record remaining issues as "accepted trade-offs" with justification
- Skill: `/code-review`

**Step 13: Dead Code Cleanup**
- Run `.omc/workflow/scripts/find-dead-code.sh`
- Spawn `architect` (opus) → `executor` (opus): Clean up
- **[GRIND]** If cleanup breaks build (max **10**: `loop_limits.step13_cleanup`):
  - Attempt 1-5: fix the breakage caused by cleanup
  - Attempt 6-9: rollback cleanup for affected files, retry with more conservative cleanup
  - Attempt 10: skip cleanup entirely for problematic files

**Step 14: Code Quality Assessment**
- Spawn `code-reviewer` (opus): Final quality evaluation
- **[GRIND]** If quality score is unacceptable (max **10** improvement attempts: `loop_limits.step14_quality`):
  - Attempt 1-5: executor improves code quality iteratively
  - Attempt 6-8: architect identifies highest-impact quality improvements
  - Attempt 9-10: accept current quality level with documented justification

**Step 15: Flow Verification**
- Spawn `architect` (opus): Verify all flows work correctly
- **Always verify (backend/data flows)**:
  - Backend internal flow (request → service → repository → response)
  - Data flow (input → transform → store → query path)
  - Error propagation flow
  - Event/message flow
- **Conditional (frontend changes detected)**:
  - UX flow, screen transitions, form submission/validation
- **[GRIND]** If flow broken (max **10**: `loop_limits.step15_flow`):
  - Attempt 1-3: trace to root cause → executor fix → re-verify
  - Attempt 4-6: architect performs end-to-end flow analysis → prescribes structural fix
  - Attempt 7-9: strategy pivot — simplify the flow, reduce complexity
  - Attempt 10: document broken flow path as known limitation

**Step 16: MEDIUM Issue Resolution (Extended)**
- Spawn `architect` (opus): Process all accumulated MEDIUM issues
- Analyze ripple effects, fix if needed
- Max **10** iterations (`loop_limits.step16`)
- **[GRIND] Progressive approach:**
  - Iteration 1-3: Fix issues one by one (highest impact first)
  - Iteration 4-6: Batch remaining issues, architect prioritizes by impact
  - Iteration 7-8: architect + executor collaborative fix session
  - Iteration 9: fix only issues with security/correctness implications
  - Iteration 10: Record unfixed MEDIUMs as "accepted" with risk assessment
- Save: `.omc/memory/unit-{name}/quality-findings.md`

**Step 17: Production Readiness (with Diagnosis Retry)**
- **참조**: Success Criteria 체크리스트의 기술적 항목을 이 단계에서 검증
- Spawn `architect` + `security-reviewer` (opus, parallel)
- Final checklist: requirements met, build passes, tests pass, no security issues
- **[GRIND] Readiness retry** (max **10**: `loop_limits.step17_readiness`):
  - **Attempt 1-3**: executor fixes identified issues
  - **Attempt 4-6**: architect performs **comprehensive diagnosis**:
    - What's blocking production readiness?
    - Is it a code issue, test issue, or criteria issue?
    - Prescribes targeted fix OR adjusts criteria if too strict
  - **Attempt 7-8**: **Triage mode**:
    - Architect categorizes remaining issues into:
      - **Must fix** (security, data loss): executor fixes
      - **Should fix** (quality): attempt fix, accept if fails
      - **Nice to fix** (cosmetic): skip
    - Record triage decisions in `.omc/memory/unit-{name}/triage.md`
  - **Attempt 9**: security-reviewer re-evaluates — separate real risks from theoretical risks
  - **Attempt 10**: Last stand — fix only blocking issues, document everything else
  - Minor remaining: executor fix. Major: → relevant Phase. Critical: → Step 1-B
- Save: `.omc/memory/unit-{name}/final-check.md`

### Integration Stage (after all Units complete)

1. All changes committed to worktree branch
2. Branch name: from `.omc/memory/branch-name.md`
3. **[GRIND] Conflict resolution** (max **10**: `loop_limits.integration_conflict`):
   - Attempt 1-3: `architect` analyzes + `executor` resolves
   - Attempt 4-6: architect performs **semantic merge analysis** (understand intent of both sides)
   - Attempt 7-8: architect proposes **alternative integration order** (merge Units in different sequence)
   - Attempt 9: architect proposes **partial integration** (merge non-conflicting Units first)
   - Attempt 10: Last stand attempt. If fails → AskUserQuestion with conflict details
4. Full build + test pass verification
   - **[GRIND]** If fails: apply Step 5 build resilience loop (max **10** attempts)
5. Save: `.omc/memory/integration-result.md`
6. Update: `CONTEXT.md` — Integration 완료 표시, 성공 기준 중간 갱신, 열일 현황 갱신
- **NOTE**: Draft PR은 이 단계에서 생성하지 않음. Step 19-C 리뷰 완료 후 생성.

### Step 18: Work Report + Review Sequence Preparation

- Spawn `writer` (opus)
- Use template: `.omc/workflow/templates/report-template.md`
- **Language:** Follow `language` setting in `.omc/workflow/config.yaml` (default: `ko`)
- Contents:
  - Before/After flow diagrams
  - Key review points (with code snippets)
  - Trade-offs considered
  - Potential risks
  - Test results explained
  - NOT in scope items
  - Unresolved decisions (with "may bite you later" warnings)
  - **[GRIND] 열일 Summary section:**
    - Total retries across all steps
    - Strategy pivots taken (what changed and why)
    - Accepted trade-offs (issues triaged as acceptable)
    - Failure patterns observed (for future improvement)
    - Escalation reports generated (if any)
- Save: `.omc/reports/{feature-name}-report.md`

**18-B: Review Sequence Generation**
- Same as simon-bot: architect groups changes into Logical Change Units
- **필수 입력**: `.omc/memory/plan-summary.md`를 읽어 각 변경 단위가 계획의 어떤 Unit/목표에 해당하는지 매핑
- Each unit includes: title, **계획 매핑**, reason, **변경 전 상태 (Before Context)**, **변경 내용 (What Changed)**, files, key diff, review points, **다른 변경 단위와의 연관**, expert concerns, trade-offs
- **[GRIND] Additionally include:**
  - Any strategy pivots that affected this change unit
  - Accepted trade-offs relevant to this unit
  - Retry history summary for this unit
- Save: `.omc/memory/review-sequence.md`

### Step 19: Interactive Guided Review (Enhanced)

**목적**: 변경사항을 논리적 흐름 순서대로 하나씩 제시하며, 사용자와 대화형으로 리뷰 진행. 각 변경이 계획의 어디에 해당하고, 기존 코드 대비 어떻게 개선되었는지 풍부한 맥락을 제공.

**19-A: 리뷰 개요 제시 (계획 매핑 기반)**
- `.omc/memory/plan-summary.md`와 `.omc/memory/review-sequence.md`를 함께 읽어 계획-구현 매핑 개요를 구성
- 사용자에게 보여줄 내용:
  - **계획 요약 리마인드**: 원래 계획의 목표와 핵심 요구사항 (1-2문장)
  - **구현 매핑 테이블**: 계획의 각 Unit/목표가 어떤 논리적 변경 단위로 구현되었는지 매핑
    ```
    | 계획 Unit | 구현된 변경 단위 | 핵심 변경 |
    |-----------|-----------------|----------|
    | Unit 1: 피드 모델 정의 | #1 모델 추가, #2 상수 정의 | 새 모델 2개, enum 3개 |
    | Unit 2: 파싱 로직 | #3 파서 구현 | 기존 파서 확장 |
    ```
  - **변경 단위 간 관계도**: 변경 단위들이 어떻게 맞물리는지 흐름 설명
    - 예: "#1에서 정의한 모델을 #3 파서가 사용하고, #4 커맨드가 #3을 호출하여 최종 실행"
    - 데이터/호출 흐름 방향으로 서술
  - **리뷰 진행 순서 안내**: 왜 이 순서로 리뷰하는지 (상류→하류, 기반→활용 등)
  - **[GRIND] 열일 summary:**
    - Total retry attempts across all steps
    - Strategy pivots taken
    - Issues triaged/accepted
- "이 순서로 하나씩 리뷰를 진행하겠습니다" 안내

**19-B: 순차 리뷰 루프 (풍부한 맥락 제공)**
- From `.omc/memory/review-sequence.md`, present one by one
- **Each Logical Change Unit:**
  1. **맥락 제시** (마크다운으로 출력):
     - **계획 매핑**: "이 변경은 계획의 [Unit N: 제목]을 구현합니다"
     - **변경 전 상태 (Before)**:
       - 기존 파일 수정인 경우: 변경 전 코드가 어떤 역할을 하고 있었는지, 동작 방식, 한계점
       - 신규 파일인 경우: "해당 없음 (신규 생성)" + 왜 새 파일이 필요한지
     - **변경 내용 (What We Changed)**: 구체적으로 어떤 부분을 어떻게 개선/추가했는지
     - **핵심 코드 diff**: Before/After (중요 부분 발췌)
     - **다른 변경 단위와의 연관**: 이전/이후 변경 단위와 어떤 관계인지
       - 예: "이 서비스는 #1에서 추가한 모델을 사용하며, #4 커맨드에서 호출됩니다"
     - **리뷰 포인트**: 특별히 주의 깊게 봐야 할 부분
     - **전문가 우려사항 반영**: 관련 우려가 있었다면 어떻게 반영했는지
     - **트레이드오프**: 설계 결정과 그 이유
     - **[GRIND] 추가 맥락**: 이 변경에 영향을 준 전략 변경, 수용된 트레이드오프, 재시도 히스토리
  2. AskUserQuestion for feedback:
     - **OK**: proceed to next
     - **Revision requested**: executor (opus) fixes → re-present → reconfirm (max **10**: `loop_limits.step19_review`)
       - **[GRIND] If revision keeps failing:**
         - After attempt 4: architect analyzes why user feedback isn't being satisfied
         - After attempt 6: present user with alternative approaches
         - After attempt 8: architect + executor collaborative revision
         - After attempt 10: record as "needs manual attention" and continue
     - **Question**: answer then re-ask OK/revision
  3. Record: `.omc/memory/review-progress.md`
- **After all units reviewed:**
  - Summary output (OK count, revised count, pending count)
  - If revisions were made: re-run build + test
  - If pending items: record in `.omc/memory/unresolved-decisions.md`

**19-C: PR 생성 및 최종 마무리**
- 수정이 있었다면 커밋 후 브랜치를 원격에 push
- AskUserQuestion: "모든 리뷰가 완료되었습니다. PR을 생성할까요?"
  - **Draft PR 생성**: `gh pr create --draft` 실행 (base: `{base_branch}`, head: 사용자 브랜치)
  - **Ready PR 생성**: `gh pr create` 실행 (Draft 없이 바로 Ready)
  - **추가 수정 필요**: 19-B로 돌아가 추가 리뷰
- PR 생성 시 Step 18 보고서 내용을 PR description에 포함
- **Persistent feedback**: save to `.omc/memory/feedback.md`
- Record in `.omc/memory/retrospective.md`
- **Success Criteria 최종 검증**: `.omc/memory/success-criteria.md`에 체크리스트 결과 저장
- Update: `CONTEXT.md` — 최종 상태 갱신 (모든 성공 기준 체크 결과 + 열일 Summary 반영)

### 열일 Summary Table

| Step | Standard simon-bot | 열일모드 (Grind) | New Feature |
|------|-------------------|-----------------|-------------|
| Step 2 | 3 iterations | **10** iterations | Mediator at 5, compromise at 7, force at 9 |
| Step 4-B | 2 loops | **10** loops | +10 extra consensus rounds |
| Step 5 | No build retry | **10** retries + **10** pivots | Root cause, strategy pivot, last stand |
| Step 6 | 3 auto-fix | **10** auto-fix | Re-analyze requirements, scope adjustment |
| Step 7-B | 1 re-review | **10** re-reviews | Architectural limitation detection |
| Step 7-8 | 2 loops | **10** loops | Root cause at 4-5, strategy pivot at 6-8 |
| Step 9-11 | No loop | **10** refactor loops | Rollback, minimal/targeted split |
| Step 12 | No loop | **10** review loops | Mediation, negotiation, trade-offs |
| Step 13 | No retry | **10** retries | Conservative cleanup fallback |
| Step 14 | No retry | **10** retries | Quality improvement iterations |
| Step 15 | No retry | **10** retries | Flow simplification pivot |
| Step 16 | 3 iterations | **10** iterations | Progressive + batch + collaborative |
| Step 17 | No retry | **10** retries | Diagnosis, triage, last stand |
| Step 19 | 3 revisions | **10** revisions | Architect analysis, collaborative revision |
| Integration | No retry | **10** retries | Semantic merge, partial integration |
| Expert teams | 2 rounds | **2 + 10** rounds | Extended consensus protocol |
| Test env | No retry | **10** retries | Alt package managers, workarounds |
| Interview | None | **5 rounds + escalations** | 구조화된 인터뷰, assumption registry, 우려사항별 해결 |
| Cross-cutting | None | **Always on** | Failure log, checkpoints, escalation ladder |

### Auto-Diagnosis Report Format

When human escalation is needed, generate `.omc/memory/escalation-report.md`:

```markdown
# Escalation Report — Step {N}, Unit {name}

## Problem Summary
(1-2 sentences)

## Failure Timeline
| Attempt | Action Taken | Result |
|---------|-------------|--------|
| 1 | ... | ... |
| ... | ... | ... |
| 10 | ... | ... |

## Root Cause Analysis
(Architect's diagnosis)

## Strategy Pivots Attempted
1. (description + why it failed)
2. (description + why it failed)
...

## Recommendation
- [ ] Option A: (description)
- [ ] Option B: (description)
- [ ] Option C: Skip this and proceed

## Context Files
- failure-log.md
- checkpoints.md
- unit-{name}/implementation.md
```

### Success Criteria (완료 체크리스트)

워크플로 완료 전 아래 항목을 모두 검증합니다. **하나라도 미충족이면 완료를 선언할 수 없습니다.**

- [ ] 모든 테스트가 RED→GREEN 사이클로 작성됨 (Step 5 TDD)
- [ ] 전체 테스트 스위트 통과 (0 failures)
- [ ] 빌드 성공
- [ ] 타입체크 통과
- [ ] 보안 리뷰 통과 — CRITICAL 없음 (Step 7, 17)
- [ ] 전문가 우려사항 HIGH 이상 모두 반영됨 (Step 4-B, 7)
- [ ] 코드 리뷰 통과 (Step 12, 14)
- [ ] 사용자 가이드 리뷰 완료 — 모든 변경 단위 OK (Step 19-B)
- [ ] 미해결 결정사항 문서화됨 (`unresolved-decisions.md`)
- [ ] CONTEXT.md 최종 상태 갱신됨
- [ ] **[GRIND]** 열일 Summary 포함 (재시도 횟수, 전략 전환, 수용된 트레이드오프)
- [ ] **[GRIND]** 모든 에스컬레이션 리포트 해결됨 또는 문서화됨

**검증 시점:**
- Step 17 (Production Readiness): 기술적 항목 검증
- Step 19-C (PR 생성 전): 전체 체크리스트 최종 검증
- Save: `.omc/memory/success-criteria.md`

### Global Forbidden Rules

NEVER execute any of these under ANY circumstances:
- `git push --force` / `git push -f`
- `git merge` to main/master branch
- `rm -rf`
- `DROP TABLE` / `TRUNCATE`
- Commit `.env` or secret files
- `chmod 777`
- `eval` with untrusted input
- `curl | sh` or `wget | sh`
- `curl`/`wget` to real external endpoints
- `mysql`/`psql`/`redis-cli`/`mongosh` to real databases
- `ssh`/`scp`/`sftp` to real servers
- Any test that calls real DB or external API

### Session Management

Same as simon-bot. Use `.omc/workflow/scripts/manage-sessions.sh` for:
- `list` — active worktree sessions
- `info <branch-name>` — session details
- `delete <branch-name>` — delete session

### Memory Persistence

Record state at these checkpoints:
- After each Step completion: findings/results
- On agent transition: previous agent's conclusions
- On loop rollback: why and what to fix
- On Unit completion: full unit summary
- **[GRIND] On every failure**: failure-log.md entry
- **[GRIND] On every strategy pivot**: checkpoint tag + pivot description
- **[GRIND] On every escalation**: escalation-report.md

Always read relevant `.omc/memory/*.md` AND `.omc/memory/failure-log.md` before starting any step.

### Unresolved Decision Tracking

Same as simon-bot, plus:
- **[GRIND] Accepted trade-offs**: Issues triaged as acceptable during Step 17
- **[GRIND] Skipped improvements**: Quality issues that couldn't be resolved within retry budget
- All included in Step 18 report with "may bite you later" warnings
