# 소셜 미디어 앱 기술 스택 제안

## 요약

초기 1만명에서 10만명까지 성장을 고려한 소셜 미디어 앱의 기술 스택을 제안드립니다. 피드, 팔로우, 좋아요, 댓글, DM 기능을 모두 커버할 수 있는 구성입니다.

---

## 1. 백엔드

### 추천: Node.js (NestJS) 또는 Go

| 선택지 | 장점 | 단점 |
|--------|------|------|
| **NestJS (Node.js/TypeScript)** | 프론트와 언어 통일, 풍부한 생태계, 빠른 개발 속도 | CPU 집약적 작업에 약함 |
| **Go** | 높은 동시성 처리, 낮은 메모리 사용, 성능 우수 | 개발 속도가 상대적으로 느림 |

**1만~10만명 규모라면 NestJS로 충분합니다.** 빠른 MVP 개발이 중요하다면 NestJS, 성능과 확장성을 처음부터 확보하고 싶다면 Go를 선택하세요.

### API 설계

- **REST API**: 대부분의 CRUD 작업 (피드 조회, 팔로우, 좋아요, 댓글)
- **WebSocket**: DM(실시간 채팅)과 실시간 알림에 사용
- GraphQL은 이 규모에서는 오버엔지니어링일 수 있으므로 초기에는 REST + WebSocket 조합을 권장합니다.

---

## 2. 프론트엔드

### 모바일 앱

| 선택지 | 장점 | 단점 |
|--------|------|------|
| **React Native** | 웹 개발자 전환 용이, 큰 커뮤니티 | 네이티브 대비 성능 차이 |
| **Flutter** | 뛰어난 UI 성능, 하나의 코드베이스 | Dart 학습 필요 |

**추천: React Native (Expo)**
- 소셜 미디어 앱의 UI는 대부분 리스트 기반이므로 React Native로 충분
- Expo를 사용하면 빌드/배포가 훨씬 간편
- 웹 버전도 필요하다면 React Native Web으로 확장 가능

### 웹 (선택사항)

- **Next.js**: SSR/SSG 지원으로 SEO에 유리, React 생태계 활용

---

## 3. 데이터베이스

### 메인 DB: PostgreSQL

- 관계형 데이터(사용자, 팔로우 관계, 좋아요, 댓글)에 최적
- JSON 필드 지원으로 유연한 스키마 확장 가능
- 10만명 규모에서 충분한 성능

### 캐시: Redis

- 피드 캐싱, 세션 관리
- 좋아요 수 같은 카운터 캐싱
- 실시간 기능(DM, 온라인 상태) 지원을 위한 Pub/Sub

### 파일 저장소: AWS S3 (또는 Cloudflare R2)

- 프로필 이미지, 피드 이미지/영상 저장
- CDN 연동으로 빠른 미디어 전송

---

## 4. 인프라

### 추천 구성

| 구성 요소 | 추천 | 이유 |
|-----------|------|------|
| **클라우드** | AWS 또는 GCP | 가장 넓은 서비스 범위 |
| **컨테이너** | Docker + ECS (또는 Cloud Run) | Kubernetes는 이 규모에서 과함 |
| **CI/CD** | GitHub Actions | 간편한 설정, 무료 티어 |
| **CDN** | CloudFront 또는 Cloudflare | 미디어 전송 속도 향상 |

초기에는 **단일 서버(또는 2~3대)**로 시작하고, 트래픽 증가에 따라 수평 확장하면 됩니다. Kubernetes는 10만명 수준에서는 운영 복잡도 대비 이점이 크지 않습니다.

---

## 5. 기능별 기술 매핑

### 피드 (Feed)

- PostgreSQL에 게시글 저장
- Redis로 타임라인 캐싱 (Fan-out on read 방식으로 시작)
- 페이지네이션: 커서 기반 (offset 방식보다 성능 우수)
- 이미지 최적화: Sharp (Node.js) 또는 imgproxy

### 팔로우 (Follow)

- PostgreSQL의 `follows` 테이블로 관계 관리
- 팔로워/팔로잉 수는 Redis에 캐싱

### 좋아요 (Like)

- PostgreSQL에 `likes` 테이블
- 좋아요 수는 Redis 카운터로 실시간 관리, 주기적으로 DB에 동기화

### 댓글 (Comment)

- PostgreSQL에 `comments` 테이블
- 대댓글은 `parent_comment_id`로 트리 구조 구현

### DM (Direct Message)

- **WebSocket** (Socket.IO 또는 ws 라이브러리)으로 실시간 통신
- 메시지는 PostgreSQL에 영구 저장
- Redis Pub/Sub로 다중 서버 간 메시지 브로드캐스팅
- 10만명 이상으로 커질 경우 별도 채팅 서비스 분리 고려

---

## 6. 인증 및 보안

| 구성 요소 | 추천 |
|-----------|------|
| **인증** | JWT + Refresh Token, 또는 Firebase Auth / Supabase Auth |
| **소셜 로그인** | OAuth 2.0 (Google, Apple, Kakao) |
| **이미지 업로드** | Pre-signed URL (S3 직접 업로드) |
| **Rate Limiting** | Redis 기반 (express-rate-limit 등) |

---

## 7. 모니터링 및 로깅

| 용도 | 추천 |
|------|------|
| **에러 추적** | Sentry |
| **로깅** | Winston/Pino + CloudWatch (또는 Datadog) |
| **APM** | Datadog 또는 New Relic (초기에는 없어도 됨) |
| **알림** | Slack Webhook 연동 |

---

## 8. 추천 최종 스택 (정리)

```
Frontend:  React Native (Expo)
Backend:   NestJS (TypeScript)
Database:  PostgreSQL + Redis
Storage:   AWS S3 + CloudFront
Realtime:  Socket.IO (WebSocket)
Auth:      JWT + OAuth 2.0
Infra:     AWS ECS + RDS + ElastiCache
CI/CD:     GitHub Actions
Monitoring: Sentry + CloudWatch
```

---

## 9. 확장 시 고려사항 (10만명 이상)

지금 당장은 필요 없지만, 10만명에 가까워질 때 검토할 사항들입니다.

- **메시지 큐**: Bull (Redis 기반) 또는 SQS - 알림 발송, 피드 생성 등 비동기 작업
- **검색**: Elasticsearch 또는 Meilisearch - 사용자/게시글 검색
- **푸시 알림**: Firebase Cloud Messaging (FCM)
- **피드 알고리즘**: 초기에는 시간순, 이후 추천 알고리즘 도입
- **마이크로서비스 분리**: DM 서비스, 알림 서비스 등 트래픽이 많은 부분부터 분리
- **데이터베이스 읽기 복제본**: Read Replica로 읽기 부하 분산

---

## 10. 개발 우선순위 제안

1. **Phase 1 (MVP)**: 회원가입/로그인, 피드(글 작성/조회), 팔로우
2. **Phase 2**: 좋아요, 댓글, 프로필 페이지
3. **Phase 3**: DM, 푸시 알림
4. **Phase 4**: 검색, 피드 알고리즘 개선, 성능 최적화

MVP를 빠르게 만들어서 사용자 피드백을 받고, 이후 점진적으로 기능을 확장하는 것이 가장 효과적인 전략입니다.
