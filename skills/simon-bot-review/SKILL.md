---
name: simon-bot-review
description: "PR 기반 코드 리뷰 — Draft PR 생성, 인라인 코드 리뷰 코멘트, CI Watch, 피드백 루프를 수행합니다. Use when: (1) simon-bot/grind 작업 완료 후 자동 호출, (2) 사용자가 직접 'PR 만들어줘', '리뷰해줘', '코드 리뷰', 'Draft PR' 요청, (3) 브랜치 작업 완료 후 PR + 인라인 리뷰가 필요할 때. simon-bot이 생성한 review-sequence.md가 있으면 활용하고, 없으면 독자적으로 diff를 분석하여 동일 품질의 리뷰를 생성합니다."
compatibility:
  tools: [Agent, AskUserQuestion]
  skills: [git-commit]
---

# simon-bot-review

PR 기반 코드 리뷰 스킬. Draft PR을 생성하고, 논리적 변경 단위별 인라인 코드 리뷰를 작성하며, CI 모니터링과 사용자 피드백 루프를 반복한다.

## Mode Detection

스킬 시작 시 모드를 자동 감지한다:

1. `.claude/memory/review-sequence.md` 존재 확인
2. **존재 → CONNECTED 모드** (simon-bot/grind에서 넘어온 것)
   - `.claude/memory/branch-name.md` 읽기
   - `.claude/reports/{feature-name}-report.md` 확인 → PR description에 활용
   - `.claude/memory/plan-summary.md` 확인 → 계획 매핑용
   - `.claude/memory/pr-info.md` 확인 → 이미 PR이 있으면 재사용
3. **미존재 → STANDALONE 모드**
   - `git diff {base-branch}...HEAD`로 변경사항 분석
   - Agent team으로 review-sequence.md 자체 생성
   - Report도 자체 생성
4. 이후 워크플로는 양 모드 동일

### Session Isolation Protocol

simon-bot의 Session Isolation Protocol을 상속한다. 모든 `.claude/memory/` 경로를 `{SESSION_DIR}/memory/`로, `.claude/reports/` 경로를 `{SESSION_DIR}/reports/`로 해석한다.

**SESSION_DIR 결정**: CONNECTED 모드에서는 simon-bot이 전달한 `{SESSION_DIR}`을 사용한다. STANDALONE 모드에서는 현재 브랜치명으로 직접 결정한다:
```bash
PROJECT_SLUG=$(git rev-parse --show-toplevel | tr '/' '-')
BRANCH=$(git branch --show-current)
SESSION_DIR="${HOME}/.claude/projects/${PROJECT_SLUG}/sessions/${BRANCH}"
```

## Workflow

```
[Mode Detection]
     ↓
[STANDALONE only] → Step 0: Diff 분석 + review-sequence 생성
     ↓
Step 1: Draft PR 생성
     ↓
Step 2: 인라인 코드 리뷰 작성
     ↓
Step 3: CI Watch (background) + 사용자에게 리뷰 안내
     ↓
Step 4: 피드백 루프 ──────────────────────┐
  4-A: 사용자 피드백 수집 (PR 코멘트)      │
  4-B: 코드 수정 + 커밋 + 푸시             │
  4-C: 수정된 부분에 인라인 리뷰 재작성     │
  4-D: CI Watch 재시작 (background)        │
  4-E: 사용자에게 수정 완료 안내            │
       ↓                                   │
  사용자 승인? ─── No ─────────────────────┘
       │
      Yes
       ↓
Step 5: 마무리
```

## Step 0: Standalone 분석 (STANDALONE 모드만)

STANDALONE 모드에서는 simon-bot의 Step 18-A/B에 해당하는 분석을 자체적으로 수행한다. simon-bot이 전문가 패널을 거쳐 생성하는 review-sequence와 동등한 품질을 위해 agent team을 구성한다.

For detailed instructions, read [standalone-analysis.md](references/standalone-analysis.md).

## Step 1: Draft PR 생성

1. 브랜치명 확인: `.claude/memory/branch-name.md` 또는 현재 브랜치 (`git branch --show-current`)
2. 브랜치 push:
   ```bash
   git push -u origin {branch-name}
   ```
3. Report 파일 확인:
   - `.claude/reports/{feature-name}-report.md` 존재 → `--body-file`로 사용
   - 미존재 → review-sequence.md 기반으로 간략 요약 생성하여 사용
4. Draft PR 생성:
   ```bash
   gh pr create --draft \
     --title "{type}: {feature summary}" \
     --body-file {report-path}
   ```
5. PR URL과 번호 저장: `.claude/memory/pr-info.md`
6. PR description에 **Review Guide** 섹션 추가:
   - 논리적 변경 단위 수 + 각 단위 한줄 요약
   - 리뷰 순서 안내 (왜 이 순서인지)
   - 추가 맥락 (있으면)

## Step 2: 인라인 코드 리뷰 작성

For inline comment format, read [inline-review-format.md](references/inline-review-format.md).

### 리뷰 준비 — CONNECTED 모드 Blind-First 2-Pass

CONNECTED 모드에서는 구현자(simon-bot)가 생성한 review-sequence.md의 프레이밍에 anchoring되지 않도록 **Blind-First 2-Pass**를 적용한다. 리뷰가 "구현 보고서의 재포맷팅"이 아닌 "독립적 문제 발견"이 되도록 한다.

**Pass 1 (Blind)**: review-sequence.md를 읽기 **전에** diff만으로 분석
1. PR diff 확인: `gh pr diff {pr_number}`
2. diff만으로 의문점, 잠재 이슈, 설계 질문을 정리 → `.claude/memory/blind-review-notes.md`에 임시 저장
3. 각 변경 단위의 핵심 파일/라인 번호 매핑 — diff의 실제 라인 번호와 정확히 일치시킨다

**Pass 2 (Informed)**: review-sequence.md를 읽고 대조
1. `review-sequence.md` 읽기
2. Pass 1의 의문점 중 review-sequence.md로 해소된 것과 해소되지 않은 것을 구분
3. **해소되지 않은 의문점은 반드시 리뷰 코멘트에 포함** — 구현자가 미처 설명하지 못한 부분일 수 있음
4. Pass 1에서 발견한 이슈와 review-sequence.md의 "전문가 검증 완료 이슈"가 일치하면 `[INDEPENDENT-CONFIRM]` 태깅

> **STANDALONE 모드**: review-sequence.md를 자체 생성하므로 Blind-First 불필요. diff 분석이 곧 독립 리뷰.

### 인라인 코멘트 작성

각 변경 단위의 **대표 파일 1-2개**에 집중하여 풍부한 맥락의 인라인 코멘트를 작성하고, 나머지 파일은 간단한 역할 설명만 추가한다. 코멘트 양식은 `references/inline-review-format.md`를 따른다.

### 리뷰 제출

`.claude/memory/review-payload.json` 구성 후 제출:
```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews \
  --method POST \
  --input .claude/memory/review-payload.json
```

**review-payload.json 구조:**
```json
{
  "body": "",
  "event": "COMMENT",
  "comments": [
    {
      "path": "src/example.py",
      "line": 42,
      "body": "**[변경 단위 1: 제목]**\n\n..."
    }
  ]
}
```

### Review Summary Body (P-004)

`review-payload.json`의 `body`에 종합 개요를 삽입한다 (빈 문자열로 두지 않는다):

```markdown
## Review Summary

### 변경 개요
- **변경 단위**: {N}개 ({단위 이름 나열})
- **파일**: {수정 N}개, {추가 N}개

### 리뷰 순서 (권장)
1. `{file}` — {이유}
...

### 핵심 리뷰 포인트
- ⚠️ **{severity}**: {issue 요약} (`{file:line}`)
...

### 발견 이슈 통계
| Severity | 건수 |
|----------|------|
| CRITICAL | {N} |
| HIGH | {N} |
| MEDIUM | {N} |

### 알려진 트레이드오프
- {의도적 결정 사항}
```

review-sequence.md의 findings 매핑 테이블(P-009)이 있으면 이를 활용하여 핵심 리뷰 포인트와 통계를 자동 생성한다. `[VERIFIED]` 태그가 붙은 finding은 "전문가 리뷰에서 확인됨"으로 표기한다.

### 대규모 PR 처리 (100+ 파일)

변경 파일이 100개를 초과하는 PR은 전체 파일에 균등하게 리뷰하는 것보다 핵심 파일에 집중하는 것이 효과적이다.

**전략:**
1. 변경 파일을 영향도 기준으로 3단계로 분류:
   - **Core**: 비즈니스 로직, API 핸들러, 데이터 모델 (상세 리뷰)
   - **Support**: 설정, 유틸리티, 타입 정의 (간략 리뷰)
   - **Generated**: 마이그레이션, 스냅샷, lock 파일 (존재 확인만)
2. Core 파일에 리뷰 시간의 80%를 집중
3. Review Summary에 "리뷰 범위" 섹션을 추가하여 어떤 파일을 상세/간략/스킵했는지 투명하게 밝힌다

### Fallback

인라인 리뷰 API 호출이 실패하면 (line 매핑 오류 등), 변경 단위별 PR 일반 코멘트로 대체한다:
```bash
gh pr comment {pr_number} --body "{변경 단위 리뷰 내용}"
```
이 경우 사용자에게 fallback이 적용되었음을 알린다.

## Step 3: CI Watch + 리뷰 안내

### CI Watch (Background Agent)

Step 2 완료 직후, background agent를 시작한다:
```
Agent(run_in_background=true)
```

Agent에 전달할 컨텍스트:
- PR 번호 (`.claude/memory/pr-info.md`)
- 브랜치명 (`.claude/memory/branch-name.md`)
- 프로젝트 빌드/테스트 명령 (`.claude/workflow/config.yaml`, 있으면)
- 현재 worktree 경로

**CI 모니터링 루프 (max 3 cycles):**

1. CI 상태 확인:
   ```bash
   gh pr checks {pr_number} --watch --fail-fast
   ```
   `--watch`가 지원되지 않으면 30초 간격 polling:
   ```bash
   gh pr checks {pr_number}
   ```
2. 모든 체크 통과 → CI Watch 종료, 결과 기록
3. CI 실패 시:
   a. 실패한 run의 로그 확인: `gh run view {run_id} --log-failed`
   b. 실패 유형 분류: BUILD / TEST / LINT / ENV
   c. **ENV 유형은 수정하지 않는다** — 코드 변경으로 해결 불가, 결과에 기록만
   d. 진단 → 수정 → 커밋 (`fix(ci): {수정 내용}`) → 푸시
   e. PR에 코멘트로 수정 내용 요약
   f. CI 재실행 대기 → 1번으로 복귀

**결과 저장:** `.claude/memory/ci-watch-result.md`

### 사용자 리뷰 안내

CI Watch 시작 후, 사용자에게 알림:
> "Draft PR에 코드 리뷰를 작성했습니다: {PR_URL}
> PR에서 리뷰를 확인하시고, 궁금한 점이나 수정 요청을 코멘트로 남겨주세요.
> 댓글을 달면 1분 내로 자동 감지하여 반영합니다.
> (CI도 모니터링하고 있습니다 — 실패하면 자동으로 수정합니다.)"

### Comment Auto-Watch

리뷰 안내 직후, PR 댓글 자동 감지 폴링을 설정한다.

**마지막 확인 시점 초기화:**
Step 2 리뷰 제출 직후의 타임스탬프를 `{SESSION_DIR}/memory/last-comment-check.md`에 저장한다:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ" > {SESSION_DIR}/memory/last-comment-check.md
```

**CronCreate 설정:**
```
CronCreate(
  cron: "*/1 * * * *",
  prompt: "PR #{pr_number} 댓글 자동 감지.
  1. gh api로 PR 댓글(인라인 + 일반) 수집
  2. {SESSION_DIR}/memory/last-comment-check.md의 시점 이후 새 사용자 댓글만 필터링 (AI 작성 댓글 제외)
  3. 새 댓글 없으면 조용히 종료
  4. 새 댓글 있으면 Step 4-A~4-E 실행
  5. 처리 완료 후 last-comment-check.md 갱신"
)
```

**종료 조건:** 사용자가 "LGTM" / "승인" 시 `CronDelete`로 폴링 해제.

## Step 4: 피드백 루프

Comment Auto-Watch가 새 댓글을 감지하면 자동으로 4-A~4-E를 실행한다. 사용자가 직접 "피드백 준비됐어"라고 말해도 동일하게 실행된다.

### 4-A: 피드백 수집

1. **CI Watch 결과 확인**: `.claude/memory/ci-watch-result.md` 읽기
   - CI Watch가 아직 실행 중이면 현재 상태를 사용자에게 보고
   - CI fix로 변경된 부분이 있으면 사용자에게 요약 제시
2. **PR 코멘트 수집** (마지막 확인 시점 이후의 새 댓글만):
   ```bash
   SINCE=$(cat {SESSION_DIR}/memory/last-comment-check.md)
   # 인라인 리뷰 코멘트 (코드에 달린 댓글)
   gh api repos/{owner}/{repo}/pulls/{pr_number}/comments \
     --jq "[.[] | select(.created_at > \"${SINCE}\") | select(.user.type != \"Bot\")]"
   # 일반 PR 코멘트
   gh api repos/{owner}/{repo}/issues/{pr_number}/comments \
     --jq "[.[] | select(.created_at > \"${SINCE}\") | select(.user.type != \"Bot\")]"
   ```
3. **확인 시점 갱신**: 처리 완료 후 `last-comment-check.md`를 현재 시점으로 갱신

### 4-B: 코드 수정

피드백을 분류하여 처리:
- **질문**: PR 코멘트로 답변 (`gh api` reply)
- **수정 요청**: 코드 수정 → 커밋 → 푸시 → PR 코멘트로 "수정 완료" 답변
- **승인/OK**: 해당 코멘트 resolve 처리

### 4-C: 인라인 리뷰 재작성

수정된 변경 단위에 대해서만 새 인라인 코멘트를 작성한다.

- 기존 코멘트의 해당 항목은 resolve 처리
- 수정된 코드 위치에 **수정 반영 양식**으로 새 코멘트 작성 (양식은 `references/inline-review-format.md` 참조)
- 변경 없는 부분은 건드리지 않음

### 4-D: CI Watch 재시작

코드가 변경되었으므로 CI Watch를 재시작한다. Step 3과 동일한 background agent 로직을 적용한다 (max 3 cycles).

### 4-E: 수정 완료 안내

사용자에게 수정 내용 요약 보고:
> "피드백 반영 완료했습니다: {수정 요약}
> PR에서 확인해주세요: {PR_URL}
> (댓글 자동 감지 + CI 모니터링 계속 중입니다.)"

### 종료 조건

사용자가 "LGTM" / "approve" / "승인" / PR ready 전환을 요청하면:
1. Comment Auto-Watch 폴링을 `CronDelete`로 해제
2. Step 5로 진행

## Step 5: 마무리

1. PR 상태 확인 — 사용자 요청에 따라:
   - Ready 전환: `gh pr ready {pr_number}`
   - Draft 유지: 그대로 둠
2. **피드백 영속 기록**: `.claude/memory/feedback.md`
3. **Completion Summary 출력**:
   ```
   === 리뷰 완료 ===
   PR: #{number} ({Draft/Ready})
   리뷰 라운드: {N}회
   수정 커밋: {N}개
   CI 수정: {N}건
   미해결 코멘트: {N}건
   ===
   ```
4. CONNECTED 모드인 경우:
   - `.claude/memory/retrospective.md` 기록
   - `CONTEXT.md` 최종 상태 갱신
