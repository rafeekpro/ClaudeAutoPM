#!/bin/bash

# Install Git hooks for Docker-first development
# Usage: ./install-hooks.sh [--force]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FORCE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Install Git hooks for Docker-first development"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --force      Overwrite existing hooks"
            echo "  -h, --help   Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Function to install a single hook
install_hook() {
    local hook_name=$1
    local source_path=$2
    local target_path=".git/hooks/$hook_name"
    
    echo -e "${BLUE}Installing $hook_name hook...${NC}"
    
    # Check if source exists
    if [[ ! -f "$source_path" ]]; then
        echo -e "${RED}❌ Source hook not found: $source_path${NC}"
        return 1
    fi
    
    # Check if target exists
    if [[ -f "$target_path" ]] && [[ "$FORCE" == false ]]; then
        echo -e "${YELLOW}⚠️  Hook already exists: $target_path${NC}"
        read -p "Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Skipping $hook_name"
            return 0
        fi
    fi
    
    # Create symlink
    if ln -sf "../../$source_path" "$target_path"; then
        echo -e "${GREEN}✅ Installed $hook_name hook${NC}"
        chmod +x "$target_path"
        return 0
    else
        echo -e "${RED}❌ Failed to install $hook_name hook${NC}"
        return 1
    fi
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}❌ Not in a Git repository${NC}"
        echo "Run this script from the root of your Git repository"
        exit 1
    fi
}

# Function to create hooks directory if needed
ensure_hooks_dir() {
    if [[ ! -d ".git/hooks" ]]; then
        echo -e "${BLUE}Creating .git/hooks directory...${NC}"
        mkdir -p .git/hooks
    fi
}

# Main installation function
main() {
    echo -e "${BLUE}=== Installing Docker-First Development Git Hooks ===${NC}"
    echo ""
    
    # Validate environment
    check_git_repo
    ensure_hooks_dir
    
    # Install hooks
    local hooks_installed=0
    local hooks_total=0
    
    # Pre-push hook (most important)
    hooks_total=$((hooks_total + 1))
    if install_hook "pre-push" ".claude/hooks/pre-push-docker-tests.sh"; then
        hooks_installed=$((hooks_installed + 1))
    fi
    echo ""
    
    # Create additional helper hooks if they don't exist
    
    # Pre-commit hook for basic validation
    if [[ ! -f ".claude/hooks/pre-commit-basic.sh" ]]; then
        echo -e "${BLUE}Creating basic pre-commit hook...${NC}"
        cat > .claude/hooks/pre-commit-basic.sh << 'EOF'
#!/bin/bash

# Basic pre-commit validation
echo "Running pre-commit validation..."

# Check if Docker-first is enabled
if [[ -f ".claude/config.json" ]] && command -v jq >/dev/null 2>&1; then
    enabled=$(jq -r '.features.docker_first_development // false' .claude/config.json)
    if [[ "$enabled" == "true" ]]; then
        echo "Docker-first development is enabled"
        
        # Check if Docker is running for Docker-first projects
        if ! docker info >/dev/null 2>&1; then
            echo "⚠️  Warning: Docker is not running but Docker-first is enabled"
        fi
    fi
fi

# Allow commit to proceed
exit 0
EOF
        chmod +x .claude/hooks/pre-commit-basic.sh
    fi
    
    hooks_total=$((hooks_total + 1))
    if install_hook "pre-commit" ".claude/hooks/pre-commit-basic.sh"; then
        hooks_installed=$((hooks_installed + 1))
    fi
    echo ""
    
    # Show installation summary
    echo -e "${BLUE}=== Installation Summary ===${NC}"
    echo "Hooks installed: $hooks_installed / $hooks_total"
    echo ""
    
    if [[ $hooks_installed -eq $hooks_total ]]; then
        echo -e "${GREEN}✅ All hooks installed successfully!${NC}"
        echo ""
        echo "What happens now:"
        echo "  • pre-commit: Basic validation on every commit"
        echo "  • pre-push: Full Docker test validation before push"
        echo ""
        echo "These hooks will:"
        echo "  • Ensure Docker tests pass before pushing"
        echo "  • Validate Docker configuration"
        echo "  • Prevent pushing broken Docker builds"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Some hooks failed to install${NC}"
        echo "Check the errors above and retry with --force if needed"
    fi
    
    # Show how to bypass hooks if needed
    echo -e "${BLUE}=== Hook Management ===${NC}"
    echo "To temporarily bypass hooks:"
    echo "  git commit --no-verify     # Skip pre-commit hook"
    echo "  git push --no-verify       # Skip pre-push hook"
    echo ""
    echo "To uninstall hooks:"
    echo "  rm .git/hooks/pre-commit .git/hooks/pre-push"
    echo ""
    
    # Test hook installation
    echo -e "${BLUE}=== Testing Hooks ===${NC}"
    
    if [[ -x ".git/hooks/pre-push" ]]; then
        echo -e "${GREEN}✅ pre-push hook is executable${NC}"
    else
        echo -e "${RED}❌ pre-push hook is not executable${NC}"
    fi
    
    if [[ -x ".git/hooks/pre-commit" ]]; then
        echo -e "${GREEN}✅ pre-commit hook is executable${NC}"
    else
        echo -e "${RED}❌ pre-commit hook is not executable${NC}"
    fi
    echo ""
    
    echo -e "${GREEN}🎉 Git hooks installation complete!${NC}"
}

# Run main function
main "$@"