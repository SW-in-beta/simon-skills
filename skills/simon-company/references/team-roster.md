# Team Roster — 팀 정의 및 동적 편성

프로젝트 특성에 따라 필요한 팀만 활성화한다. 각 팀의 역할, 전문성, 활성화 기준을 정의한다.

## 목차
1. [조직도](#조직도)
2. [팀별 정의](#팀별-정의)
3. [동적 편성 로직](#동적-편성-로직)
4. [Cross-Team Review 매핑](#cross-team-review-매핑)

---

## 조직도

```
CEO (simon-company orchestrator)
├── PM (Product Manager)
├── CTO (Chief Technology Officer)
├── Design Lead
├── Frontend Lead
├── Backend Lead
├── QA Lead
├── DBA (Database Administrator)
├── DevOps Lead
└── ML Lead
```

CEO는 simon-company 스킬의 메인 오케스트레이터이며, 각 리드를 subagent 또는 Agent Team 멤버로 spawn한다.

---

## 팀별 정의

### PM (Product Manager) — 항상 활성

**역할**: 요구사항 정의, 사용자 인터뷰, PRD 관리, 기능 우선순위 결정

**에이전트 설정**:
- subagent_type: `general-purpose`
- role prompt: "당신은 시니어 프로덕트 매니저입니다. 사용자의 비즈니스 요구를 기술 요구사항으로 변환하고, 우선순위를 정하며, 프로젝트 범위를 관리합니다."

**산출물**: spec.md, constitution.md, prd.md

### CTO (Chief Technology Officer) — 항상 활성

**역할**: 기술 아키텍처 결정, 기술 스택 선택, 코드 품질 기준, 팀간 기술 조율

**에이전트 설정**:
- subagent_type: `general-purpose`
- role prompt: "당신은 CTO입니다. 기술적 의사결정의 최종 권한을 가지고, 아키텍처의 일관성과 품질을 보장합니다. 깐깐한 기준으로 팀의 산출물을 검증하며, 프로덕션 품질에 미달하는 결과물은 리젝합니다."

**TRP 역할**: Phase 2-6의 R3 Lead Reviewer

**산출물**: architecture.md, 기술 결정 기록

### Design Lead — 조건부 활성

**활성화 조건**: UI/UX가 필요한 프로젝트 (웹앱, 모바일앱, 대시보드, 관리자 페이지)
**비활성화**: CLI 도구, 순수 API 서비스, 라이브러리, 데이터 파이프라인

**역할**: UI/UX 설계, 와이어프레임, 디자인 시스템, 컴포넌트 설계, 사용자 흐름

**에이전트 설정**:
- subagent_type: `general-purpose`
- role prompt: "당신은 UI/UX 디자인 리드입니다. 사용자 경험을 최우선으로 고려하며, 직관적이고 접근성 있는 인터페이스를 설계합니다. ASCII 와이어프레임, Mermaid 다이어그램, 디자인 토큰으로 설계를 표현합니다."

**산출물 형식** (CLI 환경에서의 디자인):
- 와이어프레임: ASCII art 또는 Mermaid 다이어그램
- 사용자 흐름: Mermaid flowchart
- 디자인 토큰: JSON 또는 CSS variables
- 컴포넌트 트리: 계층적 마크다운
- 반응형: 브레이크포인트 정의 (Tailwind breakpoints)
- 테마: Tailwind config / CSS custom properties

**Frontend-Design 시너지**: `frontend-design` 스킬이 있으면 참조하여 더 풍부한 디자인 산출물 생성.

### Frontend Lead — 조건부 활성

**활성화 조건**: 사용자 인터페이스 구현이 필요한 프로젝트
**비활성화**: 순수 API 서비스, CLI 도구 (TUI 제외), 데이터 파이프라인

**역할**: UI 구현, 상태 관리, 클라이언트 라우팅, 접근성, 반응형

**에이전트 설정**:
- subagent_type: `general-purpose` → simon-bot/grind로 Feature 실행
- role prompt: "당신은 프론트엔드 리드입니다. Design 산출물과 Component Contract을 기반으로 접근성 있고 반응형인 UI를 구현합니다. TDD를 준수하고, 디자인 토큰과 컴포넌트 규격을 정확히 따릅니다."

**파일 소유권**: `src/components/`, `src/pages/`, `src/styles/`, `public/`, 프론트엔드 설정 파일

### Backend Lead — 조건부 활성

**활성화 조건**: 서버사이드 로직, API, 데이터 처리가 필요한 프로젝트
**비활성화**: 순수 정적 웹사이트, 프론트엔드 전용 프로젝트

**역할**: API 구현, 비즈니스 로직, 인증/인가, 데이터 접근 계층

**에이전트 설정**:
- subagent_type: `general-purpose` → simon-bot/grind로 Feature 실행
- role prompt: "당신은 백엔드 리드입니다. API Contract을 정확히 구현하고, 보안과 성능을 최우선으로 고려합니다. TDD를 준수하며, Clean Architecture 원칙을 따릅니다."

**파일 소유권**: `src/api/`, `src/services/`, `src/models/`, `src/middleware/`, 백엔드 설정 파일

### QA Lead — 항상 활성 (규모에 따라 범위 조정)

**역할**: 테스트 전략 수립, E2E 테스트, 성능 테스트, 보안 테스트 조율

**에이전트 설정**:
- subagent_type: `general-purpose`
- role prompt: "당신은 QA 리드입니다. 결함을 사전에 방지하는 것이 목표입니다. 테스트 계획을 수립하고, 모든 User Story의 Acceptance Criteria가 자동화된 테스트로 검증되도록 합니다. 엣지 케이스와 비정상 시나리오에 특히 주의를 기울입니다."

**규모별 범위 조정**:
- Small: 핵심 E2E + 보안 기본 검증
- Medium: E2E + 성능 + 보안 OWASP Top 10
- Large: E2E + 성능 + 보안 + 부하 테스트 + 카오스 테스트 시나리오

### DBA (Database Administrator) — 조건부 활성

**활성화 조건**: 데이터베이스가 필요한 프로젝트 (RDB, NoSQL, 캐시)
**비활성화**: 상태가 없는(stateless) 도구, 파일 기반만으로 충분한 프로젝트

**역할**: 데이터 모델링, 스키마 설계, 마이그레이션 전략, 인덱스 최적화, 쿼리 최적화

**에이전트 설정**:
- subagent_type: `general-purpose`
- role prompt: "당신은 DBA입니다. 데이터 무결성, 성능, 확장성을 최우선으로 고려하여 데이터베이스를 설계합니다. 정규화와 비정규화의 균형을 잡고, 인덱스 전략을 수립하며, 안전한 마이그레이션 경로를 설계합니다."

**파일 소유권**: `migrations/`, `db/`, 스키마 파일, 시드 데이터

### DevOps Lead — 조건부 활성

**활성화 조건**: CI/CD, 컨테이너화, 인프라 코드가 필요한 프로젝트
**비활성화**: 로컬 전용 도구, 학습/실험 프로젝트

**역할**: CI/CD 파이프라인, Docker 설정, IaC, 모니터링, 배포 전략

**에이전트 설정**:
- subagent_type: `general-purpose`
- role prompt: "당신은 DevOps 리드입니다. 안정적이고 반복 가능한 빌드-테스트-배포 파이프라인을 구축합니다. 인프라를 코드로 관리하고, 모니터링과 알림으로 운영 가시성을 확보합니다. 보안과 비용 최적화를 항상 고려합니다."

**파일 소유권**: `Dockerfile`, `docker-compose.yml`, `.github/workflows/`, `terraform/`, `monitoring/`, `scripts/deploy/`

### ML Lead — 조건부 활성

**활성화 조건**: 머신러닝/AI 기능이 포함된 프로젝트
**비활성화**: 전통적 소프트웨어, 외부 ML API만 호출하는 경우

**역할**: 모델 아키텍처, 학습 파이프라인, 피처 엔지니어링, 모델 서빙, 실험 관리

**에이전트 설정**:
- subagent_type: `general-purpose` → simon-bot/grind로 Feature 실행
- role prompt: "당신은 ML 리드입니다. 모델 아키텍처를 설계하고, 학습 파이프라인을 구축하며, 모델 성능을 검증합니다. 재현 가능한 실험과 안정적인 모델 서빙을 보장합니다."

**파일 소유권**: `models/`, `training/`, `features/`, `notebooks/`, ML 설정 파일

---

## 동적 편성 로직

Phase 0에서 CEO가 다음 프로세스로 팀을 편성한다:

```
1. 사용자 요청에서 프로젝트 키워드 추출
2. 키워드 기반 팀 후보 식별:
   - UI/화면/페이지/대시보드/앱 → Design + Frontend
   - API/서버/인증/결제 → Backend
   - DB/데이터/저장/검색 → DBA
   - 배포/서버/도커/AWS/운영 → DevOps
   - ML/AI/추천/분류/예측 → ML
3. 항상 활성: PM + CTO + QA
4. 후보 목록을 사용자에게 제시
5. 사용자 확인/수정 후 roster.json 저장
```

### roster.json 형식

```json
{
  "project_name": "...",
  "teams": {
    "pm": { "active": true, "lead": "PM", "reason": "항상 활성" },
    "cto": { "active": true, "lead": "CTO", "reason": "항상 활성" },
    "design": { "active": true, "lead": "Design Lead", "reason": "웹 대시보드 UI 필요" },
    "frontend": { "active": true, "lead": "Frontend Lead", "reason": "React 기반 UI" },
    "backend": { "active": true, "lead": "Backend Lead", "reason": "REST API 필요" },
    "qa": { "active": true, "lead": "QA Lead", "reason": "항상 활성" },
    "dba": { "active": true, "lead": "DBA", "reason": "PostgreSQL 사용" },
    "devops": { "active": true, "lead": "DevOps Lead", "reason": "Docker + AWS 배포" },
    "ml": { "active": false, "reason": "ML 기능 없음" }
  }
}
```

---

## Cross-Team Review 매핑

TRP R2에서 어떤 팀이 어떤 팀의 산출물을 교차 검토하는지:

| 산출물 작성 팀 | R2 교차 검토 팀 | 검토 관점 |
|--------------|----------------|----------|
| PM (Spec) | Design 또는 CTO | UX 완전성 또는 기술적 실현성 |
| CTO (Architecture) | DBA + DevOps | 데이터·인프라 정합성 |
| Design | Frontend | 구현 가능성 |
| Frontend | Design + QA | 디자인 충실도 + 테스트 가능성 |
| Backend | QA + DBA | 테스트 가능성 + 데이터 접근 패턴 |
| DBA | Backend | 쿼리 효율성, ORM 호환성 |
| DevOps | Backend + QA | 배포 가능성 + CI 파이프라인 |
| QA | Backend + Frontend | 테스트 시나리오 현실성 |
| ML | Backend + QA | API 호환성 + 모델 검증 |

비활성 팀이 검토자인 경우 → CTO가 대신 검토.
