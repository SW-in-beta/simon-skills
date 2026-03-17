#!/bin/bash
# simon-bot: Check and set up test environment
# Usage: bash setup-test-env.sh [project-dir]
#
# Exit codes:
#   0 = ready (proceed with tests)
#   1 = setup failed - code/toolchain issue (skip tests, build/typecheck may work)
#   2 = environment/infrastructure failure (Docker, DB, ports - needs recovery)

set -uo pipefail

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

echo "=== simon-bot: Test Environment Setup ==="

# ─────────────────────────────────────────────
# Phase 1: Infrastructure checks (Docker, ports)
# ─────────────────────────────────────────────

check_docker_environment() {
    local has_compose=false
    local compose_cmd=""

    # Detect docker-compose files
    if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ] || [ -f "compose.yml" ] || [ -f "compose.yaml" ]; then
        has_compose=true
    fi

    # Detect Dockerfile (test-specific or general)
    local has_dockerfile=false
    if [ -f "Dockerfile" ] || [ -f "Dockerfile.test" ] || [ -f "docker/Dockerfile.test" ]; then
        has_dockerfile=true
    fi

    # No Docker artifacts → skip Docker checks entirely
    if [ "$has_compose" = false ] && [ "$has_dockerfile" = false ]; then
        return 0
    fi

    echo "[Docker] Docker artifacts detected. Checking Docker daemon..."

    # Check if Docker CLI exists
    if ! command -v docker &>/dev/null; then
        echo "[Docker] ERROR: docker command not found."
        echo "[Docker] DIAGNOSIS: Docker CLI is not installed or not in PATH."
        echo "[Docker] RECOVERY_HINT: Install Docker Desktop or add docker to PATH."
        return 2
    fi

    # Check if Docker daemon is running
    if ! docker info &>/dev/null 2>&1; then
        echo "[Docker] ERROR: Docker daemon is not running."
        echo "[Docker] DIAGNOSIS: Docker Desktop may not be started, or dockerd is not running."
        echo "[Docker] RECOVERY_HINT: Start Docker Desktop or run 'sudo systemctl start docker'."

        # Attempt auto-start (macOS)
        if [ "$(uname)" = "Darwin" ] && [ -d "/Applications/Docker.app" ]; then
            echo "[Docker] Attempting to start Docker Desktop..."
            open -a Docker
            # Wait for daemon (max 30 seconds)
            for i in $(seq 1 15); do
                sleep 2
                if docker info &>/dev/null 2>&1; then
                    echo "[Docker] Docker daemon started successfully."
                    break
                fi
                echo "[Docker] Waiting for Docker daemon... ($((i*2))s)"
            done
            if ! docker info &>/dev/null 2>&1; then
                echo "[Docker] FAILED: Docker daemon did not start within 30 seconds."
                return 2
            fi
        # Attempt auto-start (Linux systemd)
        elif command -v systemctl &>/dev/null; then
            echo "[Docker] Attempting to start Docker via systemctl..."
            sudo systemctl start docker 2>/dev/null || true
            sleep 3
            if ! docker info &>/dev/null 2>&1; then
                echo "[Docker] FAILED: Could not start Docker daemon."
                return 2
            fi
            echo "[Docker] Docker daemon started successfully."
        else
            return 2
        fi
    fi

    echo "[Docker] Docker daemon is running."

    # If docker-compose project exists, check services
    if [ "$has_compose" = true ]; then
        # Detect compose command (v2 vs v1)
        if docker compose version &>/dev/null 2>&1; then
            compose_cmd="docker compose"
        elif command -v docker-compose &>/dev/null; then
            compose_cmd="docker-compose"
        else
            echo "[Docker] ERROR: Neither 'docker compose' nor 'docker-compose' found."
            echo "[Docker] RECOVERY_HINT: Install docker-compose or upgrade Docker to v2."
            return 2
        fi

        echo "[Docker] Checking compose services..."

        # Check if services are already running
        local running_services
        running_services=$($compose_cmd ps --status running -q 2>/dev/null | wc -l | tr -d ' ')

        if [ "$running_services" -gt 0 ]; then
            echo "[Docker] $running_services service(s) already running."

            # Health check on running services
            local unhealthy
            unhealthy=$($compose_cmd ps 2>/dev/null | grep -i "unhealthy\|Exit\|Restarting" | wc -l | tr -d ' ')
            if [ "$unhealthy" -gt 0 ]; then
                echo "[Docker] WARNING: $unhealthy service(s) unhealthy/exited. Restarting..."
                $compose_cmd restart 2>&1
                sleep 5
            fi
        else
            echo "[Docker] No services running. Starting compose services..."
            if ! $compose_cmd up -d 2>&1; then
                echo "[Docker] ERROR: 'docker compose up -d' failed."
                echo "[Docker] DIAGNOSIS: Check docker-compose.yml for syntax errors or missing images."

                # Check for port conflicts
                check_port_conflicts
                return 2
            fi

            # Wait for services to be healthy (max 60 seconds)
            echo "[Docker] Waiting for services to be healthy..."
            for i in $(seq 1 12); do
                sleep 5
                local still_starting
                still_starting=$($compose_cmd ps 2>/dev/null | grep -i "starting\|created" | wc -l | tr -d ' ')
                if [ "$still_starting" -eq 0 ]; then
                    break
                fi
                echo "[Docker] Services still starting... ($((i*5))s)"
            done
        fi

        # Final health verification
        local failed_services
        failed_services=$($compose_cmd ps 2>/dev/null | grep -i "Exit\|unhealthy" || true)
        if [ -n "$failed_services" ]; then
            echo "[Docker] ERROR: Some services failed to start:"
            echo "$failed_services"
            echo "[Docker] DIAGNOSIS: Check logs with '$compose_cmd logs'"
            echo "[Docker] RECOVERY_HINT: Try '$compose_cmd down -v && $compose_cmd up -d' or check port conflicts."
            return 2
        fi

        echo "[Docker] All compose services are running."
    fi

    return 0
}

check_port_conflicts() {
    echo "[Ports] Checking for port conflicts..."

    # Common test infrastructure ports
    local ports=(5432 3306 6379 27017 9200 5672 8080 8443 2181 9092)

    for port in "${ports[@]}"; do
        local pid
        pid=$(lsof -ti ":$port" 2>/dev/null || true)
        if [ -n "$pid" ]; then
            local proc_name
            proc_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
            echo "[Ports] WARNING: Port $port is in use by $proc_name (PID: $pid)"
        fi
    done
}

# Run Docker/infrastructure checks first
docker_result=0
check_docker_environment || docker_result=$?

if [ "$docker_result" -eq 2 ]; then
    echo "[ENV] Infrastructure check failed (exit code 2). Environment recovery needed."
    exit 2
fi

# ─────────────────────────────────────────────
# Phase 2: Language toolchain checks (existing)
# ─────────────────────────────────────────────

if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        echo "[Node.js] Test environment ready (node_modules exists)."
        exit 0
    else
        echo "[Node.js] node_modules missing. Running npm install..."
        if npm install 2>&1; then
            echo "[Node.js] Setup complete."
            exit 0
        else
            echo "[Node.js] npm install failed. Skipping tests."
            exit 1
        fi
    fi
elif [ -f "Cargo.toml" ]; then
    if command -v cargo &>/dev/null; then
        echo "[Rust] Test environment ready (cargo available)."
        exit 0
    else
        echo "[Rust] cargo not found. Cannot set up environment. Skipping tests."
        exit 1
    fi
elif [ -f "go.mod" ]; then
    if command -v go &>/dev/null; then
        echo "[Go] Test environment ready (go available)."
        if [ ! -f "go.sum" ]; then
            echo "[Go] go.sum missing. Running go mod download..."
            go mod download 2>&1
        fi
        exit 0
    else
        echo "[Go] go not found. Cannot set up environment. Skipping tests."
        exit 1
    fi
elif [ -f "pom.xml" ]; then
    if command -v mvn &>/dev/null; then
        if [ -d "$HOME/.m2/repository" ]; then
            echo "[Java/Maven] Test environment ready (mvn + .m2 cache exists)."
            exit 0
        else
            echo "[Java/Maven] Dependencies missing. Running mvn dependency:resolve..."
            if mvn dependency:resolve -q 2>&1; then
                echo "[Java/Maven] Setup complete."
                exit 0
            else
                echo "[Java/Maven] Dependency resolution failed. Skipping tests."
                exit 1
            fi
        fi
    else
        echo "[Java/Maven] mvn not found. Cannot set up environment. Skipping tests."
        exit 1
    fi
elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    if command -v gradle &>/dev/null || [ -f "./gradlew" ]; then
        echo "[Java/Gradle] Test environment ready (gradle available)."
        exit 0
    else
        echo "[Java/Gradle] gradle not found. Cannot set up environment. Skipping tests."
        exit 1
    fi
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    if command -v pytest &>/dev/null || python -m pytest --version &>/dev/null 2>&1; then
        echo "[Python] Test environment ready (pytest available)."
        exit 0
    else
        echo "[Python] pytest not found. Installing dependencies..."
        if [ -f "requirements.txt" ]; then
            pip install -r requirements.txt 2>&1 && echo "[Python] Setup complete." && exit 0
        elif [ -f "pyproject.toml" ]; then
            pip install -e ".[test]" 2>&1 || pip install -e ".[dev]" 2>&1 || pip install pytest 2>&1
            if command -v pytest &>/dev/null || python -m pytest --version &>/dev/null 2>&1; then
                echo "[Python] Setup complete."
                exit 0
            fi
        fi
        echo "[Python] Setup failed. Skipping tests."
        exit 1
    fi
else
    echo "[WARN] Unknown project type. Cannot set up test environment. Skipping tests."
    exit 1
fi
