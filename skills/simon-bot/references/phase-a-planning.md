# Phase A: Planning (Detailed Instructions)

## Step 0: Scope Challenge

- Spawn `architect`: Analyze git history for past problem areas
- Identify "What already exists" - existing code that solves parts of the request
- Determine minimum viable change
- Flag if scope exceeds 8 files or 2 new classes
- Present 3 review paths to user via AskUserQuestion:
  - **SMALL**: Steps 5-8 + 17 only
  - **STANDARD**: Steps 5-17 full pipeline
  - **LARGE**: Steps 5-17 + extended failure mode analysis
- Record decision in `.claude/memory/plan-summary.md`

### X-Y Problem Detection (P-005)

사용자가 특정 구현 방법을 요청할 때 ("Redis를 추가해줘", "캐시 레이어를 넣어줘"), 먼저 근본 목적을 확인한다:
- "이 변경으로 해결하려는 실제 문제가 무엇인가요?" (1회만 질문)
- 사용자의 답변에서 요청(Y)과 실제 문제(X)의 불일치가 감지되면:
  - `[X-Y 감지] {Y} 요청이지만, 실제 문제는 {X}인 것 같습니다. {Y'} 대안이 더 적합할 수 있습니다.`
- 사용자가 원래 요청을 고수하면 그대로 진행 (강제하지 않음)

### SMALL Fast Track (P-002)

Step 0에서 SMALL로 판별 시 Phase A를 압축 실행한다:
- Step 1-A: 구조 스캔만 (Code Design Team skip)
- Step 1-B: AI-First Draft 방식으로 간결 계획서 작성 (Task + End State만). 사용자 인터뷰는 초안 교정 1회로 축소
- Steps 2-4: 단일 critic subagent 1회 리뷰로 통합 (Agent Team 미생성)
- Step 4-B: Safety + Code Design always 멤버만 경량 리뷰
- 사용자 인터랙션: Step 0+1-B 통합, Expert Review CRITICAL만 확인 (총 2회)

## Step 1-A: Project Analysis + Code Design Analysis

- Spawn `explore-medium`: Scan project structure
- Spawn `analyst`: Generate analysis report + recommend principles
- Use Context7 MCP (`resolve-library-id` → `query-docs`) for library docs
- Auto-generate allowed command list based on detected stack
- Use subagent for deep codebase exploration if codebase is large
- **Auto-detect experts**: 스캔 결과를 `config.yaml`의 `expert_panel.specialists[].detect` 키워드와 매칭하여 활성화할 전문가 목록 결정

### Search Strategy for Code Exploration (P-013)

코드베이스 탐색 에이전트(explore-medium, analyst 등)는 다음 검색 전략을 따른다. grep 단일 검색은 문자열만 매칭하므로 관련성 있는 코드를 놓칠 수 있다.

1. **Structural scan first**: Glob으로 디렉토리 구조를 파악하고, 도메인 경계(DDD layers, 모듈 분리)를 식별한다
2. **Multi-term search**: 하나의 개념에 대해 동의어/관련어로 다중 검색한다
   - 예: "authentication" 탐색 시 → "auth", "login", "session", "token", "jwt", "credentials"로도 검색
   - 예: "payment" 탐색 시 → "billing", "charge", "invoice", "transaction"으로도 검색
3. **Pattern-based search**: 하나의 인스턴스를 발견하면, 동일 패턴이 코드베이스에 다른 곳에도 있는지 검색하여 일관성을 확인한다 ("이것이 유일한 구현인가, 변형이 있는가?")
4. **Reference chain traversal**: 관련 파일을 찾으면 import/importer를 추적하여 변경 영역의 의존성 그래프를 구축한다
5. **NEVER 단일 검색으로 결론**: 검색 결과 0건이면 다른 용어로 최소 2회 재시도한 후에 "존재하지 않는다"고 결론낸다

### Agent Team: Code Design Team (explore-medium 완료 후)

- `config.yaml`의 `expert_panel.domain_teams.code-design` 참조
- 목적: 레포의 코드 설계 컨텍스트를 사전 분석하여 이후 모든 단계에서 활용

> **Agent Teams Fallback**: Agent Teams 미활성 시 `agent-teams.md`의 Fallback 절차를 따른다.

**1) 팀 생성**: `TeamCreate(team_name="code-design", description="코드 설계 분석 팀")`

**2) 작업 정의** (`TaskCreate`):
- Task "분석": "각자 도메인별 레포 분석 → findings 작성" (`activeForm="레포 분석 중"`)
- Task "토론": "다른 팀원의 findings를 읽고 직접 메시지로 토론" (`addBlockedBy=["분석"]`, `activeForm="패턴 토론 중"`)
- Task "합의": "팀 합의 도출 → .claude/memory/code-design-analysis.md 작성" (`addBlockedBy=["토론"]`, `activeForm="합의문 작성 중"`)

**3) 팀원 spawn** (병렬, `team_name="code-design"`):
- `Agent(name="convention-expert")` (always)
  — 네이밍 규칙, 디렉토리 구조, 에러 핸들링 패턴, import 순서, CLAUDE.md / .editorconfig / linter 설정, 유사 기능 기존 구현체 탐색
- `Agent(name="idiom-expert")` (always)
  — Context7 MCP로 프레임워크/라이브러리 공식 문서 조회, 언어 공식 가이드, 프레임워크 권장 패턴 및 anti-pattern
- `Agent(name="design-pattern-expert")` (auto-detect)
  — Clean Architecture / Layered / Hexagonal 등 식별, 의존성 방향, 인터페이스 사용 패턴
- `Agent(name="testability-expert")` (auto-detect)
  — 기존 테스트 구조, mock/fixture 패턴 파악

**4) 팀원 자율 운영**: 팀원들이 TaskList에서 작업을 claim하고, SendMessage로 직접 토론

**5) 팀 해산**: 모든 팀원에게 `SendMessage(type="shutdown_request")` → `TeamDelete()`

### 통합 검증 명령 탐지 (Feedback Loop 기반)

프로젝트의 기존 빌드/린트/테스트 통합 검증 수단을 파악하여 이후 모든 단계에서 빠른 피드백 루프로 활용한다.
AI의 실수를 가장 빠르게 잡아내는 것은 자동화된 검증이다. 이 단계에서 검증 명령을 파악해두면, 이후 매 구현 단계에서 즉각적인 피드백을 받을 수 있다.

탐지 대상:
- `Makefile` / `justfile` / `taskfile.yml` — `make verify`, `make test`, `make lint` 등
- `package.json` scripts — `npm test`, `npm run lint`, `npm run build`
- CI 설정 (`.github/workflows/`, `.gitlab-ci.yml`) — CI에서 실행하는 검증 명령
- 프로젝트 `README.md`의 개발 가이드

파악한 명령을 `.claude/memory/verify-commands.md`에 기록:
```markdown
## 통합 검증 명령
- Build: `make build` / `go build ./...`
- Test: `make test` / `go test ./...`
- Lint: `make lint` / `golangci-lint run`
- Typecheck: (해당 시)
- All-in-one: `make verify` (있으면)
```

- Save: `.claude/memory/requirements.md`, `.claude/memory/code-design-analysis.md`, `.claude/memory/verify-commands.md`

## Step 1-B: Plan Creation

- Spawn `planner` in interview mode
- Input: User request + Step 0 scope + Step 1-A analysis + `.claude/memory/code-design-analysis.md`
- Split work into Units: max 3-5 files, 200 lines per Unit, single concern
- Build dependency graph: parallel vs sequential groups
- Use Context7 for SDK documentation needed for implementation

### AI-First Draft Protocol (P-005)

사용자가 처음부터 답하는 것보다, AI가 초안을 제시하고 사용자가 교정하는 것이 더 빠르고 정확하다.

1. Step 1-A 분석 + 사용자 요청에서 계획서 초안을 먼저 작성한다
2. 초안을 사용자에게 제시: "이 계획으로 진행할까요? 수정할 부분이 있으면 알려주세요."
3. 사용자는 빈 칸을 채우는 대신, 잘못된 부분만 교정한다
4. 교정 후 인터뷰는 미해결 항목(비즈니스 결정, 트레이드오프)에만 집중한다

이 방식은 인터뷰 라운드를 줄이고, 사용자의 인지 부담을 낮추며, 더 정확한 계획서를 빠르게 도출한다.

### Interview Guard

- 코드를 먼저 충분히 탐색한 뒤, 코드에서 답할 수 있는 질문은 하지 않는다
- Step 0 scope + Step 1-A 분석 결과에서 이미 파악된 정보를 다시 묻지 않는다
- 사용자에게는 비즈니스 결정, 엣지케이스, 스코프 경계, 트레이드오프만 질문한다

### 계획서 구조 (STICC Framework)

계획서(`plan-summary.md`)는 다음 구조를 따른다. 단, 계획서에 "STICC"라는 메타 텍스트를 포함하지 않는다.

**1. Situation (현재 상태)**:
- 현재 시스템의 관련 부분이 어떤 상태인지
- 왜 이 작업이 필요한지 (배경, 문제점, 기회)

**2. Task (구체적 작업)**:
- Unit 분할 (max 3-5 files, 200 lines per Unit, single concern)
- 각 Unit별 변경 대상 파일 목록 (파일 경로 + 변경 유형: 신규/수정/삭제)
- Implementation order (dependency graph: parallel vs sequential)
- Development principles (TDD/DDD/Clean Architecture as confirmed)

**3. Intent (의도와 목적)**:
- 이 작업이 달성하려는 근본적 목적 (단순히 "뭘 하는지"가 아니라 "왜 하는지")
- 성공 기준: 이 작업이 완료되면 시스템이 어떤 상태가 되어야 하는지

**4. Concerns (우려사항과 리스크)**:
- Expected risks
- "NOT in scope" section (명시적으로 하지 않을 것)
- "Unresolved decisions" section (결정되지 않은 사항)

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
- **Test Targets**: 테스트 대상 파일 패턴

**Files Changed 테이블 작성 예시 (좋은 예)**:
```
| File | Action | Summary |
|------|--------|---------|
| internal/pacing/service.go | 신규 | 예산 페이싱 로직을 담당하는 PacingService 구현 |
| internal/pacing/service_test.go | 신규 | PacingService 단위 테스트 (경계값, 에러 케이스 포함) |
| internal/handler/campaign.go | 수정 | POST /campaigns 핸들러에 PacingService 의존성 주입 + 페이싱 활성화 분기 추가 |
| internal/handler/campaign_test.go | 수정 | 페이싱 활성화/비활성화 시나리오 테스트 추가 |
| internal/model/campaign.go | 수정 | Campaign 구조체에 PacingEnabled, DailyBudget 필드 추가 |
| db/migrations/20260305_add_pacing.sql | 신규 | campaigns 테이블에 pacing_enabled, daily_budget 컬럼 추가 |
```
각 파일에 대해 구체적인 변경 내용을 한 문장으로 설명한다. "수정"이라고만 적지 않고 무엇을 수정하는지 명시한다.

- Save to `.claude/memory/plan-summary.md`
- Use subagent with planner role for plan creation

## Steps 2-4: Plan Review (Agent Team)

> **Agent Teams Fallback**: Agent Teams 미활성 시 `agent-teams.md`의 Fallback 절차를 따른다.

**팀 생성**: `TeamCreate(team_name="plan-review", description="계획 리뷰 팀")`
- 컨텍스트: `.claude/memory/plan-summary.md`, `.claude/memory/requirements.md`, `.claude/memory/code-design-analysis.md`

**팀원 spawn** (병렬, `team_name="plan-review"`):
- `Agent(name="planner")` — plan 수정/방어 담당
- `Agent(name="critic")` — 논리/실현성 검증 담당
- `Agent(name="architect")` — 구조 검증 + YAGNI/KISS 검증 담당

### Step 2: Plan Review
- Task "plan-review": critic ←→ planner 직접 토론 (`SendMessage`로)
- Max 3 iterations (config `loop_limits.critic_planner`)
- **품질 기반 조기 종료**: critic이 매 iteration 종료 시 4개 축을 1-5점으로 평가한다:
  - **Completeness** (요구사항 커버리지)
  - **Feasibility** (기술적 실현 가능성)
  - **Safety** (보안/안정성 리스크 관리)
  - **Clarity** (계획서 명확성, 모호함 없음)
  - 모든 항목 4점 이상이면 남은 iteration 없이 조기 종료한다
  - 평가 결과를 `.claude/memory/plan-review-scores.md`에 기록한다

### Step 3: Meta Verification
- Task "meta-verify" (`addBlockedBy=["plan-review"]`): architect가 critic의 리뷰를 cross-verify
- Severity-based routing:
  - Minor (detail-level): → Step 2 task 재생성
  - Major (structural): → lead에게 보고 → Step 1-B (with failure reason)

### Step 4: Over-engineering Check
- Task "yagni-check" (`addBlockedBy=["meta-verify"]`): architect가 YAGNI/KISS 관점으로 plan 검증
- architect ←→ planner 직접 토론으로 합의 도출
- Severity-based routing: Minor → Step 2, Major → Step 1-B

**Step 4 완료 시**: 모든 팀원에게 `SendMessage(type="shutdown_request")` → `TeamDelete()`
- Steps 2-4 are executed as a combined plan review cycle

## Step 4-B: Expert Plan Review — 도메인팀 Agent Team 토론

- 목적: 구현 전에 도메인 전문가들이 **팀 내 토론**을 통해 우려사항/위험요소를 사전에 식별
- `config.yaml`의 `expert_panel` 섹션 참조
- Read expert prompts from `.claude/workflow/prompts/*.md`

### 팀 활성화 규칙 (`config.yaml` → `expert_panel.team_activation`)

- SMALL path: Safety Team + Code Design Team (always 멤버만: appsec, stability, convention, idiom)
- STANDARD path: Safety + Code Design (always) + auto-detect된 Data/Integration/Ops 팀
- LARGE path: 전체 + extended failure mode analysis

### 통합 전문가 팀 생성 (Agent Teams 제약: 세션당 1팀)

> **Agent Teams Fallback**: Agent Teams 미활성 시 `agent-teams.md`의 Fallback 절차를 따른다.

`TeamCreate(team_name="expert-review", description="도메인 전문가 통합 리뷰 팀")`

팀원 spawn (병렬, `team_name="expert-review"`):

**Data Team** (min_active 2, auto-detect):
- `Agent(name="rdbms-expert")`, `Agent(name="cache-expert")`, `Agent(name="nosql-expert")`

**Integration Team** (min_active 2, auto-detect):
- `Agent(name="sync-api-expert")`, `Agent(name="async-expert")`, `Agent(name="external-integration-expert")`, `Agent(name="messaging-expert")`

**Safety Team** (always — appsec + stability 항상 활성):
- `Agent(name="appsec-expert")`, `Agent(name="auth-expert")`, `Agent(name="infrasec-expert")`, `Agent(name="stability-expert")`

**Ops Team** (min_active 2, auto-detect):
- `Agent(name="infra-expert")`, `Agent(name="observability-expert")`, `Agent(name="performance-expert")`, `Agent(name="concurrency-expert")`

**Code Design Team** (always — convention + idiom 항상 활성):
- `Agent(name="convention-expert-review")`, `Agent(name="idiom-expert-review")`, `Agent(name="design-pattern-expert-review")`, `Agent(name="testability-expert-review")`
- Step 1-A의 `.claude/memory/code-design-analysis.md` 활용

### 도메인별 작업 정의 (`TaskCreate`)

각 도메인팀별 3단계:
- Task "{도메인}-분석": plan-summary.md 검토 → 도메인별 findings 작성
- Task "{도메인}-토론": 다른 팀원의 findings 읽고 직접 토론 (`addBlockedBy=["{도메인}-분석"]`)
- Task "{도메인}-합의": 팀 합의 → 도메인별 findings.md (CRITICAL/HIGH/MEDIUM severity) (`addBlockedBy=["{도메인}-토론"]`)

### 토론 로그 저장 (필수)

팀원 prompt에 다음 규칙을 포함:
> "토론 시 핵심 논점과 결론을 `.claude/memory/expert-discussions/{도메인}-discussion.md`에 기록하세요."

기록 형식:
```markdown
## [우려 ID]: [한줄 요약]
- [전문가A → 전문가B]: 논점 요약
- [전문가B → 전문가A]: 반박/동의 요약
- [합의]: 최종 결론 + severity + 근거
```

### Agent Scope Anti-Goals (P-003)

각 전문가 에이전트 prompt에 다음을 포함:
> "이 리뷰의 목적은 {도메인} 관점의 우려사항 식별입니다. 코드 스타일 교정, 범위 밖 리팩토링 제안, 변경하지 않은 파일에 대한 의견은 scope 밖입니다. git diff 대상 파일만 검토하세요."

이를 통해 에이전트가 범위를 벗어나 불필요한 의견을 생성하는 것을 방지한다.

### Lead의 Cross-team Synthesis

- **출력 형식**: 모든 전문가는 `references/expert-output-schema.md`의 Findings Schema를 따른다.

각 findings 출력 형식:
- **우려사항**: CRITICAL / HIGH / MEDIUM 심각도 (팀 합의 기반)
- **권장사항**: 구현 시 고려해야 할 구체적 주의점
- **토론 근거**: 어떤 전문가가 어떤 논거로 해당 severity에 합의했는지
- **질문**: 계획에서 불명확한 부분
- **재평가 트리거**: 구현 시 어떤 조건이 발생하면 이 concern의 severity를 재평가해야 하는지 (예: "만약 캐시 레이어를 도입하면 이 concern은 HIGH로 상향")

CRITICAL → `planner`에게 전달하여 계획 수정 → Step 2로 회귀 (max 2회)
HIGH → 계획에 주의사항으로 추가, 구현 시 반드시 반영
MEDIUM → 기록만 하고 구현 시 참고

- Save: `.claude/memory/expert-plan-concerns.md`
- 각 concern에 `trigger_condition` 필드를 포함하여, Step 7의 Impl Review Team이 구현 결과와 대조할 수 있도록 한다
- 사용자에게 주요 우려사항 요약 보고 (AskUserQuestion으로 진행 여부 확인)
- Update: `CONTEXT.md` — Phase A 완료 표시, 핵심 결정사항 및 전문가 우려(HIGH+) 갱신

## Phase A Calibration Checklist (Phase B 진입 전 검증)

모든 항목이 충족된 후에 Phase B로 진입한다. 미충족 항목이 있으면 해당 단계로 돌아가 보완한 후 재검증한다.

| # | 검증 항목 | 확인 방법 | 미충족 시 |
|---|----------|----------|----------|
| 1 | 코드베이스 탐색 완료 | `requirements.md` + `code-design-analysis.md` 존재 및 비어있지 않음 | → Step 1-A |
| 2 | 인터뷰 완료 | `plan-summary.md`에 Unresolved decisions이 비어있거나 구현에 영향 없음 | → Step 1-B |
| 3 | 계획서에 파일 경로 포함 | Task 섹션 + End State Files Changed 테이블에 구체적 파일 경로 | → Step 1-B |
| 4 | Acceptance Criteria 3분할 | Code Changes / Tests / Quality Gates 섹션 모두 존재 | → Step 1-B |
| 5 | End State Files Changed 테이블 존재 | File \| Action \| Summary 형식 | → Step 1-B |
| 6 | End State Behavior Changes 존재 | Before → After 형식 | → Step 1-B |
| 7 | Test Targets 섹션 존재 | 테스트 대상 파일 패턴 명시 | → Step 1-B |

누락 항목 발견 시 사용자에게 보고하지 않고 자동으로 해당 단계를 재실행하여 보완한다.
