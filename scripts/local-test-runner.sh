#!/bin/bash

# Local Test Runner for ClaudeAutoPM
# Run this before pushing to ensure all tests pass

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 ClaudeAutoPM Local Test Runner${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Track failures
FAILED_TESTS=()
PASSED_TESTS=()

# Function to run test suite
run_test() {
    local test_name="$1"
    local test_command="$2"

    echo -e "${YELLOW}▶ Running:${NC} $test_name"

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $test_name passed"
        PASSED_TESTS+=("$test_name")
    else
        echo -e "${RED}✗${NC} $test_name failed"
        FAILED_TESTS+=("$test_name")
    fi
}

# Quick mode - only critical tests
if [ "$1" == "--quick" ]; then
    echo -e "${YELLOW}Running in quick mode (critical tests only)${NC}\n"

    run_test "Security Tests" "npm run test:security"
    run_test "Regression Tests" "npm run test:regression"

# Full mode - all tests
else
    echo -e "${YELLOW}Running full test suite${NC}\n"

    run_test "Security Tests" "npm run test:security"
    run_test "Unit Tests" "npm run test:unit"
    run_test "Regression Tests" "npm run test:regression"
    run_test "Installation Tests" "npm run test:install"
    run_test "CLI Tests" "npm run test:cli"
fi

# Summary
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${GREEN}Passed:${NC} ${#PASSED_TESTS[@]} tests"
echo -e "${RED}Failed:${NC} ${#FAILED_TESTS[@]} tests"

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
    echo -e "\n${RED}Failed tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $test"
    done

    echo -e "\n${RED}❌ Tests failed! Please fix before pushing.${NC}"
    echo -e "${YELLOW}To run specific test:${NC}"
    echo -e "  npm run test:security"
    echo -e "  npm run test:unit"
    echo -e "  npm run test:regression"
    exit 1
else
    echo -e "\n${GREEN}✅ All tests passed! Safe to push.${NC}"
    exit 0
fi