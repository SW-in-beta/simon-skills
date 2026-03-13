# Phase 6: Deployment & Operations

## 목차
- [6-A: CI/CD Pipeline](#6-a-cicd-pipeline)
- [6-B: Containerization](#6-b-containerization)
- [6-C: Infrastructure as Code (해당 시)](#6-c-infrastructure-as-code-해당-시)
- [6-D: Monitoring & Alerting](#6-d-monitoring--alerting)
- [6-E: Operations Readiness](#6-e-operations-readiness)
- [6-F: Deployment Checklist Generation](#6-f-deployment-checklist-generation)
- [6-TRP: Triple Review](#6-trp-triple-review)

DevOps팀이 인프라 코드와 운영 준비를 완성한다.

### 6-A: CI/CD Pipeline

GitHub Actions 기준 예시:

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [checkout, setup, lint]

  test:
    runs-on: ubuntu-latest
    steps: [checkout, setup, test]

  build:
    needs: [lint, test]
    steps: [checkout, setup, build, artifact]

  security:
    needs: [build]
    steps: [dependency-check, secret-scan]

  deploy-staging:
    needs: [security]
    if: github.ref == 'refs/heads/main'
    steps: [deploy-to-staging, smoke-test]

  deploy-production:
    needs: [deploy-staging]
    if: github.ref == 'refs/heads/main'
    environment: production
    steps: [deploy-to-prod, health-check]
```

실제 CI/CD 코드를 `.github/workflows/` 또는 해당 CI 도구의 설정 디렉토리에 생성한다.

### 6-B: Containerization

**Dockerfile (Multi-stage build):**
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on: [db, redis]
  db:
    image: postgres:16-alpine
    volumes: [postgres-data:/var/lib/postgresql/data]
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
  redis:
    image: redis:7-alpine
```

**.dockerignore:**
```
node_modules
.git
.env
*.md
tests/
```

### 6-C: Infrastructure as Code (해당 시)

프로젝트 규모에 따라:
- **Small**: docker-compose만으로 충분
- **Medium**: Terraform으로 클라우드 리소스 정의
- **Large**: Terraform + Kubernetes manifests

기본 Terraform 구조:
```
terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── environments/
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
└── modules/
    ├── networking/
    ├── compute/
    └── database/
```

### 6-D: Monitoring & Alerting

**헬스체크 엔드포인트:**
```
GET /health → { "status": "ok", "version": "1.0.0", "uptime": "..." }
GET /health/ready → { "status": "ok", "db": "connected", "cache": "connected" }
```

**모니터링 설정 (코드로 관리):**

Prometheus rules 예시:
```yaml
groups:
  - name: app-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High 5xx error rate"

      - alert: SlowResponses
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        annotations:
          summary: "P95 latency > 500ms"
```

**4 Golden Signals:**
- **Latency**: 요청 응답 시간 (P50, P95, P99)
- **Traffic**: 초당 요청 수
- **Errors**: 에러 비율 (4xx, 5xx)
- **Saturation**: CPU, 메모리, 디스크, 연결 풀 사용률

### 6-E: Operations Readiness

**런북 (Runbook):**

```markdown
# Runbook: [프로젝트명]

## 장애 시나리오별 대응

### 1. 앱 서버 응답 없음
- 증상: health check 실패, 5xx 급증
- 진단: 로그 확인, 리소스 사용량 확인
- 대응: 1) 재시작 시도, 2) 최근 배포 롤백, 3) 수동 디버깅
- 에스컬레이션: 15분 내 미해결 시 → 온콜 담당자

### 2. DB 연결 실패
- 증상: 500 에러, "connection refused"
- 진단: DB 서버 상태, 연결 풀 사용량
- 대응: 1) 연결 풀 초기화, 2) DB 서버 재시작, 3) 복제본 전환
- 에스컬레이션: 5분 내 미해결 시 → DBA

### 3. 메모리 부족
- 증상: OOM Kill, 느린 응답
- 진단: 메모리 프로파일링, 힙 덤프
- 대응: 1) 스케일 아웃, 2) 메모리 누수 핫픽스, 3) 트래픽 제한
```

**배포 체크리스트:**
```markdown
## Pre-Deploy
- [ ] 모든 테스트 통과 확인
- [ ] 마이그레이션 스크립트 검증
- [ ] 환경 변수 설정 확인
- [ ] 롤백 계획 준비

## Deploy
- [ ] 배포 시작 알림
- [ ] 마이그레이션 실행
- [ ] 애플리케이션 배포
- [ ] 헬스체크 통과 확인
- [ ] 스모크 테스트 통과

## Post-Deploy
- [ ] 모니터링 대시보드 확인
- [ ] 에러율 정상 범위 확인
- [ ] 배포 완료 알림
```

**롤백 절차:**
```markdown
## Rollback Procedure
1. 현재 버전 기록
2. 이전 버전으로 롤백 (docker tag 또는 git revert)
3. DB 마이그레이션 롤백 (필요 시)
4. 헬스체크 + 스모크 테스트
5. 롤백 완료 알림
```

Save: `.claude/company/deployment/` 하위에 각 파일 저장

### 6-F: Deployment Checklist Generation

Phase 6-E 완료 시, 다음 소스를 통합하여 `.claude/company/deployment-checklist.md`를 자동 생성한다:

1. `deployment/infra-blueprint.md`의 환경변수 테이블 → 발급/설정 필요 항목
2. `deployment/runbook.md`의 Pre-Deploy / Post-Deploy 체크리스트
3. `architecture.md`의 외부 서비스 의존성
4. `roster.json`의 활성 팀 정보 (DevOps 활성 → CI/CD 항목, ML 활성 → 모델 배포 항목)

**체크리스트 구조:**
```markdown
# 배포 체크리스트

## Phase A: 코드 준비
- [ ] A-1: [AUTO] 최종 빌드 확인 — `{빌드 명령}`
- [ ] A-2: [AUTO] 전체 테스트 PASS — `{테스트 명령}`
- [ ] A-3: [AUTO] 마이그레이션 파일 무결성 확인

## Phase B: 외부 서비스 설정
- [ ] B-N: [MANUAL|GUIDED] {서비스명} — {필요한 키/설정}

## Phase C: 배포 검증 [blocked-by: Phase B]
- [ ] C-N: [GUIDED] {검증 항목}
```

유형 태그: `[AUTO]` 에이전트 자동 실행, `[MANUAL]` 사용자 직접 수행, `[GUIDED]` 에이전트 명령어 제시 + 사용자 확인.

**Phase B 실행 시 Docs-First Protocol 적용:**

Phase B의 각 항목을 사용자에게 안내할 때, SKILL.md의 Docs-First Protocol을 따른다. 특히:
1. 외부 서비스의 UI 경로·메뉴 구조·설정 절차를 기억에 의존하여 안내하지 않는다. context7 또는 WebFetch로 공식 문서를 먼저 조회한다.
2. 서비스 존속을 WebSearch로 확인한다 (예: CoolSMS → 솔라피 이전, API 버전 변경 등).
3. 조회 실패 시 "공식 문서를 확인하지 못했습니다. 직접 해당 서비스의 대시보드/콘솔에서 확인해주세요"라고 안내한다.

**생성 후 처리:**
1. `state.json`의 `active_checklists`에 파일 경로를 등록한다
2. 사용자에게 1줄 통보: `[Info] deployment-checklist.md 생성 완료 ({N}개 항목). 배포 시작 시 검토하세요.`
3. 사용자가 배포를 시작할 때(resume 등) "불필요한 항목이 있으면 알려주세요"로 한 번 확인한다

체크리스트 형식 상세와 커서 규약은 `operational-protocols.md`의 Checklist Protocol 참조.

### 6-TRP: Triple Review

quality-gates.md의 Phase 6 체크리스트 사용.
