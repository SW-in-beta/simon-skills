# Grind Cross-Cutting Systems

## Auto-Diagnosis System

This system operates across ALL steps. On ANY failure:

### Failure Tracking Protocol

Record every failure in `.claude/memory/failure-log.md`:
```
## [Step N] Attempt M — {timestamp}
- **Error type**: build / test / typecheck / review-rejection / consensus-failure
- **Error summary**: (1-2 lines)
- **Files involved**: list
- **Previous attempts**: what was tried
- **Metrics**: failing_tests={N}, error_signature={hash/key}, changed_lines={N}
```

Check failure patterns before each retry.

### Progress Detection (재시도 진전 감지)

매 재시도 후 이전 시도의 환경 피드백(빌드 로그, 테스트 결과)과 현재 결과를 구조적으로 비교한다.
같은 실패를 반복하면 더 많이 시도해봐야 결과가 달라지지 않기 때문이다.

**비교 항목:**
1. **실패 테스트 수 변화** — 이전 attempt 대비 failing test count 증감
2. **에러 메시지 동일성** — 동일 에러 시그니처가 반복되는지 (에러 메시지의 핵심 키워드/코드 비교)
3. **변경된 코드 라인 수** — 이전 attempt 대비 실질적으로 달라진 코드 양

**진전(Progress) 판정 기준:**
- 실패 테스트 수가 줄었거나, 에러 메시지가 달라졌거나, 의미 있는 코드 변경이 있으면 → "진전 있음"
- 위 세 항목 모두 변화 없으면 → "진전 없음(stalled)"

**Stall Detection Rule:**
- 진전 없는 재시도가 **2회 연속** 되면 현재 전략을 즉시 전환한다 (다음 escalation tier로 점프).
  - 예: Attempt 2에서 stalled 2회 → Attempt 4-6 tier(Root Cause Analysis)로 즉시 이동
  - 예: Attempt 5에서 stalled 2회 → Attempt 7-9 tier(Strategy Pivot)로 즉시 이동
- 이유: 같은 tier 내에서 같은 접근법을 반복하는 것은 시간 낭비이며, 빠른 전략 전환이 해결 확률을 높인다.
- 이 규칙은 escalation ladder의 attempt 번호를 건너뛰는 것이지, 총 시도 횟수 자체를 줄이는 것이 아니다.

### Strategy Pivot Examples

- Implementation approach change (different algorithm, different library)
- Architecture change (split into smaller units, change layer boundaries)
- Test strategy change (integration → unit test, or vice versa)
- Dependency resolution (different package version, alternative dependency)
- Scope reduction (implement core only, defer edge cases)
- Complete rewrite of the problematic section

### Problem Redefinition Check (P-009)

Strategy Pivot 발생 시, 구현 전략뿐 아니라 **문제 정의 자체**가 올바른지 재검토한다:
- "우리가 풀고 있는 문제가 맞는가?" — plan-summary.md의 Intent와 현재 실패 원인을 대조
- 문제 재정의가 필요하면 plan-summary.md를 업데이트하고 실패 로그에 `[PROBLEM_REDEFINED]` 태그 기록
- 이 체크가 없으면 잘못된 문제를 끈질기게 푸는 상황이 발생한다

### Model-Level Escalation (P-009)

연속 5회 실패 시, 현재 모델의 능력 한계일 수 있으므로 모델 레벨을 한 단계 올려 재시도한다:
- sonnet → opus 전환 (subagent의 모델 파라미터 변경)
- 전환 사유를 failure-log.md에 기록: `[MODEL_ESCALATION] sonnet→opus, reason: {N}회 연속 실패`
- opus에서도 실패 시 기존 Escalation Ladder를 따른다

### Time Guard (P-009)

단일 Step에서 과도한 시간이 소요되는 것을 방지한다.

**구현 방식** (bash 타임스탬프 기반):
- Step 시작 시: `date +%s > /tmp/.simon-bot-step-start`
- 매 재시도 시작 시 경과 시간 확인:
  ```bash
  START=$(cat /tmp/.simon-bot-step-start 2>/dev/null || echo 0)
  NOW=$(date +%s)
  ELAPSED=$(( (NOW - START) / 60 ))
  ```
- 기본 상한: Step당 15분 (config.yaml `time_guard_minutes`로 조정 가능)
- 상한 초과 시: Progress Pulse를 발동하여 사용자에게 경과 시간과 함께 보고
- 목적: "끈질기게"가 "무한정"이 되는 것을 방지

### Pivot Divergence Check (P-009)

전략 전환이 3회 이상 발생하면, 각 전환의 방향이 수렴하고 있는지 확인한다:
- 수렴 (같은 방향의 점진적 조정) → 계속 진행
- 발산 (매번 완전히 다른 방향) → 근본 원인을 재분석하지 않고 표면적 전략만 바꾸고 있을 가능성. Problem Redefinition Check 강제 실행

## Checkpoint System

- Before each strategy pivot, save checkpoint: `git stash` or `git tag checkpoint-step{N}-attempt{M}`
- If new strategy also fails, can rollback to checkpoint and try next alternative
- Save: `.claude/memory/checkpoints.md` (list of checkpoint tags with descriptions)

## Confidence Scoring & Assumption Registry

Every agent output in Phase A must include confidence assessments.

### Confidence Levels

- **HIGH** (≥0.9): No user confirmation needed, record only
- **MEDIUM** (0.7–0.9): User confirmation needed if agents disagree
- **LOW** (<0.7): Automatic user confirmation required

### Assumption Registry (`.claude/memory/assumptions-registry.md`)

```markdown
## Assumptions Registry
| # | Assumption | Confidence | Impact | Status | Source Step | User Response |
|---|-----------|-----------|--------|--------|------------|---------------|
| 1 | ... | LOW | HIGH | Unverified | Step 0 | — |
```

### Escalation Rules

| Confidence | Impact | Action |
|-----------|--------|--------|
| LOW | HIGH | **MUST** ask user (blocking, 탈출 불가) |
| LOW | LOW | 인터뷰 라운드에 포함 (탈출 가능) |
| MEDIUM + 의견 불일치 | any | 인터뷰 라운드에 포함 (탈출 가능) |
| HIGH | any | 기록만, 사용자 확인 불필요 |

### Protocol

1. Every agent output in Phase A must tag assumptions with `[ASSUMPTION confidence=X impact=Y]: description`
2. Orchestrator collects all assumptions and updates `assumptions-registry.md`
3. LOW confidence or MEDIUM+disagreement assumptions queue for user interview
4. User responses update registry status to Verified/Rejected
5. Rejected assumptions trigger re-analysis of dependent decisions

## Total Retry Budget (워크플로 전체 재시도 예산)

개별 Step마다 10회 재시도가 가능하지만, 워크플로 전체로 보면 무한 재시도는 비효율적이다.
전체 예산을 설정하면 "숲을 보지 못하고 나무만 파는" 상황을 방지할 수 있다.

### 기본 설정
- **total_retry_budget: 50** (전체 워크플로에서 사용할 수 있는 총 재시도 횟수)
- 사용자가 시작 시 다른 값을 지정할 수 있다 (예: "예산 100으로 해줘")

### 차감 규칙
- 각 Step에서 재시도할 때마다 예산에서 1 차감
- 첫 번째 시도(Attempt 1)는 차감하지 않음 — 재시도(Attempt 2+)부터 차감
- 현재 잔여 예산은 failure-log.md 상단에 기록

### 경고 및 에스컬레이션
- **예산 70% 소비 시** (기본: 35회 재시도 누적): Progress Pulse로 사용자에게 경고
  ```
  [Budget Warning — {consumed}/{total} retries used]
  - 가장 많이 소비한 Step: Step {N} ({X}회)
  - 남은 예산: {remaining}회
  - 예상 남은 작업: {remaining_steps}
  - 계속 진행할까요? (Y/예산 추가/우선순위 조정)
  ```
- **예산 100% 소비 시**: 강제 에스컬레이션 — 더 이상 자동 재시도 불가
  - 사용자가 추가 예산을 부여하면 계속 진행 (예: "+20")
  - 사용자가 중단을 선택하면 현재까지의 결과물로 마무리

### Progress Pulse와의 연계
- Progress Pulse 보고에 항상 "잔여 예산: {N}회" 포함
- 예산 경고는 Progress Pulse의 발동 조건에 추가됨

## Progress Pulse (중간 상황 보고)

자동 조종 중에도 경로 이탈을 감지하려면 사람에게 주기적으로 상황을 보여줘야 한다.

### 발동 조건
- 단일 Step에서 **연속 3회 실패** 시 (escalation 전 중간 보고)
- **전략 전환(Strategy Pivot)** 발생 시
- **누적 재시도 15회** 도달 시 (전체 워크플로 기준)
- **Total Retry Budget 70% 소비** 시

### 보고 내용 (AskUserQuestion)
```
[Progress Pulse — Step {N}, Attempt {M}]
- 현재 상태: {무엇을 하고 있는지}
- 실패 원인: {최근 실패 요약}
- 진전 여부: {Progress Detection 결과 — 개선/정체/악화}
- 다음 전략: {어떻게 시도할 계획인지}
- 누적 현황: 재시도 {X}회, 전략 전환 {Y}회
- 잔여 예산: {remaining}/{total} 회
- 계속 진행할까요?
  - **계속**: 현재 전략으로 계속 진행
  - **피드백**: 사용자 힌트를 반영하여 재시도
  - **전략 변경**: 다른 접근법으로 전환 (구체적 방향 제시 가능)
  - **중단**: 현재까지의 결과물로 마무리
  - **예산 추가**: 재시도 예산 추가 (예: "+20")
```

### 원칙
- Progress Pulse는 **에스컬레이션이 아니다** — 문제 해결을 사용자에게 떠넘기는 것이 아니라, 경로 이탈을 조기에 감지하기 위한 상황 공유. "Escalation Ladder 소진 전 에스컬레이션 금지" 원칙과 충돌하지 않는다.
- **경량 체크포인트** — 사용자가 "계속"이면 즉시 재개. 사용자 피드백이 있으면 반영 후 재시도.
- Progress Pulse를 통해 받은 피드백도 `user-feedback-log.md`에 기록

## Escalation Report Format

When human escalation is needed, generate `.claude/memory/escalation-report.md`:

```markdown
# Escalation Report — Step {N}, Unit {name}

## Problem Summary
(1-2 sentences)

## Failure Timeline
| Attempt | Action Taken | Result |
|---------|-------------|--------|
| 1 | ... | ... |
| 10 | ... | ... |

## Root Cause Analysis
(Architect's diagnosis)

## Strategy Pivots Attempted
1. (description + why it failed)

## Recommendation
- [ ] Option A: (description)
- [ ] Option B: (description)
- [ ] Option C: Skip this and proceed

## Context Files
- failure-log.md, checkpoints.md, unit-{name}/implementation.md
```

## Agent Teams Fallback

Agent Teams가 비활성 상태일 때의 대체 전략은 `~/.claude/skills/simon-bot/references/agent-teams-fallback.md`를 따른다. grind의 "절대 멈추지 않는다" 원칙에 따라, Agent Teams 실패는 워크플로 중단 사유가 아니다. failure-log.md에 기록 후 subagent fallback으로 자동 전환한다.
