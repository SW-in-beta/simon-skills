# REST API 설계 명세

## 1. API 개요

- Base URL: `https://api.example.com/api/v1`
- 인증: API Key (헤더 `X-API-Key`) / Admin API는 JWT Bearer Token
- 응답 형식: JSON
- 에러 형식: RFC 7807 Problem Details

## 2. 공통 응답 형식

### 성공 응답
```json
{
  "status": "success",
  "data": { ... },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-03-07T12:00:00Z"
  }
}
```

### 에러 응답
```json
{
  "status": "error",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found",
    "details": {}
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-03-07T12:00:00Z"
  }
}
```

### 페이지네이션 응답
```json
{
  "status": "success",
  "data": [ ... ],
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-03-07T12:00:00Z"
  },
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 150,
    "total_pages": 8
  }
}
```

---

## 3. Recommendation API 엔드포인트

### 3.1 GET /api/v1/recommendations/{user_id}

사용자별 개인화 추천 목록을 반환한다.

**Path Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| user_id | string | Y | 외부 사용자 ID |

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| limit | integer | N | 10 | 반환할 추천 개수 (1-50) |
| category | string | N | - | 카테고리 필터 |
| exclude_items | string | N | - | 제외할 상품 ID (쉼표 구분) |

**응답 (200 OK):**
```json
{
  "status": "success",
  "data": {
    "user_id": "user_abc123",
    "recommendations": [
      {
        "item_id": "item_001",
        "name": "상품A",
        "category": "electronics",
        "score": 0.95,
        "rank": 1,
        "reason": "similar_users_purchased"
      },
      {
        "item_id": "item_042",
        "name": "상품B",
        "category": "electronics",
        "score": 0.87,
        "rank": 2,
        "reason": "similar_items"
      }
    ],
    "model_version": "cf_v20260307_020000",
    "cached": true
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-03-07T12:00:00Z"
  }
}
```

**에러 응답:**
- 404: 사용자를 찾을 수 없음
- 422: 잘못된 파라미터
- 503: 모델이 아직 준비되지 않음 (콜드 스타트)

**콜드 스타트 처리:**
- 행동 데이터가 없는 신규 사용자: 인기 상품 기반 추천 반환
- 응답에 `"fallback": "popularity"` 필드 추가

---

### 3.2 GET /api/v1/recommendations/{user_id}/similar-items/{item_id}

특정 상품과 유사한 상품을 추천한다 (Item-based CF).

**Path Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| user_id | string | Y | 외부 사용자 ID |
| item_id | string | Y | 기준 상품 ID |

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| limit | integer | N | 10 | 반환할 추천 개수 (1-30) |

**응답 (200 OK):**
```json
{
  "status": "success",
  "data": {
    "source_item_id": "item_001",
    "similar_items": [
      {
        "item_id": "item_055",
        "name": "유사상품A",
        "category": "electronics",
        "similarity_score": 0.92,
        "rank": 1
      }
    ],
    "model_version": "item_cf_v20260307_020000"
  },
  "meta": { ... }
}
```

---

### 3.3 POST /api/v1/events

사용자 행동 이벤트를 수집한다.

**Request Body:**
```json
{
  "user_id": "user_abc123",
  "events": [
    {
      "item_id": "item_001",
      "event_type": "view",
      "event_value": null,
      "context": {
        "device": "mobile",
        "source": "search",
        "session_id": "sess_xyz"
      },
      "timestamp": "2026-03-07T11:30:00Z"
    },
    {
      "item_id": "item_001",
      "event_type": "purchase",
      "event_value": 29900,
      "context": {
        "device": "mobile",
        "source": "recommendation",
        "session_id": "sess_xyz"
      },
      "timestamp": "2026-03-07T11:35:00Z"
    }
  ]
}
```

**검증 규칙:**
- events 배열: 최소 1개, 최대 100개
- event_type: "view", "click", "cart", "purchase" 중 하나
- timestamp: ISO 8601 형식, 미래 시각 불가, 7일 이전 불가

**응답 (202 Accepted):**
```json
{
  "status": "success",
  "data": {
    "accepted_count": 2,
    "rejected_count": 0
  },
  "meta": { ... }
}
```

---

### 3.4 POST /api/v1/events/feedback

추천 결과에 대한 피드백 (클릭/전환)을 수집한다.

**Request Body:**
```json
{
  "user_id": "user_abc123",
  "recommendation_id": "rec_12345",
  "item_id": "item_001",
  "feedback_type": "click",
  "timestamp": "2026-03-07T12:01:00Z"
}
```

**feedback_type:** "click", "conversion", "dismiss"

**응답 (202 Accepted):**
```json
{
  "status": "success",
  "data": {
    "recorded": true
  },
  "meta": { ... }
}
```

---

### 3.5 GET /api/v1/items/{item_id}

상품 정보를 조회한다.

**응답 (200 OK):**
```json
{
  "status": "success",
  "data": {
    "item_id": "item_001",
    "name": "상품A",
    "category": "electronics",
    "metadata": {
      "price": 29900,
      "tags": ["wireless", "bluetooth"]
    },
    "is_active": true,
    "created_at": "2026-01-15T09:00:00Z"
  },
  "meta": { ... }
}
```

---

### 3.6 POST /api/v1/items (배치 등록)

상품을 등록/업데이트한다.

**Request Body:**
```json
{
  "items": [
    {
      "external_id": "item_new_001",
      "name": "신규 상품",
      "category": "fashion",
      "metadata": {
        "price": 45000,
        "tags": ["summer", "casual"]
      }
    }
  ]
}
```

**응답 (201 Created):**
```json
{
  "status": "success",
  "data": {
    "created_count": 1,
    "updated_count": 0
  },
  "meta": { ... }
}
```

---

## 4. Admin API 엔드포인트

### 4.1 GET /api/v1/admin/metrics/overview

전체 추천 시스템 성능 요약을 반환한다.

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| period | string | N | 7d | 기간 (1d, 7d, 30d, 90d) |

**응답 (200 OK):**
```json
{
  "status": "success",
  "data": {
    "period": "7d",
    "metrics": {
      "total_recommendations": 125000,
      "total_clicks": 8750,
      "total_conversions": 1250,
      "ctr": 0.07,
      "conversion_rate": 0.01,
      "coverage": 0.65,
      "diversity_index": 0.72,
      "avg_response_time_ms": 45,
      "p95_response_time_ms": 120,
      "cache_hit_rate": 0.85
    },
    "trends": {
      "ctr_change": 0.005,
      "conversion_rate_change": -0.002
    }
  },
  "meta": { ... }
}
```

---

### 4.2 GET /api/v1/admin/metrics/timeseries

시계열 성능 지표를 반환한다 (차트용).

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| metric | string | Y | - | 지표명 (ctr, conversion_rate, coverage, response_time) |
| period | string | N | 7d | 기간 |
| granularity | string | N | 1h | 집계 단위 (1h, 1d) |

**응답 (200 OK):**
```json
{
  "status": "success",
  "data": {
    "metric": "ctr",
    "granularity": "1h",
    "datapoints": [
      {"timestamp": "2026-03-07T00:00:00Z", "value": 0.065},
      {"timestamp": "2026-03-07T01:00:00Z", "value": 0.071},
      {"timestamp": "2026-03-07T02:00:00Z", "value": 0.068}
    ]
  },
  "meta": { ... }
}
```

---

### 4.3 GET /api/v1/admin/models

모델 목록 및 상태를 반환한다.

**응답 (200 OK):**
```json
{
  "status": "success",
  "data": {
    "models": [
      {
        "id": 15,
        "model_type": "user_cf",
        "version": "user_cf_v20260307_020000",
        "status": "active",
        "training_duration_sec": 342,
        "metrics": {
          "precision_at_10": 0.12,
          "recall_at_10": 0.08,
          "ndcg_at_10": 0.15,
          "map_at_10": 0.10
        },
        "hyperparameters": {
          "n_neighbors": 50,
          "similarity": "cosine",
          "min_interactions": 5
        },
        "training_finished_at": "2026-03-07T02:05:42Z"
      }
    ]
  },
  "meta": { ... }
}
```

---

### 4.4 GET /api/v1/admin/models/{model_id}

특정 모델 상세 정보를 반환한다.

---

### 4.5 POST /api/v1/admin/models/retrain

수동 모델 재학습을 트리거한다.

**Request Body:**
```json
{
  "model_type": "user_cf",
  "hyperparameters": {
    "n_neighbors": 100,
    "similarity": "cosine"
  }
}
```

**응답 (202 Accepted):**
```json
{
  "status": "success",
  "data": {
    "task_id": "task_abc123",
    "model_type": "user_cf",
    "status": "queued",
    "estimated_duration_sec": 300
  },
  "meta": { ... }
}
```

---

### 4.6 GET /api/v1/admin/models/retrain/{task_id}

재학습 태스크 상태를 조회한다.

**응답 (200 OK):**
```json
{
  "status": "success",
  "data": {
    "task_id": "task_abc123",
    "status": "completed",
    "model_version": "user_cf_v20260307_150000",
    "started_at": "2026-03-07T15:00:00Z",
    "finished_at": "2026-03-07T15:05:42Z",
    "metrics": {
      "precision_at_10": 0.13,
      "recall_at_10": 0.09
    }
  },
  "meta": { ... }
}
```

---

### 4.7 GET /api/v1/admin/metrics/top-items

추천 빈도가 높은 상위 상품을 반환한다.

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| limit | integer | N | 20 | 상위 N개 |
| period | string | N | 7d | 기간 |

**응답 (200 OK):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "item_id": "item_001",
        "name": "상품A",
        "recommendation_count": 5420,
        "click_count": 380,
        "conversion_count": 54,
        "ctr": 0.070,
        "conversion_rate": 0.010
      }
    ]
  },
  "meta": { ... }
}
```

---

## 5. Rate Limiting

| API | Rate Limit | 기준 |
|-----|-----------|------|
| GET /recommendations | 100 req/s | API Key |
| POST /events | 200 req/s | API Key |
| Admin API | 30 req/s | JWT User |

**Rate Limit 헤더:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709812800
```

## 6. 에러 코드 목록

| HTTP 상태 | 에러 코드 | 설명 |
|-----------|-----------|------|
| 400 | INVALID_REQUEST | 잘못된 요청 형식 |
| 401 | UNAUTHORIZED | 인증 실패 |
| 403 | FORBIDDEN | 권한 없음 |
| 404 | USER_NOT_FOUND | 사용자를 찾을 수 없음 |
| 404 | ITEM_NOT_FOUND | 상품을 찾을 수 없음 |
| 422 | VALIDATION_ERROR | 파라미터 검증 실패 |
| 429 | RATE_LIMIT_EXCEEDED | 요청 빈도 초과 |
| 500 | INTERNAL_ERROR | 서버 내부 오류 |
| 503 | MODEL_NOT_READY | 모델 미준비 (콜드 스타트) |
| 503 | SERVICE_UNAVAILABLE | 서비스 이용 불가 |

## 7. API 버저닝 전략

- URL 경로 기반 버저닝: `/api/v1/`, `/api/v2/`
- 하위 호환성 유지: 필드 추가는 허용, 삭제/변경은 새 버전
- Deprecation 정책: 최소 6개월 전 고지, 이전 버전 12개월 유지
