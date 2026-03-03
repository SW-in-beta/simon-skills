# simon-bot

[Claude Code](https://claude.com/claude-code)용 19단계 심층 워크플로우 플러그인으로, 최고 수준의 엄밀함으로 코드를 계획하고 구현하며 검증합니다.

[oh-my-claudecode](https://github.com/nicepkg/oh-my-claudecode) 멀티 에이전트 오케스트레이션 기반으로 구축되었습니다.

## 주요 기능

- **범위 우선 계획** — 계획 수립 전에 기존 코드와 git 히스토리를 먼저 분석합니다
- **19단계 품질 파이프라인** — 범위 검증부터 프로덕션 준비까지 전 과정을 다룹니다
- **병렬 실행** — 독립적인 작업 단위를 격리된 git worktree에서 동시에 실행합니다
- **전문가 리뷰 패널** — 최대 9명의 전문 리뷰어가 참여합니다 (보안, DB, API, 동시성 등)
- **컨텍스트 효율적** — 스크립트가 결정적 작업을 처리하고, 메모리 파일이 컨텍스트 손실을 방지합니다
- **PR 리뷰어 친화적** — 작업을 작은 단위로 분할합니다 (3-5개 파일, 최대 200줄)
- **자기 개선** — 회고 피드백이 자동으로 다음 실행을 개선합니다
- **안전 설계** — force push, 실제 DB/API 접근, 파괴적 명령을 사용하지 않습니다

## 설치

```bash
git clone https://github.com/yourname/simon-bot
cd simon-bot
chmod +x install.sh
./install.sh
```

설치되는 항목:
- 글로벌 스킬 → `~/.claude/skills/simon-bot.md`
- 프로젝트 워크플로우 → `.omc/workflow/` (설정, 프롬프트, 스크립트, 템플릿)

### 프로젝트 전용 설치

특정 프로젝트에 워크플로우 파일만 필요한 경우:

```bash
./install.sh --project-only
```

## 사용법

Claude Code에서:

```
/simon-bot implement user authentication with JWT
```

또는 자연어로:

```
simon-bot으로 결제 시스템 구현해줘
```

## 워크플로우

### Phase A: 계획 (대화형)

| 단계 | 에이전트 | 역할 |
|------|----------|------|
| **0** | `architect` | 범위 검증 — 기존 코드, 최소 변경, 리뷰 경로 결정 |
| **1-A** | `explore-medium` → `analyst` | 프로젝트 분석 + 원칙 권장 사항 |
| **1-B** | `planner` | 인터뷰 모드 → 작업 단위 분할 + 계획 수립 |
| **2** | `critic` ↔ `planner` | 계획 리뷰 반복 (최대 3회) |
| **3** | `architect` | critic 리뷰의 메타 검증 |
| **4** | `architect` | 과잉 설계 점검 (YAGNI/KISS) |
| **4-B** | 전문가 패널 | 구현 전 계획 사전 리뷰 — 전문가들이 우려사항/위험요소 식별 |

Step 0에서 리뷰 경로를 선택합니다:

| 경로 | 단계 | 적합한 작업 |
|------|------|-------------|
| **SMALL** | 5→6→7→8→17 | 버그 수정, 소규모 기능 |
| **STANDARD** | 5→6→7→...→17 | 대부분의 기능 개발 |
| **LARGE** | 5→6→7→...→17 + 추가 단계 | 아키텍처 변경 |

### Phase B-E: 구현 및 검증 (자율 실행)

`ralph + ultrawork` 모드로 자동 실행됩니다.

**Pre-Phase: Base Branch Sync** — 최신 `origin/main` (또는 `master`)을 fetch한 후, 사용자가 입력한 브랜치명으로 worktree를 생성합니다. 이를 통해 여러 세션이 동일한 base에서 시작하여 충돌을 방지합니다.

각 Unit은 격리된 git worktree에서 실행됩니다.

| 단계 | 에이전트 | 역할 |
|------|----------|------|
| **Pre** | `setup-test-env.sh` | 테스트 환경 세팅 — 미설치 시 자동 설치 |
| **5** | `executor` | 구현 (Step 4-B 우려사항 반영, TDD 선택 시 적용) |
| **6** | `architect` | 목적 정합성 리뷰 |
| **7-A** | `security-reviewer` + `architect` + 전문가 | 버그/보안/성능 리뷰 |
| **7-B** | `architect` | Step 4-B 사전 우려사항 대조, 누락 항목 보완 |
| **8** | `architect` | 회귀 검증 |
| **9** | `architect` → `executor` | 파일/함수 분할 |
| **10** | `architect` → `executor` | 통합/재사용 리뷰 |
| **11** | `architect` | 부작용 점검 |
| **12** | `code-reviewer` | 전체 변경 사항 리뷰 |
| **13** | `architect` → `executor` | 불필요한 코드 정리 |
| **14** | `code-reviewer` | 코드 품질 평가 |
| **15** | `architect` | UX 흐름 검증 |
| **16** | `architect` | MEDIUM 이슈 해결 |
| **17** | `architect` + `security-reviewer` | 프로덕션 준비 완료 확인 |

### 통합 및 보고

| 단계 | 역할 |
|------|------|
| **통합** | 사용자 지정 브랜치에 커밋 → 충돌 해결 → Draft PR 생성 |
| **18** | 작업 보고서 (변경 전후 흐름, 트레이드오프, 리스크, 테스트) |
| **19** | 회고 (사용자 피드백 → feedback.md에 영속 기록 → 워크플로우 개선) |

## 세션 관리

`/simon-bot-sessions` 커맨드로 여러 Claude Code 세션에 걸친 작업을 관리할 수 있습니다.

| 커맨드 | 설명 |
|--------|------|
| `/simon-bot-sessions list` | 활성 워크트리 세션 목록 |
| `/simon-bot-sessions info feat/add-auth` | 세션 상세 정보 (커밋, 메모리 파일, 상태) |
| `/simon-bot-sessions delete feat/add-auth` | 세션 삭제 (워크트리 + 브랜치) |
| `/simon-bot-sessions resume feat/add-auth` | 이전 작업 이어서 진행 (맥락 복원) |
| `/simon-bot-sessions pr feat/add-auth` | 세션에서 PR 생성 |

또는 쉘 스크립트를 직접 사용:

```bash
bash ~/.claude/skills/simon-bot/workflow/scripts/manage-sessions.sh list
bash ~/.claude/skills/simon-bot/workflow/scripts/manage-sessions.sh info <branch>
bash ~/.claude/skills/simon-bot/workflow/scripts/manage-sessions.sh delete <branch>
```

## 흐름도

```
Startup: 브랜치명 입력 (사용자가 직접 지정)
        │
Step 0: Scope Challenge
  └─ git history + what exists → SMALL / STANDARD / LARGE
        │
Phase A (interactive)
  ├─ 1-A Analysis (Context7)
  ├─ 1-B Planning (Unit split, NOT in scope, Unresolved)
  ├─ 2-4 Review loop
  └─ 4-B Expert Plan Review (구현 전 우려사항 식별)
        │
Pre-Phase: Base Branch Sync
  └─ git fetch origin main → origin/main 기준 worktree 생성
        │ ralph + ultrawork starts
        ▼
Phase B-E (autonomous, worktree isolated)
  Pre: 테스트 환경 세팅 (미설치 시 자동 설치)
  ┌─────────────────┐  ┌─────────────────┐
  │ worktree/unit-1 │  │ worktree/unit-2 │  ← parallel
  │ Step 5~17       │  │ Step 5~17       │
  └────────┬────────┘  └────────┬────────┘
           └──────┬─────────────┘
                  ▼
          worktree/unit-3 (depends on 1,2)
                  │
                  ▼
          Integration → Draft PR
                  │
                  ▼
          Report → Retrospective → feedback.md
                                    (세션 간 영속 기록)
```

## 전문가 패널 (Step 4-B & Step 7)

전문가들은 워크플로우에서 **두 번** 개입합니다:
1. **Step 4-B** (계획 사전 리뷰): 구현 전에 계획을 검토하고 우려사항/위험요소를 식별
2. **Step 7** (구현 검증): 구현 결과를 검증하고, 사전 우려사항 누락 여부를 대조

항상 활성화:

| 전문가 | 중점 영역 | 사전 리뷰 시 초점 |
|--------|-----------|------------------|
| `security-reviewer` | OWASP Top 10, 인젝션, 인증 | 설계 단계의 보안 취약점 |
| `architect` (버그) | 레이스 컨디션, 엣지 케이스, 에러 핸들링 | 안정성/에러 처리 설계 누락 |

프로젝트 분석 결과에 따라 자동 감지:

| 전문가 | 활성화 조건 | 사전 리뷰 시 초점 |
|--------|-------------|------------------|
| DB 전문가 | 데이터베이스 사용이 감지된 경우 | 스키마 변경, 마이그레이션, 쿼리 성능 |
| API 전문가 | REST/gRPC/WebSocket이 감지된 경우 | API 설계, 호환성, 버전관리 |
| 동시성 전문가 | 멀티스레드/비동기 패턴이 감지된 경우 | 동시성, 데드락, 레이스컨디션 |
| 인프라 전문가 | Docker/K8s/CI 코드가 감지된 경우 | 배포, 인프라 영향 |
| 캐싱 전문가 | 캐싱 레이어가 감지된 경우 | 캐시 무효화, 일관성 |
| 메시징 전문가 | Kafka/RabbitMQ가 감지된 경우 | 메시지 순서, 멱등성 |
| 인증 전문가 | 인증 로직이 핵심인 경우 | 인증/인가 플로우 |

## 커스터마이징

### config.yaml

임계값, 반복 제한, 전문가 설정을 조정할 수 있습니다:

```yaml
# Change unit size limits
unit_limits:
  max_files: 5
  max_lines: 200

# Adjust code size thresholds
size_thresholds:
  function_lines: 50
  file_lines: 300

# 루프 제한 (전문가 사전 리뷰 포함)
loop_limits:
  step4b_critical: 2    # Step 4-B: CRITICAL 우려 시 계획 수정 최대 반복
  step7b_recheck: 1     # Step 7-B: 누락 우려 fix 후 재검증 최대 반복

# 테스트 환경 점검 (의존성 미설치 시 테스트 스킵)
test_env:
  check_before_test: true
  skip_on_missing: true
```

### 전문가 프롬프트

`.omc/workflow/prompts/*.md`에서 전문가 리뷰 기준을 수정할 수 있습니다:

```
.omc/workflow/prompts/
├─ db-expert.md
├─ api-expert.md
├─ concurrency-expert.md
├─ infra-expert.md
├─ caching-expert.md
├─ messaging-expert.md
└─ auth-expert.md
```

### 회고

이전 피드백은 `.omc/memory/retrospective.md`에 저장되며, 이후 실행 시 자동으로 참조됩니다. 워크플로우는 사용자의 피드백을 바탕으로 지속적으로 개선됩니다.

## 안전 규칙

다음 작업은 **어떠한 경우에도 절대 금지**됩니다:

- `git push --force` — 어떤 상황에서도 사용 불가
- `main`/`master`에 직접 병합 — Draft PR만 허용
- `rm -rf` — 파괴적 삭제 금지
- 실제 DB 접근 — `mysql`, `psql`, `redis-cli`, `mongosh`
- 실제 API 호출 — 외부 엔드포인트로의 `curl`, `wget`
- 실제 서버 접근 — `ssh`, `scp`, `sftp`
- 시크릿 커밋 — `.env`, 자격 증명, API 키
- 실제 외부 시스템을 사용한 테스트 — mock/stub만 허용

## 요구 사항

- [Claude Code](https://claude.com/claude-code) v2.0+
- [oh-my-claudecode](https://github.com/nicepkg/oh-my-claudecode) v4.0+
- Git

## 라이선스

MIT
