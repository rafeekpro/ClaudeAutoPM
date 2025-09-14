#!/bin/bash

# ============================================
# ClaudeAutoPM Environment Setup Script
# ============================================
# Standalone script for creating .env configuration
# Can be run independently or as part of installation
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
TARGET_DIR="${1:-$(pwd)}"

# Print with color
print_msg() {
    local color=$1
    local msg=$2
    echo -e "${color}${msg}${NC}"
}

print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Ask for confirmation
confirm() {
    local prompt="$1"
    local response
    
    while true; do
        read -p "$(echo -e ${CYAN}❓ $prompt [y/n]: ${NC})" response
        case "$response" in
            [yY][eE][sS]|[yY]) return 0 ;;
            [nN][oO]|[nN]) return 1 ;;
            *) print_warning "Please answer yes or no." ;;
        esac
    done
}

# Validate input (basic validation)
validate_input() {
    local value="$1"
    local type="${2:-text}"
    
    case "$type" in
        "email")
            if [[ "$value" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
                return 0
            else
                return 1
            fi
            ;;
        "url")
            if [[ "$value" =~ ^https?:// ]]; then
                return 0
            else
                return 1
            fi
            ;;
        "token")
            # More lenient token validation
            # Allow various token formats including Base64, hex, JWT, etc.
            # Minimum 10 characters (some short tokens exist)
            # Allow alphanumeric, =, ., _, -, +, /, and other common token chars
            if [ ${#value} -ge 10 ]; then
                return 0
            else
                return 1
            fi
            ;;
        "path")
            if [[ "$value" =~ ^[a-zA-Z0-9._/-]+$ ]] || [[ "$value" =~ ^~.*$ ]] || [[ "$value" =~ ^/.*$ ]]; then
                return 0
            else
                return 1
            fi
            ;;
        *)
            # Basic text validation - just check it's not empty
            [ -n "$value" ]
            ;;
    esac
}

# Get user input with validation
get_input() {
    local prompt="$1"
    local default="$2"
    local type="${3:-text}"
    local required="${4:-false}"
    local value=""
    local attempts=0
    local max_attempts=3
    
    while [ $attempts -lt $max_attempts ]; do
        if [ -n "$default" ]; then
            read -p "$(echo -e ${CYAN}$prompt [default: $default]: ${NC})" value
            if [ -z "$value" ]; then
                value="$default"
            fi
        else
            read -p "$(echo -e ${CYAN}$prompt: ${NC})" value
        fi
        
        # Check if required and empty
        if [ "$required" = true ] && [ -z "$value" ]; then
            print_warning "This field is required"
            ((attempts++))
            continue
        fi
        
        # If empty and not required, accept
        if [ -z "$value" ] && [ "$required" = false ]; then
            echo "$value"
            return 0
        fi
        
        # Validate input
        if validate_input "$value" "$type"; then
            echo "$value"
            return 0
        else
            case "$type" in
                "email")
                    print_warning "❌ Invalid email format. Please enter a valid email address (e.g., user@example.com)"
                    ;;
                "url")
                    print_warning "❌ Invalid URL. Please enter a valid URL starting with http:// or https://"
                    ;;
                "token")
                    print_warning "❌ Invalid token format. Token must be at least 10 characters long."
                    print_warning "   Common issues:"
                    print_warning "   • Token too short (minimum 10 characters)"
                    print_warning "   • Copy entire token including all special characters"
                    print_warning "   • Check for extra spaces or line breaks"
                    ;;
                "path")
                    print_warning "❌ Invalid file path. Please enter a valid path (absolute or relative)"
                    ;;
                *)
                    print_warning "❌ Invalid input. Please try again."
                    ;;
            esac
            ((attempts++))
        fi
    done
    
    print_error "Too many invalid attempts (3). Skipping this field."
    print_msg "$YELLOW" "💡 Tip: You can re-run this script later or edit .claude/.env manually"
    echo "$default"
}

# Print banner
print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║           🔧 ClaudeAutoPM .env Setup               ║"
    echo "║         Interactive Configuration            ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Show usage
show_usage() {
    echo "Usage: $0 [directory]"
    echo ""
    echo "Creates an interactive .env configuration file for ClaudeAutoPM"
    echo ""
    echo "Arguments:"
    echo "  directory    Target directory (default: current directory)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Setup .env in current directory"
    echo "  $0 ~/my-project      # Setup .env in specific directory"
}

# Main setup function
setup_env() {
    local env_example="$TARGET_DIR/.claude/.env.example"
    local target_env="$TARGET_DIR/.claude/.env"
    
    # Validate directory structure
    if [ ! -d "$TARGET_DIR/.claude" ]; then
        print_error "ClaudeAutoPM not found in $TARGET_DIR"
        print_msg "$YELLOW" "Please run 'autopm install' first or specify correct directory"
        exit 1
    fi
    
    if [ ! -f "$env_example" ]; then
        print_error ".env.example not found at $env_example"
        print_msg "$YELLOW" "Please ensure ClaudeAutoPM is properly installed"
        exit 1
    fi
    
    # Check existing .env
    if [ -f "$target_env" ]; then
        print_msg "$YELLOW" "📝 .env file already exists at: $target_env"
        
        if ! confirm "Would you like to recreate it interactively?"; then
            print_msg "$CYAN" "Setup cancelled. Existing .env file preserved."
            exit 0
        fi
        
        # Backup existing .env
        cp "$target_env" "$target_env.backup.$(date +%Y%m%d_%H%M%S)"
        print_success "Existing .env backed up"
    fi
    
    print_msg "$BLUE$BOLD" "\n🔧 Interactive .env Configuration"
    print_msg "$CYAN" "Let's set up your environment configuration step by step."
    print_msg "$YELLOW" "⏭️  You can skip optional fields by pressing Enter."
    print_msg "$YELLOW" "🔒 All sensitive data will be stored securely in .env"
    echo ""
    
    # Start building the .env content
    local env_content=""
    
    # Add header
    env_content+="# ============================================\n"
    env_content+="# MCP (Model Context Protocol) Configuration\n"
    env_content+="# Generated on $(date)\n"
    env_content+="# Target: $TARGET_DIR\n"
    env_content+="# ============================================\n\n"
    
    # Context7 Configuration
    print_msg "$GREEN$BOLD" "📚 Context7 MCP Server Configuration"
    print_msg "$CYAN" "Context7 provides documentation and codebase context for AI agents."
    print_msg "$CYAN" "Get your API key from: https://context7.com/account"
    echo ""
    
    local context7_key
    print_msg "$YELLOW" "   Format: Alphanumeric string, min 10 characters"
    context7_key=$(get_input "Context7 API Key" "" "token" false)
    local context7_workspace
    if [ -n "$context7_key" ]; then
        context7_workspace=$(get_input "Context7 Workspace ID or name" "" "text" false)
    else
        context7_workspace=""
    fi
    
    env_content+="# Context7 MCP Server Configuration\n"
    env_content+="# ------------------------------------------\n"
    env_content+="CONTEXT7_API_KEY=${context7_key}\n"
    env_content+="CONTEXT7_MCP_URL=mcp.context7.com/mcp\n"
    env_content+="CONTEXT7_API_URL=context7.com/api/v1\n"
    env_content+="CONTEXT7_WORKSPACE=${context7_workspace}\n"
    env_content+="CONTEXT7_MODE=documentation\n"
    env_content+="CONTEXT7_CACHE_TTL=3600\n\n"
    
    # GitHub Configuration
    print_msg "$GREEN$BOLD" "🐙 GitHub Configuration"
    print_msg "$CYAN" "GitHub integration for repository operations and issue management."
    print_msg "$CYAN" "Create token at: https://github.com/settings/tokens"
    print_msg "$CYAN" "Required scopes: repo, workflow, read:org"
    echo ""
    
    local github_token
    print_msg "$YELLOW" "   Format: ghp_xxxxxxxxxxxx or classic token format"
    github_token=$(get_input "GitHub Personal Access Token" "" "token" false)
    
    env_content+="# GitHub MCP Server Configuration\n"
    env_content+="# ============================================\n"
    env_content+="GITHUB_TOKEN=${github_token}\n"
    env_content+="GITHUB_API_URL=https://api.github.com\n\n"
    
    # Playwright Configuration
    print_msg "$GREEN$BOLD" "🎭 Playwright Configuration"
    print_msg "$CYAN" "Browser automation for testing and UI validation."
    echo ""
    
    local playwright_browser
    playwright_browser=$(get_input "Browser for Playwright tests (chromium/firefox/webkit)" "chromium" "text" false)
    local playwright_headless
    if confirm "Run Playwright in headless mode? (recommended for CI/CD)"; then
        playwright_headless="true"
    else
        playwright_headless="false"
    fi
    
    env_content+="# Playwright MCP Server Configuration\n"
    env_content+="# ============================================\n"
    env_content+="PLAYWRIGHT_BROWSER=${playwright_browser}\n"
    env_content+="PLAYWRIGHT_HEADLESS=${playwright_headless}\n\n"
    
    # Azure DevOps (Optional)
    print_msg "$GREEN$BOLD" "🔷 Azure DevOps Configuration (Optional)"
    print_msg "$CYAN" "Enterprise project management with Azure DevOps integration."
    echo ""
    
    if confirm "Would you like to configure Azure DevOps integration?"; then
        print_msg "$CYAN" "Create PAT at: https://dev.azure.com/{organization}/_usersSettings/tokens"
        print_msg "$CYAN" "Required scopes: Work Items (read, write), Code (read), Build (read)"
        echo ""
        
        local azdo_pat
        print_msg "$YELLOW" "   Format: Base64 encoded string or alphanumeric token"
        azdo_pat=$(get_input "Azure DevOps Personal Access Token" "" "token" false)
        local azdo_org
        azdo_org=$(get_input "Azure DevOps Organization" "" "text" false)
        local azdo_project
        azdo_project=$(get_input "Azure DevOps Project" "" "text" false)
        
        env_content+="# Azure DevOps Configuration\n"
        env_content+="# ============================================\n"
        env_content+="AZURE_DEVOPS_PAT=${azdo_pat}\n"
        env_content+="AZURE_DEVOPS_ORG=${azdo_org}\n"
        env_content+="AZURE_DEVOPS_PROJECT=${azdo_project}\n\n"
    else
        env_content+="# Azure DevOps Configuration (Skipped)\n"
        env_content+="# ============================================\n"
        env_content+="# AZURE_DEVOPS_PAT=your-azure-devops-pat\n"
        env_content+="# AZURE_DEVOPS_ORG=your-organization\n"
        env_content+="# AZURE_DEVOPS_PROJECT=your-project\n\n"
    fi
    
    # Cloud Providers (Optional)
    print_msg "$GREEN$BOLD" "☁️ Cloud Provider Configuration (Optional)"
    print_msg "$CYAN" "Configure credentials for cloud infrastructure management."
    echo ""
    
    if confirm "Would you like to configure cloud provider credentials?"; then
        
        # AWS
        if confirm "Configure AWS credentials?"; then
            print_msg "$CYAN" "AWS credentials for infrastructure agents (aws-cloud-architect, etc.)"
            echo ""
            
            local aws_key
            aws_key=$(get_input "AWS Access Key ID" "" "text" false)
            local aws_secret
            aws_secret=$(get_input "AWS Secret Access Key" "" "text" false)
            local aws_region
            aws_region=$(get_input "AWS Default Region" "us-east-1" "text" false)
            
            env_content+="# AWS Configuration\n"
            env_content+="# ------------------------------------------\n"
            env_content+="AWS_ACCESS_KEY_ID=${aws_key}\n"
            env_content+="AWS_SECRET_ACCESS_KEY=${aws_secret}\n"
            env_content+="AWS_DEFAULT_REGION=${aws_region}\n\n"
        fi
        
        # Azure Cloud
        if confirm "Configure Azure Cloud credentials?"; then
            print_msg "$CYAN" "Azure credentials for infrastructure agents (azure-cloud-architect, etc.)"
            echo ""
            
            local azure_sub
            azure_sub=$(get_input "Azure Subscription ID" "" "text" false)
            local azure_tenant
            azure_tenant=$(get_input "Azure Tenant ID" "" "text" false)
            local azure_client_id
            azure_client_id=$(get_input "Azure Client ID (Service Principal)" "" "text" false)
            local azure_client_secret
            azure_client_secret=$(get_input "Azure Client Secret" "" "text" false)
            
            env_content+="# Azure Cloud Configuration\n"
            env_content+="# ------------------------------------------\n"
            env_content+="AZURE_SUBSCRIPTION_ID=${azure_sub}\n"
            env_content+="AZURE_TENANT_ID=${azure_tenant}\n"
            env_content+="AZURE_CLIENT_ID=${azure_client_id}\n"
            env_content+="AZURE_CLIENT_SECRET=${azure_client_secret}\n\n"
        fi
        
        # Google Cloud Platform
        if confirm "Configure Google Cloud Platform credentials?"; then
            print_msg "$CYAN" "GCP credentials for infrastructure agents (gcp-cloud-architect, etc.)"
            echo ""
            
            local gcp_project
            gcp_project=$(get_input "GCP Project ID" "" "text" false)
            local gcp_key_path
            gcp_key_path=$(get_input "Path to GCP Service Account Key JSON file" "" "path" false)
            
            env_content+="# Google Cloud Platform Configuration\n"
            env_content+="# ------------------------------------------\n"
            env_content+="GCP_PROJECT_ID=${gcp_project}\n"
            env_content+="GCP_SERVICE_ACCOUNT_KEY=${gcp_key_path}\n\n"
        fi
    fi
    
    # AI Provider API Keys (Optional)
    print_msg "$GREEN$BOLD" "🤖 AI Provider API Keys (Optional)"
    print_msg "$CYAN" "Configure API keys for AI agents and integrations."
    echo ""
    
    if confirm "Would you like to configure AI provider API keys?"; then
        
        # OpenAI
        if confirm "Configure OpenAI API key?"; then
            print_msg "$CYAN" "OpenAI API for openai-python-expert agent and integrations"
            print_msg "$CYAN" "Get your API key from: https://platform.openai.com/api-keys"
            echo ""
            
            local openai_key
            print_msg "$YELLOW" "   Format: sk-xxxxxxxxxxxx"
            openai_key=$(get_input "OpenAI API Key" "" "token" false)
            
            env_content+="# OpenAI Configuration\n"
            env_content+="# ------------------------------------------\n"
            env_content+="OPENAI_API_KEY=${openai_key}\n\n"
        fi
        
        # Google Gemini
        if confirm "Configure Google Gemini API key?"; then
            print_msg "$CYAN" "Google Gemini API for gemini-api-expert agent and integrations"
            print_msg "$CYAN" "Get your API key from: https://makersuite.google.com/app/apikey"
            echo ""
            
            local gemini_key
            gemini_key=$(get_input "Google Gemini API Key" "" "token" false)
            
            env_content+="# Google Gemini Configuration\n"
            env_content+="# ------------------------------------------\n"
            env_content+="GEMINI_API_KEY=${gemini_key}\n\n"
        fi
    fi
    
    # Add MCP and development settings
    env_content+="# ============================================\n"
    env_content+="# MCP Context Pool Settings\n"
    env_content+="# ============================================\n"
    env_content+="\n"
    env_content+="# Maximum context pool size for shared contexts\n"
    env_content+="MCP_CONTEXT_POOL_MAX_SIZE=100MB\n"
    env_content+="\n"
    env_content+="# Context retention period (e.g., 7d, 24h, 1w)\n"
    env_content+="MCP_CONTEXT_RETENTION=7d\n"
    env_content+="\n"
    env_content+="# Context refresh interval (daily, hourly, on-change)\n"
    env_content+="MCP_CONTEXT_REFRESH=daily\n"
    env_content+="\n"
    env_content+="# ============================================\n"
    env_content+="# Development & Testing\n"
    env_content+="# ============================================\n"
    env_content+="\n"
    env_content+="# Enable MCP debug logging (true/false)\n"
    env_content+="MCP_DEBUG=false\n"
    env_content+="\n"
    env_content+="# MCP log level (error, warn, info, debug, trace)\n"
    env_content+="MCP_LOG_LEVEL=info\n"
    env_content+="\n"
    
    # Add security footer
    env_content+="# ============================================\n"
    env_content+="# IMPORTANT SECURITY NOTES\n"
    env_content+="# ============================================\n"
    env_content+="# 1. NEVER commit this file to version control\n"
    env_content+="# 2. This file is already in .gitignore\n"
    env_content+="# 3. Keep this file secure with proper permissions (600)\n"
    env_content+="# 4. Rotate API keys regularly\n"
    env_content+="# 5. Use environment-specific .env files for different environments\n"
    env_content+="# 6. Consider using a secrets management service for production\n"
    env_content+="# ============================================\n"
    
    # Write the .env file
    printf "%b" "$env_content" > "$target_env"
    
    # Set secure permissions
    chmod 600 "$target_env" 2>/dev/null || true
    
    print_success "✅ .env file created: $target_env"
    print_msg "$YELLOW" "🔒 File permissions set to 600 (owner read/write only)"
    print_msg "$YELLOW" "⚠️  Remember: NEVER commit .env to version control!"
    
    # Show configuration summary
    echo ""
    print_msg "$CYAN" "📋 Configuration Summary:"
    
    if [ -n "$context7_key" ]; then
        echo "   ✅ Context7 MCP Server configured"
    else
        echo "   ⏭️  Context7 MCP Server skipped"
    fi
    
    if [ -n "$github_token" ]; then
        echo "   ✅ GitHub integration configured"
    else
        echo "   ⏭️  GitHub integration skipped"
    fi
    
    echo "   ✅ Playwright testing configured"
    
    # Count configured services
    local configured_services=1 # Playwright always configured
    [ -n "$context7_key" ] && ((configured_services++))
    [ -n "$github_token" ] && ((configured_services++))
    
    echo ""
    print_msg "$GREEN" "🎉 Environment setup complete! ($configured_services services configured)"
    print_msg "$CYAN" "💡 You can re-run this script anytime to update your configuration"
    echo ""
}

# Main function
main() {
    # Parse arguments
    case "${1:-}" in
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            if [ -n "$1" ] && [ ! -d "$1" ]; then
                print_error "Directory not found: $1"
                exit 1
            fi
            ;;
    esac
    
    print_banner
    print_msg "$BLUE" "🎯 Target directory: $TARGET_DIR"
    echo ""
    
    setup_env
}

# Error handling
set -eE
trap 'print_error "Script failed on line $LINENO"' ERR

# Handle Ctrl+C gracefully
trap 'echo ""; print_msg "$YELLOW" "👋 Setup cancelled by user"; exit 0' INT

# Run main function
main "$@"