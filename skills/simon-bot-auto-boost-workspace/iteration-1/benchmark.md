# Skill Benchmark: simon-bot-auto-boost

**Model**: claude-opus-4-6
**Date**: 2026-03-13T08:06:33Z
**Evals**: eval-1-first-run, eval-2-focused-search (1 run each per configuration)

## Summary

| Metric | with_skill | without_skill | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 100.0% ± 0.0% | 33.0% ± 6.3% | +67.0% |
| Time | 604.5s ± 18.3s | 540.7s ± 46.5s | +63.8s |
| Tokens | 106,331 ± 8,504 | 150,980 ± 12,015 | -44,649 |

## Per-Eval Breakdown

### eval-1-first-run: 전체 워크플로 기본 실행

| Assertion | with_skill | without_skill |
|-----------|:----------:|:-------------:|
| 검색 결과 마크다운 테이블 | PASS | FAIL |
| 4개 카테고리 검색 | PASS | FAIL |
| 구조화된 소스 요약본 | PASS | PASS |
| 6명 전문가 개별 분석 | PASS | FAIL |
| P-001 형식 개선 제안서 | PASS | PASS |
| 가이드라인 검증 보고서 | PASS | FAIL |
| 상태 파일 JSON 생성 | PASS | FAIL |

### eval-2-focused-search: 관심 영역 집중 검색

| Assertion | with_skill | without_skill |
|-----------|:----------:|:-------------:|
| 검색 결과 마크다운 테이블 | PASS | FAIL |
| 4개 카테고리 검색 | PASS | FAIL |
| 구조화된 소스 요약본 | PASS | PASS |
| 6명 전문가 개별 분석 | PASS | FAIL |
| P-001 형식 개선 제안서 | PASS | PASS |
| 가이드라인 검증 보고서 | PASS | FAIL |
| 상태 파일 JSON 생성 | PASS | FAIL |
| 관심 영역 반영 | PASS | PASS |

## Analyst Notes

- 스킬 유무에 따른 pass rate 차이가 매우 큼 (100% vs 33%) — 스킬이 워크플로 구조화에 핵심적
- baseline도 소스 요약과 P-001 형식 제안서는 생성 가능 — 이 assertion들은 비차별적
- 스킬 사용 시 토큰이 29% 적음 (106K vs 151K) — 구조화된 지시가 불필요한 탐색을 줄임
- 시간은 with_skill이 약간 더 김 (+63.8s) — 6단계 워크플로의 각 단계를 충실히 수행하기 때문
- 핵심 차별화 assertion: 전문가 패널(6명), 4개 카테고리 검색, 가이드라인 검증, 상태 파일 — 이것들은 baseline에서 전혀 통과하지 못함
