# Phase 5: QA & Integration

## 목차
- [5-A: Test Plan Creation](#5-a-test-plan-creation)
- [5-B: Integration Testing](#5-b-integration-testing)
- [5-C: Performance Testing (해당 시)](#5-c-performance-testing-해당-시)
- [5-D: Security Audit](#5-d-security-audit)
- [5-E: Issue Resolution](#5-e-issue-resolution)
- [5-TRP: Triple Review](#5-trp-triple-review)

전담 QA팀이 전체 시스템을 체계적으로 검증한다. 개별 Feature의 단위 테스트는 Phase 4에서 완료되었으므로, 여기서는 **통합 수준**의 검증에 집중한다.

### 5-A: Test Plan Creation

QA Lead가 PRD 기반 테스트 전략을 수립한다:

```markdown
# Test Plan: [프로젝트명]

## 1. Test Scope
- 대상: [테스트 범위]
- 제외: [테스트하지 않는 영역과 이유]

## 2. Test Strategy

### Unit Tests (Phase 4에서 완료)
- 각 팀이 TDD로 작성 완료
- 커버리지 목표: Constitution에 명시된 기준

### Integration Tests
- Feature 간 연동 테스트
- API Contract 준수 확인
- 데이터 흐름 E2E

### E2E Tests
- 핵심 사용자 시나리오 (User Story별)
- Happy Path + Error Path

### Performance Tests (해당 시)
- 부하 테스트 시나리오
- 응답 시간 기준 (Success Criteria에서)

### Security Tests
- OWASP Top 10 체크
- 인증/인가 경계 테스트
- 입력 검증

## 3. Test Scenarios
[시나리오별 상세]

## 4. Pass Criteria
- 전체 테스트 통과 (0 failures)
- 성능 기준 충족
- 보안 취약점 CRITICAL/HIGH 없음
```

Save: `.claude/company/quality/test-plan.md`

### 5-B: Integration Testing

**5-B-1: Feature 간 연동 검증**

QA 에이전트가 API Contract 기반으로 연동을 검증:
- Backend API → Frontend 호출 패턴 일치 확인
- DB 스키마 → Backend ORM 매핑 정확성
- 이벤트 발행/구독 정합성 (해당 시)

**5-B-2: E2E 시나리오 테스트**

PRD의 User Stories를 기반으로 E2E 시나리오 작성 및 실행:

```
시나리오: 사용자 회원가입 → 로그인 → 메인 기능 사용

1. POST /api/users (회원가입)
   - 입력: { email, password, name }
   - 기대: 201 Created + User 객체
2. POST /api/auth/login (로그인)
   - 입력: { email, password }
   - 기대: 200 OK + JWT 토큰
3. GET /api/dashboard (인증 필요)
   - 헤더: Authorization: Bearer {token}
   - 기대: 200 OK + 대시보드 데이터
```

**5-B-3: Edge Case 검증**
- 잘못된 입력
- 인증 실패
- 동시성 이슈
- 빈 데이터 / 대량 데이터

### 5-C: Performance Testing (해당 시)

Success Criteria에 성능 목표가 있는 경우:

**부하 테스트 시나리오:**
- 동시 사용자 수별 응답 시간 측정
- API 엔드포인트별 처리량 측정
- DB 쿼리 실행 시간 프로파일링

**병목 분석:**
- 느린 쿼리 식별
- N+1 쿼리 감지
- 메모리 사용량 분석

**최적화 제안:**
- 인덱스 추가/변경
- 쿼리 최적화
- 캐싱 전략

### 5-D: Security Audit

**OWASP Top 10 기반 검증:**

1. **Injection**: SQL, NoSQL, OS 명령어 주입 — 파라미터화된 쿼리 사용 확인
2. **Broken Authentication**: 세션 관리, 비밀번호 정책, JWT 검증
3. **Sensitive Data Exposure**: 로깅, 에러 메시지, 전송 암호화
4. **XXE**: XML 파싱 설정 (해당 시)
5. **Broken Access Control**: 권한 검증, IDOR 취약점
6. **Security Misconfiguration**: 기본 설정, 디버그 모드, 불필요한 포트
7. **XSS**: 입력 검증, 출력 인코딩 (프론트엔드)
8. **Insecure Deserialization**: 역직렬화 검증
9. **Known Vulnerabilities**: 의존성 취약점 (npm audit, go vuln check)
10. **Insufficient Logging**: 보안 이벤트 로깅 확인

**추가 보안 점검:**
- API 키/시크릿 하드코딩 여부 (코드 + git history)
- .env 파일 .gitignore 포함 여부
- CORS 설정 적절성
- Rate limiting 적용 여부
- HTTPS 강제 여부

Save: `.claude/company/quality/security-audit.md`

### 5-E: Issue Resolution

```
검증 이슈 수집 (5-B ~ 5-D)
    ↓
Severity 분류 (CRITICAL / HIGH / MEDIUM / LOW)
    ↓
CRITICAL → 담당 팀 즉시 수정 → QA 재검증
HIGH → 담당 팀 수정 → QA 재검증
MEDIUM → 사용자에게 보고 → 수정/무시 결정
LOW → 기록만
    ↓
Max 3 rounds 초과 → 사용자 에스컬레이션
```

Save: `.claude/company/quality/test-report.md`

### 5-TRP: Triple Review

quality-gates.md의 Phase 5 체크리스트 사용.
