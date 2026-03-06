---
name: simon-bot-report
description: "사전 분석 보고서 작성 — 코드베이스를 전문가팀 토론 구조로 분석하여 RFC, 현황 분석서, 또는 사용자 지정 양식의 문서를 생성합니다. Use when: (1) 새 기능 도입 전 RFC 작성 (\"RFC 써줘\", \"기술 제안서 만들어줘\"), (2) 기존 시스템 현황 분석 (\"코드 분석해줘\", \"현황 파악해줘\", \"아키텍처 리뷰\"), (3) 기술적 의사결정을 위한 사전 조사 (\"기술 조사해줘\"), (4) 커스텀 양식의 기술 문서 작성. 코드 변경 없이 분석만 필요할 때 이 스킬을 사용하세요."
---

# simon-bot-report

사전 분석 보고서 작성 스킬. 전문가팀 토론 기반 심층 분석 후 사용자 지정 양식으로 문서를 생성합니다.

## Instructions

You are executing the **simon-bot-report** skill. This skill analyzes a codebase topic using expert team discussions (from simon-bot's domain team structure) and produces a pre-implementation document in the user's chosen format.

**This is NOT a post-implementation report. It is a PRE-work analysis document** (RFC, 현황 분석, 기술 제안서 등).

### Step 0: Input Collection

**0-A: 워크플로 설정 확인**
- `.claude/workflow/config.yaml`이 존재하면 읽기 (language, experts 설정 활용)
- 없으면 기본값 사용 (language: ko)

**0-B: 사용자 입력 수집** (AskUserQuestion)

질문 1 — **문서 유형 선택**:
- **RFC (기술 제안서)**: 새 기능/변경에 대한 배경, 제안, 대안 비교, 리스크 분석
- **현황 분석서**: 기존 코드/시스템 현황 파악, 문제점 분석, 개선 방향 제시
- **커스텀 양식**: 사용자가 직접 양식/섹션을 지정

질문 2 — **분석 주제**: 자연어로 분석할 주제 설명
- 예: "인증 시스템의 토큰 관리 현황 분석"
- 예: "11번가 피드 처리 워크플로 통합을 위한 RFC"

질문 3 — **분석 범위** (선택사항):
- 특정 파일이나 디렉토리를 지정할 수 있음
- 지정 없으면 주제에서 자동 탐색

질문 4 (커스텀 양식 선택 시) — **양식 지정**:
- 원하는 섹션 목록이나 참고할 템플릿 파일 경로

**기록:**
- `.claude/reports/input-{topic-slug}.md`에 입력 내용 저장

### Step 1: Codebase Exploration

**목적:** 분석 주제와 관련된 코드를 탐색하여 컨텍스트 확보

**1-0: Report Memory (이전 보고서 참조)**
- `.claude/reports/` 디렉토리의 기존 보고서 목록을 스캔한다
- 현재 분석 주제와 관련된 이전 보고서가 있으면 핵심 발견사항을 컨텍스트로 활용한다
- 이전 보고서의 발견사항 중 아직 해결되지 않은 항목을 "기존 이슈"로 표시한다
- 이전 보고서가 없으면 이 단계를 skip한다

**1-A: 구조 탐색**
- Spawn `explore-medium`: 주제 관련 디렉토리/파일 구조 스캔
  - 관련 모듈, 클래스, 함수 식별
  - 의존성 관계 파악
  - 설정 파일, 테스트 파일 포함
- 사용자가 파일/디렉토리를 지정한 경우: 해당 범위 중심으로 탐색
- 지정하지 않은 경우: 주제 키워드로 codebase 전체 탐색

**1-B: 핵심 코드 읽기**
- 탐색 결과에서 핵심 파일 5-15개 선별
- Read tool로 핵심 로직 파악
- 데이터 흐름, 에러 처리, 인터페이스 구조 메모

**중간 보고 (Progressive Disclosure):**
- 탐색 완료 시 사용자에게 한 줄 요약 출력: "탐색 완료. N개 파일에서 M개 핵심 모듈 식별."
- 이 중간 출력은 진행 상황 프리뷰이며, 최종 보고서가 정본이다.

**Save:** `.claude/reports/exploration-{topic-slug}.md`

### Step 2: Code Design Analysis (Agent Team)

**목적:** simon-bot Step 1-A의 Code Design Team 구조를 활용하여 코드 설계 컨텍스트 분석

**단일 통합 팀 생성** (Agent Teams 제약: 세션당 1팀, 세션 기본 모델 사용):

`TeamCreate(team_name="code-design-analysis", description="코드 설계 분석 전문가 팀")`

- **convention-expert** (always):
  - 분석 대상 디렉토리의 기존 코드 패턴 분석
  - 네이밍 규칙, 디렉토리 구조, 에러 핸들링 패턴
  - CLAUDE.md / linter 설정 참조
  - 유사 기능의 기존 구현체 탐색

- **idiom-expert** (always):
  - 사용 중인 프레임워크/라이브러리의 공식 권장 패턴 확인
  - Context7 MCP 활용 (가능한 경우)
  - 언어 공식 가이드 기반 관용구 확인

- **design-pattern-expert** (auto-detect):
  - 기존 코드의 아키텍처 패턴 식별
  - Clean Architecture / DDD / Layered 등
  - 의존성 방향, 인터페이스 사용 패턴

- **testability-expert** (auto-detect):
  - 기존 테스트 구조, mock/fixture 패턴 파악
  - 테스트 커버리지 현황

> **Agent Teams Fallback**: Agent Teams 미활성 시, 각 전문가를 개별 `Agent(subagent_type="general-purpose")` subagent로 spawn하고, 결과를 오케스트레이터가 취합하여 교차 검증한다.

**Shared Tasks:**
- Task 1: 각자 도메인별 분석
- Task 2: 서로의 발견 공유 및 토론
- Task 3: 팀 합의 → 통합 분석 결과 작성

**Agent Team 해산**

**Agent Teams Fallback**: Agent Teams가 비활성 상태이면 `~/.claude/skills/simon-bot/references/agent-teams-fallback.md`의 subagent fallback을 적용한다.

**중간 보고 (Progressive Disclosure):**
- 코드 설계 분석 완료 시 사용자에게 주요 발견 요약 출력 (예: "코드 설계 분석 완료. 주요 발견: Layered Architecture 사용 중, 테스트 커버리지 낮음, 네이밍 규칙 일관됨.")
- 이 중간 출력은 진행 상황 프리뷰이며, 최종 보고서가 정본이다.

**Save:** `.claude/reports/code-design-{topic-slug}.md`

### Step 3: Domain Expert Team Discussion

**목적:** simon-bot Step 4-B의 도메인팀 Agent Team 토론 구조를 활용하여 심층 분석

**config.yaml의 experts 설정 참조.** 없으면 기본 전문가 사용.

**단일 통합 전문가 팀 생성** (Agent Teams 제약: 세션당 1팀):

`TeamCreate(team_name="domain-expert-review", description="도메인 전문가 통합 리뷰 팀")`

활성화된 도메인의 전문가를 하나의 팀에 모두 포함시킨다. 도메인팀별 구성원은 동일하되, 하나의 공유 작업 목록에서 도메인별로 작업을 분리한다.

팀원 spawn (병렬, `team_name="domain-expert-review"`):

- **Data 서브그룹** (auto-detect — DB/캐시/스토리지 관련 코드 감지 시):
  - rdbms-expert, cache-expert, nosql-expert
  - 토론 초점: 데이터 일관성, 캐시 전략, 스토리지 정합성

- **Integration 서브그룹** (auto-detect — API/비동기/외부연동 감지 시):
  - sync-api-expert, async-expert, external-integration-expert, messaging-expert
  - 토론 초점: 동기/비동기 경계, 에러 전파, 장애 격리

- **Safety 서브그룹** (always):
  - appsec-expert, stability-expert
  - 토론 초점: 보안 경계, 장애 복구, 입력 검증

- **Ops 서브그룹** (auto-detect — 인프라/성능/동시성 관련 코드 감지 시):
  - infra-expert, observability-expert, performance-expert, concurrency-expert
  - 토론 초점: 운영 안정성, 관측 가능성, 성능 병목

- **Code Design 서브그룹** (always — Step 2 결과 활용):
  - convention-expert, idiom-expert, design-pattern-expert, testability-expert
  - 토론 초점: 레포 컨벤션 준수, 설계 패턴, 테스트 가능성
  - Step 2의 `.claude/reports/code-design-{topic-slug}.md` 활용

> **Agent Teams Fallback**: Agent Teams 미활성 시, 각 전문가를 개별 `Agent(subagent_type="general-purpose")` subagent로 spawn하고, 결과를 오케스트레이터가 취합하여 교차 검증한다.

**환각 방지 원칙 (모든 전문가 에이전트에 적용):**
- 읽지 않은 코드에 대해 추측하지 않는다. 파일은 반드시 Read 도구로 열어본 후에 의견을 제시한다.
- 코드를 직접 확인하지 못한 부분에 대해서는 "미확인" 또는 "추가 확인 필요"로 명시한다.

**Agent Teams Fallback**: Agent Teams가 비활성 상태이면 `~/.claude/skills/simon-bot/references/agent-teams-fallback.md`의 subagent fallback을 적용한다.

**도메인 서브그룹별 Shared Tasks (3단계 토론):**
- Task "{domain}-분석": 각 teammate가 독립적으로 주제 관련 코드 검토 → 도메인별 findings 작성
- Task "{domain}-토론": 다른 teammate의 findings를 읽고 직접 반박/보강 토론
- Task "{domain}-합의": 팀 합의 도출 → 서브그룹별 findings 작성 (CRITICAL/HIGH/MEDIUM severity)

**CRITICAL Severity Voting 검증 (Safety Team):**
- Task 3에서 CRITICAL severity 후보가 나오면, Safety Team이 해당 항목에 대해 2-3회 독립 분석을 수행한다.
- 각 독립 분석은 코드를 다시 Read로 읽고, 이전 분석 결과를 참조하지 않은 상태에서 severity를 판정한다.
- 독립 분석 결과가 일관되게 CRITICAL로 판정되는 경우에만 CRITICAL을 확정한다.
- Voting 합의 실패 시 (예: 3회 중 1회만 CRITICAL) severity를 HIGH로 재평가하고, 재평가 근거를 findings에 기록한다.
- 이 검증은 CRITICAL의 남발을 방지하고, 정말 중대한 이슈만 CRITICAL로 분류되도록 하기 위함이다.

**팀에 전달할 컨텍스트:**
- Step 1의 탐색 결과 (`.claude/reports/exploration-{topic-slug}.md`)
- Step 2의 코드 설계 분석 (`.claude/reports/code-design-{topic-slug}.md`)
- 분석 주제 설명

**중간 보고 (Progressive Disclosure) — 서브그룹별 완료 시:**
- 각 서브그룹이 "{domain}-합의" Task를 마칠 때마다, 사용자에게 서브그룹별 핵심 finding 1줄 요약을 출력한다.
  - 예: "Safety 서브그룹 완료: 입력 검증 누락 1건 CRITICAL, 세션 관리 이슈 1건 HIGH"
  - 예: "Data 서브그룹 완료: 캐시 무효화 전략 부재 1건 HIGH"
- 이 중간 출력은 진행 상황 프리뷰이며, 최종 보고서가 정본이다.

**Lead의 Cross-team Synthesis:**
- 5개 서브그룹의 findings를 통합
- 도메인 간 충돌 식별
- 최종 통합 분석 작성

**각 findings 출력 형식:**
- **발견사항**: CRITICAL / HIGH / MEDIUM 심각도 (팀 합의 기반)
- **권장사항**: 구체적 주의점이나 개선 방향
- **토론 근거**: 어떤 전문가가 어떤 논거로 해당 severity에 합의했는지

**Save:** `.claude/reports/expert-findings-{topic-slug}.md`

### Step 4: Document Generation

**목적:** 수집된 모든 분석 결과를 사용자가 선택한 양식으로 정리

**4-A: 템플릿 로딩**
- RFC → `~/.claude/skills/simon-bot-report/templates/rfc.md`
- 현황 분석 → `~/.claude/skills/simon-bot-report/templates/analysis.md`
- 커스텀 → 사용자가 지정한 양식/섹션 사용

**4-B: 문서 작성**
- Spawn `writer`:
  - 입력: Step 1 탐색 결과 + Step 2 코드 설계 분석 + Step 3 전문가 토론 결과
  - 템플릿의 플레이스홀더를 실제 분석 내용으로 채움
  - **Language:** config.yaml의 `language` 설정 (기본: `ko`)
  - 코드 스니펫은 실제 코드에서 발췌 (핵심 부분만)
  - 다이어그램은 ASCII art 또는 Mermaid 형식
  - 전문가 토론 결과를 적절한 섹션에 배치
  - 미결정 사항은 "**추후 결정 필요**" 또는 "**추후 문제가 될 수 있음**" 표시

**4-C: 출력**
1. `.claude/reports/{document-type}-{topic-slug}.md`에 파일 저장
2. 사용자에게 전체 내용을 화면에 출력
3. 저장 경로 안내

**4-D: Knowledge Base 갱신**
- 보고서의 핵심 발견사항(CRITICAL/HIGH)을 `.claude/reports/knowledge-base.md`에 누적 append한다
- 형식: `## [{날짜}] {주제} — {핵심 발견 3줄 요약} | 관련 파일: {파일 목록}`
- 이 누적 기록은 향후 Step 1-0에서 활용된다

### Step 5: Interactive Guided Review (인터랙티브 가이드 리뷰)

**목적**: 보고서의 각 섹션을 순서대로 하나씩 제시하며, 사용자와 대화형으로 리뷰 진행.

**5-A: 리뷰 개요 제시**
- 사용자에게 전체 리뷰 개요를 먼저 보여줌:
  - 문서 유형 (RFC / 현황 분석 / 커스텀)
  - 총 섹션 수
  - 각 섹션의 제목 리스트 (순서대로)
  - 저장 경로
- "리뷰를 시작하겠습니다" 안내

**5-B: 순차 리뷰 루프**
- 보고서의 섹션을 순서대로 하나씩 제시
- **각 섹션마다**:
  1. **섹션 내용 제시**: 섹션 제목, 본문 내용을 마크다운으로 출력 (코드 스니펫, 다이어그램 포함)
  2. **AskUserQuestion으로 피드백 수집**:
     - **OK**: 다음 섹션으로 진행
     - **수정 요청**: 사용자의 피드백을 받아 `writer`로 즉시 수정 → 수정된 결과를 다시 제시 → 재확인 (max 3회)
     - **추가 분석 필요**: 관련 Step (1-3)으로 회귀하여 추가 분석 후 섹션 재작성
     - **질문 있음**: 사용자 질문에 답변 후 다시 OK/수정 요청 선택
  3. 리뷰 결과 기록: `.claude/reports/review-progress-{topic-slug}.md`에 각 섹션의 리뷰 상태 (OK / 수정완료 / 보류) 기록
- **모든 섹션 리뷰 완료 후**:
  - 전체 리뷰 요약 출력 (OK 수, 수정된 수, 보류 수)
  - 수정된 섹션이 있다면: 최종 보고서 파일을 업데이트하여 저장
  - 보류 항목이 있다면: 보고서 말미에 "**추후 보완 필요**" 섹션으로 기록

**5-C: 최종 확인**
- AskUserQuestion: "모든 섹션 리뷰가 완료되었습니다. 추가 수정이 필요하신가요?"
  - **완료**: 최종 보고서 저장 경로 안내
  - **구현 시작 (simon-bot)**: 이 분석 결과를 컨텍스트로 simon-bot 워크플로를 시작합니다
  - **프로젝트 관리 (simon-bot-pm)**: 이 분석 결과를 기반으로 PM 워크플로를 시작합니다
  - **양식 변경**: Step 4에서 다른 템플릿으로 재생성
  - **추가 리뷰**: 5-B로 돌아가 특정 섹션 재리뷰

### Configuration

이 스킬은 `.claude/workflow/config.yaml`이 있으면 다음 설정을 활용합니다:
- `language`: 보고서 작성 언어 (기본: ko)
- `experts`: 전문가 구성 (always / auto_detect)
- `model_policy`: 에이전트 모델 (기본: 세션 모델)

config.yaml이 없어도 기본값으로 동작합니다.

### Output Files

모든 중간 결과 및 최종 문서는 `.claude/reports/`에 저장됩니다:

| 파일 | 내용 |
|------|------|
| `input-{slug}.md` | 사용자 입력 (주제, 범위, 양식) |
| `exploration-{slug}.md` | Step 1 코드 탐색 결과 |
| `code-design-{slug}.md` | Step 2 코드 설계 분석 |
| `expert-findings-{slug}.md` | Step 3 전문가 토론 결과 |
| `{type}-{slug}.md` | 최종 보고서 (rfc/analysis/custom) |

### Global Rules

`~/.claude/skills/simon-bot/references/forbidden-rules.md`의 3계층 규칙(ABSOLUTE / CONTEXT-SENSITIVE / AUDIT-REQUIRED)을 전체 적용한다. 추가로:

- 코드를 수정하지 않는다 (읽기 전용 분석). 이 스킬의 목적은 사전 분석이므로, 코드를 변경하면 분석 결과의 객관성을 잃는다.
- 외부 시스템에 접근하지 않는다. 분석 대상은 로컬 코드베이스에 한정된다.
- 실제 DB나 API를 호출하지 않는다. 운영 환경에 영향을 줄 수 있는 행위를 방지하기 위함이다.
- 분석 결과는 `.claude/reports/`에만 저장한다. 산출물의 위치를 일원화하여 추적과 관리를 용이하게 한다.
- 기존 코드나 설정 파일을 변경하지 않는다. 분석 과정에서 의도치 않은 부작용을 예방하기 위함이다.
