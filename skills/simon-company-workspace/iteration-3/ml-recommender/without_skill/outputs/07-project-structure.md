# 프로젝트 디렉토리 구조

## 1. 전체 구조

```
recommendation-system/
├── docker-compose.yml
├── .env.example
├── Makefile
│
├── api/                          # FastAPI 백엔드
│   ├── pyproject.toml
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/            # DB 마이그레이션 파일
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI 앱 엔트리포인트
│   │   ├── config.py            # 설정 (pydantic-settings)
│   │   │
│   │   ├── domain/              # 도메인 레이어
│   │   │   ├── __init__.py
│   │   │   ├── models/          # 도메인 엔티티
│   │   │   │   ├── user.py
│   │   │   │   ├── item.py
│   │   │   │   ├── interaction.py
│   │   │   │   └── recommendation.py
│   │   │   └── services/        # 도메인 서비스
│   │   │       ├── recommendation_service.py
│   │   │       ├── event_service.py
│   │   │       └── metrics_service.py
│   │   │
│   │   ├── infrastructure/      # 인프라 레이어
│   │   │   ├── __init__.py
│   │   │   ├── database.py      # SQLAlchemy 설정
│   │   │   ├── redis_client.py  # Redis 클라이언트
│   │   │   ├── s3_client.py     # S3/MinIO 클라이언트
│   │   │   └── repositories/    # 데이터 접근
│   │   │       ├── user_repository.py
│   │   │       ├── item_repository.py
│   │   │       ├── interaction_repository.py
│   │   │       ├── recommendation_log_repository.py
│   │   │       └── model_repository.py
│   │   │
│   │   ├── api/                 # API 레이어
│   │   │   ├── __init__.py
│   │   │   ├── deps.py          # 의존성 주입
│   │   │   ├── middleware.py    # 미들웨어 (로깅, 인증)
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py    # 라우터 통합
│   │   │       ├── recommendations.py  # 추천 API 핸들러
│   │   │       ├── events.py           # 이벤트 API 핸들러
│   │   │       ├── items.py            # 상품 API 핸들러
│   │   │       └── admin/
│   │   │           ├── __init__.py
│   │   │           ├── metrics.py      # 지표 API 핸들러
│   │   │           └── models.py       # 모델 관리 API 핸들러
│   │   │
│   │   └── schemas/             # Pydantic 스키마 (요청/응답)
│   │       ├── __init__.py
│   │       ├── recommendation.py
│   │       ├── event.py
│   │       ├── item.py
│   │       ├── metrics.py
│   │       └── model.py
│   │
│   └── tests/
│       ├── conftest.py
│       ├── test_recommendations.py
│       ├── test_events.py
│       ├── test_items.py
│       └── test_admin/
│           ├── test_metrics.py
│           └── test_models.py
│
├── ml/                           # ML 모델 학습
│   ├── pyproject.toml
│   ├── Dockerfile
│   │
│   ├── recommender/
│   │   ├── __init__.py
│   │   ├── config.py            # 학습 설정
│   │   │
│   │   ├── data/
│   │   │   ├── __init__.py
│   │   │   ├── extractor.py     # DB 데이터 추출
│   │   │   ├── preprocessor.py  # 전처리, 가중치 적용
│   │   │   └── splitter.py      # train/val/test 분할
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── base.py          # 추상 모델 인터페이스
│   │   │   ├── user_cf.py       # User-based CF
│   │   │   ├── item_cf.py       # Item-based CF
│   │   │   ├── als.py           # ALS (Matrix Factorization)
│   │   │   ├── popularity.py    # 인기도 기반 (콜드 스타트)
│   │   │   └── ensemble.py      # 앙상블 모델
│   │   │
│   │   ├── evaluation/
│   │   │   ├── __init__.py
│   │   │   └── metrics.py       # 평가 지표 계산
│   │   │
│   │   ├── serving/
│   │   │   ├── __init__.py
│   │   │   └── model_loader.py  # 모델 로드 및 추론
│   │   │
│   │   └── pipeline/
│   │       ├── __init__.py
│   │       └── training.py      # 학습 파이프라인 오케스트레이션
│   │
│   └── tests/
│       ├── conftest.py
│       ├── test_preprocessor.py
│       ├── test_user_cf.py
│       ├── test_item_cf.py
│       ├── test_als.py
│       ├── test_ensemble.py
│       └── test_metrics.py
│
├── worker/                       # Celery 워커
│   ├── Dockerfile
│   ├── celery_app.py            # Celery 앱 설정
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── train_model.py       # 모델 학습 태스크
│   │   └── compute_metrics.py   # 지표 집계 태스크
│   └── beat_schedule.py         # 스케줄 설정
│
├── dashboard/                    # React 관리자 대시보드
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── vite.config.ts
│   │
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   │
│   │   ├── api/                 # API 클라이언트
│   │   │   ├── client.ts
│   │   │   ├── metrics.ts
│   │   │   └── models.ts
│   │   │
│   │   ├── components/          # UI 컴포넌트
│   │   │   ├── ui/              # shadcn/ui 기본 컴포넌트
│   │   │   ├── charts/
│   │   │   │   ├── LineChart.tsx
│   │   │   │   ├── BarChart.tsx
│   │   │   │   ├── PieChart.tsx
│   │   │   │   └── SparkLine.tsx
│   │   │   ├── KpiCard.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── PeriodSelector.tsx
│   │   │   └── Layout.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Overview.tsx
│   │   │   ├── MetricsRecommendation.tsx
│   │   │   ├── MetricsSystem.tsx
│   │   │   ├── ModelList.tsx
│   │   │   ├── ModelDetail.tsx
│   │   │   ├── ItemAnalysis.tsx
│   │   │   └── Login.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useMetrics.ts
│   │   │   ├── useModels.ts
│   │   │   └── useAuth.ts
│   │   │
│   │   └── types/
│   │       ├── metrics.ts
│   │       ├── model.ts
│   │       └── api.ts
│   │
│   └── tests/
│       └── ...
│
└── scripts/                      # 유틸리티 스크립트
    ├── seed_data.py             # 테스트 데이터 생성
    ├── run_training.py          # 수동 학습 실행
    └── health_check.py          # 헬스체크
```

## 2. 주요 설정 파일

### docker-compose.yml 서비스 구성
- recommendation-api (포트 8000)
- admin-api (포트 8001, recommendation-api와 동일 이미지, 다른 엔트리포인트)
- dashboard (포트 3000)
- worker (Celery Worker)
- beat (Celery Beat)
- postgres (포트 5432)
- redis (포트 6379)
- minio (포트 9000, 9001)

### 환경 변수 (.env.example)
```
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/recommendation
# Redis
REDIS_URL=redis://redis:6379/0
# S3
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=model-store
# API
API_KEY=your-api-key
JWT_SECRET=your-jwt-secret
# Model
MODEL_RETRAIN_CRON=0 2 * * *
MIN_USER_INTERACTIONS=5
MIN_ITEM_INTERACTIONS=3
```

## 3. 의존성 요약

### Python (api, ml, worker)
- fastapi, uvicorn
- sqlalchemy, alembic
- redis, boto3
- celery
- scikit-learn, scipy, numpy, pandas
- implicit (ALS)
- pydantic, pydantic-settings
- pytest, httpx (테스트)

### Node.js (dashboard)
- react, react-dom, react-router-dom
- recharts
- @tanstack/react-query
- tailwindcss
- shadcn/ui 컴포넌트
- typescript, vite
