#!/bin/bash

# ============================================
# ClaudeAutoPM Installation Script
# ============================================
# This script installs or updates the ClaudeAutoPM framework
# including .claude, .claude-code, scripts folders
# and handles CLAUDE.md migration/merging
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
# Note: No longer using git clone - package contains all needed files locally
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
TARGET_DIR="${1:-$(pwd)}"

# Files and directories to install
# Note: We're selective about .claude subdirectories - templates are NOT copied
INSTALL_ITEMS=(
    ".claude/agents"
    ".claude/commands"
    ".claude/rules"
    ".claude/scripts"
    ".claude/checklists"
    ".claude/mcp"
    ".claude/.env.example"
    ".claude-code"
    "scripts"
)

# Print banner
print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════╗"
    echo "║           ClaudeAutoPM Installation Script         ║"
    echo "║         Autonomous Project Management        ║"
    echo "╚══════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Print message with color
print_msg() {
    local color=$1
    local msg=$2
    echo -e "${color}${msg}${NC}"
}

# Print step
print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

# Print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Print warning
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Print error
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Ask for confirmation
confirm() {
    local prompt="$1"
    local response

    # In test mode or auto-accept mode, auto-answer yes to avoid blocking
    if [ "$AUTOPM_TEST_MODE" = "1" ] || [ "$AUTOPM_AUTO_ACCEPT" = "1" ]; then
        if [ "$AUTOPM_TEST_MODE" = "1" ]; then
            print_msg "$CYAN" "❓ $prompt [y/n]: y (auto-answered in test mode)"
        else
            print_msg "$CYAN" "❓ $prompt [y/n]: y (auto-accepted)"
        fi
        return 0
    fi

    while true; do
        read -p "$(echo -e ${CYAN}❓ $prompt [y/n]: ${NC})" response

        # Trim whitespace
        response=$(echo "$response" | tr -d ' \t\r\n')

        case "$response" in
            [yY]|[yY][eE][sS]) return 0 ;;
            [nN]|[nN][oO]) return 1 ;;
            *) print_warning "Please answer 'y' for yes or 'n' for no." ;;
        esac
    done
}

# Check if file has changed
file_changed() {
    local file1="$1"
    local file2="$2"
    
    if [ ! -f "$file1" ] || [ ! -f "$file2" ]; then
        return 0
    fi
    
    ! diff -q "$file1" "$file2" > /dev/null 2>&1
}

# Generate merge prompt for CLAUDE.md
# Backup existing installation
backup_existing() {
    local backup_dir="$TARGET_DIR/.autopm_backup_$(date +%Y%m%d_%H%M%S)"
    local backed_up=false
    
    for item in "${INSTALL_ITEMS[@]}"; do
        if [ -e "$TARGET_DIR/$item" ]; then
            if [ "$backed_up" = false ]; then
                print_step "Creating backup at: $backup_dir"
                mkdir -p "$backup_dir"
                backed_up=true
            fi
            cp -r "$TARGET_DIR/$item" "$backup_dir/"
        fi
    done
    
    if [ -f "$TARGET_DIR/CLAUDE.md" ]; then
        if [ "$backed_up" = false ]; then
            mkdir -p "$backup_dir"
            backed_up=true
        fi
        cp "$TARGET_DIR/CLAUDE.md" "$backup_dir/"
    fi
    
    if [ "$backed_up" = true ]; then
        print_success "Backup created successfully"
        echo "$backup_dir"
    else
        echo ""
    fi
}

# Create missing files from templates or defaults
create_missing_file() {
    local item="$1"
    local target_path="$2"
    
    # Since we moved COMMIT_CHECKLIST to .claude/checklists/, 
    # we don't need to create it from template anymore
    print_warning "Cannot create template for: $item - file missing from source"
}

# List detailed changes for directories/files
list_changed_files() {
    local source_path="$1"
    local target_path="$2" 
    local item="$3"
    
    if [ -d "$source_path" ]; then
        print_msg "$BLUE" "    📁 Directory changes in $item:"
        # Find new files
        if command -v find >/dev/null 2>&1; then
            local new_files
            new_files=$(find "$source_path" -type f -newer "$target_path" 2>/dev/null | head -10)
            if [ -n "$new_files" ]; then
                echo "$new_files" | while read -r file; do
                    local rel_path="${file#$source_path/}"
                    print_msg "$GREEN" "      ➕ $rel_path"
                done
            fi
        fi
    else
        print_msg "$BLUE" "    📄 File: $item"
    fi
}

# List files being installed
list_installing_files() {
    local source_path="$1"
    local item="$2"
    
    if [ -d "$source_path" ]; then
        print_msg "$BLUE" "    📁 Installing directory: $item"
        if command -v find >/dev/null 2>&1; then
            local file_count
            file_count=$(find "$source_path" -type f | wc -l | tr -d ' ')
            print_msg "$GREEN" "      📋 Files to install: $file_count"
            
            # Show first few files as examples
            find "$source_path" -type f | head -5 | while read -r file; do
                local rel_path="${file#$source_path/}"
                print_msg "$GREEN" "      ➕ $rel_path"
            done
            
            if [ "$file_count" -gt 5 ]; then
                print_msg "$GREEN" "      ... and $((file_count - 5)) more files"
            fi
        fi
    else
        print_msg "$BLUE" "    📄 Installing file: $item"
    fi
}

# Check if item should be skipped during updates
should_skip_update() {
    local item="$1"
    local target_path="$2"
    local is_update="$3"
    
    # Skip certain folders/files during updates if they already exist
    # These likely contain user customizations
    case "$item" in
        ".claude-code")
            # Claude Code settings - user may have customized
            if [ "$is_update" = true ] && [ -d "$target_path" ]; then
                return 0  # skip
            fi
            ;;
    esac
    
    return 1  # don't skip
}

# Install or update files
install_files() {
    local source_dir="$1"
    local is_update="$2"
    
    # Ensure .claude directory exists since we're copying subdirectories
    if [ ! -d "$TARGET_DIR/.claude" ]; then
        mkdir -p "$TARGET_DIR/.claude"
        print_step "Created .claude directory"
    fi
    
    for item in "${INSTALL_ITEMS[@]}"; do
        local source_path="$source_dir/$item"
        # Remove 'autopm/' prefix from target path
        local target_item="${item#autopm/}"
        local target_path="$TARGET_DIR/$target_item"
        
        if [ ! -e "$source_path" ]; then
            # Try to create missing files from templates or defaults
            create_missing_file "$item" "$target_path"
            continue
        fi
        
        # Create parent directory if needed (for .claude/subdirs)
        local parent_dir="$(dirname "$target_path")"
        if [ ! -d "$parent_dir" ]; then
            mkdir -p "$parent_dir"
        fi
        
        if [ -e "$target_path" ]; then
            # Check if this item should be skipped during updates
            if should_skip_update "$item" "$target_path" "$is_update"; then
                print_msg "$YELLOW" "🔒 Preserving existing: $item (contains user customizations)"
                continue
            fi
            
            if [ "$is_update" = true ]; then
                if file_changed "$source_path" "$target_path"; then
                    print_step "Updating: $item"
                    list_changed_files "$source_path" "$target_path" "$item"
                    rm -rf "$target_path"
                    cp -r "$source_path" "$target_path"
                    print_success "Updated: $item"
                else
                    print_msg "$CYAN" "  No changes: $item"
                fi
            else
                print_warning "Already exists: $item (skipping)"
            fi
        else
            print_step "Installing: $item"
            list_installing_files "$source_path" "$item"
            cp -r "$source_path" "$target_path"
            print_success "Installed: $item"
        fi
    done
}

# Install execution strategy based on mode
install_strategy() {
    local mode="$1"
    local strategy_dir="$TARGET_DIR/.claude/strategies"
    local source_dir="$BASE_DIR/autopm/.claude/templates/strategies-templates"

    # Create strategies directory if it doesn't exist
    mkdir -p "$strategy_dir"

    case "$mode" in
        "sequential")
            print_step "Installing Sequential (Safe) execution strategy..."
            cp "$source_dir/sequential-safe.md" "$strategy_dir/ACTIVE_STRATEGY.md"
            print_success "Sequential strategy installed - safe, predictable execution"
            ;;
        "hybrid")
            print_step "Installing Hybrid (Parallel) execution strategy..."
            cp "$source_dir/hybrid-parallel.md" "$strategy_dir/ACTIVE_STRATEGY.md"
            print_success "Hybrid strategy installed - maximum performance with parallel execution"
            print_msg "$CYAN" "  📋 This enables parallel agent spawning for complex tasks"
            ;;
        "adaptive")
            print_step "Installing Adaptive (Smart) execution strategy..."
            cp "$source_dir/adaptive-smart.md" "$strategy_dir/ACTIVE_STRATEGY.md"
            print_success "Adaptive strategy installed - intelligent mode selection"
            print_msg "$CYAN" "  📋 Claude will automatically choose the best execution mode"
            ;;
        *)
            print_warning "Unknown strategy mode: $mode, defaulting to adaptive"
            cp "$source_dir/adaptive-smart.md" "$strategy_dir/ACTIVE_STRATEGY.md"
            ;;
    esac

    # Strategy is now located directly in strategies/ folder
}

# Add provider configuration to config.json
add_provider_to_config() {
    local config_file="$1"

    if [ ! -f "$config_file" ]; then
        print_error "Config file not found: $config_file"
        return 1
    fi

    # Create provider configuration based on selection
    local provider_config=""

    if [ "$PROVIDER_TYPE" = "azure" ]; then
        provider_config=$(cat <<EOF
  "provider": {
    "type": "azure",
    "config": {
      "organization": "$AZURE_ORG",
      "project": "$AZURE_PROJECT",
      "team": "$AZURE_TEAM"
    }
  },
EOF
)
    else
        # Default to GitHub
        provider_config=$(cat <<EOF
  "provider": {
    "type": "github",
    "config": {
      "owner": "${GITHUB_OWNER:-owner}",
      "repo": "${GITHUB_REPO:-repo}"
    }
  },
EOF
)
    fi

    # Insert provider config into the JSON file
    # Write provider config to temporary file to avoid AWK newline issues
    local temp_file="${config_file}.tmp"
    local provider_file="${config_file}.provider"

    echo "$provider_config" > "$provider_file"

    # Read the original file and insert provider config after opening brace
    awk -v provider_file="$provider_file" '
        NR==1 && /{/ {
            print $0
            while ((getline line < provider_file) > 0) {
                print line
            }
            close(provider_file)
            next
        }
        {print}
    ' "$config_file" > "$temp_file"

    # Clean up and move temp file back
    rm -f "$provider_file"
    mv "$temp_file" "$config_file"

    print_msg "$CYAN" "  Added $PROVIDER_TYPE provider configuration"
}

# Choose provider (GitHub or Azure DevOps)
choose_provider() {
    local config_file="$TARGET_DIR/.claude/config.json"

    # Skip if provider already configured and this is an update
    if [ "$is_update" = true ] && [ -f "$config_file" ]; then
        if grep -q '"provider"' "$config_file" 2>/dev/null; then
            local current_provider=$(grep -A2 '"provider"' "$config_file" | grep '"type"' | cut -d'"' -f4)
            print_msg "$CYAN" "🔧 Keeping existing provider: $current_provider"
            return
        fi
    fi

    print_msg "$YELLOW" "\n🎯 Choose your project management platform:"
    echo ""
    echo "  1) 📙 GitHub (Recommended) - Best for open source, startups"
    echo "  2) 🔷 Azure DevOps - Best for enterprise, Agile teams"
    echo ""

    while true; do
        if [ "$AUTOPM_TEST_MODE" = "1" ]; then
            choice="1"
            print_msg "$CYAN" "❓ Your choice [1-2]: 1 (auto-selected GitHub in test mode)"
        else
            echo -n "Your choice [1-2]: "
            read choice
        fi

        case "$choice" in
            1)
                export PROVIDER_TYPE="github"
                print_success "GitHub selected"

                # Get GitHub configuration
                if [ "$AUTOPM_TEST_MODE" = "1" ] || [ "$AUTOPM_AUTO_ACCEPT" = "1" ]; then
                    github_owner="test-owner"
                    github_repo="test-repo"
                    if [ "$AUTOPM_TEST_MODE" = "1" ]; then
                        print_msg "$CYAN" "GitHub owner/org: test-owner (auto-filled in test mode)"
                        print_msg "$CYAN" "GitHub repo name: test-repo (auto-filled in test mode)"
                    else
                        print_msg "$CYAN" "GitHub owner/org: test-owner (auto-filled)"
                        print_msg "$CYAN" "GitHub repo name: test-repo (auto-filled)"
                    fi
                else
                    echo -n "Enter GitHub owner/org: "
                    read github_owner
                    echo -n "Enter GitHub repo name: "
                    read github_repo
                fi

                export GITHUB_OWNER="$github_owner"
                export GITHUB_REPO="$github_repo"
                break
                ;;
            2)
                export PROVIDER_TYPE="azure"
                print_success "Azure DevOps selected"

                # Get Azure DevOps configuration
                if [ "$AUTOPM_TEST_MODE" = "1" ] || [ "$AUTOPM_AUTO_ACCEPT" = "1" ]; then
                    azure_org="test-org"
                    azure_project="test-project"
                    azure_team=""
                    if [ "$AUTOPM_TEST_MODE" = "1" ]; then
                        print_msg "$CYAN" "Azure organization: test-org (auto-filled in test mode)"
                        print_msg "$CYAN" "Azure project: test-project (auto-filled in test mode)"
                        print_msg "$CYAN" "Azure team: (default, auto-filled in test mode)"
                    else
                        print_msg "$CYAN" "Azure organization: test-org (auto-filled)"
                        print_msg "$CYAN" "Azure project: test-project (auto-filled)"
                        print_msg "$CYAN" "Azure team: (default, auto-filled)"
                    fi
                else
                    echo -n "Enter Azure organization: "
                    read azure_org
                    echo -n "Enter Azure project: "
                    read azure_project
                    echo -n "Enter Azure team (or press Enter for default): "
                    read azure_team
                fi

                export AZURE_ORG="$azure_org"
                export AZURE_PROJECT="$azure_project"
                export AZURE_TEAM="${azure_team:-$azure_project Team}"
                break
                ;;
            *)
                print_error "Invalid choice. Please select 1 or 2."
                ;;
        esac
    done
}

# Choose configuration template
choose_configuration() {
    local config_file="$TARGET_DIR/.claude/config.json"

    # Skip if config already exists and this is an update
    if [ "$is_update" = true ] && [ -f "$config_file" ]; then
        print_msg "$CYAN" "🔧 Keeping existing configuration"
        return
    fi

    # Only show menu if not using preset
    if [ -z "$AUTOPM_CONFIG_PRESET" ] && [ "$AUTOPM_TEST_MODE" != "1" ]; then
        print_msg "$YELLOW" "\n🔧 Choose your development configuration:"
        echo ""
        echo "  1) 🏃 Minimal      - Traditional development (Sequential execution)"
        echo "  2) 🐳 Docker-only  - Docker-first with Adaptive execution"
        echo "  3) 🚀 Full DevOps  - All features with Smart Adaptive execution (RECOMMENDED)"
        echo "  4) ⚡ Performance  - Maximum parallelization for power users"
        echo "  5) ⚙️  Custom      - Use existing config.json template"
        echo ""
    fi

    while true; do
        # Handle preset configuration from command line
        if [ -n "$AUTOPM_CONFIG_PRESET" ]; then
            case "$AUTOPM_CONFIG_PRESET" in
                minimal) choice="1" ;;
                docker) choice="2" ;;
                devops) choice="3" ;;
                performance) choice="4" ;;
                *)
                    print_warning "Unknown preset: $AUTOPM_CONFIG_PRESET. Using devops."
                    choice="3"
                    ;;
            esac
            print_msg "$CYAN" "🔧 Using preset configuration: $AUTOPM_CONFIG_PRESET"
            # Clear the preset after using it once to exit the loop
            AUTOPM_CONFIG_PRESET=""
        # In test mode, auto-select Full DevOps configuration (option 3)
        elif [ "$AUTOPM_TEST_MODE" = "1" ]; then
            choice="3"
            print_msg "$CYAN" "❓ Your choice [1-5]: 3 (auto-selected Full DevOps in test mode)"
        else
            echo -n "Your choice [1-5]: "
            read -r choice
        fi

        case "$choice" in
            1)
                print_step "Setting up minimal configuration..."
                cp "$BASE_DIR/autopm/.claude/templates/config-templates/minimal.json" "$config_file"
                add_provider_to_config "$config_file"
                print_success "Minimal configuration applied!"
                print_msg "$CYAN" "  📋 Sequential execution - safe and predictable"
                break
                ;;
            2)
                print_step "Setting up Docker-only configuration..."
                cp "$BASE_DIR/autopm/.claude/templates/config-templates/docker-only.json" "$config_file"
                add_provider_to_config "$config_file"
                print_success "Docker-only configuration applied!"
                print_msg "$CYAN" "  📋 Adaptive execution - learns and optimizes"
                break
                ;;
            3)
                print_step "Setting up full DevOps configuration..."
                cp "$BASE_DIR/autopm/.claude/templates/config-templates/full-devops.json" "$config_file"
                add_provider_to_config "$config_file"
                print_success "Full DevOps configuration applied!"
                print_msg "$CYAN" "  📋 Smart Adaptive execution - best balance of speed and safety"
                print_msg "$CYAN" "  📋 Docker + Kubernetes + intelligent parallelization"
                break
                ;;
            4)
                print_step "Setting up performance configuration..."
                cp "$BASE_DIR/autopm/.claude/templates/config-templates/performance.json" "$config_file"
                add_provider_to_config "$config_file"
                print_success "Performance configuration applied!"
                print_msg "$YELLOW" "  ⚡ Maximum parallel execution - for experienced users"
                print_msg "$YELLOW" "  ⚠️  Higher resource usage, requires good understanding"
                break
                ;;
            5)
                if [ -f "$BASE_DIR/autopm/.claude/config.json" ]; then
                    print_step "Using default configuration template..."
                    cp "$BASE_DIR/autopm/.claude/config.json" "$config_file"
                    add_provider_to_config "$config_file"
                    print_success "Default configuration applied!"
                else
                    print_warning "Default config not found, using Docker-only template..."
                    cp "$BASE_DIR/autopm/.claude/templates/config-templates/docker-only.json" "$config_file"
                    add_provider_to_config "$config_file"
                fi
                break
                ;;
            *)
                print_warning "Invalid choice. Please enter 1, 2, 3, 4, or 5."
                ;;
        esac
    done
    
    print_msg "$CYAN" "\n💡 You can change these settings later with:"
    print_msg "$CYAN" "   /config:toggle-features"
    print_msg "$CYAN" "   or: .claude/scripts/config/toggle-features.sh"
}

# Choose CI/CD system
choose_cicd_system() {
    local config_file="$TARGET_DIR/.claude/config.json"

    # Skip if AUTOPM_CICD_SYSTEM is set (from CLI parameter)
    if [ -n "$AUTOPM_CICD_SYSTEM" ]; then
        echo "$AUTOPM_CICD_SYSTEM" > "$TARGET_DIR/.claude/.cicd_choice"
        return
    fi

    # Skip if in auto-accept mode with minimal config
    if [ "$AUTOPM_AUTO_ACCEPT" = "1" ]; then
        local config_preset="${AUTOPM_CONFIG_PRESET:-devops}"
        if [ "$config_preset" = "minimal" ]; then
            # Minimal config - no CI/CD by default
            echo "none" > "$TARGET_DIR/.claude/.cicd_choice"
            return
        else
            # Other configs - GitHub Actions by default
            echo "github-actions" > "$TARGET_DIR/.claude/.cicd_choice"
            return
        fi
    fi


    print_step "🚀 Choose CI/CD System"
    print_msg "$CYAN" ""
    print_msg "$CYAN" "Select your CI/CD platform:"
    print_msg "$CYAN" "  1) GitHub Actions (Recommended for GitHub repos)"
    print_msg "$CYAN" "  2) Azure DevOps (Enterprise integration)"
    print_msg "$CYAN" "  3) GitLab CI/CD"
    print_msg "$CYAN" "  4) Jenkins"
    print_msg "$CYAN" "  5) No CI/CD (Local development only)"
    print_msg "$CYAN" ""

    local choice=""
    while [ -z "$choice" ]; do
        echo -n "Your choice [1-5]: "
        read -r choice

        case "$choice" in
            1)
                echo "github-actions" > "$TARGET_DIR/.claude/.cicd_choice"
                print_success "GitHub Actions selected!"
                ;;
            2)
                echo "azure-devops" > "$TARGET_DIR/.claude/.cicd_choice"
                print_success "Azure DevOps selected!"
                ;;
            3)
                echo "gitlab-ci" > "$TARGET_DIR/.claude/.cicd_choice"
                print_success "GitLab CI/CD selected!"
                ;;
            4)
                echo "jenkins" > "$TARGET_DIR/.claude/.cicd_choice"
                print_success "Jenkins selected!"
                ;;
            5)
                echo "none" > "$TARGET_DIR/.claude/.cicd_choice"
                print_success "No CI/CD - Local development only!"
                ;;
            *)
                print_warning "Invalid choice. Please select 1-5."
                choice=""
                ;;
        esac
    done
}

# Generate CLAUDE.md based on configuration
generate_claude_md() {
    local config_file="$TARGET_DIR/.claude/config.json"
    local target_claude="$TARGET_DIR/CLAUDE.md"
    local base_template="$BASE_DIR/autopm/.claude/templates/claude-templates/base.md"
    local workflow_addon=""
    local agents_addon=""
    local cicd_addon=""
    
    # Check if base template exists
    if [ ! -f "$base_template" ]; then
        print_error "Base template not found: $base_template"
        return 1
    fi
    
    # Determine which addons to use based on configuration
    if [ -f "$config_file" ] && command -v jq >/dev/null 2>&1; then
        local docker_enabled=$(jq -r '.features.docker_first_development // false' "$config_file")
        local k8s_enabled=$(jq -r '.features.kubernetes_devops_testing // false' "$config_file")
        local git_safety=$(jq -r '.features.git_safety_hooks // false' "$config_file")
        local strategy_mode=$(jq -r '.execution_strategy.mode // "adaptive"' "$config_file")

        if [ "$docker_enabled" = "true" ] && [ "$k8s_enabled" = "true" ]; then
            workflow_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/devops-workflow.md"
            agents_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/devops-agents.md"
            print_step "Generating CLAUDE.md for Full DevOps configuration..."
        elif [ "$docker_enabled" = "true" ]; then
            workflow_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/docker-workflow.md"
            agents_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/docker-agents.md"
            print_step "Generating CLAUDE.md for Docker-only configuration..."
        else
            workflow_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/minimal-workflow.md"
            agents_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/minimal-agents.md"
            print_step "Generating CLAUDE.md for Minimal configuration..."
        fi

        # Install execution strategy based on config
        install_strategy "$strategy_mode"
        
        # Set git safety addon if enabled
        if [ "$git_safety" = "true" ]; then
            git_safety_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/git-safety.md"
            print_msg "$CYAN" "  ✓ Git safety hooks enabled"
        fi
    else
        # Fallback to minimal if no config or jq
        workflow_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/minimal-workflow.md"
        agents_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/minimal-agents.md"
        print_step "Generating CLAUDE.md from minimal configuration (no config found)..."
    fi
    
    # Build the final CLAUDE.md by merging base with addons
    print_step "Merging templates..."
    
    # Determine CI/CD addon based on choice
    if [ -f "$TARGET_DIR/.claude/.cicd_choice" ]; then
        local cicd_choice=$(cat "$TARGET_DIR/.claude/.cicd_choice")
        case "$cicd_choice" in
            github-actions)
                cicd_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/github-actions.md"
                ;;
            azure-devops)
                cicd_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/azure-devops.md"
                ;;
            gitlab-ci)
                cicd_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/gitlab-ci.md"
                ;;
            jenkins)
                cicd_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/jenkins.md"
                ;;
            none)
                cicd_addon="$BASE_DIR/autopm/.claude/templates/claude-templates/addons/no-cicd.md"
                ;;
        esac
    fi

    # Start with base template
    cp "$base_template" "$target_claude.tmp"

    # Replace WORKFLOW_SECTION with appropriate addon
    if [ -f "$workflow_addon" ]; then
        # Use awk to replace the placeholder
        awk -v addon="$workflow_addon" '
            /<!-- WORKFLOW_SECTION -->/ {
                while ((getline line < addon) > 0) {
                    print line
                }
                close(addon)
                next
            }
            { print }
        ' "$target_claude.tmp" > "$target_claude.tmp2"
        mv "$target_claude.tmp2" "$target_claude.tmp"
    fi

    # Replace AGENT_SELECTION_SECTION with appropriate addon
    if [ -f "$agents_addon" ]; then
        # Use awk to replace the placeholder
        awk -v addon="$agents_addon" '
            /<!-- AGENT_SELECTION_SECTION -->/ {
                while ((getline line < addon) > 0) {
                    print line
                }
                close(addon)
                next
            }
            { print }
        ' "$target_claude.tmp" > "$target_claude.tmp2"
        mv "$target_claude.tmp2" "$target_claude.tmp"
    fi

    # Replace CICD_SECTION with appropriate CI/CD addon
    if [ -f "$cicd_addon" ]; then
        awk -v addon="$cicd_addon" '
            /<!-- CICD_SECTION -->/ {
                while ((getline line < addon) > 0) {
                    print line
                }
                close(addon)
                next
            }
            { print }
        ' "$target_claude.tmp" > "$target_claude.tmp2"
        mv "$target_claude.tmp2" "$target_claude.tmp"
    fi
    
    # Append git safety addon if enabled
    if [ -n "$git_safety_addon" ] && [ -f "$git_safety_addon" ]; then
        echo "" >> "$target_claude.tmp"
        cat "$git_safety_addon" >> "$target_claude.tmp"
        print_msg "$CYAN" "  ✓ Added git safety documentation"
    fi
    
    # Move the final file to target location
    mv "$target_claude.tmp" "$target_claude"
    print_success "Generated CLAUDE.md based on your configuration"
}

# Handle CLAUDE.md migration
handle_claude_md() {
    local source_dir="$1"
    local target_claude="$TARGET_DIR/CLAUDE.md"
    local config_file="$TARGET_DIR/.claude/config.json"
    
    if [ -f "$target_claude" ]; then
        print_msg "$YELLOW" "\n📋 CLAUDE.md already exists in target directory"
        
        # Offer to regenerate based on current configuration
        if confirm "Would you like to regenerate CLAUDE.md based on your current configuration?"; then
            # Backup existing CLAUDE.md
            local backup_file="${target_claude}.backup.$(date +%Y%m%d_%H%M%S)"
            cp "$target_claude" "$backup_file"
            print_msg "$CYAN" "  Backed up existing CLAUDE.md to: $backup_file"
            
            # Generate new CLAUDE.md from template
            generate_claude_md "$config_file" "$target_claude"
        else
            print_msg "$CYAN" "  Keeping existing CLAUDE.md"
        fi
    else
        # No existing CLAUDE.md, generate from template
        print_step "Generating CLAUDE.md based on configuration..."
        generate_claude_md "$config_file" "$target_claude"
    fi
}

# Check dependencies
check_dependencies() {
    local deps=("git" "diff")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        print_error "Missing required dependencies: ${missing[*]}"
        print_msg "$YELLOW" "Please install the missing dependencies and try again"
        exit 1
    fi
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
            if [ ${#value} -ge 20 ] && [[ "$value" =~ ^[a-zA-Z0-9_-]+$ ]]; then
                return 0
            else
                return 1
            fi
            ;;
        "path")
            if [[ "$value" =~ ^[a-zA-Z0-9._/-]+$ ]]; then
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
                "email") print_warning "Please enter a valid email address" ;;
                "url") print_warning "Please enter a valid URL starting with http:// or https://" ;;
                "token") print_warning "Please enter a valid token (at least 20 characters, alphanumeric and -_)" ;;
                "path") print_warning "Please enter a valid path" ;;
                *) print_warning "Invalid input" ;;
            esac
            ((attempts++))
        fi
    done
    
    print_error "Too many invalid attempts. Skipping this field."
    echo "$default"
}

# Interactive .env creator
create_env_interactive() {
    local source_dir="$1"
    local env_example="$source_dir/.claude/.env.example"
    local target_env="$TARGET_DIR/.claude/.env"
    
    if [ ! -f "$env_example" ]; then
        print_warning ".env.example not found, skipping .env creation"
        return
    fi
    
    if [ -f "$target_env" ]; then
        if ! confirm "📝 .env file already exists. Would you like to recreate it interactively?"; then
            return
        fi
        
        # Backup existing .env
        cp "$target_env" "$target_env.backup.$(date +%Y%m%d_%H%M%S)"
        print_success "Existing .env backed up"
    fi
    
    print_msg "$BLUE$BOLD" "\n🔧 Interactive .env Configuration"
    print_msg "$CYAN" "Let's set up your environment configuration step by step."
    print_msg "$YELLOW" "You can skip optional fields by pressing Enter."
    echo ""
    
    # Start building the .env content
    local env_content=""
    
    # Add header
    env_content+="# ============================================\n"
    env_content+="# MCP (Model Context Protocol) Configuration\n"
    env_content+="# Generated on $(date)\n"
    env_content+="# ============================================\n\n"
    
    # Context7 Configuration
    print_msg "$GREEN$BOLD" "📚 Context7 MCP Server Configuration"
    print_msg "$CYAN" "Context7 provides documentation and codebase context for AI agents."
    
    local context7_key
    context7_key=$(get_input "Context7 API Key (get from https://context7.com/account)" "" "token" false)
    local context7_workspace
    context7_workspace=$(get_input "Context7 Workspace ID or name" "" "text" false)
    
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
    
    local github_token
    github_token=$(get_input "GitHub Personal Access Token (create at: https://github.com/settings/tokens)" "" "token" false)
    
    env_content+="# GitHub MCP Server Configuration\n"
    env_content+="# ============================================\n"
    env_content+="GITHUB_TOKEN=${github_token}\n"
    env_content+="GITHUB_API_URL=https://api.github.com\n\n"
    
    # Playwright Configuration
    print_msg "$GREEN$BOLD" "🎭 Playwright Configuration"
    print_msg "$CYAN" "Browser automation for testing (optional)."
    
    local playwright_browser
    playwright_browser=$(get_input "Playwright Browser" "chromium" "text" false)
    local playwright_headless
    if confirm "Run Playwright in headless mode?"; then
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
    if confirm "Would you like to configure Azure DevOps integration?"; then
        local azdo_pat
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
    if confirm "Would you like to configure cloud provider credentials?"; then
        
        # AWS
        if confirm "Configure AWS credentials?"; then
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
        
        # Azure
        if confirm "Configure Azure credentials?"; then
            local azure_sub
            azure_sub=$(get_input "Azure Subscription ID" "" "text" false)
            local azure_tenant
            azure_tenant=$(get_input "Azure Tenant ID" "" "text" false)
            local azure_client_id
            azure_client_id=$(get_input "Azure Client ID" "" "text" false)
            local azure_client_secret
            azure_client_secret=$(get_input "Azure Client Secret" "" "text" false)
            
            env_content+="# Azure Cloud Configuration\n"
            env_content+="# ------------------------------------------\n"
            env_content+="AZURE_SUBSCRIPTION_ID=${azure_sub}\n"
            env_content+="AZURE_TENANT_ID=${azure_tenant}\n"
            env_content+="AZURE_CLIENT_ID=${azure_client_id}\n"
            env_content+="AZURE_CLIENT_SECRET=${azure_client_secret}\n\n"
        fi
        
        # GCP
        if confirm "Configure Google Cloud Platform credentials?"; then
            local gcp_project
            gcp_project=$(get_input "GCP Project ID" "" "text" false)
            local gcp_key_path
            gcp_key_path=$(get_input "Path to GCP Service Account Key JSON" "" "path" false)
            
            env_content+="# Google Cloud Platform Configuration\n"
            env_content+="# ------------------------------------------\n"
            env_content+="GCP_PROJECT_ID=${gcp_project}\n"
            env_content+="GCP_SERVICE_ACCOUNT_KEY=${gcp_key_path}\n\n"
        fi
    fi
    
    # AI Provider API Keys (Optional)
    print_msg "$GREEN$BOLD" "🤖 AI Provider API Keys (Optional)"
    if confirm "Would you like to configure AI provider API keys?"; then
        
        # OpenAI
        if confirm "Configure OpenAI API key?"; then
            local openai_key
            openai_key=$(get_input "OpenAI API Key" "" "token" false)
            
            env_content+="# OpenAI Configuration\n"
            env_content+="# ------------------------------------------\n"
            env_content+="OPENAI_API_KEY=${openai_key}\n\n"
        fi
        
        # Gemini
        if confirm "Configure Google Gemini API key?"; then
            local gemini_key
            gemini_key=$(get_input "Google Gemini API Key" "" "token" false)
            
            env_content+="# Google Gemini Configuration\n"
            env_content+="# ------------------------------------------\n"
            env_content+="GEMINI_API_KEY=${gemini_key}\n\n"
        fi
    fi
    
    # Add footer
    env_content+="# ============================================\n"
    env_content+="# IMPORTANT SECURITY NOTES\n"
    env_content+="# ============================================\n"
    env_content+="# 1. NEVER commit this file to version control\n"
    env_content+="# 2. This file is already in .gitignore\n"
    env_content+="# 3. Keep this file secure with proper permissions\n"
    env_content+="# 4. Rotate API keys regularly\n"
    env_content+="# 5. Use environment-specific .env files for different environments\n"
    env_content+="# ============================================\n"
    
    # Write the .env file
    printf "%b" "$env_content" > "$target_env"
    
    # Set secure permissions
    chmod 600 "$target_env" 2>/dev/null || true
    
    print_success "✅ .env file created: $target_env"
    print_msg "$YELLOW" "⚠️  Remember to keep your .env file secure and never commit it to git!"
    
    # Show summary
    echo ""
    print_msg "$CYAN" "📋 Configuration Summary:"
    if [ -n "$context7_key" ]; then
        echo "   ✅ Context7 configured"
    else
        echo "   ⏭️  Context7 skipped"
    fi
    
    if [ -n "$github_token" ]; then
        echo "   ✅ GitHub configured"
    else
        echo "   ⏭️  GitHub skipped"
    fi
    
    echo "   ✅ Playwright configured"
    echo ""
}

# Setup git safety features (hooks and scripts)
setup_git_safety() {
    local config_file="$TARGET_DIR/.claude/config.json"
    
    # Check if git safety is enabled in configuration
    if [ ! -f "$config_file" ] || ! command -v jq >/dev/null 2>&1; then
        return
    fi
    
    local git_safety=$(jq -r '.features.git_safety_hooks // false' "$config_file")
    
    if [ "$git_safety" != "true" ]; then
        return
    fi
    
    print_step "Setting up git safety features..."
    
    # Create scripts directory if it doesn't exist
    if [ ! -d "$TARGET_DIR/scripts" ]; then
        mkdir -p "$TARGET_DIR/scripts"
    fi
    
    # Copy safe-commit script
    if [ -f "$BASE_DIR/.claude/scripts-templates/safe-commit.sh" ]; then
        cp "$BASE_DIR/.claude/scripts-templates/safe-commit.sh" "$TARGET_DIR/scripts/safe-commit.sh"
        chmod +x "$TARGET_DIR/scripts/safe-commit.sh"
        print_msg "$CYAN" "  ✓ Installed safe-commit script"
    fi
    
    # Offer to install git hooks (skip if --no-hooks flag is set)
    if [ "$AUTOPM_SKIP_HOOKS" != "1" ]; then
        echo ""
        if confirm "Would you like to install git hooks for automated commit/push validation?"; then
        # Install pre-commit hook
        if [ -f "$BASE_DIR/.claude/hooks-templates/pre-commit" ]; then
            cp "$BASE_DIR/.claude/hooks-templates/pre-commit" "$TARGET_DIR/.git/hooks/pre-commit"
            chmod +x "$TARGET_DIR/.git/hooks/pre-commit"
            print_msg "$CYAN" "  ✓ Installed pre-commit hook"
        fi
        
        # Install pre-push hook
        if [ -f "$BASE_DIR/.claude/hooks-templates/pre-push" ]; then
            cp "$BASE_DIR/.claude/hooks-templates/pre-push" "$TARGET_DIR/.git/hooks/pre-push"
            chmod +x "$TARGET_DIR/.git/hooks/pre-push"
            print_msg "$CYAN" "  ✓ Installed pre-push hook"
        fi
        
            print_success "Git hooks installed successfully!"
            print_msg "$YELLOW" "  Note: You can bypass hooks with --no-verify flag in emergencies"
        else
            print_msg "$YELLOW" "  Skipped git hooks installation"
            print_msg "$CYAN" "  You can manually copy hooks from .claude/hooks-templates/ later"
        fi
    else
        print_msg "$CYAN" "⏭️  Skipping git hooks installation (--no-hooks flag)"
    fi
}

# Main installation function
main() {
    print_banner
    
    # Check dependencies
    check_dependencies
    
    # Determine installation mode
    local is_update=false
    local existing_items=()
    
    for item in "${INSTALL_ITEMS[@]}"; do
        if [ -e "$TARGET_DIR/$item" ]; then
            existing_items+=("$item")
        fi
    done
    
    if [ ${#existing_items[@]} -gt 0 ]; then
        is_update=true
        print_msg "$YELLOW" "📦 Detected existing ClaudeAutoPM installation"
        print_msg "$CYAN" "   Found: ${existing_items[*]}"
        echo ""
        
        if ! confirm "Would you like to update/sync to the latest version?"; then
            print_msg "$YELLOW" "Installation cancelled"
            exit 0
        fi
        
        # Create backup
        backup_dir=$(backup_existing)
    else
        print_msg "$GREEN" "🚀 Starting fresh ClaudeAutoPM installation"
        echo ""
        
        if [ "$TARGET_DIR" != "$(pwd)" ]; then
            print_msg "$CYAN" "Target directory: $TARGET_DIR"
            if ! confirm "Install ClaudeAutoPM to this directory?"; then
                print_msg "$YELLOW" "Installation cancelled"
                exit 0
            fi
        fi
    fi
    
    # Determine source directory - use package structure
    local source_dir="$BASE_DIR/autopm"

    # Check if we have local package files (no internet needed!)
    if [ ! -d "$source_dir/.claude" ]; then
        # Try alternative paths for different installation scenarios
        if [ -d "$BASE_DIR/.claude" ]; then
            # Development/local scenario
            source_dir="$BASE_DIR"
            print_msg "$CYAN" "Using local development source"
        elif [ -n "$AUTOPM_PACKAGE_ROOT" ] && [ -d "$AUTOPM_PACKAGE_ROOT/autopm/.claude" ]; then
            # Test scenario with explicit package root
            source_dir="$AUTOPM_PACKAGE_ROOT/autopm"
            print_msg "$CYAN" "Using test package source"
        else
            # Last resort - this should not happen in normal npm package usage
            print_error "ClaudeAutoPM framework files not found!"
            print_msg "$RED" "Expected location: $source_dir/.claude"
            print_msg "$YELLOW" "This usually means the package was not installed correctly."
            print_msg "$YELLOW" "Please try: npm install -g claude-autopm"
            exit 1
        fi
    else
        print_msg "$CYAN" "Using local ClaudeAutoPM package source"
    fi
    
    # Install/update files
    echo ""
    if [ "$is_update" = true ]; then
        print_msg "$BLUE" "📥 Synchronizing files..."
    else
        print_msg "$BLUE" "📥 Installing files..."
    fi
    
    install_files "$source_dir" "$is_update"
    
    # Choose provider and configuration (only for fresh installs)
    if [ "$is_update" = false ]; then
        choose_provider
        choose_configuration
        # Choose CI/CD system for fresh installs
        choose_cicd_system
    else
        # For updates, ensure config.json exists
        if [ ! -f "$TARGET_DIR/.claude/config.json" ]; then
            print_warning "config.json not found, selecting configuration..."
            choose_provider
            choose_configuration
            choose_cicd_system
        fi
        # For updates, check if CI/CD choice exists
        if [ ! -f "$TARGET_DIR/.claude/.cicd_choice" ]; then
            choose_cicd_system
        fi
    fi

    # Generate configuration-specific CLAUDE.md
    generate_claude_md

    # Handle CLAUDE.md migration (only for existing installations)
    if [ "$is_update" = true ]; then
        handle_claude_md "$source_dir"
    fi
    
    # Setup git safety features if enabled
    setup_git_safety
    
    # Interactive .env setup (skip if --no-env flag is set)
    if [ "$AUTOPM_SKIP_ENV" != "1" ]; then
        echo ""
        if confirm "🔧 Would you like to set up your .env configuration interactively?"; then
            create_env_interactive "$source_dir"
        else
            print_msg "$YELLOW" "⏭️  Skipping .env setup - you can copy .claude/.env.example to .claude/.env manually"
        fi
    else
        print_msg "$CYAN" "⏭️  Skipping .env setup (--no-env flag)"
    fi
    
    # No cleanup needed - using local package files only
    
    # Final message
    echo ""
    print_msg "$GREEN$BOLD" "✨ ClaudeAutoPM installation completed successfully!"
    echo ""
    
    if [ "$is_update" = true ] && [ -n "$backup_dir" ]; then
        print_msg "$CYAN" "📁 Backup location: $backup_dir"
    fi
    
    # Check if .env was created
    if [ -f "$TARGET_DIR/.claude/.env" ]; then
        print_msg "$CYAN" "📚 Next steps:"
        echo "   1. Review and customize CLAUDE.md for your project"
        echo "   2. ✅ .env file already configured"
        echo "   3. Review .claude/rules/ for development standards"
        echo "   4. Check README.md for usage guidelines"
    else
        print_msg "$CYAN" "📚 Next steps:"
        echo "   1. Review and customize CLAUDE.md for your project"
        echo "   2. Copy .claude/.env.example to .claude/.env and add your API keys"
        echo "   3. Review .claude/rules/ for development standards"
        echo "   4. Check README.md for usage guidelines"
    fi
    echo ""
    print_msg "$GREEN" "🎉 Happy coding with ClaudeAutoPM!"
}

# Run main function
main "$@"