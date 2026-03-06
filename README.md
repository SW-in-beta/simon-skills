# simon-bot

[한국어](./README.ko.md)

A modular skill family for [Claude Code](https://claude.com/claude-code) — from deep implementation workflows to project management, analysis reports, and self-improvement.

## Skills

| Skill | Description |
|-------|-------------|
| `/simon-bot` | 19-step deep workflow — plans, implements, and verifies code with maximum rigor |
| `/simon-bot-grind` | Tenacious variant — all retry limits set to 10, auto-diagnosis/recovery/strategy pivots |
| `/simon-bot-sessions` | Session management — list, resume, delete worktree-based work sessions |
| `/simon-bot-boost` | External resource analysis — reads links (blogs, GitHub, papers) and suggests skill improvements |
| `/simon-bot-pm` | Project Manager — plans entire apps via PRD and distributes tasks to simon-bot instances |
| `/simon-bot-report` | Pre-analysis reports — RFC, status analysis, or custom format docs via expert team discussion |

## Features

- **Scope-first planning** — Analyzes existing code and git history before planning
- **19-step quality pipeline** — From scope challenge to production readiness
- **Parallel execution** — Independent work units run simultaneously in isolated git worktrees
- **5 domain expert teams** — 22 specialists organized into teams that discuss and reach consensus (Safety, Code Design, Data, Integration, Ops)
- **Code Design pre-analysis** — Convention, idiom, pattern, and testability experts analyze the repo before planning
- **Interactive guided review** — Plan-mapped code review with rich before/after context
- **Mandatory TDD** — RED→GREEN→REFACTOR cycle enforced in every implementation step
- **CONTEXT.md** — At-a-glance working document per session (git-excluded, auto-updated at each step)
- **Success Criteria checklist** — Explicit completion gate verified at Step 17 and before PR creation
- **Context-efficient** — Scripts handle deterministic tasks; memory files prevent context loss
- **PR-reviewer friendly** — Work split into small units (3-5 files, 200 lines max)
- **Self-improving** — Retrospective feedback automatically improves future runs
- **Safe by design** — No force push, no real DB/API access, no destructive commands

## Architecture

```
skills/
├── simon-bot/
│   ├── SKILL.md                    # Core 19-step workflow
│   └── references/                 # Phase-specific detail files
│       ├── phase-a-planning.md
│       ├── phase-b-implementation.md
│       ├── integration-and-review.md
│       ├── agent-teams.md
│       ├── error-resilience.md
│       └── ...
├── simon-bot-grind/
│   ├── SKILL.md                    # Grind overrides (extends simon-bot)
│   └── references/
├── simon-bot-sessions/
│   └── SKILL.md
├── simon-bot-boost/
│   └── SKILL.md
├── simon-bot-pm/
│   ├── SKILL.md                    # 7-phase PM pipeline
│   └── references/
└── simon-bot-report/
    └── SKILL.md
```

Skills are **modular**: each SKILL.md contains the core instructions while heavy details are split into `references/` subdirectories. Reference files are loaded on-demand per phase to minimize context consumption.

Cross-cutting protocols (Error Resilience, Agent Teams, Decision Trail, Auto-Verification Hook) are shared across skills and defined once in the core `simon-bot` skill.

Install path: `~/.claude/skills/`

## Installation

```bash
git clone https://github.com/yourname/simon-bot
cd simon-bot
chmod +x install.sh
./install.sh
```

This installs:
- All 6 skills → `~/.claude/skills/simon-bot*/`
- Project workflow files → `.claude/workflow/` (config, prompts, scripts, templates)

### Project-only install

If you only need workflow files in a specific project:

```bash
./install.sh --project-only
```

## Usage

In Claude Code:

```
/simon-bot implement user authentication with JWT
```

Or naturally:

```
simon-bot으로 결제 시스템 구현해줘
```

### When to use which skill

| Situation | Skill |
|-----------|-------|
| Implement a feature or fix a bug | `/simon-bot` |
| Must not fail — complex codebase, many retries needed | `/simon-bot-grind` |
| Resume or manage previous work sessions | `/simon-bot-sessions` |
| Found a useful article/repo — improve simon-bot skills | `/simon-bot-boost` |
| Build an entire app or manage a multi-feature project | `/simon-bot-pm` |
| Need an RFC, architecture analysis, or status report (no code changes) | `/simon-bot-report` |

## Workflow (simon-bot)

### Phase A: Planning (Interactive)

| Step | Agent | Role |
|------|-------|------|
| **0** | `architect` | Scope Challenge — what exists, minimum change, review path |
| **1-A** | `explore-medium` → `analyst` → **Code Design Team** | Project analysis + repo convention/pattern/idiom pre-analysis |
| **1-B** | `planner` | Interview mode → Unit breakdown + plan |
| **2** | `critic` ↔ `planner` (Agent Team) | Plan review via direct discussion (max 3 iterations) |
| **3** | `architect` (Agent Team) | Meta-verification of critic's review |
| **4** | `architect` (Agent Team) | Over-engineering check (YAGNI/KISS) |
| **4-B** | 5 domain expert teams | Pre-implementation plan review — teams discuss and flag concerns |

User chooses a review path in Step 0:

| Path | Steps | Best for |
|------|-------|----------|
| **SMALL** | 5→6→7→8→17 | Bug fixes, small features |
| **STANDARD** | 5→6→7→...→17 | Most features |
| **LARGE** | 5→6→7→...→17 + extras | Architecture changes |

### Phase B-E: Implementation & Verification (Autonomous)

Runs automatically with `ralph + ultrawork` mode.

**Pre-Phase: Base Branch Sync** — Fetches latest `origin/main` (or `master`) and creates a worktree with the user-provided branch name. Creates `CONTEXT.md` (git-excluded working document) with plan summary, expert concerns, and success criteria checklist.

Each Unit executes in an isolated git worktree.

| Step | Agent | Role |
|------|-------|------|
| **Pre** | `setup-test-env.sh` | Test environment setup — auto-install deps if missing |
| **5** | `executor` | Implementation — **mandatory TDD** (RED→GREEN→REFACTOR) |
| **6** | `architect` | Purpose alignment review |
| **7-A** | 5 domain expert teams | Bug/security/performance verification via team discussion |
| **7-B** | `architect` | Cross-check against Step 4-B concerns; fix missed items |
| **8** | `architect` | Regression verification |
| **9** | `architect` → `executor` | File/function splitting |
| **10** | `architect` → `executor` | Integration/reuse review |
| **11** | `architect` | Side effect check |
| **12** | `code-reviewer` | Full change review |
| **13** | `architect` → `executor` | Dead code cleanup |
| **14** | `code-reviewer` | Code quality assessment |
| **15** | `architect` | Flow verification (backend/data/error/event flows) |
| **16** | `architect` | MEDIUM issue resolution |
| **17** | `architect` + `security-reviewer` | Production readiness |

### Finalization

| Step | Role |
|------|------|
| **Integration** | Commit to user-named branch → resolve conflicts → build/test verification |
| **18** | Work report (before/after flow, trade-offs, risks, tests) |
| **18-B** | Review sequence — group changes into logical units, map to plan |
| **19** | **Interactive guided review → Success Criteria verification → PR creation** |

## simon-bot-grind

Extends simon-bot with maximum tenacity:

- **All retry limits = 10** — never gives up easily
- **Escalation Ladder** — simple fix → root cause analysis → strategy pivot → last stand
- **Auto-Diagnosis** — failure tracking, pattern detection, strategy pivots
- **Checkpoints** — `git tag checkpoint-step{N}-attempt{M}` before every pivot for safe rollback
- **Progress Detection** — 2 consecutive stalls trigger immediate strategy switch
- **Total Retry Budget** — 50 retries across the entire workflow, with 70% warning
- **Confidence Scoring** — all agent outputs tagged with confidence + impact

## simon-bot-pm

A 7-phase Project Manager pipeline:

| Phase | Name | What happens |
|-------|------|--------------|
| 0 | Project Setup | Project type detection, execution mode selection |
| 1 | Spec-Driven Design | Interview → Spec(WHAT) → Architecture(HOW) → PRD |
| 2 | Task Breakdown | PRD → feature decomposition → dependency graph → execution plan |
| 3 | Environment Setup | Scaffolding, dependencies, configuration |
| 4 | Feature Execution | Distributes features to simon-bot/grind instances (parallel where possible) |
| 5 | Full Verification | Integration testing, architecture review, security review |
| 6 | Delivery | Final report, guided review, PR creation |

Automatically assigns `simon-bot` or `simon-bot-grind` to each feature based on complexity. Includes a Scope Guard to redirect small tasks to simon-bot directly.

## simon-bot-report

Produces pre-implementation analysis documents without modifying code:

- **Document types**: RFC, status analysis, custom format
- **Expert team discussion**: Uses the same 5-domain expert structure as simon-bot
- **Interactive guided review**: Section-by-section review with user feedback
- **Seamless handoff**: After review, can launch simon-bot or simon-bot-pm with the analysis as context

## simon-bot-boost

Reads external resources (blog posts, GitHub repos, papers, articles) and improves simon-bot skills:

- **5-expert panel**: Workflow Architect, Prompt Engineer, Innovation Scout, Quality & Safety Guardian, DX Specialist
- **Targets all skills**: Analyzes all 5 skill files + references
- **User-controlled**: Every improvement proposal requires explicit approval before applying
- **Change tracking**: All applied changes logged in `.claude/boost/applied-log.md`

## Session Management

Use `/simon-bot-sessions` to manage work sessions across Claude Code sessions.

| Command | Description |
|---------|-------------|
| `/simon-bot-sessions list` | List all active worktree sessions |
| `/simon-bot-sessions info feat/add-auth` | Show session details (commits, memory files, status) |
| `/simon-bot-sessions delete feat/add-auth` | Delete session (worktree + branch) |
| `/simon-bot-sessions resume feat/add-auth` | Resume previous work with context restoration |
| `/simon-bot-sessions pr feat/add-auth` | Create PR from session |

Or use the shell script directly:

```bash
bash ~/.claude/skills/simon-bot/workflow/scripts/manage-sessions.sh list
bash ~/.claude/skills/simon-bot/workflow/scripts/manage-sessions.sh info <branch>
bash ~/.claude/skills/simon-bot/workflow/scripts/manage-sessions.sh delete <branch>
```

## Expert Panel (5 Domain Teams)

Experts operate as **teams that discuss and reach consensus**, not as individual reviewers.

### Team Structure

| Team | Members | Activation | Discussion Focus |
|------|---------|------------|------------------|
| **Safety** | appsec, auth, infrasec, stability | Always (appsec + stability) | Security boundaries, auth bypass, failure recovery |
| **Code Design** | convention, idiom, design-pattern, testability | Always (convention + idiom) | Repo conventions, language idioms, design patterns, testability |
| **Data** | rdbms, cache, nosql | Auto-detect (min 2) | Data consistency, cache invalidation, cross-storage integrity |
| **Integration** | sync-api, async, external-integration, messaging | Auto-detect (min 2) | Sync/async boundaries, error propagation, failure isolation |
| **Ops** | infra, observability, performance, concurrency | Auto-detect (min 2) | Operational stability, observability, performance |

## Customization

### config.yaml

Adjust thresholds, loop limits, and expert configuration:

```yaml
model_policy: opus              # Model for all agents
language: ko                    # Report language

unit_limits:
  max_files: 5
  max_lines: 200

size_thresholds:
  function_lines: 50
  file_lines: 300

loop_limits:
  critic_planner: 3
  step4b_critical: 2
  step7b_recheck: 1
  step7_8: 2
  step6_executor: 3
  step16: 3

expert_panel:
  mode: agent-team
  discussion_rounds: 2
  require_consensus: true

test_env:
  check_before_test: true
  skip_on_missing: true
```

### Expert Prompts

Modify expert review criteria in `.claude/workflow/prompts/*.md` (22 expert prompts).

### Retrospective

Past feedback is stored in `.claude/memory/retrospective.md` and automatically referenced in future runs.

## Safety Rules

The following actions are **absolutely forbidden** at all times:

- `git push --force` — never, under any circumstances
- Merge to `main`/`master` — only PRs
- `rm -rf` — no destructive deletions
- Real DB access — `mysql`, `psql`, `redis-cli`, `mongosh`
- Real API calls — `curl`, `wget` to external endpoints
- Real server access — `ssh`, `scp`, `sftp`
- Secret commits — `.env`, credentials, API keys
- Tests with real external systems — mock/stub only

## Requirements

- [Claude Code](https://claude.com/claude-code) v2.0+
- Git

## License

MIT
