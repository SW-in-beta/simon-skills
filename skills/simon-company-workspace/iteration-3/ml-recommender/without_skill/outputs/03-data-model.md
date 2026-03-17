# 데이터 모델 설계

## 1. ER 다이어그램 (개념)

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users     │       │   interactions   │       │    items     │
│──────────────│       │──────────────────│       │──────────────│
│ PK id        │──┐    │ PK id            │   ┌──│ PK id        │
│ external_id  │  └───>│ FK user_id       │   │  │ external_id  │
│ created_at   │       │ FK item_id       │<──┘  │ name         │
│ updated_at   │       │ event_type       │      │ category     │
│ is_active    │       │ event_value      │      │ metadata     │
└──────────────┘       │ context          │      │ is_active    │
                       │ created_at       │      │ created_at   │
                       └──────────────────┘      │ updated_at   │
                                                 └──────────────┘

┌──────────────────────┐       ┌──────────────────────┐
│ recommendation_logs  │       │    model_metadata    │
│──────────────────────│       │──────────────────────│
│ PK id                │       │ PK id                │
│ FK user_id           │       │ model_type           │
│ FK item_id           │       │ version              │
│ score                │       │ artifact_path        │
│ rank                 │       │ training_started_at  │
│ model_version        │       │ training_finished_at │
│ is_clicked           │       │ metrics              │
│ is_converted         │       │ hyperparameters      │
│ created_at           │       │ status               │
└──────────────────────┘       │ created_at           │
                               └──────────────────────┘

┌──────────────────────┐
│  performance_metrics │
│──────────────────────│
│ PK id                │
│ FK model_id          │
│ metric_name          │
│ metric_value         │
│ period_start         │
│ period_end           │
│ created_at           │
└──────────────────────┘
```

## 2. 테이블 상세 정의

### 2.1 users (사용자)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | BIGSERIAL | PK | 내부 ID |
| external_id | VARCHAR(255) | UNIQUE, NOT NULL | 외부 시스템 사용자 ID |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 수정 시각 |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 활성 여부 |

**인덱스:**
- `idx_users_external_id` ON (external_id)

### 2.2 items (상품)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | BIGSERIAL | PK | 내부 ID |
| external_id | VARCHAR(255) | UNIQUE, NOT NULL | 외부 시스템 상품 ID |
| name | VARCHAR(500) | NOT NULL | 상품명 |
| category | VARCHAR(255) | | 카테고리 |
| metadata | JSONB | DEFAULT '{}' | 추가 속성 (가격, 태그 등) |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | 활성 여부 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 수정 시각 |

**인덱스:**
- `idx_items_external_id` ON (external_id)
- `idx_items_category` ON (category)
- `idx_items_is_active` ON (is_active) WHERE is_active = TRUE

### 2.3 interactions (사용자-상품 상호작용)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | BIGSERIAL | PK | 내부 ID |
| user_id | BIGINT | FK -> users.id, NOT NULL | 사용자 ID |
| item_id | BIGINT | FK -> items.id, NOT NULL | 상품 ID |
| event_type | VARCHAR(50) | NOT NULL | 이벤트 유형 (view, click, cart, purchase) |
| event_value | FLOAT | | 이벤트 값 (구매 금액 등) |
| context | JSONB | DEFAULT '{}' | 컨텍스트 (디바이스, 위치 등) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 이벤트 발생 시각 |

**인덱스:**
- `idx_interactions_user_id` ON (user_id)
- `idx_interactions_item_id` ON (item_id)
- `idx_interactions_user_item` ON (user_id, item_id)
- `idx_interactions_event_type` ON (event_type)
- `idx_interactions_created_at` ON (created_at)

**파티셔닝:** created_at 기준 월별 파티셔닝 (데이터 증가 대비)

### 2.4 recommendation_logs (추천 로그)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | BIGSERIAL | PK | 내부 ID |
| user_id | BIGINT | FK -> users.id, NOT NULL | 추천 대상 사용자 |
| item_id | BIGINT | FK -> items.id, NOT NULL | 추천된 상품 |
| score | FLOAT | NOT NULL | 추천 점수 |
| rank | INTEGER | NOT NULL | 추천 순위 (1부터) |
| model_version | VARCHAR(100) | NOT NULL | 사용된 모델 버전 |
| is_clicked | BOOLEAN | DEFAULT FALSE | 클릭 여부 |
| is_converted | BOOLEAN | DEFAULT FALSE | 전환(구매) 여부 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 추천 시각 |

**인덱스:**
- `idx_reclogs_user_id` ON (user_id)
- `idx_reclogs_model_version` ON (model_version)
- `idx_reclogs_created_at` ON (created_at)

### 2.5 model_metadata (모델 메타데이터)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | BIGSERIAL | PK | 내부 ID |
| model_type | VARCHAR(100) | NOT NULL | 모델 유형 (user_cf, item_cf) |
| version | VARCHAR(100) | UNIQUE, NOT NULL | 모델 버전 (타임스탬프 기반) |
| artifact_path | VARCHAR(500) | NOT NULL | S3 아티팩트 경로 |
| training_started_at | TIMESTAMPTZ | NOT NULL | 학습 시작 시각 |
| training_finished_at | TIMESTAMPTZ | | 학습 완료 시각 |
| metrics | JSONB | DEFAULT '{}' | 학습 평가 지표 (precision, recall, NDCG 등) |
| hyperparameters | JSONB | DEFAULT '{}' | 하이퍼파라미터 |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'training' | 상태 (training, completed, failed, active, archived) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시각 |

**인덱스:**
- `idx_model_status` ON (status)
- `idx_model_type_status` ON (model_type, status)

### 2.6 performance_metrics (성능 지표)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | BIGSERIAL | PK | 내부 ID |
| model_id | BIGINT | FK -> model_metadata.id | 모델 ID |
| metric_name | VARCHAR(100) | NOT NULL | 지표명 (ctr, conversion_rate, coverage, diversity 등) |
| metric_value | FLOAT | NOT NULL | 지표 값 |
| period_start | TIMESTAMPTZ | NOT NULL | 집계 시작 시각 |
| period_end | TIMESTAMPTZ | NOT NULL | 집계 종료 시각 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 생성 시각 |

**인덱스:**
- `idx_perfmetrics_model_id` ON (model_id)
- `idx_perfmetrics_name_period` ON (metric_name, period_start)

## 3. 이벤트 유형 및 가중치

| event_type | 설명 | Implicit 가중치 |
|------------|------|-----------------|
| view | 상품 상세 조회 | 1.0 |
| click | 추천 결과 클릭 | 2.0 |
| cart | 장바구니 추가 | 3.0 |
| purchase | 구매 완료 | 5.0 |

가중치는 User-Item Matrix 구성 시 Implicit Feedback 점수 계산에 사용된다.

## 4. Redis 데이터 구조

### 추천 결과 캐시
```
Key:    rec:{user_id}
Value:  JSON [{"item_id": 123, "score": 0.95, "rank": 1}, ...]
TTL:    3600 (1시간)
```

### 실시간 이벤트 카운터
```
Key:    stats:events:{YYYY-MM-DD}
Type:   Hash
Fields: view_count, click_count, cart_count, purchase_count
TTL:    604800 (7일)
```

### 노출 이력 (중복 추천 방지)
```
Key:    shown:{user_id}:{session_id}
Type:   Set
Members: item_id 목록
TTL:    86400 (24시간)
```

## 5. 데이터 보존 정책

| 데이터 | 보존 기간 | 근거 |
|--------|-----------|------|
| interactions | 12개월 | 모델 학습에 최근 데이터가 중요 |
| recommendation_logs | 6개월 | 성능 분석 기간 |
| performance_metrics | 24개월 | 장기 트렌드 분석 |
| model_metadata | 영구 | 감사 목적 |
| 아카이브된 모델 아티팩트 | 3개월 | 롤백 대비 |
