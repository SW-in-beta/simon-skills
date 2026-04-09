#!/bin/bash
# simon-bot: Run project tests
# Usage: bash run-tests.sh [project-dir]
#
# Exit codes:
#   0 = tests passed (or skipped due to toolchain)
#   1 = tests failed (code issue)
#   2 = environment/infrastructure failure (Docker, DB, ports)

set -uo pipefail

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

echo "=== simon-bot: Test Execution ==="

# Pre-check: Test environment readiness
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
env_result=0
bash "$SCRIPT_DIR/setup-test-env.sh" "$PROJECT_DIR" || env_result=$?

if [ "$env_result" -eq 2 ]; then
    echo "[ENV_INFRA] Infrastructure failure detected (exit code 2)."
    echo "[ENV_INFRA] Tests cannot run. Build and typecheck may still work."
    echo "=== Test Execution: ENV_INFRA_FAILURE ==="
    exit 2
elif [ "$env_result" -eq 1 ]; then
    echo "[SKIP] Test environment not ready (toolchain issue). Skipping all tests."
    echo "=== Test Execution: SKIPPED ==="
    exit 0
fi

# Detect project type and run tests
test_exit=0
if [ -f "package.json" ]; then
    echo "[Node.js] Running tests..."
    if grep -q '"test"' package.json; then
        npm test 2>&1 || test_exit=$?
    else
        echo "[SKIP] No test script found in package.json"
    fi
elif [ -f "Cargo.toml" ]; then
    echo "[Rust] Running cargo test..."
    cargo test 2>&1 || test_exit=$?
elif [ -f "go.mod" ]; then
    echo "[Go] Running go test..."
    go test ./... 2>&1 || test_exit=$?
elif [ -f "pom.xml" ]; then
    echo "[Java/Maven] Running mvn test..."
    mvn test -q 2>&1 || test_exit=$?
elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    echo "[Java/Gradle] Running gradle test..."
    gradle test 2>&1 || test_exit=$?
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    echo "[Python] Running pytest..."
    if command -v pytest &> /dev/null; then
        pytest 2>&1 || test_exit=$?
    else
        python -m pytest 2>&1 || test_exit=$?
    fi
else
    echo "[WARN] Unknown project type. Skipping tests."
    exit 0
fi

# Classify test failure: infra vs code
if [ "$test_exit" -ne 0 ]; then
    # Check if failure looks like an infrastructure issue
    # (connection refused, timeout, Docker errors in output)
    echo "[FAIL] Tests exited with code $test_exit"
    echo "=== Test Execution: FAILED ==="
    exit 1
fi

echo "=== Test Execution: COMPLETE ==="
