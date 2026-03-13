# Delivery Detail

Phase 6의 상세 프로세스. SKILL.md에서 참조한다.

---

## 6-A: Final Report

사용자에게 전체 프로젝트 완료 보고:
- PRD 대비 구현 현황 (Feature별 완료 상태)
- 전체 검증 결과 요약
- 아키텍처 개요
- 미해결/보류 항목
- 향후 개선 제안

## 6-B: Guided Review

사용자에게 주요 Feature별로 순차 리뷰 제공:
- 각 Feature의 핵심 변경사항 요약
- 주요 설계 결정과 이유
- AskUserQuestion으로 피드백 수집
- 수정 요청 시 즉시 반영

## 6-C: Completion Summary (P-012)

프로젝트 완료 시 고정 형식의 정량적 요약을 출력한다:
```
=== 프로젝트 완료 ===
Features: {completed}/{total} 완료
변경: {N} 파일 (+{added} / -{removed} lines)
테스트: 전체 {pass}/{total} 통과
검증: Architecture CRITICAL {N}, Security CRITICAL {N}
미해결: {N}건 (미해결 결정사항 참조)
===
```

## 6-D: Finalization

- 최종 수정사항 커밋
- AskUserQuestion: "PR을 생성할까요?"
- PR 생성 시 `/git-push-pr` 활용
- `.claude/pm/retrospective.md`에 회고 기록
