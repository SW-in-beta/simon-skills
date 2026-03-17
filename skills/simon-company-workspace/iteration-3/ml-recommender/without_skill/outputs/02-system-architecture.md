# 시스템 아키텍처 설계

## 1. 전체 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────┐
│                        클라이언트 레이어                              │
│  ┌──────────────┐    ┌──────────────────────┐                       │
│  │ 서비스 앱/웹  │    │ 관리자 대시보드 (React)│                       │
│  └──────┬───────┘    └──────────┬───────────┘                       │
└─────────┼───────────────────────┼───────────────────────────────────┘
          │                       │
          ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway / Load Balancer                  │
└─────────┬───────────────────────┬───────────────────────────────────┘
          │                       │
          ▼                       ▼
┌─────────────────────┐  ┌───────────────────────┐
│  Recommendation API │  │   Admin API           │
│  (FastAPI)          │  │   (FastAPI)           │
│                     │  │                       │
│  - GET /recommend   │  │  - GET /metrics       │
│  - POST /events     │  │  - GET /models        │
│  - GET /items       │  │  - POST /retrain      │
└────┬────────┬───────┘  └───────┬───────────────┘
     │        │                  │
     ▼        ▼                  ▼
┌─────────┐ ┌─────────────┐ ┌─────────────────┐
│  Redis  │ │ PostgreSQL  │ │  Model Store    │
│ (캐시)  │ │ (데이터)     │ │  (S3/MinIO)     │
└─────────┘ └─────────────┘ └─────────────────┘
                  │
                  ▼
          ┌───────────────┐
          │ Batch Worker  │
          │ (Celery)      │
          │               │
          │ - 모델 학습    │
          │ - 지표 집계    │
          └───────────────┘
```

## 2. 컴포넌트 상세

### 2.1 Recommendation API (FastAPI)

추천 결과를 서빙하는 핵심 API 서버.

**책임:**
- 사용자별 개인화 추천 결과 반환
- 사용자 행동 이벤트 수집
- 추천 결과 캐시 관리

**주요 흐름:**
1. 추천 요청 수신 -> Redis 캐시 조회
2. 캐시 히트 시 즉시 반환
3. 캐시 미스 시 모델 로드 -> 추천 계산 -> 캐시 저장 -> 반환

**스케일링 전략:**
- Stateless 설계로 수평 확장 가능
- 모델은 메모리에 로드하여 서빙 (워커당 1개)
- Redis 캐시로 반복 요청 최적화

### 2.2 Admin API (FastAPI)

관리자 대시보드에 데이터를 제공하는 API.

**책임:**
- 추천 성능 지표 조회 (CTR, 전환율, 커버리지 등)
- 모델 메타데이터 조회 (버전, 학습 시각, 성능)
- 수동 모델 재학습 트리거

### 2.3 Batch Worker (Celery)

주기적으로 추천 모델을 재학습하는 배치 워커.

**책임:**
- 일 1회 모델 재학습 (스케줄)
- User-Item Matrix 구축
- 모델 학습 및 평가
- 학습된 모델 아티팩트 저장
- 추천 결과 사전 계산 및 캐시 워밍

**실행 흐름:**
1. PostgreSQL에서 행동 데이터 추출
2. User-Item Matrix 구성
3. CF 모델 학습 (User-based + Item-based)
4. 검증 데이터셋으로 모델 평가
5. 모델 아티팩트 S3 저장
6. 상위 활성 사용자 추천 결과 사전 계산
7. Redis 캐시 워밍

### 2.4 데이터 저장소

#### PostgreSQL
- 사용자 정보
- 상품 정보
- 행동 이벤트 로그
- 추천 성능 지표 (집계)
- 모델 메타데이터

#### Redis
- 추천 결과 캐시 (TTL: 1시간)
- 사용자 세션별 노출 이력 (중복 추천 방지)
- API Rate Limiting

#### S3 / MinIO
- 학습된 모델 파일 (.pkl, .npz)
- User-Item Matrix 스냅샷
- 학습 로그

## 3. 데이터 흐름

### 3.1 이벤트 수집 흐름
```
사용자 행동 -> POST /api/v1/events -> 검증 -> PostgreSQL 저장
                                              -> Redis 카운터 업데이트 (실시간 지표)
```

### 3.2 추천 서빙 흐름
```
추천 요청 -> GET /api/v1/recommendations/{user_id}
          -> Redis 캐시 확인
          -> [히트] 캐시 결과 반환
          -> [미스] 메모리 모델로 추천 계산 -> 캐시 저장 -> 반환
```

### 3.3 모델 학습 흐름
```
Celery Beat (매일 02:00)
  -> PostgreSQL에서 행동 데이터 추출
  -> User-Item Matrix 구축
  -> CF 모델 학습
  -> 검증 및 성능 측정
  -> S3에 모델 저장
  -> API 서버에 모델 리로드 시그널
  -> Redis 캐시 워밍
```

## 4. 배포 아키텍처 (Docker Compose)

```yaml
# 구성 요소 (설계 수준)
services:
  recommendation-api:    # FastAPI, 포트 8000
    replicas: 2
  admin-api:             # FastAPI, 포트 8001
    replicas: 1
  dashboard:             # React, 포트 3000
    replicas: 1
  worker:                # Celery Worker
    replicas: 1
  beat:                  # Celery Beat (스케줄러)
    replicas: 1
  postgres:              # PostgreSQL 15
    replicas: 1
  redis:                 # Redis 7
    replicas: 1
  minio:                 # MinIO (S3 호환)
    replicas: 1
```

## 5. 보안 고려사항

- Admin API: JWT 기반 인증, 역할 기반 접근 제어 (RBAC)
- Recommendation API: API Key 인증
- 데이터베이스: 내부 네트워크만 접근 허용
- Redis: 비밀번호 인증 설정
- HTTPS 적용 (API Gateway 레벨)
- 사용자 행동 데이터 익명화 처리 (개인정보 보호)

## 6. 모니터링 및 관찰성

- 애플리케이션 메트릭: Prometheus + Grafana
- API 로그: 구조화된 JSON 로그 (ELK 스택 연동 가능)
- 헬스체크: /health 엔드포인트
- 알림: 모델 성능 저하, API 응답 시간 초과 시 알림
