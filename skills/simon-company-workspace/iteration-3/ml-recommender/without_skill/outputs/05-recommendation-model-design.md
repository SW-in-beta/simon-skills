# 추천 모델 설계 (Collaborative Filtering)

## 1. 모델 개요

Collaborative Filtering(CF) 기반으로 사용자에게 상품을 추천한다. 명시적 평점(explicit feedback)이 아닌 행동 데이터(implicit feedback)를 활용하며, User-based CF와 Item-based CF 두 가지 접근을 병행한다.

## 2. Implicit Feedback 처리

### 2.1 행동 데이터 -> 선호도 점수 변환

사용자 u와 상품 i의 상호작용을 단일 선호도 점수로 변환한다.

```
preference(u, i) = SUM(weight(event_type) * frequency(u, i, event_type))
```

| event_type | weight | 근거 |
|------------|--------|------|
| view | 1.0 | 관심 표현의 최소 단위 |
| click | 2.0 | 적극적 관심 |
| cart | 3.0 | 구매 의도 |
| purchase | 5.0 | 확정된 선호 |

### 2.2 시간 감쇠 (Time Decay)

최근 행동에 더 높은 가중치를 부여한다.

```
time_weight(t) = exp(-lambda * (now - t).days)
lambda = 0.01  (반감기 약 69일)
```

최종 점수:
```
score(u, i) = SUM(weight(e) * time_weight(t) * frequency(u, i, e, t))
```

### 2.3 점수 정규화

사용자별 활동량 차이를 보정하기 위해 L2 정규화 또는 로그 변환을 적용한다.

```
normalized_score(u, i) = log(1 + score(u, i))
```

## 3. User-Item Matrix 구성

### 3.1 Matrix 구조

```
         item_1  item_2  item_3  ...  item_m
user_1  [ 2.3    0.0     1.5    ...   0.0  ]
user_2  [ 0.0    4.1     0.0    ...   3.2  ]
user_3  [ 1.2    0.0     0.0    ...   0.0  ]
  ...
user_n  [ 0.0    0.0     2.8    ...   1.1  ]
```

- 행: 사용자 (n명)
- 열: 상품 (m개)
- 값: 정규화된 선호도 점수
- 희소 행렬(Sparse Matrix)로 저장: scipy.sparse.csr_matrix

### 3.2 데이터 필터링

모델 학습 전 노이즈 제거를 위한 필터링 조건:

- 최소 상호작용 수: 사용자당 5회 이상, 상품당 3회 이상
- 데이터 기간: 최근 6개월
- 비활성 사용자/상품 제외
- 이상치 제거: 단일 사용자의 과도한 view 이벤트 상한 (상위 1% 클리핑)

## 4. User-based Collaborative Filtering

### 4.1 알고리즘 개요

"나와 비슷한 사용자가 좋아한 상품"을 추천한다.

### 4.2 사용자 유사도 계산

코사인 유사도를 기본으로 사용한다.

```
sim(u, v) = (R_u · R_v) / (||R_u|| * ||R_v||)
```

여기서 R_u, R_v는 각각 사용자 u, v의 상호작용 벡터이다.

**대안 유사도 함수:**
- Pearson 상관계수: 사용자 평균 편향 보정
- Jaccard 유사도: 이진(binary) 상호작용에 적합

### 4.3 추천 점수 예측

```
pred(u, i) = SUM(sim(u, v) * r(v, i)) / SUM(|sim(u, v)|)
             v in N(u)
```

- N(u): 사용자 u와 가장 유사한 K명의 이웃 (K-Nearest Neighbors)
- r(v, i): 이웃 사용자 v의 상품 i에 대한 선호도 점수

### 4.4 하이퍼파라미터

| 파라미터 | 기본값 | 탐색 범위 | 설명 |
|----------|--------|-----------|------|
| n_neighbors (K) | 50 | [20, 50, 100, 200] | 유사 사용자 수 |
| similarity_metric | cosine | [cosine, pearson] | 유사도 함수 |
| min_common_items | 3 | [2, 3, 5] | 유사도 계산 최소 공통 상품 수 |

## 5. Item-based Collaborative Filtering

### 5.1 알고리즘 개요

"내가 좋아한 상품과 비슷한 상품"을 추천한다. 사용자 수보다 상품 수가 적을 때 더 효율적이며, 상품 간 유사도는 사전 계산하여 캐싱 가능하다.

### 5.2 상품 유사도 계산

User-Item Matrix를 전치(transpose)하여 상품 간 유사도를 계산한다.

```
sim(i, j) = (R_i · R_j) / (||R_i|| * ||R_j||)
```

여기서 R_i, R_j는 상품 i, j를 구매한 사용자 벡터이다.

### 5.3 추천 점수 예측

```
pred(u, i) = SUM(sim(i, j) * r(u, j)) / SUM(|sim(i, j)|)
             j in I(u)
```

- I(u): 사용자 u가 상호작용한 상품 집합

### 5.4 하이퍼파라미터

| 파라미터 | 기본값 | 탐색 범위 | 설명 |
|----------|--------|-----------|------|
| n_similar_items (K) | 30 | [10, 30, 50, 100] | 유사 상품 수 |
| similarity_metric | cosine | [cosine, adjusted_cosine] | 유사도 함수 |
| min_common_users | 5 | [3, 5, 10] | 유사도 계산 최소 공통 사용자 수 |

## 6. Matrix Factorization (ALS) - 보조 모델

Sparse한 User-Item Matrix를 저차원 잠재 요인(latent factor)으로 분해한다.

### 6.1 알고리즘

Alternating Least Squares (ALS)를 사용한다. Implicit feedback에 최적화된 Hu et al.(2008) 방식을 적용한다.

```
R ≈ X * Y^T

X: 사용자 잠재 요인 행렬 (n x f)
Y: 상품 잠재 요인 행렬 (m x f)
f: 잠재 요인 차원 수
```

### 6.2 하이퍼파라미터

| 파라미터 | 기본값 | 탐색 범위 | 설명 |
|----------|--------|-----------|------|
| factors (f) | 64 | [32, 64, 128] | 잠재 요인 수 |
| regularization | 0.01 | [0.001, 0.01, 0.1] | 정규화 계수 |
| iterations | 15 | [10, 15, 20, 30] | ALS 반복 횟수 |
| alpha | 40 | [10, 20, 40] | 신뢰도 가중치 |

### 6.3 구현 라이브러리

- `implicit` 라이브러리의 `AlternatingLeastSquares` 클래스
- GPU 가속 지원 (Phase 2에서 검토)

## 7. 앙상블 전략

User-based CF, Item-based CF, ALS 모델의 추천 결과를 결합한다.

### 7.1 가중 평균 방식

```
final_score(u, i) = w1 * score_user_cf(u, i)
                  + w2 * score_item_cf(u, i)
                  + w3 * score_als(u, i)

w1 + w2 + w3 = 1
초기 가중치: w1=0.3, w2=0.3, w3=0.4
```

### 7.2 가중치 최적화

검증 데이터셋의 NDCG@10을 최대화하는 가중치를 그리드 서치로 탐색한다.

## 8. 콜드 스타트 처리

### 8.1 신규 사용자 (User Cold Start)

행동 데이터가 min_interactions 미만인 사용자에게는 다음 전략을 순차 적용한다:

1. **인기도 기반 추천**: 전체 사용자 대상 상위 인기 상품
2. **카테고리 인기도**: 사용자가 마지막으로 본 카테고리의 인기 상품
3. **트렌딩 상품**: 최근 7일간 상호작용 증가율이 높은 상품

### 8.2 신규 상품 (Item Cold Start)

상호작용이 min_interactions 미만인 상품은:

1. CF 추천 대상에서 제외 (유사도 계산 불가)
2. 인기도 기반 추천 풀에 포함
3. Phase 2에서 Content-based 방식으로 보완

## 9. 모델 평가 지표

### 9.1 오프라인 평가 (학습 시)

| 지표 | 설명 | 목표 |
|------|------|------|
| Precision@K | 상위 K개 추천 중 관련 상품 비율 | > 0.10 |
| Recall@K | 관련 상품 중 추천된 비율 | > 0.05 |
| NDCG@K | 순위 가중 관련도 | > 0.12 |
| MAP@K | 평균 정밀도의 평균 | > 0.08 |
| Coverage | 추천된 고유 상품 / 전체 상품 | > 0.50 |
| Diversity | 추천 목록 내 상품 간 평균 비유사도 | > 0.60 |

K = 10 기본

### 9.2 온라인 평가 (서빙 후)

| 지표 | 설명 | 목표 |
|------|------|------|
| CTR | 추천 클릭률 | > 5% |
| Conversion Rate | 추천 전환율 | > 1% |
| Session Length | 추천 클릭 후 세션 지속 시간 | 증가 |
| Revenue Impact | 추천 경유 매출 비중 | 측정 |

### 9.3 평가 데이터 분할

```
전체 상호작용 데이터
├── 학습 데이터 (80%) - 시간순 앞부분
│   ├── 학습 (80% of 학습)
│   └── 검증 (20% of 학습)
└── 테스트 데이터 (20%) - 시간순 뒷부분
```

- 시간 기반 분할 (temporal split): 미래 데이터 누수 방지
- Leave-one-out: 사용자별 마지막 상호작용을 테스트로 분리 (보조)

## 10. 학습 파이프라인 흐름

```
1. 데이터 추출
   └── PostgreSQL에서 최근 6개월 interactions 조회

2. 전처리
   ├── 이벤트 가중치 적용
   ├── 시간 감쇠 적용
   ├── 로그 정규화
   ├── 최소 상호작용 필터링
   └── Sparse Matrix 구성

3. 데이터 분할
   └── 시간 기반 train/validation/test 분할

4. 모델 학습
   ├── User-based CF: 유사도 행렬 계산
   ├── Item-based CF: 유사도 행렬 계산
   └── ALS: 잠재 요인 학습

5. 모델 평가
   ├── 각 모델별 오프라인 지표 계산
   ├── 앙상블 가중치 최적화
   └── 최종 앙상블 모델 평가

6. 모델 저장
   ├── 모델 아티팩트 -> S3
   ├── 메타데이터 -> PostgreSQL
   └── 성능 지표 -> PostgreSQL

7. 서빙 배포
   ├── API 서버에 모델 리로드 시그널
   └── 상위 활성 사용자 추천 사전 계산 -> Redis
```

## 11. 모델 아티팩트 구조

```
s3://model-store/recommendations/
└── user_cf_v20260307_020000/
    ├── model.pkl              # 학습된 모델 객체
    ├── user_similarity.npz    # 사용자 유사도 행렬 (sparse)
    ├── user_mapping.json      # user_id <-> matrix_index 매핑
    ├── item_mapping.json      # item_id <-> matrix_index 매핑
    ├── metadata.json          # 하이퍼파라미터, 학습 정보
    └── metrics.json           # 평가 지표
```
