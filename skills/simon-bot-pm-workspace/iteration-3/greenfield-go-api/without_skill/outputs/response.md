# Go + Gin + PostgreSQL REST API 서버 설계

좋은 기술 스택 선택이네요. Go + Gin + PostgreSQL 조합은 성능과 생산성 모두 뛰어납니다. 사용자 관리, 게시판, 알림 기능을 포함한 REST API 서버를 설계해 보겠습니다.

---

## 1. 프로젝트 구조

```
myapp/
├── cmd/
│   └── server/
│       └── main.go              # 애플리케이션 진입점
├── internal/
│   ├── config/
│   │   └── config.go            # 환경 설정 로드
│   ├── middleware/
│   │   ├── auth.go              # JWT 인증 미들웨어
│   │   ├── cors.go              # CORS 설정
│   │   └── logger.go            # 요청 로깅
│   ├── handler/
│   │   ├── user.go              # 사용자 관리 핸들러
│   │   ├── post.go              # 게시판 핸들러
│   │   └── notification.go      # 알림 핸들러
│   ├── service/
│   │   ├── user.go              # 사용자 비즈니스 로직
│   │   ├── post.go              # 게시판 비즈니스 로직
│   │   └── notification.go      # 알림 비즈니스 로직
│   ├── repository/
│   │   ├── user.go              # 사용자 DB 접근
│   │   ├── post.go              # 게시판 DB 접근
│   │   └── notification.go      # 알림 DB 접근
│   ├── model/
│   │   ├── user.go              # 사용자 도메인 모델
│   │   ├── post.go              # 게시판 도메인 모델
│   │   └── notification.go      # 알림 도메인 모델
│   ├── dto/
│   │   ├── user.go              # 사용자 요청/응답 DTO
│   │   ├── post.go              # 게시판 요청/응답 DTO
│   │   └── notification.go      # 알림 요청/응답 DTO
│   └── router/
│       └── router.go            # 라우터 설정
├── pkg/
│   ├── database/
│   │   └── postgres.go          # PostgreSQL 연결 관리
│   ├── response/
│   │   └── response.go          # 통일된 응답 포맷
│   └── validator/
│       └── validator.go         # 입력 유효성 검사
├── migrations/
│   ├── 001_create_users.up.sql
│   ├── 001_create_users.down.sql
│   ├── 002_create_posts.up.sql
│   ├── 002_create_posts.down.sql
│   ├── 003_create_notifications.up.sql
│   └── 003_create_notifications.down.sql
├── go.mod
├── go.sum
├── Makefile
├── Dockerfile
└── .env.example
```

이 구조는 **Handler -> Service -> Repository** 3계층 아키텍처를 따릅니다. `internal/` 패키지로 캡슐화하고, `pkg/`에는 재사용 가능한 유틸리티를 둡니다.

---

## 2. 핵심 의존성

| 패키지 | 용도 |
|--------|------|
| `github.com/gin-gonic/gin` | HTTP 웹 프레임워크 |
| `gorm.io/gorm` | ORM (PostgreSQL 드라이버 포함) |
| `gorm.io/driver/postgres` | GORM PostgreSQL 드라이버 |
| `github.com/golang-jwt/jwt/v5` | JWT 인증 |
| `golang.org/x/crypto` | 비밀번호 해싱 (bcrypt) |
| `github.com/spf13/viper` | 환경 설정 관리 |
| `github.com/golang-migrate/migrate/v4` | DB 마이그레이션 |
| `go.uber.org/zap` | 구조화된 로깅 |
| `github.com/swaggo/gin-swagger` | Swagger API 문서 자동 생성 |

---

## 3. 데이터베이스 설계

### users 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL PK | 기본 키 |
| email | VARCHAR(255) UNIQUE | 이메일 (로그인 ID) |
| password_hash | VARCHAR(255) | bcrypt 해시 |
| nickname | VARCHAR(50) | 닉네임 |
| role | VARCHAR(20) | 역할 (user, admin) |
| is_active | BOOLEAN | 활성 상태 |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |
| deleted_at | TIMESTAMPTZ | 소프트 삭제 |

### posts 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL PK | 기본 키 |
| author_id | BIGINT FK | 작성자 (users.id) |
| title | VARCHAR(200) | 제목 |
| content | TEXT | 내용 |
| category | VARCHAR(50) | 카테고리 |
| view_count | INT DEFAULT 0 | 조회수 |
| is_pinned | BOOLEAN DEFAULT FALSE | 고정 여부 |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |
| deleted_at | TIMESTAMPTZ | 소프트 삭제 |

### comments 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL PK | 기본 키 |
| post_id | BIGINT FK | 게시글 (posts.id) |
| author_id | BIGINT FK | 작성자 (users.id) |
| content | TEXT | 댓글 내용 |
| parent_id | BIGINT FK NULL | 대댓글 (comments.id) |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |
| deleted_at | TIMESTAMPTZ | 소프트 삭제 |

### notifications 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGSERIAL PK | 기본 키 |
| user_id | BIGINT FK | 수신자 (users.id) |
| type | VARCHAR(50) | 알림 타입 (comment, mention 등) |
| title | VARCHAR(200) | 알림 제목 |
| message | TEXT | 알림 내용 |
| reference_type | VARCHAR(50) | 참조 엔티티 타입 |
| reference_id | BIGINT | 참조 엔티티 ID |
| is_read | BOOLEAN DEFAULT FALSE | 읽음 여부 |
| created_at | TIMESTAMPTZ | 생성일 |

---

## 4. API 엔드포인트 설계

### 인증 (Auth)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/v1/auth/register` | 회원가입 | X |
| POST | `/api/v1/auth/login` | 로그인 (JWT 발급) | X |
| POST | `/api/v1/auth/refresh` | 토큰 갱신 | O |
| POST | `/api/v1/auth/logout` | 로그아웃 | O |

### 사용자 관리 (Users)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/v1/users/me` | 내 프로필 조회 | O |
| PUT | `/api/v1/users/me` | 내 프로필 수정 | O |
| PUT | `/api/v1/users/me/password` | 비밀번호 변경 | O |
| DELETE | `/api/v1/users/me` | 회원 탈퇴 | O |
| GET | `/api/v1/users` | 사용자 목록 (관리자) | O (admin) |
| GET | `/api/v1/users/:id` | 사용자 조회 (관리자) | O (admin) |
| PUT | `/api/v1/users/:id/role` | 역할 변경 (관리자) | O (admin) |

### 게시판 (Posts)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/v1/posts` | 게시글 목록 (페이지네이션) | X |
| GET | `/api/v1/posts/:id` | 게시글 상세 조회 | X |
| POST | `/api/v1/posts` | 게시글 작성 | O |
| PUT | `/api/v1/posts/:id` | 게시글 수정 | O (작성자) |
| DELETE | `/api/v1/posts/:id` | 게시글 삭제 | O (작성자/admin) |
| GET | `/api/v1/posts/:id/comments` | 댓글 목록 | X |
| POST | `/api/v1/posts/:id/comments` | 댓글 작성 | O |
| PUT | `/api/v1/comments/:id` | 댓글 수정 | O (작성자) |
| DELETE | `/api/v1/comments/:id` | 댓글 삭제 | O (작성자/admin) |

### 알림 (Notifications)

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/v1/notifications` | 알림 목록 | O |
| GET | `/api/v1/notifications/unread-count` | 읽지 않은 알림 수 | O |
| PUT | `/api/v1/notifications/:id/read` | 알림 읽음 처리 | O |
| PUT | `/api/v1/notifications/read-all` | 전체 읽음 처리 | O |
| DELETE | `/api/v1/notifications/:id` | 알림 삭제 | O |

---

## 5. 통일된 응답 포맷

### 성공 응답

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 올바르지 않습니다.",
    "details": [
      { "field": "email", "message": "유효한 이메일 형식이 아닙니다." }
    ]
  }
}
```

---

## 6. 인증 흐름

1. **회원가입**: 이메일 + 비밀번호 -> bcrypt 해싱 후 저장
2. **로그인**: 이메일 + 비밀번호 검증 -> Access Token (15분) + Refresh Token (7일) 발급
3. **인증 미들웨어**: `Authorization: Bearer <access_token>` 헤더 검증
4. **토큰 갱신**: Refresh Token으로 새 Access Token 발급
5. **역할 기반 접근 제어**: user, admin 역할로 엔드포인트 접근 제어

---

## 7. 알림 발생 시나리오

| 트리거 | 알림 타입 | 수신자 |
|--------|----------|--------|
| 내 게시글에 댓글 | `comment` | 게시글 작성자 |
| 내 댓글에 대댓글 | `reply` | 댓글 작성자 |
| 관리자 공지 | `announcement` | 전체 사용자 |

알림 생성은 Service 레이어에서 게시글/댓글 작성 시 동기적으로 처리하되, 추후 메시지 큐(예: Redis Pub/Sub)로 비동기 처리로 전환할 수 있도록 인터페이스를 분리해 두는 것을 권장합니다.

---

## 8. 주요 설계 원칙

- **인터페이스 기반 의존성 주입**: Repository, Service 모두 인터페이스로 정의하여 테스트 용이성 확보
- **소프트 삭제**: GORM의 `gorm.DeletedAt` 활용하여 데이터 보존
- **커서/오프셋 페이지네이션**: 게시글 목록은 오프셋 기반, 알림은 커서 기반 고려
- **Graceful Shutdown**: `signal.NotifyContext`로 안전한 서버 종료
- **환경 분리**: `.env` 파일 또는 환경 변수로 dev/staging/prod 설정 분리
- **DB 마이그레이션**: `golang-migrate`로 버전 관리되는 스키마 변경

---

## 9. 개발 순서 제안

1. **프로젝트 초기화**: `go mod init`, 디렉토리 구조, 설정 로드, DB 연결
2. **사용자 관리**: 모델 -> 레포지토리 -> 서비스 -> 핸들러 -> 라우터 순서로 구현
3. **인증 미들웨어**: JWT 발급/검증, 역할 기반 접근 제어
4. **게시판**: 게시글 CRUD -> 댓글 CRUD -> 페이지네이션
5. **알림**: 알림 모델 -> 게시판 서비스에 알림 트리거 연동 -> 알림 조회/읽음 처리
6. **테스트**: 단위 테스트(mock repository) + 통합 테스트(testcontainers-go)
7. **배포 준비**: Dockerfile, docker-compose(앱 + PostgreSQL), Makefile

---

## 10. 추후 확장 고려 사항

- **검색**: PostgreSQL Full-Text Search 또는 Elasticsearch 연동
- **파일 업로드**: 게시글 첨부파일 (S3 연동)
- **실시간 알림**: WebSocket 또는 SSE(Server-Sent Events)
- **캐싱**: Redis를 활용한 인기 게시글 캐싱
- **Rate Limiting**: `gin-contrib/limiter`로 API 호출 제한
- **모니터링**: Prometheus + Grafana 메트릭 수집

---

이 설계를 기반으로 구현을 시작하면 됩니다. 어떤 부분부터 코드 작성을 시작할까요?
