# 사용자 행동 기반 상품 추천 시스템 - 프로젝트 개요

## 1. 프로젝트 목표

사용자의 행동 데이터(조회, 클릭, 구매, 장바구니 등)를 기반으로 개인화된 상품 추천을 제공하는 시스템을 구축한다. Collaborative Filtering 알고리즘을 핵심 추천 모델로 사용하며, REST API를 통해 추천 결과를 서빙하고, 관리자 대시보드를 통해 추천 성능을 모니터링한다.

## 2. 핵심 요구사항

### 기능 요구사항
- 사용자 행동 데이터 수집 및 저장
- Collaborative Filtering 기반 상품 추천
- REST API를 통한 추천 결과 제공
- 관리자 대시보드에서 추천 성능 지표 모니터링

### 비기능 요구사항
- 추천 API 응답 시간: p95 < 200ms
- 모델 재학습 주기: 일 1회 (배치), 실시간 피드백 반영은 Phase 2
- 시스템 가용성: 99.9%
- 동시 사용자 처리: 1,000 RPS 이상

## 3. 페이즈 구분

### Phase 1 (현재 범위)
- 시스템 아키텍처 설계
- 데이터 모델 설계
- Collaborative Filtering 모델 설계 (User-based & Item-based)
- REST API 설계
- 관리자 대시보드 설계
- 기술 스택 선정

### Phase 2 (향후)
- 실시간 행동 데이터 스트리밍 파이프라인
- A/B 테스트 프레임워크
- 하이브리드 추천 (CF + Content-based)
- 모델 자동 재학습 파이프라인 (MLOps)

### Phase 3 (향후)
- 딥러닝 기반 추천 모델 (Neural CF, Transformer)
- 멀티모달 피처 통합
- 실시간 개인화 랭킹
- 글로벌 스케일링

## 4. 기술 스택

| 영역 | 기술 | 선정 근거 |
|------|------|-----------|
| API 서버 | Python (FastAPI) | ML 생태계 통합 용이, 비동기 지원 |
| 추천 모델 | scikit-learn, Surprise, Implicit | CF 알고리즘 구현체 풍부 |
| 데이터 저장소 | PostgreSQL | 사용자/상품/행동 데이터 OLTP |
| 캐시 | Redis | 추천 결과 캐싱, 실시간 조회 |
| 대시보드 | React + Recharts | 관리자 UI, 차트 시각화 |
| 모델 저장 | S3 / MinIO | 학습된 모델 아티팩트 저장 |
| 배치 처리 | Celery + Redis | 모델 재학습 스케줄링 |
| 컨테이너 | Docker + Docker Compose | 로컬/배포 환경 일관성 |

## 5. 주요 용어 정의

| 용어 | 정의 |
|------|------|
| User | 추천 대상이 되는 서비스 사용자 |
| Item | 추천 대상 상품 |
| Interaction | 사용자와 상품 간의 행동 (view, click, purchase, cart) |
| Implicit Feedback | 명시적 평점 없이 행동 데이터로 추론한 선호도 |
| User-Item Matrix | 사용자-상품 간 상호작용을 행렬로 표현한 것 |
| Collaborative Filtering | 유사 사용자/상품의 패턴으로 추천하는 알고리즘 |
