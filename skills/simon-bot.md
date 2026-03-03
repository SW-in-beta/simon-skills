---
name: simon-bot
description: "19-step deep workflow plugin that plans, implements, and verifies code with maximum rigor. Use when: (1) Building new features with quality pipeline, (2) Need scope-first planning with expert review panel, (3) Want parallel execution in isolated git worktrees, (4) Need comprehensive code verification before PR."
---

# simon-bot

Deep workflow skill with 19-step quality pipeline.

## Instructions

You are executing the **simon-bot** deep workflow. This is a 19-step quality pipeline that plans, implements, and verifies code with maximum rigor.

### Startup

**IMPORTANT: Execute these steps SEQUENTIALLY, not in parallel.**

1. Determine if `.omc/workflow/` exists in the current project. If not, run the init script:
   ```
   bash ~/.claude/skills/simon-bot/install.sh --project-only
   ```
2. After Step 1 confirms workflow files exist, read these (can be parallel):
   - Workflow config: `.omc/workflow/config.yaml`
   - Retrospective (if exists, skip if not): `.omc/memory/retrospective.md`
   - Project memory (if exists, skip if not): use `project_memory_read` MCP tool
3. **브랜치명 입력받기** (AskUserQuestion):
   - 사용자에게 작업용 브랜치명을 입력받음 (예: `feat/add-auth`, `fix/login-bug`)
   - 입력받은 브랜치명을 `.omc/memory/branch-name.md`에 저장
   - 이 브랜치명은 이후 worktree 생성, Integration, PR 생성에 모두 사용됨

### Phase A: Planning (Interactive with User)

**Step 0: Scope Challenge**
- Spawn `architect` (opus): Analyze git history for past problem areas
- Identify "What already exists" - existing code that solves parts of the request
- Determine minimum viable change
- Flag if scope exceeds 8 files or 2 new classes
- Present 3 review paths to user via AskUserQuestion:
  - **SMALL**: Steps 5-8 + 17 only
  - **STANDARD**: Steps 5-17 full pipeline
  - **LARGE**: Steps 5-17 + extended failure mode analysis
- Record decision in `.omc/memory/plan-summary.md`

**Step 1-A: Project Analysis**
- Spawn `explore-medium` (sonnet): Scan project structure
- Spawn `analyst` (opus): Generate analysis report + recommend principles
- Use Context7 MCP (`resolve-library-id` → `query-docs`) for library docs
- Auto-generate allowed command list based on detected stack
- Skill: Use `/deepsearch` if codebase is large

**Step 1-B: Plan Creation**
- Spawn `planner` (opus) in interview mode
- Input: User request + Step 0 scope + Step 1-A analysis
- Split work into Units: max 3-5 files, 200 lines per Unit, single concern
- Build dependency graph: parallel vs sequential groups
- Use Context7 for SDK documentation needed for implementation
- Required sections in plan:
  - Goal and completion criteria
  - Unit breakdown with file lists
  - Implementation order
  - Development principles (TDD/DDD/Clean Architecture as confirmed)
  - "NOT in scope" section
  - "Unresolved decisions" section
  - Expected risks
- Save to `.omc/memory/plan-summary.md`
- Skill: Use `/plan`

**Step 2: Plan Review**
- Spawn `critic` (opus): Review plan for logic, gaps, feasibility
- If issues found: Send back to `planner` for auto-fix
- Loop: critic ↔ planner, max 3 iterations
- Skill: Use `/ralplan` for Steps 2-4 combined

**Step 3: Meta Verification**
- Spawn `architect` (opus): Cross-verify critic's review
- Severity-based routing:
  - Minor (detail-level): → Step 2
  - Major (structural): → Step 1-B (with failure reason)

**Step 4: Over-engineering Check**
- Spawn `architect` (opus): YAGNI/KISS perspective
- Compare plan scope vs original request
- Severity-based routing:
  - Minor (some items excessive): → Step 2
  - Major (entire design excessive): → Step 1-B (with failure reason)

**Step 4-B: Expert Plan Review (사전 우려 검토)**
- 목적: 구현 전에 도메인 전문가들이 계획을 검토하여 우려사항/위험요소를 사전에 식별
- Step 1-A에서 auto-detect된 전문가들 + always 전문가들이 참여
- Read expert prompts from `.omc/workflow/prompts/*.md`
- 전문가 스폰 (모두 opus, parallel):
  - Always:
    - `security-reviewer`: 보안 관점에서 계획의 취약점/위험 검토
    - `architect` (bugs): 안정성/에러 처리 관점에서 계획 검토
  - Auto-detected (Step 1-A 결과 기반):
    - DB expert ← DB 사용이 감지된 경우: 스키마 변경, 마이그레이션, 쿼리 성능 우려
    - API expert ← REST/gRPC/WebSocket 감지된 경우: API 설계, 호환성, 버전관리 우려
    - Concurrency expert ← 멀티스레드/비동기 감지된 경우: 동시성, 데드락, 레이스컨디션 우려
    - Infra expert ← Docker/K8s/CI 감지된 경우: 배포, 인프라 영향 우려
    - Caching expert ← 캐싱 레이어 감지된 경우: 캐시 무효화, 일관성 우려
    - Messaging expert ← Kafka/RabbitMQ 감지된 경우: 메시지 순서, 멱등성 우려
    - Auth expert ← 인증 로직이 핵심인 경우: 인증/인가 플로우 우려
- 각 전문가에게 전달할 컨텍스트:
  - `.omc/memory/plan-summary.md` (전체 계획)
  - `.omc/memory/requirements.md` (요구사항)
  - 해당 도메인의 expert prompt (`.omc/workflow/prompts/{expert}.md`)
- 각 전문가 출력 형식:
  - **우려사항**: CRITICAL / HIGH / MEDIUM 심각도로 분류
  - **권장사항**: 구현 시 고려해야 할 구체적 주의점
  - **질문**: 계획에서 불명확한 부분
- CRITICAL 우려가 있으면: `planner`에게 전달하여 계획 수정 → Step 2로 회귀 (max 2회)
- HIGH 우려: 계획에 주의사항으로 추가, 구현 시 반드시 반영
- MEDIUM 우려: 기록만 하고 구현 시 참고
- Save: `.omc/memory/expert-plan-concerns.md`
- 사용자에게 주요 우려사항 요약 보고 (AskUserQuestion으로 진행 여부 확인)

### Phase B-E: Implementation & Verification (ralph + ultrawork AUTO)

After Phase A is confirmed, activate ralph + ultrawork mode automatically.
Each Unit runs in an **isolated git worktree**.
Independent Units run in **parallel**.

**Pre-Phase: Base Branch Sync & Worktree 생성**
- 목적: 최신 main/master 기준으로 작업용 worktree 생성
- 절차:
  1. default branch 감지 (`auto`이면 main/master 자동 감지)
  2. `git fetch {remote} {base_branch}` 실행 (원격 최신 동기화)
  3. `.omc/memory/branch-name.md`에서 사용자가 입력한 브랜치명 읽기
  4. worktree 생성: `git worktree add .claude/worktrees/{branch-name} -b {branch-name} origin/{base_branch}`
  5. 해당 worktree로 작업 디렉토리 이동
  6. base commit SHA를 `.omc/memory/base-commit.md`에 기록
- **중요:** 현재 로컬 브랜치를 checkout/변경하지 않음 (안전)
- Save: `.omc/memory/base-commit.md`

**CRITICAL RULES:**
- All verification/review: ONLY changed files (git diff based)
- Use `.omc/workflow/scripts/*.sh` for deterministic tasks (save context)
- Record findings in `.omc/memory/unit-{name}/*.md` after each step
- Read memory files at start of each step
- Tests: NEVER use real DB or external APIs (mock/stub only)
- Commands: NEVER access real external systems (no curl to prod, no real DB connections)

**Pre-Step: Test Environment Setup**
- Run `.omc/workflow/scripts/setup-test-env.sh` to check and set up test environment
- If environment is already ready: proceed with tests immediately
- If environment is NOT ready: attempt automatic setup:
  - Node.js: `npm install`
  - Python: `pip install -r requirements.txt` or `pip install -e ".[test]"`
  - Go: `go mod download`
  - Java/Maven: `mvn dependency:resolve`
  - Rust/Gradle: toolchain check only (deps resolved at build time)
- If setup succeeds: proceed with tests normally
- If setup fails (toolchain missing, install error): skip tests (build and typecheck still run)
- This setup is embedded in `run-tests.sh` — every test invocation auto-triggers
- Configurable via `test_env` section in `config.yaml`
- Save result: `.omc/memory/test-env-status.md`

**For each Unit (in isolated worktree):**

**Step 5: Implementation**
- **먼저 읽기**: `.omc/memory/expert-plan-concerns.md` (Step 4-B 전문가 우려사항)
- Spawn `executor` (opus), parallel for independent files
- 전문가 우려사항 중 HIGH 이상 항목을 구현 시 반드시 고려
- If TDD selected: Write tests first, then implement
- Run via tmux: build + test + typecheck simultaneously
- Skill: `/tdd` if TDD was selected
- Save: `.omc/memory/unit-{name}/implementation.md`

**Step 6: Purpose Alignment Review**
- Spawn `architect` (opus): Check implementation matches requirements
- Minor: executor auto-fix (max 3 times)
- Major: → Step 1-B (plan itself was insufficient)

**Step 7: Bug/Security/Performance Review**
- Read expert prompts from `.omc/workflow/prompts/*.md`
- **7-A: 구현 결과 검증** (기존과 동일)
  - Always (parallel):
    - `security-reviewer` (opus): Security
    - `architect` (opus): Bugs/stability
  - Auto-detect from Step 1-A (all opus):
    - DB expert ← if DB usage detected
    - API expert ← if REST/gRPC/WebSocket detected
    - Concurrency expert ← if multi-thread/async detected
    - Infra expert ← if Docker/K8s/CI detected
    - Caching expert ← if caching layer detected
    - Messaging expert ← if Kafka/RabbitMQ detected
    - Auth expert ← if auth logic is core
  - tmux: build + test + typecheck simultaneously
  - CRITICAL/HIGH → executor auto-fix, MEDIUM → record
- **7-B: 사전 우려사항 대조 검증**
  - 읽기: `.omc/memory/expert-plan-concerns.md` (Step 4-B 결과)
  - Spawn `architect` (opus): 사전 우려사항 중 구현에서 누락된 항목이 있는지 대조
  - 누락된 우려사항 발견 시: executor auto-fix → 7-A 전문가 재검증 (max 1회)
  - 모두 반영 확인 시: 통과
- Skill: `/security-review` + `/code-review`
- Save: `.omc/memory/unit-{name}/review-findings.md`

**Step 8: Regression Verification**
- Spawn `architect` (opus): Verify Step 7 fixes didn't break anything
- Regression found: executor fix → Step 7 re-review (max 2 loops)

--- SMALL path skips to Step 17 here ---

**Step 9: File/Function Splitting**
- Spawn `architect` (opus): Detect oversized functions/files
- Thresholds from config.yaml (default: 50 lines function, 300 lines file)
- Split based on confirmed principles (DDD→domain, Clean→layer, default→SRP)
- Spawn `executor` (opus): Execute splits

**Step 10: Integration/Reuse Review**
- Spawn `architect` (opus): Find duplicate code, reuse opportunities
- Spawn `executor` (opus): Refactor as needed

**Step 11: Side Effect Check**
- Spawn `architect` (opus): Verify refactoring didn't change behavior
- Minor: executor fix. Major: → Step 9

**Step 12: Full Change Review**
- Spawn `code-reviewer` (opus): Review entire diff
- Minor: executor fix. Major: → Step 9
- Skill: `/code-review`

**Step 13: Dead Code Cleanup**
- Run `.omc/workflow/scripts/find-dead-code.sh`
- Spawn `architect` (opus) → `executor` (opus): Clean up

**Step 14: Code Quality Assessment**
- Spawn `code-reviewer` (opus): Final quality evaluation

**Step 15: UX Flow Verification**
- Spawn `architect` (opus): Verify user flows work correctly

**Step 16: MEDIUM Issue Resolution**
- Spawn `architect` (opus): Process all accumulated MEDIUM issues
- Analyze ripple effects, fix if needed
- Max 3 iterations until stable
- Save: `.omc/memory/unit-{name}/quality-findings.md`

**Step 17: Production Readiness**
- Spawn `architect` + `security-reviewer` (opus, parallel)
- Final checklist: requirements met, build passes, tests pass, no security issues
- Minor: executor fix. Major: → relevant Phase. Critical: → Step 1-B
- Save: `.omc/memory/unit-{name}/final-check.md`

### Integration Stage (after all Units complete)

1. 모든 변경사항은 Startup에서 생성한 worktree의 브랜치에 커밋
2. 브랜치명: `.omc/memory/branch-name.md` 참조
3. If conflict: `architect` (opus) analyzes + `executor` (opus) resolves
4. Full build + test pass verification
5. Create **Draft PR** (base: `{base_branch}`, head: 사용자가 입력한 브랜치)
6. Save: `.omc/memory/integration-result.md`

### Step 18: Work Report

- Spawn `writer` (opus)
- Use template: `.omc/workflow/templates/report-template.md`
- **Language:** Follow `language` setting in `.omc/workflow/config.yaml` (default: `ko` for Korean)
- Contents:
  - Before/After flow diagrams
  - Key review points (with code snippets)
  - Trade-offs considered
  - Potential risks
  - Test results explained
  - NOT in scope items
  - Unresolved decisions (with "may bite you later" warnings)
- Save: `.omc/reports/{feature-name}-report.md`

### Step 19: Retrospective

- Present report + Draft PR to user
- Collect user feedback
- Code fixes needed → `executor` (opus)
- Workflow fixes needed → update config.yaml / prompts
- **피드백 영속 기록**: `.omc/memory/feedback.md`에 저장 (세션 종료 후에도 유지)
  - 피드백 내용, 수정 요청사항, 완료 여부
  - 새 세션에서 `manage-sessions.sh info {branch}`로 확인 가능
- Record in `.omc/memory/retrospective.md` (auto-referenced next run)

### Global Forbidden Rules

NEVER execute any of these under ANY circumstances:
- `git push --force` / `git push -f`
- `git merge` to main/master branch
- `rm -rf`
- `DROP TABLE` / `TRUNCATE`
- Commit `.env` or secret files
- `chmod 777`
- `eval` with untrusted input
- `curl | sh` or `wget | sh`
- `curl`/`wget` to real external endpoints
- `mysql`/`psql`/`redis-cli`/`mongosh` to real databases
- `ssh`/`scp`/`sftp` to real servers
- Any test that calls real DB or external API

### Session Management (세션 관리)

이전 세션을 찾거나, 이어서 작업하거나, 삭제할 때 사용.
스크립트: `.omc/workflow/scripts/manage-sessions.sh`

**사용 가능 명령:**
- `list` - 현재 활성 워크트리(세션) 목록
- `info <branch-name>` - 특정 세션 상세 정보 (커밋, 메모리 파일, 상태)
- `delete <branch-name>` - 세션 삭제 (워크트리 + 브랜치)

**이전 세션 이어서 작업하기:**
1. `bash manage-sessions.sh list`로 세션 목록 확인
2. `bash manage-sessions.sh info {branch}`로 상세 정보 확인
3. 해당 워크트리 경로로 이동하여 작업 계속
4. `.omc/memory/` 파일들을 읽어 이전 작업 맥락 복원

**리뷰 피드백 전달하기:**
1. 사용자가 브랜치명으로 세션을 지정
2. 해당 워크트리로 이동
3. `.omc/memory/feedback.md`에 피드백 기록
4. Step 19 (Retrospective) 플로우를 이어서 실행

### Memory Persistence

Record state at these checkpoints:
- After each Step completion: findings/results
- On agent transition: previous agent's conclusions
- On loop rollback: why and what to fix
- On Unit completion: full unit summary

Always read relevant `.omc/memory/*.md` before starting any step.

### Unresolved Decision Tracking

Throughout all phases, if any decision is left unresolved:
- Record in `.omc/memory/unresolved-decisions.md`
- Include in Step 18 report with "may bite you later" warning
- Never silently default to unstated options
