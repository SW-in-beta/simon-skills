# 데이터 모델 설계

## ER 다이어그램 (텍스트)

```
User ──< Post ──< Comment
  │        │         │
  │        │         └── User (author)
  │        │
  │        └──< Like ──── User
  │
  ├──< Follow (follower) ──── User (following)
  │
  └──< Notification
```

## Prisma 스키마 설계

### User (사용자)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique
  passwordHash  String
  name          String
  bio           String?
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  posts         Post[]
  comments      Comment[]
  likes         Like[]
  followers     Follow[]       @relation("following")  // 나를 팔로우하는 사람들
  following     Follow[]       @relation("follower")   // 내가 팔로우하는 사람들
  notifications Notification[] @relation("recipient")  // 받은 알림
  actorNotifications Notification[] @relation("actor")  // 내가 발생시킨 알림

  @@index([username])
  @@index([email])
  @@map("users")
}
```

### Post (게시물)

```prisma
model Post {
  id        String   @id @default(cuid())
  imageUrl  String
  caption   String?
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments  Comment[]
  likes     Like[]

  @@index([authorId])
  @@index([createdAt(sort: Desc)])
  @@map("posts")
}
```

### Comment (댓글)

```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String
  authorId  String
  postId    String
  createdAt DateTime @default(now())

  // Relations
  author    User @relation(fields: [authorId], references: [id], onDelete: Cascade)
  post      Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId])
  @@index([authorId])
  @@map("comments")
}
```

### Like (좋아요)

```prisma
model Like {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  createdAt DateTime @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])  // 한 사용자가 같은 게시물에 중복 좋아요 방지
  @@index([postId])
  @@map("likes")
}
```

### Follow (팔로우)

```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  // Relations
  follower  User @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("following", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])  // 중복 팔로우 방지
  @@index([followerId])
  @@index([followingId])
  @@map("follows")
}
```

### Notification (알림)

```prisma
model Notification {
  id          String           @id @default(cuid())
  type        NotificationType
  recipientId String
  actorId     String
  postId      String?          // 게시물 관련 알림인 경우
  commentId   String?          // 댓글 관련 알림인 경우
  isRead      Boolean          @default(false)
  createdAt   DateTime         @default(now())

  // Relations
  recipient User @relation("recipient", fields: [recipientId], references: [id], onDelete: Cascade)
  actor     User @relation("actor", fields: [actorId], references: [id], onDelete: Cascade)

  @@index([recipientId, isRead])
  @@index([recipientId, createdAt(sort: Desc)])
  @@map("notifications")
}

enum NotificationType {
  FOLLOW    // 팔로우
  LIKE      // 좋아요
  COMMENT   // 댓글
}
```

---

## 주요 설계 결정 사항

### 1. ID 전략
- **CUID** 사용: URL에 노출되어도 안전하고, 순서 예측이 불가능하며, 분산 환경에서도 충돌 없음

### 2. Soft Delete vs Hard Delete
- Phase 1에서는 **Hard Delete** 사용 (단순화)
- Phase 2에서 필요 시 `deletedAt` 컬럼 추가하여 Soft Delete 전환

### 3. 좋아요/팔로우 중복 방지
- `@@unique` 복합 유니크 제약조건으로 DB 레벨에서 중복 방지
- 애플리케이션 레벨 검증과 이중으로 보호

### 4. 피드 쿼리 전략
- Phase 1에서는 팔로우 테이블을 JOIN하여 실시간으로 피드를 생성 (Fan-out on read)
- 커서 기반 페이지네이션 사용 (createdAt + id)

### 5. 알림 설계
- 다형성(polymorphic) 알림 모델: type 필드로 알림 종류 구분
- postId, commentId는 nullable로 두어 알림 종류에 따라 선택적 사용
- 자기 자신에 대한 알림은 생성하지 않음 (자기 게시물에 좋아요 등)

### 6. 인덱스 전략
- 피드 조회를 위한 `posts.createdAt` DESC 인덱스
- 알림 조회를 위한 `notifications(recipientId, createdAt)` 복합 인덱스
- 읽지 않은 알림 카운트를 위한 `notifications(recipientId, isRead)` 복합 인덱스
