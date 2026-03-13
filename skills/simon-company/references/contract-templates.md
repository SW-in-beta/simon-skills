# Contract Templates

팀 간 인터페이스 계약 정의 시 사용하는 템플릿 모음.

---

## API Contract (Backend ↔ Frontend, Backend ↔ ML)

OpenAPI 형식으로 정의:

```markdown
## API Contract

### POST /api/users
- Request Body:
  ```json
  { "email": "string", "password": "string", "name": "string" }
  ```
- Response 201:
  ```json
  { "id": "uuid", "email": "string", "name": "string", "createdAt": "datetime" }
  ```
- Response 400:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "string", "details": [...] } }
  ```
- Response 409:
  ```json
  { "error": { "code": "DUPLICATE_EMAIL", "message": "string" } }
  ```

### Error Response Format (공통)
모든 에러는 동일한 형식을 따른다:
```json
{ "error": { "code": "ERROR_CODE", "message": "Human readable message", "details": [] } }
```
```

Save: `.claude/company/contracts/api-spec.md`

## Data Contract (Backend ↔ DBA)

DB 테이블과 API 응답 간 매핑:

```markdown
## Data Contract

### users 테이블 → User API 응답
| DB Column | API Field | Transform |
|-----------|-----------|-----------
| id (uuid) | id | 그대로 |
| email (varchar) | email | 그대로 |
| password_hash | - | 노출 금지 |
| created_at (timestamp) | createdAt | ISO 8601 |
| deleted_at (timestamp) | - | null이 아니면 404 |

### Shared Types
공유 타입은 양쪽에서 동일하게 사용:
- `UUID`: 36자 문자열 (8-4-4-4-12 형식)
- `DateTime`: ISO 8601 형식
- `Pagination`: { page: number, limit: number, total: number }
```

Save: `.claude/company/contracts/data-contracts.md`

## Component Contract (Design ↔ Frontend)

Design 산출물을 Frontend가 정확히 구현하기 위한 규격. **디자인 토큰 준수는 이 Contract의 핵심이다** — 하드코드 색상/크기를 사용하면 Contract 위반으로 간주한다.

```markdown
## Component Contract

### Design Token Compliance (필수)
모든 Frontend 코드는 `design/tokens.json`에 정의된 토큰을 사용해야 한다:
- **색상**: CSS 변수 토큰 사용 (예: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `bg-destructive`)
  - 금지: Tailwind 기본 색상 직접 사용 (예: `bg-zinc-900`, `bg-blue-600`, `text-red-500`)
  - 예외: 외부 브랜드 가이드라인 색상 (카카오 `#FEE500` 등)은 CSS 변수로 정의 후 사용 권장
- **간격**: 토큰에 정의된 스페이싱 단위 사용
- **반지름**: `rounded-sm`, `rounded-md`, `rounded-lg` 등 토큰 기반
- **타이포그래피**: 토큰에 정의된 폰트/크기 계층 사용

### 접근성 (필수)
- 모든 아이콘 전용 버튼에 `aria-label` 필수
- 동적으로 업데이트되는 콘텐츠에 `aria-live="polite"` 필수
- 호버 전용 인터랙션 금지 — 모바일 터치 디바이스에서 접근 불가
  - 대안: 모바일에서는 항상 표시, 데스크탑에서는 hover시 강조 (`opacity-70 md:opacity-0 md:group-hover:opacity-100`)
- 빈 상태(empty state), 에러 상태, 로딩 상태 UI 필수 구현
- 색상 대비 WCAG AA 기준 (4.5:1) 준수

### Button Component
- Variants: primary, secondary, danger, ghost
- Sizes: sm, md, lg
- States: default, hover, active, disabled, loading
- Props: { label, onClick, variant, size, disabled, loading, icon? }
- Accessibility: role="button", aria-disabled, keyboard focus ring

### Form Input
- Types: text, email, password, number, textarea
- States: default, focus, error, disabled
- Props: { label, type, value, onChange, error?, placeholder?, required? }
- Validation: 에러 메시지는 input 하단에 표시, `aria-live="assertive"` 적용
```

Save: `.claude/company/contracts/component-contracts.md` (Design팀 활성 시)

## Event Contract (해당 시)

비동기 이벤트/메시지 스키마:

```markdown
## Event Contract

### user.created
```json
{ "event": "user.created", "data": { "userId": "uuid", "email": "string" }, "timestamp": "datetime" }
```

### order.completed
```json
{ "event": "order.completed", "data": { "orderId": "uuid", "userId": "uuid", "total": "number" }, "timestamp": "datetime" }
```
```

Save: `.claude/company/contracts/event-contracts.md` (해당 시)

## External Service Schema Contract (관리형 서비스 사용 시)

Supabase, Firebase 등 관리형 서비스의 시스템 테이블을 앱이 직접 조작(INSERT, UPDATE, SELECT)하는 경우, 해당 테이블의 **실제 스키마**를 계약으로 문서화한다. Phase 2의 Ground Truth Verification에서 introspect한 결과를 기반으로 작성한다.

이 계약이 필요한 이유: 관리형 서비스의 테이블은 프로젝트가 통제하지 않는 컬럼과 제약조건을 포함한다. 문서만 보고 코드를 작성하면 NOT NULL 위반, 타입 불일치 등 런타임 오류가 발생한다 (예: Supabase auth.users의 email_change 컬럼이 NOT NULL인데 seed.sql에서 누락).

```markdown
## External Service Schema Contract

### auth.users (Supabase Auth — GoTrue 관리)

**Introspection 기준**: `\d auth.users` 실행 결과

| Column | Type | Nullable | Default | App에서 사용 여부 | Notes |
|--------|------|----------|---------|-----------------|-------|
| id | uuid | NO | gen_random_uuid() | YES — PK, 참조 | |
| email | varchar(255) | YES | | YES — 로그인 식별자 | |
| encrypted_password | varchar(255) | YES | | NO — GoTrue 관리 | |
| email_change | varchar(255) | NO | '' | NO — 직접 사용 안 함 | **INSERT 시 빈 문자열 필수** |
| email_change_token_new | varchar(255) | NO | '' | NO | INSERT 시 빈 문자열 필수 |
| ... | | | | | 전체 컬럼 기록 |

### INSERT 시 필수 컬럼 목록
auth.users에 직접 INSERT 시 (예: seed.sql) 아래 컬럼에 반드시 값을 제공해야 한다:

| Column | 권장 값 | 누락 시 오류 |
|--------|---------|------------|
| id | gen_random_uuid() | PK 위반 |
| instance_id | '00000000-0000-0000-0000-000000000000' | NOT NULL 위반 |
| email_change | '' | GoTrue Scan error: converting NULL to string |
| email_change_token_new | '' | GoTrue Scan error |
| aud | 'authenticated' | NOT NULL 위반 |
| role | 'authenticated' | NOT NULL 위반 |

### 주의사항
- GoTrue(Go)가 모든 컬럼을 Go string으로 스캔 → NULL이 있으면 `Scan error on column` 발생
- 직접 INSERT보다 Supabase Auth API 사용을 권장 (API가 모든 필수 컬럼을 자동 설정)
```

Save: `.claude/company/contracts/external-schema-contracts.md`
