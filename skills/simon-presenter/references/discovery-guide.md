# Phase 1: 스펙 발견 및 프로젝트 심층 분석 가이드

## 목차

- [1.1 모드 감지](#11-모드-감지)
- [1.2 스펙 파일 탐색](#12-스펙-파일-탐색)
- [1.3 스펙 분석](#13-스펙-분석)
- [1.4 프로젝트 심층 탐색](#14-프로젝트-심층-탐색)
  - [라우트 & 페이지 구조](#라우트--페이지-구조)
  - [UI 컴포넌트 & 셀렉터](#ui-컴포넌트--셀렉터)
  - [인증 & 권한 플로우](#인증--권한-플로우)
  - [API 엔드포인트 & 데이터 흐름](#api-엔드포인트--데이터-흐름)
  - [DB 스키마 & 시드 데이터](#db-스키마--시드-데이터)
  - [환경 변수 & 설정](#환경-변수--설정)
  - [기동 & 빌드](#기동--빌드)
- [1.5 분석 결과 정리](#15-분석-결과-정리)
- [1.6 유저스토리별 코드 플로우 추적](#16-유저스토리별-코드-플로우-추적)

---

## 1.1 모드 감지

먼저 simon-company/simon-bot-pm의 산출물이 존재하는지 확인한다.

- **CONNECTED 모드**: `.claude/company/` 또는 `.claude/pm/` 디렉토리가 있으면 기존 산출물(spec, contracts, architecture, task results)을 최대한 활용한다. 이미 정리된 유저스토리, API 계약, DB 스키마를 다시 분석할 필요 없다.
- **STANDALONE 모드**: 산출물 없이 프로젝트 코드만 있는 경우. 스펙과 구조를 모두 직접 분석해야 한다.

## 1.2 스펙 파일 탐색

다음 순서로 스펙 파일을 찾는다:

1. `.claude/company/spec.md` (simon-company 산출물)
2. `.claude/pm/spec.md` (simon-bot-pm 산출물)
3. `.claude/pm/prd.md` (PRD 문서)
4. 프로젝트 루트의 `spec.md`, `SPEC.md`, `PRD.md`

스펙을 찾지 못하면 사용자에게 경로를 물어본다.

## 1.3 스펙 분석

스펙에서 추출할 정보:
- **유저스토리 목록**: ID, 제목, persona, action, value
- **수용 기준(AC)**: Given/When/Then 형식
- **핵심 기능**: 시연 가능한 UI 인터랙션
- **기술 스택**: 프레임워크, DB, API 구조 (서버 기동 방법 결정용)

## 1.4 프로젝트 심층 탐색

스펙만으로는 시연 스크립트를 쓸 수 없다. 실제 코드를 탐색하여 앱이 **어떻게 동작하는지** 파악해야 한다. 아래 항목들을 병렬로 탐색한다 (Explore 서브에이전트 활용 권장).

### 라우트 & 페이지 구조
앱에 어떤 URL이 존재하고, 각 URL에 어떤 화면이 렌더링되는지 파악한다.
- **Next.js App Router**: `app/` 디렉토리의 `page.tsx`, `layout.tsx` 파일 트리
- **Next.js Pages Router**: `pages/` 디렉토리 구조
- **React Router / Vue Router**: 라우터 설정 파일 (`routes.tsx`, `router/index.ts` 등)
- **결과물**: URL → 페이지 컴포넌트 매핑 테이블

### UI 컴포넌트 & 셀렉터
Playwright가 실제로 상호작용할 요소들의 셀렉터를 파악한다.
- `data-testid`, `aria-label`, `role` 속성이 있으면 우선 활용
- 주요 폼 필드의 `name`, `id`, `placeholder` 속성
- 네비게이션 메뉴, 버튼, 모달, 드롭다운 등 인터랙션 가능한 요소
- 기존 E2E 테스트 파일(`*.spec.ts`, `*.e2e.ts`, `cypress/`)이 있으면 반드시 읽는다 — 검증된 셀렉터와 유저 플로우의 보고

### 인증 & 권한 플로우
대부분의 앱은 로그인이 필요하다. 시연에서 인증을 건너뛸 수 없으므로:
- 로그인 페이지 위치와 폼 필드 (이메일/비밀번호, OAuth 등)
- 회원가입 플로우 (시연용 계정을 직접 만들어야 하는지)
- 인증 방식 (JWT, 세션, NextAuth, Supabase Auth 등)
- 테스트/시드 계정이 있는지 (`seed.ts`, `.env.example`의 `ADMIN_EMAIL` 등)
- 역할 기반 접근 (admin vs user) — 시연에 어떤 역할이 필요한지

### API 엔드포인트 & 데이터 흐름
시연 중 보여줄 데이터가 어디서 오는지 이해한다.
- API 라우트 파일 (`app/api/`, `pages/api/`, 또는 별도 백엔드)
- 주요 엔드포인트의 요청/응답 구조 (타입 정의, Zod 스키마 등)
- 외부 API 의존성 (결제, 지도, AI 등) — 모킹 대상 식별
- 실시간 통신 (WebSocket, SSE, polling) — 엔드포인트와 메시지 포맷

### DB 스키마 & 시드 데이터
시드 데이터를 정확히 만들려면 스키마를 알아야 한다.
- ORM 스키마 (`prisma/schema.prisma`, `drizzle/schema.ts`, TypeORM 엔티티 등)
- 마이그레이션 파일 — 현재 스키마 상태 확인
- 기존 시드 스크립트 (`prisma/seed.ts`, `scripts/seed.*`)
- 필수 관계 (FK 제약) — 데이터 삽입 순서

### 환경 변수 & 설정
앱을 띄우려면 어떤 설정이 필요한지 파악한다.
- `.env.example`, `.env.local`, `.env.development` 파일
- 필수 vs 선택 환경 변수 구분
- 외부 서비스 키 (DB URL, API key 등) — 시연용 대안 필요 여부
- Docker Compose 파일 — DB 등 의존 서비스 기동 필요 여부

### 기동 & 빌드
앱을 실제로 띄우는 정확한 방법을 파악한다.
- `package.json`의 scripts (`dev`, `start`, `build`)
- 패키지 매니저 (npm, yarn, pnpm, bun) — lock 파일로 판별
- 모노레포 여부 (turborepo, nx, lerna) — 어느 패키지를 기동할지
- 포트 설정 (기본 포트, 환경 변수로 변경 가능 여부)
- 의존 서비스 (Redis, PostgreSQL 등) — Docker로 띄울지 로컬인지

## 1.5 분석 결과 정리

탐색 결과를 `.claude/presenter/discovery.md`에 정리한다. 이 문서는 Phase 2-4에서 계속 참조하는 기반 자료다.

```markdown
# 프로젝트 분석: [프로젝트명]

## 기동 방법
- 패키지 매니저: [npm/yarn/pnpm/bun]
- 기동 명령어: [npm run dev]
- 포트: [3000]
- 의존 서비스: [PostgreSQL via Docker Compose]
- 필수 환경 변수: [DATABASE_URL, NEXTAUTH_SECRET, ...]

## 라우트 맵
| URL | 페이지 | 인증 필요 | 비고 |
|-----|--------|----------|------|
| / | 랜딩 페이지 | 아니오 | |
| /login | 로그인 | 아니오 | |
| /dashboard | 대시보드 | 예 | 메인 화면 |
| ... | ... | ... | ... |

## 인증
- 방식: [NextAuth + Credentials]
- 테스트 계정: [seed.ts에서 생성, admin@test.com / password123]
- 역할: [ADMIN, USER]

## 핵심 셀렉터
| 요소 | 셀렉터 | 페이지 |
|------|--------|--------|
| 로그인 이메일 필드 | input[name="email"] | /login |
| 로그인 버튼 | button[type="submit"] | /login |
| ... | ... | ... |

## API 엔드포인트
| 메서드 | 경로 | 설명 | 모킹 필요 |
|--------|------|------|----------|
| GET | /api/users | 사용자 목록 | 아니오 |
| POST | /api/chat | AI 채팅 | 예 (외부 API) |
| WS | /ws/notifications | 실시간 알림 | 예 |

## DB 스키마 요약
[주요 테이블과 관계, 시드 데이터 삽입 순서]

## 모킹 대상
[외부 API, 스트리밍 엔드포인트 등 모킹이 필요한 항목]
```

## 1.6 유저스토리별 코드 플로우 추적

정적 구조 파악 후, 각 유저스토리가 코드상에서 **어떻게 실현되는지** 동적 플로우를 추적한다. 이것이 없으면 시연 시나리오가 "이 버튼을 누르면 뭔가 되겠지"라는 추측에 기반하게 되고, 더미 데이터도 엉뚱한 형태로 만들게 된다.

각 유저스토리에 대해 사용자 동작 → 코드 실행 경로를 끝까지 따라간다:

```
## 플로우: US-001 "사용자가 주문을 생성한다"

### 사용자 동작 경로
/products → 상품 클릭 → /products/[id] → "장바구니 담기" → /cart → "주문하기"

### 코드 실행 흐름
1. [UI] ProductCard onClick → addToCart(productId)
   - 컴포넌트: src/components/ProductCard.tsx:42
   - 상태 관리: useCartStore (zustand) → cart.items에 추가

2. [UI] CartPage "주문하기" onClick → createOrder()
   - 컴포넌트: src/app/cart/page.tsx:87
   - 유효성 검사: 수량 > 0, 재고 확인

3. [API] POST /api/orders
   - 핸들러: src/app/api/orders/route.ts:15
   - 인증: getServerSession() → userId 추출
   - 비즈니스 로직: 재고 차감 → 주문 생성 → 결제 요청

4. [DB] 트랜잭션
   - INSERT INTO orders (user_id, total, status) VALUES (...)
   - INSERT INTO order_items (order_id, product_id, quantity) VALUES (...)
   - UPDATE products SET stock = stock - quantity WHERE id = ...

5. [외부 API] 결제 게이트웨이 호출 (모킹 필요)
   - POST https://api.payment.com/v1/charges
   - 응답: { id: "charge_xxx", status: "succeeded" }

6. [응답] → UI 갱신
   - 성공: /orders/[orderId]로 리다이렉트
   - 화면: 주문 확인 페이지 (주문번호, 상품목록, 결제 금액)

### 시연을 위한 사전 데이터
- products 테이블: 최소 5개 상품 (이미지, 가격, 재고)
- users 테이블: 로그인할 사용자 1명
- 결제 API: 항상 성공 응답 모킹

### 핵심 관찰 포인트
- 장바구니 담을 때 우측 상단 뱃지 숫자 변경
- 주문 후 재고 실시간 감소 (다른 탭에서 확인 가능)
```

**추적 방법:**
- 페이지 컴포넌트에서 시작하여 onClick/onSubmit 핸들러를 따라간다
- API 호출 → 서버 핸들러 → DB 쿼리/ORM 호출까지 끝까지 추적
- 외부 API 호출 지점을 식별하여 모킹 대상으로 표시
- 응답 후 UI가 어떻게 갱신되는지 (리다이렉트, 상태 변경, 리패치 등) 확인
- 실시간 기능이 있으면 이벤트 발행 → 구독 → UI 반영 경로까지 추적

**이 과정에서 발견할 것들:**
- 시연에 필요한 **정확한 사전 데이터** (어떤 테이블에 어떤 형태의 데이터가 있어야 하는지)
- **모킹 대상의 정확한 인터페이스** (요청/응답 형태)
- **화면에서 관찰할 수 있는 변화** (시연에서 강조할 포인트)
- **잠재적 실패 지점** (인증 만료, 외부 API 타임아웃 등)

모든 유저스토리의 플로우 추적 결과를 `.claude/presenter/discovery.md`의 별도 섹션에 추가한다.

이 분석이 충분히 되어야 Phase 2에서 정확한 시나리오를 쓸 수 있다. 분석이 불완전하면 시연이 실패하므로, 불확실한 부분은 사용자에게 확인한다.
