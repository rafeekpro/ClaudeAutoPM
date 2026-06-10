#!/bin/bash

# Install Infrastructure Protection Hooks
# This script installs pre-commit hooks that validate Docker infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 Installing Infrastructure Protection Hooks..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Create hooks directory in .git
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
mkdir -p "$HOOKS_DIR"

echo "📁 Hooks directory: $HOOKS_DIR"

# Install docker-build-validation hook
echo "📦 Installing docker-build-validation hook..."
cat > "$HOOKS_DIR/docker-build-validation" << 'EOF'
#!/bin/bash

# Docker Build Validation Hook
# Validates Docker builds before allowing commit

echo "🔍 Running Docker build validation..."

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "⚠️  No docker-compose.yml found, skipping validation"
    exit 0
fi

# Build all services
echo "🏗️  Building Docker images (no cache)..."
if ! docker compose build --no-cache 2>&1 | tee /tmp/docker-build.log; then
    echo ""
    echo "❌ Docker build failed!"
    echo ""
    echo "📋 Build errors:"
    cat /tmp/docker-build.log | grep -A 5 "ERROR"
    echo ""
    echo "💡 Common fixes:"
    echo "   - Check Dockerfile syntax"
    echo "   - Verify all COPY files exist"
    echo "   - Check base image is valid"
    echo "   - Verify build context in docker-compose.yml"
    echo ""
    echo "🚫 Commit blocked - fix Docker build errors first"
    exit 1
fi

echo "✅ Docker build validation passed"
EOF

chmod +x "$HOOKS_DIR/docker-build-validation"

# Install check-ports hook
echo "🔌 Installing check-ports hook..."
cat > "$HOOKS_DIR/check-ports" << 'EOF'
#!/bin/bash

# Port Conflict Detection Hook
# Checks for port conflicts in docker-compose.yml

echo "🔍 Checking for port conflicts..."

if [ ! -f "docker-compose.yml" ]; then
    echo "⚠️  No docker-compose.yml found, skipping port check"
    exit 0
fi

# Extract all host ports from docker-compose.yml
HOST_PORTS=$(grep -E "^\s+-[0-9]+:[0-9]+" docker-compose.yml | sed 's/.*-\([0-9]*\):.*/\1/')

# Check for system ports (below 50000)
for port in $HOST_PORTS; do
    if [ "$port" -lt 50000 ]; then
        echo ""
        echo "❌ Port conflict detected!"
        echo "   Port $port is in system port range (< 50000)"
        echo "   This may conflict with other applications"
        echo ""
        echo "💡 Fix: Use 5xxxx range (e.g., 50001, 50002, etc.)"
        echo "   Change '$port:' to '5$port:' or similar"
        echo ""
        echo "🚫 Commit blocked - fix port conflicts first"
        exit 1
    fi
done

# Check for duplicate ports
DUPLICATE_PORTS=$(echo "$HOST_PORTS" | sort | uniq -d)
if [ -n "$DUPLICATE_PORTS" ]; then
    echo ""
    echo "❌ Duplicate port detected!"
    echo "   Port(s) used multiple times: $DUPLICATE_PORTS"
    echo ""
    echo "💡 Fix: Use unique ports in 5xxxx range for each service"
    echo ""
    echo "🚫 Commit blocked - fix duplicate ports first"
    exit 1
fi

echo "✅ No port conflicts detected"
EOF

chmod +x "$HOOKS_DIR/check-ports"

# Create pre-commit hook that runs all infrastructure checks
echo "🔗 Creating pre-commit hook..."
cat > "$HOOKS_DIR/pre-commit" << EOF
#!/bin/bash

# Pre-commit hook for infrastructure validation
# Runs all infrastructure checks before allowing commit

echo "🛡️  Running infrastructure protection checks..."

# Run port conflict check
"$SCRIPT_DIR/check-ports" || exit 1

# Run Docker build validation
"$SCRIPT_DIR/docker-build-validation" || exit 1

echo "✅ All infrastructure checks passed"
EOF

chmod +x "$HOOKS_DIR/pre-commit"

echo ""
echo "✅ Infrastructure protection hooks installed!"
echo ""
echo "📋 Installed hooks:"
echo "   • pre-commit - Runs all infrastructure checks"
echo "   • check-ports - Validates no port conflicts"
echo "   • docker-build-validation - Ensures Docker builds succeed"
echo ""
echo "🚀 Your project is now protected!"
echo ""
echo "What happens on commit:"
echo "   1. ✅ Port conflicts checked"
echo "   2. ✅ Docker builds validated"
echo "   3. ✅ Commit blocked if any check fails"
echo ""
echo "Test it:"
echo "   git commit -m 'test commit'"
echo ""
echo "To uninstall:"
echo "   rm .git/hooks/pre-commit"
echo "   rm .git/hooks/check-ports"
echo "   rm .git/hooks/docker-build-validation"
