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
- **[GATE — PR 직접 생성 금지]** PM이 `gh pr create`를 직접 실행하는 것은 금지다. PR 생성은 반드시 `simon-bot-review` 스킬 호출을 통해 수행한다. 이 GATE를 위반하면 Draft 상태 불일치, 인라인 리뷰 누락이 발생한다.
  - 사전 검증: `simon-bot-review` 호출 전에, 현재 브랜치에 이미 PR이 존재하는지 확인한다:
    ```bash
    EXISTING_PR=$(gh pr view --json number,isDraft --jq '{number, isDraft}' 2>/dev/null || echo "none")
    ```
  - PR이 이미 있으면: `simon-bot-review`에 기존 PR 정보를 전달하여 Draft 전환 + 리뷰를 수행하도록 한다.
  - PR이 없으면: `simon-bot-review`가 Draft PR을 새로 생성한다.
- `.claude/pm/retrospective.md`에 회고 기록
