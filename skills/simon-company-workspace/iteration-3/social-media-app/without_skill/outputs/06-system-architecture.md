# 시스템 아키텍처

## 아키텍처 개요

Phase 1에서는 Next.js의 풀스택 능력을 활용하여 단일 애플리케이션으로 구성한다.
프론트엔드와 백엔드 API가 같은 프로젝트 내에 존재하며, Vercel에 배포한다.

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│   │   Feed   │  │ Profile  │  │  Upload  │  │ Notifications │   │
│   │   Page   │  │   Page   │  │   Page   │  │     Page      │   │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬────────┘   │
│        │              │              │               │           │
│   ┌────┴──────────────┴──────────────┴───────────────┴────┐     │
│   │              TanStack Query (Cache Layer)              │     │
│   └───────────────────────┬───────────────────────────────┘     │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network (CDN)                      │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Next.js Application                          │
│                                                                  │
│   ┌─────────────────┐    ┌──────────────────────────────────┐   │
│   │   Server        │    │        API Route Handlers         │   │
│   │   Components    │    │                                    │   │
│   │   (SSR/RSC)     │    │  ┌────────┐ ┌────────┐ ┌──────┐ │   │
│   │                 │    │  │  Auth  │ │ Posts  │ │ Feed │ │   │
│   │  - Feed SSR     │    │  │ Routes │ │ Routes │ │Route │ │   │
│   │  - Profile SSR  │    │  └───┬────┘ └───┬────┘ └──┬───┘ │   │
│   │                 │    │      │           │         │      │   │
│   └────────┬────────┘    │  ┌───┴───┐ ┌────┴───┐ ┌──┴────┐ │   │
│            │             │  │Follow │ │  Like  │ │Comment│ │   │
│            │             │  │Routes │ │ Routes │ │Routes │ │   │
│            │             │  └───┬───┘ └────┬───┘ └──┬────┘ │   │
│            │             │      │          │        │       │   │
│            │             │  ┌───┴──────────┴────────┴────┐  │   │
│            │             │  │     Notification Routes     │  │   │
│            │             │  └─────────────┬──────────────┘  │   │
│            │             └────────────────┼──────────────────┘   │
│            │                              │                      │
│   ┌────────┴──────────────────────────────┴──────────────────┐   │
│   │                    Service Layer                          │   │
│   │                                                          │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │   │
│   │  │   Auth   │  │   Post   │  │  Follow  │  │Notifica-│ │   │
│   │  │ Service  │  │ Service  │  │ Service  │  │  tion   │ │   │
│   │  └────┬─────┘  └────┬─────┘  └────┬─────┘  │ Service │ │   │
│   │       │              │              │        └────┬────┘ │   │
│   │  ┌────┴──────────────┴──────────────┴─────────────┴───┐  │   │
│   │  │              Prisma ORM (Data Access)              │  │   │
│   │  └────────────────────┬───────────────────────────────┘  │   │
│   └───────────────────────┼──────────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
     ┌────────────┐ ┌────────────┐ ┌──────────┐
     │ PostgreSQL │ │   AWS S3   │ │  NextAuth │
     │ (Supabase) │ │ (Images)   │ │ (Session) │
     └────────────┘ └────────────┘ └──────────┘
```

---

## 계층별 상세 설명

### 1. 프레젠테이션 계층 (Client)

```
components/
├── layout/
│   ├── Header.tsx          # 상단 네비게이션 바
│   ├── BottomNav.tsx       # 모바일 하단 네비게이션
│   ├── Sidebar.tsx         # 데스크톱 사이드바
│   └── MainLayout.tsx      # 메인 레이아웃 래퍼
├── feed/
│   ├── FeedList.tsx        # 피드 무한 스크롤 리스트
│   └── FeedCard.tsx        # 개별 피드 카드
├── post/
│   ├── PostDetail.tsx      # 게시물 상세
│   ├── PostImage.tsx       # 이미지 표시
│   ├── PostActions.tsx     # 좋아요/댓글 버튼
│   ├── LikeButton.tsx      # 좋아요 버튼 (낙관적 업데이트)
│   ├── CommentList.tsx     # 댓글 목록
│   ├── CommentForm.tsx     # 댓글 입력
│   └── PostUploadForm.tsx  # 게시물 업로드 폼
├── profile/
│   ├── ProfileHeader.tsx   # 프로필 상단 (아바타, 통계, 팔로우 버튼)
│   ├── ProfileGrid.tsx     # 게시물 그리드
│   ├── ProfileEditForm.tsx # 프로필 수정 폼
│   └── FollowList.tsx      # 팔로워/팔로잉 목록
├── notification/
│   ├── NotificationList.tsx    # 알림 목록
│   ├── NotificationItem.tsx    # 개별 알림 아이템
│   └── NotificationBadge.tsx   # 읽지 않은 알림 배지
└── ui/
    └── (shadcn/ui 컴포넌트들)
```

**상태 관리 전략:**
- **서버 상태:** TanStack Query로 관리 (피드, 프로필, 댓글 등)
- **클라이언트 상태:** React useState/useContext로 최소한 관리 (모달 열림/닫힘 등)
- **낙관적 업데이트:** 좋아요, 팔로우에 적용 (즉각적인 UI 반응)

### 2. API 계층 (Route Handlers)

각 Route Handler는 다음 패턴을 따른다:

```
요청 수신 → 인증 확인 → 입력 검증 (Zod) → 서비스 호출 → 응답 반환
```

**미들웨어 체인:**
1. NextAuth 세션 검증
2. Zod 스키마 검증
3. 비즈니스 로직 (서비스 계층 호출)
4. 에러 핸들링 (공통 에러 처리)

### 3. 서비스 계층 (Business Logic)

```typescript
// 서비스 계층 인터페이스 예시
// PostService
- createPost(authorId, image, caption) → Post
- deletePost(postId, requesterId) → void
- getPostById(postId, viewerId) → PostWithDetails
- getUserPosts(username, cursor, limit) → PaginatedPosts

// FeedService
- getFeed(userId, cursor, limit) → PaginatedPosts

// FollowService
- follow(followerId, followingId) → void
- unfollow(followerId, followingId) → void
- getFollowers(userId, cursor, limit) → PaginatedUsers
- getFollowing(userId, cursor, limit) → PaginatedUsers

// LikeService
- likePost(userId, postId) → { likesCount }
- unlikePost(userId, postId) → { likesCount }

// CommentService
- createComment(authorId, postId, content) → Comment
- deleteComment(commentId, requesterId) → void
- getPostComments(postId, cursor, limit) → PaginatedComments

// NotificationService
- createNotification(type, recipientId, actorId, postId?, commentId?) → void
- getNotifications(userId, cursor, limit) → PaginatedNotifications
- getUnreadCount(userId) → number
- markAllAsRead(userId) → number
```

### 4. 데이터 접근 계층 (Prisma)

Prisma Client를 싱글톤 패턴으로 사용:

```typescript
// lib/prisma.ts
// PrismaClient 인스턴스를 글로벌 싱글톤으로 관리
// 개발 환경에서 Hot Reload 시 연결 중복 방지
```

---

## 이미지 업로드 흐름

```
┌────────┐     ┌──────────┐     ┌─────────┐     ┌──────┐
│ Client │     │ Next.js  │     │  Sharp   │     │  S3  │
│        │     │   API    │     │ (resize) │     │      │
└───┬────┘     └────┬─────┘     └────┬─────┘     └──┬───┘
    │               │                │               │
    │  POST /api/   │                │               │
    │  posts        │                │               │
    │  (multipart)  │                │               │
    │──────────────>│                │               │
    │               │                │               │
    │               │  resize image  │               │
    │               │───────────────>│               │
    │               │                │               │
    │               │  resized buffer│               │
    │               │<───────────────│               │
    │               │                │               │
    │               │        PUT (upload image)      │
    │               │───────────────────────────────>│
    │               │                │               │
    │               │           image URL            │
    │               │<───────────────────────────────│
    │               │                │               │
    │               │  save to DB    │               │
    │               │  (imageUrl)    │               │
    │               │                │               │
    │  Post created │                │               │
    │<──────────────│                │               │
    │               │                │               │
```

**이미지 처리 규칙:**
- 최대 업로드 크기: 10MB
- 리사이징: 최대 너비 1080px (비율 유지)
- 포맷 변환: WebP로 변환 (용량 최적화)
- 썸네일 생성: 300x300 (프로필 그리드용)

---

## 알림 흐름

Phase 1에서는 풀링(polling) 방식으로 알림을 구현한다.

```
┌────────────────────────────────────────────────────────┐
│                    알림 생성 흐름                        │
│                                                        │
│  사용자 액션 (좋아요/댓글/팔로우)                         │
│       │                                                │
│       ▼                                                │
│  서비스 계층에서 메인 로직 수행                            │
│       │                                                │
│       ▼                                                │
│  NotificationService.create() 호출                      │
│       │                                                │
│       ├── recipientId === actorId? → 알림 생성 안 함    │
│       │                                                │
│       └── DB에 Notification 레코드 생성                  │
│                                                        │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                    알림 조회 흐름                        │
│                                                        │
│  클라이언트: 30초마다 GET /api/notifications/unread-count│
│       │                                                │
│       ▼                                                │
│  읽지 않은 알림 수 → 헤더 배지에 표시                     │
│       │                                                │
│       ▼ (사용자가 알림 페이지 방문)                       │
│                                                        │
│  GET /api/notifications → 알림 목록 표시                 │
│       │                                                │
│       ▼                                                │
│  PATCH /api/notifications/read-all → 모두 읽음 처리     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Phase 2에서 WebSocket/SSE로 실시간 알림 업그레이드 예정**

---

## 보안 아키텍처

```
┌──────────────────────────────────────────┐
│              보안 계층                     │
│                                          │
│  1. NextAuth.js 세션/JWT 관리             │
│     - CSRF 토큰 자동 처리                 │
│     - HttpOnly 쿠키 (세션)               │
│     - JWT 토큰 만료: 24시간               │
│     - Refresh Token: 30일                │
│                                          │
│  2. 입력 검증 (Zod)                       │
│     - 모든 API 입력을 스키마로 검증        │
│     - SQL Injection 방지 (Prisma ORM)     │
│                                          │
│  3. 파일 업로드 보안                       │
│     - MIME 타입 + Magic Bytes 검증        │
│     - 파일 크기 제한 (10MB)               │
│     - 파일명 랜덤 생성 (CUID)            │
│                                          │
│  4. Rate Limiting                         │
│     - API별 요청 제한                     │
│     - 로그인 시도 제한 (5회/분)           │
│                                          │
│  5. CORS                                  │
│     - 동일 출처 정책 (Next.js 기본)       │
│                                          │
│  6. Content Security Policy               │
│     - next.config.ts에서 CSP 헤더 설정    │
│                                          │
└──────────────────────────────────────────┘
```

---

## 환경 변수

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=photogram-images

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
