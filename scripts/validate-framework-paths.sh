#!/bin/bash

# Validate Framework Paths
# Ensures no hardcoded 'autopm/' paths exist in framework files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo "🔍 Validating Framework Paths"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track violations
violations=0

# Function to check for violations
check_violations() {
    local pattern="$1"
    local description="$2"
    local files

    # Search for pattern, excluding:
    # - Comments in JS files (lines starting with * or //)
    # - Comments in shell scripts (lines starting with #)
    # - "Migrated from" comments
    # - The framework-path-rules.md file itself (contains examples)
    files=$(grep -r "$pattern" "$PROJECT_ROOT/autopm/.claude" \
        --include="*.md" \
        --include="*.sh" \
        --include="*.js" \
        --exclude="framework-path-rules.md" \
        2>/dev/null | \
        grep -v "Migrated from" | \
        grep -v "^\s*\*" | \
        grep -v "^\s*//" | \
        grep -v "^\s*#" || true)

    if [ -n "$files" ]; then
        echo -e "${RED}❌ Found violations: $description${NC}"
        echo "$files"
        echo ""
        ((violations++))
        return 1
    fi

    return 0
}

echo "Checking for hardcoded 'autopm/' paths..."
echo ""

# Check for bash autopm references
if ! check_violations "bash autopm" "Hardcoded 'bash autopm' commands"; then
    echo -e "${YELLOW}  Fix: Replace 'bash autopm/.claude/' with 'bash .claude/'${NC}"
    echo ""
fi

# Check for node autopm references
if ! check_violations "node autopm" "Hardcoded 'node autopm' commands"; then
    echo -e "${YELLOW}  Fix: Replace 'node autopm/.claude/' with 'node .claude/'${NC}"
    echo ""
fi

# Check for source autopm references
if ! check_violations "source autopm" "Hardcoded 'source autopm' commands"; then
    echo -e "${YELLOW}  Fix: Replace 'source autopm/.claude/' with 'source .claude/'${NC}"
    echo ""
fi

# Check for ./autopm references
if ! check_violations "\./autopm" "Hardcoded './autopm' paths"; then
    echo -e "${YELLOW}  Fix: Replace './autopm/.claude/' with './.claude/'${NC}"
    echo ""
fi

# Check for autopm/.claude in non-comment contexts
if ! check_violations 'autopm/\.claude' "Hardcoded 'autopm/.claude' paths"; then
    echo -e "${YELLOW}  Fix: Replace 'autopm/.claude/' with '.claude/'${NC}"
    echo ""
fi

# Summary
echo "=============================="
if [ $violations -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! No hardcoded 'autopm/' paths found.${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Validation failed with $violations violation(s).${NC}"
    echo ""
    echo "Please fix the hardcoded paths before committing."
    echo "See autopm/.claude/rules/framework-path-rules.md for guidelines."
    echo ""
    exit 1
fi
