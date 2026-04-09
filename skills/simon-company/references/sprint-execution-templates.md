# Sprint Execution Templates

Sprint 실행 시 simon-pm 위임 및 Review/Retro에 사용하는 템플릿.

---

## simon-pm 위임 프롬프트

```
이 Sprint의 Feature를 구현해주세요.

## Sprint {N} Feature 목록
| Feature ID | 이름 | 담당 팀 | 규모 | Bot |
|------------|------|---------|------|-----|
| F4 | 사용자 인증 API | Backend | M | simon |
| F5 | 메인 화면 UI | Frontend | L | simon-grind |
| F6 | 상품 API | Backend | M | simon |

## 실행 순서
- 병렬 가능: [F4, F6] (독립적)
- F5는 F4 완료 후 실행 (인증 API 의존)

## Task Spec 경로
- .claude/company/tasks/F4/spec.md
- .claude/company/tasks/F5/spec.md
- .claude/company/tasks/F6/spec.md

## Sprint Shared Context (필수 읽기)
- .claude/company/sprints/sprint-{N}/shared-context.md
- 이 파일에 External Schemas, Active Contracts, 다른 팀의 진행 상황이 모두 포함
- **모든 Feature Bot은 구현 시작 전 이 파일을 반드시 Read 도구로 읽어야 한다**

## Contract 내용 (경로 참조가 아닌 인라인)
각 Feature의 Task Spec에 Context Bundle 섹션이 있다. 이 섹션에는 해당 Feature와 관련된 계약 내용이 인라인으로 포함되어 있다. Bot은 경로를 참조하는 대신 Task Spec의 Context Bundle을 직접 읽는다.

원본 계약 파일 (CEO가 Context Bundle 구성 시 참조):
- API: .claude/company/contracts/api-spec.md
- Data: .claude/company/contracts/data-contracts.md
- Component: .claude/company/contracts/component-contracts.md (FE)
- External Schemas: .claude/company/external-schemas.md

## Ground Rules (constitution.md에서 추출)
아래 규칙은 이 프로젝트의 절대 기준이다. 모든 코드 변경은 이 규칙을 준수해야 한다.
위반 시 DoD를 통과할 수 없다.

### Quality Gates
{constitution.md의 Quality Gates 섹션 전문}

### Core Principles
{constitution.md의 Core Principles 섹션 전문}

### Constraints
{constitution.md의 Constraints 섹션 전문}

## Pre-Implementation Verification (모든 Feature Bot 필수)
코드 작성을 시작하기 전에 반드시 수행:
1. **Task Spec의 Spec Reference(User Story + AC)를 Read** — 이 Feature가 "무엇을 왜" 만드는지 확인 (SDD 원칙)
2. Sprint Shared Context 파일을 Read 도구로 읽고, 다른 팀의 진행 상황과 Integration Notes 확인
3. Task Spec의 Context Bundle에 포함된 계약 내용 확인
4. DBA/Backend: `\d table_name`으로 실제 DB 스키마 조회 → Context Bundle의 External Schema와 대조
5. 의존 Feature가 있으면: result.md를 Read 도구로 읽고 Integration Notes/Discovered Constraints 확인
6. 불일치 발견 시: 구현 중단 → CEO에게 보고

## Feature 완료 시 필수 작업
1. `.claude/company/tasks/{feature-id}/result.md`를 Structured Result Template 형식으로 작성
2. Sprint Shared Context의 Team Progress 섹션에 항목 추가 (Integration Notes, Discovered Constraints 포함)
3. DoD 1차 검증 (R1 Self-Review)

## 팀별 필수 읽기 파일 및 검증
### Frontend
- **반드시 Read**: Sprint Shared Context → Backend 팀의 API Endpoints 확인
- **반드시 Read**: Task Spec의 Context Bundle → Component Contract (Props, States, 토큰)
- Design 산출물: .claude/company/design/
- 디자인 토큰: .claude/company/design/tokens.json
- 접근성 요구사항: .claude/company/design/accessibility.md
- **frontend-design 스킬 사용 필수**: UI 컴포넌트/페이지 구현 시 `frontend-design` 스킬을 반드시 적용하여 프로덕션 수준의 고품질 디자인을 보장한다. 제네릭한 AI 스타일이 아닌 창의적이고 세련된 인터페이스를 생산해야 한다.
- **디자인 토큰 준수 필수**: 모든 색상은 CSS 변수 토큰(`bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `bg-destructive` 등)을 사용한다. Tailwind 기본 색상(`bg-zinc-900`, `bg-blue-600`, `text-red-500`)이나 하드코드 hex 값을 직접 사용하면 Component Contract 위반이다. 외부 브랜드 색상만 예외로 허용하되, 가능하면 CSS 변수로 정의한다.
- **접근성 필수**: 아이콘 전용 버튼에 `aria-label`, 동적 콘텐츠에 `aria-live`, 호버 전용 인터랙션 금지(모바일 접근 불가), 빈/에러/로딩 상태 UI 구현 필수. 이 항목들은 DoD에 포함되며 Cross-Review에서 검증한다.

### Backend
- **반드시 Read**: Sprint Shared Context → DBA 팀의 DB Changes 확인
- **반드시 Read**: Task Spec의 Context Bundle → API Contract + Data Contract
- **반드시 실행**: `\d table_name`으로 실제 DB 스키마 확인 → NOT NULL 컬럼, DEFAULT 값 대조
- DB 마이그레이션이 적용된 상태에서 작업

### DBA
- **반드시 Read**: Sprint Shared Context → External Schemas 섹션
- **반드시 Read**: Task Spec의 Context Bundle → External Schema Reference
- **반드시 실행**: `\d table_name`으로 외부 테이블(auth.users 등) 스키마 확인
- db-schema.md의 설계를 마이그레이션 파일로 구현
- 롤백 가능한 마이그레이션 작성
- Seed 데이터 작성 시: 모든 NOT NULL 컬럼에 대해 값 또는 DEFAULT 존재 확인
- 인덱스 생성 포함

### DevOps
- **반드시 Read**: Sprint Shared Context → 전체 팀 진행 상황
- infra-blueprint.md의 설계를 코드로 구현
- 보안 베스트 프랙티스 준수 (시크릿 하드코딩 금지)
- 멀티스테이지 Docker 빌드

### ML
- **반드시 Read**: Sprint Shared Context → Backend API Endpoints
- ml-architecture.md의 설계를 구현
- 재현 가능한 학습 파이프라인
- 모델 API는 api-spec.md의 ML 엔드포인트를 준수

## 파일 소유권
{각 Feature의 File Ownership 섹션 — 팀 간 파일 충돌 방지}
```

---

## Sprint Review — Cross-Review 흐름 예시

```
SendMessage 흐름:
  CEO → all: "Sprint {N} Review 시작. 각 팀은 구현 결과를 보고하고, 관련 팀의 Contract 준수를 검증해주세요.
              Sprint Shared Context(.claude/company/sprints/sprint-{N}/shared-context.md)의 Team Progress를 참고하세요."
  BE Lead → all: "F4 사용자 인증 API 완료. POST /api/auth/login, POST /api/auth/register 구현.
                  API Contract 준수 확인. result.md 작성 완료. Shared Context 업데이트 완료."
  FE Lead → BE Lead: "F5에서 /api/auth/login 호출 테스트 완료. Response 형식 계약 준수 확인.
                      BE의 Shared Context Integration Notes에 명시된 409 에러 핸들링 구현 완료."
  DBA Lead → BE Lead: "users 테이블 → User API 응답 매핑 Data Contract 준수 확인.
                       External Schema Contract 대비 실제 스키마 정합성 확인 — `\d auth.users` 결과와 일치."
  CTO → all: "아키텍처 검토 완료. JWT 구현이 설계 문서와 일치. 보안 가이드라인 준수.
              Sprint Shared Context의 Discovered Constraints 항목 검토 — 향후 Sprint 계약에 반영 필요 사항 2건 식별."
```

**Review 완료 후 CEO 필수 작업:**
1. Sprint Shared Context의 Cross-Team Issues 섹션에 Review에서 발견된 이슈 기록
2. Discovered Constraints 중 계약 수정이 필요한 항목 → 원본 계약 파일 업데이트
3. 다음 Sprint의 Shared Context 초기화 시 이번 Sprint의 이슈를 참조

---

## Sprint Demo 보고 형식

```markdown
## Sprint N 결과

### 완료된 Feature:
| Feature | Team | Status | Key Changes |
|---------|------|--------|-------------|
| F4: 사용자 인증 | Backend | DONE | JWT 기반 인증 구현 |
| F5: 메인 화면 | Frontend | DONE | 대시보드 레이아웃 |

### Cross-Review 결과 (Agent Team):
- BE↔FE Contract: PASS (API 응답 형식 일치)
- BE↔DBA Contract: PASS (데이터 매핑 일치)
- CTO Architecture Review: PASS

### 통합 검증 결과:
- Build: PASS
- Tests: 45/45 passed
- 연동 테스트: 3/3 passed

### 미완료/이슈:
- F6: 병렬 처리 이슈로 지연 → Sprint N+1로 이월
```

---

## Sprint Retrospective — Keep/Problem/Try 예시

```
CEO → all: "Sprint {N} Retro 시작. Keep/Problem/Try 각 1개씩 공유해주세요."
BE Lead: "Keep: Task Spec이 명확해서 구현이 수월. Problem: F4-F5 의존성으로 FE 대기 시간 발생. Try: Mock API를 먼저 제공."
FE Lead: "Keep: Component Contract 덕분에 디자인 반영 정확. Problem: BE API 지연으로 대기. Try: API Mock 선행 제공."
CTO: "Keep: Ground Rules가 코드 품질을 유지. Problem: 통합 테스트가 Sprint 마지막에 몰림. Try: CI에서 Feature별 통합 테스트 자동화."
```
