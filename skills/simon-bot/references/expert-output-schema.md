# Expert Findings Output Schema

모든 전문가 에이전트가 공유하는 구조화된 출력 형식. Cross-team Synthesis의 일관성과 CRITICAL severity의 신뢰도를 보장한다.

## Analysis Process

각 변경된 코드 블록에 대해 다음 순서로 분석한다:

1. **OBSERVE**: Before/After/Delta를 사실로만 기술한다. 해석하지 않는다.
2. **TRACE**: 영향 범위를 추적한다 — caller, callee, 데이터 흐름, 상태 변경.
3. **HYPOTHESIZE**: 잠재적 문제를 가설로 제시한다. "~할 수 있다"로 표현.
4. **VERIFY**: 가설을 코드에서 검증한다.
   - 성립 → finding 작성
   - 성립하지 않음 → 보고하지 않음

**VERIFY 없이 HYPOTHESIZE만으로 finding을 작성하지 마라.** 가설을 세우고 코드에서 확인하는 과정을 거쳐야 추측성 보고를 방지할 수 있다.

## Subtle Bug Detection Heuristics

분석 시 다음 패턴을 특히 주의하여 탐색한다. 공통 패턴은 모든 도메인 전문가가 적용하고, 도메인 전용 패턴은 해당 도메인만 적용한다.

### 공통 (모든 도메인)

1. **Behavioral Cascade**: 변경이 호출 체인 하류에서 예상과 다른 동작을 유발하는가?
2. **Implicit Contract Violation**: 명시되지 않은 암묵적 계약(타입 의미론, 캐시 초기화 순서, 호출 순서 가정)을 깨뜨리는가?
3. **Silent Failure**: 에러를 삼키거나 기본값으로 조용히 대체하여 문제를 숨기는가?
4. **Partial Operation Failure**: 다단계 작업의 중간에서 실패 시 부분적으로 완료된 상태가 남는가? (예: DB 업데이트 성공 + 캐시 무효화 실패)
5. **Boundary Condition**: 경계값(0, 빈 컬렉션, 최대값, null)에서 기대와 다른 동작이 발생하는가?

### Safety 전용

6. **Security Boundary Erosion**: 인증/인가/검증 경로를 우회하거나 약화시키는가?

### Data/Ops 전용

7. **State Corruption Window**: 동시 접근 시 상태 불일치를 만들 수 있는 시간 창이 존재하는가?
8. **Resource Lifecycle**: 리소스(연결, 파일 핸들, 락)가 모든 코드 경로에서 올바르게 획득-사용-해제되는가?

## Findings Schema

각 전문가는 발견사항을 아래 형식으로 작성한다:

```
FINDING_ID: {domain}-{seq}        # 예: safety-001, data-003
SEVERITY: CRITICAL | HIGH | MEDIUM
CONFIDENCE: HIGH | MEDIUM | LOW
FILE: {path}:{line}               # 관련 파일과 라인
ISSUE: (1-2 sentences)            # 발견된 문제
EVIDENCE: (코드 스니펫 또는 참조)  # 근거
RECOMMENDATION: (구체적 수정 방안)
CROSS_DOMAIN: (다른 도메인에 영향 여부와 대상)
VERIFICATION_STATUS: PENDING     # Verification Layer 결과: VERIFIED | UNVERIFIED | PENDING
ACCEPTANCE_STATUS: PENDING       # 수용 추적: PENDING | ACCEPTED | REJECTED | MODIFIED | DEFERRED
ACCEPTANCE_REASON:               # 상태 변경 사유 (상태 변경 시 기록)
REJECTION_DETAIL:                # REJECTED 시 분류: FALSE_POSITIVE | OVER_SEVERITY | IMPRACTICAL | OUT_OF_SCOPE
```

### REJECTION_DETAIL 분류 기준

ACCEPTANCE_STATUS가 REJECTED일 때 반드시 REJECTION_DETAIL을 기록한다:

| 분류 | 의미 | 예시 |
|------|------|------|
| `FALSE_POSITIVE` | 지적한 문제가 실제로 존재하지 않음 | ORM이 이미 파라미터 바인딩하는데 SQL injection 경고 |
| `OVER_SEVERITY` | 문제는 존재하나 severity가 과도함 | TTL 5초 캐시 불일치를 CRITICAL로 분류 |
| `IMPRACTICAL` | 문제는 맞지만 수정 비용 대비 효과가 부족 | 레거시 전체 리팩토링 필요한 개선 제안 |
| `OUT_OF_SCOPE` | 이번 PR의 변경 범위 밖의 기존 문제 | 변경하지 않은 파일의 기존 결함 지적 |

## Severity Calibration Guide

> **Single Source of Truth**: Severity 판정 기준과 경계 사례 원칙은 `review-rubric.md`에 정의되어 있다.
> 이 섹션은 경계 사례의 **코드 예시**만 제공하여 판정 감각을 보조한다.

### Severity Boundary Examples

교과서적 사례가 아닌, 실제 코드 리뷰에서 마주치는 경계 사례의 판단 기준:

**Example 1: CRITICAL — 단일 라인 인증 체크 제거**
```python
# Before
def get_user_data(request):
    if not request.user.is_authenticated:
        raise PermissionDenied()
    return UserData.objects.get(user=request.user)

# After (1줄 제거)
def get_user_data(request):
    return UserData.objects.get(user=request.user)
```
- WHY CRITICAL: 인증 경계가 완전히 제거됨. 미인증 사용자가 모든 데이터에 접근 가능.
- WHY NOT HIGH: "특정 조건에서만 오동작"이 아니라 모든 요청에서 보안 경계가 없음.

**Example 2: HIGH — 캐시 무효화 누락**
```go
func UpdateUserProfile(id int, data Profile) error {
    err := db.Update("users", id, data)
    // cache.Invalidate("user:" + strconv.Itoa(id)) ← 삭제됨
    return err
}
```
- WHY HIGH: DB는 갱신되지만 캐시에 이전 데이터가 남아 사용자에게 오래된 정보 표시. TTL 만료 전까지 지속.
- WHY NOT CRITICAL: 데이터 손실 없음, 보안 경계 파괴 아님, 시간이 지나면 자연 해소.
- WHY NOT MEDIUM: 사용자에게 직접 잘못된 데이터가 보이므로 "잠재적" 수준이 아님.

**Example 3: 경계 사례 — 타입 불일치 (컨텍스트 의존)**
- 컴파일 타임에 잡히면 → **MEDIUM**: strict mode에서 빌드 실패. 배포 전 발견 보장.
- 런타임에만 드러나면 → **HIGH**: 타입 체크가 없으면 프로덕션에서 예상치 못한 형변환 결과 발생.

## Calibration Walk-through

실제 분석 과정(OBSERVE → TRACE → HYPOTHESIZE → VERIFY)과 severity 판정 근거를 보여주는 예시.

### Walk-through 1: HIGH — 루프 내 N+1 쿼리

**입력 Diff:**
```python
+def get_active_campaigns(advertiser_ids: list[int]):
+    campaigns = []
+    for adv_id in advertiser_ids:
+        campaigns.extend(Campaign.objects.filter(advertiser_id=adv_id, is_active=True))
+    return campaigns
```

**분석 과정:**
- **OBSERVE**: advertiser_ids 리스트를 순회하며 건당 DB 쿼리를 실행한다.
- **TRACE**: 호출부에서 advertiser_ids는 최대 수백 개(광고주 목록 API). 각 반복마다 `SELECT ... WHERE advertiser_id = ? AND is_active = 1` 발생.
- **HYPOTHESIZE**: advertiser_ids가 N개이면 N번의 DB 쿼리가 발생하여 응답 지연 및 DB 부하를 유발할 수 있다.
- **VERIFY**: `Campaign.objects.filter(advertiser_id__in=advertiser_ids, is_active=True)`로 1회 쿼리가 가능하나 사용하지 않음. 확인 완료.

**Finding 출력:**
```
FINDING_ID: data-001
SEVERITY: HIGH
CONFIDENCE: HIGH
FILE: campaigns/service.py:12
ISSUE: 루프 내 건별 쿼리로 N+1 문제 발생. advertiser_ids 크기에 비례하여 DB 부하 증가.
EVIDENCE: for 루프 내 Campaign.objects.filter() 호출
RECOMMENDATION: advertiser_id__in=advertiser_ids로 단일 쿼리 변환
```
- **WHY HIGH**: 프로덕션에서 체감 가능한 성능 저하. 수백 건의 불필요한 쿼리.
- **WHY NOT CRITICAL**: 데이터 손실/보안 침해 없음. 느릴 뿐 기능적으로 정확함.

### Walk-through 2: HIGH vs CRITICAL 경계 — 미검증 사용자 입력의 SQL 도달

**입력 Diff:**
```python
+def search_products(request):
+    keyword = request.GET.get("q", "")
+    products = Product.objects.filter(name__icontains=keyword)
+    return JsonResponse({"results": list(products.values("id", "name"))})
```

**분석 과정:**
- **OBSERVE**: 사용자 입력 `keyword`가 ORM 필터에 직접 전달된다.
- **TRACE**: `__icontains`는 Django ORM이 파라미터화된 `LIKE %keyword%` 쿼리로 변환. 사용자 입력이 SQL 문자열에 직접 결합되지 않음.
- **HYPOTHESIZE**: SQL injection이 가능할 수 있다.
- **VERIFY**: Django ORM의 `filter()`는 파라미터 바인딩을 사용하므로 SQL injection 경로 없음. **가설 기각.**
- **HYPOTHESIZE (2차)**: `%`, `_` 등 LIKE 와일드카드로 의도치 않은 광범위 검색이 가능할 수 있다.
- **VERIFY**: `keyword`에 `%` 입력 시 전체 테이블 스캔 유발 가능. ORM이 LIKE 와일드카드를 이스케이프하지 않음. 확인 완료.

**Finding 출력:**
```
FINDING_ID: safety-002
SEVERITY: HIGH
CONFIDENCE: MEDIUM
FILE: products/views.py:3
ISSUE: 사용자 입력이 LIKE 와일드카드 이스케이프 없이 icontains에 전달되어 의도치 않은 전체 스캔 유발 가능.
EVIDENCE: request.GET.get("q")가 filter(name__icontains=keyword)에 직접 전달
RECOMMENDATION: 입력에서 %, _ 문자를 이스케이프하거나 길이 제한 적용
```
- **WHY HIGH**: DoS 벡터가 될 수 있으나 데이터 유출/변조 경로는 아님.
- **WHY NOT CRITICAL**: SQL injection이 아님 — ORM 파라미터 바인딩이 보호. 만약 `raw()`나 `extra()`로 직접 SQL 조합이었다면 CRITICAL.

## CRITICAL Severity Voting (검증)

CRITICAL severity 후보가 나오면, 해당 항목에 대해 독립 검증을 수행한다:
1. 해당 코드를 다시 Read로 읽고, 이전 분석을 참조하지 않은 상태에서 severity를 재판정
2. 재판정도 CRITICAL이면 확정
3. 재판정이 HIGH이면 → HIGH로 하향, 하향 근거를 findings에 기록

이 검증은 CRITICAL 남발을 방지하고, 진짜 중대한 이슈만 CRITICAL로 분류되도록 한다.
