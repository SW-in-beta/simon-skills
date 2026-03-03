---
name: simon-bot-sessions
description: "simon-bot 세션 관리. 워크트리 기반 작업 세션을 조회, 이어서 작업, 삭제할 수 있습니다. Use when: (1) 이전 작업 세션 목록 확인, (2) 특정 브랜치의 작업을 이어서 진행, (3) 완료된 세션 삭제, (4) 세션에 리뷰 피드백 전달."
---

# simon-bot Sessions

simon-bot 워크트리 기반 작업 세션 관리 스킬.

## Instructions

사용자의 요청에 따라 아래 명령 중 하나를 실행합니다.
스크립트 경로: `~/.claude/skills/simon-bot/workflow/scripts/manage-sessions.sh`

### 명령 판별

사용자 입력에서 의도를 파악:

| 의도 | 키워드 | 실행 |
|------|--------|------|
| 세션 목록 | "목록", "list", "세션 확인", "어떤 작업", args 없음 | `list` |
| 세션 상세 | "정보", "info", "상세", 브랜치명 언급 | `info {branch}` |
| 세션 삭제 | "삭제", "delete", "제거", "정리" | `delete {branch}` |
| 이어서 작업 | "이어서", "continue", "resume", "피드백" | `resume` flow |
| PR 생성 | "PR", "풀리퀘스트", "push" | `pr` flow |

### list - 세션 목록

```bash
bash ~/.claude/skills/simon-bot/workflow/scripts/manage-sessions.sh list
```

결과를 사용자에게 보기 좋게 정리하여 표시.

### info - 세션 상세

```bash
bash ~/.claude/skills/simon-bot/workflow/scripts/manage-sessions.sh info {branch-name}
```

브랜치명이 없으면 사용자에게 물어봄 (AskUserQuestion).

### delete - 세션 삭제

```bash
bash ~/.claude/skills/simon-bot/workflow/scripts/manage-sessions.sh delete {branch-name}
```

삭제 전 반드시 사용자에게 확인 (AskUserQuestion):
- "정말 `{branch-name}` 세션을 삭제하시겠습니까? (워크트리 + 브랜치 모두 제거됨)"

### resume - 이어서 작업

1. `info {branch-name}`으로 세션 상태 확인
2. 해당 워크트리 경로를 파악
3. 워크트리 내 `.omc/memory/` 파일들을 읽어 맥락 복원:
   - `plan-summary.md` - 작업 계획
   - `branch-name.md` - 브랜치명
   - `feedback.md` - 이전 피드백 (있으면)
   - `integration-result.md` - 통합 결과 (있으면)
   - `retrospective.md` - 회고 (있으면)
4. 사용자에게 현재 상태 요약 보고
5. 사용자의 추가 요청 (피드백, 수정사항)을 받아 해당 워크트리에서 작업 실행
6. 수정사항은 `executor` 에이전트에게 위임

### pr - PR 생성

1. `info {branch-name}`으로 세션 상태 확인
2. 해당 워크트리에 커밋되지 않은 변경이 있으면 커밋
3. 브랜치를 원격에 push
4. `/git-push-pr` 스킬 호출하여 Draft PR 생성
