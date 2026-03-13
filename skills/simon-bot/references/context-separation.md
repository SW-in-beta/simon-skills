# Cognitive Independence (인지적 독립성)

검증 에이전트가 진정한 독립성을 유지하기 위한 프로토콜. 구조적 분리(별도 subagent)만으로는 부족하다 — 인지적 독립이 필요하다.

> **참조**: 이 프로토콜은 simon-bot/SKILL.md의 Cross-Cutting Protocol이며, Phase B-E의 검증 단계(Step 6, 7, 17)와 simon-bot-grind의 Escalation Ladder, simon-bot-review의 CONNECTED 모드에서 적용된다.

## 핵심 원칙

### 1. Blind-First (독립 분석 우선)

검증자에게 이전 findings/결론을 먼저 보여주지 않는다. 코드/산출물을 독립적으로 분석한 후, 이전 findings와 대조하는 2-phase 프로세스를 따른다.

**적용 패턴:**
- Phase 1 (Blind): 코드/diff만 전달. "이 코드에서 이슈를 독립적으로 찾으라."
- Phase 2 (Cross-check): 이전 findings 공개 + 대조. 일치하면 `[INDEPENDENT-CONFIRM]`, 불일치하면 `[DISPUTED]`.

**적용 대상:**
- Step 7 Verification Layer (P-003) — verifier가 finding 확인 시
- Step 7-A impl-review — 도메인팀이 expert-plan-concerns와 대조 시
- simon-bot-review CONNECTED 모드 — review-sequence.md 읽기 전 diff 분석

**적용 제외:**
- 결정론적 검증 (빌드, 테스트 실행) — 코드 실행으로 확인 가능한 것은 인간 판단이 아니므로 Blind-First 불필요
- SMALL 경로의 경량 리뷰 — 비용 대비 효과 부족

### 2. Adversarial Default (반증 탐색 기본 태도)

검증자의 기본 태도는 "이것이 틀렸을 가능성을 적극 탐색"이다. "맞는지 확인해"가 아니라 "틀린 이유를 찾아라"로 프레이밍한다.

**프롬프트 패턴:**
> "이 finding/구현이 잘못되었을 가능성을 적극적으로 탐색하세요. 확인이 아닌 반증이 당신의 임무입니다."

**적용 대상:**
- Step 7 Verification Layer — verifier 프롬프트
- Step 17 Production Readiness — auditor 프롬프트
- Devil's Advocate agent (Step 7 이후)

### 3. Fresh Subagent (구현 과정 미목격 에이전트)

검증이 필요한 시점에서 구현 과정을 목격하지 않은 새 에이전트를 사용한다. 같은 모델이라도 별도 컨텍스트 윈도우에서 시작하면 다른 관점을 가진다.

**적용 대상:**
- Step 6 Purpose Alignment — plan-summary.md + git diff만 받는 alignment-checker
- Step 17 Production Readiness — plan-summary.md + 최종 diff + verify-commands.md만 받는 auditor
- simon-bot-grind Escalation Ladder — Attempt 4+에서 새 executor, Attempt 7+에서 새 architect+executor

**Fresh Agent에게 전달하는 것:**
- 결과물: 코드 diff, plan-summary.md, 테스트 결과, 에러 메시지
- 사실: 파일 구조, 의존성 관계, 빌드 결과

**Fresh Agent에게 전달하지 않는 것:**
- 추론 과정: "왜 이렇게 구현했는지", "어떤 대안을 검토했는지"
- 이전 에이전트의 판단: findings, severity 평가, 우선순위

### 4. What-not-Why Handoff (결과 전달, 추론 차단)

에이전트 간 핸드오프 시 결과(What)는 전달하되 추론 과정(Why)은 차단한다. 이전 에이전트의 사고 패턴이 새 에이전트를 오염시키지 않도록 한다.

**전달 O (What):**
- 에러 메시지, 실패한 테스트 목록, 빌드 로그
- git diff, 변경된 파일 목록
- plan-summary.md, 요구사항

**차단 X (Why):**
- "이 접근법이 실패한 이유는 ~라고 판단했다"
- "~를 시도했지만 ~때문에 안 됐다"
- inline-issues.md의 추론 부분 (재현 조건은 전달, 해석은 차단)

**적용 대상:**
- simon-bot-grind: Escalation Ladder에서 fresh context spawn 시
- Step 7 → Step 7 Devil's Advocate 전달 시
- Step 18 → Step 19 (simon-bot-review) 전달 시 (Blind-First와 결합)

## 비용 가이드라인

Cognitive Independence 적용은 추가 토큰을 소비한다. 다음 기준으로 비용을 통제한다:

| 상황 | 적용 수준 |
|------|----------|
| CRITICAL/HIGH finding 검증 | Full (Blind-First + Adversarial + Fresh) |
| STANDARD+ 경로의 주요 게이트 (Step 6, 7, 17) | Full |
| SMALL 경로 | Adversarial Default만 (프롬프트 수준) |
| 결정론적 검증 (빌드, 테스트) | 미적용 |
| MEDIUM finding | 미적용 (Verification Layer에서도 CRITICAL/HIGH만) |

## Step × 원칙 적용 매트릭스

어떤 Step에서 어떤 원칙이 적용되는지 빠르게 참조하기 위한 매트릭스:

| Step/상황 | Blind-First | Adversarial Default | Fresh Subagent | What-not-Why |
|-----------|:-----------:|:-------------------:|:--------------:|:------------:|
| Step 5 Test-Spec Gate | - | - | ✓ | ✓ |
| Step 6 Purpose Alignment | - | - | ✓ | ✓ |
| Step 7 Verification Layer | ✓ | ✓ | ✓ | - |
| Step 7 Devil's Advocate | - | ✓ | ✓ | ✓ |
| Step 17 Production Readiness | - | ✓ | ✓ | ✓ |
| Grind Escalation (Attempt 4+) | - | - | ✓ | ✓ |
| Grind Escalation (Attempt 7+) | - | - | ✓ | ✓ |
| simon-bot-review CONNECTED | ✓ | - | - | - |
| SMALL 경로 | - | ✓ (프롬프트만) | - | - |
| 결정론적 검증 (빌드/테스트) | - | - | - | - |
