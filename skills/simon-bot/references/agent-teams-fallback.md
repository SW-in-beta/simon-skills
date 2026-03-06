# Agent Teams Fallback Protocol

Agent Teams(`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)가 비활성 상태이거나 TeamCreate가 실패할 경우의 대체 전략.

## 감지

TeamCreate 호출 시 에러가 발생하면 Agent Teams가 비활성 상태로 판단한다.

## Fallback 전략

Agent Teams의 3단계 토론(독립 분석 → 교차 토론 → 합의 도출)을 subagent 기반으로 대체한다:

1. **독립 분석**: 각 전문가를 개별 `Agent(subagent_type="general-purpose")`로 spawn하여 병렬 분석
2. **교차 토론**: Lead(오케스트레이터)가 각 전문가의 findings를 수집하고, 충돌하는 부분을 식별하여 관련 전문가에게 재질의
3. **합의 도출**: Lead가 모든 findings를 종합하여 최종 결과 작성

## 적용 범위

이 fallback은 Agent Teams를 사용하는 모든 단계에 적용된다:
- simon-bot: Code Design Team (Step 1-A), Plan Review Team (Steps 2-4), Expert Review Team (Step 4-B), Impl Review Team (Step 7)
- simon-bot-grind: 위 모든 단계 + grind 확장
- simon-bot-report: Code Design Analysis (Step 2), Domain Expert Team (Step 3)

## 기록

Fallback 모드로 전환 시 `.claude/memory/agent-teams-status.md`에 기록:
```
Mode: subagent-fallback
Reason: TeamCreate failed / AGENT_TEAMS env not set
Timestamp: {timestamp}
```

## 품질 보장

Fallback 모드에서도 동일한 전문가 구성과 findings schema를 사용한다. 토론의 깊이는 줄어들 수 있지만, 핵심 안전 검증(Safety Team, Code Design Team)은 동일하게 수행한다.
