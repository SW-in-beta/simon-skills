# Skill Benchmark: simon-bot-boost

**Model**: claude-opus-4-6
**Date**: 2026-03-06T04:34:07Z
**Evals**: 1, 2, 3 (1 run each per configuration)

## Summary

| Metric | With Skill | Without Skill | Delta |
|--------|-----------|---------------|-------|
| Pass Rate | 100% ± 0% | 50% ± 0% | +0.50 |
| Time | 336.0s ± 35.6s | 238.8s ± 20.6s | +97.2s |
| Tokens | 69,075 ± 17,281 | 52,858 ± 7,940 | +16,217 |

## Per-Eval Breakdown

| Eval | With Skill | Without Skill | Time (W/S) | Time (W/O) |
|------|-----------|---------------|------------|------------|
| blog-effective-agents | 6/6 (100%) | 3/6 (50%) | 364.5s | 214.8s |
| github-skills-repo | 6/6 (100%) | 3/6 (50%) | 347.7s | 252.5s |
| prompt-engineering-guide | 6/6 (100%) | 3/6 (50%) | 295.8s | 249.1s |

## Assertion Analysis

| Assertion | With Skill | Without Skill | Discriminating? |
|-----------|-----------|---------------|-----------------|
| A1: Template compliance | 3/3 pass | 0/3 pass | Yes |
| A2: Source accuracy | 3/3 pass | 3/3 pass | No |
| A3: Skill references | 3/3 pass | 3/3 pass | No |
| A4: Actionability | 3/3 pass | 3/3 pass | No |
| A5: Multi-expert analysis | 3/3 pass | 0/3 pass | Yes |
| A6: Not Recommended section | 3/3 pass | 0/3 pass | Yes |

## Notes

- With-skill achieves 100% pass rate across all 3 evals vs 50% baseline — consistent +50% improvement
- The 3 assertions that baseline always fails (A1: template, A5: multi-expert, A6: not-recommended) are the structural differentiators the skill provides
- The 3 assertions that both pass (A2: source accuracy, A3: skill references, A4: actionability) show Claude already does content analysis well without the skill
- With-skill uses ~30% more tokens and ~40% more time on average — the cost of running the expert panel structure
- Prompt-engineering-guide eval had highest token usage (89K) for with-skill — likely due to longer source content requiring more analysis
