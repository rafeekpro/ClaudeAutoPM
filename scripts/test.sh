#!/bin/bash

# ClaudeAutoPM Test Runner Script
# Runs all test suites sequentially

set -e  # Exit on error

echo "🧪 Running ClaudeAutoPM Test Suite"
echo "=================================="

# Track overall results
TOTAL_PASS=0
TOTAL_FAIL=0
FAILED_SUITES=""

# Function to run a test suite
run_test_suite() {
    local suite_name=$1
    local test_command=$2

    echo ""
    echo "📋 Running $suite_name..."
    echo "-----------------------------------"

    if $test_command; then
        echo "✅ $suite_name: PASSED"
        ((TOTAL_PASS++))
    else
        echo "❌ $suite_name: FAILED"
        ((TOTAL_FAIL++))
        FAILED_SUITES="$FAILED_SUITES\n  - $suite_name"
    fi
}

# Run unit tests
if [ -d "test/unit" ] && ls test/unit/*.test.js 2>/dev/null | grep -q .; then
    run_test_suite "Unit Tests" "node --test test/unit/*.test.js"
else
    echo "⚠️  No unit tests found"
fi

# Run Azure provider tests
if [ -d "test/providers/azure" ] && ls test/providers/azure/*.test.js 2>/dev/null | grep -q .; then
    run_test_suite "Azure Provider Tests" "node --test test/providers/azure/*.test.js"
else
    echo "⚠️  No Azure provider tests found"
fi

# Run security tests
if [ -d "test/security" ] && ls test/security/*.test.js 2>/dev/null | grep -q .; then
    run_test_suite "Security Tests" "node --test test/security/*.test.js"
else
    echo "⚠️  No security tests found"
fi

# Run regression tests
if [ -d "test/regression" ] && ls test/regression/*.test.js 2>/dev/null | grep -q .; then
    run_test_suite "Regression Tests" "node --test test/regression/*.test.js"
else
    echo "⚠️  No regression tests found"
fi

# Run installation tests (if not in CI)
if [ "$CI" != "true" ]; then
    if [ -f "test/installation/integration.test.sh" ]; then
        run_test_suite "Installation Tests" "bash test/installation/integration.test.sh"
    else
        echo "⚠️  No installation tests found"
    fi
fi

# Run E2E tests
if [ -d "test/e2e" ] && ls test/e2e/*.test.js 2>/dev/null | grep -q .; then
    run_test_suite "E2E Tests" "node --test test/e2e/*.test.js"
else
    echo "⚠️  No E2E tests found"
fi

# Summary
echo ""
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo "✅ Passed: $TOTAL_PASS suites"
echo "❌ Failed: $TOTAL_FAIL suites"

if [ $TOTAL_FAIL -gt 0 ]; then
    echo ""
    echo "Failed suites:$FAILED_SUITES"
    exit 1
else
    echo ""
    echo "🎉 All tests passed!"
    exit 0
fi