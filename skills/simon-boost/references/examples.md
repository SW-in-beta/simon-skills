# Improvement Proposal 예시

전문가 패널이 개선 제안을 작성할 때 아래 예시의 구체성 수준을 참고한다.
제안은 현재 상태 → 변경 내용 → 기대 효과를 명확히 대비시켜야 한다.

## 좋은 제안 예시

```markdown
### [P-003] Phase A 코드 설계 분석에 의존성 방향 검증 추가

- **심각도**: HIGH
- **대상 스킬**: simon
- **대상 파일**: references/phase-a-planning.md (Step 1-A Code Design Team 섹션)
- **카테고리**: 품질·안전
- **현재 상태**: Code Design Team의 design-pattern-expert가 아키텍처 패턴을 식별하지만, 의존성 방향(dependency direction)이 올바른지 검증하지 않는다. Clean Architecture에서 inner layer가 outer layer를 import하는 위반이 감지되지 않고 계획에 반영된다.
- **제안 내용**: design-pattern-expert의 분석 항목에 "의존성 방향 검증" 추가. 구체적으로:
  - import 문 분석으로 레이어 간 의존 방향 추출
  - 아키텍처 패턴(Clean/Hexagonal/Layered)별 허용 방향 규칙 대조
  - 위반 발견 시 MEDIUM severity로 plan-summary.md에 경고 포함
- **기대 효과**: Phase B 구현 전에 아키텍처 위반을 감지하여, 구현 후 리팩토링 비용을 제거한다. 자료에서 언급된 "shift-left architecture validation" 원칙과 일치.
- **근거**: 자료의 "Architecture Decision Records" 섹션에서 의존성 방향 검증이 사전 분석 단계의 필수 항목으로 권장됨
- **전문가 합의**: Workflow Architect(구조적 완성도 향상), Quality Guardian(사전 품질 검증 강화) 동의. DX Specialist는 분석 시간 증가를 우려했으나, import 문 기반이므로 오버헤드가 작다는 점에서 수용.
```

## 나쁜 제안 예시 (피해야 할 패턴)

```markdown
### [P-004] 에러 처리 개선

- **심각도**: MEDIUM
- **대상 스킬**: simon
- **대상 파일**: SKILL.md
- **카테고리**: 품질·안전
- **현재 상태**: 에러 처리가 부족하다.
- **제안 내용**: 에러 처리를 더 잘하도록 개선한다.
- **기대 효과**: 에러가 줄어든다.
```

↑ 문제점:
- "부족하다", "더 잘하도록" — 구체적으로 **어떤** 에러 처리가 **어디서** 부족한지 불명확
- 대상 파일이 SKILL.md 전체 — **어떤 섹션, 어떤 라인**인지 특정하지 않음
- 제안 내용에 실행 가능한 변경사항이 없음
- 자료 근거가 없음
