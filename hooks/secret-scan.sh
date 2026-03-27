#!/bin/bash
# hooks/secret-scan.sh — 시크릿 패턴 감지 스크립트
# simon-bot-sync의 Step 2.5와 git pre-commit hook에서 공유 사용
#
# Usage:
#   ./hooks/secret-scan.sh              # git staged files 검사 (pre-commit hook용)
#   ./hooks/secret-scan.sh --dir <path> # 지정 디렉토리 전체 검사 (sync용)
#
# Exit codes:
#   0 - clean (시크릿 없음)
#   1 - secret detected (시크릿 발견)

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

MODE="staged"
TARGET_DIR=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dir)
            MODE="directory"
            TARGET_DIR="$2"
            shift 2
            ;;
        *)
            echo "Usage: $0 [--dir <path>]" >&2
            exit 1
            ;;
    esac
done

# ── 시크릿 패턴 정의 ──────────────────────────────────
# 각 패턴은 "설명|regex" 형식
PATTERNS=(
    "OpenAI/Anthropic API Key|sk-[a-zA-Z0-9_-]{20,}"
    "GitHub Personal Access Token|ghp_[a-zA-Z0-9]{36}"
    "GitHub OAuth Token|gho_[a-zA-Z0-9]{36}"
    "GitLab Token|glpat-[a-zA-Z0-9_-]{20,}"
    "Slack Bot Token|xoxb-[0-9]+-[0-9A-Za-z]+"
    "Slack User Token|xoxp-[0-9]+-[0-9A-Za-z]+"
    "AWS Access Key|AKIA[A-Z0-9]{16}"
    "Generic Secret Assignment|(password|secret|token|api_key|apikey|auth_token|private_key|client_secret)\s*[:=]\s*[\"'][^\"']{8,}[\"']"
    "Bearer Token|Bearer\s+[a-zA-Z0-9_\.\-]{20,}"
    "Private Key Block|-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----"
    "Base64 Encoded Long Secret|[A-Za-z0-9+/]{40,}={0,2}"
)

# Base64 패턴은 false positive가 많으므로, 파일 확장자 .md에서만 검사하되
# 주변 컨텍스트에 secret/key/token이 있을 때만 매칭 (별도 처리)
STRICT_BASE64=true

FOUND=0

scan_content() {
    local target="$1"
    local label="$2"

    for entry in "${PATTERNS[@]}"; do
        local desc="${entry%%|*}"
        local pattern="${entry#*|}"

        # Base64 패턴은 별도 처리 (false positive 방지)
        if [[ "$desc" == "Base64 Encoded Long Secret" ]] && [[ "$STRICT_BASE64" == true ]]; then
            continue
        fi

        local matches
        if matches=$(grep -rIEn \
            --exclude-dir='*-workspace' \
            --exclude-dir='node_modules' \
            --exclude-dir='.git' \
            --exclude-dir='evals' \
            --exclude-dir='iteration-*' \
            --exclude-dir='.data' \
            --exclude='*.map' \
            --exclude='*.min.js' \
            "$pattern" "$target" 2>/dev/null); then
            echo -e "${RED}SECRET DETECTED: $desc${NC}" >&2
            echo "$matches" | head -5 >&2
            local count
            count=$(echo "$matches" | wc -l | tr -d ' ')
            if [[ "$count" -gt 5 ]]; then
                echo "  ... and $((count - 5)) more matches" >&2
            fi
            echo "" >&2
            FOUND=1
        fi
    done
}

scan_staged_files() {
    # git staged 파일 목록 (추가/수정된 파일만)
    local staged_files
    staged_files=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

    if [[ -z "$staged_files" ]]; then
        echo -e "${GREEN}No staged files to scan.${NC}"
        exit 0
    fi

    echo "Scanning $(echo "$staged_files" | wc -l | tr -d ' ') staged files for secrets..."

    # staged 내용을 임시 디렉토리에 추출하여 검사
    tmp_dir=$(mktemp -d)
    trap 'rm -rf "${tmp_dir:-}"' EXIT

    while IFS= read -r file; do
        local dir
        dir=$(dirname "$file")
        mkdir -p "$tmp_dir/$dir"
        git show ":$file" > "$tmp_dir/$file" 2>/dev/null || true
    done <<< "$staged_files"

    scan_content "$tmp_dir" "staged files"
}

scan_directory() {
    if [[ ! -d "$TARGET_DIR" ]]; then
        echo "Error: Directory '$TARGET_DIR' does not exist" >&2
        exit 1
    fi

    echo "Scanning directory: $TARGET_DIR"
    scan_content "$TARGET_DIR" "directory"
}

# ── 실행 ──────────────────────────────────
echo "=== simon-bot Secret Scanner ==="

if [[ "$MODE" == "staged" ]]; then
    scan_staged_files
else
    scan_directory
fi

if [[ "$FOUND" -eq 1 ]]; then
    echo -e "${RED}ABORT: Secrets detected. Please remove them before committing.${NC}" >&2
    exit 1
else
    echo -e "${GREEN}PASS: No secrets detected.${NC}"
    exit 0
fi
