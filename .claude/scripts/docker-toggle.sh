#!/bin/bash

# Docker-First Development Toggle Script
# Usage: ./docker-toggle.sh [enable|disable|status]

CONFIG_FILE=".claude/config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if jq is available
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is required but not installed.${NC}"
        echo "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
        exit 1
    fi
}

# Function to create config if it doesn't exist
create_config_if_missing() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        echo -e "${YELLOW}Creating .claude/config.json...${NC}"
        mkdir -p .claude
        cat > "$CONFIG_FILE" << 'EOF'
{
  "features": {
    "docker_first_development": false,
    "enforce_docker_tests": false,
    "block_local_execution": false,
    "auto_create_dockerfile": true,
    "sync_with_ci": true
  },
  "docker": {
    "default_base_images": {
      "python": "python:3.11-slim",
      "node": "node:20-alpine",
      "go": "golang:1.21-alpine"
    },
    "volume_mounts": {
      "source_code": true,
      "node_modules": false,
      "python_venv": false
    },
    "development": {
      "hot_reload": true,
      "debug_ports": true,
      "local_db": true
    }
  },
  "exceptions": {
    "allow_local_commands": [
      "git",
      "docker",
      "docker compose",
      "make"
    ]
  }
}
EOF
        echo -e "${GREEN}Created default configuration${NC}"
    fi
}

# Function to show current status
show_status() {
    local enabled=$(jq -r '.features.docker_first_development // false' "$CONFIG_FILE" 2>/dev/null)
    local enforce_tests=$(jq -r '.features.enforce_docker_tests // false' "$CONFIG_FILE" 2>/dev/null)
    local block_local=$(jq -r '.features.block_local_execution // false' "$CONFIG_FILE" 2>/dev/null)
    
    echo -e "\n${BLUE}Docker-First Development Status${NC}"
    echo "================================"
    
    if [[ "$enabled" == "true" ]]; then
        echo -e "Status: ${GREEN}ENABLED${NC} 🐳"
        echo -e "  ✅ Development must happen in Docker containers"
        echo -e "  ✅ Local execution is blocked"
        echo -e "  ✅ Hooks will enforce Docker usage"
    else
        echo -e "Status: ${RED}DISABLED${NC} 💻"
        echo -e "  ❌ Local development is allowed"
        echo -e "  ❌ No Docker enforcement"
        echo -e "  ❌ Traditional workflow permitted"
    fi
    
    echo ""
    echo "Feature Details:"
    echo -e "  Docker-First Development: ${enabled}"
    echo -e "  Enforce Docker Tests: ${enforce_tests}"
    echo -e "  Block Local Execution: ${block_local}"
    
    # Check if Docker files exist
    echo ""
    echo "Docker Files Status:"
    [[ -f "Dockerfile" ]] && echo -e "  ✅ Dockerfile" || echo -e "  ❌ Dockerfile (missing)"
    [[ -f "Dockerfile.dev" ]] && echo -e "  ✅ Dockerfile.dev" || echo -e "  ❌ Dockerfile.dev (missing)"
    [[ -f "docker compose.yml" ]] && echo -e "  ✅ docker compose.yml" || echo -e "  ❌ docker compose.yml (missing)"
    [[ -f "docker compose.dev.yml" ]] && echo -e "  ✅ docker compose.dev.yml" || echo -e "  ❌ docker compose.dev.yml (missing)"
    
    # Check hook configuration
    echo ""
    echo "Hook Configuration:"
    if [[ -f ".claude-code/config.json" ]]; then
        local hook_enabled=$(jq -r '.hooks["tool-use"] // "none"' ".claude-code/config.json" 2>/dev/null)
        if [[ "$hook_enabled" != "none" && "$hook_enabled" != "null" ]]; then
            echo -e "  ✅ Hook configured: $hook_enabled"
        else
            echo -e "  ❌ Hook not configured"
        fi
    else
        echo -e "  ❌ No hook configuration found"
    fi
}

# Function to enable Docker-first
enable_docker_first() {
    echo -e "${GREEN}Enabling Docker-First Development...${NC}"
    
    # Update config
    local temp_file=$(mktemp)
    jq '.features.docker_first_development = true | 
        .features.enforce_docker_tests = true | 
        .features.block_local_execution = true' "$CONFIG_FILE" > "$temp_file"
    mv "$temp_file" "$CONFIG_FILE"
    
    # Configure hook if not already done
    if [[ ! -f ".claude-code/config.json" ]]; then
        mkdir -p .claude-code
        cat > ".claude-code/config.json" << 'EOF'
{
  "hooks": {
    "tool-use": ".claude/hooks/docker-first-enforcement.sh"
  },
  "settings": {
    "enforce_agents": true,
    "docker_first_policy": "strict"
  }
}
EOF
        echo -e "  ✅ Configured enforcement hook"
    fi
    
    echo -e "${GREEN}Docker-First Development is now ENABLED! 🐳${NC}"
    echo ""
    echo "What this means:"
    echo "  • All development commands will be blocked unless run in Docker"
    echo "  • Tests must run in containers"
    echo "  • Hot reload will work through volume mounts"
    echo ""
    echo "Next steps:"
    echo "  1. Ensure Docker files exist (use docker-development-orchestrator agent)"
    echo "  2. Run: docker compose -f docker compose.yml -f docker compose.dev.yml up"
    echo "  3. Use 'make dev' for easier commands"
}

# Function to disable Docker-first
disable_docker_first() {
    echo -e "${YELLOW}Disabling Docker-First Development...${NC}"
    
    # Update config
    local temp_file=$(mktemp)
    jq '.features.docker_first_development = false | 
        .features.enforce_docker_tests = false | 
        .features.block_local_execution = false' "$CONFIG_FILE" > "$temp_file"
    mv "$temp_file" "$CONFIG_FILE"
    
    echo -e "${YELLOW}Docker-First Development is now DISABLED 💻${NC}"
    echo ""
    echo "What this means:"
    echo "  • Local development commands are now allowed"
    echo "  • No enforcement of Docker usage"
    echo "  • Traditional workflow is permitted"
    echo ""
    echo "Note: Docker files remain available for optional use"
}

# Function to show help
show_help() {
    echo "Docker-First Development Toggle"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  enable   - Enable Docker-first development mode"
    echo "  disable  - Disable Docker-first development mode" 
    echo "  status   - Show current configuration status"
    echo "  help     - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 enable    # Force all development through Docker"
    echo "  $0 disable   # Allow local development"
    echo "  $0 status    # Check current mode"
}

# Main script logic
main() {
    check_jq
    create_config_if_missing
    
    case "${1:-status}" in
        "enable")
            enable_docker_first
            ;;
        "disable")
            disable_docker_first
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"