#!/usr/bin/env bash
# Docker Compose validation and health check
# Usage: ./docker-compose-validate.sh [compose-file]

set -euo pipefail

COMPOSE_FILE="${1:-docker-compose.yml}"

echo "🐳 Validating Docker Compose configuration: ${COMPOSE_FILE}..."

# Check docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose not found. Please install it first."
    exit 1
fi

# Use 'docker compose' or 'docker-compose' based on availability
if docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Validate compose file syntax
echo "📋 Validating Compose file syntax..."
if $COMPOSE_CMD -f "${COMPOSE_FILE}" config > /dev/null; then
    echo "  ✓ Compose file syntax is valid"
else
    echo "  ❌ Compose file has syntax errors"
    exit 1
fi

# Show parsed configuration
echo ""
echo "📊 Parsed configuration:"
$COMPOSE_CMD -f "${COMPOSE_FILE}" config --services

# Check for common issues
echo ""
echo "🔍 Checking for common issues..."

# Check for missing environment variables
if grep -q '\${[A-Z_]*}' "${COMPOSE_FILE}"; then
    echo "  ⚠️  Warning: Compose file contains environment variable references"
    echo "     Make sure all required variables are set in .env file"
fi

# Check for volume definitions
VOLUMES=$($COMPOSE_CMD -f "${COMPOSE_FILE}" config --volumes 2>/dev/null | wc -l)
if [ "$VOLUMES" -gt 0 ]; then
    echo "  ✓ Volumes defined: ${VOLUMES}"
    $COMPOSE_CMD -f "${COMPOSE_FILE}" config --volumes
fi

# Check for network definitions
NETWORKS=$($COMPOSE_CMD -f "${COMPOSE_FILE}" config --networks 2>/dev/null | wc -l)
if [ "$NETWORKS" -gt 0 ]; then
    echo "  ✓ Networks defined: ${NETWORKS}"
fi

# If compose stack is running, check health
if $COMPOSE_CMD -f "${COMPOSE_FILE}" ps | grep -q "Up"; then
    echo ""
    echo "📊 Running services status:"
    $COMPOSE_CMD -f "${COMPOSE_FILE}" ps

    # Check logs for errors (last 50 lines)
    echo ""
    echo "📋 Recent logs (last 50 lines):"
    $COMPOSE_CMD -f "${COMPOSE_FILE}" logs --tail=50
fi

echo ""
echo "✅ Docker Compose validation complete"
