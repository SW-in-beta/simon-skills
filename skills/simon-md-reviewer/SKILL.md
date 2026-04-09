---
name: simon-md-reviewer
description: 마크다운 파일을 브라우저 HTML 뷰어로 열어 인라인 코멘트 기반 리뷰·수정 루프를 실행합니다. MD 파일 경로가 주어지거나, 세션에서 MD를 새로 작성한 뒤 리뷰하고 싶을 때, 또는 '리뷰', 'HTML로 보자', '브라우저에서 열어줘', 'MD 리뷰' 같은 표현이 나오면 이 스킬을 사용하세요. 다른 스킬(simon-study, simon-report 등)이 자체 리뷰 루프를 가진 경우에는 해당 스킬의 루프를 따르고, 이 스킬은 독립적으로 MD 파일을 리뷰할 때 사용합니다.
---

# simon-md-reviewer

마크다운 파일을 HTML Report Viewer로 열어 브라우저에서 인라인 코멘트를 남기고, Claude가 코멘트를 반영하여 MD를 수정하는 리뷰 루프.

## 언제 사용하나

- MD 파일 경로를 직접 지정하며 "리뷰해줘", "HTML로 열어줘"
- 세션에서 MD를 작성한 뒤 "이거 브라우저로 보면서 수정하자"
- 다른 스킬 밖에서 독립적으로 MD 리뷰가 필요할 때

> 다른 스킬(simon-study, simon-oncall, simon-report, simon)이 실행 중이고 해당 스킬 내부에 리뷰 Phase가 있다면, 그 스킬의 리뷰 루프를 따른다. 이 스킬은 독립 호출 전용이다.

---

## Phase 1: 대상 MD 파일 결정

### 경우 A — 경로가 주어진 경우

사용자가 MD 파일 경로를 제공했으면 바로 Phase 2로 진행한다.

### 경우 B — 경로가 없는 경우

사용자에게 무엇을 MD로 작성할지 확인한다. 두 가지 가능성:

1. **세션 컨텍스트에서 생성**: 대화 중 분석/정리한 내용을 MD로 구조화
2. **사용자가 내용 지시**: "이 주제에 대해 정리해줘" → MD 작성

MD 작성 시 아래 가이드라인을 따른다:

- 한국어 작성, 기술 용어는 영어 병기
- 커스텀 블록 적극 활용 (아래 참조)
- mermaid 다이어그램으로 복잡한 관계를 시각화
- 섹션마다 핵심 메시지를 먼저, 상세 내용은 뒤에

**저장 경로 규칙**:
- 사용자가 경로를 지정하면 그대로 사용
- 미지정 시: `~/.claude/reports/{topic-slug}.md`

### 커스텀 블록 레퍼런스

Report Viewer가 지원하는 커스텀 블록 — 내용에 가장 적합한 시각화를 선택한다:

| 문법 | 용도 |
|------|------|
| ` ```mermaid ` | 플로우, 시퀀스, 상태 다이어그램 |
| ` ```math ` | KaTeX 수식 |
| `:::comparison` | A vs B 비교 카드 |
| `:::timeline` | 시간순 이벤트 |
| `:::callout[info/warning/error/success]` | 강조 박스 |
| `:::tabs` | 여러 관점 병렬 제시 |
| `:::collapse[title]` | 접이식 섹션 |
| `:::metric[label]` | KPI/수치 카드 |
| `:::steps` | 단계별 절차 |
| `:::quote[source]` | 인용 카드 |

---

## Phase 2: HTML 렌더링 + 브라우저 오픈

### Viewer 활성 확인

```bash
REPORT_VIEWER="$HOME/.claude/skills/_shared/report-viewer/render-report.sh"
if [ -x "$REPORT_VIEWER" ]; then
  VIEWER_AVAILABLE=true
else
  VIEWER_AVAILABLE=false
fi
```

### Viewer 활성 시

```bash
~/.claude/skills/_shared/report-viewer/render-report.sh "{markdown_file}" --open
```

출력에서 `url`, `comments_file`, `pid`를 파싱하여 기억한다.

사용자에게 안내:

> 마크다운을 브라우저에서 열었습니다: http://localhost:{port}
> 내용을 확인하시고 인라인 코멘트를 남겨주세요. 완료되면 **'리뷰 완료'**라고 말씀해주세요.
> 마크다운 경로: {markdown_file}

### Viewer 미활성 시 (Fallback)

터미널에 마크다운 내용을 출력하고, 사용자와 대화형으로 피드백을 수집한다. 피드백을 받으면 MD를 수정하고 다시 내용을 출력 → 사용자가 "확정"할 때까지 반복.

---

## Phase 3: 코멘트 피드백 루프

사용자가 **"리뷰 완료"**라고 말하면 실행한다.

### Step 1: 코멘트 읽기

```
COMMENTS_FILE="{markdown_dir}/{markdown_basename}-comments.json"
```

Read 도구로 코멘트 파일을 읽는다. 파일이 없거나 `comments` 배열이 비어 있으면:

> 코멘트가 없습니다. 보고서를 그대로 확정합니다.

→ Phase 4로 진행.

### Step 2: 코멘트 처리

각 코멘트의 `intent`에 따라 처리:

| intent | 처리 |
|--------|------|
| `fix` | 해당 섹션을 마크다운에서 수정 (Edit) |
| `question` | 답변을 해당 섹션 아래에 추가 |
| `expand` | 추가 내용을 작성하여 섹션 확장 |
| `approve` | 처리 불필요 |

코멘트의 `section_id`와 `selected_text`를 기준으로 마크다운에서 수정 위치를 찾는다. 마크다운이 정본이므로 마크다운을 먼저 수정한다.

### Step 3: HTML 재생성

```bash
~/.claude/skills/_shared/report-viewer/render-report.sh "{markdown_file}" --open
```

### Step 4: 코멘트 상태 업데이트

처리된 코멘트의 `status`를 `"resolved"`로 변경하여 코멘트 파일에 다시 저장한다.

### Step 5: 반복

사용자에게 안내:

> {N}개 코멘트를 처리했습니다. 업데이트된 내용을 확인해주세요.
> 추가 코멘트가 있으면 브라우저에서 남기고 **'리뷰 완료'**라고 말씀해주세요.
> 완료되었으면 **'확정'**이라고 말씀해주세요.

사용자가 **"확정"**이라고 하면 Phase 4로 진행.

---

## Phase 4: 확정

리뷰가 완료되면:

1. 최종 마크다운 경로를 안내한다
2. 서버 프로세스가 실행 중이면 정리 여부를 확인한다 (보통 사용자가 탭을 닫으면 자연스럽게 종료)

> 리뷰를 완료했습니다.
> 최종 마크다운: {markdown_file}
