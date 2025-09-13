#!/bin/bash

# Pre-push Git hook to ensure Docker tests pass before pushing
# Install with: ln -sf ../../.claude/hooks/pre-push-docker-tests.sh .git/hooks/pre-push

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to run Docker tests
run_docker_tests() {
    echo -e "${BLUE}Running Docker tests before push...${NC}"
    
    # Check if docker compose.test.yml exists
    if [[ ! -f "docker compose.test.yml" ]]; then
        echo -e "${YELLOW}Warning: docker compose.test.yml not found${NC}"
        echo "Creating basic test configuration..."
        
        # Create basic test compose file
        cat > docker compose.test.yml << 'EOF'
version: '3.9'
services:
  test:
    build:
      context: .
      dockerfile: Dockerfile.dev
    environment:
      - NODE_ENV=test
      - CI=true
    command: npm test
EOF
    fi
    
    # Build test image
    echo -e "${BLUE}Building test image...${NC}"
    if ! docker compose -f docker compose.yml -f docker compose.test.yml build test; then
        echo -e "${RED}❌ Failed to build test image${NC}"
        return 1
    fi
    
    # Run tests
    echo -e "${BLUE}Running tests in Docker container...${NC}"
    if ! docker compose -f docker compose.yml -f docker compose.test.yml run --rm test; then
        echo -e "${RED}❌ Tests failed in Docker container${NC}"
        echo ""
        echo "PUSH BLOCKED: Fix failing tests before pushing"
        echo ""
        echo "To run tests manually:"
        echo "  docker compose -f docker compose.yml -f docker compose.test.yml run --rm test"
        echo ""
        return 1
    fi
    
    echo -e "${GREEN}✅ All Docker tests passed${NC}"
    return 0
}

# Function to run linting in Docker
run_docker_linting() {
    echo -e "${BLUE}Running linting in Docker...${NC}"
    
    # Detect project type and run appropriate linting
    if [[ -f "package.json" ]]; then
        # Node.js project
        if docker compose -f docker compose.yml -f docker compose.dev.yml run --rm app npm run lint 2>/dev/null; then
            echo -e "${GREEN}✅ Linting passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Linting not configured or failed${NC}"
        fi
    elif [[ -f "requirements.txt" ]] || [[ -f "pyproject.toml" ]]; then
        # Python project
        if docker compose -f docker compose.yml -f docker compose.dev.yml run --rm app ruff check . 2>/dev/null; then
            echo -e "${GREEN}✅ Linting passed${NC}"
        elif docker compose -f docker compose.yml -f docker compose.dev.yml run --rm app flake8 . 2>/dev/null; then
            echo -e "${GREEN}✅ Linting passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Linting not configured or failed${NC}"
        fi
    fi
}

# Function to check Docker files exist
check_docker_files() {
    local missing_files=()
    
    [[ ! -f "Dockerfile" ]] && missing_files+=("Dockerfile")
    [[ ! -f "docker compose.yml" ]] && missing_files+=("docker compose.yml")
    
    if [[ ${#missing_files[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Missing Docker files: ${missing_files[*]}${NC}"
        echo ""
        echo "PUSH BLOCKED: Docker files required when docker_first_development is enabled"
        echo ""
        echo "Create Docker files with:"
        echo "  ./.claude/scripts/docker-dev-setup.sh"
        echo ""
        return 1
    fi
    
    return 0
}

# Function to check if Docker is running
check_docker_running() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running${NC}"
        echo ""
        echo "PUSH BLOCKED: Start Docker daemon and try again"
        echo ""
        return 1
    fi
    return 0
}

# Main pre-push logic
main() {
    echo ""
    echo -e "${BLUE}=== Pre-Push Docker Test Validation ===${NC}"
    echo ""
    
    # Skip if Docker-first is disabled
    if ! is_docker_first_enabled; then
        echo -e "${YELLOW}Docker-first development is disabled - skipping Docker tests${NC}"
        exit 0
    fi
    
    echo -e "${GREEN}Docker-first development is enabled - validating tests...${NC}"
    echo ""
    
    # Check prerequisites
    if ! check_docker_running; then
        exit 1
    fi
    
    if ! check_docker_files; then
        exit 1
    fi
    
    # Run tests in Docker
    if ! run_docker_tests; then
        exit 1
    fi
    
    # Run linting (optional, doesn't block)
    run_docker_linting
    
    echo ""
    echo -e "${GREEN}✅ All pre-push validations passed! Safe to push.${NC}"
    echo ""
    
    exit 0
}

# Read input (required for git hook)
while read local_ref local_sha remote_ref remote_sha; do
    # Only run on actual pushes (not on delete)
    if [[ "$local_sha" != "0000000000000000000000000000000000000000" ]]; then
        main
        break
    fi
done