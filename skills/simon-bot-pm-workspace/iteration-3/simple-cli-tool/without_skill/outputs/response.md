마크다운 파일을 읽어서 목차(TOC)를 자동 생성하는 Node.js CLI 도구를 만들어 드리겠습니다.

## 프로젝트 구조

```
md-toc/
├── package.json
├── bin/
│   └── md-toc.js
└── lib/
    └── toc-generator.js
```

## 구현 계획

### 1. `package.json`

- `name`: `md-toc`
- `bin` 필드에 `md-toc` 커맨드 등록
- 외부 의존성 없이 Node.js 내장 모듈(`fs`, `path`)만 사용
- `commander` 패키지를 CLI 인자 파싱용으로 하나만 추가

### 2. `lib/toc-generator.js` — 핵심 로직

이 모듈이 수행하는 작업:

1. **마크다운 파일 읽기** — `fs.readFileSync`로 파일 내용을 읽음
2. **헤딩 추출** — 정규식 `/^(#{1,6})\s+(.+)$/gm`으로 `#` ~ `######` 헤딩을 파싱
3. **코드 블록 내부 제외** — 백틱 코드 블록(```)  안의 `#`은 헤딩이 아니므로 무시
4. **앵커 생성** — GitHub 스타일 앵커 변환 (소문자화, 공백을 `-`로 치환, 특수문자 제거)
5. **중복 앵커 처리** — 같은 제목이 여러 번 나오면 `-1`, `-2` 접미사 추가
6. **들여쓰기 적용** — 헤딩 레벨에 따라 `  ` (2칸 스페이스) 들여쓰기
7. **목차 문자열 생성** — `- [제목텍스트](#앵커)` 형식의 마크다운 리스트 반환

### 3. `bin/md-toc.js` — CLI 진입점

지원하는 사용법:

```bash
# 기본: 목차를 stdout에 출력
md-toc README.md

# 파일에 직접 삽입 (<!-- TOC --> 마커 사이에)
md-toc README.md --insert

# 최소/최대 헤딩 레벨 지정
md-toc README.md --min-depth 2 --max-depth 4
```

**옵션 정리:**

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `<file>` | 대상 마크다운 파일 경로 | (필수) |
| `--insert`, `-i` | 파일 내 `<!-- TOC -->` ... `<!-- /TOC -->` 사이에 목차 삽입 | `false` |
| `--min-depth` | 포함할 최소 헤딩 레벨 | `1` |
| `--max-depth` | 포함할 최대 헤딩 레벨 | `6` |
| `--no-link` | 앵커 링크 없이 텍스트만 출력 | `false` |

### 4. `--insert` 모드 동작

파일 안에 아래와 같은 마커가 있으면 그 사이에 목차를 삽입/갱신합니다:

```markdown
<!-- TOC -->
(여기에 목차가 자동 생성됨)
<!-- /TOC -->
```

마커가 없으면 에러 메시지를 출력하고 종료합니다.

## 핵심 알고리즘 (의사코드)

```
function generateTOC(markdown, options):
    lines = markdown.split('\n')
    headings = []
    inCodeBlock = false

    for each line in lines:
        if line starts with '```':
            inCodeBlock = !inCodeBlock
            continue
        if inCodeBlock:
            continue
        match = line.match(/^(#{1,6})\s+(.+)$/)
        if match:
            level = match[1].length
            if level >= options.minDepth AND level <= options.maxDepth:
                headings.push({ level, text: match[2] })

    tocLines = []
    anchorCounts = {}
    for each heading in headings:
        anchor = slugify(heading.text)
        if anchorCounts[anchor]:
            anchor += '-' + anchorCounts[anchor]
        anchorCounts[anchor] = (anchorCounts[anchor] || 0) + 1
        indent = '  '.repeat(heading.level - options.minDepth)
        tocLines.push(indent + '- [' + heading.text + '](#' + anchor + ')')

    return tocLines.join('\n')
```

## 설치 및 사용

```bash
# 프로젝트 초기화 및 의존성 설치
cd md-toc
npm install

# 글로벌 설치
npm link

# 사용
md-toc ./README.md
md-toc ./docs/guide.md --insert --min-depth 2
```

## 예시

입력 파일 (`example.md`):
```markdown
# 프로젝트 소개
## 설치 방법
### 요구사항
### 설치 단계
## 사용법
### 기본 사용
### 고급 기능
# FAQ
```

출력:
```markdown
- [프로젝트 소개](#프로젝트-소개)
  - [설치 방법](#설치-방법)
    - [요구사항](#요구사항)
    - [설치 단계](#설치-단계)
  - [사용법](#사용법)
    - [기본 사용](#기본-사용)
    - [고급 기능](#고급-기능)
- [FAQ](#faq)
```

---

이 도구를 실제로 만들어야 한다면 말씀해 주세요. 위 설계대로 코드를 작성해 드리겠습니다.
