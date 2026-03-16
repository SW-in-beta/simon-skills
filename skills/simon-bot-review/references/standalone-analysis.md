# Standalone Analysis (Step 0)

STANDALONE 모드에서 simon-bot의 Step 18-A(Report)/18-B(Review Sequence)에 해당하는 분석을 자체 수행한다. simon-bot이 전문가 패널과 구현 과정을 거쳐 생성하는 것과 동등한 품질을 위해 agent team을 구성한다.

## 실행 조건

`.claude/memory/review-sequence.md`가 존재하지 않을 때만 실행한다.

## Step 0-A: 변경사항 수집

1. Base branch 감지:
   ```bash
   git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
   ```
   실패 시 `main` → `master` 순서로 시도

2. 변경사항 수집 (병렬):
   ```bash
   git diff {base}...HEAD
   git log {base}...HEAD --oneline
   git diff {base}...HEAD --stat
   ```

3. 변경된 파일 전체 읽기 — diff만으로는 변경 전 맥락을 충분히 파악할 수 없으므로, 주요 변경 파일의 전체 내용을 확인한다.

## Step 0-B: Agent Team 분석

두 전문가를 **병렬로** spawn한다:

### architect agent

역할: 변경사항의 구조를 분석하고 논리적 변경 단위로 그룹핑

지시사항:
- 전체 diff를 읽고 **논리적 변경 단위(Logical Change Unit)**로 그룹핑
- 논리적 변경 단위 = 하나의 목적/기능을 달성하기 위해 함께 변경된 파일들의 묶음
- **정렬 기준**: 데이터/호출 흐름 순서 (상류 → 하류)
- 각 변경 단위에 대해:
  - 제목 (한 줄 요약)
  - 변경 동기 (왜 이 변경이 필요한지)
  - 관련 파일 목록 (각 파일의 역할)
  - 다른 변경 단위와의 연관 (의존/호출/데이터 흐름)
  - 리뷰 순서 결정 근거
- **기존 패턴 스캔**: diff에서 새로 도입된 패턴(필드 타입, 유틸리티, 디자인 패턴 등)에 대해 코드베이스를 능동적으로 Grep/Glob 탐색하여 기존 대안이 있는지 확인한다. 단순히 "알고 있는" 유사 패턴만 비교하는 것이 아니라, 모르는 패턴도 발견하기 위해 검색한다. 예: diff에 `CharField(choices=...)` → 프로젝트 내 `custom_fields`, `EnumField`, `ChoiceField` 등을 검색
- 산출물: `.claude/memory/review-sequence-draft-arch.md`

### writer agent

역할: 각 변경의 맥락, 트레이드오프, 우려사항을 정리

지시사항:
- 전체 diff와 변경 파일을 읽고, 각 주요 변경에 대해:
  - 변경 전 상태 (Before Context): 기존 코드의 역할/동작/한계를 구체적 코드 수준으로 설명
  - 변경 내용 (What Changed): 구체적으로 어떤 부분을 어떻게 개선/추가했는지
  - 핵심 코드 변경: Before/After diff (중요 부분만 발췌)
  - 리뷰 포인트: 번호 매긴 구체적 기술 포인트 (코드 수준 근거 포함)
  - 미수정 사유: 변경하지 않은 관련 코드가 있으면 왜 안 바꿨는지
  - 유사 패턴 비교: **기존 패턴 스캔 결과를 기반으로** 코드베이스 내 비슷한 구현과의 차이/일관성을 분석. 커스텀 유틸리티, 공통 모듈, 프로젝트 관행이 있는데 사용하지 않은 경우 그 이유를 확인
  - 전문가 수준 우려사항: 보안, 성능, 데이터 정합성, 에러 핸들링 관점에서의 우려
  - 트레이드오프: 설계 결정, 고려한 대안, 선택 이유
- 산출물: `.claude/memory/review-sequence-draft-writer.md`

### impact-analyzer agent

역할: 변경되지 않았지만 영향받을 수 있는 코드를 식별

지시사항:
- 변경된 함수/메서드/클래스의 **직접 호출자(Callers)**를 Grep으로 탐색
- 변경된 인터페이스/타입의 **구현체/소비자**를 탐색
- 변경된 코드가 수정하는 **공유 상태**(DB 스키마, 캐시 키, 설정값)를 읽는 코드를 탐색
- 변경된 함수의 **반환값을 소비하는 코드**를 탐색
- 탐색 깊이: 1-depth (직접 관계만)
- 각 영향받는 코드에 대해:
  - 영향받는 파일:라인 (함수/클래스명)
  - 관련 변경 단위
  - 영향받는 이유 (호출 관계, 데이터 흐름, 공유 상태 등)
  - 잠재적 영향 (동작 변화 가능성)
  - 필요 조치 (확인만 / 수정 필요 / 테스트 추가 / 모니터링)
- **필터링**: 단순 호출 관계만 있고 동작 변화 가능성이 없는 코드는 제외. 테스트 파일, 자동 생성 파일도 제외
- 산출물: `.claude/memory/review-sequence-draft-impact.md`

## Step 0-C: 통합 및 교차 검증

세 agent의 산출물을 통합한다:

1. architect의 변경 단위 구조를 기본 골격으로 사용
2. writer의 맥락/우려사항/트레이드오프를 각 변경 단위에 매핑
3. impact-analyzer의 영향 분석 결과를 각 변경 단위에 매핑
4. 불일치 검증:
   - architect가 분리한 단위를 writer가 합쳐야 한다고 판단한 경우 → 리뷰 흐름 기준으로 판단
   - writer가 발견한 우려사항이 architect의 리뷰 포인트에 없는 경우 → 추가
   - impact-analyzer가 발견한 영향이 writer의 우려사항과 겹치는 경우 → 통합
5. 최종 `review-sequence.md` 포맷으로 통합하여 저장

### review-sequence.md 포맷

simon-bot Step 18-B와 동일한 구조:

```markdown
# Review Sequence

## 변경 단위 1: {제목}

- **변경 동기**: {왜 이 변경이 필요한지}
- **변경 전 상태**: {기존 코드의 역할/동작/한계}
- **변경 내용**: {구체적으로 어떤 부분을 어떻게 개선/추가했는지}
- **관련 파일 목록**:
  - `path/to/file.py` — {역할}
  - `path/to/test.py` — {역할}
- **핵심 코드 변경**: Before/After diff (중요 부분만)
- **리뷰 포인트**:
  1. {구체적 기술 포인트}
  2. {미수정 사유}
  3. {유사 패턴 비교}
- **다른 변경 단위와의 연관**: {의존/호출/데이터 흐름}
- **전문가 우려사항**: {보안/성능/데이터 정합성 관점}
- **트레이드오프**: {설계 결정과 그 이유, 고려한 대안}
- **영향 분석**: 변경되지 않았지만 영향받을 수 있는 코드 목록
  - `{파일:라인}` ({함수/클래스명}) — {영향받는 이유} → {필요 조치}
```

STANDALONE 모드에서는 `계획 매핑` 항목이 없다 (simon-bot의 plan-summary가 없으므로). 대신 `변경 동기`가 그 역할을 대신한다.

## Step 0-D: Report 생성

review-sequence.md를 기반으로 간략 report를 생성한다:

- Before/After 요약
- 주요 리뷰 포인트
- 트레이드오프
- 우려사항
- 변경 파일 목록

저장: `.claude/reports/{branch-name}-report.md`
