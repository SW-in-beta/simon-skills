# Expert Findings Output Schema

모든 전문가 에이전트가 공유하는 구조화된 출력 형식. Cross-team Synthesis의 일관성과 CRITICAL severity의 신뢰도를 보장한다.

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
```

## Severity Calibration Guide

일관된 severity 판정을 위한 기준과 예시:

| Severity | 기준 | 예시 |
|----------|------|------|
| **CRITICAL** | 프로덕션 데이터 손실, 보안 경계 파괴, 서비스 전체 장애 가능 | SQL injection 취약점, 인증 우회, 무한 루프로 서비스 다운 |
| **HIGH** | 특정 조건에서 오동작, 성능 심각 저하, 유지보수 크게 저해 | 동시성 버그, N+1 쿼리, 에러 처리 누락으로 데이터 불일치 |
| **MEDIUM** | 코드 품질 저하, 컨벤션 불일치, 잠재적 문제 | 네이밍 불일치, 불필요한 복잡성, 테스트 커버리지 부족 |

**주의**: 단순한 성능 저하나 코드 스타일 문제는 CRITICAL이 아니다. CRITICAL은 "지금 당장 수정하지 않으면 사고가 날 수 있는" 수준에만 사용한다.

## CRITICAL Severity Voting (검증)

CRITICAL severity 후보가 나오면, 해당 항목에 대해 독립 검증을 수행한다:
1. 해당 코드를 다시 Read로 읽고, 이전 분석을 참조하지 않은 상태에서 severity를 재판정
2. 재판정도 CRITICAL이면 확정
3. 재판정이 HIGH이면 → HIGH로 하향, 하향 근거를 findings에 기록

이 검증은 CRITICAL 남발을 방지하고, 진짜 중대한 이슈만 CRITICAL로 분류되도록 한다.
