#!/bin/bash
# simon-bot: Check if test environment is set up
# Usage: bash check-test-env.sh [project-dir]
# Exit code 0 = ready (proceed with tests), 1 = not ready (skip tests)

set -uo pipefail

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

echo "=== simon-bot: Test Environment Check ==="

if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        echo "[Node.js] Test environment ready (node_modules exists)."
        exit 0
    else
        echo "[Node.js] Test environment NOT ready (node_modules missing). Skipping tests."
        exit 1
    fi
elif [ -f "Cargo.toml" ]; then
    if command -v cargo &>/dev/null; then
        echo "[Rust] Test environment ready (cargo available)."
        exit 0
    else
        echo "[Rust] Test environment NOT ready (cargo not found). Skipping tests."
        exit 1
    fi
elif [ -f "go.mod" ]; then
    if command -v go &>/dev/null; then
        echo "[Go] Test environment ready (go available)."
        exit 0
    else
        echo "[Go] Test environment NOT ready (go not found). Skipping tests."
        exit 1
    fi
elif [ -f "pom.xml" ]; then
    if command -v mvn &>/dev/null && [ -d "$HOME/.m2/repository" ]; then
        echo "[Java/Maven] Test environment ready (mvn + .m2 cache exists)."
        exit 0
    else
        echo "[Java/Maven] Test environment NOT ready. Skipping tests."
        exit 1
    fi
elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    if command -v gradle &>/dev/null || [ -f "./gradlew" ]; then
        echo "[Java/Gradle] Test environment ready (gradle available)."
        exit 0
    else
        echo "[Java/Gradle] Test environment NOT ready (gradle not found). Skipping tests."
        exit 1
    fi
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    if command -v pytest &>/dev/null || python -m pytest --version &>/dev/null 2>&1; then
        echo "[Python] Test environment ready (pytest available)."
        exit 0
    else
        echo "[Python] Test environment NOT ready (pytest not found). Skipping tests."
        exit 1
    fi
else
    echo "[WARN] Unknown project type. Test environment status unknown. Skipping tests."
    exit 1
fi
