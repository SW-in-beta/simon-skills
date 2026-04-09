# Full Verification Protocol

Phase 5에서 수행하는 전체 프로젝트 수준 통합 검증의 상세 프로토콜.

## 5-A: Integration (브랜치 통합)

### 통합 전략

1. 메인 작업 브랜치 (PM이 Phase 3에서 생성한 브랜치) 최신화
2. 각 Feature 브랜치를 순서대로 머지:
   - 의존성 순서대로 (하위 → 상위)
   - 충돌 시 즉시 해결 (다음 머지 전에)
3. 모든 머지 완료 후 전체 빌드 + 테스트

### 충돌 해결

```
architect:
  - 충돌 파일 분석
  - 각 Feature의 의도 파악
  - 올바른 해결 방향 결정

executor:
  - architect의 결정에 따라 충돌 해결
  - 해결 후 build + test 확인
```

## 5-B: Full Build & Test

검증 항목:

| 항목 | 명령어 (예시) | 기준 |
|------|-------------|------|
| 빌드 | `npm run build` / `go build ./...` | 성공 (0 exit) |
| 단위 테스트 | `npm test` / `go test ./...` | 0 failures |
| 타입 체크 | `tsc --noEmit` / `mypy` | 0 errors |
| 린트 | `eslint` / `golangci-lint` | 0 errors |

실패 시:
- 원인 분석 → `executor`로 수정
- 수정 후 전체 재검증
- Max 3 rounds

## 5-C: Integration Testing

`general-purpose` 에이전트 (QA tester role)가 수행:

### E2E 시나리오 검증

PRD의 User Stories를 기반으로 E2E 시나리오 구성:

1. **핵심 흐름 (Happy Path)**:
   - 각 User Story의 주요 시나리오
   - Feature 간 데이터 흐름 검증
   - 전체 사용자 여정 워크스루

2. **에러 흐름 (Error Path)**:
   - 잘못된 입력 처리
   - 인증/인가 실패 처리
   - 외부 시스템 장애 시 동작

3. **엣지 케이스**:
   - 경계값 처리
   - 동시성 이슈
   - 빈 데이터/대량 데이터

### Feature 간 연동 검증

- Feature A의 출력이 Feature B의 입력으로 올바르게 전달되는지
- 공유 리소스 (DB, 캐시 등)에 대한 동시 접근
- 이벤트/메시지 전파 검증

## 5-D: Architecture Review

`architect` 에이전트가 전체 프로젝트 수준에서 검증:

### 검증 항목

1. **구조적 일관성**:
   - 모든 Feature가 동일한 아키텍처 패턴을 따르는지
   - 디렉토리 구조의 일관성
   - 네이밍 컨벤션 통일

2. **코드 품질**:
   - 중복 코드 식별 (여러 Feature에서 비슷한 코드 작성 시)
   - 공통 유틸리티 추출 필요 여부
   - 에러 처리 패턴 통일

3. **의존성 방향**:
   - 순환 의존 없는지
   - 레이어 경계 준수 (상위 → 하위만 의존)
   - 인터페이스 추상화 적절성

4. **확장성**:
   - 새 기능 추가 시 영향 범위
   - 설정 가능성 (하드코딩 vs 설정)

### 이슈 분류

| Severity | 기준 | 조치 |
|----------|------|------|
| CRITICAL | 런타임 장애 가능, 보안 취약점 | 즉시 수정 필수 |
| HIGH | 유지보수 심각 저해, 성능 문제 | 수정 권장 |
| MEDIUM | 코드 품질 저하, 컨벤션 불일치 | 사용자 판단 |
| LOW | 개선 제안, 리팩토링 후보 | 기록만 |

## 5-E: Security Review

`security-reviewer` 에이전트가 수행:

### OWASP Top 10 기반 검증

1. **Injection**: SQL, NoSQL, OS 명령어 주입
2. **Broken Authentication**: 세션 관리, 비밀번호 정책
3. **Sensitive Data Exposure**: 로깅, 에러 메시지, 전송 암호화
4. **XXE**: XML 파싱 설정
5. **Broken Access Control**: 권한 검증
6. **Security Misconfiguration**: 기본 설정, 디버그 모드
7. **XSS**: 입력 검증, 출력 인코딩 (프론트엔드)
8. **Insecure Deserialization**: 역직렬화 검증
9. **Using Components with Known Vulnerabilities**: 의존성 취약점
10. **Insufficient Logging & Monitoring**: 보안 이벤트 로깅

### 추가 보안 검증

- API 키/비밀 정보 하드코딩 여부
- .env 파일 gitignore 포함 여부
- CORS 설정 적절성
- Rate limiting 적용 여부

## 5-F: Issue Resolution Loop

```
검증 이슈 수집 (5-B ~ 5-E)
    ↓
Severity 분류
    ↓
CRITICAL/HIGH → executor로 자동 수정
    ↓
수정 완료 → 5-B부터 재검증
    ↓
MEDIUM → 사용자에게 보고 (AskUserQuestion)
    → 수정 요청: executor로 수정 → 재검증
    → 무시: 기록만
    ↓
Max 3 rounds 초과 → 사용자 에스컬레이션
```

## 5-G: Verification Report

`.claude/pm/verification.md` 최종 보고서:

```markdown
# Full Verification Report

## Summary
- 검증 일시
- 검증 결과: PASS / FAIL
- 라운드 수

## Build & Test
- 빌드: PASS/FAIL
- 단위 테스트: N passed, 0 failed
- 타입 체크: PASS/FAIL
- 린트: PASS/FAIL

## Integration Testing
- E2E 시나리오: N/N passed
- Feature 연동: 검증 결과
- 엣지 케이스: 검증 결과

## Architecture Review
- CRITICAL: 0
- HIGH: 0 (모두 수정 완료)
- MEDIUM: N (사용자 결정)
- 주요 findings 목록

## Security Review
- CRITICAL: 0
- HIGH: 0 (모두 수정 완료)
- 주요 findings 목록

## Unresolved Issues
- MEDIUM/LOW 미수정 항목 목록
- 향후 개선 제안
```
