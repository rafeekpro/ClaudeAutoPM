#!/bin/bash

# ClaudeAutoPM Feature Toggle Script
# Allows toggling Docker-first and Kubernetes features

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/config.json"
TEMPLATES_DIR="$PROJECT_ROOT/config-templates"

# Helper functions
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    ClaudeAutoPM Feature Toggle                   ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check if jq is available
check_jq() {
    if ! command -v jq >/dev/null 2>&1; then
        print_error "jq is required but not installed. Please install jq to continue."
        echo "Ubuntu/Debian: sudo apt-get install jq"
        echo "macOS: brew install jq"
        exit 1
    fi
}

# Get current feature status
get_feature_status() {
    local feature="$1"
    if [[ -f "$CONFIG_FILE" ]]; then
        jq -r ".features.$feature // false" "$CONFIG_FILE" 2>/dev/null || echo "false"
    else
        echo "false"
    fi
}

# Get current config status
get_config_status() {
    local path="$1"
    if [[ -f "$CONFIG_FILE" ]]; then
        jq -r "$path // false" "$CONFIG_FILE" 2>/dev/null || echo "false"
    else
        echo "false"
    fi
}

# Display current configuration
show_current_config() {
    echo -e "${CYAN}Current Configuration:${NC}"
    echo ""
    
    # Docker features
    echo -e "${BLUE}🐳 Docker Features:${NC}"
    local docker_first=$(get_feature_status "docker_first_development")
    local enforce_tests=$(get_feature_status "enforce_docker_tests") 
    local auto_dockerfile=$(get_feature_status "auto_create_dockerfile")
    local block_local=$(get_feature_status "block_local_execution")
    
    echo "   Docker-first development: $(format_status $docker_first)"
    echo "   Enforce Docker tests: $(format_status $enforce_tests)"
    echo "   Auto-create Dockerfile: $(format_status $auto_dockerfile)"
    echo "   Block local execution: $(format_status $block_local)"
    echo ""
    
    # Kubernetes features
    echo -e "${BLUE}☸️ Kubernetes Features:${NC}"
    local k8s_testing=$(get_feature_status "kubernetes_devops_testing")
    local github_k8s=$(get_feature_status "github_actions_k8s")
    local integration_tests=$(get_feature_status "integration_tests")
    local helm_tests=$(get_config_status ".kubernetes.testing.helm_chart_tests")
    
    echo "   Kubernetes DevOps testing: $(format_status $k8s_testing)"
    echo "   GitHub Actions K8s: $(format_status $github_k8s)"
    echo "   Integration tests: $(format_status $integration_tests)"
    echo "   Helm chart tests: $(format_status $helm_tests)"
    echo ""
    
    # CI/CD features
    echo -e "${BLUE}⚙️ CI/CD Features:${NC}"
    local matrix_testing=$(get_config_status ".github_actions.matrix_testing")
    local cache_opt=$(get_config_status ".github_actions.cache_optimization")
    local docker_integration=$(get_config_status ".github_actions.docker_integration")
    
    echo "   Matrix testing: $(format_status $matrix_testing)"
    echo "   Cache optimization: $(format_status $cache_opt)"
    echo "   Docker integration: $(format_status $docker_integration)"
    echo ""
}

# Format status with colors
format_status() {
    local status="$1"
    if [[ "$status" == "true" ]]; then
        echo -e "${GREEN}✅ ENABLED${NC}"
    else
        echo -e "${RED}❌ DISABLED${NC}"
    fi
}

# Toggle a feature
toggle_feature() {
    local feature_path="$1"
    local current_value="$2"
    local new_value
    
    if [[ "$current_value" == "true" ]]; then
        new_value="false"
    else
        new_value="true"
    fi
    
    # Update config.json
    jq "$feature_path = $new_value" "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
    
    echo "$new_value"
}

# Load template configuration
load_template() {
    local template="$1"
    local template_file="$TEMPLATES_DIR/$template.json"
    
    if [[ ! -f "$template_file" ]]; then
        print_error "Template not found: $template"
        return 1
    fi
    
    print_status "Loading template: $template"
    cp "$template_file" "$CONFIG_FILE"
    print_success "Template loaded successfully!"
    
    # Regenerate workflows based on new config
    regenerate_workflows
}

# Regenerate CLAUDE.md based on configuration
regenerate_claude_md() {
    print_status "Regenerating CLAUDE.md based on configuration..."
    
    local docker_enabled=$(get_feature_status "docker_first_development")
    local k8s_enabled=$(get_feature_status "kubernetes_devops_testing")
    local template_file=""
    local claude_file="$PROJECT_ROOT/../CLAUDE.md"
    
    # Determine which template to use
    if [[ "$docker_enabled" == "true" && "$k8s_enabled" == "true" ]]; then
        template_file="$PROJECT_ROOT/claude-templates/full-devops.md"
        print_status "Using Full DevOps CLAUDE.md template"
    elif [[ "$docker_enabled" == "true" ]]; then
        template_file="$PROJECT_ROOT/claude-templates/docker-only.md"
        print_status "Using Docker-only CLAUDE.md template"
    else
        template_file="$PROJECT_ROOT/claude-templates/minimal.md"
        print_status "Using Minimal CLAUDE.md template"
    fi
    
    # Copy template to CLAUDE.md
    if [[ -f "$template_file" ]]; then
        cp "$template_file" "$claude_file"
        print_success "CLAUDE.md updated for current configuration!"
    else
        print_warning "Template not found: $template_file"
    fi
}

# Regenerate workflows based on current configuration
regenerate_workflows() {
    print_status "Regenerating configuration files..."
    
    local docker_enabled=$(get_feature_status "docker_first_development")
    local k8s_enabled=$(get_feature_status "kubernetes_devops_testing")
    local github_k8s=$(get_feature_status "github_actions_k8s")
    
    # Regenerate CLAUDE.md first
    regenerate_claude_md
    
    # Update docker-tests.yml conditions if needed
    local docker_workflow="$PROJECT_ROOT/../.github/workflows/docker-tests.yml"
    if [[ -f "$docker_workflow" ]]; then
        print_status "Docker workflow exists - configuration will take effect on next run"
    fi
    
    # Update kubernetes-tests.yml conditions if needed  
    local k8s_workflow="$PROJECT_ROOT/../.github/workflows/kubernetes-tests.yml"
    if [[ -f "$k8s_workflow" ]]; then
        print_status "Kubernetes workflow exists - configuration will take effect on next run"
    fi
    
    print_success "Configuration files updated!"
}

# Interactive menu
show_menu() {
    echo -e "${CYAN}Available Actions:${NC}"
    echo ""
    
    # Docker toggles
    local docker_first=$(get_feature_status "docker_first_development")
    local k8s_testing=$(get_feature_status "kubernetes_devops_testing")
    local github_k8s=$(get_feature_status "github_actions_k8s")
    local integration_tests=$(get_feature_status "integration_tests")
    
    echo "[1] Toggle Docker-first development (currently: $(format_status $docker_first))"
    echo "[2] Toggle Kubernetes DevOps testing (currently: $(format_status $k8s_testing))"  
    echo "[3] Toggle GitHub Actions K8s (currently: $(format_status $github_k8s))"
    echo "[4] Toggle Integration tests (currently: $(format_status $integration_tests))"
    echo ""
    echo "[5] Load template: minimal (no Docker/K8s)"
    echo "[6] Load template: docker-only (Docker without K8s)"
    echo "[7] Load template: full-devops (all features)"
    echo ""
    echo "[8] Validate configuration"
    echo "[9] Show configuration"
    echo "[0] Save and exit"
    echo ""
    echo -n "Your choice: "
}

# Handle menu choice
handle_choice() {
    local choice="$1"
    
    case "$choice" in
        1)
            local current=$(get_feature_status "docker_first_development")
            local new=$(toggle_feature ".features.docker_first_development" "$current")
            print_success "Docker-first development: $current → $new"
            ;;
        2)
            local current=$(get_feature_status "kubernetes_devops_testing")
            local new=$(toggle_feature ".features.kubernetes_devops_testing" "$current")
            print_success "Kubernetes DevOps testing: $current → $new"
            ;;
        3)
            local current=$(get_feature_status "github_actions_k8s")
            local new=$(toggle_feature ".features.github_actions_k8s" "$current")
            print_success "GitHub Actions K8s: $current → $new"
            ;;
        4)
            local current=$(get_feature_status "integration_tests")
            local new=$(toggle_feature ".features.integration_tests" "$current")
            print_success "Integration tests: $current → $new"
            ;;
        5)
            load_template "minimal"
            ;;
        6)
            load_template "docker-only"
            ;;
        7)
            load_template "full-devops"
            ;;
        8)
            validate_configuration
            ;;
        9)
            show_current_config
            ;;
        0)
            print_success "Configuration saved!"
            regenerate_workflows
            exit 0
            ;;
        *)
            print_warning "Invalid choice. Please try again."
            ;;
    esac
}

# Validate configuration for consistency
validate_configuration() {
    print_status "Validating configuration..."
    
    local issues=0
    
    # Check if K8s is enabled but Docker is disabled
    local docker_enabled=$(get_feature_status "docker_first_development")
    local k8s_enabled=$(get_feature_status "kubernetes_devops_testing")
    
    if [[ "$k8s_enabled" == "true" && "$docker_enabled" == "false" ]]; then
        print_warning "Kubernetes testing is enabled but Docker-first is disabled"
        print_warning "Consider enabling Docker-first for better K8s integration"
        ((issues++))
    fi
    
    # Check if GitHub Actions K8s is enabled but K8s testing is disabled
    local github_k8s=$(get_feature_status "github_actions_k8s")
    if [[ "$github_k8s" == "true" && "$k8s_enabled" == "false" ]]; then
        print_warning "GitHub Actions K8s is enabled but Kubernetes testing is disabled"
        print_warning "Consider enabling Kubernetes DevOps testing"
        ((issues++))
    fi
    
    if [[ $issues -eq 0 ]]; then
        print_success "Configuration is valid!"
    else
        print_warning "Found $issues configuration issues"
    fi
}

# Main function
main() {
    print_header
    
    # Check prerequisites
    check_jq
    
    # Create config file if it doesn't exist
    if [[ ! -f "$CONFIG_FILE" ]]; then
        print_status "No configuration found, creating default config..."
        cp "$TEMPLATES_DIR/docker-only.json" "$CONFIG_FILE"
        print_success "Default configuration created!"
    fi
    
    # Interactive loop
    while true; do
        echo ""
        show_current_config
        show_menu
        
        read -r choice
        handle_choice "$choice"
        
        echo ""
        echo "Press Enter to continue..."
        read -r
        clear
        print_header
    done
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi