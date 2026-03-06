# Integration & Review (Detailed Instructions)

## Integration Stage (after all Units complete)

1. 모든 변경사항은 Startup에서 생성한 worktree의 브랜치에 커밋
2. 브랜치명: `.claude/memory/branch-name.md` 참조
3. If conflict: `architect` analyzes + `executor` resolves
4. Full build + test pass verification
5. **Working Example 재실행 (P-007)**: Step 6-B에서 정의한 Working Example 시나리오를 통합 환경에서 재실행하여 "테스트 통과 ≠ 실제 동작" 문제를 포착한다. `.claude/memory/unit-{name}/working-example.md`의 시나리오 참조. 실패 시 executor 수정 → 재검증 (max 3회).
6. `/simplify` 스킬 실행: 통합된 전체 변경 코드의 재사용성, 품질, 효율성 검토
7. Save: `.claude/memory/integration-result.md`
8. Update: `CONTEXT.md` — Integration 완료 표시, 성공 기준 중간 갱신

### 커밋 메시지 상세화 (실행 이력 관리)

문서가 아닌 **실행 이력이 SSoT(Single Source of Truth)**다. 새 세션에서도 Git 이력만으로 맥락을 파악할 수 있도록, 커밋 메시지 **body**에 다음 정보를 포함한다.

> **git-commit 스킬과의 관계**: 커밋의 제목(type + description)은 git-commit 스킬의 semantic commit 형식을 따른다. 이 섹션은 **body 부분**의 가이드라인으로, git-commit이 생성하는 제목 뒤에 추가하는 맥락 정보다.

```
{type}: {변경 요약}    ← git-commit 스킬이 생성

[해결 방식] 어떤 접근법으로 문제를 해결했는지
[난관/트레이드오프] 구현 중 마주친 어려움이나 수용한 트레이드오프 (있으면)
[의사결정] 왜 이 방식을 선택했는지, 고려한 대안 (있으면)

Refs: Unit {N} — {Unit 목적 한줄 요약}
```

이 형식은 `git log --oneline`으로도 흐름을 파악할 수 있고, `git log`로 세부 맥락까지 추적할 수 있게 한다. Unit별 커밋이므로 각 커밋이 하나의 논리적 변경 단위를 대표한다.

## Step 18: Work Report + Draft PR

**IMPORTANT: Step 18은 반드시 foreground에서 실행한다.**

> **Background Agent 사용 기준 (전체 워크플로 공통)**:
> - **OK**: 빌드/테스트 검증, 독립적 Unit 병렬 실행
> - **NO**: 다음 Step의 입력 파일을 생성하는 작업, 후속 단계가 즉시 의존하는 산출물

### 18-A: Report

- Spawn `writer` — Use template: `.claude/workflow/templates/report-template.md`
- **Language:** Follow `language` setting in `config.yaml` (default: `ko`)
- Contents:
  - Before/After flow diagrams
  - Key review points (with code snippets)
  - Trade-offs considered
  - Potential risks
  - Test results explained
  - NOT in scope items
  - Unresolved decisions (with "may bite you later" warnings)
- Save: `.claude/reports/{feature-name}-report.md`

### 18-B: Review Sequence 생성

- Spawn `architect`: 전체 변경사항을 **논리적 변경 단위(Logical Change Unit)**로 그룹핑
- 논리적 변경 단위 = 하나의 목적/기능을 달성하기 위해 함께 변경된 파일들의 묶음
- **정렬 기준**: 데이터/호출 흐름 순서 (상류 → 하류)
- **필수 입력**: `.claude/memory/plan-summary.md`를 읽어 각 변경 단위가 계획의 어떤 Unit/목표에 해당하는지 매핑

각 논리적 변경 단위에 포함할 정보:
- **제목**: 이 변경이 무엇을 하는지 한 줄 요약
- **계획 매핑**: `plan-summary.md`의 어떤 Unit/목표를 구현한 것인지
- **변경 이유**: 왜 이 변경이 필요한지
- **변경 전 상태 (Before Context)**: 변경 전 코드/모듈의 상태와 역할
- **변경 내용 (What Changed)**: 구체적으로 어떤 부분을 어떻게 개선/추가했는지
- **관련 파일 목록**: 변경된 파일과 각 파일의 역할
- **핵심 코드 변경**: Before/After diff (중요 부분만 발췌)
- **리뷰 포인트**: 특별히 주의 깊게 봐야 할 부분
- **다른 변경 단위와의 연관**: 의존/호출/데이터 흐름 관계
- **전문가 우려사항 반영**: Step 4-B/7에서 관련 우려 반영 내용
- **트레이드오프**: 설계 결정과 그 이유

- Save: `.claude/memory/review-sequence.md`

### 18-C: Draft PR 생성

1. Push branch: `git push -u origin {branch-name}`
2. Draft PR 생성:
   ```bash
   gh pr create --draft \
     --title "{type}: {feature summary}" \
     --body-file .claude/reports/{feature-name}-report.md
   ```
3. PR URL과 번호 저장: `.claude/memory/pr-info.md`
4. PR description에 Review Guide 섹션 추가 (review-sequence.md 기반 개요)

## Step 19: PR-Based Code Review

### 19-A: 리뷰 개요 제시 (세션 내)

`.claude/memory/plan-summary.md`와 `review-sequence.md`를 함께 읽어 세션에서 직접 마크다운으로 출력:

- **계획 요약 리마인드**: 원래 계획의 목표 (1-2문장)
- **구현 매핑 테이블**:
  ```
  | 계획 Unit | 구현된 변경 단위 | 핵심 변경 |
  |-----------|-----------------|----------|
  ```
- **변경 단위 간 관계도**: 데이터/호출 흐름 설명
- **리뷰 순서 안내**: 왜 이 순서로 봐야 하는지
- **전체 요약 통계**: 변경된 파일 수, 추가/삭제 라인 수, 테스트 커버리지

### 19-B: PR에 인라인 코드 리뷰 작성

review-sequence.md의 각 논리적 변경 단위를 PR 인라인 리뷰 코멘트로 변환한다.

**리뷰 준비:**
1. PR diff 확인: `gh pr diff {pr_number}`
2. review-sequence.md 읽기
3. 각 변경 단위의 핵심 파일/라인 번호 매핑

**각 변경 단위의 핵심 파일에 인라인 코멘트** — 기존 인터랙티브 리뷰와 동일한 수준의 맥락:
  - **계획 매핑**: "이 변경은 계획의 [Unit N: 제목]을 구현합니다"
  - **변경 전 상태 (Before)**: 기존 코드의 역할/동작/한계, 또는 "신규 생성"
  - **변경 내용 (What Changed)**: 구체적으로 어떤 부분을 어떻게 개선/추가했는지
  - **다른 변경 단위와의 연관**: 이전/이후 변경 단위와의 의존/호출/데이터 흐름 관계
  - **리뷰 포인트**: 특별히 주의 깊게 봐야 할 부분
  - **전문가 우려사항 반영**: Step 4-B/7의 우려가 어떻게 반영되었는지
  - **전문가 토론 맥락**: `.claude/memory/expert-discussions/`에서 관련 토론 발췌 (있으면)
  - **트레이드오프**: 설계 결정과 그 이유, 고려한 대안

변경 단위당 대표 파일 1-2개에 집중하여 풍부한 맥락을 담고, 나머지 파일은 간단한 역할 설명만 추가한다.

**리뷰 제출:**
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
      "path": "src/example.go",
      "line": 42,
      "body": "**[변경 단위 1: 제목]**\n\n계획 매핑: ...\n변경 전 상태: ...\n..."
    }
  ]
}
```

### 19-CI: CI Watch (Background)

Draft PR 생성 및 인라인 리뷰 작성 후, 사용자가 리뷰하는 동안 CI를 모니터링하고 실패 시 자동 수정한다.
사용자가 리뷰에 집중하는 시간을 낭비하지 않기 위해, CI 안정화를 병렬로 처리하는 것이 목적이다.

**Background Agent 시작:**

19-B 완료 직후, background agent(`Agent(run_in_background=true)`)를 시작한다.
Agent에 전달할 컨텍스트:
- PR 번호 (`.claude/memory/pr-info.md`)
- 브랜치명 (`.claude/memory/branch-name.md`)
- 프로젝트 빌드/테스트 명령 (`.claude/workflow/config.yaml`)
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
   a. 실패한 run의 로그 확인:
      ```bash
      gh run view {run_id} --log-failed
      ```
   b. 실패 유형 분류:
      - **BUILD**: 컴파일/빌드 에러
      - **TEST**: 테스트 실패
      - **LINT**: 린트/포맷/타입체크 에러
      - **ENV**: CI 환경 문제 (의존성 설치 실패 등)
   c. **ENV 유형은 수정하지 않는다** — 코드 변경으로 해결 불가, 결과에 기록만
   d. 진단 → 수정 → 커밋 (메시지: `fix(ci): {수정 내용}`) → 푸시
   e. PR에 코멘트로 수정 내용 요약:
      ```bash
      gh pr comment {pr_number} --body "**CI Fix**: {실패 유형} - {수정 요약}\n\nCommit: {hash}"
      ```
   f. CI 재실행 대기 → 1번으로 복귀

**결과 저장:** `.claude/memory/ci-watch-result.md`

```markdown
# CI Watch Result
- Status: PASS / FAIL / IN_PROGRESS
- Total cycles: N
- Fixes applied:
  1. {type}: {description} (commit: {hash})
- Remaining failures: (있으면 유형과 로그 요약)
```

### 19-C: PR 피드백 루프

1. 사용자에게 알림:
   > "Draft PR에 코드 리뷰를 작성했습니다: {PR_URL}
   > PR에서 리뷰를 확인하시고, 궁금한 점이나 수정 요청을 코멘트로 남겨주세요.
   > 피드백이 준비되면 말씀해주세요.
   > (CI를 모니터링하고 있습니다 — 실패하면 자동으로 수정합니다.)"

2. 사용자가 돌아오면:
   - **CI Watch 결과 확인**: `.claude/memory/ci-watch-result.md` 읽기
   - CI Watch가 아직 실행 중이면 현재 상태를 사용자에게 보고
   - CI fix로 변경된 부분이 있으면 사용자에게 요약 제시
   - PR 코멘트 읽기:
   ```bash
   # 인라인 리뷰 코멘트 (코드에 달린 댓글)
   gh api repos/{owner}/{repo}/pulls/{pr_number}/comments
   # 일반 PR 코멘트
   gh api repos/{owner}/{repo}/issues/{pr_number}/comments
   ```

3. 피드백 분류 및 처리:
   - **질문**: PR 코멘트로 답변 (`gh api` reply)
   - **수정 요청**: 코드 수정 → 커밋 → 푸시 → PR 코멘트로 "수정 완료" 답변
   - **승인/OK**: 해당 코멘트 resolve 처리

4. 수정 사항이 있으면:
   - 변경 커밋 + push
   - 수정 내용을 PR 코멘트로 요약
   - 사용자에게 알림: "피드백 반영 완료했습니다. PR에서 확인해주세요."

5. **반복**: 사용자가 "LGTM" / "approve" / PR ready 전환할 때까지

### 19-D: 최종 마무리

사용자가 리뷰를 승인하면:

1. PR 상태 확인 — 사용자 요청에 따라:
   - Ready 전환: `gh pr ready {pr_number}`
   - Draft 유지: 그대로 둠
2. **피드백 영속 기록**: `.claude/memory/feedback.md`
3. **Retrospective 기록**: `.claude/memory/retrospective.md` (아래 형식 참조)
4. **Success Criteria 최종 검증**: `.claude/memory/success-criteria.md`
5. Update: `CONTEXT.md` — 최종 상태 갱신

## Step 20: Self-Improvement (회고 기반 스킬 개선)

워크플로 전체에서 축적된 사용자 피드백을 분석하여, 스킬 자체의 개선이 필요한지 판단하고 적용한다.

이 단계의 목적: simon-bot/simon-bot-grind가 매 사용마다 조금씩 더 나아지는 자기 개선 루프를 만드는 것. 사용자가 반복적으로 같은 불편을 겪거나, 워크플로의 특정 부분이 계속 마찰을 일으킨다면, 그건 스킬 자체를 고쳐야 한다는 신호다.

### 20-A: 피드백 종합

1. `.claude/memory/user-feedback-log.md` 전체 읽기
2. 패턴 식별:
   - **반복 교정**: 사용자가 2회 이상 같은 유형의 수정을 요청한 패턴
   - **워크플로 마찰**: 특정 단계에서 반복적으로 불만/지연이 발생한 패턴
   - **선호도 패턴**: 사용자가 일관되게 선호하는 방식 (코드 스타일, 커뮤니케이션 방식 등)
   - **과잉 엔지니어링**: 불필요하다고 지적된 단계나 검증
3. 각 패턴을 분류:
   - `CONFIG`: config.yaml에 옵션 추가로 해결 가능
   - `WORKFLOW`: 워크플로 단계/순서 변경 필요
   - `CAPABILITY`: 새 기능/도구 필요
   - `REMOVAL`: 불필요한 단계 제거

### 20-B: 개선 제안

1. 일회성 선호가 아닌 **체계적 패턴**만 제안 대상으로 선별
2. 각 제안에 포함:
   - 무엇을 변경할지
   - 왜 변경이 필요한지 (어떤 피드백에서 도출)
   - 예상 영향 범위
3. 사용자에게 요약 제시 (AskUserQuestion):
   > "이번 워크플로에서 N개의 개선 패턴을 발견했습니다:
   > 1. [패턴 설명] — [제안]
   > 2. [패턴 설명] — [제안]
   > 스킬 개선을 진행할까요?"

### 20-C: 스킬 업데이트

사용자가 동의하면:
1. **skill-creator** 스킬을 호출하여 개선 실행
2. 변경 내용을 `retrospective.md`에 기록
3. 변경하지 않기로 한 항목도 이유와 함께 기록

사용자가 거절하거나 개선 패턴이 없으면:
- retrospective.md만 기록하고 종료

## Retrospective 기록 형식

`.claude/memory/retrospective.md` 구조:

```markdown
# Retrospective: {feature-name}

## Summary
- Branch: {branch}
- Scope: SMALL / STANDARD / LARGE
- PR: {url}

## What Went Well
- (워크플로에서 잘 작동한 부분)

## What Could Be Better
- (마찰이 있었던 부분, 개선 여지)

## User Feedback Patterns
- (user-feedback-log.md에서 추출한 주요 패턴)

## Skill Improvements Applied
- [ ] Change 1: rationale
- [ ] Change 2: rationale

## Lessons for Future Sessions
- (다음 세션의 Phase A에서 참고할 교훈)
```

이 파일은 다음 세션의 Startup에서 읽혀 Phase A 계획에 반영된다.
