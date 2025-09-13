#!/bin/bash

# Integration Test for ClaudeAutoPM Installation
# Tests actual installation process with all scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_BASE_DIR="/tmp/autopm-integration-tests-$$"
INSTALL_SCRIPT="$(pwd)/install/install.sh"
SCENARIOS=("1" "2" "3" "4")
SCENARIO_NAMES=("Minimal" "Docker-only" "Full DevOps" "Performance")

# Results tracking
PASSED=0
FAILED=0
RESULTS=()

# Helper functions
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
}

print_test() {
    echo -e "${YELLOW}▶ Testing:${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
    RESULTS+=("FAIL: $1")
}

# Create test directory for scenario
setup_test_dir() {
    local scenario_name="$1"
    local test_dir="$TEST_BASE_DIR/scenario-$scenario_name"

    rm -rf "$test_dir" 2>/dev/null || true
    mkdir -p "$test_dir"
    cd "$test_dir"
    git init -q

    echo "$test_dir"
}

# Run installation with specific choice
run_installation() {
    local choice="$1"
    local test_dir="$2"

    cd "$test_dir"

    # Run install script with automated choice
    echo "$choice" | bash "$INSTALL_SCRIPT" > install.log 2>&1

    return $?
}

# Verify core files exist
verify_core_files() {
    local test_dir="$1"
    local scenario="$2"

    print_test "Core files verification for $scenario"

    local files=(
        "CLAUDE.md"
        ".claude/config.json"
        ".claude/agents"
        ".claude/commands"
        ".claude/rules"
        ".claude/scripts"
        ".claude/checklists/COMMIT_CHECKLIST.md"
        "scripts/safe-commit.sh"
        "PLAYBOOK.md"
    )

    for file in "${files[@]}"; do
        if [ -e "$test_dir/$file" ]; then
            print_pass "$file exists"
        else
            print_fail "$file missing"
        fi
    done
}

# Verify strategy installation
verify_strategy() {
    local test_dir="$1"
    local expected_mode="$2"

    print_test "Strategy verification"

    if [ -f "$test_dir/.claude/strategies/ACTIVE_STRATEGY.md" ]; then
        print_pass "ACTIVE_STRATEGY.md exists"

        # Check if it contains expected content
        if grep -qi "$expected_mode" "$test_dir/.claude/strategies/ACTIVE_STRATEGY.md"; then
            print_pass "Contains $expected_mode strategy"
        else
            print_fail "Wrong strategy content (expected $expected_mode)"
        fi
    else
        print_fail "ACTIVE_STRATEGY.md missing"
    fi

    # Check strategy file directly
    if [ -f "$test_dir/.claude/strategies/ACTIVE_STRATEGY.md" ]; then
        print_pass "ACTIVE_STRATEGY.md exists"
    else
        print_fail "ACTIVE_STRATEGY.md missing"
    fi
}

# Verify config.json content
verify_config() {
    local test_dir="$1"
    local scenario_num="$2"

    print_test "Configuration verification"

    local config_file="$test_dir/.claude/config.json"

    if [ ! -f "$config_file" ]; then
        print_fail "config.json missing"
        return 1
    fi

    # Check execution strategy based on scenario
    case "$scenario_num" in
        1)
            if grep -q '"mode": "sequential"' "$config_file"; then
                print_pass "Sequential mode configured"
            else
                print_fail "Wrong execution mode for Minimal"
            fi
            ;;
        2|3)
            if grep -q '"mode": "adaptive"' "$config_file"; then
                print_pass "Adaptive mode configured"
            else
                print_fail "Wrong execution mode"
            fi
            ;;
        4)
            if grep -q '"mode": "hybrid"' "$config_file"; then
                print_pass "Hybrid mode configured"
            else
                print_fail "Wrong execution mode for Performance"
            fi
            ;;
    esac
}

# Verify CLAUDE.md references
verify_claude_references() {
    local test_dir="$1"

    print_test "CLAUDE.md references verification"

    local claude_file="$test_dir/CLAUDE.md"

    if [ ! -f "$claude_file" ]; then
        print_fail "CLAUDE.md missing"
        return 1
    fi

    # Check for essential references
    local references=(
        ".claude/rules/"
        ".claude/agents/"
        ".claude/commands/"
        ".claude/checklists/"
        "TDD PIPELINE"
        "USE SUB-AGENTS"
    )

    for ref in "${references[@]}"; do
        if grep -q "$ref" "$claude_file"; then
            print_pass "References $ref"
        else
            print_fail "Missing reference to $ref"
        fi
    done
}

# Check directory structure
verify_directory_structure() {
    local test_dir="$1"

    print_test "Directory structure verification"

    # Check if templates are NOT copied
    if [ -d "$test_dir/.claude/templates" ]; then
        print_fail "Templates directory should not be copied"
    else
        print_pass "Templates correctly not copied"
    fi

    # Check required directories exist
    local required_dirs=(
        ".claude/agents"
        ".claude/commands"
        ".claude/rules"
        ".claude/scripts"
        ".claude/checklists"
        ".claude/strategies"
        ".claude-code"
        "scripts"
    )

    for dir in "${required_dirs[@]}"; do
        if [ -d "$test_dir/$dir" ]; then
            print_pass "$dir exists"
        else
            print_fail "$dir missing"
        fi
    done
}

# Main test execution
main() {
    print_header "ClaudeAutoPM Installation Integration Tests"

    # Create base test directory
    mkdir -p "$TEST_BASE_DIR"

    # Test each installation scenario
    for i in "${!SCENARIOS[@]}"; do
        local choice="${SCENARIOS[$i]}"
        local name="${SCENARIO_NAMES[$i]}"
        local expected_strategy=""

        # Determine expected strategy
        case "$choice" in
            1) expected_strategy="sequential" ;;
            2|3) expected_strategy="adaptive" ;;
            4) expected_strategy="hybrid" ;;
        esac

        print_header "Testing Scenario $choice: $name"

        # Setup test directory
        local test_dir=$(setup_test_dir "$name")

        # Run installation
        print_test "Running installation"
        if run_installation "$choice" "$test_dir"; then
            print_pass "Installation completed successfully"
        else
            print_fail "Installation failed"
            continue
        fi

        # Run verifications
        verify_core_files "$test_dir" "$name"
        verify_strategy "$test_dir" "$expected_strategy"
        verify_config "$test_dir" "$choice"
        verify_claude_references "$test_dir"
        verify_directory_structure "$test_dir"
    done

    # Print summary
    print_header "Test Summary"

    echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
    echo -e "Tests Failed: ${RED}$FAILED${NC}"

    if [ ${#RESULTS[@]} -gt 0 ]; then
        echo -e "\n${RED}Failed Tests:${NC}"
        for result in "${RESULTS[@]}"; do
            echo "  - $result"
        done
    fi

    # Cleanup
    rm -rf "$TEST_BASE_DIR"

    # Exit with appropriate code
    if [ $FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✓ All tests passed!${NC}"
        exit 0
    else
        echo -e "\n${RED}✗ Some tests failed${NC}"
        exit 1
    fi
}

# Run tests
main "$@"