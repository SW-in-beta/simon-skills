# Constitution: Picstory - 소셜 미디어 웹앱

## Core Principles

1. **사용자 경험 최우선** — 모든 기술적 결정은 사용자가 직관적으로 사용할 수 있는지를 기준으로 판단한다. 기술적 완성도보다 사용자 경험이 우선이다.

2. **모바일 우선 (Mobile-First)** — 모바일 환경에서 먼저 설계하고, 데스크톱으로 확장한다. 소셜 미디어 서비스의 주 사용 환경은 모바일이다.

3. **보안은 타협 불가** — 사용자 인증, 개인정보, 파일 업로드 보안은 편의성을 위해 타협하지 않는다. 모든 API는 인증을 거치고, 입력은 검증하며, 파일은 안전하게 처리한다.

4. **단순함을 유지한다 (KISS)** — 불필요한 기능이나 과도한 엔지니어링을 피한다. 최신순 피드라는 명확한 원칙처럼, 단순하고 예측 가능한 시스템을 지향한다.

5. **점진적 가치 전달** — Walking Skeleton부터 시작하여 매 Sprint마다 동작하는 소프트웨어 증분을 전달한다. 완벽한 한 번의 출시보다 빠른 반복을 추구한다.

---

## Quality Gates

### 코드 품질
- 테스트 커버리지: **80% 이상** (단위 테스트 기준)
- TDD 필수: Red → Green → Refactor 사이클 준수
- TRP(Triple Review Protocol) 3라운드 통과 필수
- 린터/포매터 통과 필수 (ESLint, Prettier, backend linter)
- 타입 안전성: TypeScript strict mode (frontend)

### 보안
- OWASP Top 10 준수
- JWT 토큰 만료 시간 설정 (Access: 15분, Refresh: 7일)
- 비밀번호 해싱 (bcrypt, cost factor 12 이상)
- 파일 업로드 검증 (확장자 + MIME type + 파일 크기)
- SQL Injection, XSS 방지
- CORS 적절한 설정
- Rate limiting 적용 (인증 API: 5회/분, 일반 API: 100회/분)

### 성능
- 피드 첫 화면 로딩: **2초 이내** (LCP 기준)
- 사진 업로드: **5초 이내** (10MB 파일 기준)
- API 응답 시간: **500ms 이내** (P95)
- 알림 전달: **10초 이내**
- 이미지 최적화: 썸네일 자동 생성, WebP 변환

### 접근성
- WCAG 2.1 AA 준수
- 키보드 네비게이션 지원
- 스크린 리더 호환 (시맨틱 HTML, ARIA 라벨)
- 색상 대비 4.5:1 이상
- 이미지 alt 텍스트 필수

### UX
- 반응형 디자인: 375px (모바일) ~ 1440px (데스크톱)
- 에러 상태에서 사용자 친화적 메시지 표시
- 빈 상태(empty state)에 적절한 안내 제공
- 로딩 상태(skeleton/spinner) 표시
- Optimistic UI update (좋아요, 팔로우 등 즉각적 반응)

---

## Constraints

### 기술적 제약
- 웹앱으로 구현 (네이티브 앱 아님)
- 피드 알고리즘: 최신순 고정 (ML 기반 추천 없음)
- 이미지 전용 (동영상 미지원)
- 실시간 알림: SSE 또는 Polling 방식 (WebSocket은 Phase 1 범위 외)

### 비즈니스 제약
- DM(다이렉트 메시지) 기능 없음
- 스토리(24시간 자동 삭제) 기능 없음
- 광고 플랫폼 없음
- 해시태그 시스템 없음 (Phase 1)

### 규모
- 초기 목표 사용자: 수백~수천 명 수준
- 단일 서버 + 외부 스토리지 구성으로 시작
- 수평 확장은 추후 고려

---

## Definition of Ready (DoR)

Feature가 Sprint에 투입되기 전 충족해야 하는 조건:

- [ ] User Story + Acceptance Criteria가 완성되었는가?
- [ ] INVEST 기준을 모두 충족하는가?
- [ ] 의존성이 파악되고 해결 가능한가?
- [ ] API Contract / Data Contract이 정의되었는가?
- [ ] 규모 추정(S/M/L)이 완료되었는가?
- [ ] 파일 소유권이 명확한가?

## Definition of Done (DoD)

Feature가 완료되었다고 판단하기 위한 조건:

- [ ] 모든 Acceptance Criteria의 자동화된 테스트가 통과하는가?
- [ ] 테스트 커버리지 80% 이상인가?
- [ ] 빌드 + 린트가 통과하는가?
- [ ] TDD 사이클(Red-Green-Refactor)을 따랐는가?
- [ ] Contract(API, Data)을 정확히 준수하는가?
- [ ] 파일 소유권을 벗어난 수정이 없는가?
- [ ] 코드 리뷰(TRP R2)를 통과했는가?
- [ ] 기술 부채가 없거나, 있으면 기록되었는가?
