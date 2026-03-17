#!/bin/bash
# PreToolUse 훅: ABSOLUTE FORBIDDEN 패턴을 결정론적으로 차단
# Bash 도구 실행 전 명령어를 검사하여 위험한 패턴을 exit 2로 차단한다.
# 컨텍스트 압축, 장시간 세션, 다중 에이전트 상황에서도 100% 작동.

INPUT=$(cat)
TOOL_INPUT=$(printf '%s' "$INPUT" | jq -r '.tool_input // "{}"')
COMMAND=$(printf '%s' "$TOOL_INPUT" | jq -r '.command // ""')

# 명령어가 없으면 통과
[[ -z "$COMMAND" ]] && exit 0

# 소문자로 변환하여 대소문자 우회 방지
CMD_LOWER=$(printf '%s' "$COMMAND" | tr '[:upper:]' '[:lower:]')

# ── ABSOLUTE FORBIDDEN 패턴 ──────────────────────────────────
# 매칭 시 exit 2로 차단 + stderr에 사유 출력

# Git destructive
if printf '%s' "$CMD_LOWER" | grep -qE 'git\s+push\s+.*\s(-f|--force)\b'; then
  echo "BLOCKED: git push --force — 다른 사람의 커밋을 영구 삭제할 수 있음" >&2
  exit 2
fi

if printf '%s' "$CMD_LOWER" | grep -qE 'git\s+merge\s+(main|master)\b'; then
  echo "BLOCKED: git merge to main/master — 리뷰 없이 프로덕션 코드 변경" >&2
  exit 2
fi

# --no-verify (git hooks 우회)
if printf '%s' "$CMD_LOWER" | grep -qE '(--no-verify|--no-gpg-sign)'; then
  echo "BLOCKED: --no-verify/--no-gpg-sign — git hooks 우회 금지" >&2
  exit 2
fi

# System destructive — rm 플래그에서만 매칭 (파일명 속 -f/-r 무시)
if printf '%s' "$CMD_LOWER" | grep -qE '\brm\s+(-\w+\s+)*-\w*(rf|fr)'; then
  echo "BLOCKED: rm -rf — 복구 불가능한 파일 삭제" >&2
  exit 2
fi

if printf '%s' "$CMD_LOWER" | grep -qE 'chmod\s+777'; then
  echo "BLOCKED: chmod 777 — 보안 경계 파괴" >&2
  exit 2
fi

# Code execution risk
if printf '%s' "$CMD_LOWER" | grep -qE '(curl|wget)\s.*\|\s*(ba)?sh'; then
  echo "BLOCKED: curl/wget | sh — 검증 없이 원격 코드 실행" >&2
  exit 2
fi

# DB destructive
if printf '%s' "$CMD_LOWER" | grep -qE '\b(drop\s+table|drop\s+database|truncate)\b'; then
  echo "BLOCKED: DROP TABLE/DATABASE, TRUNCATE — 복구 불가능한 데이터 손실" >&2
  exit 2
fi

# Git destructive (추가)
if printf '%s' "$CMD_LOWER" | grep -qE 'git\s+reset\s+--hard\s+origin'; then
  echo "BLOCKED: git reset --hard origin — 로컬 변경사항 영구 삭제" >&2
  exit 2
fi

if printf '%s' "$CMD_LOWER" | grep -qE 'git\s+clean\s+(-\w+\s+)*-\w*f'; then
  echo "BLOCKED: git clean -f — 추적되지 않는 파일 영구 삭제" >&2
  exit 2
fi

# Secret file staging
if printf '%s' "$CMD_LOWER" | grep -qE 'git\s+add\s+.*\.(env|pem|key|secret|credentials)'; then
  echo "BLOCKED: Staging secret file is forbidden. Use .gitignore instead." >&2; exit 2
fi

# eval with variable expansion
if printf '%s' "$CMD_LOWER" | grep -qE '\beval\s+"\$'; then
  echo "BLOCKED: eval with variable expansion is forbidden. Use explicit commands." >&2; exit 2
fi

# 통과
exit 0
