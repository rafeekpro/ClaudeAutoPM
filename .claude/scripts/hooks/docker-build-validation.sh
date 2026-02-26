#!/bin/bash

# Docker Build Validation Script
# Validates Docker builds and provides helpful error messages

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Docker Build Validation"
echo "========================="
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}⚠️  No docker-compose.yml found${NC}"
    echo "Skipping validation"
    exit 0
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

echo "🏗️  Building Docker images (no cache)..."
echo "This may take a few minutes..."
echo ""

# Create temp log file
LOG_FILE=$(mktemp)

# Build all services
if docker compose build --no-cache 2>&1 | tee "$LOG_FILE"; then
    echo ""
    echo -e "${GREEN}✅ Docker build successful!${NC}"
    rm "$LOG_FILE"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Docker build failed!${NC}"
    echo ""
    echo "📋 Error Summary:"
    echo "================"

    # Extract common error patterns
    if grep -q "ERROR [0-9]*: failed to solve" "$LOG_FILE"; then
        echo ""
        echo "🔍 Build Errors:"
        grep -A 3 "ERROR" "$LOG_FILE" | head -20
    fi

    if grep -q "no such file or directory" "$LOG_FILE"; then
        echo ""
        echo "🔍 Missing Files:"
        grep "no such file or directory" "$LOG_FILE"
    fi

    if grep -q "permission denied" "$LOG_FILE"; then
        echo ""
        echo "🔍 Permission Issues:"
        grep "permission denied" "$LOG_FILE"
    fi

    echo ""
    echo "💡 Common Fixes:"
    echo "================"

    # Suggest fixes based on errors
    if grep -q "COPY failed" "$LOG_FILE"; then
        echo "• COPY failed: Check that all files in COPY exist"
        echo "  - Verify file paths in Dockerfile"
        echo "  - Check build context in docker-compose.yml"
    fi

    if grep -q "cannot connect" "$LOG_FILE"; then
        echo "• Network error: Check internet connection"
        echo "  - Verify base images are accessible"
    fi

    if grep -q "no space left on device" "$LOG_FILE"; then
        echo "• Disk space: Docker is out of space"
        echo "  - Run: docker system prune -a"
    fi

    if grep -q "base image" "$LOG_FILE"; then
        echo "• Base image issue: Check FROM statement"
        echo "  - Verify image exists on Docker Hub"
        echo "  - Check image tag is correct"
    fi

    if grep -q "module.*not found" "$LOG_FILE"; then
        echo "• Missing dependencies: Update requirements.txt or package.json"
        echo "  - Check all dependencies are listed"
    fi

    echo ""
    echo "📄 Full log saved to: $LOG_FILE"
    echo "   Review with: cat $LOG_FILE"
    echo ""

    rm "$LOG_FILE"
    exit 1
fi
