# Skill Best Practices Checklist

Expert 6 (Skill Craft Specialist)와 Step 6-B (형식 품질 검증)에서 사용하는 체크리스트.
skill-creator의 Skill Writing Guide를 기반으로 simon-bot 패밀리에 맞게 정리했다.

## 1. Progressive Disclosure

스킬은 3단계로 로딩된다. 각 단계의 크기를 적절히 유지해야 컨텍스트를 낭비하지 않는다.

| 단계 | 로딩 시점 | 권장 크기 |
|------|-----------|-----------|
| Metadata (name + description) | 항상 (스킬 목록에 표시) | ~100 단어 |
| SKILL.md body | 스킬 트리거 시 | < 500줄 |
| References / Scripts | 필요 시 명시적 로딩 | 제한 없음 (300줄 초과 시 TOC 필요) |

**체크 항목:**
- [ ] SKILL.md가 500줄 이내인가?
- [ ] 500줄 초과 시, reference로 분리 가능한 블록이 있는가?
- [ ] Reference 파일이 300줄을 초과하면 TOC가 있는가?
- [ ] SKILL.md에서 reference로의 포인터(`> Reference Loading: [파일명](경로) 읽기`)가 명확한가?
- [ ] 로딩 시점 지시("Step N 진입 시 읽기")가 있어 불필요한 선제 로딩을 방지하는가?

## 2. Skill Decomposition

하나의 스킬이 너무 많은 독립적 관심사를 다루면, 후반 단계가 컨텍스트 소진으로 실행되지 않는다.

**분리가 필요한 신호:**
- SKILL.md가 reference 분리 후에도 500줄 초과
- 2개 이상의 독립적 워크플로가 상태를 공유하지 않음
- 후반 단계가 일관되게 실행되지 않음 (컨텍스트 소진)
- sub-workflow가 단독으로 유용함

**분리하면 안 되는 경우:**
- 단계들이 긴밀한 파이프라인 (각 단계가 이전 단계 출력을 직접 소비)
- 조율 오버헤드(파일 기반 핸드오프, 트리거 설계)가 이점보다 큼
- 300줄 미만이고 end-to-end로 안정적으로 동작

**체크 항목:**
- [ ] 독립적 sub-workflow가 하나의 스킬에 묶여 있지 않은가?
- [ ] 후반 단계가 컨텍스트 소진으로 실행되지 않는 징후가 있는가?
- [ ] 분리된 스킬 간 순환 의존이 없는가?

## 3. Description 트리거링

description은 스킬이 호출되는 유일한 메커니즘이다. 잘못 쓰면 필요할 때 호출되지 않거나, 불필요할 때 호출된다.

**좋은 description 패턴:**
- 스킬이 하는 일 + 구체적 트리거 상황을 모두 포함
- "Use when:" 패턴으로 트리거 조건 명시
- 약간 "pushy"하게 — 과소 트리거보다 과다 트리거가 낫다
- 인접 스킬과의 경계를 명시 (예: "코드 변경 없이 분석만 필요할 때")

**나쁜 description 패턴:**
- 너무 추상적 ("프로젝트를 관리합니다")
- 트리거 조건 없이 기능만 나열
- 다른 스킬과 트리거 범위가 겹침

**체크 항목:**
- [ ] Description에 "Use when:" 또는 동등한 트리거 조건이 있는가?
- [ ] 인접 스킬과 트리거 범위가 명확히 구분되는가?
- [ ] 사용자가 실제로 사용할 표현/키워드가 포함되어 있는가?

## 4. Writing Patterns

지시문의 형식이 LLM의 이해도와 준수율에 직접 영향을 미친다.

**명령형 사용:**
- Good: "파일을 읽고 분석한다"
- Bad: "파일을 읽고 분석하면 좋겠습니다"

**Why 설명:**
- ALWAYS/NEVER 대문자 강조보다, 왜 그래야 하는지 설명하는 것이 더 효과적
- Good: "Write로 덮어쓰면 기존 내용이 유실되므로, 반드시 Read → Edit 순서를 따른다"
- Bad: "ALWAYS use Read before Edit. NEVER use Write."

**예시 포함:**
- 추상적 지시보다 구체적 예시가 준수율을 높인다
- Input/Output 쌍이나 Good/Bad 대비가 효과적

**체크 항목:**
- [ ] 지시문이 명령형으로 작성되어 있는가?
- [ ] 중요한 규칙에 "왜"가 설명되어 있는가?
- [ ] 모호한 지시에 구체적 예시가 포함되어 있는가?
- [ ] ALWAYS/NEVER 남용 없이 이유 기반으로 설득하는가?

## 5. Frontmatter 유효성

YAML frontmatter는 스킬의 메타데이터로, 트리거링과 호환성 정보를 담는다.

**필수 필드:**
- `name`: 스킬 식별자
- `description`: 트리거링 메커니즘 (위 3번 참조)

**선택 필드:**
- `compatibility`: 필요한 도구, 의존성

**체크 항목:**
- [ ] name과 description이 존재하는가?
- [ ] description이 적절한 길이(~100 단어)인가?
- [ ] compatibility에 실제 사용하는 도구만 나열되어 있는가?
- [ ] YAML 문법이 유효한가? (특히 따옴표, 들여쓰기)

## 6. Reference 구조

**디렉토리 구성:**
```
skill-name/
├── SKILL.md
└── references/
    ├── phase-a.md        (도메인별 분리)
    ├── phase-b.md
    └── error-handling.md
```

**체크 항목:**
- [ ] Reference 파일이 도메인/관심사별로 분리되어 있는가?
- [ ] SKILL.md에서 각 reference의 로딩 시점이 명시되어 있는가?
- [ ] 불필요한 reference가 없는가? (참조되지 않는 파일)
- [ ] 파일명이 내용을 직관적으로 설명하는가?

## 7. Multi-Agent Patterns

스킬이 Agent Teams 또는 Sub-agents를 사용하는 경우의 설계 품질. 에이전트 유형 선택이 잘못되면 검증의 독립성이 훼손되거나 토론의 가치가 손실된다 — `agent-teams.md`의 Agent Selection Framework 참조.

**체크 항목:**
- [ ] 각 multi-agent Step이 DISCUSSION / VERIFICATION / HYBRID 중 하나로 분류되어 있는가?
- [ ] VERIFICATION 패턴의 에이전트에 Blind-First 또는 Adversarial Default가 적용되어 있는가? (검증에 Agent Team 사용은 확증 편향 위험)
- [ ] DISCUSSION 패턴의 에이전트에 역할 분화(Thinking Hats)가 되어 있는가? (Black Hat — 비판 역할 누락 주의)
- [ ] Agent Team Fallback 시 토론/검증 구분이 유지되는가? (토론 Fallback은 2라운드 시뮬레이션 필요)
- [ ] 불필요한 multi-agent 사용이 없는가? (Saturation Guard 기준: 5세션+ 추가 발견율 10% 미만 → optional)
- [ ] Spawn Prompt에 Mode(DISCUSSION/VERIFICATION)가 명시되어 있는가?
