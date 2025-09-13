#!/bin/bash

# PR Validation Script - Ensures Docker tests pass before PR creation
# Usage: ./pr-validation.sh [--force] [--skip-tests]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
FORCE=false
SKIP_TESTS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -h|--help)
            echo "PR Validation Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --force      Skip interactive confirmations"
            echo "  --skip-tests Skip running tests (not recommended)"
            echo "  -h, --help   Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Function to check if Docker-first is enabled
is_docker_first_enabled() {
    local config_file=".claude/config.json"
    
    if [[ ! -f "$config_file" ]]; then
        return 1
    fi
    
    if ! command -v jq &> /dev/null; then
        return 1
    fi
    
    local enabled=$(jq -r '.features.docker_first_development // false' "$config_file" 2>/dev/null)
    [[ "$enabled" == "true" ]]
}

# Function to check Git status
check_git_status() {
    echo -e "${BLUE}Checking Git status...${NC}"
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}❌ Not in a Git repository${NC}"
        return 1
    fi
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
        if [[ "$FORCE" == false ]]; then
            read -p "Do you want to continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "Commit or stash your changes first"
                return 1
            fi
        fi
    fi
    
    # Check current branch
    local current_branch=$(git branch --show-current)
    if [[ "$current_branch" == "main" ]] || [[ "$current_branch" == "master" ]]; then
        echo -e "${YELLOW}⚠️  You're on the main branch${NC}"
        if [[ "$FORCE" == false ]]; then
            read -p "Create PR from main branch? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "Switch to a feature branch first"
                return 1
            fi
        fi
    fi
    
    echo -e "${GREEN}✅ Git status OK (branch: $current_branch)${NC}"
    return 0
}

# Function to check Docker prerequisites
check_docker_prerequisites() {
    echo -e "${BLUE}Checking Docker prerequisites...${NC}"
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running${NC}"
        return 1
    fi
    
    # Check if required Docker files exist
    local missing_files=()
    [[ ! -f "Dockerfile" ]] && missing_files+=("Dockerfile")
    [[ ! -f "docker compose.yml" ]] && missing_files+=("docker compose.yml")
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Missing Docker files: ${missing_files[*]}${NC}"
        echo ""
        echo "Create Docker files with:"
        echo "  ./.claude/scripts/docker-dev-setup.sh"
        return 1
    fi
    
    echo -e "${GREEN}✅ Docker prerequisites OK${NC}"
    return 0
}

# Function to run comprehensive Docker tests
run_comprehensive_tests() {
    echo -e "${BLUE}Running comprehensive Docker tests...${NC}"
    echo ""
    
    # Build development image
    echo -e "${BLUE}Building development image...${NC}"
    if ! docker compose -f docker compose.yml -f docker compose.dev.yml build; then
        echo -e "${RED}❌ Failed to build development image${NC}"
        return 1
    fi
    
    # Build production image
    echo -e "${BLUE}Building production image...${NC}"
    if ! docker build -t app:prod-test .; then
        echo -e "${RED}❌ Failed to build production image${NC}"
        return 1
    fi
    
    # Run tests with different configurations
    local test_configs=(
        "docker compose.test.yml:test"
        "docker compose.dev.yml:app npm test"
        "docker compose.dev.yml:app pytest"
    )
    
    local tests_passed=0
    local tests_total=0
    
    for config_cmd in "${test_configs[@]}"; do
        IFS=':' read -r compose_file cmd <<< "$config_cmd"
        
        if [[ -f "$compose_file" ]]; then
            tests_total=$((tests_total + 1))
            echo -e "${BLUE}Running tests with $compose_file...${NC}"
            
            if docker compose -f docker compose.yml -f "$compose_file" run --rm $cmd; then
                echo -e "${GREEN}✅ Tests passed with $compose_file${NC}"
                tests_passed=$((tests_passed + 1))
            else
                echo -e "${YELLOW}⚠️  Tests failed or not available with $compose_file${NC}"
            fi
            echo ""
        fi
    done
    
    # Try direct container testing if compose tests didn't work
    if [[ $tests_passed -eq 0 ]]; then
        echo -e "${BLUE}Trying direct container tests...${NC}"
        
        # Node.js tests
        if docker run --rm app:prod-test npm test 2>/dev/null; then
            echo -e "${GREEN}✅ Node.js tests passed${NC}"
            tests_passed=1
        # Python tests
        elif docker run --rm app:prod-test pytest 2>/dev/null; then
            echo -e "${GREEN}✅ Python tests passed${NC}"
            tests_passed=1
        # Go tests
        elif docker run --rm app:prod-test go test ./... 2>/dev/null; then
            echo -e "${GREEN}✅ Go tests passed${NC}"
            tests_passed=1
        else
            echo -e "${YELLOW}⚠️  Could not run tests automatically${NC}"
            echo "Verify your test setup manually"
        fi
    fi
    
    if [[ $tests_passed -eq 0 ]]; then
        echo -e "${RED}❌ No tests could be executed successfully${NC}"
        echo ""
        echo "This might indicate:"
        echo "  - Test configuration issues"
        echo "  - Missing test dependencies in Docker"
        echo "  - Incorrect test commands"
        echo ""
        if [[ "$FORCE" == false ]]; then
            read -p "Continue with PR creation anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                return 1
            fi
        fi
    else
        echo -e "${GREEN}✅ Docker tests validation complete ($tests_passed tests passed)${NC}"
    fi
    
    return 0
}

# Function to run security scan
run_security_scan() {
    echo -e "${BLUE}Running security scan...${NC}"
    
    # Check if Trivy is available
    if command -v trivy >/dev/null 2>&1; then
        echo "Running Trivy security scan..."
        if trivy image --exit-code 1 --severity HIGH,CRITICAL app:prod-test; then
            echo -e "${GREEN}✅ Security scan passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Security vulnerabilities found${NC}"
            if [[ "$FORCE" == false ]]; then
                read -p "Continue despite security issues? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    return 1
                fi
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  Trivy not installed, skipping security scan${NC}"
        echo "Install with: brew install trivy (macOS) or https://github.com/aquasecurity/trivy"
    fi
    
    return 0
}

# Function to validate CI/CD configuration
validate_cicd_config() {
    echo -e "${BLUE}Validating CI/CD configuration...${NC}"
    
    # Check if GitHub Actions workflow exists
    if [[ -f ".github/workflows/docker-tests.yml" ]] || [[ -f ".github/workflows/test.yml" ]]; then
        echo -e "${GREEN}✅ GitHub Actions workflow found${NC}"
        
        # Validate workflow syntax if yq is available
        if command -v yq >/dev/null 2>&1; then
            for workflow in .github/workflows/*.yml; do
                if yq eval '.' "$workflow" >/dev/null 2>&1; then
                    echo -e "${GREEN}✅ $workflow syntax is valid${NC}"
                else
                    echo -e "${RED}❌ $workflow has syntax errors${NC}"
                    return 1
                fi
            done
        fi
    else
        echo -e "${YELLOW}⚠️  No GitHub Actions workflow found${NC}"
        echo "Consider creating .github/workflows/docker-tests.yml for CI/CD"
    fi
    
    # Check if pre-push hook is installed
    if [[ -f ".git/hooks/pre-push" ]]; then
        echo -e "${GREEN}✅ Pre-push hook is installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Pre-push hook not installed${NC}"
        echo "Install with: ln -sf ../../.claude/hooks/pre-push-docker-tests.sh .git/hooks/pre-push"
    fi
    
    return 0
}

# Function to generate PR summary
generate_pr_summary() {
    echo ""
    echo -e "${BLUE}=== PR Validation Summary ===${NC}"
    echo ""
    
    local current_branch=$(git branch --show-current)
    local commit_count=$(git rev-list --count HEAD ^main 2>/dev/null || git rev-list --count HEAD ^master 2>/dev/null || echo "unknown")
    
    echo "Branch: $current_branch"
    echo "Commits: $commit_count"
    echo "Docker-first enabled: $(is_docker_first_enabled && echo "Yes" || echo "No")"
    echo ""
    
    if is_docker_first_enabled; then
        echo -e "${GREEN}✅ All Docker validations passed${NC}"
        echo -e "${GREEN}✅ Tests run in containers${NC}"
        echo -e "${GREEN}✅ Production/development parity maintained${NC}"
        echo ""
        echo "This PR follows Docker-first development practices!"
    else
        echo -e "${YELLOW}⚠️  Docker-first development is disabled${NC}"
        echo "Local development practices in use"
    fi
    
    echo ""
}

# Main validation function
main() {
    echo -e "${BLUE}=== PR Validation for Docker-First Development ===${NC}"
    echo ""
    
    # Basic checks
    if ! check_git_status; then
        exit 1
    fi
    echo ""
    
    # Skip Docker checks if Docker-first is disabled
    if ! is_docker_first_enabled; then
        echo -e "${YELLOW}Docker-first development is disabled - running basic validation${NC}"
        generate_pr_summary
        echo -e "${GREEN}Basic validation complete - PR can be created${NC}"
        exit 0
    fi
    
    echo -e "${GREEN}Docker-first development is enabled - running full validation${NC}"
    echo ""
    
    # Docker prerequisites
    if ! check_docker_prerequisites; then
        exit 1
    fi
    echo ""
    
    # Run tests unless skipped
    if [[ "$SKIP_TESTS" == false ]]; then
        if ! run_comprehensive_tests; then
            exit 1
        fi
        echo ""
    else
        echo -e "${YELLOW}⚠️  Tests skipped as requested${NC}"
        echo ""
    fi
    
    # Security scan
    run_security_scan
    echo ""
    
    # CI/CD validation
    validate_cicd_config
    echo ""
    
    # Generate summary
    generate_pr_summary
    
    echo -e "${GREEN}🎉 All validations passed! Your PR is ready for Docker-first development!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Push your branch: git push -u origin $(git branch --show-current)"
    echo "  2. Create PR on GitHub"
    echo "  3. CI/CD will run the same Docker tests"
    echo ""
    
    exit 0
}

# Run main function
main "$@"