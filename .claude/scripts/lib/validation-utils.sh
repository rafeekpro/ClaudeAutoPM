#!/bin/bash
# Validation Utility Library
# Provides input validation and sanity checks

set -euo pipefail

# Load dependencies
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/logging-utils.sh"

# Validate that required commands are available
validate_required_commands() {
    local commands=("$@")

    log_function_entry "validate_required_commands" "${commands[@]}"

    local missing_commands=()

    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_commands+=("$cmd")
        fi
    done

    if [[ ${#missing_commands[@]} -gt 0 ]]; then
        log_error "Missing required commands: ${missing_commands[*]}"
        echo "❌ Missing required commands:"
        printf "   - %s\n" "${missing_commands[@]}"
        echo ""
        echo "Please install the missing commands and try again."
        return 1
    fi

    log_debug "All required commands are available"
    log_function_exit "validate_required_commands"
    return 0
}

# Validate issue number format
validate_issue_number() {
    local issue_number="$1"

    log_function_entry "validate_issue_number" "$issue_number"

    if [[ -z "$issue_number" ]]; then
        log_error "Issue number cannot be empty"
        return 1
    fi

    if [[ ! "$issue_number" =~ ^[0-9]+$ ]]; then
        log_error "Invalid issue number format: '$issue_number' (must be a positive integer)"
        return 1
    fi

    if [[ "$issue_number" -le 0 ]]; then
        log_error "Issue number must be greater than 0: $issue_number"
        return 1
    fi

    log_debug "Issue number validation passed: $issue_number"
    log_function_exit "validate_issue_number"
    return 0
}

# Validate epic name format
validate_epic_name() {
    local epic_name="$1"

    log_function_entry "validate_epic_name" "$epic_name"

    if [[ -z "$epic_name" ]]; then
        log_error "Epic name cannot be empty"
        return 1
    fi

    # Epic names should be alphanumeric with hyphens and underscores
    if [[ ! "$epic_name" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        log_error "Invalid epic name: '$epic_name' (only letters, numbers, hyphens, and underscores allowed)"
        return 1
    fi

    # Should not start or end with hyphen/underscore
    if [[ "$epic_name" =~ ^[-_] ]] || [[ "$epic_name" =~ [-_]$ ]]; then
        log_error "Epic name cannot start or end with hyphen or underscore: '$epic_name'"
        return 1
    fi

    log_debug "Epic name validation passed: $epic_name"
    log_function_exit "validate_epic_name"
    return 0
}

# Validate file exists and is readable
validate_file_exists() {
    local file_path="$1"
    local description="${2:-file}"

    log_function_entry "validate_file_exists" "$file_path" "$description"

    if [[ ! -f "$file_path" ]]; then
        log_error "$description not found: $file_path"
        return 1
    fi

    if [[ ! -r "$file_path" ]]; then
        log_error "$description is not readable: $file_path"
        return 1
    fi

    log_debug "$description validation passed: $file_path"
    log_function_exit "validate_file_exists"
    return 0
}

# Validate directory exists and is accessible
validate_directory_exists() {
    local dir_path="$1"
    local description="${2:-directory}"

    log_function_entry "validate_directory_exists" "$dir_path" "$description"

    if [[ ! -d "$dir_path" ]]; then
        log_error "$description not found: $dir_path"
        return 1
    fi

    if [[ ! -r "$dir_path" ]] || [[ ! -x "$dir_path" ]]; then
        log_error "$description is not accessible: $dir_path"
        return 1
    fi

    log_debug "$description validation passed: $dir_path"
    log_function_exit "validate_directory_exists"
    return 0
}

# Validate Git repository
validate_git_repository() {
    local repo_path="${1:-.}"

    log_function_entry "validate_git_repository" "$repo_path"

    if [[ ! -d "$repo_path/.git" ]]; then
        log_error "Not a Git repository: $repo_path"
        echo "❌ This is not a Git repository."
        echo "Initialize with: git init"
        return 1
    fi

    # Check if we're in a git repository and can access it
    if ! git -C "$repo_path" status >/dev/null 2>&1; then
        log_error "Cannot access Git repository: $repo_path"
        return 1
    fi

    log_debug "Git repository validation passed: $repo_path"
    log_function_exit "validate_git_repository"
    return 0
}

# Validate working directory is clean (no uncommitted changes)
validate_clean_working_directory() {
    local repo_path="${1:-.}"

    log_function_entry "validate_clean_working_directory" "$repo_path"

    validate_git_repository "$repo_path" || return 1

    if [[ -n "$(git -C "$repo_path" status --porcelain)" ]]; then
        log_error "Working directory has uncommitted changes"
        echo "❌ You have uncommitted changes:"
        git -C "$repo_path" status --short
        echo ""
        echo "Please commit or stash your changes before proceeding:"
        echo "  git add -A && git commit -m 'WIP: save changes'"
        echo "  # or"
        echo "  git stash save 'WIP before operation'"
        return 1
    fi

    log_debug "Working directory is clean"
    log_function_exit "validate_clean_working_directory"
    return 0
}

# Validate epic directory structure
validate_epic_structure() {
    local epic_name="$1"
    local base_dir="${2:-.claude/epics}"

    log_function_entry "validate_epic_structure" "$epic_name" "$base_dir"

    validate_epic_name "$epic_name" || return 1

    local epic_dir="$base_dir/$epic_name"
    validate_directory_exists "$epic_dir" "Epic directory" || return 1

    local epic_file="$epic_dir/epic.md"
    validate_file_exists "$epic_file" "Epic file" || return 1

    # Check if epic has tasks
    local task_count
    task_count=$(find "$epic_dir" -name '[0-9]*.md' -type f | wc -l)

    if [[ "$task_count" -eq 0 ]]; then
        log_warning "Epic has no tasks: $epic_name"
        echo "⚠️ Epic '$epic_name' has no tasks."
        echo "Generate tasks with: /pm:epic-decompose $epic_name"
    fi

    log_debug "Epic structure validation passed: $epic_name"
    log_function_exit "validate_epic_structure"
    return 0
}

# Validate GitHub CLI authentication
validate_github_auth() {
    log_function_entry "validate_github_auth"

    if ! command -v gh >/dev/null 2>&1; then
        log_error "GitHub CLI not found"
        echo "❌ GitHub CLI (gh) is not installed."
        echo "Install from: https://cli.github.com/"
        return 1
    fi

    if ! gh auth status >/dev/null 2>&1; then
        log_error "GitHub CLI not authenticated"
        echo "❌ GitHub CLI not authenticated."
        echo "Login with: gh auth login"
        return 1
    fi

    log_debug "GitHub CLI authentication validated"
    log_function_exit "validate_github_auth"
    return 0
}

# Validate environment variables
validate_environment_variables() {
    local required_vars=("$@")

    log_function_entry "validate_environment_variables" "${required_vars[@]}"

    local missing_vars=()

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done

    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        echo "❌ Missing required environment variables:"
        printf "   - %s\n" "${missing_vars[@]}"
        echo ""
        echo "Please set these variables and try again."
        return 1
    fi

    log_debug "All required environment variables are set"
    log_function_exit "validate_environment_variables"
    return 0
}

# Validate network connectivity
validate_network_connectivity() {
    local host="${1:-github.com}"
    local timeout="${2:-5}"

    log_function_entry "validate_network_connectivity" "$host" "$timeout"

    if ! ping -c 1 -W "$timeout" "$host" >/dev/null 2>&1; then
        log_error "Network connectivity check failed for $host"
        echo "❌ Cannot reach $host"
        echo "Please check your internet connection and try again."
        return 1
    fi

    log_debug "Network connectivity validated for $host"
    log_function_exit "validate_network_connectivity"
    return 0
}

# Validate labels format (comma-separated)
validate_labels() {
    local labels="$1"

    log_function_entry "validate_labels" "$labels"

    if [[ -z "$labels" ]]; then
        log_warning "No labels provided"
        log_function_exit "validate_labels"
        return 0
    fi

    # Split labels by comma and validate each one
    IFS=',' read -ra label_array <<< "$labels"
    for label in "${label_array[@]}"; do
        # Trim whitespace
        label=$(echo "$label" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

        # Validate label format (GitHub allows letters, numbers, spaces, hyphens, underscores)
        if [[ ! "$label" =~ ^[a-zA-Z0-9[:space:]_-]+$ ]]; then
            log_error "Invalid label format: '$label'"
            return 1
        fi
    done

    log_debug "Labels validation passed: $labels"
    log_function_exit "validate_labels"
    return 0
}

# Comprehensive validation for epic sync operation
validate_epic_sync_prerequisites() {
    local epic_name="$1"

    log_function_entry "validate_epic_sync_prerequisites" "$epic_name"

    # Validate inputs
    validate_epic_name "$epic_name" || return 1

    # Validate environment
    validate_required_commands "git" "gh" || return 1
    validate_git_repository || return 1
    validate_github_auth || return 1

    # Validate epic structure
    validate_epic_structure "$epic_name" || return 1

    # Check network connectivity
    validate_network_connectivity "github.com" || return 1

    log_success "All epic sync prerequisites validated"
    log_function_exit "validate_epic_sync_prerequisites"
    return 0
}