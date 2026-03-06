# Phase B-E: Implementation & Verification (Detailed Instructions)

After Phase A is confirmed, use background agents (`Agent(run_in_background=true)`) for parallel unit execution.
Each Unit runs in an **isolated git worktree**. Independent Units run in **parallel**.

## Pre-Phase: Base Branch Sync & Worktree 생성

1. default branch 감지 (`auto`이면 main/master 자동 감지)
2. `git fetch {remote} {base_branch}` 실행 (원격 최신 동기화)
3. `.claude/memory/branch-name.md`에서 사용자가 입력한 브랜치명 읽기
4. worktree 생성: `git worktree add .claude/worktrees/{branch-name} -b {branch-name} origin/{base_branch}`
5. 해당 worktree로 작업 디렉토리 이동
6. base commit SHA를 `.claude/memory/base-commit.md`에 기록

**중요:** 현재 로컬 브랜치를 checkout/변경하지 않음 (안전)

### CONTEXT.md 생성

워크트리 루트에 `CONTEXT.md` 생성하고, `.git/info/exclude`에 추가 (커밋에서 제외).

```markdown
# [브랜치명]: [작업 요약]

## 목표
[plan-summary.md에서 Goal 발췌]

## 현재 진행 상태
- [x] Phase A: Planning
- [ ] Step 5: Implementation (TDD)
- [ ] Step 6: Purpose Alignment
- [ ] Step 7: Expert Review
- [ ] Step 8: Regression Verification
- [ ] Steps 9-16: Refinement Cycle (STANDARD+ only)
- [ ] Step 17: Production Readiness
- [ ] Integration
- [ ] Step 18: Work Report + Draft PR
- [ ] Step 19: PR-Based Code Review

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

## 메모리 파일 맵
- plan-summary.md — 전체 계획
- code-design-analysis.md — 코드 설계 분석
- expert-plan-concerns.md — 전문가 우려사항
- success-criteria.md — 완료 체크리스트
```

**갱신 시점**: 각 Step 완료 시 즉시 해당 항목을 갱신한다. 여러 Step을 한꺼번에 모아서 갱신하지 않는다.

## Critical Rules

- All verification/review: ONLY changed files (git diff based). 변경하지 않은 파일을 리뷰하면 노이즈가 증가하고 핵심 변경점을 놓칠 수 있다.
- Use `.claude/workflow/scripts/*.sh` for deterministic tasks (save context)
- Record findings in `.claude/memory/unit-{name}/*.md` after each step
- Read memory files at start of each step
- Tests: NEVER use real DB or external APIs. 테스트가 실제 시스템에 부작용을 일으키면 프로덕션 데이터가 손상되거나 외부 서비스에 의도치 않은 요청이 발생한다. mock/stub만 사용하라.
- Commands: NEVER access real external systems. CONTEXT-SENSITIVE 규칙에 해당하는 경우 SKILL.md의 판단 절차를 따른다.
- **환각 방지**: 읽지 않은 코드에 대해 추측하지 않는다. 파일은 반드시 Read로 열어본 후에 의견을 제시한다. 추측 기반 수정은 새로운 버그를 만들 수 있다.
- **Anti-hardcoding**: 테스트를 통과시키기 위해 특정 입력값을 하드코딩하지 않는다. 일반적 해결책을 구현한다. 하드코딩은 테스트만 통과시키고 실제 문제를 숨긴다.
- **Auto-Verification Hook**: 소스코드 파일 수정(Edit/Write) 후 `verify-commands.md`의 빌드/린트 명령을 즉시 실행한다. 실패 시 현재 Step 내에서 수정-재검증 루프를 돌린다. `.md`, `.json` 등 비소스코드는 제외. (SKILL.md Cross-Cutting Protocol 참조)
- **Step Progress Pulse (P-007)**: 각 Step 완료 시 사용자에게 1줄 상태를 출력한다 (AskUserQuestion이 아닌 단순 텍스트 출력이므로 사용자를 중단시키지 않는다). 형식: `[Step {N}/{total}] {Step명} 완료 — {핵심 결과 요약}`. 예: `[Step 7/17] Expert Review 완료 — CRITICAL 0, HIGH 2, MEDIUM 5`. Phase B-E 시작 시 예상 Step 수를 안내한다: `{경로} 경로: Steps 5-{N} ({M} steps)`.

## Pre-Step: Test Environment Setup

- Run `.claude/workflow/scripts/setup-test-env.sh`
- **Exit code 해석:**
  - `0` = 환경 준비 완료 → 테스트 진행
  - `1` = toolchain 문제 → 테스트 skip, build/typecheck 진행
  - `2` = **ENV_INFRA 실패** → Error Resilience의 ENV_INFRA 복구 Ladder 적용 (최대 5회)
- Docker/docker-compose 자동 감지, 포트 충돌 감지 포함
- Save result: `.claude/memory/test-env-status.md`

## Step 5: Implementation (TDD 필수)

- **먼저 읽기**: `expert-plan-concerns.md`, `code-design-analysis.md`, `verify-commands.md`
- **검증 명령 활용**: `verify-commands.md`에 기록된 통합 검증 명령을 TDD 사이클의 VERIFY 단계에서 사용. 프로젝트 고유의 lint/build/test를 한번에 실행하여 빠른 피드백을 확보한다.
- Spawn `executor`, parallel for independent files
- executor는 code-design-analysis.md의 컨벤션과 패턴을 따라 구현
- 전문가 우려사항 중 HIGH 이상 항목을 구현 시 반드시 고려

### 기존 구현 참조 (P-013)

executor는 구현을 시작하기 전에 유사 기능의 기존 구현을 먼저 찾아야 한다:

1. **유사 구현 탐색**: 현재 구현할 기능과 유사한 기존 구현을 2-3개 찾는다. 함수 이름이 아닌 기능의 목적으로 검색한다 (Multi-term search: 동의어/관련어 활용)
2. **패턴 기록**: 발견된 구현체의 에러 처리 스타일, 리턴 타입, 네이밍 규칙, 테스트 구조를 메모한다
3. **패턴 따르기**: code-design-analysis.md가 다른 패턴을 명시적으로 권장하지 않는 한, 발견된 기존 패턴을 따른다
4. **검색 결과 0건 시**: 다른 용어로 최소 2회 재시도한 후에 "유사 구현 없음"으로 판단한다

이를 통해 기존 코드베이스와 일관된 구현을 보장하고, 이미 검증된 패턴을 재활용한다.

### TDD Cycle (RED → GREEN → REFACTOR)

TDD 사이클을 따르는 이유: 테스트를 먼저 작성하면 요구사항을 코드로 명세화하고, 구현이 요구사항을 충족하는지 즉시 확인할 수 있다.

- **Step 5a: RED** — 실패하는 테스트 먼저 작성하고, 테스트가 실패하는지 확인한다
- **Step 5b: GREEN** — 테스트를 통과시키는 최소한의 구현 코드를 작성하고, 테스트 통과를 확인한다
- **Step 5c: REFACTOR** — 테스트 통과 상태를 유지하며 코드를 정리한다. 불필요하면 skip
- **Step 5d: VERIFY** — 전체 테스트 스위트를 실행한다. 모든 테스트가 통과한 후에 다음 단계로 진행한다
- **Step 5e: Working Example Spot-check** — Unit 구현 완료 후, plan-summary.md의 Behavior Changes에서 핵심 시나리오 1개를 선택하여 실제 동작을 확인한다 (테스트 통과 ≠ 실제 동작). CLI 실행, curl dry-run, 또는 사용 예제 코드 실행으로 검증. 실패 시 Step 5b로 회귀.

- Run via tmux: build + test + typecheck simultaneously

### Agent 출력물 검증 게이트

Agent가 "완료"를 보고하면 즉시 검증한다:
1. `plan-summary.md`의 Files Changed 테이블에서 기대 파일 목록 추출
2. 실제 worktree에서 파일 존재 여부 확인 (`Glob`)
3. 누락 파일 → agent 재실행 (max 2회)
4. 빌드 확인: `go build ./...` (또는 해당 언어 컴파일 명령)

검증이 통과한 후에 다음 Step으로 진행한다.

### Ground Truth 검증 게이트

모든 코드 변경 Step 완료 후 빌드/테스트/타입체크를 실행하고, 결과를 다음 Step의 입력으로 전달한다. 이를 통해 각 단계가 정확한 현재 상태를 기반으로 판단하도록 보장한다.

```
verify-commands.md의 명령 실행 → 결과를 .claude/memory/unit-{name}/ground-truth.md에 기록
```

### Self-correction (Step 6 전 자가 검증)

executor가 구현을 완료하면, Step 6으로 넘기기 전에 plan-summary.md의 Acceptance Criteria와 대조한다:
1. **Code Changes** 목록의 각 항목이 구현되었는지 확인
2. **Tests** 목록의 테스트가 작성되었는지 확인
3. **Quality Gates** 조건을 충족하는지 확인
4. 누락 항목이 있으면 자체적으로 보완한 후 Step 6으로 진행

- Save: `.claude/memory/unit-{name}/implementation.md`

## Step 6: Purpose Alignment Review

- Spawn `architect`: Check implementation matches requirements
- Minor: executor auto-fix (max 3 times)
- Major: → Step 1-B (plan itself was insufficient)

### 6-B: Working Example 검증

테스트 통과 ≠ 실제 동작 확인. 며칠 후 "사실 이건 구현 안 됐었네"를 방지하기 위해, 실제로 코드가 의도대로 동작하는지 시연 가능한 수준으로 확인한다.

- `architect`가 plan-summary.md의 **Behavior Changes (Before → After)**를 기준으로 검증 시나리오 1-2개 도출
- `executor`가 실제 실행 또는 실행 가능한 스크립트/curl 명령으로 동작 확인
  - CLI 도구: 실제 명령 실행
  - API: curl/httpie 명령 예시 작성 (실제 외부 호출은 금지 — mock server 또는 dry-run)
  - 라이브러리: 간단한 사용 예제 코드 작성 + 실행
- 결과를 `.claude/memory/unit-{name}/working-example.md`에 기록
- **검증 실패 시**: Step 5로 회귀 (구현 누락)

## Step 7: Bug/Security/Performance Review — 도메인팀 Agent Team 토론

### 7-A: 구현 결과 검증 (Agent Team 토론)

- Step 4-B와 동일한 통합 전문가 팀 구조 (`TeamCreate(team_name="impl-review")`)
- 추가 컨텍스트: `plan-summary.md`, `expert-plan-concerns.md`, `code-design-analysis.md`, **실제 git diff**
- **Shared Tasks** (4단계):
  - Task 0: Step 4-B 우려 반영 확인
  - Task 1: 독립적 diff 검토 → findings (`references/expert-output-schema.md`의 Findings Schema를 따른다)
  - Task 2: 직접 메시지로 토론
  - Task 3: 팀 합의 → findings.md (CRITICAL/HIGH/MEDIUM)
- CRITICAL/HIGH → executor auto-fix, MEDIUM → record

### 7-B: 사전 우려사항 대조 검증

- `.claude/memory/expert-plan-concerns.md` 읽기
- `.claude/memory/expert-discussions/*-discussion.md` 읽기 (토론 맥락 + trigger_condition 확인)
- 각 concern의 `trigger_condition`을 실제 구현 결과와 대조하여, 조건이 충족된 concern은 severity를 재평가한다
- Spawn `architect`: 사전 우려사항 중 누락 항목 대조
- 누락 발견 → executor fix → 7-A 재검증 (max 1회)

- Use security-reviewer + code-reviewer subagents
- Save: `.claude/memory/unit-{name}/review-findings.md`

## Step 8: Regression Verification

- Spawn `architect`: Step 7 fixes가 기존 기능 깨뜨리지 않았는지 확인
- Regression → executor fix → Step 7 re-review (max 2 loops)

--- SMALL path skips to Step 17 here ---

## Refinement Cycle (P-006, STANDARD+ 경로, Step 8 완료 후)

ARC-AGI에서 영감을 받은 반복 개선 루프. 기존 Steps 9-16의 개별 단계를 "Generate → Self-improve → Verify → Correct" 사이클로 통합하여, 필요한 만큼만 반복하고 품질이 충족되면 즉시 종료한다.

### Refinement Iteration (max 3회)

각 iteration에서:

**1. Scan (Generate)** — `architect`가 전체 diff를 스캔하여 개선 대상을 분류:
- **Splitting**: 50줄+ 함수 또는 300줄+ 파일
- **Reuse**: 중복 코드 또는 재사용 가능 패턴
- **Dead Code**: 사용되지 않는 코드
- **Flow Issues**: 다중 파일 간 흐름 문제
- **Quality Issues**: 코드 품질 (가독성, 네이밍, 에러 처리)
- **MEDIUM Issues**: 이전 Step에서 누적된 MEDIUM 이슈

**2. Fix (Self-improve)** — `executor`가 발견된 이슈를 일괄 수정

**3. Verify (Verify)** — 수정 후 빌드/테스트/타입체크 실행 + `/simplify` 스킬로 코드 품질 검토

**4. Check (Correct)** — 새로운 이슈 발생 여부 확인:
- 새 이슈 없음 → Cycle 종료, Step 17로 진행
- 새 이슈 발생 → 다음 iteration으로 (남은 iteration 내에서)
- max iteration 도달 → 잔여 MEDIUM 이슈는 기록 후 Step 17로 진행

### Refinement 결과 기록

`.claude/memory/unit-{name}/refinement-result.md`:
```markdown
## Refinement Cycle Result
- Iterations: {N}/3
- Issues found: {총 발견 수}
- Issues fixed: {수정 수}
- Remaining MEDIUM: {잔여 수} (기록만)
- Exit reason: clean / max-iterations
```

## Step 17: Production Readiness

- **참조**: Success Criteria 체크리스트의 기술적 항목을 이 단계에서 검증
- Spawn `architect` + `security-reviewer` (parallel)
- Final checklist: requirements met, build passes, tests pass, no security issues
- Minor: executor fix. Major: → relevant Phase. Critical: → Step 1-B
- Save: `.claude/memory/unit-{name}/final-check.md`
