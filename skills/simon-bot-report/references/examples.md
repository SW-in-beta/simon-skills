# 산출물 예시

writer agent가 최종 보고서를 작성할 때 아래 예시의 톤, 구조, 구체성 수준을 참고한다.

## RFC 예시 (발췌)

```markdown
# RFC: 토큰 기반 인증에서 세션 기반 인증으로 전환

## 배경

현재 시스템은 JWT 기반 무상태(stateless) 인증을 사용하고 있다. 토큰 만료 시간이 24시간으로 설정되어 있어, 탈취된 토큰을 즉시 무효화할 방법이 없다.

관련 코드: `pkg/auth/jwt.go` (토큰 생성/검증), `middleware/auth.go` (미들웨어)

## 현황 분석

### 현재 구조

┌─────────┐     JWT      ┌───────────┐
│ Client  │──────────────▶│  API GW   │──▶ 서비스
└─────────┘              └───────────┘
                         (검증만, 저장 없음)

### 문제점

1. **즉시 무효화 불가** — 토큰 탈취 시 만료까지 최대 24시간 노출
   - `pkg/auth/jwt.go:45` — `ExpiresAt: time.Now().Add(24 * time.Hour)`
2. **블랙리스트 부재** — 로그아웃해도 토큰이 유효

### 전문가 분석

- **Safety Team** (CRITICAL): 토큰 즉시 무효화 메커니즘 부재는 보안 사고 시 대응 시간을 24시간까지 지연시킴
- **Data Team** (HIGH): Redis 세션 스토어 도입 시 기존 캐시 인프라와의 키 네이밍 충돌 가능성

## 제안

### Option A: Redis 세션 스토어 (권장)
- 세션 ID를 Redis에 저장, 즉시 삭제로 무효화
- 장점: 즉시 무효화, 세션 메타데이터 활용
- 단점: Redis 의존성 추가, 상태 관리 복잡도

### Option B: JWT 블랙리스트
- 무효화된 토큰 ID를 Redis에 저장
- 장점: 기존 JWT 흐름 유지
- 단점: 블랙리스트 크기 증가, TTL 관리

## 리스크

| 리스크 | 심각도 | 완화 방안 |
|--------|--------|----------|
| Redis 장애 시 인증 불가 | HIGH | Sentinel 구성 + JWT 폴백 |
| 마이그레이션 중 세션 유실 | MEDIUM | 점진적 전환 (dual-mode) |

## 추후 결정 필요

- Redis Sentinel vs Cluster 구성 선택
- 기존 JWT 토큰의 전환 기간 (즉시 만료 vs 점진적 마이그레이션)
```

## 현황 분석 예시 (발췌)

```markdown
# 현황 분석: 주문 처리 파이프라인

## 요약

주문 처리 파이프라인은 5개 서비스(Order, Payment, Inventory, Shipping, Notification)로 구성된다.
현재 동기 HTTP 호출 체인으로 연결되어 있어, 하나의 서비스 장애가 전체 주문 처리를 중단시킨다.

## 아키텍처 현황

```
Order → Payment → Inventory → Shipping → Notification
(동기 HTTP 체인, 장애 전파 경로)
```

핵심 파일:
- `order-svc/handler/create.go` — 주문 생성 핸들러 (Payment 동기 호출)
- `order-svc/client/payment.go` — Payment 서비스 HTTP 클라이언트 (타임아웃: 30초)
- `payment-svc/handler/charge.go` — 결제 처리 (Inventory 동기 호출)

## 주요 발견사항

### [CRITICAL] 장애 전파 — 단일 서비스 장애가 전체 체인을 중단

**현재 상태**: Payment 서비스 30초 타임아웃(`order-svc/client/payment.go:12`) 동안 Order 서비스의 고루틴이 블로킹됨. Payment 서비스 장애 시 Order 서비스도 응답 불가.

**전문가 합의**: Integration Team(sync-api-expert, async-expert)이 만장일치로 CRITICAL 판정. Safety Team(stability-expert)이 독립 분석으로 확인.

**권장사항**: 비동기 메시징(Kafka/NATS) 도입으로 서비스 간 결합도 해소

### [HIGH] 멱등성 미보장 — 재시도 시 중복 결제 가능

**현재 상태**: `payment-svc/handler/charge.go`에 멱등성 키 검증 로직 없음. 네트워크 재시도 시 동일 결제가 2회 처리될 수 있음.

## 추후 문제가 될 수 있음

- Notification 서비스의 이메일 발송이 동기 체인 내에 있어, 이메일 서버 장애가 주문 완료를 차단함
- Inventory 차감과 Payment 승인 사이에 트랜잭션 경계가 없어, 부분 실패 시 불일치 발생 가능
```
