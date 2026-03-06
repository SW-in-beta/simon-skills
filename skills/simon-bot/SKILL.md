---
name: simon-bot
description: "19-step 딥 워크플로 — 계획, 구현, 검증을 최고 수준의 엄격함으로 수행합니다. Use when: (1) 새 기능/피처 구현 (\"피처 구현해줘\", \"새 기능 만들어줘\", \"코드 작성해줘\"), (2) 전문가 리뷰 패널이 필요한 체계적 계획 수립, (3) git worktree 기반 병렬 실행, (4) PR 전 종합 코드 검증이 필요할 때. 코드 변경이 수반되는 모든 중대한 작업에 이 스킬을 사용하세요."
---

# simon-bot

Deep workflow skill with 19-step quality pipeline.

## Instructions

You are executing the **simon-bot** deep workflow. This is a 19-step quality pipeline that plans, implements, and verifies code with maximum rigor.

## Cross-Cutting Protocols

### Error Resilience

모든 실패를 ENV_INFRA / CODE_LOGIC / WORKFLOW_ERROR로 분류한 후 자동 복구한다. 사용자가 명시적으로 중단을 요청하지 않는 한 워크플로를 중단하지 않는다.
For detailed protocol, read [error-resilience.md](references/error-resilience.md).

### Agent Teams

이 워크플로는 Agent Teams 기능을 우선 사용한다 (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 필요). 팀원들이 직접 메시지로 토론하고, 공유 작업 목록으로 자체 조율한다.

**Fallback**: Agent Teams가 비활성 상태이면(TeamCreate 실패 시) 일반 subagent 기반 대체 방식을 사용한다. 각 전문가를 `Agent(subagent_type="general-purpose")`로 개별 spawn하고, 공유 파일 경로에 findings를 기록한 후, 오케스트레이터가 결과를 수집하여 교차 검증(cross-verification)을 수행한다. 실시간 peer messaging은 없지만 동등한 품질의 결과를 도출한다.

For lifecycle, rules, and fallback details, read [agent-teams.md](references/agent-teams.md).

### Decision Trail

주요 판단 지점(경로 선택, 전문가 합의, 재시도 결정)에서 사용자에게 1줄 판단 근거를 제시한다.
형식: `[Decision] SMALL 경로 선택 — 변경 파일 3개, 외부 연동 없음.`

### Auto-Verification Hook (P-001)

모든 소스코드 파일 수정(Edit/Write) 후, `verify-commands.md`의 빌드/린트 명령을 즉시 실행한다. Phase B-E 전체에 적용되는 자동 피드백 루프다.

- **빌드+린트**: 항상 실행
- **테스트**: 변경된 파일과 관련된 테스트만 실행 (전체 스위트는 Step 5d VERIFY에서)
- **실패 시**: 즉시 수정 후 다음 작업으로 진행 (Error Resilience 적용)
- **적용 제외**: `.md` 파일, `.json` 설정 파일, 커밋 메시지 등 비소스코드
- **코드 품질 검토**: 구현 일단락 시점(Step 5 완료, Refinement Cycle 완료, Integration 완료)에서 `/simplify` 스킬을 실행하여 변경 코드의 재사용성, 품질, 효율성을 검토한다.

**Hook 기반 강화 (선택사항)**: `.claude/workflow/scripts/auto-verify.sh`를 작성하고 settings.json의 `hooks.PostToolUse`에 등록하면 Edit/Write 후 셸 레벨에서 자동 실행되어 LLM 기억에 의존하지 않는 결정론적 검증이 가능하다.

### Parallel Tool Invocation

독립적인 도구 호출(Read, Grep, Glob 등)은 병렬로 실행한다. 의존성이 있는 호출만 순차 실행한다. 병렬화로 컨텍스트 소비를 줄이고 응답 속도를 높인다.

### Reference Loading Policy (컨텍스트 효율)

각 Phase 진입 시 해당 Phase의 레퍼런스 파일만 읽는다. 모든 레퍼런스를 사전 로딩하지 않는다.

- **Phase A** → `phase-a-planning.md`만 읽기
- **Phase B-E** → `phase-b-implementation.md`만 읽기
- **Integration/Review** → `integration-and-review.md`만 읽기
- **error-resilience.md** → 에러 발생 시에만 읽기
- **agent-teams.md** → Agent Team 생성 시에만 읽기

이전에 로딩한 레퍼런스 내용은 컨텍스트 압축을 통해 유지된다. 압축이 심하게 이루어지지 않은 한 재읽기는 불필요하다.

### Subagent 사용 기준

subagent는 다음 경우에 사용한다:
1. 독립적 컨텍스트가 필요한 병렬 작업
2. 다른 전문성이 필요한 역할 분리
3. 대량의 코드 탐색

단일 파일 수정, 간단한 검색, 단순 명령 실행은 직접 수행한다. 불필요한 subagent 생성은 컨텍스트를 낭비한다.

### Over-engineering 방지

plan-summary.md에 명시된 변경만 구현한다. 변경하지 않는 코드에 docstring, 주석, 타입 어노테이션을 추가하지 않는다. 범위 밖의 개선을 발견하면 `.claude/memory/unresolved-decisions.md`에 기록만 한다.

### User Interaction Recording

매 단계에서 사용자 응답(AskUserQuestion, PR 피드백 등)을 받을 때마다, 워크플로/스킬 개선에 반영할 만한 인사이트를 `.claude/memory/user-feedback-log.md`에 누적 기록한다.

기록 형식 (append):
```
## [Step N] {단계명}
- **User said**: (사용자 발언 요약)
- **Interpretation**: (의도 해석)
- **Skill implication**: (스킬/워크플로 개선점, 없으면 "None")
```

이 기록은 Step 20에서 스킬 자기 개선의 입력이 된다. 사용자의 교정, 불만, 반복 요청에 특히 주의를 기울여 기록할 것.

## Startup

**Execute these steps SEQUENTIALLY.**

1. `.claude/workflow/` 존재 확인. 없으면: `bash ~/.claude/skills/simon-bot/install.sh --project-only`
2. 워크플로 파일 읽기 (parallel OK):
   - `.claude/workflow/config.yaml`
   - `.claude/memory/retrospective.md` (있으면)
   - `.claude/project-memory.json` (있으면 Read)
3. **브랜치명 입력받기** (AskUserQuestion) → `.claude/memory/branch-name.md`에 저장

## Phase A: Planning (Interactive with User)

For detailed step instructions, read [phase-a-planning.md](references/phase-a-planning.md).

**Step 0: Scope Challenge**
- `architect` agent: git history 분석, 최소 변경 결정, scope 판별
- 3 review paths 제시 (SMALL / STANDARD / LARGE)
- SMALL 판별 시 **Fast Track** 적용: Phase A 압축 실행 (상세: phase-a-planning.md)

**Step 1-A: Project Analysis + Code Design Analysis**
- subagent: 프로젝트 구조 스캔 + 분석
- Context7 MCP로 라이브러리 문서 조회
- **Agent Team: Code Design Team** — convention/idiom/design-pattern/testability experts 토론
- Save: `requirements.md`, `code-design-analysis.md`

**Step 1-B: Plan Creation**
- subagent (planner role) in interview mode
- STICC Framework 기반 계획서 (Situation → Task → Intent → Concerns → Acceptance Criteria → End State)
- Interview Guard: 코드에서 알 수 있는 건 묻지 않음. 비즈니스 결정만 질문
- Save: `plan-summary.md`

**Steps 2-4: Plan Review (Agent Team)**
- planner + critic + architect 직접 토론
- Step 2: Plan Review (max 3 iterations)
- Step 3: Meta Verification (cross-verify)
- Step 4: Over-engineering Check (YAGNI/KISS)

**Step 4-B: Expert Plan Review — 도메인팀 Agent Team 토론**
- 5개 도메인팀 (Data/Integration/Safety/Ops/Code Design) 통합 전문가 팀
- 도메인 내 + 도메인 간 교차 토론
- CRITICAL → 계획 수정, HIGH → 주의사항 추가, MEDIUM → 기록
- Save: `expert-plan-concerns.md`

**Phase A Calibration Checklist** — 7개 항목 자동 검증 후 Phase B 진입.

## Phase B-E: Implementation & Verification

For detailed step instructions, read [phase-b-implementation.md](references/phase-b-implementation.md).

After Phase A, use background agents (`Agent(run_in_background=true)`) for parallel unit execution.
Each Unit: isolated git worktree. Independent Units: parallel.

**Pre-Phase**: Base branch sync → worktree 생성 → CONTEXT.md 생성

**Step 5: Implementation (TDD 필수)**
- executor subagent, code-design-analysis.md 컨벤션 준수
- RED → GREEN → REFACTOR → VERIFY (전체 테스트 통과 필수)
- Agent 출력물 검증 게이트 (파일 존재 + 빌드 확인)

**Step 6: Purpose Alignment** — 구현이 요구사항과 일치하는지 검증

**Step 7: Bug/Security/Performance Review** — 도메인팀 Agent Team으로 구현 검증 + 사전 우려사항 대조

**Step 8: Regression Verification** — Step 7 수정이 기존 기능 깨뜨리지 않았는지 확인

--- SMALL path skips to Step 17 ---

**Steps 9-16** (STANDARD+ only):
- Step 9: File/Function Splitting
- Step 10: Integration/Reuse Review
- Step 11: Side Effect Check
- Step 12: Full Change Review (code-reviewer subagent)
- Step 13: Dead Code Cleanup
- Step 14: Code Quality Assessment
- Step 15: Flow Verification
- Step 16: MEDIUM Issue Resolution

**Step 17: Production Readiness** — `architect` + `security-reviewer` 최종 검증

## Integration & Review

For detailed instructions, read [integration-and-review.md](references/integration-and-review.md).

**Integration Stage** — 모든 Unit 완료 후 브랜치 커밋, 충돌 해결, build + test 검증

**Step 18: Work Report + Draft PR**
- 18-A: writer subagent: Before/After 다이어그램, 트레이드오프, 리스크 보고서
- 18-B: architect subagent: 논리적 변경 단위 그룹핑 + 리뷰 순서 결정
- 18-C: Draft PR 생성 (보고서를 PR description에 포함)

**Step 19: PR-Based Code Review**
- 19-A: 리뷰 개요를 세션에서 직접 제시 (계획 매핑, 변경 단위 관계, 리뷰 순서)
- 19-B: PR에 변경 단위별 인라인 코드 리뷰 코멘트 작성 (풍부한 맥락 포함)
- 19-CI: CI Watch — 사용자 리뷰 중 background agent가 CI 모니터링 + 자동 수정
- 19-C: 사용자 PR 피드백 수집 → 수정 → 푸시 루프 (GitHub에서 비동기 리뷰, CI Watch 결과 통합)
- 19-D: 최종 마무리 (retrospective 기록)

**Step 20: Self-Improvement (회고 기반 스킬 개선)**
- 워크플로 전반의 사용자 피드백 종합 (user-feedback-log.md)
- 스킬 개선 패턴 식별 → 사용자 확인 → skill-creator 호출

## Success Criteria

워크플로 완료 전 모두 검증한다. 모든 항목이 충족된 후에 완료로 판정한다.

- [ ] 모든 테스트가 RED→GREEN 사이클로 작성됨
- [ ] 전체 테스트 스위트 통과 (0 failures)
- [ ] 빌드 성공 + 타입체크 통과
- [ ] 보안 리뷰 CRITICAL 없음
- [ ] 전문가 우려사항 HIGH 이상 모두 반영됨
- [ ] 코드 리뷰 통과
- [ ] PR 리뷰 완료 — 모든 리뷰 코멘트 resolved
- [ ] 미해결 결정사항 문서화됨
- [ ] CONTEXT.md 최종 상태 갱신됨
- [ ] retrospective.md 기록됨

검증 시점: Step 17 (기술적 항목), Step 19-C (전체 최종 검증), Step 20 (스킬 개선)

## Global Forbidden Rules

이 규칙들은 되돌릴 수 없는 피해를 방지하기 위해 3계층으로 분류된다.

### ABSOLUTE FORBIDDEN — 어떤 상황에서도 예외 없이 금지

되돌릴 수 없는 데이터 손실, 보안 경계 파괴, 임의 코드 실행을 방지한다.

- `git push --force` / `git push -f` — 다른 사람의 커밋을 영구 삭제할 수 있음
- `git merge` to main/master branch — 리뷰 없이 프로덕션 코드가 변경됨
- `rm -rf` — 복구 불가능한 파일 삭제
- `DROP TABLE` / `TRUNCATE` — 복구 불가능한 데이터 손실
- Commit `.env` or secret files — 시크릿이 git 히스토리에 영구 기록됨
- `chmod 777` — 모든 사용자에게 전체 권한을 부여하여 보안 경계가 무너짐
- `eval` with untrusted input — 임의 코드 실행 취약점 (RCE)
- `curl | sh` or `wget | sh` — 검증 없이 원격 코드를 실행
- Any test that calls real DB or external API — 테스트가 실제 시스템에 부작용을 일으키면 프로덕션 데이터가 손상되거나 외부 서비스에 의도치 않은 요청이 발생한다. mock/stub만 사용하라.

### Runtime Guard (P-008)

에이전트가 지시문을 잊거나 무시하는 것을 구조적으로 방지한다:
- **Git Diff 기반 스코프 검증**: 리뷰/검증 Step 진입 시 `git diff --name-only`로 변경 파일 목록을 추출하고, 해당 파일만 대상으로 작업한다. 계획에 없는 파일이 변경되었으면 경고.
- **Auto-Verification Hook 준수 확인**: 소스코드 수정 후 빌드/린트 실행 여부를 Ground Truth 검증 게이트에서 재확인. 누락 시 즉시 실행.
- **Anti-Hallucination**: 읽지 않은 파일에 대한 의견 제시를 감지하면 즉시 중단하고 Read 실행.

### CONTEXT-SENSITIVE — 대상을 검증한 후 판단

실행 전에 대상이 안전한지(localhost, 테스트 서버, 로컬 DB 등) 확인한다. 판단 근거를 `.claude/memory/audit-log.md`에 기록한다.

- `curl`/`wget` to external endpoints — 대상이 localhost 또는 테스트 서버인지 확인 후 실행. 프로덕션 엔드포인트는 ABSOLUTE FORBIDDEN.
- `mysql`/`psql`/`redis-cli`/`mongosh` — 대상이 로컬 개발용 DB인지 확인 후 실행. 프로덕션/스테이징 DB는 ABSOLUTE FORBIDDEN.
- `ssh`/`scp`/`sftp` — 대상이 로컬 테스트 환경인지 확인 후 실행. 프로덕션 서버는 ABSOLUTE FORBIDDEN.

### AUDIT-REQUIRED — 실행 가능하나 감사 로그에 기록

의도치 않은 부작용을 추적하기 위해 실행 내역을 `.claude/memory/audit-log.md`에 기록한다.

- 특정 파일 삭제 (`rm` 단일 파일) — 삭제 대상과 사유를 기록
- DB 읽기 전용 쿼리 (SELECT) — 쿼리 내용과 대상 DB를 기록
- 환경 변수 변경 — 변경 전후 값을 기록

## Session Management

스크립트: `.claude/workflow/scripts/manage-sessions.sh`
- `list` — 활성 워크트리 목록
- `info <branch>` — 세션 상세 정보
- `delete <branch>` — 세션 삭제

이전 세션 이어가기: list → info → 워크트리로 이동 → `.claude/memory/` 복원

### State Integrity Check (P-004)

세션 복원 시 memory 파일과 실제 상태의 정합성을 검증한다 (상세: simon-bot-sessions/SKILL.md의 resume Step 2 참조):
1. `plan-summary.md`의 Unit 목록 ↔ `unit-*/` 디렉토리 일치
2. `CONTEXT.md` 진행 상태 ↔ 실제 memory 파일 존재 여부
3. `session-meta.json`의 `last_commit_hash` ↔ 실제 git HEAD
4. 불일치 시 `git log --oneline` 기반으로 실제 진행 상태를 재구성 (**Git 이력을 SSoT로 우선**)

## Context Window Management

컨텍스트 윈도우가 자동 압축(compact)되므로, 토큰 예산 걱정으로 작업을 조기에 중단하지 않는다. 압축이 발생해도 `.claude/memory/`에 상태가 저장되어 있으므로 작업을 계속 진행한다.

### 새 세션 시작 프로토콜

새 세션에서 작업을 재개할 때 다음 순서를 따른다:
1. `pwd`로 현재 디렉토리 확인
2. `CONTEXT.md` + `.claude/memory/*.md` 읽기
3. `git log --oneline -10`으로 최근 변경 확인
4. 마지막 완료 Step 이후부터 재개

### 세션 분할 경계

컨텍스트 부족 시 아래 경계에서 세션을 분할한다:

| 경계 | 시점 | 저장 상태 |
|------|------|----------|
| 1 | Phase A 완료 후 | plan-summary, code-design-analysis, expert-plan-concerns, requirements |
| 2 | Integration 완료 후 | integration-result, unit-*/implementation, unit-*/review-findings |
| 3 | Step 18 완료 후 | review-sequence, report |

복원: `.claude/memory/` + `CONTEXT.md` 읽기 → 다음 Step 이어서 실행

## Memory Persistence

Record at: Step 완료 시, agent 전환 시, loop rollback 시, Unit 완료 시.
Always read relevant `.claude/memory/*.md` before starting any step.

## Unresolved Decision Tracking

미해결 결정사항 → `.claude/memory/unresolved-decisions.md`에 기록.
Step 18 report에 "may bite you later" warning 포함. 암묵적 기본값 대신 명시적으로 결정사항을 문서화한다.
