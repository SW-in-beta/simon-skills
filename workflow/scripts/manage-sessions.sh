#!/usr/bin/env bash
# simon-bot Session Manager
# Usage: bash manage-sessions.sh <command> [args]
#
# Commands:
#   list                  - 현재 활성 워크트리(세션) 목록
#   info <branch-name>    - 특정 세션 상세 정보
#   delete <branch-name>  - 세션 삭제 (워크트리 + 브랜치)

set -euo pipefail

COMMAND="${1:-help}"
BRANCH="${2:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

case "$COMMAND" in
  list)
    echo -e "${CYAN}=== simon-bot Active Sessions ===${NC}"
    echo ""

    FOUND=0
    while IFS= read -r line; do
      # git worktree list output: /path/to/worktree  SHA [branch]
      WT_PATH=$(echo "$line" | awk '{print $1}')
      WT_SHA=$(echo "$line" | awk '{print $2}')
      WT_BRANCH=$(echo "$line" | grep -oP '\[.*?\]' | tr -d '[]')

      # Skip main worktree (first entry)
      if [ "$FOUND" -eq 0 ] && [ -z "$BRANCH" ]; then
        FOUND=1
        continue
      fi

      # Check if it has .omc/memory (simon-bot session indicator)
      if [ -d "$WT_PATH/.omc/memory" ]; then
        FOUND=$((FOUND + 1))

        # Get last commit info
        LAST_COMMIT=$(git -C "$WT_PATH" log -1 --format="%h %s (%cr)" 2>/dev/null || echo "N/A")

        # Check for branch-name.md
        BRANCH_FILE=""
        if [ -f "$WT_PATH/.omc/memory/branch-name.md" ]; then
          BRANCH_FILE=$(cat "$WT_PATH/.omc/memory/branch-name.md" | head -1)
        fi

        # Check for plan-summary.md
        HAS_PLAN="No"
        if [ -f "$WT_PATH/.omc/memory/plan-summary.md" ]; then
          HAS_PLAN="Yes"
        fi

        # Check for integration-result.md
        HAS_INTEGRATION="No"
        if [ -f "$WT_PATH/.omc/memory/integration-result.md" ]; then
          HAS_INTEGRATION="Yes"
        fi

        echo -e "${GREEN}Branch:${NC} $WT_BRANCH"
        echo -e "  Path:        $WT_PATH"
        echo -e "  Last commit: $LAST_COMMIT"
        echo -e "  Plan:        $HAS_PLAN"
        echo -e "  Integrated:  $HAS_INTEGRATION"
        echo ""
      fi
    done < <(git worktree list 2>/dev/null)

    if [ "$FOUND" -le 1 ]; then
      echo -e "${YELLOW}활성 세션이 없습니다.${NC}"
    fi
    ;;

  info)
    if [ -z "$BRANCH" ]; then
      echo -e "${RED}Error: 브랜치명을 입력하세요.${NC}"
      echo "Usage: bash manage-sessions.sh info <branch-name>"
      exit 1
    fi

    # Find worktree by branch name
    WT_PATH=""
    while IFS= read -r line; do
      if echo "$line" | grep -q "\[$BRANCH\]"; then
        WT_PATH=$(echo "$line" | awk '{print $1}')
        break
      fi
    done < <(git worktree list 2>/dev/null)

    if [ -z "$WT_PATH" ]; then
      echo -e "${RED}Error: '$BRANCH' 브랜치의 워크트리를 찾을 수 없습니다.${NC}"
      echo ""
      echo "활성 워크트리 목록:"
      git worktree list 2>/dev/null
      exit 1
    fi

    echo -e "${CYAN}=== Session Info: $BRANCH ===${NC}"
    echo ""
    echo -e "${GREEN}Path:${NC} $WT_PATH"
    echo ""

    # Last 5 commits
    echo -e "${GREEN}Recent commits:${NC}"
    git -C "$WT_PATH" log -5 --format="  %h %s (%cr)" 2>/dev/null || echo "  N/A"
    echo ""

    # Changed files count
    DIFF_COUNT=$(git -C "$WT_PATH" diff --name-only HEAD~1 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}Changed files (last commit):${NC} $DIFF_COUNT"
    echo ""

    # .omc/memory files
    echo -e "${GREEN}Memory files:${NC}"
    if [ -d "$WT_PATH/.omc/memory" ]; then
      find "$WT_PATH/.omc/memory" -name "*.md" -type f | while read -r f; do
        REL_PATH="${f#$WT_PATH/}"
        SIZE=$(wc -l < "$f" | tr -d ' ')
        echo "  $REL_PATH ($SIZE lines)"
      done
    else
      echo "  (없음)"
    fi
    echo ""

    # Status
    echo -e "${GREEN}Git status:${NC}"
    git -C "$WT_PATH" status --short 2>/dev/null || echo "  clean"
    ;;

  delete)
    if [ -z "$BRANCH" ]; then
      echo -e "${RED}Error: 브랜치명을 입력하세요.${NC}"
      echo "Usage: bash manage-sessions.sh delete <branch-name>"
      exit 1
    fi

    # Find worktree by branch name
    WT_PATH=""
    while IFS= read -r line; do
      if echo "$line" | grep -q "\[$BRANCH\]"; then
        WT_PATH=$(echo "$line" | awk '{print $1}')
        break
      fi
    done < <(git worktree list 2>/dev/null)

    if [ -z "$WT_PATH" ]; then
      echo -e "${RED}Error: '$BRANCH' 브랜치의 워크트리를 찾을 수 없습니다.${NC}"
      exit 1
    fi

    echo -e "${YELLOW}삭제 대상:${NC}"
    echo "  Worktree: $WT_PATH"
    echo "  Branch:   $BRANCH"
    echo ""

    # Remove worktree
    echo -e "Worktree 제거 중..."
    git worktree remove "$WT_PATH" --force 2>/dev/null
    echo -e "${GREEN}Worktree 제거 완료${NC}"

    # Delete branch
    echo -e "Branch 삭제 중..."
    git branch -D "$BRANCH" 2>/dev/null || echo -e "${YELLOW}로컬 브랜치가 이미 없거나 삭제 실패${NC}"
    echo -e "${GREEN}Branch 삭제 완료${NC}"

    echo ""
    echo -e "${GREEN}세션 '$BRANCH' 삭제 완료.${NC}"
    ;;

  help|*)
    echo "simon-bot Session Manager"
    echo ""
    echo "Usage: bash manage-sessions.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  list                  현재 활성 워크트리(세션) 목록"
    echo "  info <branch-name>   특정 세션 상세 정보"
    echo "  delete <branch-name> 세션 삭제 (워크트리 + 브랜치)"
    echo ""
    echo "Examples:"
    echo "  bash manage-sessions.sh list"
    echo "  bash manage-sessions.sh info feat/add-auth"
    echo "  bash manage-sessions.sh delete feat/add-auth"
    ;;
esac
