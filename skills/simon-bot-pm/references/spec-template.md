# Feature Specification Template

Spec-Driven Development 기반. **WHAT**에 집중하고, HOW(기술 스택, 아키텍처)는 포함하지 않는다.
Phase 1-B에서 이 템플릿으로 `.claude/pm/spec.md`를 생성한다.

---

## Template

```markdown
# Spec: [프로젝트명]

**Status**: Draft | Reviewed | Approved
**Created**: [DATE]

## 1. User Stories & Scenarios

각 스토리는 우선순위(P1, P2, P3)가 있으며, 독립적으로 테스트/배포 가능해야 한다.
P1부터 순서대로 — P1 하나만 구현해도 MVP가 되어야 한다.

### US-1: [제목] (P1)

[사용자 관점에서 이 기능이 필요한 이유]

**Why this priority**: [왜 이 우선순위인지]
**Independent Test**: [이 스토리만으로 가치를 전달하는 방법]

**Acceptance Scenarios**:
1. **Given** [초기 상태], **When** [행동], **Then** [기대 결과]
2. **Given** [초기 상태], **When** [행동], **Then** [기대 결과]

---

### US-2: [제목] (P2)

[설명]

**Why this priority**: [근거]
**Independent Test**: [독립 테스트 방법]

**Acceptance Scenarios**:
1. **Given** [...], **When** [...], **Then** [...]

---

[필요한 만큼 추가]

## 2. Functional Requirements

- **FR-001**: 시스템은 반드시 [구체적 기능]을 해야 한다
- **FR-002**: 사용자는 반드시 [핵심 인터랙션]을 할 수 있어야 한다
- **FR-003**: 시스템은 반드시 [데이터 요구사항]을 충족해야 한다
- **FR-004**: [NEEDS CLARIFICATION: 인증 방식 미정 — email/password, SSO, OAuth?]
- **FR-005**: [NEEDS CLARIFICATION: 데이터 보존 기간 미정]

[NEEDS CLARIFICATION] 마커는 최대 3개. 우선순위: 범위 > 보안 > UX > 기술 디테일.
Phase 1-C 리서치에서 해소한다.

## 3. Edge Cases

- [경계 조건]일 때 어떻게 되는가?
- [에러 시나리오]를 시스템이 어떻게 처리하는가?
- [동시성 이슈]가 발생하면?

## 4. Key Entities (데이터가 관련된 경우)

- **[엔티티 1]**: [의미, 주요 속성 — 구현 디테일 없이]
- **[엔티티 2]**: [의미, 다른 엔티티와의 관계]

## 5. Success Criteria (기술 무관, 측정 가능)

- **SC-001**: [측정 가능한 지표, 예: "사용자가 2분 내에 계정 생성 완료"]
- **SC-002**: [성능 지표, 예: "1000명 동시 접속 시 응답 지연 없음"]
- **SC-003**: [비즈니스 지표, 예: "관련 지원 티켓 50% 감소"]
```

---

## Spec 작성 가이드

### WHAT vs HOW 분리 원칙

| Spec에 포함 (WHAT) | Spec에 미포함 (HOW) |
|-------------------|-------------------|
| 사용자 시나리오 | 기술 스택 |
| 기능 요구사항 | API 설계 |
| 수용 기준 | 데이터베이스 스키마 |
| 성공 지표 | 아키텍처 패턴 |
| 엔티티 관계 (개념적) | 테이블 구조 (물리적) |

이 분리가 중요한 이유: 기술 결정에 영향받지 않는 순수한 요구사항을 먼저 확보해야
CTO/Architect 에이전트가 편향 없이 최적의 기술 결정을 내릴 수 있다.

### [NEEDS CLARIFICATION] 사용법

인터뷰에서 확인되지 않은 항목은 블로킹하지 말고 마커를 붙인다.
Phase 1-C에서 리서치 에이전트가 조사하거나, 사용자에게 추가 확인한다.

```
- **FR-006**: 시스템은 [NEEDS CLARIFICATION: 알림 채널 미정 — email, push, SMS?]을 지원해야 한다
```

### Quality Checklist

Spec 작성 후 자체 검증:

- [ ] 모든 User Story에 우선순위(P1/P2/P3)가 있는가?
- [ ] P1 스토리만으로 MVP가 가능한가?
- [ ] 각 스토리에 Given/When/Then 수용 시나리오가 있는가?
- [ ] Functional Requirements에 기술 구현 디테일이 섞이지 않았는가?
- [ ] [NEEDS CLARIFICATION] 마커가 3개 이하인가?
- [ ] Success Criteria가 측정 가능하고 기술에 무관한가?
- [ ] Edge Cases가 최소 3개 이상 식별되었는가?
