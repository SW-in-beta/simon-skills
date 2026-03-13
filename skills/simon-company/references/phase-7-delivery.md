# Phase 7: Delivery & Handoff

## 목차
- [7-A: Final Verification](#7-a-final-verification)
- [7-B: Final Report](#7-b-final-report)
- [7-C: Guided Review](#7-c-guided-review)
- [7-D: Finalization](#7-d-finalization)

### 7-A: Final Verification

모든 Phase의 TRP 결과를 취합하여 최종 검증:

```markdown
# Final Verification Report

## Build & Test
- 빌드: PASS/FAIL
- 단위 테스트: N passed
- 통합 테스트: N passed
- E2E 테스트: N passed

## TRP Summary
| Phase | R1 | R2 | R3 | Revisions |
|-------|----|----|-------|-----------|
| 1 | PASS | PASS | APPROVED | 0 |
| 2 | PASS | PASS | APPROVED | 1 (디자인 수정) |
| 3 | PASS | PASS | APPROVED | 0 |
| 4 | PASS | PASS | APPROVED | 2 (API 수정) |
| 5 | PASS | PASS | APPROVED | 0 |
| 6 | PASS | PASS | APPROVED | 1 (모니터링 추가) |

## Security
- CRITICAL: 0
- HIGH: 0
- 잔여 MEDIUM: N건 (문서화됨)

## Infrastructure
- CI/CD: 설정 완료
- Docker: 빌드 성공
- 모니터링: 설정 완료
- 런북: 작성 완료

## Unresolved Items
- [있으면 목록]
```

Save: `.claude/company/verification.md`

### 7-B: Final Report

```markdown
# Project Completion Report: [프로젝트명]

## Executive Summary
- [3-5줄 핵심 요약]

## PRD vs Implementation
| Feature | PRD | Status | Notes |
|---------|-----|--------|-------|
| [기능명] | P1 | Done | |

## Team Contributions
| Team | Features | Key Decisions |
|------|----------|---------------|
| Backend | F3, F5, F8 | JWT 인증, Redis 캐싱 |
| Frontend | F4, F6, F9 | React + Tailwind |

## Architecture Overview
[최종 아키텍처 다이어그램]

## Recommendations
- [향후 개선 제안]
- [기술 부채 목록]
```

### 7-C: Guided Review

사용자에게 팀별 주요 산출물을 순차 리뷰:
- 각 팀의 핵심 변경사항 요약
- 주요 설계 결정과 이유
- AskUserQuestion으로 피드백 수집
- 수정 요청 시 즉시 반영

### 7-D: Finalization

1. 최종 수정사항 커밋
2. AskUserQuestion: "PR을 생성할까요?"
3. PR 생성 시 `/git-push-pr` 활용
4. `.claude/company/retrospective.md`에 프로젝트 회고 기록:
   - 잘된 점
   - 개선할 점
   - TRP에서 가장 많이 리젝된 유형
   - 팀간 협업 이슈
