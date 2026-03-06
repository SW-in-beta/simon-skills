# Technical Architecture Decision Process

Phase 1-C에서 사용하는 기술 아키텍처 결정 프로세스.
Feature Spec(WHAT)을 기반으로 HOW를 결정한다.

---

## Expert Panel

기술 결정을 위해 전문가 에이전트 패널을 구성한다.

### 1. CTO Agent (`general-purpose`, architect role)

```
프롬프트 역할:
"당신은 CTO입니다. Feature Spec을 분석하고, 프로젝트 규모와 제약 조건을
고려하여 최적의 기술 스택과 아키텍처를 추천하세요."

입력:
- Feature Spec (.claude/pm/spec.md)
- 사용자가 언급한 기술적 선호/제약
- 프로젝트 규모 예상치

출력:
- 기술 스택 추천 (언어, 프레임워크, DB, 인프라) + 근거
- 아키텍처 패턴 추천 + 근거
- 대안 비교표 (최소 2개 대안)
- 기술적 리스크 식별
```

### 2. Dev Lead Agent (`general-purpose`, dev lead role)

CTO 추천을 검증하는 역할:

```
프롬프트 역할:
"당신은 시니어 개발 리드입니다. CTO의 기술 추천을 검토하고,
구현 관점에서 실현 가능성, 숨겨진 복잡성, 더 나은 대안이 있는지 평가하세요."

입력:
- Feature Spec
- CTO의 추천 결과

출력:
- 실현 가능성 평가
- 숨겨진 복잡성/리스크 지적
- 수정 제안 (있는 경우)
- 최종 동의 or 대안 제시
```

### 3. 사용자 최종 결정

두 에이전트의 의견을 종합하여 사용자에게 제시:

```
## 기술 스택 추천

| 영역 | CTO 추천 | Dev Lead 의견 | 대안 |
|------|---------|--------------|------|
| 언어 | Go 1.24 | 동의 | Python (팀 익숙도 고려 시) |
| 프레임워크 | Gin | 동의, Echo도 가능 | Fiber |
| DB | PostgreSQL | 동의 | - |
| 캐시 | Redis | 규모 고려 시 불필요할 수도 | 없음 (Small 규모) |

CTO 근거: ...
Dev Lead 의견: ...

이 추천을 그대로 사용할까요? 수정하고 싶은 부분이 있으면 말씀해주세요.
```

---

## Tech Stack Decision Framework

사용자가 기술 스택을 모를 때 CTO agent가 활용하는 프레임워크.

### 입력 요소

| 요소 | 분석 방법 |
|------|----------|
| 프로젝트 유형 | Spec의 User Stories에서 추론 (Web? API? CLI? Mobile?) |
| 예상 규모 | Success Criteria의 성능 지표에서 추론 |
| 사용자 역량 | 인터뷰에서 파악 (익숙한 언어/프레임워크) |
| 배포 환경 | 인터뷰에서 파악 (클라우드? 온프레미스?) |
| 시간 제약 | 인터뷰에서 파악 (MVP 기한?) |

사용자가 역량/환경을 언급하지 않았으면 AskUserQuestion으로 확인한다:
> 기술 스택을 추천해드릴게요. 몇 가지 여쭤볼게요:
> 1. 익숙하거나 선호하는 프로그래밍 언어가 있나요?
> 2. 배포 환경은 어떻게 생각하세요? (클라우드, 자체 서버, 아직 미정 등)
> 3. MVP를 언제까지 완성하고 싶으세요?

### 규모별 아키텍처 가이드

| 규모 | 특성 | 추천 패턴 |
|------|------|----------|
| **Small** | 사용자 <1K, 단일 서비스 | 모놀리식, SQLite or PostgreSQL, 단일 서버 |
| **Medium** | 사용자 1K-100K | 모듈러 모놀리스, PostgreSQL + Redis, 로드밸런서 |
| **Large** | 사용자 100K+ | 마이크로서비스, 분산 DB, 메시지 큐, 컨테이너 오케스트레이션 |
| **Enterprise** | 멀티 리전, 고가용성 | 이벤트 드리븐, CQRS, 서비스 메시, 멀티 클러스터 |

과도한 아키텍처 경고: Small 프로젝트에 마이크로서비스를 추천하지 않는다.
"Start simple, scale when needed" 원칙.

---

## Technical Context Template

CTO/Dev Lead 검토 후 확정된 기술 컨텍스트를 `.claude/pm/plan.md`에 기록:

```markdown
## Technical Context

**Language/Version**: [e.g., Go 1.24, Python 3.12, TypeScript 5.x]
**Primary Framework**: [e.g., Gin, FastAPI, Next.js]
**Storage**: [e.g., PostgreSQL 16, Redis 7]
**Testing**: [e.g., go test, pytest, vitest]
**Target Platform**: [e.g., Docker on AWS ECS, Kubernetes]
**Project Type**: [e.g., web-service, cli, library, mobile-app]
**Performance Goals**: [e.g., 1000 req/s, <200ms p95]
**Constraints**: [e.g., <100MB memory, offline-capable]
**Scale/Scope**: [e.g., 10K users, 50 API endpoints]
```

---

## Research Phase

[NEEDS CLARIFICATION] 마커를 리서치로 해소하는 단계.

1. `researcher` 에이전트에게 각 미결 항목 조사 위임
2. 기술 선택에 대한 best practices 조사
3. 결과를 `.claude/pm/research.md`에 정리:

```markdown
## Research: [항목]
- **Decision**: [결정 사항]
- **Rationale**: [근거]
- **Alternatives Considered**: [검토한 대안과 기각 이유]
```

4. 리서치 결과로 Spec의 [NEEDS CLARIFICATION]을 해소하고 spec.md 업데이트

---

## Constitution (Project Principles)

프로젝트 전반에 적용될 원칙. 모든 기술 결정과 구현의 가이드라인.
CTO/Dev Lead 패널이 초안을 제안하고, 사용자가 확정한다.

`.claude/pm/constitution.md`에 저장:

```markdown
# [프로젝트명] Constitution

## Core Principles
1. [원칙 1, 예: "성능보다 가독성 우선"]
2. [원칙 2, 예: "외부 의존성 최소화"]
3. [원칙 3, 예: "모든 API는 버전닝"]

## Quality Gates
- 테스트 커버리지: [목표, 예: 80%]
- 코드 리뷰: [정책, 예: "모든 Feature PR은 architect 리뷰"]
- 보안: [정책, 예: "OWASP Top 10 준수"]

## Constraints
- [기술적 제약]
- [비즈니스 제약]
- [시간 제약]
```

이후 Phase 2-5에서 Constitution을 참조하여 일관된 결정을 내린다.

---

## Constraint Definition

사용자와 인터랙티브하게 제약 조건을 구체화. AskUserQuestion 활용.

### 기술적 제약 (CTO agent가 초안 작성)
- 성능: 응답 시간, 처리량, 동시 접속
- 가용성: SLA, 허용 다운타임
- 보안: 인증 방식, 암호화, 컴플라이언스
- 인프라: 클라우드 제공자, 예산, 리전

### 비즈니스 제약 (사용자에게 직접 확인)
- 일정: MVP 기한, 전체 완료 기한
- 호환성: 기존 시스템과의 연동 요구사항
- 규제: 데이터 보호, 산업 규제
