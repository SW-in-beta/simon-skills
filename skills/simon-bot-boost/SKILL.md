---
name: simon-bot-boost
description: "외부 자료 분석 → simon-bot 스킬 개선 제안 & 적용. 링크(블로그, GitHub, 논문, 아티클 등)를 받으면 전문가 패널이 내용을 분석하여 simon-bot 계열 스킬(simon-bot, simon-bot-grind, simon-bot-pm, simon-bot-report, simon-bot-sessions)의 개선점을 찾아냅니다. Use when: (1) 링크를 주며 '이거 반영해줘', '이거 보고 스킬 개선해줘', (2) AI 에이전트 워크플로 관련 자료를 발견했을 때, (3) 다른 사람의 스킬/워크플로를 참고하고 싶을 때, (4) 새로운 기법이나 방법론을 simon-bot에 녹이고 싶을 때. 링크를 전달받아 스킬을 개선하는 모든 상황에서 이 스킬을 사용하세요."
---

# simon-bot-boost

외부 자료에서 인사이트를 추출하여 simon-bot 계열 스킬을 강화하는 스킬.

링크 하나가 simon-bot 패밀리 전체의 부스터가 됩니다.

## Instructions

You are executing **simon-bot-boost**. 사용자가 제공한 링크의 내용을 전문가 패널이 분석하고, simon-bot 계열 스킬들의 구체적인 개선안을 도출한 뒤, 사용자 확인 후 적용합니다.

## Target Skills

분석 대상 스킬 목록 (항상 최신 내용을 읽어서 분석):

| 스킬 | 경로 | 역할 |
|------|------|------|
| simon-bot | `~/.claude/skills/simon-bot/SKILL.md` | 19-step 딥 워크플로 (코어) |
| simon-bot-grind | `~/.claude/skills/simon-bot-grind/SKILL.md` | 끈질긴 재시도 변형 |
| simon-bot-pm | `~/.claude/skills/simon-bot-pm/SKILL.md` | 프로젝트 매니저 |
| simon-bot-report | `~/.claude/skills/simon-bot-report/SKILL.md` | 사전 분석 보고서 |
| simon-bot-sessions | `~/.claude/skills/simon-bot-sessions/SKILL.md` | 세션 관리 |

references/ 디렉토리의 하위 파일들도 분석 대상에 포함.

## Step 0: Input Collection

**0-A: 링크 수집**

사용자가 이미 링크를 제공했으면 바로 진행. 아직이면 AskUserQuestion:
> 분석할 링크를 알려주세요. (블로그, GitHub, 논문, 아티클 등 모두 가능)

여러 링크도 가능 — 각각 분석 후 통합.

**0-B: 관심사 확인 (선택)**

사용자가 특별히 관심 있는 영역이 있는지 확인:
> 특별히 관심 있는 개선 영역이 있나요? (없으면 전방위 분석합니다)
> - 워크플로 구조 (단계 추가/제거/순서)
> - 프롬프트/지시문 품질
> - 새로운 기법/도구 도입
> - 에러 처리/안전성
> - 전부 다

사용자가 "전부" 또는 별다른 언급이 없으면 전방위 분석.

## Step 1: Content Extraction

**1-A: 링크 내용 가져오기**

WebFetch로 링크 내용을 가져온다.

- 웹페이지: WebFetch로 본문 추출
- GitHub 레포: 주요 파일들 (README, SKILL.md, workflow 관련 파일) 탐색
- PDF/논문: 가능한 범위 내에서 내용 추출

**1-B: 핵심 내용 정리**

가져온 내용에서 simon-bot 스킬 개선과 관련될 수 있는 핵심 내용을 정리:

```markdown
## Source Summary
- **제목**: ...
- **유형**: 블로그 / GitHub / 논문 / 기타
- **핵심 주제**: ...
- **주요 아이디어** (bullet points):
  - ...
- **관련 기법/패턴/도구**: ...
```

Save: `.claude/boost/source-summary-{slug}.md`

## Step 2: Target Skill Loading (선택적)

분석 전에 대상 스킬들의 현재 상태를 파악하되, 컨텍스트 효율을 위해 선택적으로 로딩한다.

**2-A: 관련 스킬 식별**

Step 1의 자료 요약에서 가장 관련성이 높은 스킬 1-3개를 식별한다:
- 워크플로 구조 관련 → simon-bot (코어)
- 재시도/복구 관련 → simon-bot-grind
- 프로젝트 관리 관련 → simon-bot-pm
- 분석/보고서 관련 → simon-bot-report
- 세션 관리 관련 → simon-bot-sessions

**2-B: 단계적 로딩**

1. 식별된 스킬의 SKILL.md만 먼저 읽기 (references는 아직 읽지 않음)
2. SKILL.md에서 개선 대상 영역을 좁힌 후, 해당 references 파일만 추가 로딩
3. 나머지 스킬은 Step 3 전문가 패널에서 필요 시 개별 전문가가 직접 읽기

**예시:**
- 자료가 "에러 복구 전략"에 관한 것이면:
  - simon-bot SKILL.md + references/error-resilience.md
  - simon-bot-grind SKILL.md + references/grind-error-resilience.md
  - 나머지 스킬은 SKILL.md description만 참조

이 방식으로 컨텍스트 소비를 1/3 이하로 줄이면서도 정확한 분석이 가능하다.

## Step 3: Expert Panel Analysis (Agent Team)

5명의 전문가가 각자의 관점에서 자료를 분석하고, simon-bot 스킬들의 개선점을 찾아냅니다.

**Agent Team 생성:**

### Expert 1: Workflow Architect (워크플로 설계 전문가)

관점: 작업 흐름의 구조적 완성도

분석 항목:
- 단계(Step)의 추가/제거/병합/순서 변경 가능성
- 병렬 실행 최적화 기회
- 불필요한 병목이나 중복 단계 식별
- 새로운 검증 게이트나 체크포인트 도입 가능성
- Phase 간 전환 로직 개선

### Expert 2: Prompt Engineer (프롬프트 엔지니어링 전문가)

관점: 에이전트 지시문의 명확성과 효과

분석 항목:
- 에이전트 역할 정의의 구체성과 명확성
- 지시문의 모호한 부분이나 해석 여지가 큰 부분
- Few-shot 예제 추가가 도움될 부분
- 에이전트 간 커뮤니케이션 프로토콜 개선
- Chain-of-thought, structured output 등 프롬프트 기법 활용 기회

### Expert 3: Innovation Scout (기술 혁신 탐색가)

관점: 새로운 도구, 기법, 방법론의 도입 가능성

분석 항목:
- 자료에서 발견한 새로운 패턴이나 기법 중 도입 가능한 것
- 기존에 없는 검증 방법, 분석 도구, 자동화 기회
- 다른 AI 에이전트 프레임워크의 모범 사례 벤치마킹
- MCP 도구 활용 확장 기회
- 최신 LLM 기능 (extended thinking, agent teams 등) 활용 기회

### Expert 4: Quality & Safety Guardian (품질·안전 전문가)

관점: 에러 처리, 안전장치, 품질 보증의 견고함

분석 항목:
- 에러 복구 전략의 빈틈
- 안전장치(forbidden rules, validation)의 누락
- 롤백/복구 메커니즘 개선
- 컨텍스트 윈도우 관리 전략 개선
- 메모리/상태 관리의 데이터 무결성

### Expert 5: Developer Experience (DX) Specialist (개발자 경험 전문가)

관점: 스킬 사용자(= 개발자)의 경험 품질

분석 항목:
- 사용자 인터랙션 흐름의 자연스러움
- 불필요하게 많은 질문이나 확인 요청
- 진행 상황 보고의 명확성
- 세션 관리/복원의 편의성
- 스킬 간 전환(PM→bot, bot→grind 등)의 매끄러움

**Agent Team Shared Tasks (3단계 토론):**

- **Task 1** (독립 분석): 각 전문가가 자료 + 현재 스킬을 교차 분석하여 개선점 도출
- **Task 2** (교차 토론): 다른 전문가의 발견을 읽고 보강/반박/우선순위 조정 토론
- **Task 3** (합의 도출): 최종 개선 제안 목록을 severity와 영향 범위 기준으로 정리

**Agent Team 해산**

## Step 4: Improvement Report

전문가 패널의 분석 결과를 통합하여 개선 제안 리포트를 생성한다.

### 리포트 구조

```markdown
# simon-bot Boost Report

## Source
- **자료**: [제목](링크)
- **분석일**: YYYY-MM-DD

## Executive Summary
(3-5줄로 핵심 인사이트 요약)

## Improvement Proposals

### [P-001] 제안 제목
- **심각도**: CRITICAL / HIGH / MEDIUM / LOW
- **대상 스킬**: simon-bot, simon-bot-grind, ...
- **대상 파일**: SKILL.md, references/phase-a-planning.md, ...
- **카테고리**: 워크플로 구조 / 프롬프트 품질 / 신기법 도입 / 품질·안전 / DX
- **현재 상태**: (현재 어떻게 되어 있는지)
- **제안 내용**: (구체적으로 무엇을 어떻게 바꿀지)
- **기대 효과**: (왜 이게 더 나은지)
- **근거**: (자료의 어떤 내용에서 착안했는지)
- **전문가 합의**: (어떤 전문가들이 동의했는지, 반대 의견이 있었다면 포함)

### [P-002] ...
(반복)

## Cross-Cutting Observations
(여러 스킬에 공통 적용되는 패턴이나 개선 방향)

## Not Recommended
(자료에서 발견했지만 simon-bot에 맞지 않아 채택하지 않은 아이디어와 그 이유)
```

### 리포트 제시

1. 리포트 전문을 사용자에게 출력
2. Save: `.claude/boost/report-{slug}.md`
3. 각 제안(P-001, P-002, ...)에 대해 사용자의 판단을 요청:

AskUserQuestion:
> 각 제안에 대해 판단해 주세요:
> - **적용**: 해당 제안을 스킬에 반영합니다
> - **보류**: 나중에 다시 검토합니다
> - **기각**: 이 제안은 반영하지 않습니다
> - **수정 후 적용**: 제안을 일부 수정하여 반영합니다
>
> 예: "P-001 적용, P-002 수정 후 적용 (XX 부분은 빼주세요), P-003 기각"

## Step 5: Apply Improvements

사용자가 "적용" 또는 "수정 후 적용"으로 선택한 제안들을 실제 스킬 파일에 반영한다.

**5-A: 변경 계획 수립**

적용할 제안들을 파일별로 그룹핑:
- 같은 파일에 대한 여러 제안은 한 번에 적용
- 변경 순서: references/ 파일 → SKILL.md (의존성 방향)
- 각 변경의 diff 미리보기 준비

**5-B: 변경 미리보기**

실제 적용 전에 각 파일의 변경 사항을 사용자에게 보여준다:

```
📄 ~/.claude/skills/simon-bot/SKILL.md
  - Line 58: Step 1-A에 새로운 분석 항목 추가
  - Line 95: Step 5에 검증 게이트 강화

📄 ~/.claude/skills/simon-bot/references/phase-a-planning.md
  - Section "Step 1-B": 인터뷰 프로토콜 개선
```

AskUserQuestion:
> 위 변경사항을 적용할까요? (전체 적용 / 개별 선택 / 취소)

**5-C: 적용**

사용자 승인 후 Edit 도구로 각 파일 수정. 변경 시 주의사항:
- 기존 스킬의 구조와 톤을 유지
- 새로운 내용이 기존 흐름에 자연스럽게 녹아들도록
- 기존 기능을 깨뜨리지 않도록
- 변경 이유를 주석이 아닌 자연스러운 지시문으로 포함

**5-D: 변경 기록**

적용된 변경사항을 기록:

Save/Append: `.claude/boost/applied-log.md`
```markdown
## [YYYY-MM-DD] {자료 제목}
- **P-001**: {제안 제목} → 적용 (simon-bot SKILL.md, phase-a-planning.md)
- **P-002**: {제안 제목} → 수정 후 적용 (simon-bot-grind SKILL.md)
- **P-003**: {제안 제목} → 기각 (이유: ...)
```

## Step 6: Verification

적용 후 스킬 파일의 무결성을 검증한다.

- 변경된 SKILL.md 파일들의 YAML frontmatter가 유효한지 확인
- references/ 파일 참조 경로가 깨지지 않았는지 확인
- 스킬 간 상호 참조 (simon-bot-grind → simon-bot 등)가 유효한지 확인
- 변경된 파일들을 다시 읽어 의도한 대로 반영되었는지 확인

문제 발견 시 즉시 수정.

## Step 7: Summary

사용자에게 최종 요약 보고:

```markdown
## Boost Complete

**자료**: [제목](링크)
**적용**: N개 제안 반영
**보류**: N개 (추후 재검토)
**기각**: N개

### 적용된 변경 요약
- simon-bot: ... (N개 파일 수정)
- simon-bot-grind: ... (N개 파일 수정)
- ...

### 다음에 확인할 것
- (적용된 변경이 실제 워크플로 실행 시 잘 동작하는지)
- (보류된 제안 재검토 시점)
```

## Global Rules

- 스킬 파일 수정 시 반드시 Read → Edit 순서 (Write로 덮어쓰기 금지)
- 사용자 확인 없이 스킬 파일을 수정하지 않음
- 원본 자료의 내용을 그대로 복사하지 않음 — simon-bot 맥락에 맞게 재해석
- 기존 스킬의 Global Forbidden Rules는 절대 약화시키지 않음
- 적용 기록(applied-log.md)은 항상 유지하여 변경 이력 추적 가능
- 모든 중간/최종 결과물은 `.claude/boost/`에 저장
