---
name: simon-bot-sandbox
description: "[실험] simon-bot의 Phase 분해 버전 — 동일 19-step 파이프라인을 슬림 오케스트레이터 + workflow-state.json으로 재구성하여 스텝 누락/까먹음을 방지합니다. Use when: simon-bot 대신 사용하여 A/B 테스트. '피처 구현해줘', '새 기능 만들어줘', '코드 작성해줘' 등 코드 변경이 수반되는 작업에 사용하세요. simon-bot과 동일한 품질 파이프라인입니다."
compatibility:
  tools: [Agent, AskUserQuestion, TeamCreate, SendMessage]
  skills: [simplify, git-commit, simon-bot-review, _sandbox-expert-panel]
---

# simon-bot-sandbox

simon-bot과 동일한 19-step 품질 파이프라인의 슬림 오케스트레이터 실험 버전.

차이점: (1) SKILL.md를 체크리스트 수준으로 축소, (2) workflow-state.json으로 결정론적 상태 추적, (3) 전문가 패널을 서브스킬로 분리.

> **Cross-Cutting Protocols**: [orchestrator-protocols.md](references/orchestrator-protocols.md) 참조. Startup 완료 후 1회 읽기.
> **simon-bot References**: 상세 Step 지시는 `~/.claude/skills/simon-bot/references/`의 파일을 직접 읽는다.

## State-Driven Execution

**매 턴(응답) 시작 시 반드시 실행하는 루틴** — 이 규칙은 compaction, 세션 재개, 작업 전환 후 복귀 등 어떤 상황에서도 적용된다:

1. `{SESSION_DIR}/memory/workflow-state.json` 읽기
2. `current_step`에 해당하는 Phase의 reference 로딩
3. 해당 Step 실행
4. **Step 완료 즉시** workflow-state.json 갱신 — 다음 턴에서 이 파일만 읽으면 정확한 위치를 복원할 수 있어야 한다

workflow-state.json이 없으면 Startup부터 시작한다.

```json
{
  "current_phase": "A",
  "current_step": "0",
  "scope": null,
  "completed_steps": [],
  "next_step": "0",
  "blocked": false,
  "blocked_reason": null,
  "last_updated": "2026-03-16T14:00:00+09:00"
}
```

## Startup

1. `.claude/workflow/` 존재 확인. 없으면: `bash ~/.claude/skills/simon-bot/install.sh --project-only`
2. 읽기 (병렬): `.claude/workflow/config.yaml`, `.claude/memory/retrospective.md`(있으면), `.claude/memory/handoff-manifest.json`(있으면)
3. 브랜치명 자동 생성: `[Default] Branch: {name} — 변경하려면 알려주세요.` → `branch-name.md` 저장
4. SESSION_DIR 초기화:
   ```bash
   PROJECT_SLUG=$(git rev-parse --show-toplevel | tr '/' '-')
   SESSION_DIR="${HOME}/.claude/projects/${PROJECT_SLUG}/sessions/${branch_name}"
   mkdir -p "${SESSION_DIR}/memory" "${SESSION_DIR}/reports"
   ```
5. workflow-state.json 초기화 (위 스키마, `current_step: "0"`)
6. Cross-Cutting 프로토콜 로딩: [orchestrator-protocols.md](references/orchestrator-protocols.md) 읽기
7. Pre-flight: `.claude/workflow/scripts/preflight.sh` (있으면)

## Phase A: Planning

> **Reference Loading**: `~/.claude/skills/simon-bot/references/phase-a-planning.md` 읽기

| Step | 이름 | 핵심 행동 | 산출물 |
|------|------|----------|--------|
| 0 | Scope Challenge | architect agent로 범위 판별 (SMALL/STANDARD/LARGE) | scope 결정 |
| 1-A | Project Analysis + Code Design | subagent 코드 스캔 + **Skill(`_sandbox-expert-panel`, `code-design ...`)** 호출 | requirements.md, code-design-analysis.md |
| 1-B | Plan Creation | planner subagent, STICC Framework. Interview Guard: 코드에서 알 수 있는 건 묻지 않음 | plan-summary.md (아래 필수 섹션 포함) |

**plan-summary.md 필수 섹션** — 이 섹션이 누락되면 Phase B의 TDD 품질과 Step 6 Purpose Alignment 정밀도가 저하된다:
- STICC Framework (Situation, Task, Intent, Concerns, Acceptance Criteria)
- **Done-When Checks**: Mechanical (빌드/테스트 명령) + Behavioral (구체적 입출력 검증)
- End State: Files Changed 테이블, Behavior Changes (Before→After), Test Targets
- NOT in scope: 범위 밖 항목 명시
| 2-4 | Plan Review | planner+critic+architect 토론 (max 3 iterations). Over-engineering Check (YAGNI/KISS) | plan 수정 |
| 4-B | Expert Plan Review | **Skill(`_sandbox-expert-panel`, `domain-review ...`)** 호출 | expert-plan-concerns.md |

**Phase A Calibration Checklist** — 7개 항목 자동 검증 후 Phase B 진입.
→ **state 갱신**: `current_phase: "B"`, `next_step: "pre-phase"`

## Phase B-E: Implementation & Verification

> **Reference Loading**: `~/.claude/skills/simon-bot/references/phase-b-implementation.md` 읽기

**Pre-Phase**: Base branch sync → worktree 생성 → CONTEXT.md

| Step | 이름 | 핵심 행동 |
|------|------|----------|
| 5 | TDD Implementation | executor subagent in worktree. RED→GREEN→REFACTOR→VERIFY. Auto-Verification + Stop-and-Fix |
| 6 | Purpose Alignment | 구현이 요구사항과 일치하는지 검증 |
| 7 | Bug/Security/Perf Review | **Skill(`_sandbox-expert-panel`, `implementation-review ...`)** 호출 |
| 8 | Regression Verification | Step 7 수정이 기존 기능 깨뜨리지 않았는지 확인 |

**SMALL path → Step 17로 skip** (Steps 9-16은 STANDARD+ only)

> Steps 9-16 상세: `~/.claude/skills/simon-bot/references/phase-b-verification.md` 읽기

| Step | 이름 (STANDARD+ only) |
|------|----------------------|
| 9 | File/Function Splitting |
| 10 | Integration/Reuse Review |
| 11 | Side Effect Check |
| 12 | Full Change Review |
| 13 | Dead Code Cleanup |
| 14 | Code Quality Assessment |
| 15 | Flow Verification |
| 16 | MEDIUM Issue Resolution |
| 17 | Production Readiness — architect + security-reviewer 최종 검증 |

→ **state 갱신**: `current_phase: "Integration"`, `next_step: "integration"`

## Integration & Review

> **Reference Loading**: `~/.claude/skills/simon-bot/references/integration-and-review.md` 읽기

> **INSTRUCTION (모든 경로 필수)**: Integration → Step 18 → Step 19는 SMALL/STANDARD/LARGE **모든 경로**에서 반드시 실행한다. SMALL path가 skip하는 것은 Step 9-16(Refinement Cycle)뿐이다. Step 18-19를 건너뛰면 인라인 코드 리뷰가 누락되어 PR 품질이 보장되지 않는다. git repo가 아닌 환경에서도 Work Report와 Review Sequence는 작성 가능하며, PR 생성만 불가능하다.

| Step | 이름 | 핵심 행동 |
|------|------|----------|
| Integration | 브랜치 통합 | 커밋, 충돌 해결, build+test 전체 검증 |
| 18-A | Work Report | writer subagent: Before/After 다이어그램, 트레이드오프, 리스크. **필수 — 건너뛰지 않는다** |
| 18-B | Review Sequence | architect subagent: 논리적 변경 단위 그룹핑 + 리뷰 순서. **필수 — 건너뛰지 않는다** |
| 19 | Code Review | `[Handoff] simon-bot-sandbox → simon-bot-review` 스킬 호출. git repo가 아니면 PR 생성은 skip하되 코드 리뷰 내용은 작성 |
| 20 | Self-Improvement | user-feedback-log 종합, project-memory 갱신, retrospective.md 기록. 컨텍스트 부족 시에만 skip 가능 (git 의존성 없음) |

→ **state 갱신**: `current_phase: "Complete"`

## Success Criteria

- [ ] 모든 테스트 RED→GREEN 사이클로 작성됨
- [ ] 전체 테스트 스위트 통과 (0 failures)
- [ ] 빌드 성공 + 타입체크 통과
- [ ] 보안 리뷰 CRITICAL 없음
- [ ] 전문가 우려사항 HIGH 이상 모두 반영됨
- [ ] 코드 리뷰 통과
- [ ] workflow-state.json → `current_phase: "Complete"`
