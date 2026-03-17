# API 설계

## 공통 사항

### 베이스 URL
```
/api
```

### 인증
- JWT Bearer 토큰 (Authorization 헤더)
- NextAuth.js 세션 기반 인증 병행
- 🔓 = 인증 불필요, 🔒 = 인증 필요

### 공통 응답 형식
```typescript
// 성공 응답
{
  "data": T,
  "meta"?: {
    "nextCursor"?: string,
    "hasMore"?: boolean
  }
}

// 에러 응답
{
  "error": {
    "code": string,
    "message": string,
    "details"?: Record<string, string[]>
  }
}
```

### 페이지네이션
- 커서 기반 페이지네이션 사용
- Query params: `cursor` (마지막 아이템의 createdAt_id), `limit` (기본 20, 최대 50)

---

## 1. 인증 API

### POST /api/auth/register 🔓
회원가입

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "name": "John Doe",
  "password": "securePassword123"
}
```

**Validation:**
- email: 유효한 이메일 형식, 중복 불가
- username: 3-30자, 영문 소문자/숫자/밑줄만, 중복 불가
- name: 1-50자
- password: 8자 이상, 대소문자 + 숫자 포함

**Response (201):**
```json
{
  "data": {
    "id": "clx...",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe"
  }
}
```

### POST /api/auth/login 🔓
로그인 (NextAuth.js Credentials Provider)

### POST /api/auth/logout 🔒
로그아웃

---

## 2. 사용자 API

### GET /api/users/:username 🔒
사용자 프로필 조회

**Response (200):**
```json
{
  "data": {
    "id": "clx...",
    "username": "johndoe",
    "name": "John Doe",
    "bio": "Hello world",
    "avatarUrl": "https://...",
    "postsCount": 42,
    "followersCount": 150,
    "followingCount": 80,
    "isFollowing": true,
    "isOwnProfile": false
  }
}
```

### PATCH /api/users/me 🔒
내 프로필 수정

**Request Body (multipart/form-data):**
```
name: "New Name"
bio: "Updated bio"
avatar: [File]  (선택)
```

**Response (200):**
```json
{
  "data": {
    "id": "clx...",
    "username": "johndoe",
    "name": "New Name",
    "bio": "Updated bio",
    "avatarUrl": "https://..."
  }
}
```

### GET /api/users/search?q=keyword 🔒
사용자 검색

**Query Params:**
- q: 검색어 (username 또는 name에서 검색)
- limit: 기본 10

**Response (200):**
```json
{
  "data": [
    {
      "id": "clx...",
      "username": "johndoe",
      "name": "John Doe",
      "avatarUrl": "https://...",
      "isFollowing": false
    }
  ]
}
```

---

## 3. 게시물 API

### POST /api/posts 🔒
게시물 작성

**Request Body (multipart/form-data):**
```
image: [File]  (필수, max 10MB, JPEG/PNG/WebP)
caption: "Beautiful sunset"  (선택, max 2200자)
```

**처리 흐름:**
1. 이미지 파일 검증 (타입, 크기)
2. S3 presigned URL 생성 및 업로드
3. 이미지 리사이징 (최대 1080px 너비)
4. DB에 게시물 레코드 생성

**Response (201):**
```json
{
  "data": {
    "id": "clx...",
    "imageUrl": "https://...",
    "caption": "Beautiful sunset",
    "author": {
      "id": "clx...",
      "username": "johndoe",
      "avatarUrl": "https://..."
    },
    "likesCount": 0,
    "commentsCount": 0,
    "isLiked": false,
    "createdAt": "2026-03-07T10:00:00Z"
  }
}
```

### GET /api/posts/:id 🔒
게시물 상세 조회

**Response (200):** (위 게시물 응답과 동일 형식)

### DELETE /api/posts/:id 🔒
게시물 삭제 (본인 게시물만)

**Response (204):** No Content

### GET /api/users/:username/posts 🔒
특정 사용자의 게시물 목록

**Query Params:** cursor, limit

**Response (200):**
```json
{
  "data": [
    { /* Post 객체 */ }
  ],
  "meta": {
    "nextCursor": "2026-03-06T10:00:00Z_clx...",
    "hasMore": true
  }
}
```

---

## 4. 피드 API

### GET /api/feed 🔒
내 피드 조회 (팔로우한 사용자 + 자신의 게시물, 최신순)

**Query Params:** cursor, limit (기본 20)

**쿼리 로직 (의사코드):**
```sql
SELECT posts.*, users.*
FROM posts
JOIN users ON posts.authorId = users.id
WHERE posts.authorId IN (
  SELECT followingId FROM follows WHERE followerId = :currentUserId
  UNION
  SELECT :currentUserId
)
ORDER BY posts.createdAt DESC
LIMIT :limit
-- 커서 조건 추가
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "clx...",
      "imageUrl": "https://...",
      "caption": "Beautiful sunset",
      "author": {
        "id": "clx...",
        "username": "johndoe",
        "avatarUrl": "https://..."
      },
      "likesCount": 42,
      "commentsCount": 5,
      "isLiked": true,
      "createdAt": "2026-03-07T10:00:00Z"
    }
  ],
  "meta": {
    "nextCursor": "2026-03-06T23:00:00Z_clx...",
    "hasMore": true
  }
}
```

---

## 5. 좋아요 API

### POST /api/posts/:postId/likes 🔒
좋아요 추가

**Response (201):**
```json
{
  "data": {
    "likesCount": 43
  }
}
```

**부수 효과:** 게시물 작성자에게 LIKE 알림 생성 (자기 게시물 제외)

### DELETE /api/posts/:postId/likes 🔒
좋아요 취소

**Response (200):**
```json
{
  "data": {
    "likesCount": 42
  }
}
```

---

## 6. 댓글 API

### POST /api/posts/:postId/comments 🔒
댓글 작성

**Request Body:**
```json
{
  "content": "Great photo!"
}
```

**Validation:** content 1-1000자

**Response (201):**
```json
{
  "data": {
    "id": "clx...",
    "content": "Great photo!",
    "author": {
      "id": "clx...",
      "username": "janedoe",
      "avatarUrl": "https://..."
    },
    "createdAt": "2026-03-07T10:05:00Z"
  }
}
```

**부수 효과:** 게시물 작성자에게 COMMENT 알림 생성 (자기 게시물 제외)

### GET /api/posts/:postId/comments 🔒
댓글 목록 조회

**Query Params:** cursor, limit (기본 20)

**Response (200):**
```json
{
  "data": [
    { /* Comment 객체 */ }
  ],
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

### DELETE /api/comments/:commentId 🔒
댓글 삭제 (본인 댓글만)

**Response (204):** No Content

---

## 7. 팔로우 API

### POST /api/users/:userId/follow 🔒
팔로우

**Response (201):**
```json
{
  "data": {
    "isFollowing": true
  }
}
```

**부수 효과:** 대상 사용자에게 FOLLOW 알림 생성

### DELETE /api/users/:userId/follow 🔒
언팔로우

**Response (200):**
```json
{
  "data": {
    "isFollowing": false
  }
}
```

### GET /api/users/:username/followers 🔒
팔로워 목록

**Query Params:** cursor, limit

### GET /api/users/:username/following 🔒
팔로잉 목록

**Query Params:** cursor, limit

**Response (200):** (두 API 공통)
```json
{
  "data": [
    {
      "id": "clx...",
      "username": "janedoe",
      "name": "Jane Doe",
      "avatarUrl": "https://...",
      "isFollowing": true
    }
  ],
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

---

## 8. 알림 API

### GET /api/notifications 🔒
알림 목록 조회

**Query Params:** cursor, limit (기본 20)

**Response (200):**
```json
{
  "data": [
    {
      "id": "clx...",
      "type": "LIKE",
      "actor": {
        "id": "clx...",
        "username": "janedoe",
        "avatarUrl": "https://..."
      },
      "postId": "clx...",
      "postImageUrl": "https://...",
      "isRead": false,
      "createdAt": "2026-03-07T10:05:00Z"
    },
    {
      "id": "clx...",
      "type": "FOLLOW",
      "actor": {
        "id": "clx...",
        "username": "bob",
        "avatarUrl": "https://..."
      },
      "postId": null,
      "postImageUrl": null,
      "isRead": false,
      "createdAt": "2026-03-07T09:30:00Z"
    },
    {
      "id": "clx...",
      "type": "COMMENT",
      "actor": {
        "id": "clx...",
        "username": "alice",
        "avatarUrl": "https://..."
      },
      "postId": "clx...",
      "postImageUrl": "https://...",
      "commentContent": "Great photo!",
      "isRead": true,
      "createdAt": "2026-03-07T08:00:00Z"
    }
  ],
  "meta": {
    "nextCursor": "...",
    "hasMore": true
  }
}
```

### GET /api/notifications/unread-count 🔒
읽지 않은 알림 수 조회

**Response (200):**
```json
{
  "data": {
    "count": 5
  }
}
```

### PATCH /api/notifications/read-all 🔒
모든 알림 읽음 처리

**Response (200):**
```json
{
  "data": {
    "updatedCount": 5
  }
}
```

---

## 에러 코드 정리

| HTTP Status | 코드 | 설명 |
|-------------|------|------|
| 400 | VALIDATION_ERROR | 입력값 검증 실패 |
| 401 | UNAUTHORIZED | 인증 필요 |
| 403 | FORBIDDEN | 권한 없음 (남의 게시물 삭제 등) |
| 404 | NOT_FOUND | 리소스를 찾을 수 없음 |
| 409 | CONFLICT | 중복 리소스 (이미 팔로우, 이미 좋아요 등) |
| 413 | FILE_TOO_LARGE | 파일 크기 초과 |
| 415 | UNSUPPORTED_MEDIA_TYPE | 지원하지 않는 파일 형식 |
| 429 | RATE_LIMITED | 요청 제한 초과 |
| 500 | INTERNAL_ERROR | 서버 내부 오류 |
