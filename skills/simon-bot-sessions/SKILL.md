---
name: simon-bot-sessions
description: "simon-bot 세션 관리 — 워크트리 기반 작업 세션을 조회, 이어서 작업, 삭제합니다. Use when: (1) 이전 작업 세션 목록 확인 (\"세션 목록\", \"작업 목록\", \"뭐 하고 있었지\"), (2) 특정 브랜치의 작업을 이어서 진행 (\"이어서 해줘\", \"계속해줘\"), (3) 완료된 세션 삭제 (\"세션 정리\", \"삭제해줘\"), (4) 세션에 리뷰 피드백 전달 (\"피드백 반영해줘\"). simon-bot 워크트리 작업의 상태 확인이나 재개가 필요할 때 사용하세요."
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

결과를 표시한 후, 각 워크트리의 `{worktree}/.claude/memory/session-meta.json`이 존재하면 파싱하여 진행도 포함 테이블을 출력:

```
| # | Branch              | Phase | Step   | Status      | Last Activity       |
|---|---------------------|-------|--------|-------------|---------------------|
| 1 | feat/some-feature   | B     | 7/19   | in_progress | 2026-03-05 14:30    |
| 2 | fix/bug-123         | C     | 15/19  | paused      | 2026-03-04 09:15    |
```

메타데이터가 없는 세션은 Phase/Step을 `-`로 표시.

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

#### Step 1: 세션 상태 확인
1. `info {branch-name}`으로 세션 상태 확인
2. 해당 워크트리 경로를 파악

#### Step 2: 맥락 복원 (Memory + Git 병행) + State Integrity Check (P-004)
워크트리 내 `.claude/memory/` 파일들을 읽어 맥락 복원 후 정합성을 검증한다:

**State Integrity Check** (memory 파일 읽기 완료 후 즉시 실행):
1. `plan-summary.md`의 Unit 목록과 `unit-*/` 디렉토리의 일치 여부
2. `CONTEXT.md`의 진행 상태와 실제 memory 파일 존재 여부의 일치
3. `session-meta.json`의 `last_commit_hash`와 실제 git HEAD의 일치
4. (grind) `failure-log.md` 상단의 잔여 budget과 기록된 재시도 횟수의 산술 일치
- 불일치 발견 시: `git log --oneline` 기반으로 실제 진행 상태를 재구성. **Git 이력을 SSoT로 우선**. 자동 복구 불가 시 사용자에게 보고.

**복원 대상 파일:**
- `session-meta.json` - 세션 메타데이터 (Phase, Step, status 등)
- `plan-summary.md` - 작업 계획
- `branch-name.md` - 브랜치명
- `CONTEXT.md` - 마지막 완료 Step 확인
- `feedback.md` - 이전 피드백 (있으면)
- `integration-result.md` - 통합 결과 (있으면)
- `retrospective.md` - 회고 (있으면)

**Git 상태 확인** (memory에 기록되지 않은 작업 발견용):
```bash
# 워크트리 디렉토리에서 실행
cd {worktree-path}
git log --oneline -10    # 최근 커밋 10개 확인
git status               # 미커밋 변경사항 확인
```
- memory의 Step 정보와 git 커밋 이력을 대조하여 실제 진행 상황을 정확히 파악
- 미커밋 변경사항이 있으면 Dashboard에 `Uncommitted Changes: YES` 표시

#### Step 3: Context Dashboard 제시
복원된 맥락을 표준화된 Dashboard 형태로 사용자에게 제시:

```
=== Session Resume: {branch-name} ===
Phase: {A|B|C} ({phase-name}) | Step: {current}/{total} | Path: {SMALL|STANDARD|LARGE}
Last Action: Step {N} 완료 ({description})
Pending Issues: {n} CRITICAL, {n} HIGH
Test Status: {pass}/{total} passing ({skip} skipped)
Uncommitted Changes: {YES/NO}
Recent Commits: {최근 커밋 1줄 요약}
Context Files: {읽은 파일 목록}
Next Step: Step {N+1} — {description}
===
```

- Phase/Step 정보는 `session-meta.json` 우선, 없으면 `CONTEXT.md`에서 추출
- Test Status는 마지막 테스트 결과가 기록되어 있을 때만 표시
- Pending Issues가 없으면 해당 줄 생략

#### Step 4: 작업 재개
1. 사용자의 추가 요청 (피드백, 수정사항)을 받아 해당 워크트리에서 작업 실행
2. 수정사항은 `executor` 에이전트에게 위임
3. 작업 후 `session-meta.json` 업데이트 (current_step, last_activity, status 등)

### 세션 메타데이터 (session-meta.json)

각 워크트리의 `.claude/memory/session-meta.json`에 세션 메타데이터를 JSON으로 관리합니다.

**구조:**
```json
{
  "branch": "feat/some-feature",
  "skill": "simon-bot",
  "current_phase": "B",
  "current_step": 7,
  "total_steps": 19,
  "status": "in_progress",
  "created_at": "2026-03-05T10:00:00+09:00",
  "last_activity": "2026-03-05T14:30:00+09:00",
  "last_completed_step": {
    "number": 6,
    "name": "Purpose Alignment Check",
    "result": "PASS"
  },
  "failure_count": 0,
  "pending_issues": {
    "critical": 0,
    "high": 2
  },
  "test_status": {
    "passing": 47,
    "total": 50,
    "skipped": 3
  }
}
```

**메타데이터 갱신 시점:**
- `resume` 시 `last_activity` 업데이트
- Step 완료 시 `current_step`, `last_completed_step` 업데이트
- 테스트 실행 후 `test_status` 업데이트
- 에러 발생 시 `failure_count` 증가
- 작업 완료/중단 시 `status` 변경 (`in_progress` | `paused` | `completed` | `failed`)

**메타데이터가 없는 기존 세션:**
- resume 시 `.claude/memory/` 파일들과 git 이력에서 정보를 추출하여 `session-meta.json`을 자동 생성
- 자동 생성 시 `CONTEXT.md`에서 Phase/Step 파싱, `git log`에서 `last_activity` 추정

### 스킬 자동 판별 (resume 시)

resume 시 `session-meta.json`의 `skill` 필드를 확인하여 해당 스킬의 컨텍스트로 복원한다:
- `simon-bot` → simon-bot의 Step 재개 프로토콜 적용
- `simon-bot-grind` → grind의 failure-log, checkpoint, retry budget을 함께 복원
- 필드가 없으면 `.claude/memory/failure-log.md` 존재 여부로 판별 (있으면 grind, 없으면 simon-bot)

### pr - PR 생성

1. `info {branch-name}`으로 세션 상태 확인
2. 해당 워크트리에 커밋되지 않은 변경이 있으면 커밋
3. 브랜치를 원격에 push
4. `/git-push-pr` 스킬 호출하여 Draft PR 생성
