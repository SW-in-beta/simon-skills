# simon Boost Applied Log

## [2026-03-24] Insight Review — simon-report 미검증 추측 방지
- **I-001**: simon-report 미검증 추측을 사실로 기술하는 문제 → 적용 (SKILL.md Global Rules에 "미검증 추측 금지 ABSOLUTE" 규칙 추가, Step 1에 1-A-ext Cross-service 의존성 추적 단계 추가, Step 4-B에 주장-근거 연결 필수 + writer self-audit 추가, templates/analysis.md 근거 컬럼에 파일:라인 필수 형식 강제)

---

## [2026-03-20] Stale Local Main 브랜치 생성 문제

**출처**: simon-boost-capture 인사이트 (simon 실행 시 git fetch 없이 로컬 main 기반 브랜치 생성)
**인사이트 경로**: `.claude/boost/insights/2026-03-20-0900-branch-from-stale-main.md`

### 적용 (4건)

- **변경 1**: simon/references/phase-b-implementation.md — Pre-Phase에 `[GATE — Remote Sync]` 추가, fetch 필수 + `origin/` 기반 브랜치 생성 강제, worktree 미사용 시 대체 패턴 명시
- **변경 2**: simon/SKILL.md — Startup 브랜치명 자동 생성 항목에 "직접 checkout -b 금지" 경고 추가
- **변경 3**: simon-pm/references/environment-setup.md — 3-C Git Setup에 `git fetch && checkout -b origin/` 필수 패턴 추가
- **변경 4**: simon/scripts/create-branch.sh — 결정론적 브랜치 생성 스크립트 신규 생성 (`set -e`로 fetch 실패 시 자동 중단)

### 기각 (0건)

---

## [2026-03-20] PM->Review PR Draft 상태 불일치 (근본 원인 분석 후 적용)

**출처**: simon-boost-capture 인사이트 + skill-creator 근본 원인 분석
**인사이트 경로**: `.claude/boost/insights/2026-03-19-0904-pm-review-draft-pr-gate.md`
**근본 원인**: (1) forbidden-rules.md 주어에 PM 누락, (2) delivery.md 6-D가 수동적 금지, (3) review Step 1에 기존 PR 처리 경로 부재

### 적용 (3건)

- **변경 1**: forbidden-rules.md — PR 생성 규칙의 주어를 "simon/grind"에서 "simon/grind/pm"으로 확장
- **변경 2**: simon-pm/references/delivery.md — 6-D를 `[GATE — PR 직접 생성 금지]` 패턴으로 변경 + 기존 PR 사전 검증 로직 추가
- **변경 3**: simon-code-review/SKILL.md — Step 1에 `[GATE — 기존 PR 감지]` 삽입 (2번 항목). PR 없음→새 생성, Draft→재사용, Ready→Draft 전환. 번호 재조정 (기존 3~7 → 4~8)

### 기각 (0건)

---

## [AUTO-BOOST] [2026-03-19] Effective Harnesses for Long-Running Agents (Anthropic Engineering)

**출처**: [Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
**리포트 경로**: `.claude/boost/source-summary-effective-harnesses.md`

### 적용 (2건)
- **P-001**: Pre-Phase Base Stability Gate — 적용 (simon references/phase-b-implementation.md: worktree 생성 후 빌드+테스트 실행하여 base 안정성 검증, FAIL 시 구현 진입 차단)
- **P-002**: Done-When Checks JSON 구조화 — 적용 (simon SKILL.md: workflow-state.json에 done_when_checks 배열 추가 + 4개 갱신 규칙, phase-b-verification.md: Step 17에 JSON GATE 추가)

### 보류 (3건)
- **P-003**: Session End Documentation Gate — MEDIUM (보류)
- **P-004**: Session Resume Stability Check — MEDIUM (보류)
- **P-005**: Initializer-Implementer Separation Emphasis — LOW (보류)

---

## [2026-03-19] 5 Agent Skill design patterns every ADK developer should know (GoogleCloudTech)
- **P-001**: Review Rubric 외재화 → **적용** (simon references/review-rubric.md 신설)
- **P-002**: Pipeline Gate 정의 집중 관리 → **적용** (simon references/gate-definitions.md 신설)
- **P-003**: Interview Staged Gating → **적용** (phase-a-planning.md, spec-driven-design.md 수정)
- **P-004**: Generation Style Guide → **적용** (simon references/generation-style-guide.md 신설)
- **P-005**: Pipeline Map → **보류** (추후 적용 검토)
- **P-006**: CLI Scripts Generator → **적용** (error-resilience.md, grind-cross-cutting.md 스크립트 스펙 구체화)
- **P-007**: SKILL.md 슬림화 → **보류** (대규모 구조 변경, 별도 세션)
- **P-008**: Refinement Cycle Fresh Critic → **보류** (추후 적용 검토)

## [2026-03-19] Lessons from Building Claude Code: How We Use Skills (Thariq Shihipar, Anthropic)

**출처**: [X Article](https://x.com/trq212/status/2033949937936085378)

- **P-001**: Gotchas Registry (프로젝트별 실패 패턴 축적) → 적용 (phase-a-planning.md, cross-cutting-protocols.md, integration-and-review.md, sessions, report)
- **P-002**: Description Don't Use When → 적용 (simon, grind, pm, company SKILL.md)
- **P-003**: On-Demand Session Hooks (/careful, /freeze, /scope-lock) → 적용 (simon SKILL.md)
- **P-004**: auto-verify.sh 구현 → 적용 (스킬 문서 반영, 스크립트 구현은 별도 세션)
- **P-005**: Obvious Info 제거 + SKILL.md 경량화 → 적용 (simon SKILL.md 513→507줄)
- **P-006**: Over-engineering 방지에 Why 추가 → 적용 (simon SKILL.md)
- **P-007**: grind 재시도 패턴 유연화 → 적용 (simon-grind SKILL.md)
- **P-008**: PM->Bot 컨텍스트 전달 강화 → 적용 (simon-pm SKILL.md, feature-execution.md)
- **P-009**: PreToolUse Usage Measurement → 적용 (스킬 문서 반영, 스크립트 구현은 별도 세션)
- **P-010**: ship 모드 AskUserQuestion 봉쇄 → 적용 (phase-a-planning.md)
- **P-011**: resume 자동 진행 개선 → 적용 (sessions SKILL.md, session-commands.md)
- **P-012**: Progress Dashboard 경량 출력 → 적용 (simon SKILL.md)
- **P-013**: Inter-Agent Communication Gotchas → 적용 (_shared/preamble.md)
- **P-014**: grind 롤백 후 상태 무결성 검증 → 적용 (grind-cross-cutting.md)

## [2026-03-18] gstack by Garry Tan (https://github.com/garrytan/gstack)

**출처**: [gstack](https://github.com/garrytan/gstack) — YC CEO Garry Tan의 Claude Code 스킬 모음 (20k+ stars, MIT)
**리포트 경로**: `.claude/boost/report-gstack.md`

### 적용 (20건)
- **P-001**: Shared Preamble → 적용 (_shared/preamble.md + 7개 SKILL.md)
- **P-002**: WTF-Likelihood → 적용 (grind-cross-cutting.md)
- **P-003**: AskUserQuestion 표준화 → 적용 (simon/SKILL.md)
- **P-004**: Blame Protocol → 적용 (phase-b-verification.md, grind-phase-b.md)
- **P-005**: forbidden-guard.sh 확장 → 적용 (CONTEXT-SENSITIVE 3규칙)
- **P-006**: Completeness Anti-Patterns → 적용 (phase-b-implementation.md)
- **P-007**: Review Readiness Dashboard → 적용 (simon-code-review/SKILL.md)
- **P-008**: Handoff Manifest Template → 적용 (simon/SKILL.md, integration-and-review.md)
- **P-009**: Progress Pulse 비차단화 → 적용 (grind-cross-cutting.md 2-Tier)
- **P-010**: Pre-Landing Review Checklist → 적용 (review-strategy.md)
- **P-011**: Fix-First Heuristic → 적용 (simon-code-review/SKILL.md)
- **P-012**: Regression Test 의무 생성 → 적용 (phase-b-verification.md)
- **P-013**: 에러 메시지 Next Action Guide → 적용 (error-resilience.md, grind-error-resilience.md)
- **P-014**: Contributor Mode 자동 캡처 → 적용 (simon-boost-capture/SKILL.md)
- **P-017**: Boost 전문가 패널 공유 → 적용 (_shared/expert-panel-boost.md + 2개 SKILL.md)
- **P-018**: Sandbox 폐기 → 적용 (simon-sandbox + _sandbox-expert-panel 삭제)
- **P-019**: Resume 자동 진행 → 적용 (session-commands.md)
- **P-020**: Cross-Session State → 적용 (cross-cutting-protocols.md, simon/SKILL.md)
- **P-021**: Ship 모드 → 적용 (simon/SKILL.md, phase-a-planning.md)
- **P-022**: Eval Persistence → 적용 (eval-history.json)

### 보류 (1건)
- **P-015**: Tiered Skill Testing (quick_validate.py 확장은 별도 세션 필요)

### 불필요 (1건)
- **P-016**: 300줄+ TOC (이미 존재)

### 2차 적용
- **P-023**: simon-healthcheck 새 스킬 생성
- **P-024**: Review Mode Selection (THOROUGH/STANDARD/QUICK)
- **P-025**: Clean Working Tree Check
- **P-026**: Phase Progress Dashboard
- **P-027**: Expert Output Validation Gate
- **P-028**: Documentation Staleness Detection
- **P-029**: allowed-tools frontmatter

---

## [2026-03-17] PR 인라인 리뷰에 테스트 케이스 설명 추가

**출처**: 사용자 직접 피드백 (테스트 코드에 해피케이스/엣지케이스 설명 추가 요청)
**리포트 경로**: `.claude/boost/report-test-case-docs-in-pr.md`

### 적용 (5건)

- **P-001**: TDD REFACTOR 이후 test-case-summary.md 생성 → 적용 (simon references/phase-b-implementation.md)
- **P-002**: Test-Spec Alignment Gate 산출물에 분류 테이블 포맷 추가 → 적용 (simon references/phase-b-implementation.md)
- **P-003**: Self-correction에 테스트 유형 최소 존재 확인 추가 → 적용 (simon references/phase-b-implementation.md)
- **P-004**: review-sequence.md에 테스트 커버리지 요약 항목 추가 → 적용 (simon references/integration-and-review.md)
- **P-005**: 인라인 리뷰 테스트 파일 코멘트 양식 신설 + 예시 업데이트 → 적용 (simon-code-review references/inline-review-format.md)

### 기각 (0건)
### 보류 (0건 — STANDALONE 모드 지원은 추후 필요 시 적용)

---

## [2026-03-16] Claude Prompting Best Practices (Opus 4.6) — 프롬프트 톤 조정 + 인지 품질 강화

**출처**: [Claude Prompting Best Practices](https://platform.claude.com/docs/ko/build-with-claude/prompt-engineering/overview)
**리포트 경로**: `.claude/boost/report-claude-prompting-best-practices.md`

### 적용 (12건 — 전체 승인)

- **P-001**: forbidden-rules.md "ABSOLUTE FORBIDDEN" → "안전한 대안 테이블" 전환 → 적용 (simon references/forbidden-rules.md)
- **P-002**: 부정형 Critical Rules → WHY + 긍정형 재작성 → 적용 (simon references/phase-b-implementation.md, references/error-resilience.md, simon-grind references/grind-error-resilience.md)
- **P-003**: Step Transition Gate에 상태 보전 Instruction 추가 → 적용 (simon SKILL.md)
- **P-004**: Phase A + Error Recovery 진행 펄스 도입 → 적용 (simon references/phase-a-planning.md, references/error-resilience.md)
- **P-005**: PM→bot Phase A 중복 제거 (PM_DISPATCH 모드) → 적용 (simon-pm references/feature-execution.md)
- **P-006**: Interleaved Thinking (도구 결과 후 반성) → 적용 (simon references/phase-b-implementation.md, references/phase-b-verification.md)
- **P-007**: Structured Research Protocol (경쟁 가설 분석) → 적용 (simon references/phase-a-planning.md)
- **P-008**: grind Checkpoint tier 경계 + Progress Detection 연동 → 적용 (simon-grind SKILL.md, references/grind-cross-cutting.md)
- **P-009**: Cross-Cutting Protocols 경량화 후보 마킹 → 적용 (simon SKILL.md)
- **P-010**: Finding 품질 Good/Bad/Scope밖 Few-shot 예시 → 적용 (simon references/phase-a-planning.md)
- **P-011**: PM Phase 3→4 세션 분할 경계 추가 → 적용 (simon-pm SKILL.md, references/environment-setup.md)
- **P-012**: forbidden-guard.sh .env 커밋 + eval 차단 패턴 추가 → 적용 (~/.claude/hooks/forbidden-guard.sh)

### 기각 (0건)

---

## [2026-03-16] PR 리뷰에 영향 분석(Impact Analysis) 기능 추가

**출처**: 사용자 직접 요청 (변경되지 않았지만 영향받을 수 있는 코드에 인라인 리뷰 코멘트 추가)

### 적용 (5건)

- **P-001**: simon-code-review/SKILL.md — Step 2에 "영향 분석 Pass" 섹션 추가 (직접 호출자, 인터페이스 소비자, 공유 상태 독자, 데이터 흐름 하류를 1-depth 탐색)
- **P-002**: simon-code-review/references/inline-review-format.md — "영향 분석 리뷰" 양식 추가 (영향받는 이유, 현재 동작, 잠재적 영향, 필요 조치, 리뷰 포인트 + 예시)
- **P-003**: simon-code-review/SKILL.md — Review Summary Body에 "영향 분석 요약" 섹션 추가 (영향받는 파일 수, 주요 영향 포인트)
- **P-004**: simon-code-review/references/standalone-analysis.md — impact-analyzer agent 추가 (Step 0-B), review-sequence.md 포맷에 영향 분석 항목 추가, Step 0-C 통합 로직 갱신 (2→3 agent)
- **P-005**: simon/references/integration-and-review.md — Step 18-B review-sequence 각 변경 단위에 "영향 분석" 항목 추가

### 기각 (0건)

---

## [2026-03-16] Sprint DoD 및 QA 품질 게이트의 코드 수준 결함 탐지 공백

**출처**: simon-boost-capture 인사이트 (동일 스펙 3회 독립 구현 → 3/3 프로덕션 배포 불가 판정)
**인사이트 경로**: `.claude/boost/insights/2026-03-16-2320-sprint-dod-quality-gaps.md`

### 적용 (6건)

- **변경 1**: simon-company/references/contracts-execution.md — DoD에 7a~7e 코드 안전성 항목 추가 (에러 처리 안전성, 타입 안전성, 리소스 정리, 입력 경계값 검증, 에러 경로 테스트)
- **변경 2**: simon-company/references/quality-gates.md Phase 4 R1 — Self-Review 체크리스트에 [코드 안전성] 5개 항목 추가 (silent fail, any 타입, cleanup, 입력 검증, 에러 경로 테스트)
- **변경 3**: simon-company/references/quality-gates.md Phase 4 R2 — 에러 처리 항목 강화 (에러 코드 구현 확인 + silent fail 검증 + 응답 형식 확인)
- **변경 4**: simon-company/references/quality-gates.md Phase 5 R1 — 코드 패턴 스캔(5-A2) 완료 확인 + 통합 테스트 검증 항목 추가
- **변경 5**: simon-company/references/phase-5-qa.md — 5-A2 Code Pattern Scan 섹션 신규 추가 (grep 기반 자동 스캔 5개 항목: silent fail, any 타입, cleanup 누락, 입력 미검증 API, console.log)
- **변경 6**: simon-company/SKILL.md — Phase 5 핵심 활동에 "Code Pattern Scan" 추가

### 기각 (0건)

---

## [2026-03-16] 리뷰 준비 시 코드베이스 기존 패턴 스캔 단계 추가

**출처**: simon-boost-capture 인사이트 (PR 리뷰 시 프로젝트 내 기존 EnumField 미발견 사례)
**인사이트 경로**: `.claude/boost/insights/2026-03-16-0906-review-codebase-pattern-scan.md`

### 적용 (4건)

- **변경 1**: simon-code-review/SKILL.md — Step 2 Pass 1에 "기존 패턴 스캔" 단계 삽입 (diff 패턴 추출 → Grep/Glob으로 코드베이스 탐색 → 리뷰 포인트 기록)
- **변경 2**: simon-code-review/SKILL.md — STANDALONE 모드 설명에 기존 패턴 스캔이 Step 0-B에 포함됨을 명시
- **변경 3**: simon-code-review/references/standalone-analysis.md — architect/writer agent에 능동적 Grep/Glob 탐색 지시 추가
- **변경 4**: simon-code-review/references/inline-review-format.md — "유사 패턴 비교" 항목을 기존 패턴 스캔 결과 기반으로 변경 + 예시 보강

### 기각 (0건)

---

## [2026-03-13] Phase-End Auto-Retrospective — 실행 중 자동 회고 메커니즘 추가

**출처**: 사용자 직접 요청 (셀프 회고/스킬 수정 기능 요청)

### 적용 (5개 파일)

- **변경 1**: simon/SKILL.md — Cross-Cutting Protocols에 "Phase-End Auto-Retrospective" 섹션 추가
  - Phase 경계(A 완료, Unit 완료, Integration 완료)마다 user-feedback-log.md 스캔 → 패턴 감지 시 boost-capture 자동 트리거
  - Step 20과의 역할 분담 정의 (Phase-end: 개별 패턴, Step 20: 교차 패턴)
- **변경 2**: simon/references/phase-a-planning.md — Calibration Checklist 직후 "Phase A Retrospective Checkpoint" 추가
- **변경 3**: simon/references/phase-b-implementation.md — Self-correction 직후 "Unit Retrospective Checkpoint" 추가
- **변경 4**: simon/references/integration-and-review.md — Integration Stage에 체크포인트 추가 + Step 20-A 역할 조정 (중복 방지, 교차 패턴 집중)
- **변경 5**: simon-grind/SKILL.md — Cross-Cutting에 프로토콜 상속 섹션 추가

### 기각 (0개)

---

## [2026-03-13] CLI > MCP: 컨텍스트 최적화와 조립하는 운영 에이전트

**출처**: 인라인 아티클 (CLI > MCP: 컨텍스트 최적화와 조립하는 운영 에이전트)
**리포트 경로**: `.claude/boost/report-cli-over-mcp.md`

### 적용 (13개 — 전체 승인)

- **P-001**: Auto-Verification Hook "선택사항" → "권장사항" 승격 (CRITICAL) → 적용
  - `simon/SKILL.md` — Hook 기반 강화를 "권장사항"으로 승격, auto-verify.sh 동작 흐름 + settings.json 등록 예시 추가

- **P-002**: 결정론적 게이트 검증 원칙 (HIGH) → 적용
  - `simon/SKILL.md` — Cross-Cutting에 Deterministic Gate Principle 섹션 추가
  - `simon/references/phase-a-planning.md` — Calibration Checklist에 CLI 스크립트 우선 원칙 추가

- **P-003**: Subagent 컨텍스트 사전 필터링 프로토콜 (HIGH) → 적용
  - `simon/references/phase-b-verification.md` — Context Preparation 섹션 추가
  - `simon/references/phase-b-implementation.md` — executor 위임 시 Context Preparation 원칙 추가

- **P-004**: 에러 분류를 CLI 스크립트로 결정론화 (HIGH) → 적용
  - `simon/references/error-resilience.md` — CLI 우선 분류 원칙 추가
  - `simon-grind/references/grind-error-resilience.md` — CLI 기반 자동 분류 원칙 추가

- **P-005**: Retry Budget + Progress Detection CLI 도구 (HIGH) → 적용
  - `simon-grind/references/grind-cross-cutting.md` — Progress Detection CLI 원칙, Total Retry Budget CLI 원칙 추가

- **P-006**: Composable CLI Script Toolkit (HIGH) → 적용
  - `simon/SKILL.md` — Cross-Cutting에 Composable CLI Script Toolkit 섹션 추가

- **P-007**: plan-summary.md Unit 파싱 마커 (HIGH) → 적용
  - `simon/references/phase-a-planning.md` — Unit 파싱 마커 규약 추가

- **P-008**: --help를 Docs-First Protocol에 통합 (MEDIUM) → 적용
  - `simon/references/docs-first-protocol.md` — 도구 우선순위 0번에 프로젝트 내 CLI/스크립트 추가

- **P-009**: PM Bot Spawn Lean Prompt 원칙 (HIGH) → 적용
  - `simon-pm/references/feature-execution.md` — deep-executor 프롬프트 필수 포함 항목을 Lean Prompt 방식으로 변경

- **P-010**: Findings/Verdict 구조화 병행 저장 JSONL (MEDIUM) → 적용
  - `simon/references/phase-b-verification.md` — Findings JSONL 병행 저장 가이드 추가
  - `simon-grind/references/grind-cross-cutting.md` — failure-log.jsonl, decision-journal.jsonl 병행 저장 가이드 추가

- **P-011**: simon-sessions reference 분리 + Why 보강 (HIGH) → 적용
  - `simon-sessions/SKILL.md` — list/resume 세부 로직 분리 (305→144줄), Why 설명 3개 추가
  - `simon-sessions/references/session-commands.md` — 신규 생성 (190줄)

- **P-012**: simon-report Step 3 도메인 팀 reference 분리 (MEDIUM) → 적용
  - `simon-report/SKILL.md` — Step 3 도메인 팀 분리 (315→236줄)
  - `simon-report/references/domain-teams.md` — 신규 생성 (95줄)

- **P-013**: simon-company Cross-Cutting Protocols reference 분리 (MEDIUM) → 적용
  - `simon-company/SKILL.md` — Cross-Cutting Protocols 분리 (472→326줄)
  - `simon-company/references/cross-cutting-protocols.md` — 신규 생성 (152줄)

### 기각 (0개)

---

## [2026-03-13] Insight Review (Mixed Status Test)

**처리**: 4건
- 적용: 0건
- 보류: 4건 (전부 deferred 처리)
- 기각: 0건

### 보류 목록
- **I-001**: Step 5 테스트 파일 탐색 성능 이슈 → 보류 (pending → deferred)
- **I-002**: Retry Budget 경고 시점이 너무 늦다 → 보류 (pending → deferred)
- **I-003**: Phase 1 인터뷰가 너무 길다 → 보류 (pending → deferred)
- **I-004**: simon-report에도 Blind-First 패턴 적용 제안 → 보류 (deferred 유지)

### 필터링 결과
- 포함: pending 3건 + deferred 1건 = 4건
- 제외: applied 1건 (2026-03-08-1200-sessions-auto-detect.md)

---

## [2026-03-13] Docs-First Protocol — 외부 지식 참조 시 공식 문서 우선 조회

**출처**: simon-boost-capture 인사이트 (카카오 디벨로퍼스·CoolSMS 설정 안내 시 학습 데이터 의존 문제)
**인사이트 경로**: `.claude/boost/insights/2026-03-12-0130-external-service-docs-first.md`

### 적용 (6개)

- **변경 1**: SKILL.md — GTV 뒤에 Docs-First Protocol을 Cross-Cutting Protocol로 신설 (적용 기준표, 도구 우선순위, 조회 불가 시 처리, 전 Phase 적용 시점)
- **변경 2**: qa-deployment-ops.md — Phase B 실행 시 Docs-First Protocol 적용 규칙 추가 (서비스 존속 확인 포함)
- **변경 3**: operational-protocols.md — `[MANUAL]` 유형 태그에 Docs-First Protocol 적용 언급
- **변경 4**: quality-gates.md Phase 2 R1 — "기술 스택 선택 시 공식 문서로 기능·제약·호환성을 확인했는가?" 체크 항목 추가
- **변경 5**: quality-gates.md Phase 4 R1 — "처음 사용하는 API/라이브러리/프레임워크 설정에 대해 공식 문서를 조회했는가?" 체크 항목 추가
- **변경 6**: quality-gates.md Phase 6 R1 — "외부 서비스 설정 안내 시 공식 문서를 조회했는가?" 체크 항목 추가

### 기각 (0개)

### 비고
- 원본 인사이트는 "외부 서비스 UI 안내"에 한정했으나, 사용자 요청으로 라이브러리·DB·프레임워크 등 모든 외부 도구 사용으로 확장
- 사용자 요청으로 검증 단계(quality-gates) 체크 항목도 추가 (원본 인사이트에 없던 항목)
### 후속: simon / simon-grind 전파 (5건)

- **전파 1**: simon/SKILL.md — Cross-Cutting Protocols에 Docs-First Protocol 섹션 추가 (적용 기준, 도구 우선순위, 조회 불가 시 처리)
- **전파 2**: simon/references/phase-b-implementation.md — Step 5 구현 단계에 Docs-First 지침 1줄 추가
- **전파 3**: simon/references/phase-a-planning.md — Step 1-A의 Context7 참조에 Docs-First 원칙 보강
- **전파 4**: simon-grind/SKILL.md — Cross-Cutting에 Docs-First Protocol 섹션 추가 (simon 상속 + 재시도 맥락 규칙)
- **전파 5**: simon-grind/references/grind-cross-cutting.md — 목차에 Docs-First 추가 + 파일 끝에 grind 맥락 규칙 섹션

---

## [2026-03-12] You can't trust agents that run while you sleep (HN)

**출처**: [You can't trust agents that run while you sleep](https://news.ycombinator.com/item?id=47327559)
**리포트 경로**: `.claude/boost/report-verify-agents-sleep.md`

### 적용 (10개)

- **P-001**: Pre-flight Check — Phase A 전 bash 환경 검증 → 적용
  - `simon/SKILL.md` — Startup에 Step 5 preflight.sh 추가

- **P-002**: Behavioral AC — Done-When Checks에 행동적 수용 기준 추가 → 적용
  - `simon/references/phase-a-planning.md` — Done-When Checks를 2계층(Mechanical + Behavioral)으로 확장, Calibration Checklist 항목 9 추가

- **P-003**: 검증 프롬프트 구조화 — AC별 PASS/FAIL verdict 테이블 → 적용
  - `simon/references/phase-b-verification.md` — Step 6에 AC별 Verdict 테이블 섹션 추가, Step 17 프롬프트에 Verdict 형식 강제

- **P-004**: Test-Spec Alignment Gate — TDD RED 직후 독립 검증 → 적용
  - `simon/references/phase-b-implementation.md` — Step 5 TDD Cycle 직후 Test-Spec Alignment Gate 섹션 추가

- **P-005**: Spec Validation Step — AC를 사용자 시나리오로 번역 → 적용
  - `simon/references/phase-a-planning.md` — Step 1-B 후 Spec Validation 섹션 추가

- **P-006**: phase-b-implementation.md 구현/검증 분할 → 적용
  - `simon/references/phase-b-implementation.md` — Step 6~17 제거 (398줄 → 229줄)
  - `simon/references/phase-b-verification.md` — 신규 생성 (244줄, Step 6~17 이관)
  - `simon/SKILL.md` — Reference Loading Policy에 phase-b-verification.md 추가

- **P-007**: NEEDS-HUMAN-REVIEW — 이진 판정에 제3 경로 추가 → 적용
  - `simon/references/phase-b-verification.md` — Verdict 경로에 NEEDS-HUMAN-REVIEW 추가, 남용 방지 20% 규칙

- **P-008**: Playwright 브라우저 검증 — 프론트엔드 선택적 확장 → 적용
  - `simon/references/phase-b-verification.md` — 6-C: Playwright 브라우저 검증 섹션 추가

- **P-009**: Skill Craft 즉시 수정 → 부분 적용 (2/4건)
  - `simon-grind/SKILL.md` — frontmatter에 tools: [Agent, AskUserQuestion] 추가 (P-009a)
  - `simon/references/context-separation.md` — Step × 원칙 적용 매트릭스 추가 (P-009c)
  - P-009b: simon-pm의 simon-report 의존성 — 유효 확인, 유지 (수정 불필요)
  - P-009d: grind-cross-cutting.md TOC — 이미 존재, 스킵

- **P-010**: Skill Handoff Notification + 2-tier 보고 → 적용
  - `simon/SKILL.md` — Cross-Cutting Protocols에 Handoff Notification 추가
  - `simon/references/phase-b-verification.md` — 7-C: Findings 보고 (2-tier) 섹션 추가

### 기각 (0개)

---

## [2026-03-11] Compact 시 맥락 유실 방지를 위한 체크리스트 메커니즘 (직접 인사이트)

**출처**: 사용자 직접 입력 (cheer93 프로젝트 배포 경험에서 도출한 인사이트)
**리포트 경로**: `.claude/boost/report-compact-checklist.md`

### 적용 (7개)

- **P-001**: state.json에 체크리스트 참조 + substep 추적 필드 추가 → 적용
  - `simon-company/references/operational-protocols.md` — Checklist Protocol 섹션 신규 추가 (SSoT 역할 분리, state.json 확장 필드)
  - `simon-company/SKILL.md` — state.json 스키마에 `phase_status`, `current_substep`, `active_checklists` 필드 추가

- **P-002**: simon-company에 배포 체크리스트 자동 생성 단계(6-F) 추가 → 적용 (Phase 6-E 확장)
  - `simon-company/references/qa-deployment-ops.md` — 6-F: Deployment Checklist Generation 섹션 추가
  - `simon-company/SKILL.md` — Phase 6 핵심 활동에 Deployment Checklist Generation 추가

- **P-003**: simon-sessions resume flow에 체크리스트 인식 추가 → 적용
  - `simon-sessions/SKILL.md` — list flow에 체크리스트 감지, 대시보드에 Deployment 줄, resume에 체크리스트 읽기, 스킬 자동 판별에 배포 감지 추가

- **P-004**: 체크리스트 커서를 첫 번째 미완료 항목으로 자동 추론 → 적용
  - `simon-company/references/operational-protocols.md` — 커서 규약 (첫 번째 `[ ]` = 현재 작업) 명시

- **P-005**: 체크리스트 항목에 유형 태그(AUTO/MANUAL/GUIDED) 추가 → 적용
  - `simon-company/references/operational-protocols.md` — 유형 태그 정의 + 예시
  - `simon-company/references/qa-deployment-ops.md` — 6-F 템플릿에 유형 태그 포함

- **P-006**: 체크리스트 마크다운 형식 표준화 → 적용
  - `simon-company/references/operational-protocols.md` — 파일 위치, 마크다운 형식, 갱신 시점 규약 정의

- **P-007**: 체크리스트 적용 범위 가이드라인 (simon은 제외) → 적용
  - `simon-company/references/operational-protocols.md` — 적용 범위 4조건 + 제외 기준 명시

### 기각 (0개)

### 검증 시 추가 수정
- `simon-company/references/qa-deployment-ops.md` — TOC에 `6-F: Deployment Checklist Generation` 항목 누락 → 추가

---

## [2026-03-10] Test Time Compute + Uncorrelated Context Windows (직접 인사이트)

**출처**: 사용자 직접 입력 (텍스트 인사이트)
**리포트 경로**: `.claude/boost/report-test-time-compute-uncorrelated-contexts.md`

### 적용 (10개)

- **P-001**: Cognitive Independence Cross-Cutting Protocol + context-separation.md 신규 생성 → 적용
  - `simon/SKILL.md` — Cross-Cutting Protocols에 Cognitive Independence 포인터 추가
  - `simon/references/context-separation.md` — 신규 생성 (4원칙: Blind-First, Adversarial Default, Fresh Subagent, What-not-Why Handoff + 비용 가이드)

- **P-002**: Grind Escalation Ladder에 Fresh Context 도입 → 적용
  - `simon-grind/references/grind-error-resilience.md` — Escalation Ladder에 fresh context 정책 추가 (Attempt 4+ fresh executor, 7+ fresh architect)
  - `simon-grind/references/grind-phase-b.md` — Step 5, 6에 fresh executor/architect spawn 명시
  - `simon-grind/references/grind-cross-cutting.md` — Fresh Context Handoff Protocol 섹션 추가

- **P-003**: Verification Layer Blind-First Protocol → 적용
  - `simon/references/phase-b-implementation.md` — Verification Layer를 Blind-First 2-phase로 변경

- **P-004**: Step 7 Blind-First 2-Phase 리뷰 → 적용
  - `simon/references/phase-b-implementation.md` — Shared Tasks를 Blind Review → Cross-Check 구조로 변경

- **P-005**: Step 6 Purpose Alignment → Fresh Context → 적용
  - `simon/references/phase-b-implementation.md` — Step 6을 fresh alignment-checker subagent로 전환

- **P-006**: Step 17 Production Readiness → Fresh Context Audit → 적용
  - `simon/references/phase-b-implementation.md` — Step 17을 fresh production-readiness-auditor로 전환

- **P-007**: simon-code-review CONNECTED 모드 Blind-First 2-Pass → 적용
  - `simon-code-review/SKILL.md` — Step 2에 Blind-First 2-Pass 도입
  - `simon/references/integration-and-review.md` — Step 19에 Blind-First 언급 추가

- **P-008**: Subagent 사용 기준에 "독립 검증" 추가 → 적용
  - `simon/SKILL.md` — Subagent 기준에 4번째 항목 추가

- **P-009**: Devil's Advocate (False Negative 탐지) 에이전트 → 적용
  - `simon/references/phase-b-implementation.md` — Step 7 이후에 Devil's Advocate 섹션 추가

- **P-010**: expert-plan-concerns Fact-checking 검증 → 적용
  - `simon/references/phase-a-planning.md` — Step 4-B 이후에 Fact-checking 절차 추가

### 기각 (0개)

---

## [2026-03-10] Prompting best practices (Anthropic Docs — Prompt Engineering Overview)

**출처**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
**리포트 경로**: `.claude/boost/report-prompt-engineering-overview.md`

### 적용 (3개 — 시뮬레이션)
- **P-001**: 에이전트 역할 정의에 XML 태그 구조화 패턴 도입 → 적용 (simon/references/agent-teams.md, simon/SKILL.md)
- **P-002**: Phase B-E 각 Step 완료 시 명시적 Self-check 지시 추가 → 적용 (simon/references/phase-b-implementation.md)
- **P-003**: 과다 트리거 방지를 위한 스킬 description 완화 → 적용 (simon/SKILL.md frontmatter)
- **비고**: 테스트 실행으로 실제 파일 미수정. 시뮬레이션 결과는 `simon-boost-workspace/iteration-1/full-flow-prompt-engineering/with_skill/outputs/simulated-edits.md`에 기록.

---

## [2026-03-10] Bringing Code Review to Claude Code (Anthropic)

**출처**: https://claude.com/blog/code-review
**리포트 경로**: `.claude/boost/report-code-review.md`

### 적용 (10개)

- **P-001**: Interaction Boundary Analysis — "diff only" 스코프를 caller/callee 1-depth로 확장 + high_impact_paths config
  - `simon/references/phase-b-implementation.md` — Step 7에 Interaction Boundary Analysis 추가
  - `simon/references/phase-a-planning.md` — Step 0에 Impact-Aware Path Selection 추가

- **P-002**: Subtle Bug Detection Heuristics — 8패턴 (공통5 + Safety1 + Data/Ops2)
  - `simon/references/expert-output-schema.md` — Subtle Bug Detection Heuristics 섹션 추가

- **P-003**: Verification Layer — 전문가 findings의 독립 검증 레이어 도입
  - `simon/references/phase-b-implementation.md` — Step 7에 Verification Layer 추가
  - `simon/references/expert-output-schema.md` — VERIFICATION_STATUS 필드 추가

- **P-004**: Review Summary + Payload Body — 종합 개요 코멘트 생성
  - `simon-code-review/SKILL.md` — Review Summary Body 섹션 추가

- **P-006**: Analysis Process (OBSERVE-TRACE-HYPOTHESIZE-VERIFY) — 전문가 에이전트 추론 과정 구조화
  - `simon/references/expert-output-schema.md` — Analysis Process 섹션 추가

- **P-007**: Severity Calibration Few-shot Examples — 경계 사례 판단 기준 구체화
  - `simon/references/expert-output-schema.md` — Severity Boundary Examples 추가

- **P-008**: Finding Acceptance Tracker — 리뷰 제안 수용률 추적 피드백 루프
  - `simon/references/expert-output-schema.md` — ACCEPTANCE_STATUS/REASON 필드 추가
  - `simon/references/phase-b-implementation.md` — Finding Acceptance Tracking 섹션 추가
  - `simon/SKILL.md` — Step 17에 수용률 산출, Step 20에 수용률 기반 개선 추가

- **P-009**: Findings Pipeline Integrity — Step 7 → Step 18 → Step 19 정보 손실 방지
  - `simon/references/phase-b-implementation.md` — Findings Pipeline Integrity 추가
  - `simon/references/integration-and-review.md` — Step 18-B에 Findings Pipeline Integration 추가

- **P-010**: 300줄 초과 Reference 파일 TOC 일괄 추가 (8개 파일)
  - `simon/references/phase-a-planning.md` — 목차 추가
  - `simon/references/integration-and-review.md` — 목차 추가
  - `simon-company/references/contracts-execution.md` — 목차 추가
  - `simon-company/references/planning-design.md` — 목차 추가
  - `simon-company/references/qa-deployment-ops.md` — 목차 추가
  - `simon-company/references/quality-gates.md` — 목차 추가

- **P-011**: simon-company Phase 4 세션 분할 경계 추가
  - `simon-company/SKILL.md` — Context Window Management에 Phase 4 세션 분할 추가

### 기각 (2개)
- **P-005**: Adaptive Review Depth — 기각 (사용자 판단)
- **P-012**: Description 경계 강화 — 기각 (사용자가 모든 스킬을 명시적 호출로 사용)

---

## [2026-03-09] agent-browser Skills System (Vercel Labs)

**출처**: https://agent-browser.dev/skills
**리포트 경로**: `.claude/boost/report-agent-browser-skills.md`

### 적용 (10개)

- **P-001**: Zero-Config Start — Startup 질문을 Sensible Defaults로 대체
  - `simon/SKILL.md` — Startup 3단계 브랜치명 자동 생성으로 전환
  - `simon-pm/SKILL.md` — Phase 0 단일 통합 확인으로 압축
  - `simon-report/SKILL.md` — Step 0 AI-First Draft 전환
  - `simon-company/SKILL.md` — Phase 0 단일 통합 확인으로 압축

- **P-004**: 핵심 판단 지점에 Few-shot 예시 추가
  - `simon/SKILL.md` — Decision Journal 예시 4개로 확대
  - `simon-grind/references/grind-cross-cutting.md` — Progress Detection 비교 예시 3개 추가

- **P-005**: Agent Team 토론 종료 프로토콜 명시
  - `simon/references/agent-teams.md` — 종료 시나리오별 행동 테이블 추가
  - `simon/SKILL.md` — Agent Teams 섹션에 종료 프로토콜 참조 추가

- **P-006**: 질문 vs 진행 판단 기준표 추가
  - `simon/references/phase-a-planning.md` — Interview Guard에 판단 기준표 추가
  - `simon-pm/references/spec-driven-design.md` — Interview Guard에 판단 기준표 추가

- **P-007**: Reproducibility Gate — 이슈 검증 전 재현성 확인
  - `simon/references/phase-b-implementation.md` — Step 7에 Reproducibility Gate 추가

- **P-008**: Findings 품질 원칙 — "깊이 > 수량" 명시
  - `simon/references/phase-a-planning.md` — Step 4-B 전문가 prompt에 품질 원칙 추가
  - `simon/references/phase-b-implementation.md` — Step 7 전문가 prompt에 품질 원칙 추가
  - `simon-report/SKILL.md` — Step 3에 품질 원칙 추가

- **P-009**: Handoff Manifest — 스킬 전환 시 구조화된 컨텍스트 전달
  - `simon/SKILL.md` — Startup에 Handoff Manifest 감지 추가
  - `simon-pm/references/feature-execution.md` — Bot 전환 시 Handoff Manifest 프로토콜 추가
  - `simon-sessions/SKILL.md` — resume 시 Handoff Manifest 처리 추가

- **P-010**: Inline Issue Capture — 구현 중 이슈 즉시 기록
  - `simon/references/phase-b-implementation.md` — Step 5에 Inline Issue Capture 프로토콜 추가
  - `simon/SKILL.md` — Step 5 설명에 Inline Issue Capture 언급

- **P-011**: Expert Agent Capability Boundary — 도구 사용 범위 명시
  - `simon/references/phase-b-implementation.md` — Step 7에 에이전트 역할별 도구 범위 추가
  - `simon-report/SKILL.md` — Step 3과 Global Rules에 도구 범위 추가

- **P-012**: 완료 시 정량적 Completion Summary
  - `simon/SKILL.md` — Step 19-E에 고정 형식 Completion Summary 추가
  - `simon-pm/SKILL.md` — Phase 6-C에 Completion Summary 추가
  - `simon-company/SKILL.md` — Phase 7-D에 Completion Summary 추가

### 기각 (2개)
- **P-002**: 불필요한 확인 지점 제거 — 기각 (사용자 미선택)
- **P-003**: Trigger Keyword 포괄적 열거 — 기각 (사용자 미선택)

---

## [2026-03-07] Run Long-Horizon Tasks with Codex (OpenAI)

**출처**: https://developers.openai.com/blog/run-long-horizon-tasks-with-codex/
**리포트 경로**: `.claude/boost/report-codex-long-horizon.md`

### 적용 (CRITICAL + HIGH: P-001~P-007)

- **P-001**: Decision Journal + Anti-Oscillation Rule
  - `simon/SKILL.md` — Decision Trail → Decision Journal 확장, Anti-Oscillation Rule 추가
  - `simon-grind/references/grind-cross-cutting.md` — Strategy Pivot에 Anti-Oscillation Check 추가

- **P-002**: Stop-and-Fix Gate
  - `simon/SKILL.md` — Cross-Cutting Protocol에 Stop-and-Fix Gate 섹션 추가
  - `simon/references/phase-b-implementation.md` — Auto-Verification Hook 실패 처리를 Stop-and-Fix Gate로 변경

- **P-003**: CONTEXT.md Live Audit Trail + Session Resume 강화
  - `simon/references/phase-b-implementation.md` — CONTEXT.md에 현재 상태/실행 로그/알려진 이슈 추가; intra-step 갱신 규칙 추가
  - `simon-sessions/SKILL.md` — Resume Dashboard에 Session Story 추가

- **P-004**: Unit Runbook 자동 생성
  - `simon/references/phase-b-implementation.md` — Pre-Phase에 Unit Runbook 생성 + 템플릿

- **P-005**: Done-When Checks
  - `simon/references/phase-a-planning.md` — Acceptance Criteria에 Done-When Checks 추가 (3→4 하위섹션); Calibration Checklist 항목 #8

- **P-006**: Step Transition Uniform Gate
  - `simon/references/phase-b-implementation.md` — Critical Rules에 Step Transition Gate 추가

- **P-007**: Plan Immutability + Spec Freeze
  - `simon/references/phase-b-implementation.md` — Critical Rules에 Plan Immutability 추가
  - `simon-pm/SKILL.md` — Phase 1에 1-E: Spec Freeze 단계 추가

### 보류 (MEDIUM: P-008~P-010)
- **P-008**: Intra-Step Progress Checkpoint — 보류
- **P-009**: Periodic Health Check — 보류
- **P-010**: Step 18 병렬 최적화 — 보류

---

## [2026-03-06] Claude Code 세계 1위 개발자의 AI 코딩 워크플로우
- **P-001**: ARC-AGI 가설-검증 사이클 → 보류
- **P-002**: Agent 역할 Do/Don't 지시 → 보류
- **P-003**: Step 0 요청 명확성 검증 → 보류
- **P-004**: Critic Adversarial 롤플레이 → 보류
- **P-005**: 자동 피드백 루프 강화 → 보류
- **P-006**: Phase A Fast Start → 보류
- **P-007**: AskUserQuestion 배칭 + 신뢰 모드 → 보류
- **P-008**: TDD RED 바이브 코딩 방지 → 보류
- **P-009**: Agent Team Structured Message → 보류
- **P-010**: failure-log 가설/결과 + 커밋 실패 접근법 → 보류

**리포트 경로**: `.claude/boost/report-claude-code-top-developer.md`

## [2026-03-06] Building Effective Agents + Claude Code SDK + Prompt Engineering Guide (통합 적용)

**출처:**
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Claude Agent SDK for Python](https://github.com/anthropics/claude-code-sdk-python)
- [Prompting best practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/claude-prompting-best-practices)

### simon (4 files) → 적용
- WHY 맥락 추가 (Global Forbidden Rules, TDD, 핵심 규칙)
- 강압적 언어 톤다운 (safety-critical 유지)
- Cross-Cutting Protocols: Decision Trail, 병렬 도구 호출, Subagent 기준, Over-engineering 방지
- Forbidden Rules 3계층 (ABSOLUTE / CONTEXT-SENSITIVE / AUDIT-REQUIRED)
- Context Window Management 강화
- Plan Review 품질 기반 조기 종료 (4축 평가)
- Few-shot 예시 (Files Changed 테이블)
- Phase B 조건부 라우팅 (Quick Triage)
- Ground Truth 검증 게이트
- Self-correction, 환각 방지, Anti-hardcoding
- 에러 분류 트리 확장 (2→3분류, 11개 하위 유형)

### simon-grind (4 files) → 적용
- Progress Detection (2회 연속 정체 → 즉시 전략 전환)
- Total Retry Budget (기본 50, 70% 경고)
- 에러 분류 세분화 (트리 구조)
- Anti-hardcoding 원칙
- WHY 맥락 + 톤다운

### simon-pm (2 files) → 적용
- Dynamic Re-planning Gate (Phase 4)
- Over-engineering 방지 (Scope Guard)
- Decision Trail, Subagent 기준
- WHY 맥락 + 톤다운

### simon-report (1 file) → 적용
- CRITICAL Severity Voting 검증
- Progressive Disclosure (중간 보고)
- 환각 방지, WHY 맥락 + 톤다운

### simon-sessions (1 file) → 적용
- Context Dashboard (표준화된 재개 화면)
- 세션 메타데이터 JSON (session-meta.json)
- Resume 프로토콜 강화 (git log/status)

## [2026-03-06] 클로드 코드 사용량 세계 1위 개발자의 AI 코딩 워크플로우 (박진형)
**출처**: https://yozm.wishket.com/magazine/detail/3630/
**리포트 경로**: `.claude/boost/report-claude-code-world-1-workflow.md`

### simon (SKILL.md + 3 references) → 적용
- **P-001**: Auto-Verification Hook — 소스코드 수정 후 즉시 빌드/린트, /simplify 마일스톤 검토, Hook 기반 강화 가이드
- **P-002**: SMALL Fast Track — Phase A 압축 실행 (구조 스캔만, AI-First Draft, 단일 critic)
- **P-003**: Agent Scope Anti-Goals — 전문가 에이전트에 범위 밖 의견 방지 지시문
- **P-004**: State Integrity Check — 세션 복원 시 memory↔git 정합성 검증
- **P-005**: X-Y Problem Detection + AI-First Draft Protocol — 근본 목적 확인 + AI 초안 교정 방식
- **P-006**: Refinement Cycle — Steps 9-16을 ARC-AGI 반복 루프로 통합 (Scan→Fix→Verify→Check, max 3회)
- **P-007**: Working Example Spot-check — Step 5e에 TDD 후 실제 동작 확인 추가
- **P-008**: Runtime Guard — git diff 기반 스코프 검증, Anti-Hallucination 감지

### simon-grind (1 reference) → 적용
- **P-009**: Problem Redefinition Check + Model-Level Escalation + Time Guard + Pivot Divergence Check
- **P-010**: Progress Pulse 구조화된 피드백 옵션 (계속/피드백/전략 변경/중단/예산 추가)

### simon-pm (SKILL.md) → 적용
- **P-005**: AI-First Draft Protocol in Phase 1-A Vision Interview
- **P-010**: Progress Bar + Bot Switch Notification in Phase 4

### simon-sessions (SKILL.md) → 이전 batch에서 적용
- **P-004**: State Integrity Check in resume Step 2

### 기각
- **P-011**: Real Git Hooks for Auto-Verify — MEDIUM, 선택사항으로만 안내
- **P-012**: Cross-Skill Memory Sharing Protocol — MEDIUM, 현재 상호 참조로 충분

## [2026-03-06] Self-Audit (외부 자료 없이 5명 전문가 패널 자기 감사)
**리포트 경로**: `/Users/simon.lee/.claude/plans/nested-watching-marble.md`

### Phase 1: CRITICAL (적용)
- **P-001**: PM deep-executor 프롬프트에 Cross-Cutting Protocols 누락 → 적용 (simon-pm: feature-execution.md, SKILL.md)
- **P-002**: grind Phase A 과도한 사용자 인터뷰 → 적용 (simon-grind: SKILL.md, grind-phase-a.md)

### Phase 2: HIGH — 안전/품질 (적용)
- **P-003**: Agent Teams Fallback 전략 비대칭 → 적용 (신규: agent-teams-fallback.md, 수정: grind-cross-cutting.md, report/SKILL.md)
- **P-004**: Expert Findings Structured Output Schema 부재 → 적용 (신규: expert-output-schema.md, 수정: phase-a-planning.md, phase-b-implementation.md)
- **P-005**: config.yaml expert_panel Schema Drift → 적용 (config.yaml에 expert_panel 섹션 추가)
- **P-013**: 스킬 간 Forbidden Rules 불일치 → 적용 (신규: forbidden-rules.md, 수정: simon-pm/SKILL.md, report/SKILL.md)

### Phase 3: HIGH — 워크플로/DX (적용)
- **P-006**: Sequential Team Orchestration (Team Handoff Protocol) → 적용 (agent-teams.md)
- **P-007**: Phase B-E 자동 실행 중 진행 Pulse 의무화 → 적용 (phase-b-implementation.md Critical Rules)
- **P-008**: 스킬 간 전환 프로토콜 → 적용 (error-resilience.md에 grind 전환 옵션, report/SKILL.md에 다음 행동 제안)
- **P-009**: 세션 복원 시 Step-level 진행 추적 → 적용 (phase-b-implementation.md CONTEXT.md 체크리스트, sessions/SKILL.md 대시보드+스킬 판별)
- **P-010**: Step 4-B와 Step 7 간 전문가 컨텍스트 전달 (trigger_condition) → 적용 (phase-a-planning.md, phase-b-implementation.md)
- **P-011**: simon-report 지식 기반 축적 → 적용 (report/SKILL.md Step 1-0, Step 4-D)

### Phase 4: MEDIUM (보류)
- **P-012**: Chain-of-Thought 유도 + 구조화된 토론 — 보류
- **P-014**: cache/caching expert 중복 정리 — 보류
- **P-015**: PM Phase 5 Refinement Cycle — 보류
- **P-016**: 컨텍스트 윈도우 핵심 맥락 고정 — 보류
- **P-017**: 통합 스킬 라우터 — 보류
- **P-018**: 에러 에스컬레이션 메뉴 표준화 — 보류
- **P-019**: boost + Step 20 + retro 자기개선 루프 통합 — 보류

## [2026-03-06] Grep Is Dead: QMD + /recall Memory System (@artemxtech)
**출처**: https://x.com/artemxtech/status/2028330693659332615
**리포트 경로**: `.claude/boost/report-qmd-recall-memory.md`

### simon (2 references) → P-005만 적용
- **P-005**: Multi-Strategy Search Guidance — 적용 (phase-a-planning.md Step 1-A, phase-b-implementation.md Step 5)
  - Step 1-A: Search Strategy for Code Exploration 섹션 추가 (Structural scan → Multi-term → Pattern-based → Reference chain → 재시도 의무)
  - Step 5: 기존 구현 참조 의무 섹션 추가 (유사 구현 2-3개 탐색 → 패턴 기록 → 패턴 따르기)

### 보류 (나머지 7개)
- **P-001**: Cross-Session Decision Trail + Contextual Recall — CRITICAL, 보류
- **P-002**: Session Resume Natural Language Discovery + Next Action — HIGH, 보류
- **P-003**: session-meta.json 자동 초기화 — HIGH, 보류
- **P-004**: Context Completeness Assessment + Tiered Loading — HIGH, 보류
- **P-006**: Purpose-Annotated Context Loading + Active Retrospective — MEDIUM, 보류
- **P-007**: Structured Memory Persistence + Freshness Metadata — MEDIUM, 보류
- **P-008**: Skill Handoff Protocol — MEDIUM, 보류

## [2026-03-13] 에이전트 고도화 — 구조적 강제, 역할별 도구 제한, 진행 보고 강화

**출처**: Hacker News, Anthropic 공식 문서, 우수 사용자 사례 8건 종합 분석

### 적용 (11개)
- **P-001**: Hook 기반 Forbidden Rule 구조적 강제 → 적용 (settings.json, simon SKILL.md)
- **P-002**: 자동 검증 파이프라인 강화 → 적용 (settings.json)
- **P-003**: maxTurns 기본 적용 → 적용 (agent-teams.md, phase-b-implementation.md)
- **P-004**: .claude/agents/ 커스텀 에이전트 정의 → 적용 (agents/reviewer.md, agents/verifier.md 신규)
- **P-006**: project-memory.json 활용 강화 → 적용 (simon SKILL.md)
- **P-007**: Heartbeat Protocol 도입 → 적용 (simon SKILL.md, agent-teams.md)
- **P-010**: maxTurns 가이드라인 테이블 → 적용 (simon SKILL.md)
- **P-011**: Cognitive Independence reference 누락 보완 → 적용 (simon SKILL.md, simon-grind SKILL.md)
- **P-012**: agent-teams-fallback.md 통합 → 적용 (agent-teams.md, agent-teams-fallback.md 삭제)
- **P-013**: PM force_path Plan Reuse Protocol → 적용 (simon SKILL.md, feature-execution.md)
- **P-015**: 병렬 Unit 파일 격리 규칙 → 적용 (phase-b-implementation.md)

### 기각 (4개)
- **P-005**: 전문가 역할 세분화 (architect/security/perf) — 기각 (이유: 현재 context로 충분히 cover)
- **P-008**: Agent Team 실패 시 개별 spawn 자동 전환 — 기각 (이유: 기존 fallback 문서로 충분)
- **P-009**: Rejected Alternatives 공유 — 기각 (이유: 독립 검증 원칙 유지가 더 중요)
- **P-014**: Agent 자체 컨텍스트 관리 — 기각 (이유: 현재 prompt 방식이 충분히 효과적)

## [2026-03-16] Draft PR --draft 플래그 누락 방지 Instruction 격상 및 검증 게이트 추가

**출처**: simon-boost-capture 인사이트 (Draft PR 생성 시 --draft 플래그 누락 사례)
**인사이트 경로**: `.claude/boost/insights/2026-03-16-1635-simon-code-review-draft-pr-gate.md`

### 적용 (1건)

- **변경 1**: simon-code-review/SKILL.md — Step 1에 핵심 제약 블록 추가 ("PR은 반드시 Draft 상태로 생성"), 4번 항목에 `--draft` **필수** Instruction 격상, 새 5번에 `[GATE — Draft 상태 검증]` 삽입 (gh pr view로 isDraft 확인 → false면 gh pr ready --undo 자동 전환), 기존 5→6, 6→7 번호 재조정

### 기각 (0건)

---

## [2026-03-16] PR Review 사이클에서 전문가 검증 생략 문제 (사용자 직접 피드백)
- **P-001**: CronCreate 프롬프트에 전문가 검증 핵심 절차 인라인 → 적용 (simon-code-review SKILL.md)
- **P-002**: Step 4-B를 GATE로 강화 (시각적 분리, Why, 핵심 절차 인라인) → 적용 (simon-code-review SKILL.md)
- **P-003**: 워크플로 다이어그램에 전문가 검증 게이트 반영 → 적용 (simon-code-review SKILL.md)
- **P-004**: 전문가 verdict 파일 기반 증거 패턴 → 적용 (simon-code-review SKILL.md, expert-comment-review.md)
- **P-005**: Trivial 예외 경로 도입 → 기각 (사용자 판단: 불필요)
- **P-006**: 코드 변경 시 Before/After 포함 대댓글 필수 → 적용 (expert-comment-review.md, inline-review-format.md)
- **P-007**: 리뷰 사이클 번호 [RN] 식별자 추가 → 적용 (SKILL.md, expert-comment-review.md, inline-review-format.md)

## [2026-03-17] How I Write Software with LLMs (Stavros Korokithakis)

**출처**: [How I Write Software with LLMs](https://www.stavros.io/posts/how-i-write-software-with-llms/)
**리포트 경로**: `.claude/boost/report-stavros-llm-software.md`

### 적용 (9건)

- **P-001**: Review Summary에 Architecture Impact 섹션 추가 → 적용 (simon-code-review/references/review-strategy.md, simon/references/integration-and-review.md)
- **P-002**: Executor Decision Authority Boundary 명시 → 적용 (simon/references/phase-b-implementation.md)
- **P-003**: Blind-First Pass 1 독립 Severity 판정 → 적용 (simon-code-review/references/review-strategy.md)
- **P-004**: Expert GATE Self-Agreement Bias 견제 → 적용 (simon-code-review/references/expert-comment-review.md)
- **P-007**: simon-report 깨진 Reference 수정 → 적용 (simon-report/SKILL.md)
- **P-008**: simon SKILL.md Cross-Cutting Protocols 분리 → 적용 (simon/SKILL.md, simon/references/cross-cutting-protocols.md 신규)
- **P-009**: simon-code-review Step 2 Reference 분리 → 적용 (simon-code-review/SKILL.md, simon-code-review/references/review-strategy.md 신규)
- **P-010**: Step Progress Pulse 2-tier 확장 → 적용 (simon/references/phase-b-implementation.md)
- **P-011**: Cross-Step Compounding Failure 감지 → 적용 (simon-grind/references/grind-cross-cutting.md)

### 기각 (3건)
- **P-005**: Phase A→B Plan Approval Gate → 기각 (사용자 판단)
- **P-006**: Step 7 Expert Review 선택적 재소집 → 기각 (사용자 판단)
- **P-012**: Handoff Notification 사용자 행동 안내 → 기각 (사용자 판단)

### 검증 후 추가 수정
- grind-cross-cutting.md: agent-teams-fallback.md → agent-teams.md 깨진 참조 수정 (기존 이슈)
- review-strategy.md: references/inline-review-format.md → inline-review-format.md 이중 경로 수정

---

## [2026-03-18] Insight Review
- **I-001**: 삭제된 파일/라인에 인라인 코멘트 시 `side: "LEFT"` 누락 → 적용 (inline-review-format.md: Line 번호 매핑에 side RIGHT/LEFT 구분 + 삭제 코드 리뷰 의무화, review-strategy.md: payload 예시에 side LEFT 케이스 추가 + GATE 체크리스트에 삭제된 코드 항목 추가, inline-review-format.md: 삭제 파일 코멘트 예시 JSON 추가)

---

## [2026-03-17] Insight Review
- **I-001**: simon-code-review push 실패 시 후속 단계 자동 재개 로직 부재 → 적용 (simon-code-review SKILL.md: push 실패 복구 절차 + 중단 복구 프로토콜, simon integration-and-review.md: Step 19 복구 책임 명시)
- **I-002**: 영향 분석 인라인 코멘트 누락 및 테스트 파일 양식 미준수 → 적용 (simon-code-review SKILL.md: Step 2 요약에 영향 분석 인라인 코멘트 명시, review-strategy.md: GATE 양식 준수 체크리스트 추가, inline-review-format.md: 테스트 양식 독립 섹션 승격)

---

## [2026-03-16] Insight Review
- **I-001**: Step 18-19 필수 실행 강제 및 Draft PR 규칙 명시화 → 적용 (simon SKILL.md, integration-and-review.md, forbidden-rules.md, simon-grind grind-phase-b.md)
